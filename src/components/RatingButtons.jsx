// saflash — Three self-rating buttons. What each one means for FSRS is decided
// by the caller (see srs.gradeFor), never shown as an interval.
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS, Rating } from '../theme/colors';
import { RADIUS, SPACING } from '../theme/spacing';
import { FONT_FAMILY } from '../theme/typography';
import { GRADE } from '../services/srs.mjs';

// After a correct answer: how did it feel?
export const ANSWER_OPTIONS = [
  { value: 'hard', label: 'Difícil', bg: Rating.hard, ink: COLORS.deepOlive },
  { value: 'good', label: 'Bien', bg: Rating.good, ink: COLORS.surfaceWhite },
  { value: 'easy', label: 'Fácil', bg: Rating.easy, ink: COLORS.surfaceWhite },
];

// Flip cards have no answer to check, so forgetting must be one of the choices.
export const FLIP_OPTIONS = [
  { value: GRADE.AGAIN, label: 'Otra vez', bg: Rating.again, ink: COLORS.surfaceWhite },
  { value: GRADE.GOOD, label: 'Bien', bg: Rating.good, ink: COLORS.surfaceWhite },
  { value: GRADE.EASY, label: 'Fácil', bg: Rating.easy, ink: COLORS.surfaceWhite },
];

export default function RatingButtons({ options, onPress }) {
  return (
    <View style={styles.container}>
      {options.map(o => (
        <TouchableOpacity
          key={o.value}
          style={[styles.button, { backgroundColor: o.bg }]}
          onPress={() => onPress(o.value)}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel={o.label}
        >
          <Text style={[styles.label, { color: o.ink }]}>{o.label}</Text>
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
    height: 52,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 16,
  },
});
