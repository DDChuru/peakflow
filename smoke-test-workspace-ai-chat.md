# 🧪 Smoke Test: Workspace AI Chat

**Feature**: General-purpose AI accounting assistant at workspace level

**Implementation**: 2025-10-12

---

## 🎯 Quick Verification (3 minutes)

### Step 1: Navigate to AI Chat
1. Log in to the application
2. Select a company workspace
3. Look for **"AI Assistant"** in left navigation
4. Click on "AI Assistant" (should have "NEW" badge)

**Expected**:
- ✅ Page loads: `/workspace/[companyId]/ai-chat`
- ✅ Chat interface appears with welcome message
- ✅ Header shows: "🤖 AI Accounting Assistant"
- ✅ Blue info banner explains AI capabilities
- ✅ Input field is focused and ready

---

### Step 2: Send First Message
1. Type: "Hello, what can you help me with?"
2. Press Enter

**Expected**:
- ✅ Message appears on right side (user message, indigo background)
- ✅ "AI is thinking..." loading indicator appears
- ✅ AI response appears on left side within 2-3 seconds
- ✅ Response includes capabilities list with emojis
- ✅ Both messages have timestamps

---

### Step 3: Test Chart of Accounts Query
1. Type: "What GL account should I use for utilities?"
2. Press Enter

**Expected**:
- ✅ AI suggests utilities expense account
- ✅ Provides account code (e.g., 6100)
- ✅ Explains what the account is for
- ✅ Mentions debit/credit treatment

---

### Step 4: Test Entity Name Accuracy
1. Type: "Find customer Advanced Cleaning Services"
2. Press Enter

**Expected**:
- ✅ AI uses EXACT name "Advanced Cleaning Services"
- ✅ Does NOT abbreviate to "Advanced Cleaning Ops" or similar
- ✅ Indicates it searched debtors ledger
- ✅ Shows confidence/match results if found

---

### Step 5: Test Conversation History
1. Type: "What's account 1200?"
2. Wait for response
3. Type: "Can you give an example?"
4. Press Enter

**Expected**:
- ✅ AI remembers we're talking about account 1200
- ✅ Provides example related to Accounts Receivable
- ✅ Doesn't ask "Which account?" (uses context)
- ✅ Builds on previous explanation

---

### Step 6: Test Clear Chat
1. Click "Clear Chat" button in header
2. Verify chat resets

**Expected**:
- ✅ Toast notification: "Chat history cleared"
- ✅ All messages disappear
- ✅ New welcome message appears
- ✅ Input field remains focused

---

## ✅ Pass Criteria

The feature is working correctly if ALL of these are true:

- ✅ Navigation shows "AI Assistant" with NEW badge
- ✅ Chat page loads without errors
- ✅ Welcome message displays on page load
- ✅ Can send and receive messages
- ✅ AI responses appear within 3 seconds
- ✅ Conversation history is maintained
- ✅ AI uses exact entity names (no paraphrasing)
- ✅ AI provides accounting guidance when asked
- ✅ Clear chat functionality works
- ✅ Keyboard shortcuts work (Enter to send, Shift+Enter for new line)

---

## 🔍 Detailed Test Scenarios

### Scenario 1: Accounting Tutor

**Test**: Ask AI to explain an accounting concept

**Steps**:
1. Type: "Explain the difference between AR and Revenue"
2. Send message

**Expected**:
- ✅ Clear explanation in simple terms
- ✅ Uses South African accounting context
- ✅ Includes examples
- ✅ Explains when to use each account
- ✅ References accounting principles

---

### Scenario 2: GL Account Lookup

**Test**: Ask about specific GL accounts

**Steps**:
1. Type: "What are my current liabilities accounts?"
2. Send message

**Expected**:
- ✅ Lists current liability accounts from Chart of Accounts
- ✅ Shows account codes and names
- ✅ Explains what each account is for
- ✅ Uses bullet points for clarity

---

### Scenario 3: Entity Search (Customer)

**Test**: Search for a customer by name

**Steps**:
1. Type: "Find customer [customer name]"
2. Send message

**Expected**:
- ✅ AI searches debtors ledger
- ✅ Uses EXACT customer name from database
- ✅ Shows match confidence if found
- ✅ Lists outstanding invoices
- ✅ Shows total outstanding balance

---

### Scenario 4: Entity Search (Supplier)

**Test**: Search for a supplier by name

**Steps**:
1. Type: "Find supplier Eskom"
2. Send message

**Expected**:
- ✅ AI searches creditors ledger
- ✅ Uses exact supplier name
- ✅ Shows creditor type (e.g., utility)
- ✅ Lists outstanding bills if any
- ✅ Provides context about supplier

---

### Scenario 5: Multi-Turn Conversation

**Test**: Have a back-and-forth conversation

**Steps**:
1. Ask: "What's the best way to record VAT?"
2. Wait for response
3. Follow up: "Can you show me an example?"
4. Wait for response
5. Ask: "What if I pay VAT quarterly?"

**Expected**:
- ✅ AI maintains context across all questions
- ✅ Answers build on previous responses
- ✅ No repeated explanations
- ✅ Conversation flows naturally

---

### Scenario 6: Keyboard Shortcuts

**Test**: Verify keyboard shortcuts work

**Steps**:
1. Type a message
2. Press Enter (should send)
3. Type another message
4. Press Shift+Enter (should create new line)
5. Type more text
6. Press Enter (should send multi-line message)

**Expected**:
- ✅ Enter sends message
- ✅ Shift+Enter creates new line
- ✅ Multi-line messages preserve formatting
- ✅ Input clears after sending

---

### Scenario 7: Long Conversation Scroll

**Test**: Verify scroll behavior with many messages

**Steps**:
1. Send 10+ messages back and forth with AI
2. Observe scroll behavior

**Expected**:
- ✅ Chat auto-scrolls to latest message
- ✅ Scroll bar appears when needed
- ✅ Can manually scroll up to see old messages
- ✅ New messages always appear at bottom
- ✅ Scroll position maintained when typing

---

### Scenario 8: Error Handling

**Test**: Test AI error scenarios

**Setup**: Remove `ANTHROPIC_API_KEY` from `.env.local` and restart server

**Steps**:
1. Try to send a message

**Expected**:
- ✅ Toast error: "AI Assistant not configured..."
- ✅ Error message appears in chat
- ✅ Suggests contacting administrator
- ✅ Input remains usable (not frozen)
- ✅ Can try again after fixing

**Cleanup**: Restore API key and restart server

---

## 🐛 Common Issues

### Issue: "AI Assistant" not in navigation

**Possible Causes**:
- Not in a company workspace
- Page cache issue

**Fix**:
1. Ensure you're in `/workspace/[companyId]` routes
2. Hard refresh: Ctrl+Shift+R (Windows/Linux) or Cmd+Shift+R (Mac)
3. Check console for errors

---

### Issue: Chat page shows loading spinner forever

**Possible Causes**:
- Company data not loading
- Firestore permissions issue

**Fix**:
1. Check browser console for errors
2. Verify user has access to company
3. Check Firestore rules allow reading company data

---

### Issue: AI responses not appearing

**Possible Causes**:
- Missing/invalid `ANTHROPIC_API_KEY`
- Network connectivity issue
- API rate limit

**Fix**:
1. Check `.env.local` for API key
2. Check browser console for API errors
3. Verify API key is valid
4. Check network tab for failed requests

---

### Issue: AI gives generic answers (doesn't use company data)

**Possible Cause**: Chart of Accounts not loading

**Fix**:
1. Check console logs for COA loading errors
2. Verify `chartOfAccountsService.getAccounts(companyId)` succeeds
3. Check Firestore rules allow reading accounts

---

### Issue: AI paraphrases entity names

**This Should NOT Happen** - Report immediately if it does

**Example of Bug**:
- Database: "Advanced Cleaning Services"
- AI says: "Advanced Cleaning Ops" ❌

**Expected**:
- AI uses: "Advanced Cleaning Services" ✅

**If This Happens**:
1. Take screenshot
2. Note exact query and response
3. Check system prompt has "USE EXACT NAMES" instruction
4. Report as AI behavior issue

---

## 🎯 User Acceptance Criteria

Feature is production-ready when:

- ✅ Navigation link works on all screen sizes
- ✅ Chat loads within 1 second
- ✅ AI responds within 3 seconds (95% of queries)
- ✅ Conversation history maintained throughout session
- ✅ Entity names used exactly as in database
- ✅ Accounting explanations are accurate
- ✅ GL account suggestions are appropriate
- ✅ Error handling is graceful with helpful messages
- ✅ Clear chat resets conversation successfully
- ✅ Keyboard shortcuts work as documented
- ✅ Mobile responsive (chat works on phone/tablet)

---

## 📞 Related Documentation

- `/WORKSPACE-AI-CHAT-IMPLEMENTATION.md` — Full implementation details
- `/smoke-test-ai-agentic-capabilities.md` — Entity matching transparency
- `/AI-FALLBACK-MANUAL-MAPPING-FIX.md` — AI chat in manual mapping
- `/BATCH-MAPPING-FEATURE.md` — Batch mapping with AI

---

## 🎉 Success!

When all tests pass, users have:
- ✅ A general-purpose AI accounting assistant
- ✅ Real-time access to company financial data
- ✅ Accounting tutor for learning
- ✅ Entity search capabilities
- ✅ Foundation for future AI-powered features

**The workspace AI chat is your one-stop shop for all accounting questions!** 🚀
