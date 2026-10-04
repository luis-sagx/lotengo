// saflash — Sessions + config repository
import { getDatabase } from './database';
import { localDate, nextStreak, refillHearts, changeHearts } from '../services/gamification.mjs';

// ── Study Sessions ──────────────────────────

export async function saveSession(session) {
  const db = getDatabase();
  const xp = session.xp || 0;
  await db.runAsync(
    `INSERT INTO study_sessions
      (session_date, session_type, cards_studied, cards_correct, cards_medium, cards_hard, duration_secs, xp)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      localDate(),
      session.session_type,
      session.cards_studied,
      session.cards_correct,
      session.cards_medium,
      session.cards_hard,
      session.duration_secs,
      xp,
    ]
  );
  if (xp) {
    await db.runAsync('UPDATE user_config SET xp_total = COALESCE(xp_total, 0) + ? WHERE id = 1', [xp]);
  }
}

export async function getTodayXp() {
  const db = getDatabase();
  const row = await db.getFirstAsync(
    'SELECT COALESCE(SUM(xp), 0) AS xp FROM study_sessions WHERE session_date = ?',
    [localDate()]
  );
  return row?.xp || 0;
}

export async function getSessions(limit = 30) {
  const db = getDatabase();
  return db.getAllAsync(
    'SELECT * FROM study_sessions ORDER BY session_date DESC LIMIT ?',
    [limit]
  );
}

export async function getWeekStats() {
  const db = getDatabase();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

  const startDate = localDate(sevenDaysAgo);

  return db.getAllAsync(
    `SELECT session_date, SUM(cards_studied) as total_cards
     FROM study_sessions
     WHERE session_date >= ?
     GROUP BY session_date
     ORDER BY session_date ASC`,
    [startDate]
  );
}

// ── User Config ─────────────────────────────

export async function getConfig() {
  const db = getDatabase();
  return db.getFirstAsync('SELECT * FROM user_config WHERE id = 1');
}

export async function updateConfig(fields) {
  const db = getDatabase();
  const keys = Object.keys(fields);
  const setters = keys.map(k => `${k} = ?`).join(', ');
  const values = keys.map(k => fields[k]);

  await db.runAsync(
    `UPDATE user_config SET ${setters} WHERE id = 1`,
    values
  );
}

export async function setOnboardingDone() {
  return updateConfig({ onboarding_done: 1, first_launch: 0 });
}

export async function updateStreak() {
  const config = await getConfig();
  const today = localDate();
  const streak = nextStreak(config.last_study_date, today, config.streak_days);
  await updateConfig({ streak_days: streak, last_study_date: today });
  return streak;
}

// ── Hearts ──────────────────────────────────

export async function getHearts() {
  const config = await getConfig();
  return refillHearts({ hearts: config?.hearts, updatedAt: config?.hearts_updated_at });
}

export async function addHearts(delta) {
  const config = await getConfig();
  const next = changeHearts({ hearts: config?.hearts, updatedAt: config?.hearts_updated_at }, delta);
  await updateConfig({ hearts: next.hearts, hearts_updated_at: next.updatedAt });
  return next;
}

export async function incrementTotalStudied(count) {
  await getDatabase().runAsync(
    'UPDATE user_config SET total_studied = COALESCE(total_studied, 0) + ? WHERE id = 1',
    [count]
  );
}

export async function updateDailyGoal(goal) {
  await updateConfig({ daily_goal: goal });
}

export async function toggleNotifications(enabled) {
  await updateConfig({ notifications: enabled ? 1 : 0 });
}

export async function updateNotifHour(hour) {
  await updateConfig({ notif_hour: hour });
}

export async function setLevel(level) {
  return updateConfig({ level });
}

export async function setPlacementDone() {
  return updateConfig({ placement_done: 1 });
}

export async function setCurrentLesson(lessonId) {
  return updateConfig({ current_lesson_id: lessonId });
}

export async function dismissLevelSuggestion(completedCount) {
  return updateConfig({ suggestion_dismissed_at: completedCount });
}
