// saflash — Word seed index: concatenates levels and assigns frequency ranks.
import { LEVELS } from '../../utils/levels.mjs';
import { expandWord } from '../wordExpander.mjs';
import { A1_WORDS } from './a1.mjs';
import { A2_WORDS } from './a2.mjs';
import { B1_WORDS } from './b1.mjs';
import { B2_WORDS } from './b2.mjs';
import { C1_WORDS } from './c1.mjs';

export const WORDS_COMPACT_BY_LEVEL = {
  A1: A1_WORDS,
  A2: A2_WORDS,
  B1: B1_WORDS,
  B2: B2_WORDS,
  C1: C1_WORDS,
};

function build() {
  const byLevel = {};
  let rank = 1;
  for (const level of LEVELS) {
    byLevel[level] = WORDS_COMPACT_BY_LEVEL[level].map(row =>
      expandWord(row, level, rank++)
    );
  }
  return byLevel;
}

export const WORDS_BY_LEVEL = build();
export const WORDS_SEED = LEVELS.flatMap(level => WORDS_BY_LEVEL[level]);

export function wordsForLevel(level) {
  return WORDS_BY_LEVEL[level] || [];
}
