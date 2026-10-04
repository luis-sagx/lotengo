// saflash — Search bar component
import React from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { RADIUS, SPACING } from '../theme/spacing';
import { FONT_FAMILY } from '../theme/typography';

export default function SearchBar({ value, onChangeText, placeholder = 'Buscar...', onClear, style }) {
  return (
    <View style={[styles.container, style]}>
      <Ionicons name="search" size={18} color={COLORS.textPlaceholder} style={styles.icon} />
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={COLORS.textPlaceholder}
        returnKeyType="search"
        autoCorrect={false}
      />
      {value && value.length > 0 && (
        <TouchableOpacity
          onPress={() => onChangeText('')}
          style={styles.clear}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityLabel="Borrar búsqueda"
        >
          <Ionicons name="close-circle" size={18} color={COLORS.textPlaceholder} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.sageCream,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    paddingHorizontal: SPACING.sm,
    height: 48,
  },
  icon: {
    marginRight: SPACING.xs,
  },
  input: {
    flex: 1,
    fontFamily: FONT_FAMILY.regular,
    fontSize: 16,
    color: COLORS.textInput,
    paddingVertical: 0,
  },
  clear: {
    marginLeft: SPACING.xs,
    padding: 2,
  },
});
