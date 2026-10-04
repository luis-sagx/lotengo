import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildPlacementQuestions, scorePlacement } from '../src/services/placementService.mjs';
import { LEVELS } from '../src/utils/levels.mjs';

const questions = buildPlacementQuestions();
const T = [true, true, true];
const F = [false, false, false];

test('builds 15 questions, 3 per level, easy to hard, answer among options', () => {
  assert.equal(questions.length, 15);
  assert.deepEqual(questions.map(q => q.level), LEVELS.flatMap(l => [l, l, l]));
  for (const q of questions) {
    assert.equal(q.options.length, 3);
    assert.ok(q.options.includes(q.answer));
  }
});

test('answers are unique and options are unique per item', () => {
  assert.equal(new Set(questions.map(q => q.answer)).size, 15);
  for (const q of questions) assert.equal(new Set(q.options).size, q.options.length);
});

test('needs 2 of 3 correct to pass a level', () => {
  assert.equal(scorePlacement({ A1: [true, false, false] }), 'A1');
  assert.equal(scorePlacement({ A1: T, A2: [true, false, true] }), 'A2');
  assert.equal(scorePlacement({ A1: T, A2: [true, false, false] }), 'A1');
});

test('all wrong / all "No sé" lands in A1', () => {
  assert.equal(scorePlacement({ A1: F, A2: F, B1: F, B2: F, C1: F }), 'A1');
  assert.equal(scorePlacement({}), 'A1');
});

test('stops at the first failed level even if higher ones are right', () => {
  assert.equal(scorePlacement({ A1: T, A2: T, B1: F, B2: T, C1: T }), 'A2');
});

test('passing everything gives C1', () => {
  assert.equal(scorePlacement({ A1: T, A2: T, B1: T, B2: T, C1: T }), 'C1');
});
