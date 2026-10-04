// saflash — Phrases repository
import { getDatabase } from './database';

export async function getTotalPhrasesCount() {
  const db = getDatabase();
  const result = await db.getFirstAsync('SELECT COUNT(*) as total FROM phrases');
  return result.total;
}

export async function getKnownPhrasesCount() {
  const db = getDatabase();
  const result = await db.getFirstAsync(
    `SELECT COUNT(*) as total FROM user_progress
     WHERE card_type = 'phrase' AND status = 'known'`
  );
  return result.total;
}
