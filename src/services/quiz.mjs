// saflash — Pure quiz engine: turns cards into objective exercises.
// A card is { key, type: 'word'|'phrase', en, es, state? }.
// Recognition (multiple choice) is for first exposures; once a card reaches
// review it is asked with recall: the learner produces the English (Nakata 2016).

export const EXERCISE = {
  INTRO: 'intro',             // present a new card, no answer
  CHOOSE_ES: 'choose_es',     // see English, pick Spanish
  CHOOSE_EN: 'choose_en',     // see Spanish, pick English
  LISTEN: 'listen',           // hear English, pick English text
  BUILD: 'build',             // see Spanish, order English word tiles
  TYPE_EN: 'type_en',         // see Spanish, type English
  CLOZE: 'cloze',             // complete an English sentence
  LISTEN_TYPE: 'listen_type', // hear English, type it
  FLIP: 'flip',               // flip the card and self-grade
};

export const TYPED = new Set([EXERCISE.TYPE_EN, EXERCISE.CLOZE, EXERCISE.LISTEN_TYPE]);
const STATE_REVIEW = 2; // ts-fsrs State.Review

const OPTION_COUNT = 4;

// Normalizes a words/phrases DB row into a card.
export function toCard(row) {
  const type = row.card_type;
  return {
    ...row,
    key: `${type}-${row.id}`,
    type,
    en: row.en ?? row.english_word ?? row.phrase_en,
    es: row.es ?? row.spanish_trans ?? row.phrase_es,
  };
}

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

// Splits the card's example sentence around the word, or null when the
// example does not contain it verbatim.
export function clozeOf(card) {
  if (card.type !== 'word' || !card.example_en || !card.example_es) return null;
  const escaped = card.en.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = new RegExp(`\\b${escaped}\\b`, 'i').exec(card.example_en);
  if (!match) return null;
  return {
    before: card.example_en.slice(0, match.index),
    after: card.example_en.slice(match.index + match[0].length),
    answer: match[0],
    translation: card.example_es,
  };
}

export function makeExercise(card, pool, type, rng = Math.random) {
  if (type === EXERCISE.INTRO || type === EXERCISE.FLIP) return { type, card };
  if (type === EXERCISE.TYPE_EN) return { type, card, prompt: card.es, answer: card.en };
  if (type === EXERCISE.LISTEN_TYPE) return { type, card, answer: card.en };
  if (type === EXERCISE.CLOZE) {
    const cloze = clozeOf(card);
    return { type, card, prompt: card.es, cloze, answer: cloze.answer };
  }

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

// Lowercase, no accents or punctuation, single spaces, and without a leading
// "to " or article ("to go" = "go", "the dog" = "dog").
function canonical(text) {
  return normalize(String(text ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, ''))
    .replace(/^(to|a|an|the) (?=\S)/, '');
}

export function editDistance(a, b) {
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i += 1) {
    const row = [i];
    for (let j = 1; j <= b.length; j += 1) {
      row[j] = Math.min(prev[j] + 1, row[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prev = row;
  }
  return prev[b.length];
}

// Typed answers tolerate one typo (two from 8 letters); short words must be exact.
export function checkTyped(answer, expected) {
  const given = canonical(answer);
  const target = canonical(expected);
  if (given === target) return { correct: true, typo: false };
  const allowed = target.length >= 8 ? 2 : target.length >= 4 ? 1 : 0;
  const close = given.length > 0 && editDistance(given, target) <= allowed;
  return { correct: close, typo: close };
}

// { correct, typo } for any exercise.
export function gradeAnswer(exercise, answer) {
  if (exercise.type === EXERCISE.INTRO || exercise.type === EXERCISE.FLIP) return { correct: true, typo: false };
  if (TYPED.has(exercise.type)) return checkTyped(answer, exercise.answer);
  return { correct: normalize(String(answer ?? '')) === normalize(exercise.answer), typo: false };
}

export function checkAnswer(exercise, answer) {
  return gradeAnswer(exercise, answer).correct;
}

// Exercise for a scheduled card: recognition while it is still being learned,
// recall once it is in review (or a flip card when the learner prefers it).
export function exerciseFor(card, { mode = 'type', round = 0 } = {}) {
  if (card.state !== STATE_REVIEW) {
    return round % 2 === 0 ? EXERCISE.CHOOSE_EN : EXERCISE.LISTEN;
  }
  if (mode === 'flip') return EXERCISE.FLIP;
  const types = [EXERCISE.TYPE_EN, EXERCISE.LISTEN_TYPE];
  if (clozeOf(card)) types.push(EXERCISE.CLOZE);
  if (canBuild(card)) return round % 2 === 0 ? EXERCISE.BUILD : EXERCISE.TYPE_EN;
  return types[round % types.length];
}

// Picks `count` new cards in frequency order, mixing in one phrase every
// `phraseEvery` cards and never two of the same category in a row when another
// candidate is close (similar new words interfere: Tinkham 1993).
export function pickNew(words, phrases, count, { phraseEvery = 4, lookahead = 8 } = {}) {
  const sources = [[...words], [...phrases]];
  const picked = [];
  let lastCategory = null;
  while (picked.length < count && (sources[0].length || sources[1].length)) {
    const wantPhrase = (picked.length + 1) % phraseEvery === 0;
    const source = (wantPhrase && sources[1].length) || !sources[0].length ? sources[1] : sources[0];
    const window = source.slice(0, lookahead);
    let index = window.findIndex(c => c.category !== lastCategory);
    if (index < 0) index = 0;
    const [card] = source.splice(index, 1);
    picked.push(card);
    lastCategory = card.category;
  }
  return picked;
}

// Daily session: due cards first, then each new card is introduced and
// checked once with recognition.
export function planDaily(due, fresh, pool, { mode = 'type', rng = Math.random } = {}) {
  const steps = due.map((card, round) => makeExercise(card, pool, exerciseFor(card, { mode, round }), rng));
  for (const card of fresh) {
    steps.push(makeExercise(card, pool, EXERCISE.INTRO, rng));
    steps.push(makeExercise(card, pool, EXERCISE.CHOOSE_ES, rng));
  }
  return steps;
}

// Introduce two new cards, then quiz those two.
export function planSession(cards, pool, { rng = Math.random } = {}) {
  const fullPool = [...pool, ...cards.filter(c => !pool.some(p => p.key === c.key))];
  const steps = [];
  let round = 0;
  const quiz = card => {
    const types = exerciseTypesFor(card);
    steps.push(makeExercise(card, fullPool, types[round++ % types.length], rng));
  };

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
