/**
 * HB+ (hbplus.fit) Cross-Platform Design Tokens
 * Shared across Web (React / React Native Web) & Mobile (Expo iOS/Android)
 */

export const HB_COLORS = {
  background: '#0A0C10',
  surface: '#161922',
  surfaceElevated: '#1E2330',
  border: '#252B3B',
  borderSubtle: 'rgba(148, 163, 184, 0.14)',
  accentLime: '#CCFF00',
  accentLimeMuted: 'rgba(204, 255, 0, 0.12)',
  biometricCyan: '#00E5FF',
  biometricCyanMuted: 'rgba(0, 229, 255, 0.12)',
  accentCoral: '#FF5757',
  accentCoralMuted: 'rgba(255, 87, 87, 0.12)',
  warningAmber: '#F59E0B',
  textPrimary: '#FFFFFF',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  textOnLime: '#0A0C10',
  proteinLime: '#CCFF00',
  carbsCyan: '#00E5FF',
  fatsCoral: '#FF5757',
} as const;

export const HB_SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const HB_LAYOUT = {
  maxWebWidth: 1200,
  cardRadius: 20,
  controlRadius: 12,
  minTouchTarget: 44,
} as const;

export const HB_FONTS = {
  display: 'Outfit, system-ui, sans-serif',
  body: 'Plus Jakarta Sans, system-ui, sans-serif',
  mono: 'JetBrains Mono, ui-monospace, monospace',
} as const;

export const WORKOUT_PROGRAMS = [
  'Strength Hypertrophy',
  'Metabolic Reset',
  'Push / Pull / Legs Hypertrophy',
  'Athletic Conditioning 5x5',
  'Executive Strength & Recovery',
] as const;

export type WorkoutProgramName = (typeof WORKOUT_PROGRAMS)[number];

export const EXERCISE_ALTERNATIVES: string[] = [
  'Incline Barbell Bench Press',
  'Flat Dumbbell Chest Press',
  'Seated Dumbbell Shoulder Press',
  'Standing Overhead Barbell Press',
  'Weighted Parallel Bar Dips',
  'Close-Grip Cable Pressdown',
  'Dual-Cable Lateral Raises',
  'Machine Pec Deck Fly',
  'Romanian Barbell Deadlift',
  'Bulgarian Split Squat',
  'Weighted Chin-Ups',
  'Chest-Supported T-Bar Row',
];
