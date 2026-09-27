// saflash — Words screen (category grid + search)
import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { RADIUS, SPACING } from '../theme/spacing';
import { FONT_FAMILY } from '../theme/typography';
import { useWords } from '../hooks/useWords';
import CategoryCard from '../components/CategoryCard';
import SearchBar from '../components/SearchBar';
import FilterPills from '../components/FilterPills';
import EmptyState from '../components/EmptyState';
import ScreenHeader from '../components/ScreenHeader';
import { formatDifficulty } from '../utils/formatters';
import { DIFFICULTY_LEVELS } from '../utils/constants';

export default function WordsScreen({ navigation }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState('all');
  const difficulty = levelFilter === 'all' ? null : levelFilter;
  const { categories, loading } = useWords(difficulty);

  const levelOptions = [
    { label: 'Todos', value: 'all' },
    ...DIFFICULTY_LEVELS.map(level => ({ label: formatDifficulty(level), value: level })),
  ];

  const handleCategoryPress = (category) => {
    navigation.navigate('WordsCategory', { category, difficulty });
  };

  const handleStudyAll = () => {
    navigation.navigate('StudyWords', { category: null, difficulty });
  };

  return (
    <View style={styles.container}>
      <ScreenHeader title="Palabras" />
      {/* Search */}
      <View style={styles.searchContainer}>
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Buscar palabra en inglés o español..."
        />
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
              icon="book-outline"
              title="No hay categorías"
              subtitle="Las categorías aparecerán aquí cuando se carguen las palabras."
            />
          )
        }
        renderItem={({ item }) => (
          <CategoryCard
            category={item.category}
            count={item.count}
            onPress={() => handleCategoryPress(item.category)}
          />
        )}
      />

      {/* FAB: Study all */}
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
  searchContainer: {
    paddingHorizontal: SPACING.base,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
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
