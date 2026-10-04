// saflash — Anki-style self-rating buttons (feed SM-2).
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS, Rating } from '../theme/colors';
import { RADIUS, SPACING } from '../theme/spacing';
import { FONT_FAMILY } from '../theme/typography';
import { RATING } from '../utils/constants';

const BUTTONS = [
  { rating: RATING.HARD, label: 'Difícil', hint: 'Otra vez pronto', bg: Rating.hard, ink: COLORS.surfaceWhite },
  { rating: RATING.MEDIUM, label: 'Bien', hint: 'Me costó', bg: Rating.medium, ink: COLORS.deepOlive },
  { rating: RATING.EASY, label: 'Fácil', hint: 'Lo sabía', bg: Rating.easy, ink: COLORS.surfaceWhite },
];

export default function RatingButtons({ onPress }) {
  return (
    <View style={styles.container}>
      {BUTTONS.map(b => (
        <TouchableOpacity
          key={b.rating}
          style={[styles.button, { backgroundColor: b.bg }]}
          onPress={() => onPress(b.rating)}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel={`${b.label}: ${b.hint}`}
        >
          <Text style={[styles.label, { color: b.ink }]}>{b.label}</Text>
          <Text style={[styles.hint, { color: b.ink }]}>{b.hint}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    width: '100%',
    gap: SPACING.sm,
  },
  button: {
    flex: 1,
    minHeight: 56,
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 16,
  },
  hint: {
    fontFamily: FONT_FAMILY.medium,
    fontSize: 12,
  },
});
