// saflash — Progress screen (stats, charts, achievements)
import React, { useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, Dimensions } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { RADIUS, SPACING } from '../theme/spacing';
import { FONT_FAMILY } from '../theme/typography';
import { useProgress } from '../hooks/useProgress';
import { getSessions, getWeekStats } from '../database/sessionRepository';
import { formatNumber, formatProgress, formatStreak } from '../utils/formatters';
import { formatDateShort, formatRelative } from '../utils/dateUtils';
import StatsCard from '../components/StatsCard';
import AchievementBadge from '../components/AchievementBadge';
import ProgressBar from '../components/ProgressBar';
import ScreenHeader from '../components/ScreenHeader';

const { width } = Dimensions.get('window');

export default function ProgressScreen() {
  const {
    study,
    todayStudied,
    streak,
    totalStudied,
    dailyGoal,
    totalWords,
    totalPhrases,
    achievements,
    loading,
    refresh,
  } = useProgress();

  const [sessions, setSessions] = React.useState([]);

  useFocusEffect(
    useCallback(() => {
      refresh();
      getSessions(15).then(setSessions).catch(() => {});
    }, [refresh])
  );

  // Distribution is over EVERY card (words + phrases). Cards never studied have
  // no user_progress row, so they aren't tracked — count them as "new" here so
  // the chart reflects the whole deck, not just the handful already touched.
  const totalCards = totalWords + totalPhrases;
  const studiedCards = study.learningCount + study.reviewingCount + study.knownCount;
  const newCount = Math.max(0, totalCards - studiedCards);

  const distributionTotal = newCount + studiedCards || 1;
  const newPct = Math.round((newCount / distributionTotal) * 100);
  const learningPct = Math.round((study.learningCount / distributionTotal) * 100);
  const reviewingPct = Math.round((study.reviewingCount / distributionTotal) * 100);
  const knownPct = Math.round((study.knownCount / distributionTotal) * 100);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <ScreenHeader
        title="Progreso"
        trailing={<Text style={styles.streakText}>🔥 {formatStreak(streak)}{streak > 0 ? ' de racha' : ''}</Text>}
      />

      {/* Stats row */}
      <View style={styles.statsRow}>
        <StatsCard icon="book" value={formatNumber(totalWords)} label="Palabras" color={COLORS.deepOlive} />
        <StatsCard icon="chatbubbles" value={formatNumber(totalPhrases)} label="Frases" color={COLORS.successGreen} />
        <StatsCard icon="flame" value={`${streak}`} label="Días" color={COLORS.amberGold} />
      </View>

      {/* Word progress */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Tarjetas estudiadas</Text>
        <View style={styles.progressCard}>
          <View style={styles.progressRow}>
            <Text style={styles.progressLabel}>Estudiadas</Text>
            <Text style={styles.progressValue}>
              {formatProgress(studiedCards, totalCards)} ({studiedCards}/{totalCards})
            </Text>
          </View>
          <ProgressBar
            current={studiedCards}
            total={totalCards}
            color={COLORS.deepOlive}
            backgroundColor={COLORS.sageCream}
            showLabel={false}
          />
          <View style={[styles.progressRow, { marginTop: SPACING.sm, marginBottom: 0 }]}>
            <Text style={styles.progressLabel}>Dominadas (conocidas)</Text>
            <Text style={styles.progressValue}>{study.knownCount}</Text>
          </View>
        </View>
      </View>

      {/* Distribution */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Distribución de tarjetas</Text>
        <View style={styles.distributionCard}>
          <View style={styles.distRow}>
            <View style={styles.distItem}>
              <View style={[styles.distDot, { backgroundColor: COLORS.textPlaceholder }]} />
              <Text style={styles.distLabel}>Nuevas</Text>
              <Text style={styles.distValue}>{newCount} ({newPct}%)</Text>
            </View>
            <View style={styles.distItem}>
              <View style={[styles.distDot, { backgroundColor: COLORS.dangerOrange }]} />
              <Text style={styles.distLabel}>Aprendiendo</Text>
              <Text style={styles.distValue}>{study.learningCount} ({learningPct}%)</Text>
            </View>
          </View>
          <View style={styles.distRow}>
            <View style={styles.distItem}>
              <View style={[styles.distDot, { backgroundColor: COLORS.amberGold }]} />
              <Text style={styles.distLabel}>Repasando</Text>
              <Text style={styles.distValue}>{study.reviewingCount} ({reviewingPct}%)</Text>
            </View>
            <View style={styles.distItem}>
              <View style={[styles.distDot, { backgroundColor: COLORS.successGreen }]} />
              <Text style={styles.distLabel}>Conocidas</Text>
              <Text style={styles.distValue}>{study.knownCount} ({knownPct}%)</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Achievements */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Logros</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.achievementsScroll}>
          {achievements.map(a => (
            <AchievementBadge
              key={a.id}
              id={a.id}
              icon={a.icon}
              title={a.title}
              unlocked={a.unlocked}
            />
          ))}
        </ScrollView>
      </View>

      {/* Session history */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Historial de sesiones</Text>
        {sessions.length === 0 ? (
          <View style={styles.emptyHistory}>
            <Ionicons name="time-outline" size={32} color={COLORS.textPlaceholder} />
            <Text style={styles.emptyHistoryText}>Todavía no completaste ninguna sesión.</Text>
          </View>
        ) : (
          sessions.map(session => (
            <View key={session.id} style={styles.sessionRow}>
              <View style={styles.sessionInfo}>
                <Text style={styles.sessionDate}>{formatRelative(session.session_date)}</Text>
                <Text style={styles.sessionType}>
                  {session.session_type === 'word' ? '📚 Palabras' : '💬 Frases'}
                </Text>
              </View>
              <View style={styles.sessionStats}>
                <Text style={styles.sessionCards}>{session.cards_studied} tarjetas</Text>
                <Text style={styles.sessionDuration}>
                  {Math.floor(session.duration_secs / 60)}m
                </Text>
              </View>
            </View>
          ))
        )}
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.warmParchment,
  },
  streakText: {
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 15,
    color: COLORS.amberGold,
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.xl,
    gap: SPACING.sm,
    marginBottom: SPACING.base,
  },
  section: {
    paddingHorizontal: SPACING.xl,
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 17,
    color: COLORS.deepOlive,
    marginBottom: SPACING.md,
  },
  progressCard: {
    backgroundColor: COLORS.surfaceWhite,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.borderSage,
    padding: SPACING.base,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  progressLabel: {
    fontFamily: FONT_FAMILY.medium,
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  progressValue: {
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 14,
    color: COLORS.oliveInk,
  },
  distributionCard: {
    backgroundColor: COLORS.surfaceWhite,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.borderSage,
    padding: SPACING.base,
    gap: SPACING.md,
  },
  distRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  distItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  distDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  distLabel: {
    fontFamily: FONT_FAMILY.regular,
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  distValue: {
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 13,
    color: COLORS.oliveInk,
  },
  achievementsScroll: {
    marginBottom: SPACING.sm,
  },
  emptyHistory: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
    gap: SPACING.sm,
  },
  emptyHistoryText: {
    fontFamily: FONT_FAMILY.regular,
    fontSize: 14,
    color: COLORS.textPlaceholder,
  },
  sessionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceWhite,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.borderSage,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  sessionInfo: {
    flex: 1,
  },
  sessionDate: {
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 14,
    color: COLORS.oliveInk,
  },
  sessionType: {
    fontFamily: FONT_FAMILY.regular,
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  sessionStats: {
    alignItems: 'flex-end',
  },
  sessionCards: {
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 14,
    color: COLORS.oliveInk,
  },
  sessionDuration: {
    fontFamily: FONT_FAMILY.regular,
    fontSize: 12,
    color: COLORS.textPlaceholder,
  },
});
