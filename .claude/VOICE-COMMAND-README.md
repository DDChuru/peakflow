# Voice-to-Text Integration for Claude Code

## Overview
Voice-to-text transcription has been integrated into Claude Code using custom slash commands. You can now dictate text instead of typing it, and Claude will transcribe and use it in your conversations.

## Available Commands

### `/voice` - Full Voice Transcription
Starts the voice recording and transcription process.

**Usage:**
```
/voice
```

### `/v` - Quick Voice Shortcut
Same as `/voice` but shorter to type.

**Usage:**
```
/v
```

## How It Works

1. **Type the command**: Enter `/voice` or `/v` in the Claude Code chat
2. **Recording starts**: The voice tool begins recording automatically
3. **Speak your message**: Speak clearly into your microphone
4. **Auto-stop**: Recording stops after 4 seconds of silence (or press Ctrl+C to stop manually)
5. **Transcription**: OpenAI Whisper API transcribes your speech
6. **Result**: Claude presents the transcribed text and asks what to do with it

## Technical Details

### Backend Tool
- **Location**: `~/.local/bin/voice`
- **Script**: `~/.local/bin/voice-transcribe.py`
- **API**: OpenAI Whisper API
- **Environment**: Conda environment `aitools`
- **Config**: `~/.voice-config` (API key storage)

### Recording Settings
- **Sample Rate**: 48kHz (hardware) → 16kHz (Whisper)
- **Channels**: Stereo (converted to mono)
- **Auto-stop**: 4 seconds of silence
- **Silence Threshold**: 0.03 RMS amplitude

### Requirements
- OpenAI API key in `OPENAI_API_KEY` environment variable or `~/.voice-config`
- Conda environment `aitools` with required packages:
  - `openai`
  - `numpy`
  - `soundfile`
  - `pyperclip`
  - `scipy`
  - `python-dotenv`
- Audio recording tool: `arecord` (ALSA/PipeWire compatible)

## Example Workflow

```
You: /voice
[Claude runs the voice command]
[You speak: "Please add a new function called calculateTax that takes a price and returns the price with 10% tax added"]
[Recording stops after silence]
[Transcription completes]

Claude: Here's your transcribed text:

"Please add a new function called calculateTax that takes a price and returns the price with 10% tax added"

What would you like me to do with this transcription?

You: Implement it
[Claude proceeds to implement the function]
```

## Troubleshooting

### Command Not Found
If `/voice` doesn't work:
1. Verify the command file exists: `ls .claude/commands/voice.md`
2. Restart Claude Code to pick up new commands

### Voice Tool Issues
If recording fails:
1. Check the voice tool: `which voice`
2. Test manually: `voice`
3. Verify conda environment: `conda activate aitools`
4. Check API key: `echo $OPENAI_API_KEY`

### No Audio Recorded
- Check microphone permissions
- Verify PipeWire/PulseAudio is running: `pactl info`
- Test microphone: `arecord -f cd -d 5 test.wav && aplay test.wav`

## Files Created

- [.claude/commands/voice.md](.claude/commands/voice.md) - Full voice command
- [.claude/commands/v.md](.claude/commands/v.md) - Quick shortcut
- [.claude/VOICE-COMMAND-README.md](.claude/VOICE-COMMAND-README.md) - This documentation

## Future Enhancements

Potential improvements:
- Add voice commands for specific actions (e.g., `/voice-commit` for commit messages)
- Support different languages via Whisper language parameter
- Add voice-to-code command for dictating code snippets
- Create voice-to-file command for generating files from dictation

## Credits

Voice transcription powered by:
- **OpenAI Whisper API** - Speech recognition
- **arecord** - Audio recording (Linux)
- **Python ecosystem** - Audio processing and API integration
