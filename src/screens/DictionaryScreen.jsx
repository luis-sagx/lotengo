// saflash — Dictionary tab: search every word and phrase, or browse recent ones.
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { SPACING } from '../theme/spacing';
import { FONT_FAMILY } from '../theme/typography';
import ScreenHeader from '../components/ScreenHeader';
import SearchBar from '../components/SearchBar';
import { searchCards } from '../database/progressRepository';
import { speak } from '../services/audioService';
import StatusBarScrim from '../components/StatusBarScrim';

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

export default function DictionaryScreen() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);

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
      <ScreenHeader title="Diccionario" subtitle="Busca en inglés o en español y escucha la pronunciación" />
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
      <StatusBarScrim />
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
