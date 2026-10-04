// saflash — Guided lesson path: the app's home.
import React, { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { RADIUS, SPACING, SHADOW } from '../theme/spacing';
import { FONT_FAMILY } from '../theme/typography';
import { useProgress } from '../hooks/useProgress';
import { useLessonPath } from '../hooks/useLessonPath';
import useAppStore from '../store/appStore';
import HomeHeader from '../components/HomeHeader';
import UnitHeader, { UNIT_HEADER_HEIGHT } from '../components/UnitHeader';
import LessonNode, { LESSON_NODE_HEIGHT } from '../components/LessonNode';
import LoadingCard from '../components/LoadingCard';
import { LEVEL_LABELS, LEVEL_SELF_DESCRIPTIONS } from '../utils/constants';
import { getFirstLessonForLevel, unlockUpTo } from '../database/lessonsRepository';
import { setCurrentLesson, setLevel, setPlacementDone } from '../database/sessionRepository';
import { LEVELS } from '../utils/levels.mjs';
import StatusBarScrim from '../components/StatusBarScrim';

// Flattens units into banner + lesson rows with fixed heights for virtualization.
function buildRows(units) {
  const rows = [];
  let offset = 0;
  units.forEach((unit, index) => {
    rows.push({ key: `u-${unit.level}-${unit.unit_index}`, unit, number: index + 1, offset, height: UNIT_HEADER_HEIGHT });
    offset += UNIT_HEADER_HEIGHT;
    for (const lesson of unit.lessons) {
      rows.push({ key: `l-${lesson.id}`, lesson, offset, height: LESSON_NODE_HEIGHT });
      offset += LESSON_NODE_HEIGHT;
    }
  });
  return rows;
}

export default function PathScreen({ navigation }) {
  const progress = useProgress();
  const { units, unitsLevel, currentLesson, config, visibleLevel, loading, error, refresh, showLevel } = useLessonPath();
  const listRef = useRef(null);
  const scrolledFor = useRef(null);
  const [headerHeight, setHeaderHeight] = useState(0);
  const setStoreLevel = useAppStore(s => s.setLevel);
  const goal = useAppStore(s => s.dailyGoal) || progress.dailyGoal || 20;

  useFocusEffect(
    useCallback(() => {
      refresh();
      progress.refresh();
    }, [refresh, progress.refresh])
  );

  const needsLevel = config && config.placement_done !== 1;
  const levelPosition = LEVELS.indexOf(visibleLevel);
  const pageLoading = loading || (!error && visibleLevel && unitsLevel !== visibleLevel);
  const rows = useMemo(() => (pageLoading || error ? [] : buildRows(units)), [units, pageLoading, error]);
  const currentId = currentLesson?.id;

  // Bring the current lesson into view once per level page.
  useEffect(() => {
    if (!headerHeight || !rows.length) return;
    const pageKey = `${unitsLevel}:${currentId}`;
    if (scrolledFor.current === pageKey) return;
    scrolledFor.current = pageKey;
    const index = rows.findIndex(r => r.lesson?.id === currentId);
    if (index > 0) {
      requestAnimationFrame(() =>
        listRef.current?.scrollToIndex({ index, viewPosition: 0.4, animated: false })
      );
    } else {
      listRef.current?.scrollToOffset({ offset: 0, animated: false });
    }
  }, [rows, headerHeight, unitsLevel, currentId]);

  const chooseLevel = async (level) => {
    await setLevel(level);
    await setPlacementDone();
    await unlockUpTo(level);
    const current = await getFirstLessonForLevel(level);
    if (current) await setCurrentLesson(current.id);
    setStoreLevel(level);
    await refresh();
    if (current) navigation.navigate('StudyLesson', { lessonId: current.id });
  };

  const startLesson = useCallback((lesson) => {
    if (!lesson || lesson.status === 'locked') return;
    navigation.navigate('StudyLesson', { lessonId: lesson.id });
  }, [navigation]);

  const renderItem = useCallback(({ item }) => (
    item.unit
      ? <UnitHeader unit={item.unit} number={item.number} />
      : <LessonNode lesson={item.lesson} current={item.lesson.id === currentId} onPress={startLesson} />
  ), [currentId, startLesson]);

  const getItemLayout = useCallback(
    (_, index) => ({ length: rows[index].height, offset: headerHeight + rows[index].offset, index }),
    [rows, headerHeight]
  );

  const header = (
    <View onLayout={e => setHeaderHeight(e.nativeEvent.layout.height)}>
      <HomeHeader
        streak={progress.streak}
        todayXp={progress.todayXp}
        goal={goal}
        hearts={progress.hearts}
      />

      {needsLevel && (
        <View style={styles.pickPanel}>
          <Text style={styles.pickTitle}>Elige tu nivel para ubicar la ruta</Text>
          <View style={styles.pickOptions}>
            {Object.keys(LEVEL_SELF_DESCRIPTIONS).map(level => (
              <TouchableOpacity key={level} style={styles.pickButton} onPress={() => chooseLevel(level)}>
                <Text style={styles.pickLevel}>{level}</Text>
                <Text style={styles.pickLabel}>{LEVEL_LABELS[level]}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {levelPosition >= 0 && (
        <View style={styles.pageControls}>
          <TouchableOpacity
            style={[styles.pageButton, levelPosition === 0 && styles.pageButtonDisabled]}
            disabled={levelPosition === 0}
            accessibilityLabel="Nivel anterior"
            onPress={() => showLevel(LEVELS[levelPosition - 1])}
          >
            <Ionicons name="chevron-back" size={22} color={COLORS.deepOlive} />
          </TouchableOpacity>
          <View style={styles.pageCopy}>
            <Text style={styles.pathTitle}>{visibleLevel} · {LEVEL_LABELS[visibleLevel]}</Text>
            <Text style={styles.pageLabel}>Nivel {levelPosition + 1} de {LEVELS.length}</Text>
          </View>
          <TouchableOpacity
            style={[styles.pageButton, levelPosition === LEVELS.length - 1 && styles.pageButtonDisabled]}
            disabled={levelPosition === LEVELS.length - 1}
            accessibilityLabel="Nivel siguiente"
            onPress={() => showLevel(LEVELS[levelPosition + 1])}
          >
            <Ionicons name="chevron-forward" size={22} color={COLORS.deepOlive} />
          </TouchableOpacity>
        </View>
      )}

      {pageLoading && <LoadingCard />}
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        ref={listRef}
        data={rows}
        renderItem={renderItem}
        keyExtractor={item => item.key}
        getItemLayout={getItemLayout}
        ListHeaderComponent={header}
        ListFooterComponent={<View style={{ height: 96 }} />}
        initialNumToRender={12}
        windowSize={7}
        showsVerticalScrollIndicator={false}
        onScrollToIndexFailed={() => {}}
      />

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.continueButton, !currentLesson && styles.disabledButton]}
          disabled={!currentLesson}
          onPress={() => startLesson(currentLesson)}
        >
          <Ionicons name="play" size={18} color={COLORS.surfaceWhite} />
          <Text style={styles.continueText}>Continuar</Text>
        </TouchableOpacity>
      </View>
      <StatusBarScrim />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.warmParchment,
  },
  pickPanel: {
    marginHorizontal: SPACING.xl,
    marginBottom: SPACING.base,
    backgroundColor: COLORS.surfaceWhite,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.borderSage,
    padding: SPACING.base,
  },
  pickTitle: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 16,
    color: COLORS.deepOlive,
    marginBottom: SPACING.md,
  },
  pickOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  pickButton: {
    minWidth: '47%',
    backgroundColor: COLORS.sageCream,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
  },
  pickLevel: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 16,
    color: COLORS.deepOlive,
  },
  pickLabel: {
    fontFamily: FONT_FAMILY.regular,
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  pageCopy: {
    alignItems: 'center',
  },
  pathTitle: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 18,
    color: COLORS.deepOlive,
  },
  pageControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: SPACING.xl,
    marginTop: SPACING.base,
    marginBottom: SPACING.md,
  },
  pageButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surfaceWhite,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.borderSage,
  },
  pageButtonDisabled: {
    opacity: 0.4,
  },
  pageLabel: {
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  error: {
    fontFamily: FONT_FAMILY.regular,
    fontSize: 14,
    color: COLORS.dangerOrange,
    paddingHorizontal: SPACING.xl,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: SPACING.base,
    backgroundColor: COLORS.warmParchment,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderSage,
  },
  continueButton: {
    height: 52,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.deepOlive,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    ...SHADOW.button,
  },
  disabledButton: {
    backgroundColor: COLORS.textPlaceholder,
  },
  continueText: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 16,
    color: COLORS.surfaceWhite,
  },
});
