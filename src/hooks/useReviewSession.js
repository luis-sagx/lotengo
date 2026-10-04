// saflash — Anki-style review: flip due cards and grade them with FSRS (no hearts at stake).
import { useCallback, useEffect, useRef, useState } from 'react';
import { answerCard, getDueCards, getPracticeCards } from '../database/progressRepository';
import { saveSession, incrementTotalStudied, updateStreak, addHearts, getConfig } from '../database/sessionRepository';
import { GRADE, previewIntervals } from '../services/srs.mjs';
import { xpForSession, endOfLocalDay } from '../services/gamification.mjs';
import { toCard } from '../services/quiz.mjs';

// Learning steps due within this window come back in the same session.
const REQUEUE_MS = 20 * 60 * 1000;

export function useReviewSession() {
  const [cards, setCards] = useState([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [completed, setCompleted] = useState(null);
  const [practice, setPractice] = useState(false);
  const ratings = useRef([]);
  const busy = useRef(false); // ignore double taps while saving
  const sessionStart = useRef(Date.now());
  const cardStart = useRef(Date.now());
  const retention = useRef(undefined);

  useEffect(() => {
    (async () => {
      const config = await getConfig();
      retention.current = config?.desired_retention || undefined;
      const due = await getDueCards(endOfLocalDay());
      // Nothing due: practice recent cards without touching the schedule.
      const rows = due.length ? due : await getPracticeCards(20);
      setPractice(!due.length);
      setCards(rows.map(toCard));
      sessionStart.current = Date.now();
      cardStart.current = Date.now();
    })()
      .catch(err => {
        console.error('Error loading review:', err);
        setError('No se pudieron cargar las tarjetas.');
      })
      .finally(() => setLoading(false));
  }, []);

  const finish = useCallback(async () => {
    const all = ratings.current;
    const wrong = all.filter(r => r === GRADE.AGAIN).length;
    const correct = all.length - wrong;
    const xp = xpForSession({ correct, total: all.length, review: true });
    const durationSecs = Math.floor((Date.now() - sessionStart.current) / 1000);
    await Promise.all([
      saveSession({
        session_type: 'review',
        cards_studied: all.length,
        cards_correct: correct,
        cards_medium: all.filter(r => r === GRADE.HARD).length,
        cards_hard: wrong,
        duration_secs: durationSecs,
        xp,
      }),
      incrementTotalStudied(all.length),
      updateStreak(),
      addHearts(1), // finishing a review earns a heart back
    ]);
    setCompleted({ correct, wrong, xp, durationSecs });
  }, []);

  const rate = useCallback(async (grade) => {
    const card = cards[index];
    if (!card || busy.current) return;
    busy.current = true;
    ratings.current.push(grade);
    try {
      let queue = cards;
      if (!practice) {
        const progress = await answerCard(card, grade, {
          retention: retention.current,
          durationMs: Date.now() - cardStart.current,
        });
        if (progress.due - Date.now() < REQUEUE_MS) {
          queue = [...cards, { ...card, ...progress, key: `${card.key}-${progress.reps}` }];
          setCards(queue);
        }
      }
      cardStart.current = Date.now();
      if (index + 1 < queue.length) setIndex(index + 1);
      else await finish();
    } catch (err) {
      console.error('Error saving review:', err);
      setError('No se pudo guardar el progreso.');
    } finally {
      busy.current = false;
    }
  }, [cards, index, finish, practice]);

  const card = cards[index] || null;
  const intervals = card && !practice ? previewIntervals(card.due != null ? card : null, { retention: retention.current }) : {};

  return { card, index, total: cards.length, loading, error, completed, rate, intervals, practice };
}
