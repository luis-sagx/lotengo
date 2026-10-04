// saflash — Anki-style flashcard: front (English) flips to back (meaning + rating).
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  withTiming,
  interpolate,
  useAnimatedStyle,
  Easing,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { RADIUS, SHADOW, LAYOUT } from '../theme/spacing';
import { FONT_FAMILY } from '../theme/typography';
import CardImage from './CardImage';
import RatingButtons from './RatingButtons';
import { formatCategoryName } from '../utils/formatters';
import { enrichWord } from '../services/enrichmentService';
import { speak, speakAuto } from '../services/audioService';

// `card` is a normalized card ({ type, en, es, ... }) from quiz.toCard.
export default function FlashCard({ card, onRate, intervals }) {
  const rotation = useSharedValue(0);
  const [flipped, setFlipped] = useState(false);
  // Local copy so enriched content (phonetic, photo, definition) appears live.
  const [data, setData] = useState(card);
  const isWord = card.type === 'word';

  useEffect(() => {
    let alive = true;
    setData(card);
    setFlipped(false);
    rotation.value = 0;
    speakAuto(card.en);
    if (isWord) {
      enrichWord({ ...card, english_word: card.en }).then(updated => {
        if (alive && updated) setData(prev => ({ ...prev, ...updated }));
      });
    }
    return () => {
      alive = false;
    };
  }, [card, isWord, rotation]);

  const flip = useCallback(() => {
    rotation.value = withTiming(flipped ? 0 : 180, { duration: 400, easing: Easing.out(Easing.ease) });
    setFlipped(prev => !prev);
  }, [flipped, rotation]);

  const frontStyle = useAnimatedStyle(() => ({
    transform: [{ perspective: 1000 }, { rotateY: `${interpolate(rotation.value, [0, 180], [0, 180])}deg` }],
  }));
  const backStyle = useAnimatedStyle(() => ({
    transform: [{ perspective: 1000 }, { rotateY: `${interpolate(rotation.value, [0, 180], [180, 360])}deg` }],
  }));

  return (
    <TouchableOpacity
      onPress={flip}
      activeOpacity={1}
      style={styles.container}
      accessibilityRole="button"
      accessibilityLabel={flipped ? `${card.en}: ${card.es}` : `${card.en}. Toca para ver la respuesta`}
    >
      <Animated.View pointerEvents={flipped ? 'none' : 'auto'} style={[styles.card, styles.front, frontStyle]}>
        {card.category ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{formatCategoryName(card.category).toUpperCase()}</Text>
          </View>
        ) : null}
        {isWord && <CardImage uri={data.image_url} word={card.en} category={card.category} style={styles.image} />}
        <Text style={styles.word} numberOfLines={3}>{card.en}</Text>
        {data.phonetic ? <Text style={styles.phonetic}>{data.phonetic}</Text> : null}
        <SpeakButton text={card.en} light />
      </Animated.View>

      <Animated.View
        pointerEvents={flipped ? 'auto' : 'none'}
        style={[styles.card, styles.back, StyleSheet.absoluteFill, backStyle]}
      >
        <View style={styles.backContent}>
          <View style={styles.backHeader}>
            <Text style={styles.backWord} numberOfLines={2}>{card.en}</Text>
            <SpeakButton text={card.en} />
          </View>
          <Text style={styles.translation} numberOfLines={3}>{card.es}</Text>
          {isWord && data.definition_en && !data.example_en ? (
            <Text style={styles.definition} numberOfLines={3}>{data.definition_en}</Text>
          ) : null}
          {!isWord && card.context ? <Text style={styles.definition}>{card.context}</Text> : null}
          {isWord && data.example_en ? <Text style={styles.example}>"{data.example_en}"</Text> : null}
          {isWord && data.example_es ? <Text style={styles.definition}>{data.example_es}</Text> : null}
          {card.falseFriend ? <Text style={styles.falseFriend}>⚠️ {card.falseFriend}</Text> : null}
        </View>
        {flipped && <RatingButtons onPress={onRate} intervals={intervals} />}
      </Animated.View>
    </TouchableOpacity>
  );
}

function SpeakButton({ text, light = false }) {
  return (
    <TouchableOpacity
      onPress={() => speak(text)}
      style={[styles.speak, light && styles.speakLight]}
      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      accessibilityLabel={`Escuchar ${text}`}
    >
      <Ionicons name="volume-high" size={26} color={light ? COLORS.accentOrange : COLORS.cardBackText} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: LAYOUT.cardWidth,
    height: LAYOUT.flashcardHeight,
    alignSelf: 'center',
  },
  card: {
    width: '100%',
    height: '100%',
    borderRadius: RADIUS.xl,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backfaceVisibility: 'hidden',
    ...SHADOW.card,
  },
  front: {
    backgroundColor: COLORS.cardFrontBg,
  },
  badge: {
    backgroundColor: COLORS.badgeBg,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
    marginBottom: 12,
  },
  badgeText: {
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 12,
    color: COLORS.badgeText,
  },
  image: {
    marginBottom: 16,
  },
  word: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 36,
    color: COLORS.cardFrontText,
    textAlign: 'center',
    paddingHorizontal: 10,
  },
  phonetic: {
    fontFamily: FONT_FAMILY.regular,
    fontSize: 16,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  speak: {
    padding: 10,
    borderRadius: RADIUS.pill,
  },
  speakLight: {
    backgroundColor: COLORS.badgeBg,
    marginTop: 12,
  },
  back: {
    backgroundColor: COLORS.cardBackBg,
    justifyContent: 'space-between',
  },
  backContent: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  backHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  backWord: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 24,
    color: COLORS.cardBackText,
    textAlign: 'center',
    flexShrink: 1,
  },
  translation: {
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 22,
    color: '#FFD27A',
    textAlign: 'center',
    paddingHorizontal: 10,
  },
  definition: {
    fontFamily: FONT_FAMILY.regular,
    fontSize: 15,
    lineHeight: 22,
    color: COLORS.sageCream,
    textAlign: 'center',
    paddingHorizontal: 10,
  },
  falseFriend: {
    fontFamily: FONT_FAMILY.medium,
    fontSize: 14,
    lineHeight: 20,
    color: '#FFD27A',
    textAlign: 'center',
    paddingHorizontal: 10,
  },
  example: {
    fontFamily: FONT_FAMILY.regular,
    fontSize: 16,
    lineHeight: 23,
    color: COLORS.sageCream,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingHorizontal: 10,
  },
});
