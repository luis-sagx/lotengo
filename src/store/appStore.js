// saflash — Zustand global store
import { create } from 'zustand';

const useAppStore = create((set) => ({
  // ── User ──────────────────────────────────
  onboardingDone: false,
  setOnboardingDone: (done) => set({ onboardingDone: done }),
  level: 'A1',
  setLevel: (level) => set({ level }),

  // ── Config cache ──────────────────────────
  notifications: true,
  setNotifications: (enabled) => set({ notifications: enabled }),


  // ── Stats cache (updated after study) ─────
  streakDays: 0,
  setStreakDays: (days) => set({ streakDays: days }),

  totalStudied: 0,
  setTotalStudied: (total) => set({ totalStudied: total }),
}));

export default useAppStore;
