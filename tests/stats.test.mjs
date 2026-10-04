import test from 'node:test';
import assert from 'node:assert/strict';
import { memorySummary, trueRetention, dueForecast } from '../src/services/stats.mjs';
import { review, GRADE } from '../src/services/srs.mjs';

const T0 = new Date('2026-01-01T09:00:00Z');
const DAY = 86400000;

function learned(perMillion) {
  let row = review(null, GRADE.GOOD, { now: T0 }).progress;
  row = review(row, GRADE.GOOD, { now: new Date(row.due) }).progress;
  return { ...row, per_million: perMillion };
}

test('retained words add up to text coverage and fade with time', () => {
  const rows = [learned(10000), learned(5000), { state: 0, due: null, per_million: 9000 }];
  const soon = memorySummary(rows, new Date(rows[0].last_review + 1000));
  assert.equal(soon.retained, 2);
  assert.equal(soon.coverage, 0.015);
  const later = memorySummary(rows, new Date(rows[0].last_review + 60 * DAY));
  assert.equal(later.retained, 0);
});

test('true retention needs enough reviews', () => {
  assert.equal(trueRetention([GRADE.GOOD]).rate, null);
  const ratings = [...Array(18).fill(GRADE.GOOD), GRADE.AGAIN, GRADE.HARD];
  assert.equal(trueRetention(ratings).rate, 0.95);
});

test('forecast buckets due cards by local day, overdue counts today', () => {
  const now = new Date(2026, 0, 10, 15, 0);
  const today = new Date(2026, 0, 10, 20, 0).getTime();
  const overdue = new Date(2026, 0, 2).getTime();
  const tomorrow = new Date(2026, 0, 11, 8, 0).getTime();
  const later = new Date(2026, 0, 30).getTime();
  const days = dueForecast([today, overdue, tomorrow, later], now);
  assert.deepEqual(days.map(d => d.count), [2, 1, 0, 0, 0, 0, 0]);
  assert.equal(days[1].date.getDate(), 11);
});
