// saflash — Turns seed content into planned lessons, one unit per category.
import { LEVELS } from '../utils/levels.mjs';
import {
  LESSON_SIZE,
  MIN_LESSON_SIZE,
  MIXED_CATEGORY,
  CATEGORY_ORDER,
} from './curriculum.mjs';

function sortByRank(items) {
  return [...items].sort((a, b) => (a.frequency_rank || 0) - (b.frequency_rank || 0));
}

function orderOf(category) {
  if (category === MIXED_CATEGORY) return Infinity;
  const index = CATEGORY_ORDER.indexOf(category);
  return index === -1 ? CATEGORY_ORDER.length : index;
}

// Chunks cards into lessons of LESSON_SIZE; a short tail joins the last lesson.
export function chunkLessons(cards) {
  const chunks = [];
  for (let i = 0; i < cards.length; i += LESSON_SIZE) {
    chunks.push(cards.slice(i, i + LESSON_SIZE));
  }
  const tail = chunks[chunks.length - 1];
  if (chunks.length > 1 && tail.length < MIN_LESSON_SIZE) {
    chunks.pop();
    chunks[chunks.length - 1].push(...tail);
  }
  return chunks;
}

function groupLevel(words, phrases) {
  const groups = new Map();
  const add = (category, card) => {
    if (!groups.has(category)) groups.set(category, []);
    groups.get(category).push(card);
  };

  for (const w of sortByRank(words)) {
    add(w.category, { type: 'word', key: w.english_word });
  }
  for (const p of sortByRank(phrases)) {
    add(p.category, { type: 'phrase', key: p.phrase_en });
  }

  const mixed = groups.get(MIXED_CATEGORY) || [];
  groups.delete(MIXED_CATEGORY);
  for (const [category, cards] of groups) {
    if (cards.length < MIN_LESSON_SIZE) {
      mixed.push(...cards);
      groups.delete(category);
    }
  }
  if (mixed.length >= MIN_LESSON_SIZE) groups.set(MIXED_CATEGORY, mixed);

  return [...groups.entries()].sort((a, b) => orderOf(a[0]) - orderOf(b[0]));
}

export function planLessons(wordsByLevel, phrasesByLevel, { titleOf = c => c, iconOf = () => null } = {}) {
  const lessons = [];

  for (const level of LEVELS) {
    const units = groupLevel(wordsByLevel[level] || [], phrasesByLevel[level] || []);

    units.forEach(([category, cards], unitIndex) => {
      chunkLessons(cards).forEach((chunk, lessonIndex) => {
        lessons.push({
          level,
          unit_index: unitIndex,
          lesson_index: lessonIndex,
          unit_title: titleOf(category),
          category,
          icon: iconOf(category),
          words: chunk.filter(c => c.type === 'word').map(c => c.key),
          phrases: chunk.filter(c => c.type === 'phrase').map(c => c.key),
        });
      });
    });
  }

  return { lessons };
}
