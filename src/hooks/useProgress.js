// saflash — Progress/stats hook
import { useState, useCallback } from 'react';
import {
  getStudyStats, getAchievementStats, getMemoryRows, getReviewRatings, getDueTimes,
} from '../database/progressRepository';
import { memorySummary, trueRetention, dueForecast } from '../services/stats.mjs';
import { DEFAULT_RETENTION } from '../services/srs.mjs';
import { getConfig, getWeekStats } from '../database/sessionRepository';
import { getTotalWordsCount } from '../database/wordsRepository';
import { getTotalPhrasesCount } from '../database/phrasesRepository';
import { checkAchievements } from '../utils/formatters';
import useAppStore from '../store/appStore';

export function useProgress() {
  const [stats, setStats] = useState({
    study: { newCount: 0, learningCount: 0, reviewingCount: 0, knownCount: 0 },
    streak: 0,
    totalStudied: 0,
    totalWords: 5000,
    totalPhrases: 500,
    weekData: [],
    memory: { retained: 0, mature: 0, coverage: 0 },
    retention: { rate: null, count: 0 },
    targetRetention: DEFAULT_RETENTION,
    forecast: [],
    achievements: [],
    loading: true,
  });

  const setStreakDays = useAppStore(s => s.setStreakDays);
  const setTotalStudied = useAppStore(s => s.setTotalStudied);

  const loadStats = useCallback(async () => {
    try {
      const [
        studyStats,
        config,
        weekData,
        totalWords,
        totalPhrases,
        achievementStats,
        memoryRows,
        ratings,
        dueTimes,
      ] = await Promise.all([
        getStudyStats(),
        getConfig(),
        getWeekStats(),
        getTotalWordsCount(),
        getTotalPhrasesCount(),
        getAchievementStats(),
        getMemoryRows(),
        getReviewRatings(Date.now() - 30 * 86400000),
        getDueTimes(Date.now() + 7 * 86400000),
      ]);

      const currentStats = {
        ...achievementStats,
        streak: config?.streak_days || 0,
        totalStudied: config?.total_studied || 0,
      };

      setStreakDays(currentStats.streak);
      setTotalStudied(currentStats.totalStudied);

      setStats({
        study: studyStats,
        streak: currentStats.streak,
        totalStudied: currentStats.totalStudied,
        totalWords: totalWords || 5000,
        totalPhrases: totalPhrases || 500,
        weekData: weekData || [],
        memory: memorySummary(memoryRows),
        retention: trueRetention(ratings),
        targetRetention: config?.desired_retention || DEFAULT_RETENTION,
        forecast: dueForecast(dueTimes),
        achievements: checkAchievements(currentStats),
        loading: false,
      });
    } catch (err) {
      console.error('Error loading stats:', err);
      setStats(prev => ({ ...prev, loading: false }));
    }
  }, [setStreakDays, setTotalStudied]);

  return { ...stats, refresh: loadStats };
}
