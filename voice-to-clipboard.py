#!/usr/bin/env python3
"""
Voice-to-Clipboard Transcription Script
Records audio, transcribes with OpenAI Whisper API, and copies to clipboard.

Usage:
    python voice-to-clipboard.py

Requirements:
    - OpenAI API key set as OPENAI_API_KEY environment variable
    - Python packages: openai, sounddevice, numpy, pyperclip, python-dotenv
"""

import os
import sys
import signal
import tempfile
import argparse
import numpy as np
import sounddevice as sd
import soundfile as sf
import pyperclip
from openai import OpenAI
from dotenv import load_dotenv
from datetime import datetime

# Load environment variables
load_dotenv()

# Configuration
SAMPLE_RATE = 16000  # 16kHz (Whisper's preferred rate)
CHANNELS = 1  # Mono audio

# Global state
recording = []
is_recording = True
total_frames = 0
QUIET_MODE = False
COPY_TO_CLIPBOARD_ENABLED = True
OUTPUT_FILE = None


def log(message='', *, quiet_sensitive=True, **kwargs):
    """Conditional print based on quiet mode"""
    if QUIET_MODE and quiet_sensitive:
        return
    print(message, **kwargs)


def log_error(message):
    """Always print errors"""
    print(message, file=sys.stderr)


def signal_handler(sig, frame):
    """Handle Ctrl+C gracefully"""
    global is_recording
    log("\n\n🛑 Recording stopped by user (Ctrl+C)", quiet_sensitive=False)
    is_recording = False


def calculate_rms(audio_chunk):
    """Calculate RMS (Root Mean Square) amplitude of audio chunk"""
    return np.sqrt(np.mean(audio_chunk**2))


def audio_callback(indata, frames, time, status):
    """Callback function for audio stream"""
    global recording, is_recording, total_frames

    if status:
        log(f"⚠️  Status: {status}", quiet_sensitive=False, file=sys.stderr)

    # Add audio data to recording
    recording.append(indata.copy())

    # Track total recording time
    total_frames += frames
    total_duration = total_frames / SAMPLE_RATE

    # Calculate RMS for display
    rms = calculate_rms(indata)

    # Show recording indicator
    log(f"\r🎤 Recording... {total_duration:.1f}s (RMS: {rms:.4f}, press Ctrl+C to stop)", end='', flush=True)


def record_audio():
    """Record audio until user stops with Ctrl+C"""
    global recording, is_recording, total_frames

    # Reset state
    recording = []
    is_recording = True
    total_frames = 0

    log("=" * 60)
    log("🎙️  VOICE-TO-CLIPBOARD TRANSCRIPTION")
    log("=" * 60)
    log(f"📝 Configuration:")
    log(f"   - Sample Rate: {SAMPLE_RATE} Hz")
    log(f"   - Stop recording: Press Ctrl+C")
    log("=" * 60)
    log("\n🎤 Starting recording...\n")
    if QUIET_MODE:
        log("🎤 Recording... speak naturally. Press Ctrl+C when finished.", quiet_sensitive=False)

    try:
        with sd.InputStream(
            samplerate=SAMPLE_RATE,
            channels=CHANNELS,
            callback=audio_callback,
            dtype=np.float32
        ):
            while is_recording:
                sd.sleep(100)  # Sleep in small intervals

    except KeyboardInterrupt:
        log("\n\n🛑 Recording stopped by user (Ctrl+C)", quiet_sensitive=False)
    except Exception as e:
        log_error(f"\n❌ Recording error: {e}")
        return None

    # Combine all recorded chunks
    if recording:
        audio_data = np.concatenate(recording, axis=0)
        duration = len(audio_data) / SAMPLE_RATE
        log(f"\n✅ Recording complete: {duration:.2f}s")
        return audio_data
    else:
        log("\n⚠️  No audio recorded")
        return None


def save_temp_audio(audio_data):
    """Save audio to temporary WAV file"""
    temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.wav')
    temp_path = temp_file.name
    temp_file.close()

    sf.write(temp_path, audio_data, SAMPLE_RATE)
    log(f"💾 Saved to temporary file: {temp_path}")
    return temp_path


def transcribe_audio(audio_path):
    """Transcribe audio using OpenAI Whisper API"""
    api_key = os.getenv('OPENAI_API_KEY')

    if not api_key:
        log("\n❌ ERROR: OPENAI_API_KEY not found!", quiet_sensitive=False)
        log("   Please set it in your .env file or environment:", quiet_sensitive=False)
        log("   export OPENAI_API_KEY='your-api-key-here'", quiet_sensitive=False)
        return None

    log("\n🔄 Transcribing with OpenAI Whisper API...")

    try:
        client = OpenAI(api_key=api_key)

        with open(audio_path, 'rb') as audio_file:
            transcript = client.audio.transcriptions.create(
                model="whisper-1",
                file=audio_file,
                response_format="text"
            )

        return transcript.strip()

    except Exception as e:
        log_error(f"\n❌ Transcription error: {e}")
        return None


def copy_to_clipboard(text):
    """Copy text to system clipboard"""
    if not COPY_TO_CLIPBOARD_ENABLED:
        return False
    try:
        pyperclip.copy(text)
        log("📋 Copied to clipboard!")
        return True
    except Exception as e:
        log_error(f"❌ Clipboard error: {e}")
        return False


def write_output_file(text: str):
    """Write transcript to file when requested"""
    if not OUTPUT_FILE:
        return
    try:
        with open(OUTPUT_FILE, 'w', encoding='utf-8') as out_file:
            out_file.write(text)
        log(f"💾 Transcript saved to {OUTPUT_FILE}")
    except Exception as exc:
        log_error(f"❌ Failed to write transcript to {OUTPUT_FILE}: {exc}")


def main():
    """Main execution flow"""
    global QUIET_MODE, COPY_TO_CLIPBOARD_ENABLED, OUTPUT_FILE

    parser = argparse.ArgumentParser(description="Record audio and transcribe using OpenAI Whisper.")
    parser.add_argument('--quiet', action='store_true', help='Suppress progress output; only final transcript and critical messages')
    parser.add_argument('--no-clipboard', action='store_true', help='Skip copying transcript to clipboard')
    parser.add_argument('--output-file', help='Optional path to write the transcript')
    args = parser.parse_args()

    QUIET_MODE = args.quiet
    COPY_TO_CLIPBOARD_ENABLED = not args.no_clipboard
    OUTPUT_FILE = args.output_file

    # Set up Ctrl+C handler
    signal.signal(signal.SIGINT, signal_handler)

    # Record audio
    audio_data = record_audio()

    if audio_data is None or len(audio_data) == 0:
        log("\n❌ No audio to transcribe", quiet_sensitive=False)
        return 1

    # Save to temporary file
    try:
        audio_path = save_temp_audio(audio_data)
    except Exception as e:
        log_error(f"\n❌ Failed to save audio: {e}")
        return 1

    # Transcribe
    transcript = transcribe_audio(audio_path)

    # Clean up temp file
    try:
        os.unlink(audio_path)
        log(f"🗑️  Removed temporary file")
    except Exception as e:
        log_error(f"⚠️  Could not remove temp file: {e}")

    if not transcript:
        log("\n❌ Transcription failed", quiet_sensitive=False)
        return 1

    # Display result
    log("\n" + "=" * 60)
    log("📝 TRANSCRIPTION RESULT")
    log("=" * 60)
    log(transcript, quiet_sensitive=False)
    log("=" * 60)

    write_output_file(transcript)

    # Copy to clipboard
    if copy_to_clipboard(transcript):
        log("\n✨ Success! Transcription is now on your clipboard.")
        log("   You can paste it anywhere with Ctrl+V")

    return 0


if __name__ == "__main__":
    sys.exit(main())
