import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  MAX_HEARTS, HEART_REFILL_MS, refillHearts, changeHearts, xpForSession, nextStreak, localDate,
} from '../src/services/gamification.mjs';

const T0 = 1_000_000_000_000;

test('full hearts have no refill clock', () => {
  assert.deepEqual(refillHearts({ hearts: MAX_HEARTS, updatedAt: null }, T0), { hearts: 5, updatedAt: null, nextAt: null });
});

test('losing a heart starts the refill clock and one refills after 30 min', () => {
  const lost = changeHearts({ hearts: 5, updatedAt: null }, -1, T0);
  assert.equal(lost.hearts, 4);
  assert.equal(lost.nextAt, T0 + HEART_REFILL_MS);
  assert.equal(refillHearts(lost, T0 + HEART_REFILL_MS - 1).hearts, 4);
  assert.equal(refillHearts(lost, T0 + HEART_REFILL_MS).hearts, 5);
});

test('refill keeps the partial progress toward the next heart', () => {
  const state = { hearts: 1, updatedAt: T0 };
  const later = refillHearts(state, T0 + HEART_REFILL_MS * 2 + 1000);
  assert.equal(later.hearts, 3);
  assert.equal(later.nextAt, T0 + HEART_REFILL_MS * 3);
});

test('hearts never go below zero or above the max', () => {
  assert.equal(changeHearts({ hearts: 0, updatedAt: T0 }, -1, T0).hearts, 0);
  assert.equal(changeHearts({ hearts: 5, updatedAt: null }, 1, T0).hearts, 5);
});

test('lesson XP rewards completion, perfection and combos; review XP per card', () => {
  assert.equal(xpForSession({ correct: 6, total: 8 }), 10);
  assert.equal(xpForSession({ correct: 8, total: 8, maxCombo: 10 }), 19);
  assert.equal(xpForSession({ correct: 4, total: 6, review: true }), 9);
  assert.equal(xpForSession({ correct: 0, total: 0 }), 0);
});

test('streak grows on consecutive days and resets after a gap', () => {
  assert.equal(nextStreak(null, '2026-10-03', 0), 1);
  assert.equal(nextStreak('2026-10-03', '2026-10-03', 4), 4);
  assert.equal(nextStreak('2026-10-02', '2026-10-03', 4), 5);
  assert.equal(nextStreak('2026-09-30', '2026-10-03', 4), 1);
});

test('local date uses the device calendar day', () => {
  assert.equal(localDate(new Date(2026, 0, 5, 23, 30)), '2026-01-05');
});
