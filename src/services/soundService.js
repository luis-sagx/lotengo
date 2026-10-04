// saflash — UI sound effects and haptics (correct, wrong, lesson complete).
import { createAudioPlayer } from 'expo-audio';
import * as Haptics from 'expo-haptics';

const SOURCES = {
  correct: require('../../assets/sounds/correct.wav'),
  wrong: require('../../assets/sounds/wrong.wav'),
  complete: require('../../assets/sounds/complete.wav'),
};

const HAPTICS = {
  correct: Haptics.NotificationFeedbackType.Success,
  wrong: Haptics.NotificationFeedbackType.Error,
  complete: Haptics.NotificationFeedbackType.Success,
};

let enabled = true;
const players = {};

export function setEffectsEnabled(value) {
  enabled = value;
}

export function playEffect(name) {
  if (!enabled) return;
  try {
    players[name] ??= createAudioPlayer(SOURCES[name]);
    players[name].seekTo(0);
    players[name].play();
  } catch (err) {
    console.warn('Sound effect failed:', err);
  }
  Haptics.notificationAsync(HAPTICS[name]).catch(() => {});
}
