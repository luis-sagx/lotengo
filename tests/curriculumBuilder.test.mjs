import { test } from 'node:test';
import assert from 'node:assert/strict';
import { planLessons, chunkLessons } from '../src/curriculum/curriculumBuilder.mjs';
import { LESSON_SIZE, MIXED_CATEGORY } from '../src/curriculum/curriculum.mjs';

function words(n, category, start = 0) {
  return Array.from({ length: n }, (_, i) => ({
    english_word: `${category}-w${i}`,
    category,
    frequency_rank: start + i + 1,
  }));
}

function phrases(n, category) {
  return Array.from({ length: n }, (_, i) => ({
    phrase_en: `${category}-p${i}`,
    category,
    frequency_rank: i + 1,
  }));
}

test('chunks cards into lessons and folds a short tail into the last one', () => {
  assert.deepEqual(chunkLessons(Array.from({ length: 11 }, (_, i) => i)).map(c => c.length), [11]);
  assert.deepEqual(chunkLessons(Array.from({ length: 12 }, (_, i) => i)).map(c => c.length), [8, 4]);
  assert.deepEqual(chunkLessons([1, 2]).map(c => c.length), [2]);
});

test('makes one unit per category with words before phrases', () => {
  const { lessons } = planLessons(
    { A1: words(8, 'family') },
    { A1: phrases(4, 'family') }
  );

  assert.equal(lessons.length, 2);
  assert.equal(lessons[0].words.length, LESSON_SIZE);
  assert.deepEqual(lessons[1].phrases, ['family-p0', 'family-p1', 'family-p2', 'family-p3']);
  assert.ok(lessons.every(l => l.unit_index === 0 && l.category === 'family'));
});

test('orders units beginner-first and puts the mixed unit last', () => {
  const { lessons } = planLessons(
    { A1: [...words(8, 'idioms'), ...words(8, 'numbers', 100), ...words(2, 'animals')] },
    { A1: [...phrases(8, 'greetings'), ...phrases(2, 'weather')] }
  );
  const units = [...new Set(lessons.map(l => l.category))];

  assert.deepEqual(units, ['greetings', 'numbers', 'idioms', MIXED_CATEGORY]);
});

test('uses the provided title and icon for each unit', () => {
  const { lessons } = planLessons(
    { A1: words(8, 'family') },
    { A1: [] },
    { titleOf: c => `T:${c}`, iconOf: () => '👪' }
  );

  assert.equal(lessons[0].unit_title, 'T:family');
  assert.equal(lessons[0].icon, '👪');
});
