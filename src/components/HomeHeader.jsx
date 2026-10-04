// saflash — Path header: streak, hearts and the daily XP goal.
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../theme/colors';
import { RADIUS, SPACING } from '../theme/spacing';
import { FONT_FAMILY } from '../theme/typography';
import ScreenHeader from './ScreenHeader';
import ProgressBar from './ProgressBar';
import HeartsBadge from './HeartsBadge';

export default function HomeHeader({ streak, todayXp, goal, hearts }) {
  const reached = todayXp >= goal;

  return (
    <>
      <ScreenHeader
        title="¡Hola! 👋"
        trailing={
          <View style={styles.chips}>
            <View style={styles.chip} accessibilityLabel={`Racha de ${streak} días`}>
              <Text style={styles.chipText}>🔥 {streak}</Text>
            </View>
            <HeartsBadge hearts={hearts} />
          </View>
        }
      />

      <View style={styles.goalCard}>
        <View style={styles.goalHeader}>
          <Text style={styles.goalTitle}>{reached ? '¡Meta diaria cumplida! 🎉' : 'Meta diaria'}</Text>
          <Text style={styles.goalCount}>⚡ {todayXp} / {goal} XP</Text>
        </View>
        <ProgressBar current={Math.min(todayXp, goal)} total={goal} color={COLORS.amberGold} />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  chips: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  chip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.surfaceWhite,
    borderWidth: 1,
    borderColor: COLORS.borderSage,
  },
  chipText: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 15,
    color: COLORS.deepOlive,
  },
  goalCard: {
    marginHorizontal: SPACING.xl,
    backgroundColor: COLORS.surfaceWhite,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.borderSage,
    padding: SPACING.base,
    marginBottom: SPACING.sm,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  goalTitle: {
    fontFamily: FONT_FAMILY.medium,
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  goalCount: {
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 14,
    color: COLORS.oliveInk,
  },
});
