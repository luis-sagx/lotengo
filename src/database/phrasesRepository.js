// saflash — Phrases repository
import { getDatabase } from './database';

export async function getTotalPhrasesCount() {
  const db = getDatabase();
  const result = await db.getFirstAsync('SELECT COUNT(*) as total FROM phrases');
  return result.total;
}
