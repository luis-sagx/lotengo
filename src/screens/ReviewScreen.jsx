// saflash — Review tab: due cards plus a searchable dictionary.
import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { RADIUS, SPACING, SHADOW } from '../theme/spacing';
import { FONT_FAMILY } from '../theme/typography';
import ScreenHeader from '../components/ScreenHeader';
import SearchBar from '../components/SearchBar';
import { getTotalDueCount, searchCards } from '../database/progressRepository';
import { speak } from '../services/audioService';

const ROW_HEIGHT = 64;

const DictionaryRow = React.memo(function DictionaryRow({ item }) {
  return (
    <TouchableOpacity
      style={styles.row}
      activeOpacity={0.7}
      onPress={() => speak(item.en)}
      accessibilityLabel={`${item.en}, ${item.es}. Tocar para escuchar`}
    >
      <View style={styles.rowText}>
        <Text style={styles.en} numberOfLines={1}>{item.en}</Text>
        <Text style={styles.es} numberOfLines={1}>{item.es}</Text>
      </View>
      <Ionicons name="volume-high" size={20} color={COLORS.accentOrange} />
    </TouchableOpacity>
  );
});

const renderItem = ({ item }) => <DictionaryRow item={item} />;
const keyExtractor = item => `${item.card_type}-${item.id}`;
const getItemLayout = (_, index) => ({ length: ROW_HEIGHT, offset: ROW_HEIGHT * index, index });

export default function ReviewScreen({ navigation }) {
  const [due, setDue] = useState(0);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);

  useFocusEffect(
    useCallback(() => {
      getTotalDueCount().then(setDue).catch(() => setDue(0));
    }, [])
  );

  useEffect(() => {
    let alive = true;
    const timer = setTimeout(() => {
      searchCards(query)
        .then(rows => alive && setResults(rows))
        .catch(() => alive && setResults([]));
    }, 200);
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [query]);

  const header = (
    <>
      <ScreenHeader title="Repaso" subtitle="Refuerza lo aprendido y busca palabras" />
      <View style={styles.dueCard}>
        <Text style={styles.dueNumber}>{due}</Text>
        <Text style={styles.dueLabel}>
          {due === 1 ? 'tarjeta para repasar hoy' : 'tarjetas para repasar hoy'}
        </Text>
        <TouchableOpacity
          style={[styles.reviewButton, due === 0 && styles.reviewButtonDisabled]}
          disabled={due === 0}
          onPress={() => navigation.navigate('ReviewSession')}
        >
          <Ionicons name="refresh" size={18} color={COLORS.surfaceWhite} />
          <Text style={styles.reviewButtonText}>{due === 0 ? 'Todo al día' : 'Repasar ahora'}</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.sectionTitle}>Diccionario</Text>
      <SearchBar
        value={query}
        onChangeText={setQuery}
        placeholder="Buscar en inglés o español"
        style={styles.search}
      />
      {!query && results.length > 0 && <Text style={styles.hint}>Estudiadas recientemente</Text>}
    </>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={results}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        getItemLayout={getItemLayout}
        ListHeaderComponent={header}
        ListEmptyComponent={
          <Text style={styles.empty}>
            {query ? 'Sin resultados' : 'Las palabras que estudies aparecerán aquí'}
          </Text>
        }
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.content}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.warmParchment,
  },
  content: {
    paddingBottom: SPACING.xxl,
  },
  dueCard: {
    marginHorizontal: SPACING.xl,
    padding: SPACING.lg,
    backgroundColor: COLORS.surfaceWhite,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.borderSage,
    alignItems: 'center',
  },
  dueNumber: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 40,
    color: COLORS.deepOlive,
  },
  dueLabel: {
    fontFamily: FONT_FAMILY.regular,
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: SPACING.base,
  },
  reviewButton: {
    alignSelf: 'stretch',
    height: 52,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.deepOlive,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    ...SHADOW.button,
  },
  reviewButtonDisabled: {
    backgroundColor: COLORS.textPlaceholder,
  },
  reviewButtonText: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 16,
    color: COLORS.surfaceWhite,
  },
  sectionTitle: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 18,
    color: COLORS.deepOlive,
    marginTop: SPACING.xl,
    marginBottom: SPACING.sm,
    paddingHorizontal: SPACING.xl,
  },
  search: {
    marginHorizontal: SPACING.xl,
  },
  hint: {
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: SPACING.base,
    paddingHorizontal: SPACING.xl,
  },
  row: {
    height: ROW_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.borderSage,
  },
  rowText: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  en: {
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 16,
    color: COLORS.deepOlive,
  },
  es: {
    fontFamily: FONT_FAMILY.regular,
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  empty: {
    fontFamily: FONT_FAMILY.regular,
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.xl,
    paddingHorizontal: SPACING.xl,
  },
});
