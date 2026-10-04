// saflash — Word enrichment service
// Replaces template placeholder data with REAL English content using the free,
// no-key Free Dictionary API (dictionaryapi.dev): real phonetics, a real
// definition, a real example sentence, and a real human audio pronunciation.
// A real photo is fetched in parallel from Wikipedia. Everything is written
// back to SQLite so each word is enriched only once and works offline after.

import { getDatabase } from '../database/database';
import { getWordImageUri } from './imageService';

const DICT_URL = 'https://api.dictionaryapi.dev/api/v2/entries/en/';

// Categories whose words are concrete "things" — a real photo genuinely helps
// and is reliably relevant. For everything else (verbs, colors, emotions,
// adjectives, abstract nouns…) a clear emoji is better than any photo and is
// instant + offline, so we skip the network entirely. (This gating was driven
// by real testing: photos for abstract words were missing or irrelevant.)
const CONCRETE_CATEGORIES = new Set([
  'animals',
  'food_drink',
  'nature',
  'home',
  'clothing',
  'transport',
  'body',
  'health',
  'technology',
  'sports',
  'travel',
  'shopping',
  'education',
  'work_business',
]);

// Prevents duplicate concurrent fetches for the same word id.
const inflight = new Map();

async function fetchWithTimeout(url, ms = 7000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
  } finally {
    clearTimeout(timer);
  }
}

/** Extracts the useful fields from a dictionaryapi.dev response array. */
function parseDictionary(json) {
  if (!Array.isArray(json) || json.length === 0) return null;
  const out = { phonetic: null, audio_url: null, definition_en: null, example_en: null };

  for (const entry of json) {
    // Phonetic text and audio can live in several places.
    if (!out.phonetic && entry.phonetic) out.phonetic = entry.phonetic;
    for (const ph of entry.phonetics || []) {
      if (!out.phonetic && ph.text) out.phonetic = ph.text;
      if (!out.audio_url && ph.audio) {
        // Prefer US audio when several are available.
        if (ph.audio.includes('-us.') || !out.audio_url) out.audio_url = ph.audio;
      }
    }
    for (const meaning of entry.meanings || []) {
      for (const def of meaning.definitions || []) {
        if (!out.definition_en && def.definition) out.definition_en = def.definition;
        if (!out.example_en && def.example) out.example_en = def.example;
      }
    }
  }
  // Some audio URLs come protocol-relative (//...). Normalize to https.
  if (out.audio_url && out.audio_url.startsWith('//')) {
    out.audio_url = `https:${out.audio_url}`;
  }
  return out;
}

async function doEnrich(word) {
  const term = (word.english_word || '').toLowerCase().trim();

  // Only chase a real photo for concrete categories; abstract words use emoji.
  const wantsImage = CONCRETE_CATEGORIES.has(word.category);

  // Fetch dictionary data and (maybe) image in parallel; neither blocks the other.
  // The image promise distinguishes "no image" (resolves null) from a transient
  // failure (rejects), so we know whether retrying later could still help.
  // dictResult: null = transient failure, { data: null } = word not in dictionary.
  const [dictResult, imageResult] = await Promise.all([
    fetchWithTimeout(`${DICT_URL}${encodeURIComponent(term)}`)
      .then(r => {
        if (r.status === 404) return { data: null };
        return r.ok ? r.json().then(json => ({ data: parseDictionary(json) })) : null;
      })
      .catch(() => null),
    wantsImage
      ? getWordImageUri(term).then(
          uri => ({ uri, transient: false }),
          () => ({ uri: null, transient: true })
        )
      : Promise.resolve({ uri: null, transient: false }),
  ]);

  const newImage = imageResult.uri;

  // What might still improve on a later attempt?
  const dict = dictResult?.data || null;
  const dictPending = !dictResult; // transient failure; a 404 is final
  const imagePending = wantsImage && !newImage && imageResult.transient; // 429 etc.

  // If we gained nothing this time, don't touch the row — let it retry later.
  const gainedSomething = !!dictResult || (!!newImage && newImage !== word.image_url);
  if (!gainedSomething && (dictPending || imagePending)) return word;

  const merged = {
    ...word,
    phonetic: dict?.phonetic || word.phonetic || null,
    audio_url: dict?.audio_url || word.audio_url || null,
    definition_en: dict?.definition_en || word.definition_en || null,
    example_en: dict?.example_en || word.example_en || null,
    image_url: newImage || word.image_url || null,
    // Finalize only when nothing useful remains to fetch.
    enriched: !dictPending && !imagePending ? 1 : 0,
  };

  try {
    const db = getDatabase();
    await db.runAsync(
      `UPDATE words
         SET phonetic = ?, audio_url = ?, definition_en = ?,
             example_en = ?, image_url = ?, enriched = ?
       WHERE id = ?`,
      [
        merged.phonetic,
        merged.audio_url,
        merged.definition_en,
        merged.example_en,
        merged.image_url,
        merged.enriched,
        word.id,
      ]
    );
  } catch {
    // If persistence fails we still return the in-memory enrichment.
  }

  return merged;
}

/**
 * Enriches a single word row with real content, caching to SQLite.
 * Returns the (possibly) updated row. Safe to call repeatedly: it no-ops once
 * the word is already enriched and de-dupes concurrent calls.
 */
export async function enrichWord(word) {
  if (!word || !word.id) return word;
  if (word.enriched) return word;
  if (inflight.has(word.id)) return inflight.get(word.id);

  const promise = doEnrich(word);
  inflight.set(word.id, promise);
  try {
    return await promise;
  } finally {
    inflight.delete(word.id);
  }
}

export default enrichWord;
