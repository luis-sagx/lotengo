// saflash — Category card (grid item for words/phrases)
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS } from '../theme/colors';
import { RADIUS, SPACING } from '../theme/spacing';
import { FONT_FAMILY } from '../theme/typography';
import { formatCategoryName, formatNumber } from '../utils/formatters';
import { getCategoryEmoji } from '../utils/emojiMap';

export default function CategoryCard({ category, count, itemLabel = 'palabras', progress = 0, onPress }) {
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.imageContainer}>
        <View style={styles.imagePlaceholder}>
          <Text style={styles.emoji}>{getCategoryEmoji(category)}</Text>
        </View>
      </View>
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={3}>
          {formatCategoryName(category)}
        </Text>
        <Text style={styles.count}>{formatNumber(count)} {itemLabel}</Text>
        {progress > 0 && (
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${Math.min(progress, 100)}%` }]} />
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: COLORS.surfaceWhite,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.borderSage,
    overflow: 'hidden',
    margin: SPACING.xs,
    maxWidth: '48%',
  },
  imageContainer: {
    width: '100%',
    height: 90,
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.sageCream,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emoji: {
    fontSize: 32,
  },
  info: {
    padding: SPACING.sm,
  },
  name: {
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 14,
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  count: {
    fontFamily: FONT_FAMILY.regular,
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  progressTrack: {
    height: 3,
    backgroundColor: COLORS.sageCream,
    borderRadius: 2,
    marginTop: SPACING.xs,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.successGreen,
    borderRadius: 2,
  },
});
