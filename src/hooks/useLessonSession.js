// saflash — Quiz session for a path lesson: intro new cards, then quiz them.
import { useCallback, useEffect, useRef, useState } from 'react';
import { getLessonCards, completeLesson } from '../database/lessonsRepository';
import { answerCard, getDistractorCards } from '../database/progressRepository';
import {
  saveSession, incrementTotalStudied, updateStreak, setCurrentLesson, getConfig,
} from '../database/sessionRepository';
import { GRADE } from '../services/srs.mjs';
import { scoreLesson } from '../services/lessonScoring.mjs';
import { planSession, retryExercise, gradeAnswer, toCard } from '../services/quiz.mjs';

// The first answer to each card schedules it with FSRS.
function recordAnswer(card, correct, retention) {
  return answerCard(card, correct ? GRADE.GOOD : GRADE.AGAIN, { retention, source: 'lesson' });
}

export function useLessonSession(lessonId) {
  const [steps, setSteps] = useState([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [completed, setCompleted] = useState(null);
  const pool = useRef([]);
  const results = useRef(new Map()); // card key -> first-try correct
  const sessionStart = useRef(Date.now());
  const retention = useRef(undefined);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const config = await getConfig();
      retention.current = config?.desired_retention || undefined;
      const [rows, distractors] = await Promise.all([
        getLessonCards(lessonId),
        getDistractorCards(config?.level || 'A1'),
      ]);
      const cards = rows.map(toCard);
      pool.current = [...cards, ...distractors.map(toCard)];
      results.current = new Map();
      sessionStart.current = Date.now();
      setSteps(planSession(cards, pool.current));
      setIndex(0);
      setCompleted(null);
    } catch (err) {
      console.error('Error loading lesson:', err);
      setError('No se pudo cargar la lección.');
    } finally {
      setLoading(false);
    }
  }, [lessonId]);

  useEffect(() => {
    load();
  }, [load]);

  const finish = useCallback(async () => {
    const firstTry = [...results.current.values()];
    const scored = scoreLesson(firstTry);
    const correct = firstTry.filter(Boolean).length;
    const durationSecs = Math.floor((Date.now() - sessionStart.current) / 1000);

    const { nextLessonId } = await completeLesson(lessonId, scored.accuracy, scored.stars);
    if (nextLessonId) await setCurrentLesson(nextLessonId);
    await Promise.all([
      saveSession({
        session_type: 'lesson',
        cards_studied: firstTry.length,
        cards_correct: correct,
        cards_medium: 0,
        cards_hard: firstTry.length - correct,
        duration_secs: durationSecs,
      }),
      incrementTotalStudied(firstTry.length),
      updateStreak(),
    ]);

    setCompleted({ ...scored, correct, wrong: firstTry.length - correct, durationSecs, nextLessonId });
  }, [lessonId]);

  // Checks an answer for the current step; returns { correct, typo }.
  const answer = useCallback((value) => {
    const step = steps[index];
    const result = gradeAnswer(step, value);
    const { correct } = result;
    const { card } = step;
    if (!results.current.has(card.key)) {
      results.current.set(card.key, correct);
      recordAnswer(card, correct, retention.current).catch(err => console.error('Error saving progress:', err));
    }
    // Mistakes cost nothing: the card simply comes back later in the lesson.
    if (!correct) setSteps(prev => [...prev, retryExercise(step, pool.current)]);
    return result;
  }, [steps, index]);

  const next = useCallback(() => {
    if (index + 1 < steps.length) {
      setIndex(index + 1);
    } else {
      finish().catch(err => {
        console.error('Error finishing lesson:', err);
        setError('No se pudo guardar el progreso.');
      });
    }
  }, [index, steps.length, finish]);

  return {
    step: steps[index] || null,
    index,
    total: steps.length,
    loading,
    error,
    completed,
    answer,
    next,
  };
}
