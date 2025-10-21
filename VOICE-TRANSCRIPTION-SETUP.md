# Voice-to-Clipboard Transcription Setup

Record your voice, auto-transcribe with OpenAI Whisper API, and paste anywhere!

## Features

✅ **Auto-stop after 4 seconds of silence**
✅ **Manual stop with Ctrl+C**
✅ **Automatic clipboard copy**
✅ **Real-time recording indicator**
✅ **Silence detection visualization**

## Prerequisites

1. **Python 3.8+** installed
2. **OpenAI API Key** ([Get one here](https://platform.openai.com/api-keys))
3. **Microphone** connected to your system

## Installation

### Step 1: Install Python Dependencies

```bash
pip install -r voice-requirements.txt
```

**Note for Linux users**: You may need to install PortAudio for sounddevice:
```bash
# Ubuntu/Debian
sudo apt-get install portaudio19-dev python3-pyaudio

# Fedora
sudo dnf install portaudio-devel

# macOS (via Homebrew)
brew install portaudio
```

### Step 2: Set Up OpenAI API Key

Create a `.env` file in the project root (or add to existing):

```bash
# Add this line to your .env file
OPENAI_API_KEY=sk-your-actual-api-key-here
```

**Alternative**: Set as environment variable:
```bash
export OPENAI_API_KEY='sk-your-actual-api-key-here'
```

### Step 3: Make Script Executable (Optional)

```bash
chmod +x voice-to-clipboard.py
```

## Usage

### Basic Usage

```bash
python voice-to-clipboard.py
```

### What Happens

1. 🎤 Recording starts immediately
2. 💬 Speak your message
3. 🔇 Script auto-stops after 4 seconds of silence
4. 🔄 Transcription happens via OpenAI Whisper API
5. 📋 Text is copied to your clipboard
6. ✨ Paste anywhere with Ctrl+V!

### Manual Stop

Press **Ctrl+C** at any time to stop recording early.

## Integration with AI Coding CLI Tools

Once the transcription is on your clipboard, you can paste it into:

### Claude Code
```bash
# After running voice-to-clipboard.py, paste with Ctrl+V
# or use shell substitution (if your clipboard supports it)
```

### GitHub Copilot CLI
```bash
# Paste directly into prompts
gh copilot suggest "$(xclip -o -selection clipboard)"
```

### Cursor AI
Just paste (Ctrl+V) into the chat interface

### Aider
```bash
# Paste into aider prompt
aider
# Then Ctrl+V to paste your transcribed prompt
```

## Cost Estimate

OpenAI Whisper API pricing: **$0.006 per minute** of audio

Examples:
- 30 seconds: $0.003
- 2 minutes: $0.012
- 10 minutes: $0.06

Very affordable for regular use!

## Troubleshooting

### "No module named 'sounddevice'"
```bash
pip install sounddevice soundfile numpy
```

### "OPENAI_API_KEY not found"
Make sure your `.env` file exists and contains:
```
OPENAI_API_KEY=sk-...
```

### Microphone not detected
```bash
# Test available audio devices
python -c "import sounddevice as sd; print(sd.query_devices())"
```

### "Clipboard error" on Linux
Install xclip or xsel:
```bash
sudo apt-get install xclip  # Ubuntu/Debian
sudo dnf install xclip      # Fedora
```

## Advanced Configuration

Edit `voice-to-clipboard.py` to customize:

```python
SILENCE_THRESHOLD = 0.01  # Lower = more sensitive to silence
SILENCE_DURATION = 4.0    # Seconds of silence before auto-stop
SAMPLE_RATE = 16000       # Audio quality (16kHz is optimal for Whisper)
```

## Example Workflow

```bash
# 1. Start recording
python voice-to-clipboard.py

# 2. Speak your coding task
"Create a React component that displays a user profile card with avatar, name, and bio"

# 3. Wait 4 seconds (auto-stops)

# 4. Script transcribes and copies to clipboard

# 5. Open your AI coding tool and paste
# Ctrl+V
```

## Files Created

- `voice-to-clipboard.py` - Main script
- `voice-requirements.txt` - Python dependencies
- `VOICE-TRANSCRIPTION-SETUP.md` - This guide

## Next Steps

Consider creating a shell alias for quick access:

```bash
# Add to ~/.bashrc or ~/.zshrc
alias voice="cd /home/dachu/Documents/projects/vercel/peakflow && python voice-to-clipboard.py"

# Then use anywhere:
voice
```

Happy voice coding! 🎤✨
