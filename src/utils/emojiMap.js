// saflash — Emoji visual map
// Guaranteed offline visual for every card: a curated word→emoji map plus a
// category fallback. Real photos (Wikipedia) layer on top when online, but this
// always renders something clear and friendly for all ages, with zero cost and
// no broken links.

// ── Per-word emojis (concrete, high-value vocabulary) ──
const WORD_EMOJI = {
  // family / people
  family: '👪', mother: '👩', father: '👨', mom: '👩', dad: '👨',
  parent: '🧑', baby: '👶', child: '🧒', son: '👦', daughter: '👧',
  brother: '👦', sister: '👧', grandmother: '👵', grandfather: '👴',
  grandma: '👵', grandpa: '👴', wife: '👰', husband: '🤵', friend: '🧑‍🤝‍🧑',
  man: '👨', woman: '👩', boy: '👦', girl: '👧', people: '👥', person: '🧑',

  // body / health
  body: '🧍', head: '🗣️', face: '😀', eye: '👁️', ear: '👂', nose: '👃',
  mouth: '👄', tooth: '🦷', teeth: '🦷', tongue: '👅', hair: '💇',
  hand: '✋', arm: '💪', leg: '🦵', foot: '🦶', knee: '🦵', heart: '❤️',
  brain: '🧠', bone: '🦴', blood: '🩸', skin: '🧴', doctor: '👨‍⚕️',
  nurse: '👩‍⚕️', hospital: '🏥', medicine: '💊', pill: '💊', sick: '🤒',
  health: '🩺', healthy: '💪',

  // food & drink
  food: '🍽️', water: '💧', milk: '🥛', coffee: '☕', tea: '🍵', juice: '🧃',
  bread: '🍞', rice: '🍚', meat: '🥩', chicken: '🍗', fish: '🐟', egg: '🥚',
  cheese: '🧀', butter: '🧈', sugar: '🍬', salt: '🧂', soup: '🍲',
  apple: '🍎', banana: '🍌', orange: '🍊', grape: '🍇', lemon: '🍋',
  strawberry: '🍓', tomato: '🍅', potato: '🥔', carrot: '🥕', onion: '🧅',
  fruit: '🍎', vegetable: '🥦', salad: '🥗', pizza: '🍕', hamburger: '🍔',
  sandwich: '🥪', cake: '🍰', cookie: '🍪', chocolate: '🍫', icecream: '🍦',
  breakfast: '🍳', lunch: '🍱', dinner: '🍽️', drink: '🥤', wine: '🍷',
  beer: '🍺', restaurant: '🍴', kitchen: '🍳',

  // animals
  animal: '🐾', dog: '🐕', cat: '🐈', bird: '🐦', fishanimal: '🐟',
  horse: '🐎', cow: '🐄', pig: '🐖', sheep: '🐑', goat: '🐐', chickenanimal: '🐔',
  duck: '🦆', rabbit: '🐇', mouse: '🐁', lion: '🦁', tiger: '🐅', bear: '🐻',
  elephant: '🐘', monkey: '🐒', snake: '🐍', frog: '🐸', spider: '🕷️',
  bee: '🐝', butterfly: '🦋', ant: '🐜', wolf: '🐺', fox: '🦊', deer: '🦌',
  whale: '🐋', dolphin: '🐬', shark: '🦈', turtle: '🐢', penguin: '🐧',

  // nature
  nature: '🌿', sun: '☀️', moon: '🌙', star: '⭐', sky: '🌤️', cloud: '☁️',
  rain: '🌧️', snow: '❄️', wind: '💨', storm: '⛈️', fire: '🔥', tree: '🌳',
  flower: '🌸', grass: '🌱', plant: '🪴', leaf: '🍃', forest: '🌲',
  mountain: '⛰️', river: '🏞️', sea: '🌊', ocean: '🌊', lake: '🏞️',
  beach: '🏖️', island: '🏝️', desert: '🏜️', earth: '🌍', world: '🌎',
  rock: '🪨', stone: '🪨', sand: '🏖️', ice: '🧊',

  // home / objects
  home: '🏠', house: '🏠', door: '🚪', window: '🪟', wall: '🧱', roof: '🏠',
  floor: '🔲', room: '🛋️', bed: '🛏️', chair: '🪑', table: '🪑', desk: '🪑',
  sofa: '🛋️', lamp: '💡', light: '💡', mirror: '🪞', clock: '🕐',
  key: '🔑', phone: '📱', book: '📖', pen: '🖊️', pencil: '✏️', paper: '📄',
  bag: '👜', box: '📦', bottle: '🍾', cup: '🥤', glass: '🥛', plate: '🍽️',
  knife: '🔪', fork: '🍴', spoon: '🥄', towel: '🧻', soap: '🧼',

  // clothing
  clothes: '👕', shirt: '👕', tshirt: '👕', pants: '👖', dress: '👗',
  skirt: '👗', shoe: '👟', shoes: '👟', sock: '🧦', hat: '🎩', cap: '🧢',
  coat: '🧥', jacket: '🧥', glove: '🧤', scarf: '🧣', belt: '👔',
  glasses: '👓', ring: '💍', watch: '⌚', shorts: '🩳',

  // colors
  color: '🎨', red: '🔴', blue: '🔵', green: '🟢', yellow: '🟡',
  orange: '🟠', purple: '🟣', black: '⚫', white: '⚪', brown: '🟤',
  pink: '🌸', gray: '⬜', grey: '⬜',

  // numbers / time
  zero: '0️⃣', one: '1️⃣', two: '2️⃣', three: '3️⃣', four: '4️⃣',
  five: '5️⃣', six: '6️⃣', seven: '7️⃣', eight: '8️⃣', nine: '9️⃣',
  ten: '🔟',
  number: '🔢', time: '⏰', day: '📅', night: '🌃', morning: '🌅',
  week: '📆', month: '🗓️', year: '📅', hour: '⏰', minute: '⏱️',
  today: '📅', tomorrow: '➡️', yesterday: '⬅️', calendar: '📅',
  monday: '📆', sunday: '📆',

  // transport
  car: '🚗', bus: '🚌', train: '🚆', plane: '✈️', airplane: '✈️',
  bike: '🚲', bicycle: '🚲', motorcycle: '🏍️', boat: '⛵', ship: '🚢',
  truck: '🚚', taxi: '🚕', subway: '🚇', road: '🛣️', street: '🛣️',
  bridge: '🌉', airport: '🛫', station: '🚉', wheel: '🛞',

  // work / business / tech
  work: '💼', job: '💼', office: '🏢', money: '💰', dollar: '💵',
  bank: '🏦', computer: '💻', laptop: '💻', internet: '🌐', email: '📧',
  camera: '📷', television: '📺', tv: '📺', radio: '📻', battery: '🔋',
  robot: '🤖', factory: '🏭', tool: '🔧', hammer: '🔨',

  // education
  school: '🏫', student: '🧑‍🎓', teacher: '🧑‍🏫', class: '🧑‍🏫',
  learn: '📚', study: '📖', read: '📖', write: '✍️', test: '📝',
  exam: '📝', university: '🎓', library: '📚', science: '🔬', math: '➗',

  // sports / arts
  sport: '⚽', ball: '⚽', football: '⚽', soccer: '⚽', basketball: '🏀',
  tennis: '🎾', baseball: '⚾', swim: '🏊', run: '🏃', dance: '💃',
  music: '🎵', song: '🎶', sing: '🎤', guitar: '🎸', piano: '🎹',
  paint: '🎨', art: '🎨', movie: '🎬', game: '🎮', play: '🎮',

  // emotions / abstract
  love: '❤️', happy: '😀', sad: '😢', angry: '😠', afraid: '😨',
  scared: '😨', tired: '😴', surprised: '😲', smile: '😊', laugh: '😂',
  cry: '😭', fear: '😨', joy: '😄', peace: '☮️', idea: '💡',

  // misc useful
  yes: '✅', no: '❌', ok: '👌', stop: '🛑', go: '🟢', up: '⬆️', down: '⬇️',
  left: '⬅️', right: '➡️', big: '🔺', small: '🔻', hot: '🔥', cold: '🧊',
  new: '✨', old: '👴', good: '👍', bad: '👎', open: '🔓', close: '🔒',
  gift: '🎁', party: '🎉', birthday: '🎂', flag: '🚩', map: '🗺️',
  question: '❓', answer: '💬', word: '📝', name: '🏷️', city: '🏙️',
  country: '🗺️', church: '⛪', shop: '🏪', store: '🏪', market: '🛒',
  hotel: '🏨', police: '👮', fire2: '🚒', baby2: '👶',
};

// ── Category fallback emojis ──
const CATEGORY_EMOJI = {
  vowels: '🔡',
  numbers: '🔢',
  basics: '🔤',
  verbs_common: '🏃',
  verbs_action: '⚡',
  family: '👪',
  body: '🧍',
  health: '🩺',
  food_drink: '🍽️',
  clothing: '👕',
  home: '🏠',
  nature: '🌿',
  animals: '🐾',
  colors_shapes: '🎨',
  numbers_time: '📅',
  emotions: '😊',
  work_business: '💼',
  technology: '💻',
  transport: '🚗',
  education: '🏫',
  sports: '⚽',
  arts_culture: '🎭',
  shopping: '🛒',
  travel: '✈️',
  social: '💬',
  adjectives: '✨',
  adverbs: '🔁',
  greetings: '👋',
  courtesy: '🙏',
  questions: '❓',
  introductions: '🤝',
  weather: '☀️',
  directions: '🧭',
  restaurant: '🍴',
  hotel: '🏨',
  money_banking: '🏦',
  city_places: '🏙️',
  chores: '🧹',
  hobbies: '🧩',
  media_entertainment: '🎬',
  science: '🔬',
  environment: '🌍',
  law_government: '⚖️',
  idioms: '🗣️',
  phrasal_verbs: '🔗',
  phone: '📱',
  time: '⏰',
  work: '🏢',
  other: '📚',
};

export function getCategoryEmoji(category) {
  return CATEGORY_EMOJI[category] || '🏷️';
}

/**
 * Returns the best emoji for a word, falling back to its category, then a book.
 * Normalizes the word (lowercase, strips articles/extra words) before lookup.
 */
export function getEmoji(word, category) {
  if (word) {
    const normalized = String(word)
      .toLowerCase()
      .trim()
      .replace(/^(to |a |an |the )/, '')
      .replace(/[^a-z]/g, '');
    if (WORD_EMOJI[normalized]) return WORD_EMOJI[normalized];
  }
  if (category && CATEGORY_EMOJI[category]) return getCategoryEmoji(category);
  return '📚';
}

export default getEmoji;
