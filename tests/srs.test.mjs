import test from 'node:test';
import assert from 'node:assert/strict';
import { review, retrievability, suggestGrade, formatInterval, previewIntervals, GRADE, State } from '../src/services/srs.mjs';

const T0 = new Date('2026-01-01T09:00:00Z');
const MIN = 60000;
const DAY = 86400000;

function graduate(retention) {
  let row = review(null, GRADE.GOOD, { now: T0, retention }).progress;
  row = review(row, GRADE.GOOD, { now: new Date(row.due), retention }).progress;
  return row;
}

test('a new card goes through same-day learning steps', () => {
  const again = review(null, GRADE.AGAIN, { now: T0 }).progress;
  assert.equal(again.state, State.Learning);
  assert.equal(again.due - T0.getTime(), 1 * MIN);
  assert.equal(again.wrong_count, 1);

  const good = review(null, GRADE.GOOD, { now: T0 }).progress;
  assert.equal(good.state, State.Learning);
  assert.equal(good.due - T0.getTime(), 10 * MIN);
  assert.equal(good.correct_count, 1);
});

test('passing the learning steps schedules a review days later', () => {
  const row = graduate();
  assert.equal(row.state, State.Review);
  assert.ok(row.due - row.last_review >= DAY);
  assert.equal(row.reps, 2);
});

test('intervals keep growing with successful reviews', () => {
  let row = graduate();
  const gaps = [];
  for (let i = 0; i < 4; i += 1) {
    const now = new Date(row.due);
    row = review(row, GRADE.GOOD, { now }).progress;
    gaps.push(row.due - now.getTime());
  }
  for (let i = 1; i < gaps.length; i += 1) assert.ok(gaps[i] > gaps[i - 1]);
});

test('forgetting a review card sends it to relearning', () => {
  const row = graduate();
  const { progress, log } = review(row, GRADE.AGAIN, { now: new Date(row.due) });
  assert.equal(progress.state, State.Relearning);
  assert.equal(progress.lapses, 1);
  assert.equal(log.rating, GRADE.AGAIN);
  assert.equal(log.state, State.Review);
});

test('a higher desired retention means shorter intervals', () => {
  const low = review(graduate(0.85), GRADE.GOOD, { now: new Date(graduate(0.85).due), retention: 0.85 }).progress;
  const high = review(graduate(0.95), GRADE.GOOD, { now: new Date(graduate(0.95).due), retention: 0.95 }).progress;
  assert.ok(high.scheduled_days < low.scheduled_days);
});

test('retrievability is 0 for unseen cards and decays over time', () => {
  assert.equal(retrievability(null), 0);
  const row = graduate();
  const soon = retrievability(row, new Date(row.last_review + DAY));
  const later = retrievability(row, new Date(row.last_review + 30 * DAY));
  assert.ok(soon > later && later > 0 && soon <= 1);
});

test('suggested grade follows correctness, typos and speed', () => {
  assert.equal(suggestGrade({ correct: false }), GRADE.AGAIN);
  assert.equal(suggestGrade({ correct: true, typo: true }), GRADE.HARD);
  assert.equal(suggestGrade({ correct: true, ms: 20000 }), GRADE.HARD);
  assert.equal(suggestGrade({ correct: true, ms: 3000 }), GRADE.GOOD);
});

test('intervals are labelled for the rating buttons', () => {
  assert.equal(formatInterval(10 * MIN), '10 min');
  assert.equal(formatInterval(3 * DAY), '3 d');
  const labels = previewIntervals(null, { now: T0 });
  assert.equal(labels[GRADE.AGAIN], '1 min');
  assert.equal(labels[GRADE.GOOD], '10 min');
});
