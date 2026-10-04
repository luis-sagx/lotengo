// saflash — Guided fixed lesson study screen.
import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { SPACING } from '../theme/spacing';
import { FONT_FAMILY } from '../theme/typography';
import { useLessonSession } from '../hooks/useLessonSession';
import FlashCard from '../components/FlashCard';
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

  if (session.error || session.totalCards === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <Header navigation={navigation} current={0} total={1} />
        <View style={styles.empty}>
          <Text style={styles.emptyText}>{session.error || 'No hay tarjetas en esta lección.'}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (session.isComplete) {
    return (
      <View style={styles.summaryWrap}>
        <SessionSummary
          easy={session.stats.easy}
          medium={session.stats.medium}
          hard={session.stats.hard}
          durationSecs={session.completed.durationSecs}
          onContinue={() => navigation.goBack()}
          onViewProgress={() => navigation.goBack()}
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
        current={session.currentIndex}
        total={session.totalCards}
      />
      <View style={styles.cardArea}>
        <FlashCard
          card={session.currentCard}
          cardType={session.currentCard?.card_type || 'word'}
          onRatingPress={session.scoreCard}
        />
      </View>
      <Text style={styles.hint}>Toca la tarjeta para ver la traducción</Text>
    </SafeAreaView>
  );
}

function Header({ navigation, current, total }) {
  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Ionicons name="close" size={28} color={COLORS.oliveInk} />
      </TouchableOpacity>
      <View style={styles.progressWrapper}>
        <ProgressBar current={current} total={total} color={COLORS.deepOlive} height={4} />
      </View>
      <Text style={styles.counter}>{Math.min(current + 1, total)} / {total}</Text>
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
  counter: {
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  cardArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  hint: {
    fontFamily: FONT_FAMILY.regular,
    fontSize: 13,
    color: COLORS.textPlaceholder,
    textAlign: 'center',
    marginBottom: SPACING.xl,
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
