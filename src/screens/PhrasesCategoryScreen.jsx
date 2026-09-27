// saflash — Phrases category screen
import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { RADIUS, SPACING } from '../theme/spacing';
import { FONT_FAMILY } from '../theme/typography';
import { useCategoryPhrases } from '../hooks/usePhrases';
import EmptyState from '../components/EmptyState';

export default function PhrasesCategoryScreen({ route, navigation }) {
  const { category, difficulty = null } = route.params;
  const { phrases, loading } = useCategoryPhrases(category, difficulty);

  const handleStudy = () => {
    navigation.navigate('StudyPhrases', { category, difficulty });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.count}>{phrases.length} frases</Text>
      </View>

      {/* Phrase list */}
      <FlatList
        data={phrases}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          loading ? null : (
            <EmptyState
              icon="chatbubbles-outline"
              title="Sin frases en esta categoría"
              subtitle="Volvé más tarde o explorá otra categoría."
            />
          )
        }
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.phraseRow} activeOpacity={0.7}>
            <View style={styles.phraseInfo}>
              <Text style={styles.phraseEn}>{item.phrase_en}</Text>
              <Text style={styles.phraseEs}>{item.phrase_es}</Text>
              {item.context && (
                <Text style={styles.context}>{item.context}</Text>
              )}
            </View>
          </TouchableOpacity>
        )}
      />

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={handleStudy} activeOpacity={0.8}>
        <Ionicons name="play" size={20} color={COLORS.surfaceWhite} />
        <Text style={styles.fabText}>Estudiar esta categoría</Text>
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
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderSage,
  },
  count: {
    fontFamily: FONT_FAMILY.regular,
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  list: {
    paddingHorizontal: SPACING.base,
    paddingTop: SPACING.sm,
    paddingBottom: 80,
  },
  phraseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surfaceWhite,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.borderSage,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  phraseInfo: {
    flex: 1,
  },
  phraseEn: {
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 16,
    color: COLORS.oliveInk,
  },
  phraseEs: {
    fontFamily: FONT_FAMILY.regular,
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  context: {
    fontFamily: FONT_FAMILY.regular,
    fontSize: 12,
    color: COLORS.textPlaceholder,
    fontStyle: 'italic',
    marginTop: 4,
  },
  difficultyBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
    marginLeft: SPACING.sm,
  },
  difficultyText: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 11,
    color: COLORS.surfaceWhite,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    alignSelf: 'center',
    backgroundColor: COLORS.deepOlive,
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
