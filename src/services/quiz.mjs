// saflash — Pure quiz engine: turns cards into objective exercises.
// A card is { key, type: 'word'|'phrase', en, es }.

export const EXERCISE = {
  INTRO: 'intro',         // present a new card, no answer
  CHOOSE_ES: 'choose_es', // see English, pick Spanish
  CHOOSE_EN: 'choose_en', // see Spanish, pick English
  LISTEN: 'listen',       // hear English, pick English text
  BUILD: 'build',         // see Spanish, order English word tiles
};

const OPTION_COUNT = 4;

export function shuffle(items, rng = Math.random) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function tokenize(text) {
  return text.replace(/[.,!?¡¿;:"]/g, '').split(/\s+/).filter(Boolean);
}

function normalize(text) {
  return tokenize(text).join(' ').toLowerCase();
}

// Phrases of 3–8 words become tile puzzles; everything else is multiple choice.
function canBuild(card) {
  const count = tokenize(card.en).length;
  return count >= 3 && count <= 8;
}

export function exerciseTypesFor(card) {
  const types = [EXERCISE.CHOOSE_ES, EXERCISE.LISTEN, EXERCISE.CHOOSE_EN];
  if (canBuild(card)) types.push(EXERCISE.BUILD);
  return types;
}

function pickDistractors(card, pool, field, rng) {
  const seen = new Set([normalize(card[field])]);
  const candidates = shuffle(
    pool.filter(c => c.key !== card.key && c.type === card.type),
    rng
  );
  // Fall back to the other card type when a lesson has few of one kind.
  candidates.push(...shuffle(pool.filter(c => c.type !== card.type), rng));

  const picked = [];
  for (const candidate of candidates) {
    const value = normalize(candidate[field]);
    if (seen.has(value)) continue;
    seen.add(value);
    picked.push(candidate[field]);
    if (picked.length === OPTION_COUNT - 1) break;
  }
  return picked;
}

export function makeExercise(card, pool, type, rng = Math.random) {
  if (type === EXERCISE.INTRO) return { type, card };

  if (type === EXERCISE.BUILD) {
    const answer = tokenize(card.en);
    const extra = pickDistractors(card, pool, 'en', rng)
      .flatMap(tokenize)
      .filter(word => !answer.some(a => a.toLowerCase() === word.toLowerCase()))
      .slice(0, 2);
    return { type, card, prompt: card.es, tiles: shuffle([...answer, ...extra], rng), answer: answer.join(' ') };
  }

  const field = type === EXERCISE.CHOOSE_ES ? 'es' : 'en';
  const promptField = type === EXERCISE.CHOOSE_EN ? 'es' : 'en';
  const options = shuffle([card[field], ...pickDistractors(card, pool, field, rng)], rng);
  return { type, card, prompt: card[promptField], options, answer: card[field] };
}

export function checkAnswer(exercise, answer) {
  if (exercise.type === EXERCISE.INTRO) return true;
  return normalize(String(answer ?? '')) === normalize(exercise.answer);
}

// New cards: introduce two, then quiz those two. Review: quiz only.
export function planSession(cards, pool, { intro = true, rng = Math.random } = {}) {
  const fullPool = [...pool, ...cards.filter(c => !pool.some(p => p.key === c.key))];
  const steps = [];
  let round = 0;
  const quiz = card => {
    const types = exerciseTypesFor(card);
    steps.push(makeExercise(card, fullPool, types[round++ % types.length], rng));
  };

  if (!intro) {
    shuffle(cards, rng).forEach(quiz);
    return steps;
  }

  for (let i = 0; i < cards.length; i += 2) {
    const pair = cards.slice(i, i + 2);
    pair.forEach(card => steps.push(makeExercise(card, fullPool, EXERCISE.INTRO, rng)));
    shuffle(pair, rng).forEach(quiz);
  }
  return steps;
}

// A missed card comes back at the end with a different exercise type.
export function retryExercise(exercise, pool, rng = Math.random) {
  const types = exerciseTypesFor(exercise.card).filter(t => t !== exercise.type);
  const type = types[Math.floor(rng() * types.length)] || exercise.type;
  return makeExercise(exercise.card, pool, type, rng);
}
