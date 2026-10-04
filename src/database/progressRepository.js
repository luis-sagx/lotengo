// saflash — User progress repository (FSRS card state + review log)
import { getDatabase } from './database';
import { review, MATURE_DAYS } from '../services/srs.mjs';
import { restoreLessonProgress } from './lessonsRepository';

export async function getProgress(cardType, cardId) {
  const db = getDatabase();
  return db.getFirstAsync(
    `SELECT * FROM user_progress WHERE card_type = ? AND card_id = ?`,
    [cardType, cardId]
  );
}

const PROGRESS_FIELDS = [
  'state', 'due', 'stability', 'difficulty', 'elapsed_days', 'scheduled_days',
  'learning_steps', 'reps', 'lapses', 'last_review', 'correct_count', 'wrong_count',
];

// Schedules `card` with `grade` and logs the answer. Returns the new progress.
export async function answerCard(card, grade, { retention, durationMs = null, source = 'review' } = {}) {
  const db = getDatabase();
  const current = await getProgress(card.type, card.id);
  const { progress, log } = review(current, grade, { retention });
  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `INSERT INTO user_progress (card_type, card_id, ${PROGRESS_FIELDS.join(', ')})
       VALUES (?, ?, ${PROGRESS_FIELDS.map(() => '?').join(', ')})
       ON CONFLICT(card_type, card_id) DO UPDATE SET
         ${PROGRESS_FIELDS.map(f => `${f} = excluded.${f}`).join(', ')}`,
      [card.type, card.id, ...PROGRESS_FIELDS.map(f => progress[f])]
    );
    await db.runAsync(
      `INSERT INTO review_log
        (card_type, card_id, rating, state, reviewed_at, elapsed_days, scheduled_days,
         stability, difficulty, duration_ms, source)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        card.type, card.id, log.rating, log.state, log.reviewed_at, log.elapsed_days,
        log.scheduled_days, log.stability, log.difficulty, durationMs, source,
      ]
    );
  });
  return progress;
}

// Learning = learning/relearning steps; reviewing = in review but not mature yet;
// known = mature (stability of at least MATURE_DAYS).
export async function getStudyStats() {
  const db = getDatabase();
  const stats = await db.getFirstAsync(`
    SELECT
      SUM(CASE WHEN state IN (1, 3) THEN 1 ELSE 0 END) as learning_count,
      SUM(CASE WHEN state = 2 AND stability < ? THEN 1 ELSE 0 END) as reviewing_count,
      SUM(CASE WHEN state = 2 AND stability >= ? THEN 1 ELSE 0 END) as known_count,
      COUNT(*) as total_tracked
    FROM user_progress
  `, [MATURE_DAYS, MATURE_DAYS]);
  return {
    learningCount: stats.learning_count || 0,
    reviewingCount: stats.reviewing_count || 0,
    knownCount: stats.known_count || 0,
    totalTracked: stats.total_tracked || 0,
  };
}

// Cards due before `until` (epoch ms; usually the end of the learner's day).
export async function getTotalDueCount(until) {
  const db = getDatabase();
  const result = await db.getFirstAsync(
    'SELECT COUNT(*) as count FROM user_progress WHERE due <= ?',
    [until]
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
      `SELECT up.card_type, up.card_id AS id, up.state,
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
  w.phonetic, w.example_en, w.example_es, w.image_url, w.audio_url, w.enriched, w.definition_en, p.context,
  COALESCE(w.category, p.category) AS category`;

const CARD_JOIN = `
  FROM user_progress up
  LEFT JOIN words w ON up.card_type = 'word' AND w.id = up.card_id
  LEFT JOIN phrases p ON up.card_type = 'phrase' AND p.id = up.card_id`;

// Cards due before `until`, most overdue first, with their progress row.
export async function getDueCards(until, limit = 200) {
  const db = getDatabase();
  return db.getAllAsync(
    `SELECT up.*, up.card_type, up.card_id AS id, ${CARD_COLUMNS} ${CARD_JOIN}
     WHERE up.due <= ?
     ORDER BY up.due
     LIMIT ?`,
    [until, limit]
  );
}

// Extra practice when nothing is due: recently studied cards. Practice never
// changes the schedule.
export async function getPracticeCards(limit = 20) {
  const db = getDatabase();
  return db.getAllAsync(
    `SELECT up.card_type, up.card_id AS id, ${CARD_COLUMNS} ${CARD_JOIN}
     WHERE up.last_review IS NOT NULL
     ORDER BY up.last_review DESC, RANDOM()
     LIMIT ?`,
    [limit]
  );
}

// Unseen cards from `level` up, easiest level and most frequent first.
// CEFR codes sort correctly as text (A1 < A2 < B1 < B2 < C1).
export async function getNewCards(level, limit) {
  const db = getDatabase();
  const [words, phrases] = await Promise.all([
    db.getAllAsync(
      `SELECT 'word' AS card_type, w.id, w.english_word AS en, w.spanish_trans AS es,
              w.phonetic, w.example_en, w.example_es, w.image_url, w.audio_url, w.enriched, w.definition_en,
              NULL AS context, w.category
       FROM words w
       LEFT JOIN user_progress up ON up.card_type = 'word' AND up.card_id = w.id
       WHERE up.id IS NULL AND w.difficulty >= ?
       ORDER BY w.difficulty, w.frequency_rank
       LIMIT ?`,
      [level, limit]
    ),
    db.getAllAsync(
      `SELECT 'phrase' AS card_type, p.id, p.phrase_en AS en, p.phrase_es AS es,
              p.context, p.image_url, p.category
       FROM phrases p
       LEFT JOIN user_progress up ON up.card_type = 'phrase' AND up.card_id = p.id
       WHERE up.id IS NULL AND p.difficulty >= ?
       ORDER BY p.difficulty, p.id
       LIMIT ?`,
      [level, limit]
    ),
  ]);
  return { words, phrases };
}

// Cards answered for the first time since `since` (epoch ms).
export async function getNewCardsSince(since) {
  const db = getDatabase();
  const row = await db.getFirstAsync(
    `SELECT COUNT(*) AS count FROM (
       SELECT MIN(reviewed_at) AS first FROM review_log GROUP BY card_type, card_id
     ) WHERE first >= ?`,
    [since]
  );
  return row?.count || 0;
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
      (SELECT COUNT(*) FROM user_progress WHERE card_type = 'word' AND state = 2 AND stability >= ?) AS known_words,
      (SELECT COUNT(*) FROM user_progress WHERE card_type = 'phrase' AND state = 2 AND stability >= ?) AS known_phrases,
      EXISTS (SELECT 1 FROM study_sessions
              WHERE session_type = 'lesson' AND cards_studied > 0 AND cards_correct = cards_studied) AS perfect
  `, [MATURE_DAYS, MATURE_DAYS]);
  return {
    knownWords: row?.known_words || 0,
    knownPhrases: row?.known_phrases || 0,
    perfectSession: row?.perfect === 1,
  };
}

// Forgets every answer, session and streak; settings and level stay.
export async function resetAllProgress() {
  const db = getDatabase();
  await db.withTransactionAsync(async () => {
    await db.execAsync(`
      DELETE FROM user_progress;
      DELETE FROM review_log;
      DELETE FROM study_sessions;
      UPDATE lesson_progress SET status = 'locked', stars = 0, accuracy = 0, completed_at = NULL;
      UPDATE user_config SET streak_days = 0, last_study_date = NULL, streak_freeze_at = NULL,
        total_studied = 0 WHERE id = 1;
    `);
  });
  await restoreLessonProgress();
}

// Every progress row with its word's frequency, for retention and coverage.
export async function getMemoryRows() {
  return getDatabase().getAllAsync(
    `SELECT up.*, COALESCE(w.per_million, 0) AS per_million
     FROM user_progress up
     LEFT JOIN words w ON up.card_type = 'word' AND w.id = up.card_id`
  );
}

// Grades given to cards that were in review (not learning) since `since`.
export async function getReviewRatings(since) {
  const rows = await getDatabase().getAllAsync(
    'SELECT rating FROM review_log WHERE state = 2 AND reviewed_at >= ?',
    [since]
  );
  return rows.map(r => r.rating);
}

export async function getDueTimes(until) {
  const rows = await getDatabase().getAllAsync('SELECT due FROM user_progress WHERE due <= ?', [until]);
  return rows.map(r => r.due);
}
