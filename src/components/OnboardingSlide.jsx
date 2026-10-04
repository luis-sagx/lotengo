// saflash — Onboarding slide
import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { SPACING } from '../theme/spacing';
import { FONT_FAMILY } from '../theme/typography';

const { width } = Dimensions.get('window');

const ONBOARDING_ICONS = {
  slide1: 'book',
  slide2: 'chatbubbles',
  slide3: 'bar-chart',
};

const ONBOARDING_COLORS = {
  slide1: COLORS.successGreen,
  slide2: COLORS.accentOrange,
  slide3: COLORS.goldText,
};

export default function OnboardingSlide({ index, title, description }) {
  const iconKey = `slide${index + 1}`;
  const icon = ONBOARDING_ICONS[iconKey] || 'book';
  const color = ONBOARDING_COLORS[iconKey] || COLORS.successGreen;

  return (
    <View style={[styles.slide, { width }]}>
      <View style={[styles.iconContainer, { backgroundColor: color + '15' }]}>
        <Ionicons name={icon} size={80} color={color} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  slide: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xxl,
  },
  iconContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  title: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 24,
    color: COLORS.deepOlive,
    textAlign: 'center',
    marginBottom: SPACING.md,
    lineHeight: 32,
  },
  description: {
    fontFamily: FONT_FAMILY.regular,
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
});
