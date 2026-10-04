// saflash — User progress repository (SM-2 tracking)
import { getDatabase } from './database';

export async function getProgress(cardType, cardId) {
  const db = getDatabase();
  return db.getFirstAsync(
    `SELECT * FROM user_progress WHERE card_type = ? AND card_id = ?`,
    [cardType, cardId]
  );
}

export async function upsertProgress(cardType, cardId, progress) {
  const db = getDatabase();
  await db.runAsync(
    `INSERT INTO user_progress
      (card_type, card_id, status, ease_factor, interval_days, repetitions, next_review, last_review, correct_count, wrong_count)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(card_type, card_id) DO UPDATE SET
       status = excluded.status, ease_factor = excluded.ease_factor,
       interval_days = excluded.interval_days, repetitions = excluded.repetitions,
       next_review = excluded.next_review, last_review = excluded.last_review,
       correct_count = excluded.correct_count, wrong_count = excluded.wrong_count`,
    [
      cardType, cardId,
      progress.status, progress.ease_factor, progress.interval_days,
      progress.repetitions, progress.next_review, progress.last_review,
      progress.correct_count, progress.wrong_count,
    ]
  );
}

export async function getStudyStats() {
  const db = getDatabase();
  const stats = await db.getFirstAsync(`
    SELECT
      SUM(CASE WHEN status = 'new' THEN 1 ELSE 0 END) as new_count,
      SUM(CASE WHEN status = 'learning' THEN 1 ELSE 0 END) as learning_count,
      SUM(CASE WHEN status = 'reviewing' THEN 1 ELSE 0 END) as reviewing_count,
      SUM(CASE WHEN status = 'known' THEN 1 ELSE 0 END) as known_count,
      COUNT(*) as total_tracked
    FROM user_progress
  `);
  return {
    newCount: stats.new_count || 0,
    learningCount: stats.learning_count || 0,
    reviewingCount: stats.reviewing_count || 0,
    knownCount: stats.known_count || 0,
    totalTracked: stats.total_tracked || 0,
  };
}

export async function getTotalDueCount() {
  const db = getDatabase();
  const result = await db.getFirstAsync(
    `SELECT COUNT(*) as count FROM user_progress
     WHERE next_review <= date('now') AND status NOT IN ('new', 'known')`
  );
  return result.count || 0;
}

// Dictionary: words and phrases matching `query` in either language, or the
// most recently studied cards when the query is empty.
export async function searchCards(query, limit = 50) {
  const db = getDatabase();
  const term = query.trim();
  if (!term) {
    return db.getAllAsync(
      `SELECT up.card_type, up.card_id AS id, up.status,
              COALESCE(w.english_word, p.phrase_en) AS en,
              COALESCE(w.spanish_trans, p.phrase_es) AS es
       FROM user_progress up
       LEFT JOIN words w ON up.card_type = 'word' AND w.id = up.card_id
       LEFT JOIN phrases p ON up.card_type = 'phrase' AND p.id = up.card_id
       WHERE up.last_review IS NOT NULL
       ORDER BY up.last_review DESC
       LIMIT ?`,
      [limit]
    );
  }
  const like = `%${term}%`;
  return db.getAllAsync(
    `SELECT * FROM (
       SELECT 'word' AS card_type, id, english_word AS en, spanish_trans AS es, frequency_rank AS rank
       FROM words WHERE english_word LIKE ? OR spanish_trans LIKE ?
       UNION ALL
       SELECT 'phrase', id, phrase_en, phrase_es, 100000 + id
       FROM phrases WHERE phrase_en LIKE ? OR phrase_es LIKE ?
     ) ORDER BY rank LIMIT ?`,
    [like, like, like, like, limit]
  );
}

const CARD_COLUMNS = `
  COALESCE(w.english_word, p.phrase_en) AS en,
  COALESCE(w.spanish_trans, p.phrase_es) AS es,
  w.phonetic, w.example_en, w.example_es, w.image_url, w.enriched,
  COALESCE(w.category, p.category) AS category`;

// Due cards first; with nothing due, practice recently studied cards instead.
export async function getDueCards(limit = 15) {
  const db = getDatabase();
  const select = `SELECT up.card_type, up.card_id AS id, ${CARD_COLUMNS}
     FROM user_progress up
     LEFT JOIN words w ON up.card_type = 'word' AND w.id = up.card_id
     LEFT JOIN phrases p ON up.card_type = 'phrase' AND p.id = up.card_id`;
  const due = await db.getAllAsync(
    `${select}
     WHERE up.next_review <= date('now') AND up.status NOT IN ('new', 'known')
     ORDER BY up.next_review
     LIMIT ?`,
    [limit]
  );
  if (due.length) return due;
  return db.getAllAsync(
    `${select}
     WHERE up.last_review IS NOT NULL
     ORDER BY up.last_review DESC, RANDOM()
     LIMIT ?`,
    [limit]
  );
}

// Extra cards to draw wrong answers from.
export async function getDistractorCards(level, limit = 24) {
  const db = getDatabase();
  return db.getAllAsync(
    `SELECT * FROM (
       SELECT 'word' AS card_type, id, english_word AS en, spanish_trans AS es
       FROM words WHERE difficulty = ? ORDER BY RANDOM() LIMIT ?
     )
     UNION ALL
     SELECT * FROM (
       SELECT 'phrase', id, phrase_en, phrase_es
       FROM phrases WHERE difficulty = ? ORDER BY RANDOM() LIMIT ?
     )`,
    [level, limit, level, Math.ceil(limit / 3)]
  );
}

export async function getAchievementStats() {
  const db = getDatabase();
  const row = await db.getFirstAsync(`
    SELECT
      (SELECT COUNT(*) FROM user_progress WHERE card_type = 'word' AND status = 'known') AS known_words,
      (SELECT COUNT(*) FROM user_progress WHERE card_type = 'phrase' AND status = 'known') AS known_phrases,
      EXISTS (SELECT 1 FROM study_sessions
              WHERE session_type = 'lesson' AND cards_studied > 0 AND cards_correct = cards_studied) AS perfect
  `);
  return {
    knownWords: row?.known_words || 0,
    knownPhrases: row?.known_phrases || 0,
    perfectSession: row?.perfect === 1,
  };
}
