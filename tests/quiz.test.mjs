import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  EXERCISE, makeExercise, checkAnswer, planSession, retryExercise, exerciseTypesFor,
} from '../src/services/quiz.mjs';

const words = [
  ['one', 'uno'], ['two', 'dos'], ['three', 'tres'], ['four', 'cuatro'], ['five', 'cinco'],
].map(([en, es]) => ({ key: en, type: 'word', en, es }));
const phrase = { key: 'p', type: 'phrase', en: 'Nice to meet you!', es: '¡Mucho gusto!' };
const seeded = () => { let x = 1; return () => (x = (x * 16807) % 2147483647) / 2147483647; };

test('multiple choice has 4 distinct options including the answer', () => {
  const ex = makeExercise(words[0], words, EXERCISE.CHOOSE_ES, seeded());
  assert.equal(ex.options.length, 4);
  assert.equal(new Set(ex.options).size, 4);
  assert.ok(ex.options.includes('uno'));
  assert.equal(ex.prompt, 'one');
  assert.ok(checkAnswer(ex, 'uno'));
  assert.ok(!checkAnswer(ex, 'dos'));
});

test('choose_en shows Spanish and expects English', () => {
  const ex = makeExercise(words[1], words, EXERCISE.CHOOSE_EN, seeded());
  assert.equal(ex.prompt, 'dos');
  assert.ok(checkAnswer(ex, 'two'));
});

test('build tiles contain every answer word and ignore punctuation and case', () => {
  const ex = makeExercise(phrase, [...words, phrase], EXERCISE.BUILD, seeded());
  for (const w of ['Nice', 'to', 'meet', 'you']) assert.ok(ex.tiles.includes(w));
  assert.ok(checkAnswer(ex, 'nice to meet you'));
  assert.ok(!checkAnswer(ex, 'meet to nice you'));
});

test('only multi-word cards get the build exercise', () => {
  assert.ok(!exerciseTypesFor(words[0]).includes(EXERCISE.BUILD));
  assert.ok(exerciseTypesFor(phrase).includes(EXERCISE.BUILD));
});

test('lesson plan introduces every card before quizzing it, once each', () => {
  const steps = planSession(words, words, { rng: seeded() });
  const intros = steps.filter(s => s.type === EXERCISE.INTRO);
  const quizzes = steps.filter(s => s.type !== EXERCISE.INTRO);
  assert.equal(intros.length, words.length);
  assert.equal(quizzes.length, words.length);
  for (const q of quizzes) {
    const introAt = steps.findIndex(s => s.type === EXERCISE.INTRO && s.card.key === q.card.key);
    assert.ok(introAt < steps.indexOf(q));
  }
});

test('retry uses a different exercise type for the same card', () => {
  const ex = makeExercise(words[0], words, EXERCISE.CHOOSE_ES, seeded());
  const retry = retryExercise(ex, words, seeded());
  assert.equal(retry.card.key, 'one');
  assert.notEqual(retry.type, EXERCISE.CHOOSE_ES);
});
