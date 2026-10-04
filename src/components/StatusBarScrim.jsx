// saflash — Opaque strip under the status bar so scrolled content never shows behind it.
import React from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../theme/colors';

export default function StatusBarScrim({ color = COLORS.warmParchment }) {
  const { top } = useSafeAreaInsets();
  return (
    <View
      pointerEvents="none"
      style={{ position: 'absolute', top: 0, left: 0, right: 0, height: top, backgroundColor: color }}
    />
  );
}
