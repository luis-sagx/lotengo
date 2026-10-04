// saflash — Progress/stats hook
import { useState, useCallback } from 'react';
import { getStudyStats, getTodayStats } from '../database/progressRepository';
import { getConfig, getWeekStats } from '../database/sessionRepository';
import { getTotalWordsCount } from '../database/wordsRepository';
import { getTotalPhrasesCount } from '../database/phrasesRepository';
import { checkAchievements } from '../utils/formatters';
import useAppStore from '../store/appStore';

export function useProgress() {
  const [stats, setStats] = useState({
    study: { newCount: 0, learningCount: 0, reviewingCount: 0, knownCount: 0 },
    todayStudied: 0,
    streak: 0,
    totalStudied: 0,
    dailyGoal: 20,
    totalWords: 5000,
    totalPhrases: 500,
    weekData: [],
    achievements: [],
    loading: true,
  });

  const setStreakDays = useAppStore(s => s.setStreakDays);
  const setTotalStudied = useAppStore(s => s.setTotalStudied);

  const loadStats = useCallback(async () => {
    try {
      const [
        studyStats,
        todayCards,
        config,
        weekData,
        totalWords,
        totalPhrases,
      ] = await Promise.all([
        getStudyStats(),
        getTodayStats(),
        getConfig(),
        getWeekStats(),
        getTotalWordsCount(),
        getTotalPhrasesCount(),
      ]);

      const currentStats = {
        knownWords: studyStats.knownCount || 0,
        knownPhrases: 0, // Will be calculated separately if needed
        streak: config?.streak_days || 0,
        totalStudied: config?.total_studied || 0,
        perfectSession: false,
      };

      setStreakDays(currentStats.streak);
      setTotalStudied(currentStats.totalStudied);

      setStats({
        study: studyStats,
        todayStudied: todayCards,
        streak: currentStats.streak,
        totalStudied: currentStats.totalStudied,
        dailyGoal: config?.daily_goal || 20,
        totalWords: totalWords || 5000,
        totalPhrases: totalPhrases || 500,
        weekData: weekData || [],
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
