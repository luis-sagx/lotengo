// Shared heading for the five main tabs.
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../theme/colors';
import { SPACING } from '../theme/spacing';
import { FONT_FAMILY } from '../theme/typography';

export default function ScreenHeader({ title, subtitle, trailing }) {
  return (
    <View style={styles.header}>
      <View style={styles.copy}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {trailing}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.xxl,
    paddingBottom: SPACING.base,
    minHeight: 102,
    gap: SPACING.sm,
  },
  copy: {
    flexShrink: 1,
  },
  title: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 24,
    lineHeight: 32,
    color: COLORS.deepOlive,
  },
  subtitle: {
    fontFamily: FONT_FAMILY.regular,
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
});
