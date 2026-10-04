// saflash — Achievement badge component
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../theme/colors';
import { RADIUS, SPACING } from '../theme/spacing';
import { FONT_FAMILY } from '../theme/typography';

export default function AchievementBadge({ id, icon, title, unlocked = false }) {
  return (
    <View style={styles.badge}>
      <View style={[styles.iconContainer, { backgroundColor: unlocked ? COLORS.sageCream : COLORS.sageCream }]}>
        <Text style={styles.icon}>{unlocked ? icon : '🔒'}</Text>
      </View>
      <Text
        style={[
          styles.title,
          { color: unlocked ? COLORS.textPrimary : COLORS.textSecondary },
        ]}
        numberOfLines={1}
      >
        {unlocked ? title : '???'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignItems: 'center',
    width: 80,
    gap: SPACING.xs,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.borderSage,
  },
  icon: {
    fontSize: 28,
  },
  title: {
    fontFamily: FONT_FAMILY.medium,
    fontSize: 12,
    textAlign: 'center',
  },
});
