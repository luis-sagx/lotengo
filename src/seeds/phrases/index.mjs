// saflash — Phrase seed index: concatenates levels and assigns frequency ranks.
import { LEVELS } from '../../utils/levels.mjs';
import { expandPhrase } from '../wordExpander.mjs';
import { A1_PHRASES } from './a1.mjs';
import { A2_PHRASES } from './a2.mjs';
import { B1_PHRASES } from './b1.mjs';
import { B2_PHRASES } from './b2.mjs';
import { C1_PHRASES } from './c1.mjs';

export const PHRASES_COMPACT_BY_LEVEL = {
  A1: A1_PHRASES,
  A2: A2_PHRASES,
  B1: B1_PHRASES,
  B2: B2_PHRASES,
  C1: C1_PHRASES,
};

function build() {
  const byLevel = {};
  let rank = 1;
  for (const level of LEVELS) {
    byLevel[level] = PHRASES_COMPACT_BY_LEVEL[level].map(row =>
      expandPhrase(row, level, rank++)
    );
  }
  return byLevel;
}

export const PHRASES_BY_LEVEL = build();
export const PHRASES_SEED = LEVELS.flatMap(level => PHRASES_BY_LEVEL[level]);

export function phrasesForLevel(level) {
  return PHRASES_BY_LEVEL[level] || [];
}
