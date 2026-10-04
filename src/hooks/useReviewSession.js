// saflash — Anki-style review: flip due cards and self-rate them (no hearts at stake).
import { useCallback, useEffect, useRef, useState } from 'react';
import { getProgress, upsertProgress, getDueCards } from '../database/progressRepository';
import { saveSession, incrementTotalStudied, updateStreak, addHearts } from '../database/sessionRepository';
import { calculateNextReview, getDefaultProgress } from '../services/spacedRepetition';
import { xpForSession } from '../services/gamification.mjs';
import { toCard } from '../services/quiz.mjs';
import { RATING } from '../utils/constants';

export function useReviewSession() {
  const [cards, setCards] = useState([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [completed, setCompleted] = useState(null);
  const ratings = useRef([]);
  const busy = useRef(false); // ignore double taps while saving
  const sessionStart = useRef(Date.now());

  useEffect(() => {
    getDueCards(20)
      .then(rows => {
        setCards(rows.map(toCard));
        sessionStart.current = Date.now();
      })
      .catch(err => {
        console.error('Error loading review:', err);
        setError('No se pudieron cargar las tarjetas.');
      })
      .finally(() => setLoading(false));
  }, []);

  const finish = useCallback(async () => {
    const all = ratings.current;
    const wrong = all.filter(r => r === RATING.HARD).length;
    const correct = all.length - wrong;
    const xp = xpForSession({ correct, total: all.length, review: true });
    const durationSecs = Math.floor((Date.now() - sessionStart.current) / 1000);
    await Promise.all([
      saveSession({
        session_type: 'review',
        cards_studied: all.length,
        cards_correct: all.filter(r => r === RATING.EASY).length,
        cards_medium: all.filter(r => r === RATING.MEDIUM).length,
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

  const rate = useCallback(async (rating) => {
    const card = cards[index];
    if (!card || busy.current) return;
    busy.current = true;
    ratings.current.push(rating);
    try {
      const progress = await getProgress(card.type, card.id);
      await upsertProgress(card.type, card.id, calculateNextReview(progress || getDefaultProgress(), rating));
      if (index + 1 < cards.length) setIndex(index + 1);
      else await finish();
    } catch (err) {
      console.error('Error saving review:', err);
      setError('No se pudo guardar el progreso.');
    } finally {
      busy.current = false;
    }
  }, [cards, index, finish]);

  return { card: cards[index] || null, index, total: cards.length, loading, error, completed, rate };
}
