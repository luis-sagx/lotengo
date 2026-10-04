// saflash — Exercise views: intro card, multiple choice, listening, tile builder,
// typed recall (Spanish prompt, sentence cloze, dictation).
import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { RADIUS, SPACING, SHADOW } from '../theme/spacing';
import { FONT_FAMILY } from '../theme/typography';
import CardImage from './CardImage';
import { speak, speakAuto, speakSlow, registerAudio } from '../services/audioService';
import { playEffect } from '../services/soundService';
import { enrichWord } from '../services/enrichmentService';
import { EXERCISE, TYPED } from '../services/quiz.mjs';
import RatingButtons from './RatingButtons';

const INSTRUCTIONS = {
  [EXERCISE.CHOOSE_ES]: '¿Qué significa?',
  [EXERCISE.CHOOSE_EN]: '¿Cómo se dice en inglés?',
  [EXERCISE.LISTEN]: 'Escucha y elige lo que oyes',
  [EXERCISE.BUILD]: 'Ordena las palabras en inglés',
  [EXERCISE.TYPE_EN]: 'Escríbelo en inglés',
  [EXERCISE.CLOZE]: 'Completa la oración',
  [EXERCISE.LISTEN_TYPE]: 'Escucha y escribe lo que oyes',
};

// Audio would give the answer away in these.
const SILENT = new Set([EXERCISE.CHOOSE_EN, EXERCISE.BUILD, EXERCISE.TYPE_EN, EXERCISE.CLOZE]);
const LISTENING = new Set([EXERCISE.LISTEN, EXERCISE.LISTEN_TYPE]);

// Renders the current step. `onCheck(value)` returns { correct, typo, suggested };
// `onNext()` advances once the learner has seen the feedback. With `grading`
// ({ intervals, onGrade }) the feedback offers the four FSRS grades instead.
export default function Exercise({ step, onCheck, onNext, grading }) {
  const [selected, setSelected] = useState(null);
  const [tiles, setTiles] = useState([]);
  const [typed, setTyped] = useState('');
  const [result, setResult] = useState(null); // null | { correct, typo, suggested }

  useEffect(() => {
    setSelected(null);
    setTiles([]);
    setTyped('');
    setResult(null);
    if (step.card.type === 'word') registerAudio(step.card.en, step.card.audio_url);
    // Listening needs the audio regardless of the auto-speak setting.
    if (LISTENING.has(step.type)) speak(step.card.en);
    else if (!SILENT.has(step.type)) speakAuto(step.card.en);
  }, [step]);

  if (step.type === EXERCISE.INTRO) {
    return (
      <View style={styles.flex}>
        <IntroCard card={step.card} />
        <Footer>
          <PrimaryButton label="Continuar" onPress={onNext} />
        </Footer>
      </View>
    );
  }

  const isTyped = TYPED.has(step.type);
  const value = step.type === EXERCISE.BUILD
    ? tiles.map(i => step.tiles[i]).join(' ')
    : isTyped ? typed.trim() : selected;
  const answered = result !== null;
  const correct = result?.correct;

  const check = () => {
    if (!value || answered) return;
    const outcome = onCheck(value);
    setResult(outcome);
    playEffect(outcome.correct ? 'correct' : 'wrong');
    // Let the chime finish before reading the answer aloud.
    setTimeout(() => speakAuto(step.card.en), 400);
  };

  return (
    <View style={styles.flex}>
      <ScrollView contentContainerStyle={styles.body}>
        <Text style={styles.instruction}>{INSTRUCTIONS[step.type]}</Text>

        {LISTENING.has(step.type) ? (
          <View style={styles.listenRow}>
            <TouchableOpacity
              style={styles.listenButton}
              onPress={() => speak(step.card.en)}
              accessibilityLabel="Escuchar de nuevo"
            >
              <Ionicons name="volume-high" size={44} color={COLORS.surfaceWhite} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.slowButton}
              onPress={() => speakSlow(step.card.en)}
              accessibilityLabel="Escuchar despacio"
            >
              <Text style={styles.slowIcon}>🐢</Text>
            </TouchableOpacity>
          </View>
        ) : step.type === EXERCISE.CLOZE ? (
          <View style={styles.clozeBox}>
            <Text style={styles.clozeSentence}>
              {step.cloze.before}
              <Text style={styles.clozeBlank}>{answered ? step.cloze.answer : '_____'}</Text>
              {step.cloze.after}
            </Text>
            <Text style={styles.clozeHint}>{step.cloze.translation}</Text>
          </View>
        ) : (
          <View style={styles.promptRow}>
            {step.type === EXERCISE.CHOOSE_ES && (
              <TouchableOpacity onPress={() => speak(step.card.en)} accessibilityLabel="Escuchar">
                <Ionicons name="volume-high" size={28} color={COLORS.accentOrange} />
              </TouchableOpacity>
            )}
            <Text style={styles.prompt}>{step.prompt}</Text>
          </View>
        )}

        {isTyped ? (
          <TextInput
            style={[styles.input, answered && (correct ? styles.optionRight : styles.optionWrong)]}
            value={typed}
            onChangeText={setTyped}
            onSubmitEditing={check}
            editable={!answered}
            autoFocus
            autoCapitalize="none"
            autoCorrect={false}
            spellCheck={false}
            returnKeyType="done"
            placeholder="Escribe en inglés"
            placeholderTextColor={COLORS.textPlaceholder}
            accessibilityLabel="Tu respuesta en inglés"
          />
        ) : step.type === EXERCISE.BUILD ? (
          <TileBuilder step={step} tiles={tiles} setTiles={setTiles} disabled={answered} />
        ) : (
          <View style={styles.options}>
            {step.options.map(option => {
              const isSelected = selected === option;
              const showRight = answered && option === step.answer;
              const showWrong = answered && isSelected && !correct;
              return (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.option,
                    isSelected && styles.optionSelected,
                    showRight && styles.optionRight,
                    showWrong && styles.optionWrong,
                  ]}
                  disabled={answered}
                  onPress={() => setSelected(option)}
                  accessibilityState={{ selected: isSelected }}
                >
                  <Text style={styles.optionText}>{option}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>

      {answered ? (
        <Footer tone={correct ? 'right' : 'wrong'}>
          <Text style={[styles.feedbackTitle, { color: correct ? COLORS.successGreen : COLORS.dangerOrange }]}>
            {!correct ? 'Respuesta correcta:' : result.typo ? 'Casi perfecto, se escribe:' : '¡Correcto!'}
          </Text>
          {(!correct || result.typo) && <Text style={styles.feedbackAnswer}>{step.answer}</Text>}
          <Text style={styles.feedbackMeaning}>{step.card.en} = {step.card.es}</Text>
          {step.card.falseFriend ? <Text style={styles.falseFriend}>⚠️ {step.card.falseFriend}</Text> : null}
          {grading ? (
            <>
              <Text style={styles.gradeHint}>¿Qué tan bien lo recordaste?</Text>
              <RatingButtons onPress={grading.onGrade} intervals={grading.intervals} suggested={result.suggested} />
            </>
          ) : (
            <PrimaryButton
              label="Continuar"
              color={correct ? COLORS.successGreen : COLORS.dangerOrange}
              onPress={onNext}
            />
          )}
        </Footer>
      ) : (
        <Footer>
          <PrimaryButton label="Comprobar" disabled={!value} onPress={check} />
        </Footer>
      )}
    </View>
  );
}

function TileBuilder({ step, tiles, setTiles, disabled }) {
  return (
    <>
      <View style={styles.answerArea}>
        {tiles.map((tileIndex, position) => (
          <TouchableOpacity
            key={tileIndex}
            style={styles.tile}
            disabled={disabled}
            onPress={() => setTiles(tiles.filter((_, i) => i !== position))}
          >
            <Text style={styles.tileText}>{step.tiles[tileIndex]}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.bank}>
        {step.tiles.map((word, tileIndex) => {
          const used = tiles.includes(tileIndex);
          return (
            <TouchableOpacity
              key={tileIndex}
              style={[styles.tile, used && styles.tileUsed]}
              disabled={used || disabled}
              onPress={() => setTiles([...tiles, tileIndex])}
            >
              <Text style={[styles.tileText, used && styles.tileTextUsed]}>{word}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </>
  );
}

function IntroCard({ card }) {
  const [data, setData] = useState(card);

  useEffect(() => {
    let alive = true;
    setData(card);
    if (card.type === 'word') {
      enrichWord({ ...card, english_word: card.en }).then(updated => {
        if (alive && updated) setData(prev => ({ ...prev, ...updated }));
      });
    }
    return () => {
      alive = false;
    };
  }, [card]);

  return (
    <ScrollView contentContainerStyle={[styles.body, styles.introBody]}>
      <Text style={styles.badge}>{card.type === 'word' ? 'PALABRA NUEVA' : 'FRASE NUEVA'}</Text>
      {card.type === 'word' && (
        <CardImage uri={data.image_url} word={card.en} category={card.category} size={140} />
      )}
      <TouchableOpacity style={styles.introWordRow} onPress={() => speak(card.en)} accessibilityLabel={`Escuchar ${card.en}`}>
        <Text style={styles.introWord}>{card.en}</Text>
        <Ionicons name="volume-high" size={28} color={COLORS.accentOrange} />
      </TouchableOpacity>
      {data.phonetic ? <Text style={styles.phonetic}>{data.phonetic}</Text> : null}
      <Text style={styles.translation}>{card.es}</Text>
      {card.type === 'phrase' && card.context ? <Text style={styles.example}>{card.context}</Text> : null}
      {data.example_en ? (
        <TouchableOpacity style={styles.sentence} onPress={() => speak(data.example_en)} accessibilityLabel={`Escuchar el ejemplo: ${data.example_en}`}>
          <Text style={styles.sentenceEn}>{data.example_en}</Text>
          {data.example_es ? <Text style={styles.example}>{data.example_es}</Text> : null}
        </TouchableOpacity>
      ) : null}
      {card.falseFriend ? <Text style={styles.falseFriend}>⚠️ {card.falseFriend}</Text> : null}
    </ScrollView>
  );
}

function Footer({ tone, children }) {
  return (
    <View style={[styles.footer, tone === 'right' && styles.footerRight, tone === 'wrong' && styles.footerWrong]}>
      {children}
    </View>
  );
}

function PrimaryButton({ label, onPress, disabled, color = COLORS.deepOlive }) {
  return (
    <TouchableOpacity
      style={[styles.primary, { backgroundColor: disabled ? COLORS.textPlaceholder : color }]}
      disabled={disabled}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <Text style={styles.primaryText}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  body: {
    padding: SPACING.xl,
    paddingBottom: SPACING.xxl,
  },
  introBody: {
    alignItems: 'center',
    flexGrow: 1,
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  badge: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 12,
    letterSpacing: 1,
    color: COLORS.accentOrange,
    marginBottom: SPACING.sm,
  },
  introWordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.base,
  },
  introWord: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 32,
    color: COLORS.deepOlive,
    textAlign: 'center',
    flexShrink: 1,
  },
  phonetic: {
    fontFamily: FONT_FAMILY.regular,
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  translation: {
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 22,
    color: COLORS.oliveInk,
    textAlign: 'center',
    marginTop: SPACING.sm,
  },
  example: {
    fontFamily: FONT_FAMILY.regular,
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  sentence: {
    marginTop: SPACING.base,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.sageCream,
    alignSelf: 'stretch',
    gap: 2,
  },
  sentenceEn: {
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 17,
    color: COLORS.oliveInk,
    textAlign: 'center',
  },
  falseFriend: {
    fontFamily: FONT_FAMILY.medium,
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.goldText,
    textAlign: 'center',
    marginTop: SPACING.xs,
  },
  instruction: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 20,
    color: COLORS.deepOlive,
    marginBottom: SPACING.lg,
  },
  promptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginBottom: SPACING.xl,
  },
  prompt: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 26,
    color: COLORS.oliveInk,
    flexShrink: 1,
  },
  listenRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.base,
    marginBottom: SPACING.xl,
  },
  slowButton: {
    width: 56,
    height: 56,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.sageCream,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slowIcon: {
    fontSize: 26,
  },
  listenButton: {
    width: 96,
    height: 96,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.focusBlue,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOW.button,
  },
  options: {
    gap: SPACING.md,
  },
  option: {
    minHeight: 56,
    justifyContent: 'center',
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 2,
    borderBottomWidth: 4,
    borderColor: COLORS.borderSage,
    backgroundColor: COLORS.surfaceWhite,
  },
  optionSelected: {
    borderColor: COLORS.focusBlue,
    backgroundColor: '#eaf2ff',
  },
  optionRight: {
    borderColor: COLORS.successGreen,
    backgroundColor: '#e7f6ee',
  },
  optionWrong: {
    borderColor: COLORS.dangerOrange,
    backgroundColor: '#fdece4',
  },
  optionText: {
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 17,
    color: COLORS.oliveInk,
  },
  answerArea: {
    minHeight: 112,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignContent: 'flex-start',
    gap: SPACING.sm,
    paddingVertical: SPACING.md,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.borderSage,
    marginBottom: SPACING.xl,
  },
  bank: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  tile: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.lg,
    borderWidth: 2,
    borderBottomWidth: 4,
    borderColor: COLORS.borderSage,
    backgroundColor: COLORS.surfaceWhite,
  },
  tileUsed: {
    backgroundColor: COLORS.sageCream,
    borderColor: COLORS.sageCream,
  },
  tileText: {
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 17,
    color: COLORS.oliveInk,
  },
  tileTextUsed: {
    color: 'transparent',
  },
  footer: {
    padding: SPACING.base,
    paddingBottom: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderSage,
    backgroundColor: COLORS.warmParchment,
    gap: SPACING.xs,
  },
  footerRight: {
    backgroundColor: '#e7f6ee',
    borderTopColor: COLORS.successGreen,
  },
  footerWrong: {
    backgroundColor: '#fdece4',
    borderTopColor: COLORS.dangerOrange,
  },
  feedbackTitle: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 18,
  },
  feedbackAnswer: {
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 16,
    color: COLORS.oliveInk,
  },
  feedbackMeaning: {
    fontFamily: FONT_FAMILY.regular,
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  input: {
    minHeight: 56,
    paddingHorizontal: SPACING.base,
    borderRadius: RADIUS.lg,
    borderWidth: 2,
    borderBottomWidth: 4,
    borderColor: COLORS.borderSage,
    backgroundColor: COLORS.surfaceWhite,
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 20,
    color: COLORS.textInput,
  },
  clozeBox: {
    marginBottom: SPACING.xl,
    gap: SPACING.sm,
  },
  clozeSentence: {
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 22,
    lineHeight: 32,
    color: COLORS.oliveInk,
  },
  clozeBlank: {
    fontFamily: FONT_FAMILY.bold,
    color: COLORS.accentOrange,
  },
  clozeHint: {
    fontFamily: FONT_FAMILY.regular,
    fontSize: 15,
    color: COLORS.textSecondary,
  },
  gradeHint: {
    fontFamily: FONT_FAMILY.medium,
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: SPACING.sm,
  },
  primary: {
    height: 52,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.sm,
  },
  primaryText: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 16,
    letterSpacing: 0.5,
    color: COLORS.surfaceWhite,
  },
});
