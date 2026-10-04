// saflash — Pronunciation: a recorded human voice when the dictionary has one,
// device text-to-speech otherwise (and for slow playback).
import * as Speech from 'expo-speech';
import { createAudioPlayer } from 'expo-audio';

let autoSpeak = true;
const recordings = new Map(); // lowercased text -> audio URL
let player = null;

export function setAutoSpeak(enabled) {
  autoSpeak = enabled;
}

// Remembers a recorded pronunciation for `text` (from word enrichment).
export function registerAudio(text, url) {
  if (text && url) recordings.set(text.toLowerCase(), url);
}

function tts(text, rate) {
  Speech.speak(text, { language: 'en-US', pitch: 1.0, rate });
}

/**
 * Speak a word or phrase: the recording if known, else the device TTS.
 */
export async function speak(text, options = {}) {
  await Speech.stop();
  player?.pause();
  const url = !options.rate && recordings.get(String(text).toLowerCase());
  if (url) {
    try {
      player?.remove();
      player = createAudioPlayer(url);
      player.play();
      return;
    } catch (err) {
      console.warn('Recorded audio failed, using TTS:', err);
    }
  }
  tts(text, options.rate || 0.9);
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
  player?.pause();
  await Speech.stop();
}
