// saflash — Pure gamification rules: hearts, XP, streak and local dates.

export const MAX_HEARTS = 5;
export const HEART_REFILL_MS = 30 * 60 * 1000;
export const COMBO_MIN = 3;

// YYYY-MM-DD in the device's time zone (streaks follow the learner's day).
export function localDate(date = new Date()) {
  const pad = n => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

// Epoch ms of the start of the learner's local day.
export function startOfLocalDay(date = new Date()) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  return start.getTime();
}

// Epoch ms of the last moment of the learner's local day.
export function endOfLocalDay(date = new Date()) {
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return end.getTime();
}

// Applies time-based refill. `updatedAt` marks when the refill clock started.
export function refillHearts({ hearts, updatedAt }, now = Date.now()) {
  const current = Math.min(MAX_HEARTS, Math.max(0, hearts ?? MAX_HEARTS));
  if (current >= MAX_HEARTS || !updatedAt) {
    return { hearts: current, updatedAt: current >= MAX_HEARTS ? null : updatedAt ?? now, nextAt: null };
  }
  const gained = Math.floor((now - updatedAt) / HEART_REFILL_MS);
  const total = Math.min(MAX_HEARTS, current + gained);
  if (total >= MAX_HEARTS) return { hearts: MAX_HEARTS, updatedAt: null, nextAt: null };
  const clock = updatedAt + gained * HEART_REFILL_MS;
  return { hearts: total, updatedAt: clock, nextAt: clock + HEART_REFILL_MS };
}

export function changeHearts(state, delta, now = Date.now()) {
  const refilled = refillHearts(state, now);
  const hearts = Math.min(MAX_HEARTS, Math.max(0, refilled.hearts + delta));
  if (hearts >= MAX_HEARTS) return { hearts, updatedAt: null, nextAt: null };
  // Start the refill clock when dropping from full.
  const updatedAt = refilled.updatedAt ?? now;
  return { hearts, updatedAt, nextAt: updatedAt + HEART_REFILL_MS };
}

export function xpForSession({ correct, total, review = false, maxCombo = 0 }) {
  if (total === 0) return 0;
  if (review) return 5 + correct;
  const perfect = correct === total ? 5 : 0;
  const comboBonus = Math.floor(maxCombo / 5) * 2;
  return 10 + perfect + comboBonus;
}

export function nextStreak(lastDate, today, streak) {
  if (!lastDate) return 1;
  const days = Math.round((Date.parse(today) - Date.parse(lastDate)) / 86400000);
  if (days <= 0) return streak || 1;
  if (days === 1) return (streak || 0) + 1;
  return 1;
}
