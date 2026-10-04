// saflash — Daily study session: due reviews first, then a few new cards.
// Every graded answer is scheduled with FSRS; learning steps due within the
// session come back before it ends.
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  answerCard, getDueCards, getPracticeCards, getNewCards, getNewCardsSince, getDistractorCards,
} from '../database/progressRepository';
import { saveSession, incrementTotalStudied, updateStreak, getConfig } from '../database/sessionRepository';
import { GRADE, previewIntervals, suggestGrade } from '../services/srs.mjs';
import { endOfLocalDay, startOfLocalDay } from '../services/streak.mjs';
import { EXERCISE, toCard, makeExercise, exerciseFor, gradeAnswer, pickNew, planDaily } from '../services/quiz.mjs';

// Learning steps due within this window come back in the same session.
const REQUEUE_MS = 20 * 60 * 1000;
export const NEW_PER_DAY_DEFAULT = 10;

// What today's session holds: due cards and the new cards still allowed today.
export async function loadToday() {
  const config = await getConfig();
  const level = config?.level || 'A1';
  const newPerDay = config?.new_per_day ?? NEW_PER_DAY_DEFAULT;
  const [dueRows, introduced] = await Promise.all([
    getDueCards(endOfLocalDay()),
    getNewCardsSince(startOfLocalDay()),
  ]);
  const newLeft = Math.max(0, newPerDay - introduced);
  const candidates = newLeft ? await getNewCards(level, newLeft * 3) : { words: [], phrases: [] };
  const fresh = pickNew(candidates.words.map(toCard), candidates.phrases.map(toCard), newLeft);
  return { config, due: dueRows.map(toCard), fresh };
}

export function useStudySession({ practice: practiceOnly = false } = {}) {
  const [steps, setSteps] = useState([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [completed, setCompleted] = useState(null);
  const [practice, setPractice] = useState(false);
  const [mode, setMode] = useState('type');
  const results = useRef([]); // grades given
  const pool = useRef([]);
  const busy = useRef(false); // ignore double taps while saving
  const sessionStart = useRef(Date.now());
  const stepStart = useRef(Date.now());
  const retention = useRef(undefined);
  const lastAnswer = useRef(null);

  useEffect(() => {
    (async () => {
      const { config, due, fresh } = await loadToday();
      retention.current = config?.desired_retention || undefined;
      const reviewMode = config?.review_mode || 'type';
      setMode(reviewMode);
      let cards = practiceOnly ? [] : [...due, ...fresh];
      let dueCards = due;
      let freshCards = fresh;
      // Nothing left today: practice recent cards without touching the schedule.
      if (!cards.length) {
        dueCards = (await getPracticeCards(20)).map(toCard).map(c => ({ ...c, state: 2 }));
        freshCards = [];
        cards = dueCards;
        setPractice(true);
      }
      const distractors = await getDistractorCards(config?.level || 'A1');
      pool.current = [...cards, ...distractors.map(toCard)];
      setSteps(planDaily(dueCards, freshCards, pool.current, { mode: reviewMode }));
      sessionStart.current = Date.now();
      stepStart.current = Date.now();
    })()
      .catch(err => {
        console.error('Error loading session:', err);
        setError('No se pudieron cargar las tarjetas.');
      })
      .finally(() => setLoading(false));
  }, [practiceOnly]);

  const finish = useCallback(async () => {
    const all = results.current;
    const wrong = all.filter(g => g === GRADE.AGAIN).length;
    const correct = all.length - wrong;
    const durationSecs = Math.floor((Date.now() - sessionStart.current) / 1000);
    await Promise.all([
      saveSession({
        session_type: 'review',
        cards_studied: all.length,
        cards_correct: correct,
        cards_medium: all.filter(g => g === GRADE.HARD).length,
        cards_hard: wrong,
        duration_secs: durationSecs,
      }),
      incrementTotalStudied(all.length),
      updateStreak(),
    ]);
    setCompleted({ correct, wrong, durationSecs });
  }, []);

  const advance = useCallback(async (queue) => {
    stepStart.current = Date.now();
    lastAnswer.current = null;
    if (index + 1 < queue.length) setIndex(index + 1);
    else await finish();
  }, [index, finish]);

  // Checks the current exercise; returns { correct, typo, suggested }.
  const answer = useCallback((value) => {
    const result = gradeAnswer(steps[index], value);
    lastAnswer.current = { ...result, suggested: suggestGrade({ ...result, ms: Date.now() - stepStart.current }) };
    return lastAnswer.current;
  }, [steps, index]);

  // Grades the current card (any step but an intro) and moves on.
  const grade = useCallback(async (value) => {
    const step = steps[index];
    if (!step || busy.current) return;
    busy.current = true;
    try {
      let queue = steps;
      if (step.type !== EXERCISE.INTRO) {
        results.current.push(value);
        if (!practice) {
          const progress = await answerCard(step.card, value, {
            retention: retention.current,
            durationMs: Date.now() - stepStart.current,
          });
          if (progress.due - Date.now() < REQUEUE_MS) {
            const card = { ...step.card, ...progress };
            const type = exerciseFor(card, { mode, round: queue.length });
            queue = [...steps, makeExercise(card, pool.current, type)];
            setSteps(queue);
          }
        }
      }
      await advance(queue);
    } catch (err) {
      console.error('Error saving review:', err);
      setError('No se pudo guardar el progreso.');
    } finally {
      busy.current = false;
    }
  }, [steps, index, practice, mode, advance]);

  const step = steps[index] || null;
  const intervals = step && !practice && step.type !== EXERCISE.INTRO
    ? previewIntervals(step.card.due != null ? step.card : null, { retention: retention.current })
    : {};

  return { step, index, total: steps.length, loading, error, completed, practice, answer, grade, intervals };
}
