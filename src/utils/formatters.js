// saflash — Formatting utilities

export function formatNumber(n) {
  if (n == null) return '0';
  return Number(n).toLocaleString('es-AR');
}

export function formatStreak(days) {
  if (!days || days === 0) return 'Sin racha';
  return `${days} ${days === 1 ? 'día' : 'días'}`;
}

export function formatProgress(known, total) {
  if (!total || total === 0) return '0%';
  const pct = Math.round((known / total) * 100);
  return `${pct}%`;
}

export function formatSessionDuration(seconds) {
  if (!seconds || seconds === 0) return '—';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins === 0) return `${secs}s`;
  return `${mins}m ${secs}s`;
}

export function formatCategoryName(category) {
  const CATEGORY_NAMES = {
    vowels: 'Vocales',
    numbers: 'Números',
    basics: 'Básicas',
    verbs_common: 'Verbos comunes',
    verbs_action: 'Verbos de acción',
    family: 'Familia',
    body: 'Cuerpo humano',
    health: 'Salud',
    food_drink: 'Comida y bebida',
    clothing: 'Ropa',
    home: 'Hogar',
    nature: 'Naturaleza',
    animals: 'Animales',
    colors_shapes: 'Colores y formas',
    numbers_time: 'Tiempo',
    emotions: 'Emociones',
    work_business: 'Trabajo y negocios',
    technology: 'Tecnología',
    transport: 'Transporte',
    education: 'Educación',
    sports: 'Deportes',
    arts_culture: 'Arte y cultura',
    shopping: 'Compras',
    travel: 'Viajes',
    social: 'Social',
    adjectives: 'Adjetivos',
    adverbs: 'Adverbios',
    other: 'Otras',
    city_places: 'Ciudad y lugares',
    environment: 'Medio ambiente',
    hotel: 'Hotel',
    idioms: 'Expresiones idiomáticas',
    law_government: 'Leyes y gobierno',
    media_entertainment: 'Medios y entretenimiento',
    money_banking: 'Dinero y banca',
    phrasal_verbs: 'Verbos compuestos',
    restaurant: 'Restaurante',
    science: 'Ciencia',
    weather: 'Clima',
    greetings: 'Saludos',
    courtesy: 'Cortesía',
    questions: 'Preguntas',
    introductions: 'Presentaciones',
    work: 'Trabajo',
    directions: 'Direcciones',
    phone: 'Por teléfono',
    time: 'El tiempo',
  };

  return CATEGORY_NAMES[category] || String(category ?? '')
    .replace(/[_-]+/g, ' ')
    .replace(/^./, character => character.toLocaleUpperCase('es'));
}

export function formatDifficulty(difficulty) {
  const DIFFICULTY_LABELS = {
    A1: 'Principiante',
    A2: 'Básico',
    B1: 'Intermedio',
    B2: 'Avanzado',
    C1: 'Experto',
  };
  return DIFFICULTY_LABELS[difficulty] || difficulty;
}

/**
 * Achievements / badges that can be unlocked.
 */
export const ACHIEVEMENTS = [
  { id: 'first_steps', icon: '🌱', title: 'Primeros pasos', description: 'Estudiar 1 tarjeta', condition: (s) => s.totalStudied >= 1 },
  { id: 'streak_7', icon: '🔥', title: 'Racha de 7 días', description: '7 días seguidos estudiando', condition: (s) => s.streak >= 7 },
  { id: 'hundred_words', icon: '💯', title: 'Cien palabras', description: '100 palabras dominadas', condition: (s) => s.knownWords >= 100 },
  { id: 'five_hundred', icon: '🚀', title: 'Quinientas palabras', description: '500 palabras dominadas', condition: (s) => s.knownWords >= 500 },
  { id: 'thousand', icon: '🏆', title: 'Mil palabras', description: '1,000 palabras dominadas', condition: (s) => s.knownWords >= 1000 },
  { id: 'talker', icon: '💬', title: 'Hablador', description: '50 frases dominadas', condition: (s) => s.knownPhrases >= 50 },
  { id: 'perfect_session', icon: '⭐', title: 'Sesión perfecta', description: '20/20 en una sesión', condition: (s) => s.perfectSession },
];

export function checkAchievements(stats) {
  return ACHIEVEMENTS.map(a => ({
    ...a,
    unlocked: a.condition(stats),
  }));
}
