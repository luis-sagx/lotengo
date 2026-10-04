// saflash — Path lesson quiz screen.
import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { RADIUS } from '../theme/spacing';
import { SPACING } from '../theme/spacing';
import { FONT_FAMILY } from '../theme/typography';
import { useLessonSession } from '../hooks/useLessonSession';
import Exercise from '../components/Exercise';
import ProgressBar from '../components/ProgressBar';
import LoadingCard from '../components/LoadingCard';
import SessionSummary from '../components/SessionSummary';
import LevelSuggestionCard from '../components/LevelSuggestionCard';
import HeartsBadge from '../components/HeartsBadge';
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
          correct={session.completed.correct}
          wrong={session.completed.wrong}
          stars={session.completed.stars}
          xp={session.completed.xp}
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

  if (session.outOfHearts) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.empty}>
          <Text style={styles.brokenHeart}>💔</Text>
          <Text style={styles.outTitle}>Te quedaste sin vidas</Text>
          <Text style={styles.emptyText}>Recuperas una vida cada 30 minutos, o al completar un repaso.</Text>
          <HeartsBadge hearts={session.hearts} />
          <TouchableOpacity style={styles.outPrimary} onPress={() => navigation.replace('StudySession')}>
            <Text style={styles.outPrimaryText}>Repasar y ganar una vida</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.outSecondary} onPress={() => navigation.goBack()}>
            <Text style={styles.outSecondaryText}>Volver a la ruta</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header
        navigation={navigation}
        current={session.index}
        total={session.total}
        hearts={session.hearts}
        combo={session.combo}
      />
      {session.step && <Exercise step={session.step} onCheck={session.answer} onNext={session.next} />}
    </SafeAreaView>
  );
}

function Header({ navigation, current, total, hearts, combo = 0 }) {
  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => navigation.goBack()} accessibilityLabel="Salir de la lección">
        <Ionicons name="close" size={28} color={COLORS.oliveInk} />
      </TouchableOpacity>
      <View style={styles.progressWrapper}>
        {combo >= 3 && <Text style={styles.combo}>🔥 {combo} seguidas</Text>}
        <ProgressBar current={current} total={total} color={COLORS.successGreen} height={12} />
      </View>
      <HeartsBadge hearts={hearts} showTimer={false} />
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
  combo: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 12,
    color: COLORS.accentOrange,
    marginBottom: 2,
  },
  brokenHeart: {
    fontSize: 56,
    marginBottom: SPACING.sm,
  },
  outTitle: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 22,
    color: COLORS.deepOlive,
    marginBottom: SPACING.sm,
  },
  outPrimary: {
    alignSelf: 'stretch',
    height: 52,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.deepOlive,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.xl,
  },
  outPrimaryText: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 16,
    color: COLORS.surfaceWhite,
  },
  outSecondary: {
    alignSelf: 'stretch',
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.sm,
  },
  outSecondaryText: {
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 15,
    color: COLORS.textSecondary,
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
