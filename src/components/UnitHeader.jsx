// saflash — Unit banner for the guided path: one per category.
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, unitColor } from '../theme/colors';
import { RADIUS, SPACING } from '../theme/spacing';
import { FONT_FAMILY } from '../theme/typography';
import { LEVEL_LABELS } from '../utils/constants';

export const UNIT_HEADER_HEIGHT = 104;

function UnitHeader({ unit, number }) {
  const done = unit.lessons.filter(l => l.status === 'completed').length;
  const ink = { color: COLORS.surfaceWhite };

  return (
    <View style={styles.wrap}>
      <View style={[styles.banner, { backgroundColor: unitColor(unit.unit_index) }]}>
        <View style={styles.copy}>
          <Text style={[styles.kicker, ink]}>{LEVEL_LABELS[unit.level].toUpperCase()} · UNIDAD {number}</Text>
          <Text style={[styles.title, ink]} numberOfLines={1}>{unit.unit_title}</Text>
          <Text style={[styles.count, ink]}>{done} / {unit.lessons.length} lecciones</Text>
        </View>
        <Text style={styles.icon}>{unit.icon}</Text>
      </View>
    </View>
  );
}

export default React.memo(UnitHeader);

const styles = StyleSheet.create({
  wrap: {
    height: UNIT_HEADER_HEIGHT,
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.base,
  },
  banner: {
    flex: 1,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.base,
    flexDirection: 'row',
    alignItems: 'center',
  },
  copy: {
    flex: 1,
  },
  kicker: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 12,
    letterSpacing: 0.8,
  },
  title: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 20,
  },
  count: {
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 14,
  },
  icon: {
    fontSize: 34,
  },
});
