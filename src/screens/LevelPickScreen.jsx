// saflash — Level picker for onboarding and settings.
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, DifficultyColors } from '../theme/colors';
import { RADIUS, SPACING } from '../theme/spacing';
import { FONT_FAMILY } from '../theme/typography';
import { LEVEL_LABELS, LEVEL_SELF_DESCRIPTIONS } from '../utils/constants';
import { setCurrentLesson, setLevel, setOnboardingDone, setPlacementDone } from '../database/sessionRepository';
import { unlockUpTo, getFirstLessonForLevel } from '../database/lessonsRepository';
import useAppStore from '../store/appStore';

const PICK_LEVELS = Object.keys(LEVEL_SELF_DESCRIPTIONS);
const LEVEL_ICONS = {
  A1: 'leaf-outline',
  A2: 'book-outline',
  B1: 'chatbubbles-outline',
  B2: 'rocket-outline',
  C1: 'trophy-outline',
};

export default function LevelPickScreen({ navigation, route }) {
  const mode = route.params?.mode || 'onboarding';
  const setOnboardingDoneStore = useAppStore(s => s.setOnboardingDone);
  const setStoreLevel = useAppStore(s => s.setLevel);

  const applyLevel = async (level) => {
    await setLevel(level);
    await setPlacementDone();
    await unlockUpTo(level);
    const current = await getFirstLessonForLevel(level);
    if (current) await setCurrentLesson(current.id);
    setStoreLevel(level);

    if (mode === 'change') {
      navigation.goBack();
      return;
    }

    await setOnboardingDone();
    setOnboardingDoneStore(true);
    navigation.replace('MainTabs', {
      screen: 'Home',
      params: current ? { screen: 'Path', params: { lessonId: current.id } } : undefined,
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        {mode === 'change' && (
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color={COLORS.oliveInk} />
          </TouchableOpacity>
        )}
        <Text style={styles.title}>Elegí tu nivel</Text>
        <Text style={styles.subtitle}>Podés cambiarlo cuando quieras desde Ajustes.</Text>
      </View>

      <View style={styles.options}>
        {PICK_LEVELS.map(level => (
          <TouchableOpacity
            key={level}
            style={[styles.option, { borderColor: DifficultyColors[level] }]}
            onPress={() => applyLevel(level)}
            activeOpacity={0.8}
          >
            <View style={[styles.levelBadge, { backgroundColor: DifficultyColors[level] }]}>
              <Ionicons name={LEVEL_ICONS[level]} size={24} color={COLORS.surfaceWhite} />
            </View>
            <View style={styles.optionCopy}>
              <Text style={styles.optionTitle}>{LEVEL_LABELS[level]}</Text>
              <Text style={styles.optionSubtitle}>{LEVEL_SELF_DESCRIPTIONS[level]}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.textPlaceholder} />
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={styles.testButton}
        onPress={() => navigation.navigate('PlacementTest', { mode })}
      >
        <Ionicons name="clipboard-outline" size={18} color={COLORS.accentOrange} />
        <Text style={styles.testButtonText}>Prefiero hacer un test rápido</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.warmParchment,
  },
  header: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.lg,
  },
  backButton: {
    marginBottom: SPACING.base,
  },
  title: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 28,
    color: COLORS.deepOlive,
  },
  subtitle: {
    fontFamily: FONT_FAMILY.regular,
    fontSize: 15,
    color: COLORS.textSecondary,
    marginTop: SPACING.sm,
    lineHeight: 21,
  },
  options: {
    paddingHorizontal: SPACING.xl,
    gap: SPACING.md,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    backgroundColor: COLORS.surfaceWhite,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    padding: SPACING.base,
  },
  levelBadge: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelBadgeText: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 16,
    color: COLORS.surfaceWhite,
  },
  optionCopy: {
    flex: 1,
  },
  optionTitle: {
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 16,
    color: COLORS.oliveInk,
  },
  optionSubtitle: {
    fontFamily: FONT_FAMILY.regular,
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    padding: SPACING.xl,
  },
  testButtonText: {
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 15,
    color: COLORS.accentOrange,
  },
});
