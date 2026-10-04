// saflash — Words repository
import { getDatabase } from './database';

export async function getTotalWordsCount() {
  const db = getDatabase();
  const result = await db.getFirstAsync('SELECT COUNT(*) as total FROM words');
  return result.total;
}
