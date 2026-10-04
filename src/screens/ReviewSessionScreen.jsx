// saflash — Anki-style review session screen.
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { SPACING } from '../theme/spacing';
import { FONT_FAMILY } from '../theme/typography';
import { useReviewSession } from '../hooks/useReviewSession';
import FlashCard from '../components/FlashCard';
import ProgressBar from '../components/ProgressBar';
import LoadingCard from '../components/LoadingCard';
import SessionSummary from '../components/SessionSummary';

export default function ReviewSessionScreen({ navigation }) {
  const session = useReviewSession();

  if (session.completed) {
    return (
      <SessionSummary
        correct={session.completed.correct}
        wrong={session.completed.wrong}
        xp={session.completed.xp}
        heartGained
        durationSecs={session.completed.durationSecs}
        onContinue={() => navigation.goBack()}
      />
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} accessibilityLabel="Salir del repaso">
          <Ionicons name="close" size={28} color={COLORS.oliveInk} />
        </TouchableOpacity>
        <View style={styles.progress}>
          <ProgressBar current={session.index} total={Math.max(session.total, 1)} color={COLORS.successGreen} height={12} />
        </View>
        <Text style={styles.counter}>{Math.min(session.index + 1, session.total)} / {session.total}</Text>
      </View>

      {session.loading ? (
        <LoadingCard />
      ) : session.error || !session.card ? (
        <View style={styles.center}>
          <Text style={styles.message}>{session.error || 'No hay tarjetas para repasar.'}</Text>
        </View>
      ) : (
        <View style={styles.center}>
          <FlashCard card={session.card} onRate={session.rate} />
          <Text style={styles.hint}>Toca la tarjeta para ver la respuesta y califica qué tan bien la sabías</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.warmParchment,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.sm,
    gap: SPACING.md,
  },
  progress: {
    flex: 1,
  },
  counter: {
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.base,
  },
  hint: {
    fontFamily: FONT_FAMILY.regular,
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.lg,
    paddingHorizontal: SPACING.xl,
  },
  message: {
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});
