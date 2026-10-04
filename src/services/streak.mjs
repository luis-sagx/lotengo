// saflash — Learner's day and streak. Pure.

// A missed day is forgiven at most once per this many days.
export const FREEZE_EVERY_DAYS = 7;

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

function daysBetween(from, to) {
  return Math.round((Date.parse(to) - Date.parse(from)) / 86400000);
}

// Streak after studying on `today`. One missed day is forgiven (a "freeze")
// if no freeze was used in the last FREEZE_EVERY_DAYS days; a slip should not
// wipe out weeks of habit. Returns { streak, freezeAt }.
export function nextStreak({ lastDate, streak = 0, freezeAt = null }, today) {
  if (!lastDate) return { streak: 1, freezeAt };
  const gap = daysBetween(lastDate, today);
  if (gap <= 0) return { streak: streak || 1, freezeAt };
  if (gap === 1) return { streak: streak + 1, freezeAt };
  const freezeReady = !freezeAt || daysBetween(freezeAt, today) >= FREEZE_EVERY_DAYS;
  if (gap === 2 && freezeReady) return { streak: streak + 1, freezeAt: today };
  return { streak: 1, freezeAt };
}
