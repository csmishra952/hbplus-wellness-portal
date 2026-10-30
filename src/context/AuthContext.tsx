import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut, User as FirebaseUser } from 'firebase/auth';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { auth, db, googleProvider, handleFirestoreError, OperationType } from '../config/firebase';
import {
  CONFIGURED_ALLOWED_DOMAIN,
  isEmailDomainAllowed,
  isExternalSupabaseConfigured,
  supabase,
} from '../config/supabase';
import { HB_ASSETS } from '../constants/assets';
import { WORKOUT_PROGRAMS, WorkoutProgramName } from '../constants/theme';

export type UserRole = 'user' | 'admin';
export type AppRoute = '/' | '/login' | '/dashboard';
export type ActiveTab = 'overview' | 'admin';

export interface HBProfile {
  uid: string;
  email: string;
  fullName: string;
  avatarUrl: string;
  role: UserRole;
  assignedProgram: string;
  domainVerified: boolean;
  createdAt: string;
}

export interface ExerciseItem {
  id: string;
  name: string;
  sets: number;
  repsCount: number;
  reps: string;
  loadKg: number;
  completed: boolean;
  setsCompleted: boolean[];
}

export interface AdherenceDay {
  day: string;
  dateLabel: string;
  completed: boolean;
  pillarsHit: number;
}

export interface CoachFeedbackNote {
  id: string;
  authorName: string;
  authorRole: string;
  timestamp: string;
  content: string;
}

export interface AthleteClientFile {
  uid: string;
  fullName: string;
  email: string;
  avatarUrl: string;
  assignedProgram: string;
  recoveryScore: number;
  hrvMs: number;
  rhrBpm: number;
  sleepDuration: string;
  sleepEfficiency: number;
  adherenceStreak: number;
  lastSynced: string;
  weeklyCompliance: { day: string; pct: number }[];
  coachAlert: string | null;
  volumeDeloadApplied?: boolean;
  exercises: ExerciseItem[];
  nutritionProtocol: {
    caloriesTarget: number;
    proteinTarget: number;
    carbsTarget: number;
    fatsTarget: number;
  };
  coachNotes: CoachFeedbackNote[];
}

export interface WellnessState {
  workoutCompleted: boolean;
  exercises: ExerciseItem[];
  workoutStreak: number;
  caloriesTarget: number;
  caloriesConsumed: number;
  proteinTarget: number;
  proteinGrams: number;
  carbsTarget: number;
  carbsGrams: number;
  fatsTarget: number;
  fatsGrams: number;
  waterTarget: number;
  waterGlasses: number;
  stepsTarget: number;
  stepsCount: number;
  mindfulnessStreak: number;
  breathworkSessions: number;
  recoveryScore: number;
  hrvMs: number;
  rhrBpm: number;
  sleepDuration: string;
  sleepEfficiency: number;
  sleepStages: {
    deepMinutes: number;
    remMinutes: number;
    lightMinutes: number;
  };
  weeklyAdherence: AdherenceDay[];
}

export interface MealPreset {
  label: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}

interface AuthContextValue {
  profile: HBProfile | null;
  wellness: WellnessState;
  route: AppRoute;
  navigateToRoute: (nextRoute: AppRoute) => void;
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  isLoading: boolean;
  isAuthenticating: boolean;
  authError: string | null;
  attemptedBlockedEmail: string | null;
  clearAuthError: () => void;
  isDemoSession: boolean;
  allowedDomains: string[];
  registeredUsers: HBProfile[];
  athletes: AthleteClientFile[];
  // Auth actions
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  // Recruiter Demo Sandbox actions
  loginDemoMember: () => void;
  simulateBlockedUser: () => Promise<void>;
  loginDemoAdmin: () => void;
  // Pillar 1: Strength actions
  toggleExerciseCompleted: (exerciseId: string) => Promise<void>;
  toggleSetCompleted: (exerciseId: string, setIndex: number) => Promise<boolean>;
  updateExerciseLoad: (exerciseId: string, deltaKg: number) => void;
  toggleWorkoutCompleted: () => Promise<void>;
  // Pillar 2: Nutrition actions
  logMeal: (meal: MealPreset) => Promise<void>;
  // Pillar 3: Mental Wellness actions
  completeBreathworkCycle: () => Promise<void>;
  // Pillar 4: Vitals & Hydration actions
  adjustWaterGlasses: (delta: number) => Promise<void>;
  setWaterGlassesDirect: (targetGlasses: number) => Promise<void>;
  addSteps: (deltaSteps: number) => Promise<void>;
  // Top Strip: Weekly Adherence Heatmap toggle
  toggleAdherenceDay: (dayIndex: number) => void;
  // Coach & Admin Portal actions
  assignWorkoutProgram: (targetUid: string, program: WorkoutProgramName | string) => Promise<void>;
  updateAthleteExercises: (
    athleteUid: string,
    programName: string,
    exercises: ExerciseItem[],
    markDeloadApplied?: boolean
  ) => Promise<void>;
  pushAthleteNutritionProtocol: (
    athleteUid: string,
    protocol: {
      caloriesTarget: number;
      proteinTarget: number;
      carbsTarget: number;
      fatsTarget: number;
    }
  ) => void;
  postCoachFeedbackNote: (athleteUid: string, content: string) => void;
  addAllowedDomain: (domain: string) => Promise<{ ok: boolean; message?: string }>;
  removeAllowedDomain: (domain: string) => Promise<void>;
}

const RESTRICTED_DOMAIN_MESSAGE =
  'Access restricted. Please login using your official domain email.';

// Blueprint regex & volumetric constants (synced with firebase-blueprint.json)
const VALID_ID_REGEX = /^[a-zA-Z0-9_\-]+$/;
const VALID_EMAIL_REGEX = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

function sanitizeBoundedString(value: string, maxLength: number, fallback: string): string {
  const trimmed = value.trim();
  if (!trimmed) return fallback;
  return trimmed.slice(0, maxLength);
}

function clampMetric(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, Math.round(value)));
}

const DEFAULT_EXERCISES: ExerciseItem[] = [
  {
    id: 'ex-1',
    name: 'Incline Barbell Bench Press',
    sets: 4,
    repsCount: 8,
    reps: '8 reps',
    loadKg: 75,
    completed: true,
    setsCompleted: [true, true, true, true],
  },
  {
    id: 'ex-2',
    name: 'Seated Dumbbell Shoulder Press',
    sets: 3,
    repsCount: 10,
    reps: '10 reps',
    loadKg: 26,
    completed: true,
    setsCompleted: [true, true, true],
  },
  {
    id: 'ex-3',
    name: 'Weighted Parallel Bar Dips',
    sets: 3,
    repsCount: 12,
    reps: '12 reps',
    loadKg: 15,
    completed: false,
    setsCompleted: [true, false, false],
  },
  {
    id: 'ex-4',
    name: 'Dual-Cable Lateral Raises',
    sets: 4,
    repsCount: 15,
    reps: '15 reps',
    loadKg: 12,
    completed: false,
    setsCompleted: [false, false, false, false],
  },
];

const INITIAL_WEEKLY_ADHERENCE: AdherenceDay[] = [
  { day: 'Mon', dateLabel: '24', completed: true, pillarsHit: 4 },
  { day: 'Tue', dateLabel: '25', completed: true, pillarsHit: 4 },
  { day: 'Wed', dateLabel: '26', completed: true, pillarsHit: 3 },
  { day: 'Thu', dateLabel: '27', completed: true, pillarsHit: 4 },
  { day: 'Fri', dateLabel: '28', completed: true, pillarsHit: 4 },
  { day: 'Sat', dateLabel: '29', completed: true, pillarsHit: 4 },
  { day: 'Sun', dateLabel: '30', completed: false, pillarsHit: 3 },
];

const INITIAL_WELLNESS: WellnessState = {
  workoutCompleted: false,
  exercises: DEFAULT_EXERCISES,
  workoutStreak: 14,
  caloriesTarget: 2350,
  caloriesConsumed: 1760,
  proteinTarget: 160,
  proteinGrams: 132,
  carbsTarget: 210,
  carbsGrams: 168,
  fatsTarget: 65,
  fatsGrams: 51,
  waterTarget: 8,
  waterGlasses: 6,
  stepsTarget: 10000,
  stepsCount: 8450,
  mindfulnessStreak: 9,
  breathworkSessions: 3,
  recoveryScore: 88,
  hrvMs: 74,
  rhrBpm: 49,
  sleepDuration: '7h 45m',
  sleepEfficiency: 91,
  sleepStages: {
    deepMinutes: 112,
    remMinutes: 108,
    lightMinutes: 245,
  },
  weeklyAdherence: INITIAL_WEEKLY_ADHERENCE,
};

const SEEDED_ROSTER: HBProfile[] = [
  {
    uid: 'demo-member-01',
    email: 'member@hbplus.fit',
    fullName: 'Maya Lin',
    avatarUrl: HB_ASSETS.avatarMemberAthlete,
    role: 'user',
    assignedProgram: 'Strength Hypertrophy',
    domainVerified: true,
    createdAt: '2026-09-14T08:15:00.000Z',
  },
  {
    uid: 'demo-admin-01',
    email: 'admin@hbplus.fit',
    fullName: 'Coach Marcus Vance',
    avatarUrl: HB_ASSETS.avatarAdminCoach,
    role: 'admin',
    assignedProgram: 'Executive Strength & Recovery',
    domainVerified: true,
    createdAt: '2026-08-02T07:00:00.000Z',
  },
  {
    uid: 'hb-athlete-alex',
    email: 'alex.chen@hbplus.fit',
    fullName: 'Alex Chen',
    avatarUrl: HB_ASSETS.avatarAlexChen,
    role: 'user',
    assignedProgram: 'Strength Hypertrophy',
    domainVerified: true,
    createdAt: '2026-09-19T10:12:00.000Z',
  },
  {
    uid: 'hb-athlete-jordan',
    email: 'jordan.lee@hbplus.fit',
    fullName: 'Jordan Lee',
    avatarUrl: HB_ASSETS.avatarJordanLee,
    role: 'user',
    assignedProgram: 'Metabolic Reset',
    domainVerified: true,
    createdAt: '2026-09-22T14:30:00.000Z',
  },
  {
    uid: 'hb-athlete-dev',
    email: 'dev.sharma@hbplus.fit',
    fullName: 'Dev Sharma',
    avatarUrl: HB_ASSETS.avatarDevSharma,
    role: 'user',
    assignedProgram: 'Metabolic Reset',
    domainVerified: true,
    createdAt: '2026-10-03T08:45:00.000Z',
  },
  {
    uid: 'hb-member-02',
    email: 'elena.rostova@hbplus.fit',
    fullName: 'Elena Rostova',
    avatarUrl: '',
    role: 'user',
    assignedProgram: 'Strength Hypertrophy',
    domainVerified: true,
    createdAt: '2026-09-28T11:40:00.000Z',
  },
];

const INITIAL_ATHLETES: AthleteClientFile[] = [
  {
    uid: 'demo-member-01',
    fullName: 'Maya Lin',
    email: 'member@hbplus.fit',
    avatarUrl: HB_ASSETS.avatarMemberAthlete,
    assignedProgram: 'Strength Hypertrophy',
    recoveryScore: 88,
    hrvMs: 74,
    rhrBpm: 49,
    sleepDuration: '7h 45m',
    sleepEfficiency: 91,
    adherenceStreak: 14,
    lastSynced: '2 mins ago',
    weeklyCompliance: [
      { day: 'Mon', pct: 100 },
      { day: 'Tue', pct: 95 },
      { day: 'Wed', pct: 88 },
      { day: 'Thu', pct: 100 },
      { day: 'Fri', pct: 96 },
      { day: 'Sat', pct: 100 },
      { day: 'Sun', pct: 92 },
    ],
    coachAlert:
      "Maya's HRV dipped 14% after heavy mid-week pressing before rebounding to 74ms. Consider auto-reducing today's working volume by 10% if shoulder fatigue persists.",
    exercises: DEFAULT_EXERCISES.map((ex) => ({
      ...ex,
      setsCompleted: [...ex.setsCompleted],
    })),
    nutritionProtocol: {
      caloriesTarget: 2350,
      proteinTarget: 160,
      carbsTarget: 210,
      fatsTarget: 65,
    },
    coachNotes: [
      {
        id: 'note-maya-1',
        authorName: 'Coach Marcus Vance',
        authorRole: 'Lead Strength & Longevity Coach',
        timestamp: 'Yesterday · 18:40',
        content:
          'Tempo on incline barbell presses looked controlled across all 4 working sets. Keep post-training carbs above 60g and complete 2 rounds of 4-7-8 breathwork before sleep.',
      },
      {
        id: 'note-maya-2',
        authorName: 'Dr. Ananya Rao',
        authorRole: 'Metabolic Nutrition Specialist',
        timestamp: '3 days ago · 09:15',
        content:
          'Fasting glucose and morning hydration markers are right on target. Maintaining 2,350 kcal protocol through this hypertrophy mesocycle.',
      },
    ],
  },
  {
    uid: 'hb-athlete-alex',
    fullName: 'Alex Chen',
    email: 'alex.chen@hbplus.fit',
    avatarUrl: HB_ASSETS.avatarAlexChen,
    assignedProgram: 'Strength Hypertrophy',
    recoveryScore: 54,
    hrvMs: 46,
    rhrBpm: 61,
    sleepDuration: '5h 52m',
    sleepEfficiency: 76,
    adherenceStreak: 6,
    lastSynced: '8 mins ago',
    weeklyCompliance: [
      { day: 'Mon', pct: 100 },
      { day: 'Tue', pct: 90 },
      { day: 'Wed', pct: 85 },
      { day: 'Thu', pct: 78 },
      { day: 'Fri', pct: 64 },
      { day: 'Sat', pct: 70 },
      { day: 'Sun', pct: 58 },
    ],
    coachAlert:
      "Alex's HRV dropped 18% last night with elevated RHR (61 bpm) and 5h 52m sleep. Consider auto-reducing today's working volume by 10%.",
    exercises: [
      {
        id: 'alex-ex-1',
        name: 'Romanian Barbell Deadlift',
        sets: 4,
        repsCount: 8,
        reps: '8 reps',
        loadKg: 110,
        completed: false,
        setsCompleted: [true, true, false, false],
      },
      {
        id: 'alex-ex-2',
        name: 'Weighted Chin-Ups',
        sets: 4,
        repsCount: 6,
        reps: '6 reps',
        loadKg: 20,
        completed: false,
        setsCompleted: [true, false, false, false],
      },
      {
        id: 'alex-ex-3',
        name: 'Chest-Supported T-Bar Row',
        sets: 3,
        repsCount: 10,
        reps: '10 reps',
        loadKg: 65,
        completed: false,
        setsCompleted: [false, false, false],
      },
      {
        id: 'alex-ex-4',
        name: 'Bulgarian Split Squat',
        sets: 3,
        repsCount: 10,
        reps: '10 reps',
        loadKg: 28,
        completed: false,
        setsCompleted: [false, false, false],
      },
    ],
    nutritionProtocol: {
      caloriesTarget: 2750,
      proteinTarget: 185,
      carbsTarget: 280,
      fatsTarget: 72,
    },
    coachNotes: [
      {
        id: 'note-alex-1',
        authorName: 'Coach Marcus Vance',
        authorRole: 'Lead Strength & Longevity Coach',
        timestamp: 'Today · 07:30',
        content:
          'Flagged red/amber sympathetic strain after back-to-back late flights. Cap RPE at 7 today and add +500ml electrolyte hydration pre-session.',
      },
    ],
  },
  {
    uid: 'hb-athlete-jordan',
    fullName: 'Jordan Lee',
    email: 'jordan.lee@hbplus.fit',
    avatarUrl: HB_ASSETS.avatarJordanLee,
    assignedProgram: 'Metabolic Reset',
    recoveryScore: 92,
    hrvMs: 86,
    rhrBpm: 46,
    sleepDuration: '8h 12m',
    sleepEfficiency: 94,
    adherenceStreak: 21,
    lastSynced: 'Just now',
    weeklyCompliance: [
      { day: 'Mon', pct: 100 },
      { day: 'Tue', pct: 100 },
      { day: 'Wed', pct: 96 },
      { day: 'Thu', pct: 100 },
      { day: 'Fri', pct: 100 },
      { day: 'Sat', pct: 95 },
      { day: 'Sun', pct: 100 },
    ],
    coachAlert: null,
    exercises: [
      {
        id: 'jordan-ex-1',
        name: 'Flat Dumbbell Chest Press',
        sets: 4,
        repsCount: 10,
        reps: '10 reps',
        loadKg: 24,
        completed: true,
        setsCompleted: [true, true, true, true],
      },
      {
        id: 'jordan-ex-2',
        name: 'Bulgarian Split Squat',
        sets: 3,
        repsCount: 12,
        reps: '12 reps',
        loadKg: 18,
        completed: true,
        setsCompleted: [true, true, true],
      },
      {
        id: 'jordan-ex-3',
        name: 'Chest-Supported T-Bar Row',
        sets: 3,
        repsCount: 12,
        reps: '12 reps',
        loadKg: 42,
        completed: true,
        setsCompleted: [true, true, true],
      },
      {
        id: 'jordan-ex-4',
        name: 'Dual-Cable Lateral Raises',
        sets: 3,
        repsCount: 15,
        reps: '15 reps',
        loadKg: 10,
        completed: true,
        setsCompleted: [true, true, true],
      },
    ],
    nutritionProtocol: {
      caloriesTarget: 2050,
      proteinTarget: 145,
      carbsTarget: 185,
      fatsTarget: 62,
    },
    coachNotes: [
      {
        id: 'note-jordan-1',
        authorName: 'Dr. Ananya Rao',
        authorRole: 'Metabolic Nutrition Specialist',
        timestamp: 'Yesterday · 16:05',
        content:
          '21-day streak achieved with 94% sleep efficiency. Ready for a +2.5kg progressive overload bump on compound unilateral movements next week.',
      },
    ],
  },
  {
    uid: 'hb-athlete-dev',
    fullName: 'Dev Sharma',
    email: 'dev.sharma@hbplus.fit',
    avatarUrl: HB_ASSETS.avatarDevSharma,
    assignedProgram: 'Metabolic Reset',
    recoveryScore: 56,
    hrvMs: 49,
    rhrBpm: 58,
    sleepDuration: '6h 05m',
    sleepEfficiency: 79,
    adherenceStreak: 9,
    lastSynced: '14 mins ago',
    weeklyCompliance: [
      { day: 'Mon', pct: 95 },
      { day: 'Tue', pct: 92 },
      { day: 'Wed', pct: 84 },
      { day: 'Thu', pct: 90 },
      { day: 'Fri', pct: 72 },
      { day: 'Sat', pct: 68 },
      { day: 'Sun', pct: 60 },
    ],
    coachAlert:
      "Dev's deep sleep dropped to 48m last night (56% recovery). Consider auto-reducing today's working volume by 10% and adding evening parasympathetic breathwork.",
    exercises: [
      {
        id: 'dev-ex-1',
        name: 'Standing Overhead Barbell Press',
        sets: 4,
        repsCount: 8,
        reps: '8 reps',
        loadKg: 52.5,
        completed: false,
        setsCompleted: [true, true, false, false],
      },
      {
        id: 'dev-ex-2',
        name: 'Romanian Barbell Deadlift',
        sets: 3,
        repsCount: 10,
        reps: '10 reps',
        loadKg: 95,
        completed: false,
        setsCompleted: [true, false, false],
      },
      {
        id: 'dev-ex-3',
        name: 'Flat Dumbbell Chest Press',
        sets: 3,
        repsCount: 10,
        reps: '10 reps',
        loadKg: 30,
        completed: false,
        setsCompleted: [false, false, false],
      },
      {
        id: 'dev-ex-4',
        name: 'Close-Grip Cable Pressdown',
        sets: 3,
        repsCount: 14,
        reps: '14 reps',
        loadKg: 27.5,
        completed: false,
        setsCompleted: [false, false, false],
      },
    ],
    nutritionProtocol: {
      caloriesTarget: 2200,
      proteinTarget: 165,
      carbsTarget: 195,
      fatsTarget: 65,
    },
    coachNotes: [
      {
        id: 'note-dev-1',
        authorName: 'Kabir Sen',
        authorRole: 'Autonomic Breathwork & Mindset Lead',
        timestamp: '2 days ago · 20:10',
        content:
          'Recommended 3 cycles of 4-7-8 down-regulation 45 minutes prior to lights-out to restore slow-wave sleep architecture.',
      },
    ],
  },
  {
    uid: 'hb-member-02',
    fullName: 'Elena Rostova',
    email: 'elena.rostova@hbplus.fit',
    avatarUrl: '',
    assignedProgram: 'Strength Hypertrophy',
    recoveryScore: 58,
    hrvMs: 51,
    rhrBpm: 57,
    sleepDuration: '6h 18m',
    sleepEfficiency: 81,
    adherenceStreak: 11,
    lastSynced: '22 mins ago',
    weeklyCompliance: [
      { day: 'Mon', pct: 100 },
      { day: 'Tue', pct: 92 },
      { day: 'Wed', pct: 88 },
      { day: 'Thu', pct: 84 },
      { day: 'Fri', pct: 76 },
      { day: 'Sat', pct: 68 },
      { day: 'Sun', pct: 62 },
    ],
    coachAlert:
      "Elena's readiness dipped to 58% following high-tonnage lower-body training. Consider auto-reducing today's working volume by 10%.",
    exercises: [
      {
        id: 'elena-ex-1',
        name: 'Incline Barbell Bench Press',
        sets: 4,
        repsCount: 8,
        reps: '8 reps',
        loadKg: 55,
        completed: false,
        setsCompleted: [true, true, false, false],
      },
      {
        id: 'elena-ex-2',
        name: 'Seated Dumbbell Shoulder Press',
        sets: 3,
        repsCount: 10,
        reps: '10 reps',
        loadKg: 18,
        completed: false,
        setsCompleted: [true, false, false],
      },
      {
        id: 'elena-ex-3',
        name: 'Machine Pec Deck Fly',
        sets: 3,
        repsCount: 12,
        reps: '12 reps',
        loadKg: 35,
        completed: false,
        setsCompleted: [false, false, false],
      },
    ],
    nutritionProtocol: {
      caloriesTarget: 2150,
      proteinTarget: 150,
      carbsTarget: 205,
      fatsTarget: 62,
    },
    coachNotes: [
      {
        id: 'note-elena-1',
        authorName: 'Coach Marcus Vance',
        authorRole: 'Lead Strength & Longevity Coach',
        timestamp: 'Yesterday · 11:20',
        content:
          'Solid adherence streak at 11 days. Keep intra-workout hydration high and prioritize extra 45 minutes of sleep tonight.',
      },
    ],
  },
];

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function resolveInitialRoute(): AppRoute {
  try {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      if (path === '/login') return '/login';
      if (path === '/dashboard') return '/dashboard';
    }
  } catch {
    // Ignore window access errors in restricted environments
  }
  return '/';
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [profile, setProfile] = useState<HBProfile | null>(null);
  const [wellness, setWellness] = useState<WellnessState>(INITIAL_WELLNESS);
  const [route, setRoute] = useState<AppRoute>(resolveInitialRoute);
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAuthenticating, setIsAuthenticating] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [attemptedBlockedEmail, setAttemptedBlockedEmail] = useState<string | null>(null);
  const [isDemoSession, setIsDemoSession] = useState<boolean>(false);
  const [allowedDomains, setAllowedDomains] = useState<string[]>(() => {
    const base = [CONFIGURED_ALLOWED_DOMAIN];
    if (!base.includes('hbplus.fit')) {
      base.unshift('hbplus.fit');
    }
    return base;
  });
  const [registeredUsers, setRegisteredUsers] = useState<HBProfile[]>(SEEDED_ROSTER);
  const [athletes, setAthletes] = useState<AthleteClientFile[]>(INITIAL_ATHLETES);

  // Sync browser URL path cleanly for /, /login, and /dashboard
  const navigateTo = useCallback((nextRoute: AppRoute) => {
    setRoute(nextRoute);
    try {
      if (typeof window !== 'undefined') {
        if (window.location.pathname !== nextRoute) {
          window.history.pushState({}, '', nextRoute);
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch {
      // Ignore history errors in restricted webviews
    }
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      setRoute(resolveInitialRoute());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const clearAuthError = useCallback(() => {
    setAuthError(null);
    setAttemptedBlockedEmail(null);
  }, []);

  // Sync or upsert authenticated user with Cloud Firestore (or external Supabase when configured)
  const syncLiveUserSession = useCallback(
    async (fbUser: FirebaseUser, currentDomains: string[]) => {
      const email = (fbUser.email || '').trim().toLowerCase();

      // Enforce strict HB+ domain validation gate
      if (!email || !VALID_EMAIL_REGEX.test(email) || !isEmailDomainAllowed(email, currentDomains)) {
        await signOut(auth);
        if (supabase) {
          await supabase.auth.signOut();
        }
        setProfile(null);
        setIsDemoSession(false);
        setAttemptedBlockedEmail(email || 'unverified-account');
        setAuthError(RESTRICTED_DOMAIN_MESSAGE);
        navigateTo('/login');
        return;
      }

      const safeUid = VALID_ID_REGEX.test(fbUser.uid)
        ? fbUser.uid.slice(0, 128)
        : fbUser.uid.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 128);

      const profilePath = `profiles/${safeUid}`;
      const profileRef = doc(db, 'profiles', safeUid);

      let resolvedProfile: HBProfile | null = null;
      try {
        const snap = await getDoc(profileRef);
        if (snap.exists()) {
          const data = snap.data();
          resolvedProfile = {
            uid: safeUid,
            email: data.email || email,
            fullName: data.fullName || fbUser.displayName || 'HB+ Member',
            avatarUrl: data.avatarUrl || fbUser.photoURL || '',
            role: data.role === 'admin' ? 'admin' : 'user',
            assignedProgram: data.assignedProgram || WORKOUT_PROGRAMS[0],
            domainVerified: Boolean(data.domainVerified ?? true),
            createdAt:
              data.createdAt && typeof data.createdAt.toDate === 'function'
                ? data.createdAt.toDate().toISOString()
                : new Date().toISOString(),
          };
        } else {
          const isBootstrappedAdmin = email === 'csmishra952@gmail.com';
          const roleToCreate: UserRole = isBootstrappedAdmin ? 'admin' : 'user';
          const newProfilePayload = {
            uid: safeUid,
            email: email.slice(0, 254),
            fullName: sanitizeBoundedString(
              fbUser.displayName || email.split('@')[0] || 'HB+ Member',
              100,
              'HB+ Member'
            ),
            avatarUrl: (fbUser.photoURL || '').slice(0, 500),
            role: roleToCreate,
            assignedProgram: WORKOUT_PROGRAMS[0],
            domainVerified: true,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          };
          await setDoc(profileRef, newProfilePayload);
          resolvedProfile = {
            uid: safeUid,
            email: newProfilePayload.email,
            fullName: newProfilePayload.fullName,
            avatarUrl: newProfilePayload.avatarUrl,
            role: roleToCreate,
            assignedProgram: newProfilePayload.assignedProgram,
            domainVerified: true,
            createdAt: new Date().toISOString(),
          };
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, profilePath);
      }

      // Sync daily wellness log document (preserving strict firestore.rules key invariants)
      const wellnessPath = `wellnessLogs/${safeUid}`;
      const wellnessRef = doc(db, 'wellnessLogs', safeUid);
      try {
        const logSnap = await getDoc(wellnessRef);
        if (logSnap.exists()) {
          const wData = logSnap.data();
          const completedCount = clampMetric(Number(wData.completedExercisesCount ?? 2), 0, 4);
          setWellness((prev) => ({
            ...prev,
            workoutCompleted: Boolean(wData.workoutCompleted),
            exercises: prev.exercises.map((ex, idx) => {
              const isDone = Boolean(wData.workoutCompleted) || idx < completedCount;
              return {
                ...ex,
                completed: isDone,
                setsCompleted: Array.from({ length: ex.sets }, () => isDone),
              };
            }),
            workoutStreak: clampMetric(Number(wData.workoutStreak ?? 14), 0, 3650),
            caloriesConsumed: clampMetric(Number(wData.caloriesConsumed ?? 1760), 0, 20000),
            proteinGrams: clampMetric(Number(wData.proteinGrams ?? 132), 0, 1000),
            carbsGrams: clampMetric(Number(wData.carbsGrams ?? 168), 0, 2000),
            fatsGrams: clampMetric(Number(wData.fatsGrams ?? 51), 0, 1000),
            waterGlasses: clampMetric(Number(wData.waterGlasses ?? 6), 0, 40),
            stepsCount: clampMetric(Number(wData.stepsCount ?? 8450), 0, 200000),
            mindfulnessStreak: clampMetric(Number(wData.mindfulnessStreak ?? 9), 0, 3650),
            breathworkSessions: clampMetric(Number(wData.breathworkSessions ?? 3), 0, 1000),
          }));
        } else {
          await setDoc(wellnessRef, {
            ownerId: safeUid,
            workoutCompleted: false,
            completedExercisesCount: 2,
            workoutStreak: 14,
            caloriesConsumed: 1760,
            proteinGrams: 132,
            carbsGrams: 168,
            fatsGrams: 51,
            waterGlasses: 6,
            stepsCount: 8450,
            mindfulnessStreak: 9,
            breathworkSessions: 3,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, wellnessPath);
      }

      // Load global domain settings if present
      try {
        const domainRef = doc(db, 'domainSettings', 'global');
        const domainSnap = await getDoc(domainRef);
        if (domainSnap.exists()) {
          const list = domainSnap.data().allowedDomains;
          if (Array.isArray(list) && list.length > 0) {
            setAllowedDomains(list.map((d) => String(d).toLowerCase()));
          }
        }
      } catch {
        // Non-fatal if global domainSettings doc has not been created by an admin yet
      }

      // If bootstrapped admin, merge real registered profiles into roster
      if (resolvedProfile && resolvedProfile.role === 'admin') {
        try {
          const profilesSnap = await getDocs(
            resolvedProfile.email === 'csmishra952@gmail.com'
              ? collection(db, 'profiles')
              : query(collection(db, 'profiles'), where('uid', '==', safeUid))
          );
          const liveProfiles: HBProfile[] = profilesSnap.docs.map((d) => {
            const item = d.data();
            return {
              uid: item.uid,
              email: item.email,
              fullName: item.fullName,
              avatarUrl: item.avatarUrl || '',
              role: item.role === 'admin' ? 'admin' : 'user',
              assignedProgram: item.assignedProgram || WORKOUT_PROGRAMS[0],
              domainVerified: Boolean(item.domainVerified ?? true),
              createdAt:
                item.createdAt && typeof item.createdAt.toDate === 'function'
                  ? item.createdAt.toDate().toISOString()
                  : new Date().toISOString(),
            };
          });
          setRegisteredUsers((prev) => {
            const byUid = new Map(prev.map((u) => [u.uid, u]));
            for (const lp of liveProfiles) {
              byUid.set(lp.uid, lp);
            }
            return Array.from(byUid.values());
          });
        } catch (error) {
          handleFirestoreError(error, OperationType.LIST, 'profiles');
        }
      }

      if (resolvedProfile) {
        setProfile(resolvedProfile);
        setIsDemoSession(false);
        setActiveTab(resolvedProfile.role === 'admin' ? 'admin' : 'overview');
        clearAuthError();
        navigateTo('/dashboard');
      }
    },
    [clearAuthError, navigateTo]
  );

  // Sync or upsert authenticated user with external Supabase PostgreSQL when configured
  const syncSupabaseUserSession = useCallback(
    async (sbUser: SupabaseUser, currentDomains: string[]) => {
      if (!supabase) return;
      const email = (sbUser.email || '').trim().toLowerCase();

      // Load dynamic domain_settings from Supabase first if available
      let effectiveDomains = currentDomains;
      try {
        const { data: domainData } = await supabase
          .from('domain_settings')
          .select('allowed_domains')
          .eq('id', 'global')
          .maybeSingle();

        if (domainData && Array.isArray(domainData.allowed_domains) && domainData.allowed_domains.length > 0) {
          const normalized = domainData.allowed_domains.map((d: string) => String(d).toLowerCase());
          effectiveDomains = Array.from(new Set([...currentDomains, ...normalized]));
          setAllowedDomains(effectiveDomains);
        }
      } catch {
        // Proceed with configured env allowedDomains if table not yet queried
      }

      // Enforce strict HB+ domain validation gate
      if (!email || !VALID_EMAIL_REGEX.test(email) || !isEmailDomainAllowed(email, effectiveDomains)) {
        await supabase.auth.signOut();
        setProfile(null);
        setIsDemoSession(false);
        setAttemptedBlockedEmail(email || 'unverified-account');
        setAuthError(RESTRICTED_DOMAIN_MESSAGE);
        navigateTo('/login');
        return;
      }

      const metadata = (sbUser.user_metadata || {}) as Record<string, string | undefined>;
      const fallbackName = sanitizeBoundedString(
        metadata.full_name || metadata.name || email.split('@')[0] || 'HB+ Member',
        100,
        'HB+ Member'
      );
      const fallbackAvatar = (metadata.avatar_url || metadata.picture || '').slice(0, 500);

      let resolvedProfile: HBProfile | null = null;

      try {
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', sbUser.id)
          .maybeSingle();

        if (existingProfile) {
          resolvedProfile = {
            uid: sbUser.id,
            email: existingProfile.email || email,
            fullName: existingProfile.full_name || fallbackName,
            avatarUrl: existingProfile.avatar_url || fallbackAvatar,
            role: existingProfile.role === 'admin' ? 'admin' : 'user',
            assignedProgram: existingProfile.assigned_program || WORKOUT_PROGRAMS[0],
            domainVerified: Boolean(existingProfile.domain_verified ?? true),
            createdAt: existingProfile.created_at || new Date().toISOString(),
          };
        } else {
          const isBootstrappedAdmin =
            email === 'admin@hbplus.fit' || email === 'csmishra952@gmail.com';
          const roleToCreate: UserRole = isBootstrappedAdmin ? 'admin' : 'user';

          const { data: createdRow, error: insertError } = await supabase
            .from('profiles')
            .upsert(
              {
                id: sbUser.id,
                email: email.slice(0, 254),
                full_name: fallbackName,
                avatar_url: fallbackAvatar,
                role: roleToCreate,
                assigned_program: WORKOUT_PROGRAMS[0],
                domain_verified: true,
              },
              { onConflict: 'id' }
            )
            .select('*')
            .single();

          if (insertError) {
            console.error('Supabase profile upsert error:', insertError.message);
          }

          resolvedProfile = {
            uid: sbUser.id,
            email: createdRow?.email || email,
            fullName: createdRow?.full_name || fallbackName,
            avatarUrl: createdRow?.avatar_url || fallbackAvatar,
            role: createdRow?.role === 'admin' ? 'admin' : roleToCreate,
            assignedProgram: createdRow?.assigned_program || WORKOUT_PROGRAMS[0],
            domainVerified: true,
            createdAt: createdRow?.created_at || new Date().toISOString(),
          };
        }
      } catch (err) {
        console.error('Supabase profile fetch error:', err);
      }

      // Sync daily wellness_logs row in Supabase PostgreSQL
      try {
        const { data: wData } = await supabase
          .from('wellness_logs')
          .select('*')
          .eq('user_id', sbUser.id)
          .maybeSingle();

        if (wData) {
          const completedCount = clampMetric(Number(wData.completed_exercises_count ?? 2), 0, 4);
          setWellness((prev) => ({
            ...prev,
            workoutCompleted: Boolean(wData.workout_completed),
            exercises: prev.exercises.map((ex, idx) => {
              const isDone = Boolean(wData.workout_completed) || idx < completedCount;
              return {
                ...ex,
                completed: isDone,
                setsCompleted: Array.from({ length: ex.sets }, () => isDone),
              };
            }),
            workoutStreak: clampMetric(Number(wData.workout_streak ?? 14), 0, 3650),
            caloriesConsumed: clampMetric(Number(wData.calories_consumed ?? 1760), 0, 20000),
            proteinGrams: clampMetric(Number(wData.protein_grams ?? 132), 0, 1000),
            carbsGrams: clampMetric(Number(wData.carbs_grams ?? 168), 0, 2000),
            fatsGrams: clampMetric(Number(wData.fats_grams ?? 51), 0, 1000),
            waterGlasses: clampMetric(Number(wData.water_glasses ?? 6), 0, 40),
            stepsCount: clampMetric(Number(wData.steps_count ?? 8450), 0, 200000),
            mindfulnessStreak: clampMetric(Number(wData.mindfulness_streak ?? 9), 0, 3650),
            breathworkSessions: clampMetric(Number(wData.breathwork_sessions ?? 3), 0, 1000),
          }));
        } else {
          await supabase.from('wellness_logs').upsert(
            {
              user_id: sbUser.id,
              workout_completed: false,
              completed_exercises_count: 2,
              workout_streak: 14,
              calories_consumed: 1760,
              protein_grams: 132,
              carbs_grams: 168,
              fats_grams: 51,
              water_glasses: 6,
              steps_count: 8450,
              mindfulness_streak: 9,
              breathwork_sessions: 3,
            },
            { onConflict: 'user_id' }
          );
        }
      } catch (err) {
        console.error('Supabase wellness_logs sync error:', err);
      }

      // If admin, load all registered profiles from Supabase
      if (resolvedProfile && resolvedProfile.role === 'admin') {
        try {
          const { data: allProfiles } = await supabase.from('profiles').select('*');
          if (Array.isArray(allProfiles)) {
            const liveProfiles: HBProfile[] = allProfiles.map((item) => ({
              uid: item.id,
              email: item.email,
              fullName: item.full_name || 'HB+ Member',
              avatarUrl: item.avatar_url || '',
              role: item.role === 'admin' ? 'admin' : 'user',
              assignedProgram: item.assigned_program || WORKOUT_PROGRAMS[0],
              domainVerified: Boolean(item.domain_verified ?? true),
              createdAt: item.created_at || new Date().toISOString(),
            }));
            setRegisteredUsers((prev) => {
              const byUid = new Map(prev.map((u) => [u.uid, u]));
              for (const lp of liveProfiles) {
                byUid.set(lp.uid, lp);
              }
              return Array.from(byUid.values());
            });
          }
        } catch (err) {
          console.error('Supabase admin profiles list error:', err);
        }
      }

      if (resolvedProfile) {
        setProfile(resolvedProfile);
        setIsDemoSession(false);
        setActiveTab(resolvedProfile.role === 'admin' ? 'admin' : 'overview');
        clearAuthError();
        navigateTo('/dashboard');
      }
    },
    [clearAuthError, navigateTo]
  );

  // Listen for Supabase (when VITE_SUPABASE_URL is configured) or Firebase auth state changes
  useEffect(() => {
    if (isExternalSupabaseConfigured && supabase) {
      let mounted = true;

      supabase.auth
        .getSession()
        .then(async ({ data: { session } }) => {
          if (!mounted) return;
          if (session?.user) {
            await syncSupabaseUserSession(session.user, allowedDomains);
          } else if (!isDemoSession) {
            setProfile(null);
          }
          if (mounted) setIsLoading(false);
        })
        .catch(() => {
          if (mounted) setIsLoading(false);
        });

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (!mounted) return;
        if (event === 'SIGNED_IN' && session?.user) {
          await syncSupabaseUserSession(session.user, allowedDomains);
          setIsLoading(false);
        } else if (event === 'SIGNED_OUT' && !isDemoSession) {
          setProfile(null);
          setIsLoading(false);
        }
      });

      return () => {
        mounted = false;
        subscription.unsubscribe();
      };
    }

    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        try {
          await syncLiveUserSession(fbUser, allowedDomains);
        } catch (err) {
          console.error('Session sync error:', err);
        }
      } else if (!isDemoSession) {
        setProfile(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [allowedDomains, isDemoSession, syncLiveUserSession, syncSupabaseUserSession]);

  // Protect /dashboard route strictly when unauthenticated -> redirect to /login
  useEffect(() => {
    if (!isLoading && !profile && route === '/dashboard') {
      navigateTo('/login');
    }
  }, [isLoading, navigateTo, profile, route]);

  const signInWithGoogle = useCallback(async () => {
    clearAuthError();
    setIsAuthenticating(true);
    try {
      if (isExternalSupabaseConfigured && supabase) {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: `${window.location.origin}/dashboard`,
          },
        });
        if (error) throw error;
        return;
      }

      const credential = await signInWithPopup(auth, googleProvider);
      await syncLiveUserSession(credential.user, allowedDomains);
    } catch (error: unknown) {
      const code = (error as { code?: string })?.code || '';
      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
        // User closed popup voluntarily; keep clean state
      } else {
        setAuthError(
          'Google sign-in could not be completed. Please try again or use the Demo Sandbox below.'
        );
      }
    } finally {
      setIsAuthenticating(false);
    }
  }, [allowedDomains, clearAuthError, syncLiveUserSession]);

  const logout = useCallback(async () => {
    setIsAuthenticating(true);
    try {
      if (!isDemoSession) {
        await signOut(auth);
        if (supabase) {
          await supabase.auth.signOut();
        }
      }
      setIsDemoSession(false);
      setProfile(null);
      setActiveTab('overview');
      clearAuthError();
      navigateTo('/');
    } finally {
      setIsAuthenticating(false);
    }
  }, [clearAuthError, isDemoSession, navigateTo]);

  // Recruiter / Demo Testing Sandbox Handlers
  const loginDemoMember = useCallback(() => {
    clearAuthError();
    const memberFromRoster =
      registeredUsers.find((u) => u.email === 'member@hbplus.fit') || SEEDED_ROSTER[0];
    setIsDemoSession(true);
    setProfile(memberFromRoster);
    setActiveTab('overview');
    navigateTo('/dashboard');
  }, [clearAuthError, navigateTo, registeredUsers]);

  const simulateBlockedUser = useCallback(async () => {
    clearAuthError();
    setIsAuthenticating(true);
    await new Promise((resolve) => setTimeout(resolve, 380));
    const simulatedEmail = 'user@gmail.com';
    const allowed = isEmailDomainAllowed(simulatedEmail, allowedDomains);

    if (!allowed) {
      if (supabase) {
        await supabase.auth.signOut();
      }
      setIsDemoSession(false);
      setProfile(null);
      setAttemptedBlockedEmail(simulatedEmail);
      setAuthError(RESTRICTED_DOMAIN_MESSAGE);
      navigateTo('/login');
    } else {
      const dynamicGuest: HBProfile = {
        uid: 'demo-whitelisted-gmail',
        email: simulatedEmail,
        fullName: 'Jordan Taylor',
        avatarUrl: '',
        role: 'user',
        assignedProgram: WORKOUT_PROGRAMS[0],
        domainVerified: true,
        createdAt: new Date().toISOString(),
      };
      setIsDemoSession(true);
      setProfile(dynamicGuest);
      setActiveTab('overview');
      navigateTo('/dashboard');
    }
    setIsAuthenticating(false);
  }, [allowedDomains, clearAuthError, navigateTo]);

  const loginDemoAdmin = useCallback(() => {
    clearAuthError();
    const adminFromRoster =
      registeredUsers.find((u) => u.email === 'admin@hbplus.fit') || SEEDED_ROSTER[1];
    setIsDemoSession(true);
    setProfile(adminFromRoster);
    setActiveTab('admin');
    navigateTo('/dashboard');
  }, [clearAuthError, navigateTo, registeredUsers]);

  // Sync helper for Supabase / Firestore workout updates
  const persistWorkoutToFirestore = useCallback(
    async (nextCompleted: boolean, nextCompletedCount: number, nextStreak: number) => {
      if (profile && !isDemoSession) {
        if (isExternalSupabaseConfigured && supabase) {
          await supabase
            .from('wellness_logs')
            .update({
              workout_completed: nextCompleted,
              completed_exercises_count: clampMetric(nextCompletedCount, 0, 20),
              workout_streak: clampMetric(nextStreak, 0, 3650),
              updated_at: new Date().toISOString(),
            })
            .eq('user_id', profile.uid);
          return;
        }

        if (auth.currentUser) {
          const path = `wellnessLogs/${profile.uid}`;
          try {
            await updateDoc(doc(db, 'wellnessLogs', profile.uid), {
              workoutCompleted: nextCompleted,
              completedExercisesCount: clampMetric(nextCompletedCount, 0, 20),
              workoutStreak: clampMetric(nextStreak, 0, 3650),
              updatedAt: serverTimestamp(),
            });
          } catch (error) {
            handleFirestoreError(error, OperationType.UPDATE, path);
          }
        }
      }
    },
    [isDemoSession, profile]
  );

  // Pillar 1: Toggle whole exercise
  const toggleExerciseCompleted = useCallback(
    async (exerciseId: string) => {
      let nextCompleted = false;
      let nextCompletedCount = 0;
      let nextStreak = wellness.workoutStreak;

      setWellness((prev) => {
        const updatedExercises = prev.exercises.map((ex) => {
          if (ex.id !== exerciseId) return ex;
          const targetDone = !ex.completed;
          return {
            ...ex,
            completed: targetDone,
            setsCompleted: Array.from({ length: ex.sets }, () => targetDone),
          };
        });
        nextCompletedCount = updatedExercises.filter((e) => e.completed).length;
        const allDone = nextCompletedCount === updatedExercises.length;
        nextCompleted = allDone;
        if (allDone && !prev.workoutCompleted) {
          nextStreak = prev.workoutStreak + 1;
        } else if (!allDone && prev.workoutCompleted) {
          nextStreak = Math.max(0, prev.workoutStreak - 1);
        }
        return {
          ...prev,
          exercises: updatedExercises,
          workoutCompleted: allDone,
          workoutStreak: nextStreak,
          weeklyAdherence: prev.weeklyAdherence.map((d, idx) =>
            idx === 6 ? { ...d, completed: allDone || d.completed } : d
          ),
        };
      });

      await persistWorkoutToFirestore(nextCompleted, nextCompletedCount, nextStreak);
    },
    [persistWorkoutToFirestore, wellness.workoutStreak]
  );

  // Pillar 1: Toggle individual set checkbox (returns true if newly checked to trigger 60s Rest Timer)
  const toggleSetCompleted = useCallback(
    async (exerciseId: string, setIndex: number): Promise<boolean> => {
      let didBecomeChecked = false;
      let nextCompleted = false;
      let nextCompletedCount = 0;
      let nextStreak = wellness.workoutStreak;

      setWellness((prev) => {
        const updatedExercises = prev.exercises.map((ex) => {
          if (ex.id !== exerciseId) return ex;
          const currentSets =
            ex.setsCompleted.length === ex.sets
              ? [...ex.setsCompleted]
              : Array.from({ length: ex.sets }, () => ex.completed);
          const nextVal = !currentSets[setIndex];
          didBecomeChecked = nextVal;
          currentSets[setIndex] = nextVal;
          const allSetsDone = currentSets.every(Boolean);
          return {
            ...ex,
            setsCompleted: currentSets,
            completed: allSetsDone,
          };
        });

        nextCompletedCount = updatedExercises.filter((e) => e.completed).length;
        const allDone = nextCompletedCount === updatedExercises.length;
        nextCompleted = allDone;
        if (allDone && !prev.workoutCompleted) {
          nextStreak = prev.workoutStreak + 1;
        } else if (!allDone && prev.workoutCompleted) {
          nextStreak = Math.max(0, prev.workoutStreak - 1);
        }

        return {
          ...prev,
          exercises: updatedExercises,
          workoutCompleted: allDone,
          workoutStreak: nextStreak,
          weeklyAdherence: prev.weeklyAdherence.map((d, idx) =>
            idx === 6 ? { ...d, completed: allDone || d.completed } : d
          ),
        };
      });

      await persistWorkoutToFirestore(nextCompleted, nextCompletedCount, nextStreak);
      return didBecomeChecked;
    },
    [persistWorkoutToFirestore, wellness.workoutStreak]
  );

  const updateExerciseLoad = useCallback((exerciseId: string, deltaKg: number) => {
    setWellness((prev) => ({
      ...prev,
      exercises: prev.exercises.map((ex) =>
        ex.id === exerciseId
          ? {
              ...ex,
              loadKg: Math.max(0, Math.min(350, Math.round((ex.loadKg + deltaKg) * 2) / 2)),
            }
          : ex
      ),
    }));
  }, []);

  const toggleWorkoutCompleted = useCallback(async () => {
    const targetCompleted = !wellness.workoutCompleted;
    const nextStreak = targetCompleted
      ? wellness.workoutStreak + 1
      : Math.max(0, wellness.workoutStreak - 1);
    const nextCount = targetCompleted ? wellness.exercises.length : 0;

    setWellness((prev) => ({
      ...prev,
      workoutCompleted: targetCompleted,
      workoutStreak: nextStreak,
      exercises: prev.exercises.map((ex) => ({
        ...ex,
        completed: targetCompleted,
        setsCompleted: Array.from({ length: ex.sets }, () => targetCompleted),
      })),
      weeklyAdherence: prev.weeklyAdherence.map((d, idx) =>
        idx === 6 ? { ...d, completed: targetCompleted } : d
      ),
    }));

    await persistWorkoutToFirestore(targetCompleted, nextCount, nextStreak);
  }, [
    persistWorkoutToFirestore,
    wellness.exercises.length,
    wellness.workoutCompleted,
    wellness.workoutStreak,
  ]);

  // Pillar 2: Smart Nutrition mutations
  const logMeal = useCallback(
    async (meal: MealPreset) => {
      const nextCalories = clampMetric(wellness.caloriesConsumed + meal.calories, 0, 20000);
      const nextProtein = clampMetric(wellness.proteinGrams + meal.protein, 0, 1000);
      const nextCarbs = clampMetric(wellness.carbsGrams + meal.carbs, 0, 2000);
      const nextFats = clampMetric(wellness.fatsGrams + meal.fats, 0, 1000);

      setWellness((prev) => ({
        ...prev,
        caloriesConsumed: nextCalories,
        proteinGrams: nextProtein,
        carbsGrams: nextCarbs,
        fatsGrams: nextFats,
      }));

      if (profile && !isDemoSession) {
        if (isExternalSupabaseConfigured && supabase) {
          await supabase
            .from('wellness_logs')
            .update({
              calories_consumed: nextCalories,
              protein_grams: nextProtein,
              carbs_grams: nextCarbs,
              fats_grams: nextFats,
              water_glasses: wellness.waterGlasses,
              updated_at: new Date().toISOString(),
            })
            .eq('user_id', profile.uid);
          return;
        }

        if (auth.currentUser) {
          const path = `wellnessLogs/${profile.uid}`;
          try {
            await updateDoc(doc(db, 'wellnessLogs', profile.uid), {
              caloriesConsumed: nextCalories,
              proteinGrams: nextProtein,
              carbsGrams: nextCarbs,
              fatsGrams: nextFats,
              waterGlasses: wellness.waterGlasses,
              updatedAt: serverTimestamp(),
            });
          } catch (error) {
            handleFirestoreError(error, OperationType.UPDATE, path);
          }
        }
      }
    },
    [
      isDemoSession,
      profile,
      wellness.caloriesConsumed,
      wellness.carbsGrams,
      wellness.fatsGrams,
      wellness.proteinGrams,
      wellness.waterGlasses,
    ]
  );

  // Pillar 3: Mental Wellness & Mindset mutations
  const completeBreathworkCycle = useCallback(async () => {
    const nextSessions = clampMetric(wellness.breathworkSessions + 1, 0, 1000);
    const nextStreak =
      wellness.breathworkSessions === 0
        ? clampMetric(wellness.mindfulnessStreak + 1, 0, 3650)
        : wellness.mindfulnessStreak;

    setWellness((prev) => ({
      ...prev,
      breathworkSessions: nextSessions,
      mindfulnessStreak: nextStreak,
    }));

    if (profile && !isDemoSession) {
      if (isExternalSupabaseConfigured && supabase) {
        await supabase
          .from('wellness_logs')
          .update({
            mindfulness_streak: nextStreak,
            breathwork_sessions: nextSessions,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', profile.uid);
        return;
      }

      if (auth.currentUser) {
        const path = `wellnessLogs/${profile.uid}`;
        try {
          await updateDoc(doc(db, 'wellnessLogs', profile.uid), {
            mindfulnessStreak: nextStreak,
            breathworkSessions: nextSessions,
            updatedAt: serverTimestamp(),
          });
        } catch (error) {
          handleFirestoreError(error, OperationType.UPDATE, path);
        }
      }
    }
  }, [isDemoSession, profile, wellness.breathworkSessions, wellness.mindfulnessStreak]);

  // Pillar 4: Vitals & Hydration mutations
  const syncWaterToFirestore = useCallback(
    async (nextWater: number) => {
      if (profile && !isDemoSession) {
        if (isExternalSupabaseConfigured && supabase) {
          await supabase
            .from('wellness_logs')
            .update({
              steps_count: wellness.stepsCount,
              water_glasses: nextWater,
              updated_at: new Date().toISOString(),
            })
            .eq('user_id', profile.uid);
          return;
        }

        if (auth.currentUser) {
          const path = `wellnessLogs/${profile.uid}`;
          try {
            await updateDoc(doc(db, 'wellnessLogs', profile.uid), {
              stepsCount: wellness.stepsCount,
              waterGlasses: nextWater,
              updatedAt: serverTimestamp(),
            });
          } catch (error) {
            handleFirestoreError(error, OperationType.UPDATE, path);
          }
        }
      }
    },
    [isDemoSession, profile, wellness.stepsCount]
  );

  const adjustWaterGlasses = useCallback(
    async (delta: number) => {
      const nextWater = clampMetric(wellness.waterGlasses + delta, 0, 24);
      setWellness((prev) => ({
        ...prev,
        waterGlasses: nextWater,
      }));
      await syncWaterToFirestore(nextWater);
    },
    [syncWaterToFirestore, wellness.waterGlasses]
  );

  const setWaterGlassesDirect = useCallback(
    async (targetGlasses: number) => {
      const nextWater = clampMetric(targetGlasses, 0, 24);
      setWellness((prev) => ({
        ...prev,
        waterGlasses: nextWater,
      }));
      await syncWaterToFirestore(nextWater);
    },
    [syncWaterToFirestore]
  );

  const addSteps = useCallback(
    async (deltaSteps: number) => {
      const nextSteps = clampMetric(wellness.stepsCount + deltaSteps, 0, 200000);
      setWellness((prev) => ({
        ...prev,
        stepsCount: nextSteps,
      }));

      if (profile && !isDemoSession) {
        if (isExternalSupabaseConfigured && supabase) {
          await supabase
            .from('wellness_logs')
            .update({
              steps_count: nextSteps,
              water_glasses: wellness.waterGlasses,
              updated_at: new Date().toISOString(),
            })
            .eq('user_id', profile.uid);
          return;
        }

        if (auth.currentUser) {
          const path = `wellnessLogs/${profile.uid}`;
          try {
            await updateDoc(doc(db, 'wellnessLogs', profile.uid), {
              stepsCount: nextSteps,
              waterGlasses: wellness.waterGlasses,
              updatedAt: serverTimestamp(),
            });
          } catch (error) {
            handleFirestoreError(error, OperationType.UPDATE, path);
          }
        }
      }
    },
    [isDemoSession, profile, wellness.stepsCount, wellness.waterGlasses]
  );

  const toggleAdherenceDay = useCallback((dayIndex: number) => {
    setWellness((prev) => ({
      ...prev,
      weeklyAdherence: prev.weeklyAdherence.map((item, idx) =>
        idx === dayIndex
          ? {
              ...item,
              completed: !item.completed,
              pillarsHit: !item.completed ? 4 : 2,
            }
          : item
      ),
    }));
  }, []);

  // Admin & Coach Portal RBAC: Assign workout program & sync client files
  const assignWorkoutProgram = useCallback(
    async (targetUid: string, program: string) => {
      const safeProgram = sanitizeBoundedString(program, 120, WORKOUT_PROGRAMS[0]);

      setRegisteredUsers((prev) =>
        prev.map((u) => (u.uid === targetUid ? { ...u, assignedProgram: safeProgram } : u))
      );

      setAthletes((prev) =>
        prev.map((a) =>
          a.uid === targetUid
            ? { ...a, assignedProgram: safeProgram, lastSynced: 'Just now' }
            : a
        )
      );

      if (profile && profile.uid === targetUid) {
        setProfile((prev) => (prev ? { ...prev, assignedProgram: safeProgram } : null));
      }

      if (
        profile &&
        profile.role === 'admin' &&
        !isDemoSession &&
        !targetUid.startsWith('demo-') &&
        !targetUid.startsWith('hb-')
      ) {
        if (isExternalSupabaseConfigured && supabase) {
          await supabase
            .from('profiles')
            .update({
              assigned_program: safeProgram,
              updated_at: new Date().toISOString(),
            })
            .eq('id', targetUid);
          return;
        }

        if (auth.currentUser) {
          const path = `profiles/${targetUid}`;
          try {
            const targetUser = registeredUsers.find((u) => u.uid === targetUid);
            await updateDoc(doc(db, 'profiles', targetUid), {
              assignedProgram: safeProgram,
              role: targetUser?.role || 'user',
              domainVerified: targetUser?.domainVerified ?? true,
              updatedAt: serverTimestamp(),
            });
          } catch (error) {
            handleFirestoreError(error, OperationType.UPDATE, path);
          }
        }
      }
    },
    [isDemoSession, profile, registeredUsers]
  );

  const updateAthleteExercises = useCallback(
    async (
      athleteUid: string,
      programName: string,
      exercises: ExerciseItem[],
      markDeloadApplied?: boolean
    ) => {
      const safeProgram = sanitizeBoundedString(programName, 120, WORKOUT_PROGRAMS[0]);

      setAthletes((prev) =>
        prev.map((a) =>
          a.uid === athleteUid
            ? {
                ...a,
                assignedProgram: safeProgram,
                exercises,
                lastSynced: 'Just now',
                volumeDeloadApplied: markDeloadApplied ?? a.volumeDeloadApplied,
              }
            : a
        )
      );

      setRegisteredUsers((prev) =>
        prev.map((u) => (u.uid === athleteUid ? { ...u, assignedProgram: safeProgram } : u))
      );

      // Cross-role live sync: if updating Maya Lin (demo member), reflect in Member Dashboard state
      if (athleteUid === 'demo-member-01') {
        setWellness((prev) => ({
          ...prev,
          exercises: exercises.map((ex) => ({
            ...ex,
            setsCompleted:
              ex.setsCompleted.length === ex.sets
                ? [...ex.setsCompleted]
                : Array.from({ length: ex.sets }, () => ex.completed),
          })),
        }));
      }

      await assignWorkoutProgram(athleteUid, safeProgram);
    },
    [assignWorkoutProgram]
  );

  const pushAthleteNutritionProtocol = useCallback(
    (
      athleteUid: string,
      protocol: {
        caloriesTarget: number;
        proteinTarget: number;
        carbsTarget: number;
        fatsTarget: number;
      }
    ) => {
      const sanitized = {
        caloriesTarget: clampMetric(protocol.caloriesTarget, 1200, 5000),
        proteinTarget: clampMetric(protocol.proteinTarget, 50, 350),
        carbsTarget: clampMetric(protocol.carbsTarget, 40, 550),
        fatsTarget: clampMetric(protocol.fatsTarget, 25, 180),
      };

      setAthletes((prev) =>
        prev.map((a) =>
          a.uid === athleteUid
            ? {
                ...a,
                nutritionProtocol: sanitized,
                lastSynced: 'Just now',
              }
            : a
        )
      );

      // Sync live to Maya Lin's Member Dashboard if Coach updates Maya
      if (athleteUid === 'demo-member-01') {
        setWellness((prev) => ({
          ...prev,
          caloriesTarget: sanitized.caloriesTarget,
          proteinTarget: sanitized.proteinTarget,
          carbsTarget: sanitized.carbsTarget,
          fatsTarget: sanitized.fatsTarget,
        }));
      }
    },
    []
  );

  const postCoachFeedbackNote = useCallback(
    (athleteUid: string, content: string) => {
      const trimmed = content.trim();
      if (!trimmed) return;

      const newNote: CoachFeedbackNote = {
        id: `note-${Date.now()}`,
        authorName: profile?.fullName || 'Coach Marcus Vance',
        authorRole: 'HB+ Performance & Longevity Coach',
        timestamp: 'Just now',
        content: trimmed.slice(0, 600),
      };

      setAthletes((prev) =>
        prev.map((a) =>
          a.uid === athleteUid
            ? {
                ...a,
                lastSynced: 'Just now',
                coachNotes: [newNote, ...a.coachNotes],
              }
            : a
        )
      );
    },
    [profile?.fullName]
  );

  const addAllowedDomain = useCallback(
    async (rawDomain: string): Promise<{ ok: boolean; message?: string }> => {
      const cleaned = rawDomain.trim().toLowerCase().replace(/^@/, '');
      if (
        !cleaned ||
        cleaned.length < 3 ||
        cleaned.length > 100 ||
        !/^[a-z0-9.-]+\.[a-z]{2,}$/.test(cleaned)
      ) {
        return { ok: false, message: 'Enter a valid domain format (e.g., corp.hbplus.fit).' };
      }
      if (allowedDomains.includes(cleaned)) {
        return { ok: false, message: `@${cleaned} is already in the active whitelist.` };
      }
      if (allowedDomains.length >= 10) {
        return { ok: false, message: 'Maximum of 10 whitelisted domains supported.' };
      }

      const nextDomains = [...allowedDomains, cleaned];
      setAllowedDomains(nextDomains);

      if (profile && profile.role === 'admin' && !isDemoSession) {
        if (isExternalSupabaseConfigured && supabase) {
          await supabase.from('domain_settings').upsert(
            {
              id: 'global',
              allowed_domains: nextDomains,
              updated_by: profile.uid,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'id' }
          );
          return { ok: true };
        }

        if (auth.currentUser) {
          const path = 'domainSettings/global';
          try {
            const settingRef = doc(db, 'domainSettings', 'global');
            const snap = await getDoc(settingRef);
            if (snap.exists()) {
              await updateDoc(settingRef, {
                updatedByUid: profile.uid,
                allowedDomains: nextDomains,
                updatedAt: serverTimestamp(),
              });
            } else {
              await setDoc(settingRef, {
                updatedByUid: profile.uid,
                allowedDomains: nextDomains,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
              });
            }
          } catch (error) {
            handleFirestoreError(error, OperationType.WRITE, path);
          }
        }
      }

      return { ok: true };
    },
    [allowedDomains, isDemoSession, profile]
  );

  const removeAllowedDomain = useCallback(
    async (domainToRemove: string) => {
      if (domainToRemove === 'hbplus.fit') return;
      const nextDomains = allowedDomains.filter((d) => d !== domainToRemove);
      if (nextDomains.length === 0) return;

      setAllowedDomains(nextDomains);

      if (profile && profile.role === 'admin' && !isDemoSession) {
        if (isExternalSupabaseConfigured && supabase) {
          await supabase
            .from('domain_settings')
            .update({
              allowed_domains: nextDomains,
              updated_by: profile.uid,
              updated_at: new Date().toISOString(),
            })
            .eq('id', 'global');
          return;
        }

        if (auth.currentUser) {
          const path = 'domainSettings/global';
          try {
            await updateDoc(doc(db, 'domainSettings', 'global'), {
              updatedByUid: profile.uid,
              allowedDomains: nextDomains,
              updatedAt: serverTimestamp(),
            });
          } catch (error) {
            handleFirestoreError(error, OperationType.UPDATE, path);
          }
        }
      }
    },
    [allowedDomains, isDemoSession, profile]
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      profile,
      wellness,
      route,
      navigateToRoute: navigateTo,
      activeTab,
      setActiveTab,
      isLoading,
      isAuthenticating,
      authError,
      attemptedBlockedEmail,
      clearAuthError,
      isDemoSession,
      allowedDomains,
      registeredUsers,
      athletes,
      signInWithGoogle,
      logout,
      loginDemoMember,
      simulateBlockedUser,
      loginDemoAdmin,
      toggleExerciseCompleted,
      toggleSetCompleted,
      updateExerciseLoad,
      toggleWorkoutCompleted,
      logMeal,
      completeBreathworkCycle,
      adjustWaterGlasses,
      setWaterGlassesDirect,
      addSteps,
      toggleAdherenceDay,
      assignWorkoutProgram,
      updateAthleteExercises,
      pushAthleteNutritionProtocol,
      postCoachFeedbackNote,
      addAllowedDomain,
      removeAllowedDomain,
    }),
    [
      activeTab,
      addAllowedDomain,
      addSteps,
      adjustWaterGlasses,
      allowedDomains,
      assignWorkoutProgram,
      athletes,
      attemptedBlockedEmail,
      authError,
      clearAuthError,
      completeBreathworkCycle,
      isAuthenticating,
      isDemoSession,
      isLoading,
      logMeal,
      loginDemoAdmin,
      loginDemoMember,
      logout,
      navigateTo,
      postCoachFeedbackNote,
      profile,
      pushAthleteNutritionProtocol,
      registeredUsers,
      removeAllowedDomain,
      route,
      setWaterGlassesDirect,
      signInWithGoogle,
      simulateBlockedUser,
      toggleAdherenceDay,
      toggleExerciseCompleted,
      toggleSetCompleted,
      toggleWorkoutCompleted,
      updateAthleteExercises,
      updateExerciseLoad,
      wellness,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
