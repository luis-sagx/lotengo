// saflash — Phrases screen (category list)
import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { RADIUS, SPACING } from '../theme/spacing';
import { FONT_FAMILY } from '../theme/typography';
import { usePhrases } from '../hooks/usePhrases';
import CategoryCard from '../components/CategoryCard';
import FilterPills from '../components/FilterPills';
import EmptyState from '../components/EmptyState';
import { formatDifficulty } from '../utils/formatters';
import { DIFFICULTY_LEVELS } from '../utils/constants';

export default function PhrasesScreen({ navigation }) {
  const [levelFilter, setLevelFilter] = useState('all');
  const difficulty = levelFilter === 'all' ? null : levelFilter;
  const { categories, loading } = usePhrases(difficulty);

  const levelOptions = [
    { label: 'Todos', value: 'all' },
    ...DIFFICULTY_LEVELS.map(level => ({ label: formatDifficulty(level), value: level })),
  ];

  const handleCategoryPress = (category) => {
    navigation.navigate('PhrasesCategory', { category, difficulty });
  };

  const handleStudyAll = () => {
    navigation.navigate('StudyPhrases', { category: null, difficulty });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Frases</Text>
        <Text style={styles.subtitle}>Frases listas para conversaciones reales</Text>
      </View>

      {/* Level filter */}
      <FilterPills
        options={levelOptions}
        selected={levelFilter}
        onSelect={setLevelFilter}
        style={styles.filters}
      />

      {/* Categories grid */}
      <FlatList
        data={categories}
        keyExtractor={item => item.category}
        numColumns={2}
        contentContainerStyle={styles.grid}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          loading ? null : (
            <EmptyState
              icon="chatbubbles-outline"
              title="No hay frases"
              subtitle="Las frases aparecerán aquí cuando se carguen los datos."
            />
          )
        }
        renderItem={({ item }) => (
          <CategoryCard
            category={item.category}
            count={item.count}
            itemLabel="frases"
            onPress={() => handleCategoryPress(item.category)}
          />
        )}
      />

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={handleStudyAll} activeOpacity={0.8}>
        <Ionicons name="play" size={24} color={COLORS.surfaceWhite} />
        <Text style={styles.fabText}>Estudiar todo</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.warmParchment,
  },
  header: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.base,
    paddingBottom: SPACING.md,
  },
  title: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 22,
    color: COLORS.deepOlive,
  },
  subtitle: {
    fontFamily: FONT_FAMILY.regular,
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  filters: {
    marginBottom: SPACING.sm,
  },
  grid: {
    paddingHorizontal: SPACING.sm,
    paddingBottom: 80,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    backgroundColor: COLORS.successGreen,
    borderRadius: RADIUS.md,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    paddingVertical: 14,
    gap: SPACING.sm,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  fabText: {
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 15,
    color: COLORS.surfaceWhite,
  },
});
