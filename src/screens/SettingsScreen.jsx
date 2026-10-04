// saflash — Settings screen
import React, { useState } from 'react';
import { View, Text, ScrollView, Switch, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { RADIUS, SPACING } from '../theme/spacing';
import { FONT_FAMILY } from '../theme/typography';
import { useSettings } from '../hooks/useSettings';
import { NEW_PER_DAY_OPTIONS, LEVEL_LABELS } from '../utils/constants';
import { RETENTION_OPTIONS, DEFAULT_RETENTION } from '../services/srs.mjs';
import { NEW_PER_DAY_DEFAULT } from '../hooks/useStudySession';
import ScreenHeader from '../components/ScreenHeader';
import StatusBarScrim from '../components/StatusBarScrim';

export default function SettingsScreen({ navigation }) {
  const {
    config,
    notificationsSupported,
    updateSetting,
    toggleNotifications,
    updateNotifHour,
    toggleSetting,
    resetProgress,
  } = useSettings();
  const [notifHour, setNotifHour] = useState(config?.notif_hour || 9);

  const handleReset = () => {
    Alert.alert(
      'Resetear progreso',
      '¿Estás seguro? Esto borrará TODO tu progreso y no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Resetear',
          style: 'destructive',
          onPress: async () => {
            await resetProgress();
            Alert.alert('Progreso reseteado', 'Tu progreso fue eliminado.');
          },
        },
      ]
    );
  };

  const handleNotifHourChange = (direction) => {
    const newHour = direction === 'up'
      ? Math.min(notifHour + 1, 23)
      : Math.max(notifHour - 1, 0);
    setNotifHour(newHour);
    updateNotifHour(newHour);
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <ScreenHeader title="Ajustes" />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mi nivel</Text>
          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => navigation.getParent()?.navigate('LevelPick', { mode: 'change' })}
          >
            <View style={styles.settingInfo}>
              <Ionicons name="school" size={22} color={COLORS.oliveInk} />
              <Text style={styles.settingLabel}>
                {config?.level || 'A1'} · {LEVEL_LABELS[config?.level || 'A1']}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.textPlaceholder} />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Palabras nuevas por día</Text>
          <Chips
            options={NEW_PER_DAY_OPTIONS.map(n => ({ value: n, label: String(n) }))}
            value={config?.new_per_day ?? NEW_PER_DAY_DEFAULT}
            onChange={value => updateSetting('new_per_day', value)}
          />
          <Text style={styles.helperText}>
            Cada palabra nueva trae varios repasos en las semanas siguientes. Empieza con pocas.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Retención objetivo</Text>
          <Chips
            options={RETENTION_OPTIONS.map(r => ({ value: r, label: `${Math.round(r * 100)}%` }))}
            value={config?.desired_retention ?? DEFAULT_RETENTION}
            onChange={value => updateSetting('desired_retention', value)}
          />
          <Text style={styles.helperText}>
            Probabilidad de recordar una palabra cuando toca repasarla. Más alta significa más repasos al día.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Modo de repaso</Text>
          <Chips
            options={[
              { value: 'type', label: 'Escribir la respuesta' },
              { value: 'flip', label: 'Voltear tarjeta' },
            ]}
            value={config?.review_mode || 'type'}
            onChange={value => updateSetting('review_mode', value)}
          />
          <Text style={styles.helperText}>
            Escribir obliga a recordar de verdad y fija mejor la palabra; voltear es más rápido.
          </Text>
        </View>

        {/* Notifications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notificaciones</Text>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Ionicons name="notifications" size={22} color={COLORS.oliveInk} />
              <Text style={styles.settingLabel}>Recordatorio diario</Text>
            </View>
            <Switch
              value={config?.notifications === 1}
              onValueChange={toggleNotifications}
              disabled={!notificationsSupported}
              trackColor={{ false: COLORS.borderSage, true: COLORS.successGreen }}
              thumbColor={COLORS.surfaceWhite}
            />
          </View>

          {!notificationsSupported && (
            <Text style={styles.helperText}>
              En Expo Go para Android las notificaciones no estan disponibles. Usa un development build para probarlas.
            </Text>
          )}

          {config?.notifications === 1 && notificationsSupported && (
            <View style={styles.timePicker}>
              <TouchableOpacity onPress={() => handleNotifHourChange('down')}>
                <Ionicons name="remove-circle" size={28} color={COLORS.deepOlive} />
              </TouchableOpacity>
              <Text style={styles.timeText}>
                {String(notifHour).padStart(2, '0')}:00
              </Text>
              <TouchableOpacity onPress={() => handleNotifHourChange('up')}>
                <Ionicons name="add-circle" size={28} color={COLORS.deepOlive} />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Sound */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sonido</Text>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Ionicons name="volume-high" size={22} color={COLORS.oliveInk} />
              <Text style={styles.settingLabel}>Pronunciación automática</Text>
            </View>
            <Switch
              value={config?.auto_speak !== 0}
              onValueChange={value => toggleSetting('auto_speak', value)}
              trackColor={{ false: COLORS.borderSage, true: COLORS.successGreen }}
              thumbColor={COLORS.surfaceWhite}
            />
          </View>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Ionicons name="musical-notes" size={22} color={COLORS.oliveInk} />
              <Text style={styles.settingLabel}>Efectos de sonido y vibración</Text>
            </View>
            <Switch
              value={config?.sound_effects !== 0}
              onValueChange={value => toggleSetting('sound_effects', value)}
              trackColor={{ false: COLORS.borderSage, true: COLORS.successGreen }}
              thumbColor={COLORS.surfaceWhite}
            />
          </View>
        </View>

        {/* Reset */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Datos</Text>
          <TouchableOpacity style={styles.dangerButton} onPress={handleReset} activeOpacity={0.7}>
            <Ionicons name="trash-outline" size={20} color={COLORS.dangerOrange} />
            <Text style={styles.dangerButtonText}>Resetear progreso</Text>
          </TouchableOpacity>
        </View>

        {/* About */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Acerca de</Text>
          <View style={styles.aboutCard}>
            <Text style={styles.aboutApp}>LoTengo</Text>
            <Text style={styles.aboutVersion}>Versión 1.0.0</Text>
            <Text style={styles.aboutDescription}>
              Aprende vocabulario en inglés con repetición espaciada (FSRS) y recuerdo activo.
            </Text>
            <Text style={styles.aboutCredits}>
              Oraciones de ejemplo: Tatoeba (tatoeba.org), CC BY 2.0 FR. Frecuencia de palabras:
              FrequencyWords de Hermit Dave (OpenSubtitles 2018), CC BY-SA 4.0. Pronunciación y
              definiciones: Free Dictionary API. Imágenes: Wikipedia.
            </Text>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
      <StatusBarScrim />
    </View>
  );
}

function Chips({ options, value, onChange }) {
  return (
    <View style={styles.goalOptions}>
      {options.map(option => {
        const active = option.value === value;
        return (
          <TouchableOpacity
            key={String(option.value)}
            style={[styles.goalChip, active ? styles.chipActive : styles.chipIdle]}
            onPress={() => onChange(option.value)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
          >
            <Text style={[styles.goalChipText, { color: active ? COLORS.surfaceWhite : COLORS.textSecondary }]}>
              {option.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  chipActive: {
    backgroundColor: COLORS.deepOlive,
    borderColor: COLORS.deepOlive,
  },
  chipIdle: {
    backgroundColor: COLORS.sageCream,
    borderColor: COLORS.borderSage,
  },
  aboutCredits: {
    fontFamily: FONT_FAMILY.regular,
    fontSize: 12,
    lineHeight: 18,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.sm,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.warmParchment,
  },
  section: {
    paddingHorizontal: SPACING.xl,
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 16,
    color: COLORS.deepOlive,
    marginBottom: SPACING.md,
  },
  goalOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  goalChip: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
  },
  goalChipText: {
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 14,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceWhite,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.borderSage,
    padding: SPACING.md,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  settingLabel: {
    fontFamily: FONT_FAMILY.regular,
    fontSize: 16,
    color: COLORS.oliveInk,
  },
  helperText: {
    fontFamily: FONT_FAMILY.regular,
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: SPACING.sm,
  },
  timePicker: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.md,
    gap: SPACING.xl,
  },
  timeText: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 28,
    color: COLORS.oliveInk,
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceWhite,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.dangerOrange + '40',
    padding: SPACING.md,
    gap: SPACING.md,
  },
  dangerButtonText: {
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 15,
    color: COLORS.dangerOrange,
  },
  aboutCard: {
    backgroundColor: COLORS.surfaceWhite,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.borderSage,
    padding: SPACING.base,
    gap: SPACING.xs,
  },
  aboutApp: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 18,
    color: COLORS.deepOlive,
  },
  aboutVersion: {
    fontFamily: FONT_FAMILY.regular,
    fontSize: 13,
    color: COLORS.textPlaceholder,
  },
  aboutDescription: {
    fontFamily: FONT_FAMILY.regular,
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginTop: SPACING.xs,
  },
});
