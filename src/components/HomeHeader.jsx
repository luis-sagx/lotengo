// saflash — Shared home/path header.
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../theme/colors';
import { SPACING } from '../theme/spacing';
import { FONT_FAMILY } from '../theme/typography';
import StreakBadge from './StreakBadge';
import ScreenHeader from './ScreenHeader';
import ProgressBar from './ProgressBar';
import StatsCard from './StatsCard';
import { formatNumber } from '../utils/formatters';
import { getCurrentMonthYear } from '../utils/dateUtils';

export default function HomeHeader({ streak, todayStudied, goal, knownCount }) {
  return (
    <>
      <ScreenHeader
        title="¡Hola! 👋"
        subtitle={getCurrentMonthYear()}
        trailing={<StreakBadge days={streak} />}
      />

      <View style={styles.goalCard}>
        <View style={styles.goalHeader}>
          <Text style={styles.goalTitle}>Meta diaria</Text>
          <Text style={styles.goalCount}>{todayStudied} / {goal}</Text>
        </View>
        <ProgressBar current={todayStudied} total={goal} color={COLORS.successGreen} />
      </View>

      <View style={styles.statsRow}>
        <StatsCard icon="today" value={todayStudied} label="Hoy" color={COLORS.accentOrange} />
        <StatsCard icon="flame" value={`${streak}`} label="Racha" color={COLORS.amberGold} />
        <StatsCard icon="checkmark-done" value={formatNumber(knownCount)} label="Conocidas" color={COLORS.successGreen} />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  goalCard: {
    marginHorizontal: SPACING.xl,
    backgroundColor: COLORS.surfaceWhite,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.borderSage,
    padding: SPACING.base,
    marginBottom: SPACING.base,
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
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.xl,
    gap: SPACING.sm,
    marginBottom: SPACING.base,
  },
});
