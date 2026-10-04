// saflash — Hearts chip with a countdown to the next refill.
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../theme/colors';
import { RADIUS, SPACING } from '../theme/spacing';
import { FONT_FAMILY } from '../theme/typography';
import { MAX_HEARTS } from '../services/gamification.mjs';

export function formatCountdown(ms) {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

// `hearts` is { hearts, nextAt } from getHearts(), or null while loading.
export default function HeartsBadge({ hearts, showTimer = true }) {
  const [now, setNow] = useState(Date.now());
  const nextAt = hearts?.nextAt;

  useEffect(() => {
    if (!nextAt || !showTimer) return undefined;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [nextAt, showTimer]);

  if (!hearts) return null;
  // Display-only refill; the stored value updates on the next read.
  const refilled = nextAt && now >= nextAt ? Math.min(MAX_HEARTS, hearts.hearts + 1) : hearts.hearts;
  const empty = refilled === 0;

  return (
    <View style={[styles.chip, empty && styles.empty]} accessibilityLabel={`${refilled} vidas`}>
      <Text style={styles.text}>❤️ {refilled}</Text>
      {showTimer && nextAt && refilled < MAX_HEARTS && now < nextAt ? (
        <Text style={styles.timer}>+1 en {formatCountdown(nextAt - now)}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.surfaceWhite,
    borderWidth: 1,
    borderColor: COLORS.borderSage,
    alignItems: 'center',
  },
  empty: {
    borderColor: COLORS.dangerOrange,
  },
  text: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 15,
    color: COLORS.deepOlive,
  },
  timer: {
    fontFamily: FONT_FAMILY.regular,
    fontSize: 12,
    color: COLORS.textSecondary,
  },
});
