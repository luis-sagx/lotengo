// saflash — Synthesizes the UI sound effects into assets/sounds (no third-party audio).
// Run: node scripts/generate-sounds.mjs
import { writeFileSync, mkdirSync } from 'node:fs';

const RATE = 22050;

// notes: [frequencyHz, durationSec]; harmonics: [multiple, gain]
function synth(notes, { harmonics = [[1, 1], [2, 0.25]], decay = 6, volume = 0.5 } = {}) {
  const samples = [];
  for (const [freq, duration] of notes) {
    const length = Math.floor(RATE * duration);
    for (let i = 0; i < length; i += 1) {
      const t = i / RATE;
      const attack = Math.min(1, t / 0.005);
      const release = Math.min(1, (length - i) / (RATE * 0.01));
      const envelope = attack * release * Math.exp(-decay * t);
      let value = 0;
      for (const [multiple, gain] of harmonics) value += gain * Math.sin(2 * Math.PI * freq * multiple * t);
      samples.push(value * envelope * volume);
    }
  }
  return samples;
}

function wav(samples) {
  const data = Buffer.alloc(samples.length * 2);
  samples.forEach((s, i) => data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, s)) * 32767), i * 2));
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + data.length, 4);
  header.write('WAVEfmt ', 8);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);      // PCM
  header.writeUInt16LE(1, 22);      // mono
  header.writeUInt32LE(RATE, 24);
  header.writeUInt32LE(RATE * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write('data', 36);
  header.writeUInt32LE(data.length, 40);
  return Buffer.concat([header, data]);
}

const SOUNDS = {
  correct: synth([[659.25, 0.09], [880, 0.22]], { decay: 7 }),
  wrong: synth([[196, 0.12], [146.83, 0.24]], { harmonics: [[1, 1], [3, 0.3]], decay: 5, volume: 0.4 }),
  complete: synth([[523.25, 0.11], [659.25, 0.11], [783.99, 0.11], [1046.5, 0.45]], { decay: 4 }),
};

mkdirSync(new URL('../assets/sounds/', import.meta.url), { recursive: true });
for (const [name, samples] of Object.entries(SOUNDS)) {
  writeFileSync(new URL(`../assets/sounds/${name}.wav`, import.meta.url), wav(samples));
  console.log(`assets/sounds/${name}.wav`);
}
