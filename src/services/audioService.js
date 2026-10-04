// saflash — Audio / TTS service
import * as Speech from 'expo-speech';

let autoSpeak = true;

export function setAutoSpeak(enabled) {
  autoSpeak = enabled;
}

/**
 * Speak a word or phrase using the device's built-in TTS engine.
 */
export async function speak(text, options = {}) {
  await Speech.stop();
  Speech.speak(text, {
    language: 'en-US',
    pitch: 1.0,
    rate: options.rate || 0.9,
  });
}

// Automatic playback (new card shown); respects the Settings toggle.
export function speakAuto(text) {
  if (autoSpeak) speak(text);
}

// Slower rate for beginners.
export function speakSlow(text) {
  return speak(text, { rate: 0.6 });
}

export async function stopSpeaking() {
  await Speech.stop();
}
