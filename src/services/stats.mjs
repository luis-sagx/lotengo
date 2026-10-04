// saflash — Honest progress numbers from FSRS state and the review log. Pure.
import { retrievability, MATURE_DAYS, GRADE, State } from './srs.mjs';

// Probability of recall above which a word counts as retained right now.
export const RETAINED_AT = 0.9;
const DAY_MS = 86400000;

// rows: user_progress rows, each with the word's per_million (0 for phrases).
// retained: cards likely recalled now; mature: stability of 3+ weeks;
// coverage: share of everyday English running words (subtitles) the retained
// words make up. Approximate: inflections and multi-word items are not counted.
export function memorySummary(rows, now = new Date()) {
  let retained = 0;
  let mature = 0;
  let perMillion = 0;
  for (const row of rows) {
    if (row.state === State.Review && row.stability >= MATURE_DAYS) mature += 1;
    if (retrievability(row, now) >= RETAINED_AT) {
      retained += 1;
      perMillion += row.per_million || 0;
    }
  }
  return { retained, mature, coverage: perMillion / 1e6 };
}

// Share of review-state answers that were not "Again": the retention you
// actually achieve, to compare with the target. Null with too few reviews.
export function trueRetention(ratings, minimum = 20) {
  if (ratings.length < minimum) return { rate: null, count: ratings.length };
  const passed = ratings.filter(r => r !== GRADE.AGAIN).length;
  return { rate: passed / ratings.length, count: ratings.length };
}

// Cards due on each of the next `days` local days; overdue cards count today.
export function dueForecast(dues, now = new Date(), days = 7) {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const counts = Array(days).fill(0);
  for (const due of dues) {
    const day = Math.max(0, Math.floor((due - start.getTime()) / DAY_MS));
    if (day < days) counts[day] += 1;
  }
  return counts.map((count, i) => ({ date: new Date(start.getTime() + i * DAY_MS), count }));
}

