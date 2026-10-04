// saflash — Settings hook
import { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  getConfig,
  updateConfig,
  updateDailyGoal as updateDailyGoalDB,
  toggleNotifications as toggleNotificationsDB,
  updateNotifHour as updateNotifHourDB,
} from '../database/sessionRepository';
import { isNotificationsSupported, scheduleDailyNotification } from '../services/notifications';
import useAppStore from '../store/appStore';
import { setAutoSpeak } from '../services/audioService';
import { setEffectsEnabled } from '../services/soundService';

export function useSettings() {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);

  const setStoreDailyGoal = useAppStore(s => s.setDailyGoal);
  const setStoreNotifications = useAppStore(s => s.setNotifications);

  const loadConfig = useCallback(async () => {
    try {
      const cfg = await getConfig();
      setConfig(cfg);
      if (cfg) {
        setStoreDailyGoal(cfg.daily_goal || 20);
        setStoreNotifications(cfg.notifications === 1);
      }
    } catch (err) {
      console.error('Error loading config:', err);
    } finally {
      setLoading(false);
    }
  }, [setStoreDailyGoal, setStoreNotifications]);

  useFocusEffect(useCallback(() => {
    loadConfig();
  }, [loadConfig]));

  const updateDailyGoal = useCallback(async (goal) => {
    try {
      await updateDailyGoalDB(goal);
      setStoreDailyGoal(goal);
      setConfig(prev => prev ? { ...prev, daily_goal: goal } : prev);
    } catch (err) {
      console.error('Error updating daily goal:', err);
    }
  }, [setStoreDailyGoal]);

  const toggleNotifications = useCallback(async (enabled) => {
    try {
      await toggleNotificationsDB(enabled);
      setStoreNotifications(enabled);
      setConfig(prev => prev ? { ...prev, notifications: enabled ? 1 : 0 } : prev);
      await scheduleDailyNotification();
    } catch (err) {
      console.error('Error toggling notifications:', err);
    }
  }, [setStoreNotifications]);

  const updateNotifHour = useCallback(async (hour) => {
    try {
      await updateNotifHourDB(hour);
      setConfig(prev => prev ? { ...prev, notif_hour: hour } : prev);
      await scheduleDailyNotification();
    } catch (err) {
      console.error('Error updating notification hour:', err);
    }
  }, []);

  const toggleSetting = useCallback(async (field, enabled) => {
    try {
      await updateConfig({ [field]: enabled ? 1 : 0 });
      if (field === 'auto_speak') setAutoSpeak(enabled);
      if (field === 'sound_effects') setEffectsEnabled(enabled);
      setConfig(prev => prev ? { ...prev, [field]: enabled ? 1 : 0 } : prev);
    } catch (err) {
      console.error(`Error updating ${field}:`, err);
    }
  }, []);

  const resetProgress = useCallback(async () => {
    // This would drop and recreate progress tables
    // For now, reset config stats
    await updateConfig({
      streak_days: 0,
      last_study_date: null,
      total_studied: 0,
    });
    await loadConfig();
  }, [loadConfig]);

  return {
    config,
    loading,
    notificationsSupported: isNotificationsSupported(),
    updateDailyGoal,
    toggleNotifications,
    updateNotifHour,
    toggleSetting,
    resetProgress,
    refresh: loadConfig,
  };
}
