import { test } from 'node:test';
import assert from 'node:assert/strict';
import { nextStreak, localDate, startOfLocalDay, endOfLocalDay } from '../src/services/streak.mjs';

test('streak grows on consecutive days and stays on the same day', () => {
  assert.deepEqual(nextStreak({ lastDate: null }, '2026-10-03'), { streak: 1, freezeAt: null });
  assert.equal(nextStreak({ lastDate: '2026-10-03', streak: 4 }, '2026-10-03').streak, 4);
  assert.equal(nextStreak({ lastDate: '2026-10-02', streak: 4 }, '2026-10-03').streak, 5);
});

test('one missed day is forgiven once a week', () => {
  const frozen = nextStreak({ lastDate: '2026-10-01', streak: 4 }, '2026-10-03');
  assert.deepEqual(frozen, { streak: 5, freezeAt: '2026-10-03' });
  // Another slip three days later resets: the freeze is still recharging.
  assert.equal(nextStreak({ lastDate: '2026-10-04', streak: 6, freezeAt: '2026-10-03' }, '2026-10-06').streak, 1);
  // A week later the freeze is available again.
  assert.equal(nextStreak({ lastDate: '2026-10-08', streak: 9, freezeAt: '2026-10-03' }, '2026-10-10').streak, 10);
});

test('two or more missed days reset the streak', () => {
  assert.equal(nextStreak({ lastDate: '2026-09-30', streak: 4 }, '2026-10-03').streak, 1);
});

test('local day boundaries use the device calendar', () => {
  const late = new Date(2026, 0, 5, 23, 30);
  assert.equal(localDate(late), '2026-01-05');
  assert.equal(new Date(startOfLocalDay(late)).getHours(), 0);
  assert.equal(endOfLocalDay(late) - startOfLocalDay(late), 86400000 - 1);
});
