// Minimal expo-sqlite async API over node:sqlite, for tests.
import { DatabaseSync } from 'node:sqlite';

const databases = new Map();

function wrap(db) {
  const args = params => (Array.isArray(params) ? params : params === undefined ? [] : [params]);
  return {
    async execAsync(sql) { db.exec(sql); },
    async getFirstAsync(sql, params) { return db.prepare(sql).get(...args(params)) ?? null; },
    async getAllAsync(sql, params) { return db.prepare(sql).all(...args(params)); },
    async runAsync(sql, params) {
      const r = db.prepare(sql).run(...args(params));
      return { lastInsertRowId: Number(r.lastInsertRowid), changes: r.changes };
    },
    async withTransactionAsync(fn) {
      db.exec('BEGIN');
      try { await fn(); db.exec('COMMIT'); } catch (e) { db.exec('ROLLBACK'); throw e; }
    },
    async closeAsync() { db.close(); },
  };
}

// Same name returns the same in-memory database, like a file on a device.
export async function openDatabaseAsync(name) {
  if (!databases.has(name)) databases.set(name, wrap(new DatabaseSync(':memory:')));
  return databases.get(name);
}
