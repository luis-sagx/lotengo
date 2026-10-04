// saflash — FSRS grade buttons, each labelled with its next interval.
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS, Rating } from '../theme/colors';
import { RADIUS, SPACING } from '../theme/spacing';
import { FONT_FAMILY } from '../theme/typography';
import { GRADE } from '../services/srs.mjs';

const BUTTONS = [
  { grade: GRADE.AGAIN, label: 'Otra vez', bg: Rating.again, ink: COLORS.surfaceWhite },
  { grade: GRADE.HARD, label: 'Difícil', bg: Rating.hard, ink: COLORS.deepOlive },
  { grade: GRADE.GOOD, label: 'Bien', bg: Rating.good, ink: COLORS.surfaceWhite },
  { grade: GRADE.EASY, label: 'Fácil', bg: Rating.easy, ink: COLORS.surfaceWhite },
];

// `intervals` maps grade -> label ("10 min"); `suggested` outlines one grade.
export default function RatingButtons({ onPress, intervals = {}, suggested = null }) {
  return (
    <View style={styles.container}>
      {BUTTONS.map(b => (
        <TouchableOpacity
          key={b.grade}
          style={[styles.button, { backgroundColor: b.bg }, suggested === b.grade && styles.suggested]}
          onPress={() => onPress(b.grade)}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel={`${b.label}${intervals[b.grade] ? `, vuelve en ${intervals[b.grade]}` : ''}`}
          accessibilityState={{ selected: suggested === b.grade }}
        >
          <Text style={[styles.label, { color: b.ink }]}>{b.label}</Text>
          {intervals[b.grade] ? <Text style={[styles.hint, { color: b.ink }]}>{intervals[b.grade]}</Text> : null}
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    width: '100%',
    gap: SPACING.xs,
  },
  button: {
    flex: 1,
    minHeight: 56,
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'transparent',
  },
  suggested: {
    borderColor: COLORS.deepOlive,
  },
  label: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 14,
  },
  hint: {
    fontFamily: FONT_FAMILY.medium,
    fontSize: 12,
  },
});
