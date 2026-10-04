import test from 'node:test';
import assert from 'node:assert/strict';
import './support/register.mjs';

const { initDatabase, getDatabase, markSeeded } = await import('../src/database/database.js');
const { runSeeds } = await import('../src/seeds/seedRunner.js');
const { answerCard, getDueCards } = await import('../src/database/progressRepository.js');
const { GRADE } = await import('../src/services/srs.mjs');

test('a content rebuild keeps progress and review history on the same cards', async () => {
  const first = await initDatabase();
  assert.equal(first.needsSeed, true);
  await runSeeds();
  const db = getDatabase();

  const hello = await db.getFirstAsync("SELECT id FROM words WHERE english_word = 'have'");
  await answerCard({ type: 'word', id: hello.id }, GRADE.GOOD);
  await answerCard({ type: 'word', id: hello.id }, GRADE.AGAIN);
  // A card that will disappear from the content.
  await db.runAsync("INSERT INTO words (english_word, spanish_trans, category, frequency_rank) VALUES ('zzgone', 'x', 'basics', 99999)");
  const gone = await db.getFirstAsync("SELECT id FROM words WHERE english_word = 'zzgone'");
  await answerCard({ type: 'word', id: gone.id }, GRADE.GOOD);

  // Simulate a new CONTENT_VERSION: shift ids so the remap has real work to do.
  await db.runAsync("UPDATE meta SET value = '0' WHERE key = 'content_version'");
  const second = await initDatabase();
  assert.equal(second.needsSeed, true);
  await db.runAsync("INSERT INTO words (english_word, spanish_trans, category, frequency_rank) VALUES ('zzfirst', 'x', 'basics', 0)");
  await runSeeds();

  const moved = await db.getFirstAsync("SELECT id FROM words WHERE english_word = 'have'");
  assert.notEqual(moved.id, hello.id);
  const progress = await db.getAllAsync("SELECT * FROM user_progress WHERE card_type = 'word'");
  assert.deepEqual(progress.map(p => p.card_id), [moved.id]);
  assert.equal(progress[0].reps, 2);
  const log = await db.getAllAsync("SELECT card_id FROM review_log WHERE card_type = 'word'");
  assert.deepEqual(log.map(l => l.card_id), [moved.id, moved.id]);
  assert.equal(await db.getFirstAsync("SELECT name FROM sqlite_master WHERE name = 'words_old'"), null);

  const third = await initDatabase();
  assert.equal(third.needsSeed, false);
  const due = await getDueCards(Date.now() + 3600000);
  assert.equal(due[0].en, 'have');
  assert.equal(due[0].id, moved.id);
  await markSeeded();
});
