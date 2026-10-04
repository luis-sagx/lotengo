// saflash — Seed runner: populates SQLite and builds the lesson path.
import { getDatabase, markSeeded } from '../database/database';
import { LEVELS } from '../utils/levels.mjs';
import { WORDS_BY_LEVEL } from './words/index.mjs';
import { PHRASES_BY_LEVEL } from './phrases/index.mjs';
import { planLessons } from '../curriculum/curriculumBuilder.mjs';
import { persistCurriculum, restoreLessonProgress } from '../database/lessonsRepository';
import { formatCategoryName } from '../utils/formatters';
import { getCategoryEmoji } from '../utils/emojiMap';

const BATCH = 100;

// Runs on a fresh database or when CONTENT_VERSION changes. The previous cards
// wait in words_old/phrases_old (see initDatabase) until progress is remapped.
export async function runSeeds() {
  const db = getDatabase();

  for (const level of LEVELS) {
    await seedWordsForLevel(db, level);
    await seedPhrasesForLevel(db, level);
  }

  await buildPath();
  await remapProgress(db, 'word', 'words', 'english_word');
  await remapProgress(db, 'phrase', 'phrases', 'phrase_en');
  await restoreLessonProgress();
  await markSeeded();
}

// Points progress and review history at the new row with the same text and
// drops rows whose card no longer exists.
async function remapProgress(db, type, table, textColumn) {
  const old = `${table}_old`;
  const found = await db.getFirstAsync(
    "SELECT 1 AS found FROM sqlite_master WHERE type = 'table' AND name = ?",
    [old]
  );
  if (!found) return;

  const mapping = `SELECT o.id AS old_id, MIN(n.id) AS new_id
    FROM ${old} o JOIN ${table} n ON lower(n.${textColumn}) = lower(o.${textColumn})
    GROUP BY o.id`;
  await db.withTransactionAsync(async () => {
    for (const target of ['user_progress', 'review_log']) {
      // Move to negative ids first so no row collides with UNIQUE(card_type, card_id)
      // of a row that has not moved yet; whatever stays positive had no match.
      await db.runAsync(
        `UPDATE OR IGNORE ${target}
         SET card_id = -(SELECT new_id FROM (${mapping}) WHERE old_id = ${target}.card_id)
         WHERE card_type = ? AND card_id IN (SELECT old_id FROM (${mapping}))`,
        [type]
      );
      await db.runAsync(`DELETE FROM ${target} WHERE card_type = ? AND card_id > 0`, [type]);
      await db.runAsync(`UPDATE ${target} SET card_id = -card_id WHERE card_type = ?`, [type]);
    }
  });
  await db.execAsync(`DROP TABLE ${old};`);
}

async function seedWordsForLevel(db, level) {
  const existingRows = await db.getAllAsync(
    'SELECT english_word FROM words WHERE difficulty = ?',
    [level]
  );
  const existing = new Set(existingRows.map(row => row.english_word.toLowerCase()));
  const words = (WORDS_BY_LEVEL[level] || []).filter(
    word => !existing.has(word.english_word.toLowerCase())
  );
  if (words.length === 0) return;

  console.log(`Seeding ${words.length} ${level} words...`);
  await db.withTransactionAsync(async () => {
    for (let i = 0; i < words.length; i += BATCH) {
      const batch = words.slice(i, i + BATCH);
      const placeholders = batch.map(() => '(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').join(', ');
      const values = batch.flatMap(w => [
        w.english_word, w.spanish_trans, w.phonetic || null,
        w.category, w.subcategory || null, w.frequency_rank,
        w.difficulty, w.image_url || null, w.audio_url || null,
        w.example_en || null, w.example_es || null,
      ]);
      await db.runAsync(
        `INSERT INTO words
          (english_word, spanish_trans, phonetic, category, subcategory,
           frequency_rank, difficulty, image_url, audio_url, example_en, example_es)
         VALUES ${placeholders}`,
        values
      );
    }
  });
}

async function seedPhrasesForLevel(db, level) {
  const existingRows = await db.getAllAsync(
    'SELECT phrase_en FROM phrases WHERE difficulty = ?',
    [level]
  );
  const existing = new Set(existingRows.map(row => row.phrase_en.toLowerCase()));
  const phrases = (PHRASES_BY_LEVEL[level] || []).filter(
    phrase => !existing.has(phrase.phrase_en.toLowerCase())
  );
  if (phrases.length === 0) return;

  console.log(`Seeding ${phrases.length} ${level} phrases...`);
  await db.withTransactionAsync(async () => {
    for (let i = 0; i < phrases.length; i += BATCH) {
      const batch = phrases.slice(i, i + BATCH);
      const placeholders = batch.map(() => '(?, ?, ?, ?, ?, ?, ?)').join(', ');
      const values = batch.flatMap(p => [
        p.phrase_en, p.phrase_es, p.category,
        p.context || null, p.difficulty,
        p.image_url || null, p.audio_url || null,
      ]);
      await db.runAsync(
        `INSERT INTO phrases
          (phrase_en, phrase_es, category, context, difficulty, image_url, audio_url)
         VALUES ${placeholders}`,
        values
      );
    }
  });
}

async function buildPath() {
  const { lessons } = planLessons(WORDS_BY_LEVEL, PHRASES_BY_LEVEL, {
    titleOf: formatCategoryName,
    iconOf: getCategoryEmoji,
  });

  const created = await persistCurriculum(lessons);
  console.log(`Path built: ${created} lessons`);
}
