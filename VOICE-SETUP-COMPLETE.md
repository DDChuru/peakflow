# Voice-to-Clipboard Setup Complete! 🎉

Your voice transcription tool is now fully installed and globally accessible with Conda!

## ✅ What's Installed

### 1. Miniconda
- Location: `~/miniconda3`
- Initialized in your `.bashrc`

### 2. Conda Environment: `aitools`
- **Voice transcription packages:**
  - openai (Whisper API client)
  - sounddevice (audio recording)
  - soundfile (audio file handling)
  - numpy (audio processing)
  - pyperclip (clipboard integration)
  - python-dotenv (environment variables)

- **Manim (Mathematical Animation Engine):**
  - Full installation with all dependencies
  - Ready for creating mathematical animations
  - Includes ffmpeg, cairo, pango, and all rendering tools

### 3. Global `voice` Command
- Location: `~/.local/bin/voice`
- Accessible from any directory
- Auto-activates conda environment

## 🚀 Final Setup Steps

### 1. Add Your OpenAI API Key

**IMPORTANT:** First revoke the exposed key from earlier, then:

```bash
# Open your bash configuration
nano ~/.bashrc

# Add at the very end (after conda init):
export OPENAI_API_KEY='sk-proj-YOUR-NEW-KEY-HERE'

# Save: Ctrl+O, Enter, Ctrl+X

# Reload your shell
source ~/.bashrc
```

### 2. Install xclip for Clipboard (Linux Only)

```bash
# This requires fixing the IPv4 issue OR using a different mirror
# Option 1: Force IPv4 (recommended)
echo 'Acquire::ForceIPv4 "true";' | sudo tee /etc/apt/apt.conf.d/99force-ipv4
sudo apt-get update
sudo apt-get install xclip

# Option 2: If no sudo, clipboard won't work but transcription will still print
```

### 3. Reload Your Shell

```bash
# Either restart your terminal OR run:
source ~/.bashrc
```

## 🎯 Usage

### Voice Transcription

```bash
# From anywhere, just type:
voice

# Speak your message
# Wait 4 seconds of silence (or press Ctrl+C)
# Transcription automatically copies to clipboard
# Paste anywhere with Ctrl+V
```

### Example Workflow

```bash
# Navigate to any project
cd ~/my-project

# Record a coding task
voice
# Speak: "Create a React component for user authentication with email and password fields"
# [Wait 4s or press Ctrl+C]

# Paste into your AI coding tool
# Ctrl+V in Claude Code, Cursor, Aider, etc.
```

### Using Manim

```bash
# Activate the environment first
conda activate aitools

# Create a Python file with manim code
# Then render:
manim -pql my_animation.py MyScene
```

## 💰 Costs

- **OpenAI Whisper API**: $0.006 per minute
  - 30-second recording: ~$0.003
  - 2-minute recording: ~$0.012
  - Very affordable for daily use!

- **Miniconda**: Free
- **All packages**: Free

## 📁 File Locations

```
~/miniconda3/                    # Conda installation
  └── envs/aitools/              # Your environment
      ├── bin/python             # Python 3.11
      └── lib/python3.11/...     # All packages

~/.local/bin/voice               # Global voice command
~/.bashrc                        # Conda init + API key

# Original files (for reference):
~/Documents/projects/vercel/peakflow/
  ├── voice-to-clipboard.py      # Original Python script
  ├── voice-requirements.txt     # Pip requirements
  ├── VOICE-TRANSCRIPTION-SETUP.md
  └── VOICE-SETUP-COMPLETE.md    # This file
```

## 🔧 Conda Environment Management

```bash
# List all environments
conda env list

# Activate aitools environment
conda activate aitools

# Deactivate current environment
conda deactivate

# Install additional packages
conda activate aitools
conda install -c conda-forge package-name
# OR
pip install package-name

# Update all packages
conda update --all

# Remove environment (if needed)
conda env remove -n aitools
```

## 🐛 Troubleshooting

### "voice: command not found"
```bash
# Reload your shell
source ~/.bashrc

# Check if .local/bin is in PATH
echo $PATH | grep ".local/bin"

# If not, add to ~/.bashrc:
export PATH="$HOME/.local/bin:$PATH"
```

### "OPENAI_API_KEY not found"
```bash
# Check if it's set
echo $OPENAI_API_KEY

# If empty, add to ~/.bashrc as shown above
nano ~/.bashrc
# Add: export OPENAI_API_KEY='your-key'
source ~/.bashrc
```

### "Clipboard error" (Linux)
```bash
# Install xclip
sudo apt-get install xclip

# If that fails due to IPv6 issues:
echo 'Acquire::ForceIPv4 "true";' | sudo tee /etc/apt/apt.conf.d/99force-ipv4
sudo apt-get update
sudo apt-get install xclip
```

### Microphone issues
```bash
# Activate environment
conda activate aitools

# List available audio devices
python -c "import sounddevice as sd; print(sd.query_devices())"

# If no devices found, check system audio settings
```

### Conda issues
```bash
# If conda command not found after install:
source ~/miniconda3/etc/profile.d/conda.sh

# Or add to ~/.bashrc:
echo 'source ~/miniconda3/etc/profile.d/conda.sh' >> ~/.bashrc
```

## 🎨 Manim Quick Start

```bash
# Activate environment
conda activate aitools

# Create a simple animation
cat > hello_manim.py << 'EOF'
from manim import *

class HelloManim(Scene):
    def construct(self):
        text = Text("Hello, Manim!")
        self.play(Write(text))
        self.wait()
EOF

# Render it
manim -pql hello_manim.py HelloManim

# Output video will open automatically
```

## 💡 Pro Tips

### 1. Quick Alias
Add to `~/.bashrc` for even faster access:
```bash
alias v="voice"  # Just type 'v' to record
```

### 2. Git Commit Messages
```bash
voice
# Speak: "Fix authentication bug in login component"
git commit -m "$(xclip -o -selection clipboard)"
```

### 3. Multi-line Prompts
The transcription preserves natural speech, so you can:
```bash
voice
# Speak: "Create a function that validates email addresses,
# checks for common typos, and returns a helpful error message"
```

### 4. Integrate with AI Tools
```bash
# Aider
voice
aider
# Paste with Ctrl+V

# GitHub Copilot CLI
voice
gh copilot suggest "$(xclip -o -selection clipboard)"

# Claude Code, Cursor, Windsurf
# Just paste with Ctrl+V in the chat
```

## 🔒 Security Reminders

1. ✅ **Never commit API keys** to git
2. ✅ **Never share API keys** in chat/screenshots
3. ✅ **Revoke exposed keys immediately** at https://platform.openai.com/api-keys
4. ✅ **Keep ~/.bashrc permissions secure**: `chmod 600 ~/.bashrc`
5. ✅ **Monitor OpenAI usage** at https://platform.openai.com/usage

## 📚 Additional Resources

- **OpenAI Whisper API Docs**: https://platform.openai.com/docs/guides/speech-to-text
- **Manim Docs**: https://docs.manim.community/
- **Conda Cheat Sheet**: https://docs.conda.io/projects/conda/en/latest/user-guide/cheatsheet.html

## 🎉 You're All Set!

Now you can use `voice` from **any directory** on your system!

```bash
cd ~/anywhere
voice
# Speak, wait 4s, paste with Ctrl+V
```

Plus you have a full Python environment ready for manim animations and any other data science/AI tools you need.

Happy voice coding! 🎤✨
