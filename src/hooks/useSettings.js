// saflash — Settings hook
import { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  getConfig,
  updateConfig,
  toggleNotifications as toggleNotificationsDB,
  updateNotifHour as updateNotifHourDB,
} from '../database/sessionRepository';
import { resetAllProgress } from '../database/progressRepository';
import { isNotificationsSupported, scheduleDailyNotification } from '../services/notifications';
import useAppStore from '../store/appStore';
import { setAutoSpeak } from '../services/audioService';
import { setEffectsEnabled } from '../services/soundService';

export function useSettings() {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);

  const setStoreNotifications = useAppStore(s => s.setNotifications);

  const loadConfig = useCallback(async () => {
    try {
      const cfg = await getConfig();
      setConfig(cfg);
      if (cfg) setStoreNotifications(cfg.notifications === 1);
    } catch (err) {
      console.error('Error loading config:', err);
    } finally {
      setLoading(false);
    }
  }, [setStoreNotifications]);

  useFocusEffect(useCallback(() => {
    loadConfig();
  }, [loadConfig]));

  // Study preferences: new_per_day, desired_retention, review_mode.
  const updateSetting = useCallback(async (field, value) => {
    try {
      await updateConfig({ [field]: value });
      setConfig(prev => prev ? { ...prev, [field]: value } : prev);
    } catch (err) {
      console.error(`Error updating ${field}:`, err);
    }
  }, []);

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
    await resetAllProgress();
    await loadConfig();
  }, [loadConfig]);

  return {
    config,
    loading,
    notificationsSupported: isNotificationsSupported(),
    updateSetting,
    toggleNotifications,
    updateNotifHour,
    toggleSetting,
    resetProgress,
    refresh: loadConfig,
  };
}
