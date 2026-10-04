// saflash — Quiz session for a path lesson (intro + quiz) or a review (quiz only).
import { useCallback, useEffect, useRef, useState } from 'react';
import { getLessonCards, completeLesson } from '../database/lessonsRepository';
import { getProgress, upsertProgress, getDueCards, getDistractorCards } from '../database/progressRepository';
import { saveSession, incrementTotalStudied, updateStreak, setCurrentLesson, getConfig } from '../database/sessionRepository';
import { calculateNextReview, getDefaultProgress } from '../services/spacedRepetition';
import { scoreLesson } from '../services/lessonScoring.mjs';
import { planSession, retryExercise, checkAnswer } from '../services/quiz.mjs';
import { RATING } from '../utils/constants';

function toQuizCard(row) {
  const type = row.card_type;
  return {
    ...row,
    key: `${type}-${row.id}`,
    type,
    en: row.en ?? row.english_word ?? row.phrase_en,
    es: row.es ?? row.spanish_trans ?? row.phrase_es,
  };
}

async function recordAnswer(card, correct) {
  const progress = await getProgress(card.type, card.id);
  const rating = correct ? RATING.MEDIUM : RATING.HARD;
  await upsertProgress(card.type, card.id, calculateNextReview(progress || getDefaultProgress(), rating));
}

export function useLessonSession(lessonId) {
  const review = lessonId == null;
  const [steps, setSteps] = useState([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [completed, setCompleted] = useState(null);
  const pool = useRef([]);
  const results = useRef(new Map()); // card key -> first-try correct
  const sessionStart = useRef(Date.now());

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const config = await getConfig();
      const [rows, distractors] = await Promise.all([
        review ? getDueCards() : getLessonCards(lessonId),
        getDistractorCards(config?.level || 'A1'),
      ]);
      const cards = rows.map(toQuizCard);
      pool.current = [...cards, ...distractors.map(toQuizCard)];
      results.current = new Map();
      sessionStart.current = Date.now();
      setSteps(planSession(cards, pool.current, { intro: !review }));
      setIndex(0);
      setCompleted(null);
    } catch (err) {
      console.error('Error loading lesson:', err);
      setError('No se pudo cargar la lección.');
    } finally {
      setLoading(false);
    }
  }, [lessonId, review]);

  useEffect(() => {
    load();
  }, [load]);

  const finish = useCallback(async () => {
    const firstTry = [...results.current.values()];
    const scored = scoreLesson(firstTry);
    const correct = firstTry.filter(Boolean).length;
    const durationSecs = Math.floor((Date.now() - sessionStart.current) / 1000);

    let nextLessonId = null;
    if (!review) {
      ({ nextLessonId } = await completeLesson(lessonId, scored.accuracy, scored.stars));
      if (nextLessonId) await setCurrentLesson(nextLessonId);
    }
    await Promise.all([
      saveSession({
        session_date: new Date().toISOString().split('T')[0],
        session_type: review ? 'review' : 'lesson',
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
  }, [lessonId, review]);

  // Checks an answer for the current step; returns whether it was right.
  const answer = useCallback((value) => {
    const step = steps[index];
    const correct = checkAnswer(step, value);
    const { card } = step;
    if (!results.current.has(card.key)) {
      results.current.set(card.key, correct);
      recordAnswer(card, correct).catch(err => console.error('Error saving progress:', err));
    }
    if (!correct) setSteps(prev => [...prev, retryExercise(step, pool.current)]);
    return correct;
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
    review,
  };
}
