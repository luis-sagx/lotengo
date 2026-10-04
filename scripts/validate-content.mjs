// saflash — Content validator. Runs on the seed modules only, no database.
import { LEVELS } from '../src/utils/levels.mjs';
import { WORDS_BY_LEVEL, WORDS_SEED } from '../src/seeds/words/index.mjs';
import { PHRASES_BY_LEVEL, PHRASES_SEED } from '../src/seeds/phrases/index.mjs';
import { CAT_IMG } from '../src/seeds/wordExpander.mjs';
import { MIN_LESSON_SIZE } from '../src/curriculum/curriculum.mjs';
import { planLessons } from '../src/curriculum/curriculumBuilder.mjs';

const errors = [];

function check(condition, message) {
  if (!condition) errors.push(message);
}

const seenWords = new Map();
for (const w of WORDS_SEED) {
  const key = w.english_word.toLowerCase();
  check(!seenWords.has(key), `Duplicate word "${w.english_word}" (${seenWords.get(key)} and ${w.difficulty})`);
  seenWords.set(key, w.difficulty);
}

const seenPhrases = new Set();
for (const p of PHRASES_SEED) {
  const key = p.phrase_en.toLowerCase();
  check(!seenPhrases.has(key), `Duplicate phrase "${p.phrase_en}"`);
  seenPhrases.add(key);
}

for (const w of WORDS_SEED) {
  check(!!w.spanish_trans, `Word "${w.english_word}" has no translation`);
  check(!!w.category, `Word "${w.english_word}" has no category`);
  check(LEVELS.includes(w.difficulty), `Word "${w.english_word}" has invalid level "${w.difficulty}"`);
  check(!!CAT_IMG[w.category], `Category "${w.category}" (word "${w.english_word}") has no CAT_IMG entry`);
}

for (const p of PHRASES_SEED) {
  check(!!p.phrase_es, `Phrase "${p.phrase_en}" has no translation`);
  check(LEVELS.includes(p.difficulty), `Phrase "${p.phrase_en}" has invalid level "${p.difficulty}"`);
  check(!!CAT_IMG[p.category], `Category "${p.category}" (phrase "${p.phrase_en}") has no CAT_IMG entry`);
}

const ranks = WORDS_SEED.map(w => w.frequency_rank);
check(new Set(ranks).size === ranks.length, 'Duplicate frequency_rank among words');

const planned = planLessons(WORDS_BY_LEVEL, PHRASES_BY_LEVEL);
for (const l of planned.lessons) {
  const size = l.words.length + l.phrases.length;
  check(size >= MIN_LESSON_SIZE, `${l.level} ${l.category} lesson ${l.lesson_index + 1} has only ${size} cards`);
}

console.log('Words per level:', Object.fromEntries(LEVELS.map(l => [l, WORDS_BY_LEVEL[l].length])));
console.log('Phrases per level:', Object.fromEntries(LEVELS.map(l => [l, PHRASES_BY_LEVEL[l].length])));
console.log(`Lessons planned: ${planned.lessons.length} in ${new Set(planned.lessons.map(l => `${l.level}:${l.unit_index}`)).size} units`);
console.log(`Total: ${WORDS_SEED.length} words, ${PHRASES_SEED.length} phrases`);

if (errors.length) {
  console.error(`\n${errors.length} problem(s):`);
  for (const e of errors.slice(0, 50)) console.error('  -', e);
  if (errors.length > 50) console.error(`  ...and ${errors.length - 50} more`);
  process.exit(1);
}

console.log('\nContent valid');
