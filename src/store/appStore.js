// saflash — Zustand global store
import { create } from 'zustand';

const useAppStore = create((set) => ({
  // ── User ──────────────────────────────────
  onboardingDone: false,
  setOnboardingDone: (done) => set({ onboardingDone: done }),
  level: 'A1',
  setLevel: (level) => set({ level }),

  // ── Config cache ──────────────────────────
  dailyGoal: 20,
  setDailyGoal: (goal) => set({ dailyGoal: goal }),

  notifications: true,
  setNotifications: (enabled) => set({ notifications: enabled }),

  soundEnabled: true,
  setSoundEnabled: (enabled) => set({ soundEnabled: enabled }),

  // ── Stats cache (updated after study) ─────
  streakDays: 0,
  setStreakDays: (days) => set({ streakDays: days }),

  totalStudied: 0,
  setTotalStudied: (total) => set({ totalStudied: total }),

  todayCards: 0,
  setTodayCards: (count) => set({ todayCards: count }),
}));

export default useAppStore;
