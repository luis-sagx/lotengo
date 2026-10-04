// saflash — Home: today's reviews and new words, in one short session.
import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { RADIUS, SPACING, SHADOW } from '../theme/spacing';
import { FONT_FAMILY } from '../theme/typography';
import ScreenHeader from '../components/ScreenHeader';
import StatusBarScrim from '../components/StatusBarScrim';
import { loadToday } from '../hooks/useStudySession';
import { getTotalDueCount, getStudyStats } from '../database/progressRepository';
import { endOfLocalDay } from '../services/streak.mjs';

// Rough pace: a review takes ~10 s, a new word ~30 s.
function estimateMinutes(due, fresh) {
  return Math.max(1, Math.round((due * 10 + fresh * 30) / 60));
}

export default function TodayScreen({ navigation }) {
  const [today, setToday] = useState(null);

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      Promise.all([loadToday(), getTotalDueCount(endOfLocalDay(tomorrow)), getStudyStats()])
        .then(([{ config, due, fresh }, dueTomorrow, stats]) => {
          if (!alive) return;
          setToday({
            due: due.length,
            fresh: fresh.length,
            dueTomorrow: dueTomorrow - due.length,
            studied: stats.totalTracked,
            streak: config?.streak_days || 0,
          });
        })
        .catch(err => console.error('Error loading today:', err));
      return () => {
        alive = false;
      };
    }, [])
  );

  const pending = today ? today.due + today.fresh : 0;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ScreenHeader
          title="Hoy"
          subtitle="Repasa justo antes de olvidar"
          trailing={
            <View style={styles.chip} accessibilityLabel={`Racha de ${today?.streak || 0} días`}>
              <Text style={styles.chipText}>🔥 {today?.streak || 0}</Text>
            </View>
          }
        />

        {today && (
          <View style={styles.card}>
            {pending > 0 ? (
              <>
                <View style={styles.counts}>
                  <Count value={today.due} label={today.due === 1 ? 'repaso' : 'repasos'} color={COLORS.focusBlue} />
                  <Count value={today.fresh} label={today.fresh === 1 ? 'palabra nueva' : 'palabras nuevas'} color={COLORS.successGreen} />
                </View>
                <TouchableOpacity
                  style={styles.primary}
                  onPress={() => navigation.navigate('StudySession')}
                  accessibilityRole="button"
                >
                  <Ionicons name="play" size={18} color={COLORS.surfaceWhite} />
                  <Text style={styles.primaryText}>Empezar · ~{estimateMinutes(today.due, today.fresh)} min</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.doneTitle}>¡Estás al día! ✅</Text>
                <Text style={styles.doneText}>
                  {today.dueTomorrow > 0
                    ? `Mañana te esperan ${today.dueTomorrow} ${today.dueTomorrow === 1 ? 'repaso' : 'repasos'}.`
                    : 'Vuelve mañana para seguir.'}
                </Text>
                {today.studied > 0 && (
                  <TouchableOpacity
                    style={styles.secondary}
                    onPress={() => navigation.navigate('StudySession', { practice: true })}
                    accessibilityRole="button"
                  >
                    <Text style={styles.secondaryText}>Práctica libre</Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>
        )}

        <View style={styles.tips}>
          <Tip icon="repeat" text="Primero repasas lo que estás por olvidar; después aprendes pocas palabras nuevas." />
          <Tip icon="create-outline" text="Escribir la respuesta cuesta más que elegirla, y por eso se recuerda mejor." />
          <Tip icon="moon-outline" text="Dormir entre sesiones fija lo aprendido: mejor un rato cada día que mucho de una vez." />
        </View>

        <TouchableOpacity style={styles.link} onPress={() => navigation.navigate('Topics')} accessibilityRole="button">
          <Ionicons name="map-outline" size={20} color={COLORS.deepOlive} />
          <Text style={styles.linkText}>Explorar por temas</Text>
          <Ionicons name="chevron-forward" size={18} color={COLORS.textSecondary} />
        </TouchableOpacity>
      </ScrollView>
      <StatusBarScrim />
    </View>
  );
}

function Count({ value, label, color }) {
  return (
    <View style={styles.count}>
      <Text style={[styles.countValue, { color }]}>{value}</Text>
      <Text style={styles.countLabel}>{label}</Text>
    </View>
  );
}

function Tip({ icon, text }) {
  return (
    <View style={styles.tip}>
      <Ionicons name={icon} size={18} color={COLORS.textSecondary} />
      <Text style={styles.tipText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.warmParchment,
  },
  content: {
    paddingBottom: SPACING.xxl,
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
  card: {
    marginHorizontal: SPACING.xl,
    padding: SPACING.lg,
    backgroundColor: COLORS.surfaceWhite,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.borderSage,
  },
  counts: {
    flexDirection: 'row',
    marginBottom: SPACING.lg,
  },
  count: {
    flex: 1,
    alignItems: 'center',
  },
  countValue: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 40,
  },
  countLabel: {
    fontFamily: FONT_FAMILY.medium,
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  primary: {
    height: 52,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.deepOlive,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    ...SHADOW.button,
  },
  primaryText: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 16,
    color: COLORS.surfaceWhite,
  },
  doneTitle: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 20,
    color: COLORS.deepOlive,
    textAlign: 'center',
  },
  doneText: {
    fontFamily: FONT_FAMILY.regular,
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.xs,
  },
  secondary: {
    height: 48,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.borderSage,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.base,
  },
  secondaryText: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 15,
    color: COLORS.deepOlive,
  },
  tips: {
    marginHorizontal: SPACING.xl,
    marginTop: SPACING.xl,
    gap: SPACING.md,
  },
  tip: {
    flexDirection: 'row',
    gap: SPACING.sm,
    alignItems: 'flex-start',
  },
  tipText: {
    flex: 1,
    fontFamily: FONT_FAMILY.regular,
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.textSecondary,
  },
  link: {
    marginHorizontal: SPACING.xl,
    marginTop: SPACING.xl,
    minHeight: 52,
    paddingHorizontal: SPACING.base,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.surfaceWhite,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.borderSage,
  },
  linkText: {
    flex: 1,
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 15,
    color: COLORS.deepOlive,
  },
});
