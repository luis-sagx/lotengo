// saflash — Quick CEFR placement test.
import React, { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../theme/colors';
import { RADIUS, SPACING } from '../theme/spacing';
import { FONT_FAMILY } from '../theme/typography';
import { buildPlacementQuestions, scorePlacement } from '../services/placementService.mjs';
import { setCurrentLesson, setLevel, setOnboardingDone, setPlacementDone } from '../database/sessionRepository';
import { getFirstLessonForLevel, unlockUpTo } from '../database/lessonsRepository';
import useAppStore from '../store/appStore';

export default function PlacementTestScreen({ navigation, route }) {
  const mode = route.params?.mode || 'onboarding';
  const questions = useMemo(() => buildPlacementQuestions(), []);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const setOnboardingDoneStore = useAppStore(s => s.setOnboardingDone);
  const setStoreLevel = useAppStore(s => s.setLevel);
  const question = questions[index];

  const finish = async (nextAnswers) => {
    const level = scorePlacement(nextAnswers);
    await setLevel(level);
    await setPlacementDone();
    await unlockUpTo(level);
    const current = await getFirstLessonForLevel(level);
    if (current) await setCurrentLesson(current.id);
    setStoreLevel(level);

    if (mode === 'change') {
      navigation.popToTop();
      return;
    }

    await setOnboardingDone();
    setOnboardingDoneStore(true);
    navigation.replace('MainTabs');
  };

  const answer = async (option) => {
    const correct = option !== null && option === question.answer;
    const nextAnswers = {
      ...answers,
      [question.level]: [...(answers[question.level] || []), correct],
    };
    setAnswers(nextAnswers);

    if (index + 1 >= questions.length) {
      await finish(nextAnswers);
    } else {
      setIndex(i => i + 1);
    }
  };

  if (!question) return null;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.counter}>{index + 1} / {questions.length}</Text>
        <Text style={styles.title}>¿Qué significa?</Text>
        <Text style={styles.prompt}>{question.prompt}</Text>
      </View>

      <View style={styles.options}>
        {question.options.map(option => (
          <TouchableOpacity key={option} style={styles.option} onPress={() => answer(option)}>
            <Text style={styles.optionText}>{option}</Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity style={styles.skip} onPress={() => answer(null)}>
          <Text style={styles.skipText}>No sé</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.warmParchment,
    padding: SPACING.xl,
  },
  header: {
    marginTop: SPACING.xl,
    marginBottom: SPACING.xl,
  },
  counter: {
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 13,
    color: COLORS.accentOrange,
  },
  title: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 24,
    color: COLORS.deepOlive,
    marginTop: SPACING.md,
  },
  prompt: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 36,
    color: COLORS.oliveInk,
    marginTop: SPACING.xl,
  },
  options: {
    gap: SPACING.md,
  },
  option: {
    backgroundColor: COLORS.surfaceWhite,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.borderSage,
    padding: SPACING.base,
  },
  skip: {
    alignItems: 'center',
    padding: SPACING.base,
    marginTop: SPACING.sm,
  },
  skipText: {
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 15,
    color: COLORS.textPlaceholder,
  },
  optionText: {
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 16,
    color: COLORS.oliveInk,
  },
});
