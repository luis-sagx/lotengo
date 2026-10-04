// saflash — Manual level adjustment suggestion.
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS } from '../theme/colors';
import { RADIUS, SPACING } from '../theme/spacing';
import { FONT_FAMILY } from '../theme/typography';
import { LEVEL_LABELS } from '../utils/constants';

export default function LevelSuggestionCard({ suggestion, onAccept, onDismiss }) {
  if (!suggestion) return null;
  const copy = suggestion.direction === 'up'
    ? `¿Te resulta muy fácil? Podés saltar a ${LEVEL_LABELS[suggestion.level]}.`
    : `¿Muy difícil? Probá con ${LEVEL_LABELS[suggestion.level]}.`;

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{copy}</Text>
      <View style={styles.actions}>
        <TouchableOpacity style={styles.secondary} onPress={onDismiss}>
          <Text style={styles.secondaryText}>Ahora no</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.primary} onPress={onAccept}>
          <Text style={styles.primaryText}>Cambiar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.borderSage,
    backgroundColor: COLORS.sageCream,
    padding: SPACING.base,
    marginBottom: SPACING.base,
  },
  title: {
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 15,
    color: COLORS.deepOlive,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: SPACING.sm,
    marginTop: SPACING.md,
  },
  primary: {
    backgroundColor: COLORS.deepOlive,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.sm,
  },
  primaryText: {
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 13,
    color: COLORS.surfaceWhite,
  },
  secondary: {
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.sm,
  },
  secondaryText: {
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 13,
    color: COLORS.textSecondary,
  },
});
