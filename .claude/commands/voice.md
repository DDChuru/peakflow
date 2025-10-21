---
description: Record voice and transcribe to text using OpenAI Whisper
---

Please execute the voice-to-text transcription tool and insert the transcribed text into our conversation.

Follow these steps:

1. Run the voice-to-text command: `voice`
2. Wait for the transcription to complete
3. Retrieve the transcribed text from the clipboard using `xclip -o -selection clipboard` or `wl-paste`
4. Present the transcribed text to me in a formatted way
5. Ask me what I'd like to do with the transcribed text

Notes:
- The voice command will auto-start recording when executed
- It will automatically stop after 4 seconds of silence
- The user can also manually stop with Ctrl+C
- The transcribed text will be automatically copied to the clipboard
