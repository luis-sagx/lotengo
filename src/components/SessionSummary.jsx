// saflash — Session summary (shown after completing a study session)
import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';
import { COLORS, Rating } from '../theme/colors';
import { RADIUS, SPACING, SHADOW } from '../theme/spacing';
import { FONT_FAMILY } from '../theme/typography';
import { playEffect } from '../services/soundService';

export default function SessionSummary({ correct = 0, wrong = 0, stars = null, xp = 0, heartGained = false, durationSecs = 0, onContinue }) {
  const total = correct + wrong;

  useEffect(() => {
    playEffect('complete');
  }, []);
  const mins = Math.floor(durationSecs / 60);
  const secs = durationSecs % 60;

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.congrats}>🎉 {heartGained ? '¡Repaso completado!' : '¡Lección completada!'}</Text>

        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{total}</Text>
            <Text style={styles.statLabel}>Tarjetas</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{mins}:{secs.toString().padStart(2, '0')}</Text>
            <Text style={styles.statLabel}>Duración</Text>
          </View>
        </View>

        <Animated.Text entering={ZoomIn.delay(150).springify()} style={styles.xp}>+{xp} XP</Animated.Text>
        {heartGained && (
          <Animated.Text entering={FadeInDown.delay(350)} style={styles.heart}>+1 ❤️ vida recuperada</Animated.Text>
        )}
        {stars != null && (
          <View style={styles.starsRow}>
            {[0, 1, 2].map(i => (
              <Animated.Text key={i} entering={ZoomIn.delay(400 + i * 180).springify()} style={styles.stars}>
                {i < stars ? '★' : '☆'}
              </Animated.Text>
            ))}
          </View>
        )}

        <Animated.View entering={FadeInDown.delay(900)} style={styles.ratingsRow}>
          <View style={[styles.ratingPill, { backgroundColor: Rating.easy + '20' }]}>
            <Ionicons name="checkmark-circle" size={16} color={Rating.easy} />
            <Text style={[styles.ratingText, { color: Rating.easy }]}>{correct} a la primera</Text>
          </View>
          <View style={[styles.ratingPill, { backgroundColor: Rating.hard + '20' }]}>
            <Ionicons name="refresh-circle" size={16} color={Rating.hard} />
            <Text style={[styles.ratingText, { color: Rating.hard }]}>{wrong} a repasar</Text>
          </View>
        </Animated.View>

        <TouchableOpacity style={styles.primaryButton} onPress={onContinue} activeOpacity={0.8}>
          <Text style={styles.primaryButtonText}>Continuar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.warmParchment,
    padding: SPACING.xl,
  },
  card: {
    backgroundColor: COLORS.surfaceWhite,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    ...SHADOW.card,
  },
  xp: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 32,
    color: COLORS.goldText,
    marginBottom: SPACING.sm,
  },
  heart: {
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 15,
    color: COLORS.dangerOrange,
    marginBottom: SPACING.sm,
  },
  starsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.base,
  },
  stars: {
    fontSize: 40,
    color: COLORS.starYellow,
  },
  congrats: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 26,
    color: COLORS.deepOlive,
    marginBottom: SPACING.xl,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: SPACING.xl,
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 28,
    color: COLORS.oliveInk,
  },
  statLabel: {
    fontFamily: FONT_FAMILY.regular,
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  ratingsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.xl,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  ratingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.pill,
    gap: 4,
  },
  ratingText: {
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 13,
  },
  primaryButton: {
    backgroundColor: COLORS.deepOlive,
    borderRadius: RADIUS.sm,
    paddingVertical: 14,
    paddingHorizontal: SPACING.xxl,
    width: '100%',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  primaryButtonText: {
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 16,
    color: COLORS.surfaceWhite,
  },
});
