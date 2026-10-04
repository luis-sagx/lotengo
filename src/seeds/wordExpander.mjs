// saflash — Expands compact seed rows into full seed records.

export const CAT_IMG = {
  basics: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400',
  verbs_common: 'https://images.unsplash.com/photo-1571008887538-b36bb32f4571?w=400',
  verbs_action: 'https://images.unsplash.com/photo-1571008887538-b36bb32f4571?w=400',
  family: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=400',
  body: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=400',
  health: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=400',
  food_drink: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400',
  clothing: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=400',
  home: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400',
  nature: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400',
  animals: 'https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=400',
  colors_shapes: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=400',
  numbers_time: 'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=400',
  vowels: 'https://images.unsplash.com/photo-1509266272358-7701da638078?w=400',
  numbers: 'https://images.unsplash.com/photo-1509266272358-7701da638078?w=400',
  emotions: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=400',
  work_business: 'https://images.unsplash.com/photo-1497032628192-86f99bcd76bc?w=400',
  technology: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400',
  transport: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=400',
  education: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=400',
  sports: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=400',
  arts_culture: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400',
  shopping: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=400',
  travel: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=400',
  social: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=400',
  adjectives: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400',
  adverbs: 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=400',
  greetings: 'https://images.unsplash.com/photo-1521791136064-7986c2920216?w=400',
  courtesy: 'https://images.unsplash.com/photo-1573166364524-d9dbfd8bbf83?w=400',
  questions: 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=400',
  introductions: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=400',
  weather: 'https://images.unsplash.com/photo-1504608524841-42fe6f032b4b?w=400',
  directions: 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=400',
  restaurant: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400',
  hotel: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400',
  money_banking: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=400',
  city_places: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400',
  chores: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400',
  hobbies: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=400',
  media_entertainment: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400',
  science: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=400',
  environment: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400',
  law_government: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=400',
  idioms: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=400',
  phrasal_verbs: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=400',
  phone: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=400',
  time: 'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=400',
  work: 'https://images.unsplash.com/photo-1497032628192-86f99bcd76bc?w=400',
  other: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400',
};

export function guessPhonetic(word) {
  const map = {
    e: '/iː/', i: '/aɪ/', o: '/oʊ/', u: '/juː/',
    zero: '/ˈzɪəroʊ/', eleven: '/ɪˈlevən/', twelve: '/twelv/',
    thirteen: '/θɜːrˈtiːn/', fourteen: '/ˌfɔːrˈtiːn/', fifteen: '/ˌfɪfˈtiːn/',
    sixteen: '/ˌsɪksˈtiːn/', seventeen: '/ˌsevənˈtiːn/', eighteen: '/ˌeɪˈtiːn/',
    nineteen: '/ˌnaɪnˈtiːn/', sixty: '/ˈsɪksti/', seventy: '/ˈsevənti/',
    eighty: '/ˈeɪti/', ninety: '/ˈnaɪnti/',
    the: '/ðə/', be: '/biː/', to: '/tuː/', of: '/ʌv/', and: '/ænd/',
    a: '/eɪ/', in: '/ɪn/', that: '/ðæt/', have: '/hæv/', it: '/ɪt/',
    for: '/fɔːr/', not: '/nɒt/', on: '/ɒn/', with: '/wɪð/', he: '/hiː/',
    you: '/juː/', do: '/duː/', this: '/ðɪs/', but: '/bʌt/', his: '/hɪz/',
    they: '/ðeɪ/', we: '/wiː/', she: '/ʃiː/', say: '/seɪ/', her: '/hɜːr/',
    or: '/ɔːr/', an: '/æn/', will: '/wɪl/', my: '/maɪ/', one: '/wʌn/',
    all: '/ɔːl/', would: '/wʊd/', there: '/ðeər/', their: '/ðeər/',
    what: '/wɒt/', so: '/soʊ/', up: '/ʌp/', out: '/aʊt/', if: '/ɪf/',
    about: '/əˈbaʊt/', who: '/huː/', get: '/ɡet/', which: '/wɪtʃ/',
    go: '/ɡoʊ/', me: '/miː/', when: '/wen/', make: '/meɪk/',
    can: '/kæn/', like: '/laɪk/', time: '/taɪm/', no: '/noʊ/',
    just: '/dʒʌst/', him: '/hɪm/', know: '/noʊ/', take: '/teɪk/',
    people: '/ˈpiːpəl/', into: '/ˈɪntuː/', year: '/jɪər/',
    your: '/jɔːr/', good: '/ɡʊd/', some: '/sʌm/', could: '/kʊd/',
    them: '/ðem/', see: '/siː/', other: '/ˈʌðər/', than: '/ðæn/',
    then: '/ðen/', now: '/naʊ/', look: '/lʊk/', only: '/ˈoʊnli/',
    come: '/kʌm/', its: '/ɪts/', over: '/ˈoʊvər/', think: '/θɪŋk/',
    also: '/ˈɔːlsoʊ/', back: '/bæk/', after: '/ˈæftər/',
    use: '/juːz/', two: '/tuː/', how: '/haʊ/', our: '/aʊər/',
    work: '/wɜːrk/', first: '/fɜːrst/', well: '/wel/',
    way: '/weɪ/', even: '/ˈiːvən/', new: '/njuː/', want: '/wɒnt/',
    because: '/bɪˈkɔːz/', any: '/ˈeni/', these: '/ðiːz/',
    give: '/ɡɪv/', day: '/deɪ/', most: '/moʊst/', us: '/ʌs/',
    great: '/ɡreɪt/', man: '/mæn/', woman: '/ˈwʊmən/',
    water: '/ˈwɔːtər/', food: '/fuːd/',
  };
  return map[word.toLowerCase()] || null;
}

export function makeExample(en, es) {
  return [
    `The word "${en}" means "${es}".`,
    `La palabra "${en}" significa "${es}".`,
  ];
}

export function expandWord(row, level, rank) {
  const [english, spanish, category, subcategory] = row;
  const [exEn, exEs] = makeExample(english, spanish);
  return {
    english_word: english,
    spanish_trans: spanish,
    phonetic: guessPhonetic(english),
    category,
    subcategory: subcategory || null,
    frequency_rank: rank,
    difficulty: level,
    image_url: null,
    audio_url: null,
    example_en: exEn,
    example_es: exEs,
  };
}

export function expandPhrase(row, level, rank) {
  const [phraseEn, phraseEs, category, context] = row;
  return {
    phrase_en: phraseEn,
    phrase_es: phraseEs,
    category,
    context: context || null,
    difficulty: level,
    image_url: CAT_IMG[category] || CAT_IMG.other,
    audio_url: null,
    frequency_rank: rank,
  };
}
