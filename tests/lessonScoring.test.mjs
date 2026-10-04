import { test } from 'node:test';
import assert from 'node:assert/strict';
import { accuracyFromResults, starsFromAccuracy } from '../src/services/lessonScoring.mjs';

test('converts first-try accuracy into lesson stars', () => {
  assert.equal(starsFromAccuracy(0.8), 3);
  assert.equal(starsFromAccuracy(0.5), 2);
  assert.equal(starsFromAccuracy(0.49), 1);
});

test('computes accuracy from first-try results', () => {
  assert.equal(accuracyFromResults([true, false, true, false]), 0.5);
});

test('handles an empty result list as zero accuracy and one star', () => {
  assert.equal(accuracyFromResults([]), 0);
  assert.equal(starsFromAccuracy(0), 1);
});
