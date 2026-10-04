// saflash — Core database initialization and schema
import * as SQLite from 'expo-sqlite';

let db = null;

// Bump when seed content or the path changes: content tables are rebuilt and
// user progress is remapped onto the new rows (see seedRunner.remapProgress).
export const CONTENT_VERSION = 6;
// Bump with a new MIGRATIONS entry when a user table changes. Databases from
// before migrations existed (user_version < 10) held only dev data and are reset.
const SCHEMA_BASE = 10;
const MIGRATIONS = []; // MIGRATIONS[i] upgrades schema SCHEMA_BASE + i to SCHEMA_BASE + i + 1
const SCHEMA_VERSION = SCHEMA_BASE + MIGRATIONS.length;
const LEGACY_TABLES = [
  'lesson_progress', 'lesson_cards', 'lessons', 'user_progress',
  'study_sessions', 'user_config', 'words', 'phrases',
];
const CONTENT_TABLES = ['lesson_progress', 'lesson_cards', 'lessons'];

export async function openDatabase() {
  if (db) return db;
  db = await SQLite.openDatabaseAsync('saflash.db');
  return db;
}

export function getDatabase() {
  if (!db) {
    throw new Error('Database not initialized. Call openDatabase() first.');
  }
  return db;
}

async function tableExists(database, name) {
  const row = await database.getFirstAsync(
    "SELECT 1 AS found FROM sqlite_master WHERE type = 'table' AND name = ?",
    [name]
  );
  return !!row;
}

export async function initDatabase() {
  const database = await openDatabase();

  await database.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
  `);

  const { user_version: schema } = await database.getFirstAsync('PRAGMA user_version');
  if (schema < SCHEMA_BASE) {
    await database.execAsync(LEGACY_TABLES.map(t => `DROP TABLE IF EXISTS ${t};`).join('\n'));
  } else {
    for (let v = schema; v < SCHEMA_VERSION; v += 1) {
      await database.execAsync(MIGRATIONS[v - SCHEMA_BASE]);
    }
  }

  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS meta (
      key   TEXT PRIMARY KEY,
      value TEXT
    );
  `);
  const contentRow = await database.getFirstAsync("SELECT value FROM meta WHERE key = 'content_version'");
  const needsSeed = Number(contentRow?.value) !== CONTENT_VERSION;
  if (needsSeed) {
    // Keep the old cards around so progress can be remapped after reseeding.
    // A previous interrupted rebuild already holds them in *_old.
    for (const table of ['words', 'phrases']) {
      if (await tableExists(database, `${table}_old`)) {
        await database.execAsync(`DROP TABLE IF EXISTS ${table};`);
      } else if (await tableExists(database, table)) {
        await database.execAsync(`ALTER TABLE ${table} RENAME TO ${table}_old;`);
      }
    }
    await database.execAsync(CONTENT_TABLES.map(t => `DROP TABLE IF EXISTS ${t};`).join('\n'));
  }

  // ── Words table ───────────────────────────
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS words (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      english_word    TEXT    NOT NULL,
      spanish_trans   TEXT    NOT NULL,
      phonetic        TEXT,
      category        TEXT    NOT NULL,
      subcategory     TEXT,
      frequency_rank  INTEGER NOT NULL,
      per_million     REAL    DEFAULT 0,
      difficulty      TEXT    DEFAULT 'A1',
      image_url       TEXT,
      audio_url       TEXT,
      example_en      TEXT,
      example_es      TEXT,
      definition_en   TEXT,
      enriched        INTEGER DEFAULT 0,
      is_seeded       INTEGER DEFAULT 1,
      created_at      TEXT    DEFAULT (datetime('now'))
    );
  `);

  // ── Phrases table ─────────────────────────
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS phrases (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      phrase_en       TEXT    NOT NULL,
      phrase_es       TEXT    NOT NULL,
      category        TEXT    NOT NULL,
      context         TEXT,
      difficulty      TEXT    DEFAULT 'A1',
      image_url       TEXT,
      audio_url       TEXT,
      is_seeded       INTEGER DEFAULT 1,
      created_at      TEXT    DEFAULT (datetime('now'))
    );
  `);

  // ── User progress: one FSRS card state per word/phrase ──
  // Times are epoch milliseconds; `state` is ts-fsrs State (0 new, 1 learning,
  // 2 review, 3 relearning).
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS user_progress (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      card_type       TEXT    NOT NULL,
      card_id         INTEGER NOT NULL,
      state           INTEGER DEFAULT 0,
      due             INTEGER,
      stability       REAL    DEFAULT 0,
      difficulty      REAL    DEFAULT 0,
      elapsed_days    INTEGER DEFAULT 0,
      scheduled_days  INTEGER DEFAULT 0,
      learning_steps  INTEGER DEFAULT 0,
      reps            INTEGER DEFAULT 0,
      lapses          INTEGER DEFAULT 0,
      last_review     INTEGER,
      correct_count   INTEGER DEFAULT 0,
      wrong_count     INTEGER DEFAULT 0,
      UNIQUE(card_type, card_id)
    );
  `);

  // ── Review log: every answer, for honest retention stats and future
  // per-user FSRS optimization ──
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS review_log (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      card_type       TEXT    NOT NULL,
      card_id         INTEGER NOT NULL,
      rating          INTEGER NOT NULL,
      state           INTEGER NOT NULL,
      reviewed_at     INTEGER NOT NULL,
      elapsed_days    INTEGER DEFAULT 0,
      scheduled_days  INTEGER DEFAULT 0,
      stability       REAL,
      difficulty      REAL,
      duration_ms     INTEGER,
      source          TEXT
    );
  `);

  // ── Study sessions table ──────────────────
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS study_sessions (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      session_date    TEXT    NOT NULL,
      session_type    TEXT    NOT NULL,
      cards_studied   INTEGER DEFAULT 0,
      cards_correct   INTEGER DEFAULT 0,
      cards_medium    INTEGER DEFAULT 0,
      cards_hard      INTEGER DEFAULT 0,
      duration_secs   INTEGER DEFAULT 0,
      created_at      TEXT    DEFAULT (datetime('now'))
    );
  `);

  // ── User config table ─────────────────────
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS user_config (
      id              INTEGER PRIMARY KEY DEFAULT 1,
      first_launch    INTEGER DEFAULT 1,
      streak_days     INTEGER DEFAULT 0,
      last_study_date TEXT,
      total_studied   INTEGER DEFAULT 0,
      onboarding_done INTEGER DEFAULT 0,
      notifications   INTEGER DEFAULT 1,
      notif_hour      INTEGER DEFAULT 9,
      level           TEXT    DEFAULT 'A1',
      placement_done  INTEGER DEFAULT 0,
      current_lesson_id INTEGER,
      suggestion_dismissed_at INTEGER DEFAULT -1,
      auto_speak      INTEGER DEFAULT 1,
      sound_effects   INTEGER DEFAULT 1,
      new_per_day     INTEGER DEFAULT 10,
      desired_retention REAL  DEFAULT 0.9,
      review_mode     TEXT    DEFAULT 'type',
      streak_freeze_at TEXT
    );
  `);

  // ── Lessons: the guided path ─────────────
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS lessons (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      level        TEXT    NOT NULL,
      unit_index   INTEGER NOT NULL,
      lesson_index INTEGER NOT NULL,
      unit_title   TEXT    NOT NULL,
      category     TEXT    NOT NULL,
      icon         TEXT,
      UNIQUE(level, unit_index, lesson_index)
    );
  `);

  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS lesson_cards (
      lesson_id  INTEGER NOT NULL REFERENCES lessons(id),
      card_type  TEXT    NOT NULL,
      card_id    INTEGER NOT NULL,
      position   INTEGER NOT NULL,
      PRIMARY KEY (lesson_id, position)
    );
  `);

  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS lesson_progress (
      lesson_id    INTEGER PRIMARY KEY REFERENCES lessons(id),
      status       TEXT    DEFAULT 'locked',
      stars        INTEGER DEFAULT 0,
      accuracy     REAL    DEFAULT 0,
      completed_at TEXT
    );
  `);

  // ── Indexes ───────────────────────────────
  await database.execAsync(`
    CREATE INDEX IF NOT EXISTS idx_words_category    ON words(category);
    CREATE INDEX IF NOT EXISTS idx_words_difficulty  ON words(difficulty);
    CREATE INDEX IF NOT EXISTS idx_words_frequency   ON words(frequency_rank);
    CREATE INDEX IF NOT EXISTS idx_phrases_category  ON phrases(category);
    CREATE INDEX IF NOT EXISTS idx_phrases_difficulty ON phrases(difficulty);
    CREATE INDEX IF NOT EXISTS idx_words_english     ON words(english_word);
    CREATE INDEX IF NOT EXISTS idx_sessions_date     ON study_sessions(session_date);
    CREATE INDEX IF NOT EXISTS idx_progress_due      ON user_progress(due);
    CREATE INDEX IF NOT EXISTS idx_progress_state    ON user_progress(state);
    CREATE INDEX IF NOT EXISTS idx_review_log_time   ON review_log(reviewed_at);
    CREATE INDEX IF NOT EXISTS idx_review_log_card   ON review_log(card_type, card_id);
    CREATE INDEX IF NOT EXISTS idx_lessons_level     ON lessons(level, unit_index, lesson_index);
    CREATE INDEX IF NOT EXISTS idx_lesson_cards      ON lesson_cards(lesson_id, position);
    CREATE INDEX IF NOT EXISTS idx_lesson_prog_stat  ON lesson_progress(status);
  `);

  // Ensure user_config row exists
  const configRow = await database.getFirstAsync(
    'SELECT id FROM user_config WHERE id = 1'
  );
  if (!configRow) {
    await database.runAsync(
      'INSERT INTO user_config (id) VALUES (1)'
    );
  }

  await database.execAsync(`PRAGMA user_version = ${SCHEMA_VERSION}`);
  return { database, needsSeed };
}

export async function markSeeded() {
  await getDatabase().runAsync(
    "INSERT OR REPLACE INTO meta (key, value) VALUES ('content_version', ?)",
    [String(CONTENT_VERSION)]
  );
}

export async function closeDatabase() {
  if (db) {
    await db.closeAsync();
    db = null;
  }
}
