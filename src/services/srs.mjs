// saflash — Spaced repetition with FSRS (ts-fsrs). Pure: DB rows in, DB rows out.
// FSRS models each card's stability and difficulty and schedules the next review
// when recall probability drops to the desired retention (Ye, Su & Cao, KDD 2022).
import { fsrs, generatorParameters, createEmptyCard, Rating, State } from 'ts-fsrs';

export { State };

export const GRADE = {
  AGAIN: Rating.Again,
  HARD: Rating.Hard,
  GOOD: Rating.Good,
  EASY: Rating.Easy,
};

export const DEFAULT_RETENTION = 0.9;
export const RETENTION_OPTIONS = [0.85, 0.9, 0.95];
// Stability (days) from which a card counts as mature, as in Anki.
export const MATURE_DAYS = 21;
// Answers slower than this suggest Hard even when correct.
export const SLOW_ANSWER_MS = 15000;

const schedulers = new Map();

function scheduler(retention = DEFAULT_RETENTION) {
  if (!schedulers.has(retention)) {
    schedulers.set(retention, fsrs(generatorParameters({
      request_retention: retention,
      maximum_interval: 3650,
      enable_fuzz: true,
      learning_steps: ['1m', '10m'],
      relearning_steps: ['10m'],
    })));
  }
  return schedulers.get(retention);
}

// A user_progress row (or nothing, for a card never seen) as a ts-fsrs card.
export function rowToCard(row, now = new Date()) {
  if (!row || row.due == null) return createEmptyCard(now);
  return {
    due: new Date(row.due),
    stability: row.stability,
    difficulty: row.difficulty,
    elapsed_days: row.elapsed_days,
    scheduled_days: row.scheduled_days,
    learning_steps: row.learning_steps,
    reps: row.reps,
    lapses: row.lapses,
    state: row.state,
    last_review: row.last_review ? new Date(row.last_review) : undefined,
  };
}

// Applies one answer. Returns the new progress row and the review_log entry.
export function review(row, grade, { now = new Date(), retention = DEFAULT_RETENTION } = {}) {
  const { card, log } = scheduler(retention).next(rowToCard(row, now), now, grade);
  const correct = grade !== GRADE.AGAIN;
  return {
    progress: {
      state: card.state,
      due: card.due.getTime(),
      stability: card.stability,
      difficulty: card.difficulty,
      elapsed_days: card.elapsed_days,
      scheduled_days: card.scheduled_days,
      learning_steps: card.learning_steps,
      reps: card.reps,
      lapses: card.lapses,
      last_review: now.getTime(),
      correct_count: (row?.correct_count || 0) + (correct ? 1 : 0),
      wrong_count: (row?.wrong_count || 0) + (correct ? 0 : 1),
    },
    log: {
      rating: grade,
      state: log.state,
      reviewed_at: now.getTime(),
      elapsed_days: log.elapsed_days,
      scheduled_days: card.scheduled_days,
      stability: card.stability,
      difficulty: card.difficulty,
    },
  };
}

// Probability (0–1) of recalling the card now; 0 for cards never reviewed.
export function retrievability(row, now = new Date()) {
  if (!row || row.due == null || row.state === State.New) return 0;
  return scheduler().get_retrievability(rowToCard(row, now), now, false);
}

// Grade suggested from an objective answer; the learner can override it.
export function suggestGrade({ correct, typo = false, ms = 0 }) {
  if (!correct) return GRADE.AGAIN;
  if (typo || ms > SLOW_ANSWER_MS) return GRADE.HARD;
  return GRADE.GOOD;
}

// Human label for the next interval ("10 min", "3 d", "2 m").
export function formatInterval(ms) {
  const minutes = Math.max(1, Math.round(ms / 60000));
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h`;
  const days = Math.round(hours / 24);
  if (days < 31) return `${days} d`;
  const months = Math.round(days / 30);
  if (months < 12) return `${months} m`;
  return `${(days / 365).toFixed(1)} a`;
}

// Next interval for every grade, for labelling the rating buttons.
export function previewIntervals(row, { now = new Date(), retention = DEFAULT_RETENTION } = {}) {
  const preview = scheduler(retention).repeat(rowToCard(row, now), now);
  const result = {};
  for (const grade of Object.values(GRADE)) {
    result[grade] = formatInterval(preview[grade].card.due.getTime() - now.getTime());
  }
  return result;
}
