// saflash — Path lesson quiz screen.
import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { SPACING } from '../theme/spacing';
import { FONT_FAMILY } from '../theme/typography';
import { useLessonSession } from '../hooks/useLessonSession';
import Exercise from '../components/Exercise';
import ProgressBar from '../components/ProgressBar';
import LoadingCard from '../components/LoadingCard';
import SessionSummary from '../components/SessionSummary';
import LevelSuggestionCard from '../components/LevelSuggestionCard';
import { getCompletedCount, getFirstLessonForLevel, getRecentAccuracies, unlockUpTo } from '../database/lessonsRepository';
import { dismissLevelSuggestion, getConfig, setCurrentLesson, setLevel } from '../database/sessionRepository';
import { getLevelSuggestion } from '../services/levelAdjustment.mjs';
import useAppStore from '../store/appStore';

export default function StudyLessonScreen({ navigation, route }) {
  const lessonId = route.params?.lessonId;
  const session = useLessonSession(lessonId);
  const [suggestion, setSuggestion] = useState(null);
  const setStoreLevel = useAppStore(s => s.setLevel);

  useEffect(() => {
    async function loadSuggestion() {
      if (!session.completed) return;
      const [config, recentAccuracies, completedCount] = await Promise.all([
        getConfig(),
        getRecentAccuracies(3),
        getCompletedCount(),
      ]);
      setSuggestion(getLevelSuggestion({
        level: config?.level || 'A1',
        recentAccuracies,
        completedCount,
        dismissedAt: config?.suggestion_dismissed_at ?? -1,
      }));
    }
    loadSuggestion();
  }, [session.completed]);

  const acceptSuggestion = async () => {
    if (!suggestion) return;
    await setLevel(suggestion.level);
    await unlockUpTo(suggestion.level);
    const current = await getFirstLessonForLevel(suggestion.level);
    if (current) await setCurrentLesson(current.id);
    setStoreLevel(suggestion.level);
    setSuggestion(null);
    navigation.goBack();
  };

  const dismissSuggestion = async () => {
    const completedCount = await getCompletedCount();
    await dismissLevelSuggestion(completedCount);
    setSuggestion(null);
  };

  if (session.loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Header navigation={navigation} current={0} total={1} />
        <LoadingCard />
      </SafeAreaView>
    );
  }

  if (session.error || session.total === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <Header navigation={navigation} current={0} total={1} />
        <View style={styles.empty}>
          <Text style={styles.emptyText}>
            {session.error || 'No hay tarjetas en esta lección.'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (session.completed) {
    return (
      <View style={styles.summaryWrap}>
        <SessionSummary
          title="¡Lección completada!"
          correct={session.completed.correct}
          wrong={session.completed.wrong}
          stars={session.completed.stars}
          durationSecs={session.completed.durationSecs}
          onContinue={() => navigation.goBack()}
        />
        <View style={styles.suggestionOverlay}>
          <LevelSuggestionCard
            suggestion={suggestion}
            onAccept={acceptSuggestion}
            onDismiss={dismissSuggestion}
          />
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header
        navigation={navigation}
        current={session.index}
        total={session.total}
      />
      {session.step && <Exercise step={session.step} onCheck={session.answer} onNext={session.next} />}
    </SafeAreaView>
  );
}

function Header({ navigation, current, total }) {
  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => navigation.goBack()} accessibilityLabel="Salir de la lección">
        <Ionicons name="close" size={28} color={COLORS.oliveInk} />
      </TouchableOpacity>
      <View style={styles.progressWrapper}>
        <ProgressBar current={current} total={total} color={COLORS.successGreen} height={12} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.warmParchment,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.sm,
    gap: SPACING.md,
  },
  progressWrapper: {
    flex: 1,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  emptyText: {
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.base,
  },
  summaryWrap: {
    flex: 1,
  },
  suggestionOverlay: {
    position: 'absolute',
    left: SPACING.xl,
    right: SPACING.xl,
    bottom: SPACING.xl,
  },
});
