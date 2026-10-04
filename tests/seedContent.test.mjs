import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LEVELS } from '../src/utils/levels.mjs';
import { WORDS_BY_LEVEL, WORDS_SEED } from '../src/seeds/words/index.mjs';
import { PHRASES_BY_LEVEL, PHRASES_SEED } from '../src/seeds/phrases/index.mjs';
import { CAT_IMG } from '../src/seeds/wordExpander.mjs';
import { MIN_LESSON_SIZE } from '../src/curriculum/curriculum.mjs';
import { planLessons } from '../src/curriculum/curriculumBuilder.mjs';

test('has no duplicate word or phrase keys across levels', () => {
  const wordKeys = WORDS_SEED.map(word => word.english_word.toLowerCase());
  const phraseKeys = PHRASES_SEED.map(phrase => phrase.phrase_en.toLowerCase());

  assert.equal(new Set(wordKeys).size, wordKeys.length);
  assert.equal(new Set(phraseKeys).size, phraseKeys.length);
});

test('provides category imagery and required fields for all seed records', () => {
  for (const word of WORDS_SEED) {
    assert.ok(word.english_word);
    assert.ok(word.spanish_trans);
    assert.ok(word.category);
    assert.ok(LEVELS.includes(word.difficulty));
    assert.ok(CAT_IMG[word.category], `Missing CAT_IMG for ${word.category}`);
  }

  for (const phrase of PHRASES_SEED) {
    assert.ok(phrase.phrase_en);
    assert.ok(phrase.phrase_es);
    assert.ok(phrase.category);
    assert.ok(LEVELS.includes(phrase.difficulty));
    assert.ok(CAT_IMG[phrase.category], `Missing CAT_IMG for ${phrase.category}`);
  }
});

test('contains no generated filler content', () => {
  const filler = /\b(a1|a2|b1|b2|c1)\s+\d+\b/i;
  for (const word of WORDS_SEED) {
    assert.doesNotMatch(word.english_word, filler, word.english_word);
    assert.notEqual(word.phonetic, `/${word.english_word}/`, word.english_word);
  }
  for (const phrase of PHRASES_SEED) {
    assert.doesNotMatch(phrase.phrase_en, filler, phrase.phrase_en);
  }
});

test('plans every seed card into exactly one lesson of usable size', () => {
  const { lessons } = planLessons(WORDS_BY_LEVEL, PHRASES_BY_LEVEL);
  const words = lessons.flatMap(lesson => lesson.words);
  const phrases = lessons.flatMap(lesson => lesson.phrases);

  for (const lesson of lessons) {
    assert.ok(lesson.words.length + lesson.phrases.length >= MIN_LESSON_SIZE);
  }
  assert.equal(new Set(words).size, words.length);
  assert.equal(new Set(phrases).size, phrases.length);
  assert.equal(words.length, WORDS_SEED.length);
  assert.equal(phrases.length, PHRASES_SEED.length);
});

test('starts the path with greetings for absolute beginners', () => {
  const { lessons } = planLessons(WORDS_BY_LEVEL, PHRASES_BY_LEVEL);
  assert.equal(lessons[0].level, 'A1');
  assert.equal(lessons[0].category, 'greetings');
});

test('most words come with a real, translated example that contains them', () => {
  const withExample = WORDS_SEED.filter(word => word.example_en);
  assert.ok(withExample.length / WORDS_SEED.length > 0.8, `${withExample.length}/${WORDS_SEED.length}`);
  for (const word of withExample) {
    assert.ok(word.example_es, word.english_word);
    assert.doesNotMatch(word.example_en, /^The word "/, word.english_word);
    assert.match(word.example_en.toLowerCase(), new RegExp(`\\b${word.english_word.toLowerCase()}\\b`), word.english_word);
  }
});

test('each level lists its most frequent words first', () => {
  const a1 = WORDS_BY_LEVEL.A1.map(word => word.english_word);
  assert.ok(a1.indexOf('you') < a1.indexOf('tomato'));
  assert.ok(a1.indexOf('you') < 5);
});
