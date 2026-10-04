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

export async function toggleFavorite(cardType, cardId) {
  const db = getDatabase();
  const existing = await getProgress(cardType, cardId);
  const newValue = existing ? (existing.is_favorite ? 0 : 1) : 1;

  if (existing) {
    await db.runAsync(
      'UPDATE user_progress SET is_favorite = ? WHERE card_type = ? AND card_id = ?',
      [newValue, cardType, cardId]
    );
  } else {
    await db.runAsync(
      `INSERT INTO user_progress (card_type, card_id, is_favorite)
       VALUES (?, ?, ?)`,
      [cardType, cardId, newValue]
    );
  }
  return newValue;
}

export async function isFavorite(cardType, cardId) {
  const progress = await getProgress(cardType, cardId);
  return progress ? progress.is_favorite === 1 : false;
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

export async function getTodayStats() {
  const db = getDatabase();
  const today = new Date().toISOString().split('T')[0];
  const result = await db.getFirstAsync(
    `SELECT SUM(cards_studied) as today_cards
     FROM study_sessions
     WHERE session_date = ?`,
    [today]
  );
  return result.today_cards || 0;
}

export async function getDueCount(cardType) {
  const db = getDatabase();
  const result = await db.getFirstAsync(
    `SELECT COUNT(*) as count FROM user_progress
     WHERE card_type = ? AND next_review <= date('now') AND status != 'known'`,
    [cardType]
  );
  return result.count || 0;
}

export async function getNewCount(cardType) {
  const db = getDatabase();
  const table = cardType === 'word' ? 'words' : 'phrases';
  const result = await db.getFirstAsync(
    `SELECT COUNT(*) as count
     FROM ${table} w
     LEFT JOIN user_progress up ON up.card_id = w.id AND up.card_type = ?
     WHERE up.card_id IS NULL`,
    [cardType]
  );
  return result.count || 0;
}
