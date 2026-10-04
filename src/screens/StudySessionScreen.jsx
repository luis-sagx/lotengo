// saflash — Daily study session: due reviews, then new cards.
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { SPACING } from '../theme/spacing';
import { FONT_FAMILY } from '../theme/typography';
import { useStudySession } from '../hooks/useStudySession';
import { EXERCISE } from '../services/quiz.mjs';
import Exercise from '../components/Exercise';
import FlashCard from '../components/FlashCard';
import ProgressBar from '../components/ProgressBar';
import LoadingCard from '../components/LoadingCard';
import SessionSummary from '../components/SessionSummary';

export default function StudySessionScreen({ navigation, route }) {
  const session = useStudySession({ practice: route.params?.practice });
  const { step } = session;

  if (session.completed) {
    return (
      <SessionSummary
        title={session.practice ? '¡Práctica terminada!' : '¡Sesión de hoy completada!'}
        correct={session.completed.correct}
        wrong={session.completed.wrong}
        durationSecs={session.completed.durationSecs}
        onContinue={() => navigation.goBack()}
      />
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} accessibilityLabel="Salir de la sesión">
          <Ionicons name="close" size={28} color={COLORS.oliveInk} />
        </TouchableOpacity>
        <View style={styles.progress}>
          {session.practice && <Text style={styles.practice}>Práctica libre · no cambia tus repasos</Text>}
          <ProgressBar current={session.index} total={Math.max(session.total, 1)} color={COLORS.successGreen} height={12} />
        </View>
        <Text style={styles.counter}>{Math.min(session.index + 1, session.total)} / {session.total}</Text>
      </View>

      {session.loading ? (
        <LoadingCard />
      ) : session.error || !step ? (
        <View style={styles.center}>
          <Text style={styles.message}>{session.error || 'No hay tarjetas para estudiar.'}</Text>
        </View>
      ) : step.type === EXERCISE.FLIP ? (
        <View style={styles.center}>
          <FlashCard card={step.card} onRate={session.grade} />
          <Text style={styles.hint}>Intenta recordarla, toca la tarjeta y califica qué tan bien la sabías</Text>
        </View>
      ) : (
        <Exercise
          key={`${session.index}-${step.card.key}`}
          step={step}
          onCheck={session.answer}
          onNext={() => session.grade(null)}
          onGrade={session.grade}
        />
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
  practice: {
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 2,
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
