// saflash — Lessons repository: the guided path's persistence layer.
import { getDatabase } from './database';
import { LEVELS, levelIndex } from '../utils/levels.mjs';

const pathCache = new Map();
const BATCH = 100;

function invalidatePath() {
  pathCache.clear();
}

export async function persistCurriculum(plannedLessons) {
  const db = getDatabase();
  const wordRows = await db.getAllAsync('SELECT id, english_word FROM words');
  const phraseRows = await db.getAllAsync('SELECT id, phrase_en FROM phrases');
  const wordIds = new Map(wordRows.map(r => [r.english_word, r.id]));
  const phraseIds = new Map(phraseRows.map(r => [r.phrase_en, r.id]));

  const cardRows = [];
  const lessonIds = [];

  await db.withTransactionAsync(async () => {
    for (const lesson of plannedLessons) {
      const result = await db.runAsync(
        `INSERT INTO lessons
          (level, unit_index, lesson_index, unit_title, category, icon)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          lesson.level,
          lesson.unit_index,
          lesson.lesson_index,
          lesson.unit_title,
          lesson.category,
          lesson.icon,
        ]
      );
      const lessonId = result.lastInsertRowId;
      lessonIds.push(lessonId);

      const cards = [
        ...lesson.words.map(key => ['word', wordIds.get(key), key]),
        ...lesson.phrases.map(key => ['phrase', phraseIds.get(key), key]),
      ];
      cards.forEach(([type, id, key], position) => {
        if (id == null) throw new Error(`Missing ${type} for lesson: ${key}`);
        cardRows.push([lessonId, type, id, position]);
      });
    }

    for (let i = 0; i < cardRows.length; i += BATCH) {
      const batch = cardRows.slice(i, i + BATCH);
      await db.runAsync(
        `INSERT INTO lesson_cards (lesson_id, card_type, card_id, position)
         VALUES ${batch.map(() => '(?, ?, ?, ?)').join(', ')}`,
        batch.flat()
      );
    }
    for (let i = 0; i < lessonIds.length; i += BATCH) {
      const batch = lessonIds.slice(i, i + BATCH);
      await db.runAsync(
        `INSERT INTO lesson_progress (lesson_id, status)
         VALUES ${batch.map(() => "(?, 'locked')").join(', ')}`,
        batch
      );
    }
  });

  const created = lessonIds.length;
  invalidatePath();
  return created;
}

export function getPath(level) {
  if (!LEVELS.includes(level)) return Promise.resolve([]);
  if (pathCache.has(level)) return pathCache.get(level);

  const pending = loadPath(level).catch(error => {
    if (pathCache.get(level) === pending) pathCache.delete(level);
    throw error;
  });
  pathCache.set(level, pending);
  return pending;
}

async function loadPath(level) {
  const db = getDatabase();
  const rows = await db.getAllAsync(`
    SELECT l.id, l.level, l.unit_index, l.lesson_index, l.unit_title,
           l.category, l.icon,
           COALESCE(p.status, 'locked') AS status,
           COALESCE(p.stars, 0)         AS stars,
           COALESCE(p.accuracy, 0)      AS accuracy
    FROM lessons l
    LEFT JOIN lesson_progress p ON p.lesson_id = l.id
    WHERE l.level = ?
    ORDER BY l.unit_index, l.lesson_index
  `, [level]);

  const units = [];
  let current = null;
  for (const row of rows) {
    if (!current || current.level !== row.level || current.unit_index !== row.unit_index) {
      current = {
        level: row.level,
        unit_index: row.unit_index,
        unit_title: row.unit_title,
        icon: row.icon,
        lessons: [],
      };
      units.push(current);
    }
    current.lessons.push({
      id: row.id,
      level: row.level,
      unit_index: row.unit_index,
      lesson_index: row.lesson_index,
      category: row.category,
      status: row.status,
      stars: row.stars,
      accuracy: row.accuracy,
    });
  }
  return units;
}

export async function getLessonCards(lessonId) {
  const db = getDatabase();
  const [words, phrases] = await Promise.all([
    db.getAllAsync(
      `SELECT w.*, 'word' AS card_type, lc.position FROM lesson_cards lc
       JOIN words w ON w.id = lc.card_id
       WHERE lc.lesson_id = ? AND lc.card_type = 'word'`,
      [lessonId]
    ),
    db.getAllAsync(
      `SELECT p.*, 'phrase' AS card_type, lc.position FROM lesson_cards lc
       JOIN phrases p ON p.id = lc.card_id
       WHERE lc.lesson_id = ? AND lc.card_type = 'phrase'`,
      [lessonId]
    ),
  ]);
  return [...words, ...phrases].sort((a, b) => a.position - b.position);
}

export async function unlockUpTo(level) {
  const db = getDatabase();
  const allowed = LEVELS.slice(0, levelIndex(level) + 1);
  if (allowed.length === 0) return;

  const placeholders = allowed.map(() => '?').join(', ');

  await db.runAsync(
    `UPDATE lesson_progress SET status = 'unlocked'
     WHERE status = 'locked'
       AND lesson_id IN (SELECT id FROM lessons WHERE level IN (${placeholders}))`,
    allowed
  );

  await db.runAsync(
    `UPDATE lesson_progress SET status = 'locked'
     WHERE status = 'unlocked'
       AND lesson_id IN (SELECT id FROM lessons WHERE level NOT IN (${placeholders}))`,
    allowed
  );
  const current = await getCurrentLesson();
  if (!current) {
    const first = await db.getFirstAsync(
      `SELECT id FROM lessons WHERE level IN (${placeholders})
       ORDER BY level, unit_index, lesson_index LIMIT 1`,
      allowed
    );
    if (first) {
      await db.runAsync(
        "UPDATE lesson_progress SET status = 'unlocked' WHERE lesson_id = ? AND status = 'locked'",
        [first.id]
      );
    }
  }
  invalidatePath();
}

export async function completeLesson(lessonId, accuracy, stars) {
  const db = getDatabase();
  const today = new Date().toISOString().split('T')[0];

  await db.runAsync(
    `UPDATE lesson_progress
     SET status = 'completed',
         stars = MAX(stars, ?),
         accuracy = ?,
         completed_at = ?
     WHERE lesson_id = ?`,
    [stars, accuracy, today, lessonId]
  );
  invalidatePath();

  // Lessons are inserted in path order, so the next lesson is the next id.
  const next = await db.getFirstAsync(
    'SELECT id FROM lessons WHERE id > ? ORDER BY id LIMIT 1',
    [lessonId]
  );
  if (!next) return { nextLessonId: null };

  await db.runAsync(
    "UPDATE lesson_progress SET status = 'unlocked' WHERE lesson_id = ? AND status = 'locked'",
    [next.id]
  );
  return { nextLessonId: next.id };
}

export async function getCurrentLesson() {
  const db = getDatabase();
  const config = await db.getFirstAsync('SELECT current_lesson_id FROM user_config WHERE id = 1');
  if (config?.current_lesson_id) {
    const current = await db.getFirstAsync(`
      SELECT l.id, l.level, l.unit_index, l.lesson_index, l.category,
             COALESCE(p.status, 'locked') AS status,
             COALESCE(p.stars, 0) AS stars,
             COALESCE(p.accuracy, 0) AS accuracy
      FROM lessons l
      LEFT JOIN lesson_progress p ON p.lesson_id = l.id
      WHERE l.id = ? AND COALESCE(p.status, 'locked') != 'locked'
    `, [config.current_lesson_id]);
    if (current && current.status !== 'completed') return current;
  }

  return db.getFirstAsync(`
    SELECT l.id, l.level, l.unit_index, l.lesson_index, l.category,
           p.status, COALESCE(p.stars, 0) AS stars,
           COALESCE(p.accuracy, 0) AS accuracy
    FROM lessons l
    JOIN lesson_progress p ON p.lesson_id = l.id
    JOIN user_config c ON c.id = 1
    WHERE p.status = 'unlocked'
    ORDER BY CASE WHEN l.level = c.level THEN 0 ELSE 1 END,
             l.level, l.unit_index, l.lesson_index
    LIMIT 1
  `);
}

export async function getFirstLessonForLevel(level) {
  const db = getDatabase();
  return db.getFirstAsync(
    `SELECT id, level, unit_index, lesson_index, category
     FROM lessons
     WHERE level = ?
     ORDER BY unit_index, lesson_index
     LIMIT 1`,
    [level]
  );
}

export async function getRecentAccuracies(limit = 3) {
  const db = getDatabase();
  const rows = await db.getAllAsync(
    `SELECT accuracy FROM lesson_progress
     WHERE status = 'completed' AND completed_at IS NOT NULL
     ORDER BY completed_at DESC, lesson_id DESC
     LIMIT ?`,
    [limit]
  );
  return rows.map(r => r.accuracy);
}

export async function getCompletedCount() {
  const db = getDatabase();
  const row = await db.getFirstAsync(
    "SELECT COUNT(*) as count FROM lesson_progress WHERE status = 'completed'"
  );
  return row?.count ?? 0;
}
