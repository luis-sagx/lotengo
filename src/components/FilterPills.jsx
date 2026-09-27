// saflash — Filter pills (horizontal scrollable)
import React from 'react';
import { ScrollView, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { COLORS } from '../theme/colors';
import { RADIUS, SPACING } from '../theme/spacing';
import { FONT_FAMILY } from '../theme/typography';

export default function FilterPills({ options, selected, onSelect, style }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={[styles.container, style]}
      contentContainerStyle={styles.content}
    >
      {options.map((option) => {
        const isSelected = selected === option.value;
        return (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.pill,
              {
                backgroundColor: isSelected ? COLORS.deepOlive : COLORS.sageCream,
                borderColor: isSelected ? COLORS.deepOlive : COLORS.borderSage,
              },
            ]}
            onPress={() => onSelect(option.value)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.label,
                { color: isSelected ? COLORS.surfaceWhite : COLORS.textSecondary },
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 52,
  },
  content: {
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.xs,
    gap: SPACING.sm,
    alignItems: 'center',
  },
  pill: {
    minHeight: 44,
    paddingHorizontal: SPACING.md,
    justifyContent: 'center',
    borderRadius: RADIUS.pill,
    borderWidth: 1,
  },
  label: {
    fontFamily: FONT_FAMILY.medium,
    fontSize: 13,
    lineHeight: 20,
    includeFontPadding: true,
  },
});
