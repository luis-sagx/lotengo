// saflash — Lesson path node: a zig-zag column of round buttons.
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, unitColor } from '../theme/colors';
import { RADIUS, SPACING } from '../theme/spacing';
import { FONT_FAMILY } from '../theme/typography';

export const LESSON_NODE_HEIGHT = 104;
const OFFSETS = [0, 44, 66, 44, 0, -44, -66, -44];

function LessonNode({ lesson, current, onPress }) {
  const locked = lesson.status === 'locked';
  const completed = lesson.status === 'completed';
  const color = unitColor(lesson.unit_index);
  const offset = OFFSETS[lesson.lesson_index % OFFSETS.length];

  return (
    <View style={styles.row}>
      <View style={{ transform: [{ translateX: offset }], alignItems: 'center' }}>
        <TouchableOpacity
          style={[
            styles.node,
            { borderColor: color, backgroundColor: COLORS.surfaceWhite },
            completed && { backgroundColor: color },
            current && [styles.current, { backgroundColor: color }],
            locked && styles.locked,
          ]}
          disabled={locked}
          activeOpacity={0.8}
          onPress={() => onPress(lesson)}
          accessibilityRole="button"
          accessibilityLabel={`Lección ${lesson.lesson_index + 1}${locked ? ', bloqueada' : completed ? ', completada' : ''}`}
        >
          <Ionicons
            name={locked ? 'lock-closed' : completed ? 'checkmark' : current ? 'play' : 'star'}
            size={current ? 30 : 24}
            color={locked ? COLORS.textPlaceholder : completed || current ? COLORS.surfaceWhite : color}
          />
        </TouchableOpacity>
        <Text style={[styles.label, { color: current ? color : COLORS.starYellow }]}>
          {current ? 'EMPEZAR' : completed ? '★'.repeat(lesson.stars || 1) : ' '}
        </Text>
      </View>
    </View>
  );
}

export default React.memo(LessonNode);

const styles = StyleSheet.create({
  row: {
    height: LESSON_NODE_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  node: {
    width: 64,
    height: 64,
    borderRadius: RADIUS.pill,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  current: {
    width: 76,
    height: 76,
  },
  locked: {
    backgroundColor: COLORS.sageCream,
    borderColor: COLORS.borderSage,
  },
  label: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 14,
    marginTop: SPACING.xs,
    letterSpacing: 0.5,
  },
});
