import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  LEVELS,
  LEVEL_LABELS,
  LEVEL_SELF_DESCRIPTIONS,
  isValidLevel,
  levelIndex,
  nextLevel,
  prevLevel,
} from '../src/utils/levels.mjs';

test('defines the CEFR levels in path order', () => {
  assert.deepEqual(LEVELS, ['A1', 'A2', 'B1', 'B2', 'C1']);
  assert.equal(levelIndex('A1'), 0);
  assert.equal(levelIndex('C1'), 4);
  assert.equal(levelIndex('Z9'), -1);
});

test('moves between adjacent levels and stops at bounds', () => {
  assert.equal(nextLevel('A1'), 'A2');
  assert.equal(nextLevel('B2'), 'C1');
  assert.equal(nextLevel('C1'), null);
  assert.equal(nextLevel('bad'), null);

  assert.equal(prevLevel('C1'), 'B2');
  assert.equal(prevLevel('A2'), 'A1');
  assert.equal(prevLevel('A1'), null);
  assert.equal(prevLevel('bad'), null);
});

test('uses friendly labels without CEFR codes', () => {
  assert.deepEqual(Object.values(LEVEL_LABELS), ['Principiante', 'Básico', 'Intermedio', 'Avanzado', 'Experto']);
});

test('keeps labels for every selectable and valid level', () => {
  for (const level of LEVELS) {
    assert.equal(isValidLevel(level), true);
    assert.equal(typeof LEVEL_LABELS[level], 'string');
    assert.ok(LEVEL_LABELS[level].length > 0);
  }

  for (const level of Object.keys(LEVEL_SELF_DESCRIPTIONS)) {
    assert.ok(LEVELS.includes(level));
  }
});
