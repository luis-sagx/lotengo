// saflash — Pure placement test generation and scoring.
import { LEVELS } from '../utils/levels.mjs';
import { PLACEMENT_ITEMS } from '../seeds/placementItems.mjs';

const PASS_THRESHOLD = 2;

export function buildPlacementQuestions(items = PLACEMENT_ITEMS) {
  const seen = {};
  return LEVELS.flatMap(level => items.filter(i => i.level === level)).map(item => {
    seen[item.level] = (seen[item.level] || 0) + 1;
    return { id: `${item.level}-${seen[item.level] - 1}`, ...item, options: [...item.options] };
  });
}

// answersByLevel: { A1: [true, false, ...] } — "No sé" counts as false.
// Result: highest level passed with every level below it passed too.
export function scorePlacement(answersByLevel) {
  let highest = 'A1';
  for (const level of LEVELS) {
    const correct = (answersByLevel[level] || []).filter(Boolean).length;
    if (correct < PASS_THRESHOLD) break;
    highest = level;
  }
  return highest;
}
