// saflash — Progress: what you retain, how much English it covers, and what is coming.
import React, { useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { RADIUS, SPACING } from '../theme/spacing';
import { FONT_FAMILY } from '../theme/typography';
import { useProgress } from '../hooks/useProgress';
import { getSessions } from '../database/sessionRepository';
import { formatNumber, formatStreak } from '../utils/formatters';
import { formatRelative } from '../utils/dateUtils';
import StatsCard from '../components/StatsCard';
import AchievementBadge from '../components/AchievementBadge';
import ProgressBar from '../components/ProgressBar';
import ScreenHeader from '../components/ScreenHeader';
import StatusBarScrim from '../components/StatusBarScrim';

const WEEKDAYS = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
const SESSION_LABELS = { lesson: '🗺️ Lección por tema', review: '🔁 Sesión diaria' };
const percent = value => `${Math.round(value * 100)}%`;

export default function ProgressScreen() {
  const {
    study,
    streak,
    totalWords,
    totalPhrases,
    memory,
    retention,
    targetRetention,
    forecast,
    achievements,
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
  // no user_progress row, so they count as "new" here.
  const totalCards = totalWords + totalPhrases;
  const studiedCards = study.learningCount + study.reviewingCount + study.knownCount;
  const newCount = Math.max(0, totalCards - studiedCards);

  const distributionTotal = newCount + studiedCards || 1;
  const newPct = Math.round((newCount / distributionTotal) * 100);
  const learningPct = Math.round((study.learningCount / distributionTotal) * 100);
  const reviewingPct = Math.round((study.reviewingCount / distributionTotal) * 100);
  const knownPct = Math.round((study.knownCount / distributionTotal) * 100);
  const peak = Math.max(1, ...forecast.map(d => d.count));

  return (
    <View style={styles.container}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <ScreenHeader
          title="Progreso"
          trailing={<Text style={styles.streakText}>🔥 {formatStreak(streak)}{streak > 0 ? ' de racha' : ''}</Text>}
        />

        <View style={styles.statsRow}>
          <StatsCard icon="bulb" value={formatNumber(memory.retained)} label="Recuerdas hoy" color={COLORS.focusBlue} />
          <StatsCard icon="checkmark-done" value={formatNumber(memory.mature)} label="Dominadas" color={COLORS.successGreen} />
          <StatsCard icon="flame" value={`${streak}`} label="Días" color={COLORS.goldText} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cobertura del inglés cotidiano</Text>
          <View style={styles.progressCard}>
            <Text style={styles.bigNumber}>~{percent(memory.coverage)}</Text>
            <ProgressBar
              current={Math.round(memory.coverage * 1000)}
              total={1000}
              color={COLORS.focusBlue}
              backgroundColor={COLORS.sageCream}
              showLabel={false}
            />
            <Text style={styles.explain}>
              De cada 100 palabras que se dicen en conversaciones (subtítulos de películas y series),
              unas {Math.round(memory.coverage * 100)} son palabras que hoy recuerdas. Las más frecuentes
              valen más, por eso aprenderlas primero rinde tanto.
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Retención real (30 días)</Text>
          <View style={styles.progressCard}>
            {retention.rate == null ? (
              <Text style={styles.explain}>
                Aparecerá cuando hayas repasado al menos 20 tarjetas ya aprendidas ({retention.count} hasta ahora).
              </Text>
            ) : (
              <>
                <View style={styles.progressRow}>
                  <Text style={styles.bigNumber}>{percent(retention.rate)}</Text>
                  <Text style={styles.progressLabel}>objetivo {percent(targetRetention)}</Text>
                </View>
                <Text style={styles.explain}>
                  De {retention.count} repasos, recordaste {percent(retention.rate)}.
                  {retention.rate < targetRetention - 0.05
                    ? ' Está por debajo del objetivo: prueba con menos palabras nuevas al día.'
                    : ' Vas en línea con tu objetivo.'}
                </Text>
              </>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Repasos de los próximos 7 días</Text>
          <View
            style={[styles.progressCard, styles.chart]}
            accessible
            accessibilityLabel={`Repasos por día: ${forecast.map(d => `${WEEKDAYS[d.date.getDay()]} ${d.count}`).join(', ')}`}
          >
            {forecast.map((day, i) => (
              <View key={day.date.getTime()} style={styles.barColumn}>
                <Text style={styles.barValue}>{day.count}</Text>
                <View style={styles.barTrack}>
                  <View style={[styles.bar, { height: `${(day.count / peak) * 100}%` }]} />
                </View>
                <Text style={styles.barLabel}>{i === 0 ? 'hoy' : WEEKDAYS[day.date.getDay()]}</Text>
              </View>
            ))}
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
                <Text style={styles.distLabel}>Dominadas</Text>
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
                    {SESSION_LABELS[session.session_type] || session.session_type}
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
      <StatusBarScrim />
    </View>
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
    color: COLORS.goldText,
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
  bigNumber: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 32,
    color: COLORS.deepOlive,
    marginBottom: SPACING.sm,
  },
  explain: {
    fontFamily: FONT_FAMILY.regular,
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.textSecondary,
    marginTop: SPACING.sm,
  },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: SPACING.sm,
  },
  barColumn: {
    flex: 1,
    alignItems: 'center',
  },
  barTrack: {
    height: 96,
    width: '100%',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  bar: {
    width: 14,
    minHeight: 2,
    backgroundColor: COLORS.focusBlue,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  barValue: {
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  barLabel: {
    fontFamily: FONT_FAMILY.medium,
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
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
