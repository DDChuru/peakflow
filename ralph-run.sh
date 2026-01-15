#!/bin/bash

# =============================================================================
# Ralph Loop v2 - External Orchestrator
# =============================================================================
# Runs Claude in a loop with fresh sessions for each task.
# Provides true context isolation and unattended execution.
#
# Usage:
#   ./ralph-run.sh                    # Run in foreground
#   ./ralph-run.sh --background       # Run in background (logs to file)
#   ./ralph-run.sh --status           # Check current status
#   ./ralph-run.sh --cancel           # Cancel the loop
#
# Prerequisites:
#   - Run /ralph-v2 first to create the plan
#   - State file: .claude/ralph-v2-state.json
# =============================================================================

set -euo pipefail

# Configuration
STATE_FILE=".claude/ralph-v2-state.json"
LOG_FILE=".claude/ralph-v2.log"
PID_FILE=".claude/ralph-v2.pid"
MAX_RETRIES=3
RETRY_DELAY=5
AUTO_COMMIT=${RALPH_AUTO_COMMIT:-true}

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# -----------------------------------------------------------------------------
# Helper Functions
# -----------------------------------------------------------------------------

log() {
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "[$timestamp] $1" | tee -a "$LOG_FILE"
}

log_header() {
    echo ""
    echo "================================================================================"
    echo -e "${PURPLE}$1${NC}"
    echo "================================================================================"
    echo ""
}

check_state_file() {
    if [[ ! -f "$STATE_FILE" ]]; then
        echo -e "${RED}Error: State file not found: $STATE_FILE${NC}"
        echo ""
        echo "Run /ralph-v2 first to create a plan."
        exit 1
    fi
}

get_status() {
    jq -r '.status' "$STATE_FILE"
}

get_current_task() {
    jq -r '.execution.current_task_id // empty' "$STATE_FILE"
}

get_task_info() {
    local task_id=$1
    jq -r --argjson id "$task_id" '.plan.tasks[] | select(.id == $id)' "$STATE_FILE"
}

get_next_pending_task() {
    jq -r '[.plan.tasks[] | select(.status == "pending")][0].id // empty' "$STATE_FILE"
}

get_metrics() {
    jq -r '.metrics | "Completed: \(.tasks_completed) | Failed: \(.tasks_failed)"' "$STATE_FILE"
}

get_total_tasks() {
    jq -r '.plan.tasks | length' "$STATE_FILE"
}

update_task_status() {
    local task_id=$1
    local status=$2
    local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

    jq --argjson id "$task_id" \
       --arg status "$status" \
       --arg ts "$timestamp" \
       '(.plan.tasks[] | select(.id == $id)).status = $status | .updated_at = $ts' \
       "$STATE_FILE" > "${STATE_FILE}.tmp"
    mv "${STATE_FILE}.tmp" "$STATE_FILE"
}

update_current_task() {
    local task_id=$1
    local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

    jq --argjson id "$task_id" \
       --arg ts "$timestamp" \
       '.execution.current_task_id = $id | .updated_at = $ts' \
       "$STATE_FILE" > "${STATE_FILE}.tmp"
    mv "${STATE_FILE}.tmp" "$STATE_FILE"
}

increment_completed() {
    jq '.metrics.tasks_completed += 1 | .metrics.estimated_remaining -= 1' \
       "$STATE_FILE" > "${STATE_FILE}.tmp"
    mv "${STATE_FILE}.tmp" "$STATE_FILE"
}

increment_failed() {
    jq '.metrics.tasks_failed += 1' "$STATE_FILE" > "${STATE_FILE}.tmp"
    mv "${STATE_FILE}.tmp" "$STATE_FILE"
}

increment_iteration() {
    jq '.execution.total_iterations += 1' "$STATE_FILE" > "${STATE_FILE}.tmp"
    mv "${STATE_FILE}.tmp" "$STATE_FILE"
}

set_loop_status() {
    local status=$1
    local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

    jq --arg status "$status" \
       --arg ts "$timestamp" \
       '.status = $status | .updated_at = $ts' \
       "$STATE_FILE" > "${STATE_FILE}.tmp"
    mv "${STATE_FILE}.tmp" "$STATE_FILE"
}

auto_commit_changes() {
    if [[ "$AUTO_COMMIT" != "true" ]]; then
        return 0
    fi

    # Check if there are changes to commit
    if git diff --quiet && git diff --cached --quiet; then
        log "No changes to commit"
        return 0
    fi

    local task_title=$(jq -r --argjson id "$1" '.plan.tasks[] | select(.id == $id) | .title' "$STATE_FILE")

    git add -A
    git commit -m "ralph: $task_title

Task $1 completed by Ralph Loop v2 external orchestrator.

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>" || true

    log "${GREEN}Auto-committed changes for task $1${NC}"
}

# -----------------------------------------------------------------------------
# Command Handlers
# -----------------------------------------------------------------------------

show_status() {
    check_state_file

    log_header "RALPH LOOP v2 - STATUS"

    local status=$(get_status)
    local current=$(get_current_task)
    local total=$(get_total_tasks)
    local metrics=$(get_metrics)
    local iterations=$(jq -r '.execution.total_iterations' "$STATE_FILE")

    echo -e "Status: ${BLUE}$status${NC}"
    echo -e "Current Task: ${YELLOW}$current${NC}"
    echo -e "Progress: $metrics / $total total"
    echo -e "Iterations: $iterations"
    echo ""

    echo "Tasks:"
    jq -r '.plan.tasks[] | "  [\(.status | if . == "completed" then "✓" elif . == "in_progress" then "→" elif . == "failed" then "✗" else " " end)] \(.id). \(.title)"' "$STATE_FILE"

    echo ""

    # Check if running in background
    if [[ -f "$PID_FILE" ]]; then
        local pid=$(cat "$PID_FILE")
        if ps -p "$pid" > /dev/null 2>&1; then
            echo -e "${GREEN}Running in background (PID: $pid)${NC}"
        else
            echo -e "${YELLOW}PID file exists but process not running${NC}"
            rm -f "$PID_FILE"
        fi
    fi
}

cancel_loop() {
    check_state_file

    # Kill background process if running
    if [[ -f "$PID_FILE" ]]; then
        local pid=$(cat "$PID_FILE")
        if ps -p "$pid" > /dev/null 2>&1; then
            kill "$pid" 2>/dev/null || true
            log "${YELLOW}Killed background process (PID: $pid)${NC}"
        fi
        rm -f "$PID_FILE"
    fi

    set_loop_status "cancelled"
    log "${RED}Ralph Loop cancelled${NC}"
    show_status
}

run_background() {
    check_state_file

    if [[ -f "$PID_FILE" ]]; then
        local pid=$(cat "$PID_FILE")
        if ps -p "$pid" > /dev/null 2>&1; then
            echo -e "${YELLOW}Already running in background (PID: $pid)${NC}"
            echo "Use --status to check progress or --cancel to stop"
            exit 1
        fi
    fi

    log_header "RALPH LOOP v2 - STARTING BACKGROUND"
    echo "Logs: $LOG_FILE"
    echo "Status: ./ralph-run.sh --status"
    echo "Cancel: ./ralph-run.sh --cancel"
    echo ""

    # Start in background
    nohup "$0" >> "$LOG_FILE" 2>&1 &
    local pid=$!
    echo "$pid" > "$PID_FILE"

    echo -e "${GREEN}Started in background (PID: $pid)${NC}"
}

# -----------------------------------------------------------------------------
# Main Execution Loop
# -----------------------------------------------------------------------------

execute_task() {
    local task_id=$1
    local task_info=$(get_task_info "$task_id")
    local task_title=$(echo "$task_info" | jq -r '.title')
    local task_desc=$(echo "$task_info" | jq -r '.description')
    local agent_type=$(echo "$task_info" | jq -r '.agent_type // "code-implementation"')

    log_header "EXECUTING TASK $task_id: $task_title"
    log "Agent: $agent_type"
    log "Description: $task_desc"

    # Mark task as in progress
    update_task_status "$task_id" "in_progress"
    update_current_task "$task_id"
    increment_iteration

    # Build the prompt for Claude
    local prompt="You are executing a task from Ralph Loop v2.

STATE FILE: $STATE_FILE

CURRENT TASK:
- ID: $task_id
- Title: $task_title
- Description: $task_desc
- Agent Type: $agent_type

INSTRUCTIONS:
1. Use the Task tool to spawn a '$agent_type' subagent with the task description
2. Wait for the subagent to complete
3. Report success or failure

After the subagent completes, update the state file:
- If SUCCESS: Mark task as completed in $STATE_FILE
- If FAILED: Mark task as failed in $STATE_FILE

Use jq to update the state file. Example:
jq '(.plan.tasks[] | select(.id == $task_id)).status = \"completed\"' $STATE_FILE > tmp && mv tmp $STATE_FILE

Be concise. Execute the task and update state."

    # Run Claude with fresh session
    # --dangerously-skip-permissions: Required for unattended execution (skips tool permission prompts)
    # --print: Non-interactive mode, exits after completing the prompt
    local retries=0
    local success=false

    while [[ $retries -lt $MAX_RETRIES ]]; do
        log "Attempt $((retries + 1)) of $MAX_RETRIES"

        if claude --dangerously-skip-permissions --print "$prompt" 2>&1 | tee -a "$LOG_FILE"; then
            success=true
            break
        else
            retries=$((retries + 1))
            if [[ $retries -lt $MAX_RETRIES ]]; then
                log "${YELLOW}Retrying in ${RETRY_DELAY}s...${NC}"
                sleep "$RETRY_DELAY"
            fi
        fi
    done

    # Check task status after execution
    local task_status=$(jq -r --argjson id "$task_id" '.plan.tasks[] | select(.id == $id) | .status' "$STATE_FILE")

    if [[ "$task_status" == "completed" ]]; then
        log "${GREEN}Task $task_id completed successfully${NC}"
        increment_completed
        auto_commit_changes "$task_id"
        return 0
    elif [[ "$task_status" == "failed" ]]; then
        log "${RED}Task $task_id failed${NC}"
        increment_failed
        return 1
    else
        # Claude didn't update status - assume failure
        log "${RED}Task $task_id status unclear, marking as failed${NC}"
        update_task_status "$task_id" "failed"
        increment_failed
        return 1
    fi
}

run_loop() {
    check_state_file

    local status=$(get_status)

    if [[ "$status" == "completed" ]]; then
        log "${GREEN}All tasks already completed!${NC}"
        show_status
        exit 0
    fi

    if [[ "$status" == "cancelled" ]]; then
        log "${YELLOW}Loop was cancelled. Reset status to 'executing' to continue.${NC}"
        exit 1
    fi

    # Set status to executing
    set_loop_status "executing"

    log_header "RALPH LOOP v2 - EXTERNAL ORCHESTRATOR"
    log "Starting execution loop..."
    log "Auto-commit: $AUTO_COMMIT"

    # Main loop
    while true; do
        # Get next pending task
        local next_task=$(get_next_pending_task)

        if [[ -z "$next_task" ]]; then
            # No more pending tasks
            set_loop_status "completed"
            log_header "ALL TASKS COMPLETED!"
            show_status

            # Clean up PID file
            rm -f "$PID_FILE"
            exit 0
        fi

        # Execute the task
        if ! execute_task "$next_task"; then
            log "${YELLOW}Task failed, continuing to next...${NC}"
        fi

        # Small delay between tasks
        sleep 2
    done
}

# -----------------------------------------------------------------------------
# Entry Point
# -----------------------------------------------------------------------------

case "${1:-}" in
    --status|-s)
        show_status
        ;;
    --cancel|-c)
        cancel_loop
        ;;
    --background|-b)
        run_background
        ;;
    --help|-h)
        echo "Ralph Loop v2 - External Orchestrator"
        echo ""
        echo "Usage:"
        echo "  $0                  Run in foreground"
        echo "  $0 --background     Run in background"
        echo "  $0 --status         Check current status"
        echo "  $0 --cancel         Cancel the loop"
        echo "  $0 --help           Show this help"
        echo ""
        echo "Environment:"
        echo "  RALPH_AUTO_COMMIT=true|false   Auto-commit after each task (default: true)"
        echo ""
        echo "Prerequisites:"
        echo "  Run /ralph-v2 first to create the execution plan"
        echo ""
        echo "Note:"
        echo "  Uses --dangerously-skip-permissions for unattended execution."
        echo "  This allows Claude to use tools without interactive approval."
        ;;
    *)
        run_loop
        ;;
esac
