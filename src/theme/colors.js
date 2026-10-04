// saflash Color System
// Inspired by PostHog's warm olive/sage palette (DESIGN.md)
// Adapted for flashcard-based learning app

export const COLORS = {
  // ── Primary ───────────────────────────────
  oliveInk: '#4d4f46',        // Primary body text — warm olive-gray
  deepOlive: '#23251d',       // Headings, strong emphasis — near-black with green undertone
  accentOrange: '#C2410C',    // Brand accent — darkened for 5:1 contrast on light surfaces

  // ── Secondary ─────────────────────────────
  amberGold: '#F7A501',       // Medium/warning accent — pairs with orange
  focusBlue: '#2563EB',       // Focus rings, listening button

  // ── Surfaces ──────────────────────────────
  warmParchment: '#fdfdf8',   // Primary page background — warm near-white with sage undertone
  sageCream: '#eeefe9',       // Input backgrounds, secondary surfaces
  lightSage: '#e5e7e0',       // Button backgrounds, tertiary surfaces
  hoverWhite: '#f4f4f4',      // Universal hover/tap feedback state
  surfaceWhite: '#FFFFFF',    // Card faces, modals

  // ── Text ──────────────────────────────────
  textPrimary: '#4d4f46',     // Alias: oliveInk — main reading text
  textSecondary: '#65675e',   // Subtitles, descriptions — muted olive
  textPlaceholder: '#6f7168', // Placeholders, disabled, inactive tabs — ≥4.5:1 on white
  textInput: '#374151',       // Input field text — slightly darker for readability

  // ── Borders ───────────────────────────────
  borderSage: '#bfc1b7',      // Primary border — olive-tinted gray
  borderLight: '#b6b7af',     // Secondary border — slightly darker sage

  // ── Semantic (rating / feedback) ──────────
  successGreen: '#15803D',    // "Fácil" rating, correct answers, progress
  warningAmber: '#F7A501',    // "Bien" rating, medium difficulty
  dangerOrange: '#C2410C',    // "Difícil" rating, hard cards

  // ── Flashcard ─────────────────────────────
  cardFrontBg: '#FFFFFF',     // Card front background
  cardBackBg: '#1e1f23',      // Card back background — dark near-black
  cardFrontText: '#4d4f46',   // Card front text — olive ink
  cardBackText: '#FFFFFF',    // Card back text — white on dark

  // ── Category badges ───────────────────────
  badgeBg: '#eeefe9',         // Badge background — sage cream
  badgeText: '#4d4f46',       // Badge text — olive ink

  // ── Utility ───────────────────────────────
  starYellow: '#D97706',      // Star glyphs (large text, ≥3:1)
  goldText: '#B45309',        // Amber-toned text (XP, streak) — amberGold is fill-only
  dividerColor: '#bfc1b7',    // Section dividers
};

// Semantic aliases for readability in component code
export const Rating = {
  hard: COLORS.dangerOrange,
  medium: COLORS.warningAmber,
  easy: COLORS.successGreen,
};

export const Status = {
  new: COLORS.textSecondary,
  learning: COLORS.dangerOrange,
  reviewing: COLORS.warningAmber,
  known: COLORS.successGreen,
};

// All take white text at ≥4.5:1.
export const DifficultyColors = {
  A1: '#15803D',
  A2: '#B45309',
  B1: '#C2410C',
  B2: '#B91C1C',
  C1: '#7B1FA2',
};

// Path units rotate through these so a level isn't one flat color (white text ≥5:1).
export const UNIT_COLORS = ['#15803D', '#1D4ED8', '#7C3AED', '#C2410C', '#0F766E', '#BE185D'];

export function unitColor(unitIndex) {
  return UNIT_COLORS[unitIndex % UNIT_COLORS.length];
}
