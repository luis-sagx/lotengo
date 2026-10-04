// saflash — The guided path definition: units are derived from real content.

export const LESSON_SIZE = 8;
// A lesson needs at least this many cards; smaller leftovers join the previous
// lesson, and categories smaller than this go to the mixed review unit.
export const MIN_LESSON_SIZE = 4;
export const MIXED_CATEGORY = 'other';

// Beginner-first order. Categories not listed follow in content order.
export const CATEGORY_ORDER = [
  'greetings', 'courtesy', 'introductions', 'numbers', 'basics', 'verbs_common',
  'family', 'colors_shapes', 'food_drink', 'home', 'body', 'questions',
  'numbers_time', 'time', 'clothing', 'animals', 'nature', 'weather',
  'adjectives', 'verbs_action', 'shopping', 'directions', 'transport',
  'restaurant', 'phone', 'city_places', 'health', 'education', 'sports',
  'emotions', 'travel', 'hotel', 'work', 'work_business', 'technology',
  'social', 'adverbs', 'arts_culture', 'money_banking', 'media_entertainment',
  'environment', 'science', 'phrasal_verbs', 'law_government', 'idioms',
];
