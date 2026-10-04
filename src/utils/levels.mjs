// saflash — CEFR level helpers (pure, shared by seeds and UI)

export const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1'];

export const LEVEL_LABELS = {
  A1: 'Principiante',
  A2: 'Básico',
  B1: 'Intermedio',
  B2: 'Avanzado',
  C1: 'Experto',
};

export const LEVEL_SELF_DESCRIPTIONS = {
  A1: 'Estoy empezando desde cero',
  A2: 'Entiendo frases simples',
  B1: 'Me defiendo en el día a día',
  B2: 'Converso con soltura',
  C1: 'Casi como un nativo',
};

export function levelIndex(level) {
  return LEVELS.indexOf(level);
}

export function nextLevel(level) {
  const i = levelIndex(level);
  if (i < 0 || i === LEVELS.length - 1) return null;
  return LEVELS[i + 1];
}

export function prevLevel(level) {
  const i = levelIndex(level);
  if (i <= 0) return null;
  return LEVELS[i - 1];
}

export function isValidLevel(level) {
  return LEVELS.includes(level);
}
