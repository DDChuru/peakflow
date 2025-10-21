# Global Voice-to-Clipboard Setup

Your voice transcription tool is now installed globally! 🎉

## ✅ What's Been Done

- ✅ Script copied to `~/.local/bin/voice`
- ✅ Made executable
- ✅ `~/.local/bin` is in your PATH

## 🔧 Final Setup Steps

### 1. Install Python Dependencies Globally

```bash
pip install openai sounddevice soundfile numpy pyperclip python-dotenv
```

**For Linux** (install audio system libraries):
```bash
sudo apt-get install portaudio19-dev xclip
```

### 2. Add Your OpenAI API Key to ~/.bashrc

**IMPORTANT**: After revoking the old key and creating a new one:

```bash
# Open your bash configuration
nano ~/.bashrc

# Add this line at the end (replace with your NEW key):
export OPENAI_API_KEY='sk-proj-YOUR-NEW-KEY-HERE'

# Save: Ctrl+O, Enter, Ctrl+X

# Reload your shell configuration
source ~/.bashrc
```

### 3. Test It!

```bash
# Just type 'voice' from anywhere:
voice

# Speak your message
# Wait 4 seconds of silence (or press Ctrl+C)
# Transcription automatically copies to clipboard
# Paste anywhere with Ctrl+V
```

## 🚀 Usage Examples

### Use with Claude Code
```bash
voice
# Speak: "Add error handling to the user authentication function"
# Paste into Claude Code with Ctrl+V
```

### Use with Git Commits
```bash
voice
# Speak: "Fix login validation bug and improve error messages"
git commit -m "$(xclip -o -selection clipboard)"
```

### Use with Any AI Tool
```bash
voice
# Speak your prompt
# Paste into any chat interface, terminal, or editor
```

## 🎯 Pro Tips

### Create an Even Shorter Alias (Optional)

Add to ~/.bashrc:
```bash
alias v="voice"  # Super quick!
```

Then just type `v` to start recording!

### Integration with AI CLI Tools

**Aider**:
```bash
voice
aider
# Paste with Ctrl+V
```

**GitHub Copilot CLI**:
```bash
voice
gh copilot suggest "$(xclip -o -selection clipboard)"
```

## 🔒 Security Reminders

1. ✅ **Never commit API keys to git**
2. ✅ **Never share API keys in chat/screenshots**
3. ✅ **Revoke exposed keys immediately** at https://platform.openai.com/api-keys
4. ✅ **Keep ~/.bashrc permissions secure**: `chmod 600 ~/.bashrc`

## 💰 Costs

OpenAI Whisper API: **$0.006 per minute**
- 30-second recording: ~$0.003
- 2-minute recording: ~$0.012
- Very affordable for daily use!

## 📁 Files Location

- **Script**: `~/.local/bin/voice`
- **Original**: `/home/dachu/Documents/projects/vercel/peakflow/voice-to-clipboard.py`
- **Dependencies**: `voice-requirements.txt` (for reference)

## 🐛 Troubleshooting

### "voice: command not found"
```bash
# Reload your shell
source ~/.bashrc

# Or restart your terminal
```

### "OPENAI_API_KEY not found"
```bash
# Check if it's set
echo $OPENAI_API_KEY

# If empty, add to ~/.bashrc as shown above
```

### Microphone issues
```bash
# List available audio devices
python3 -c "import sounddevice as sd; print(sd.query_devices())"
```

## 🎉 You're All Set!

Now you can use `voice` from **any directory** on your system!

```bash
cd ~/projects/my-app
voice
# Transcribe and paste into your AI tool
```

Happy voice coding! 🎤✨
