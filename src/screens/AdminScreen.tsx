import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  Code2,
  Copy,
  Dumbbell,
  Flame,
  Globe,
  HeartPulse,
  MessageSquarePlus,
  Minus,
  Moon,
  Plus,
  Search,
  ShieldCheck,
  Sliders,
  Trash2,
  TrendingDown,
  Users,
} from 'lucide-react';
import { AthleteClientFile, ExerciseItem, useAuth } from '../context/AuthContext';
import { EXERCISE_ALTERNATIVES, WORKOUT_PROGRAMS } from '../constants/theme';

type DirectoryFilter =
  | 'all'
  | 'needs_attention'
  | 'strength_hypertrophy'
  | 'metabolic_reset';

const SUPABASE_SQL_SNIPPET = `-- Supabase PostgreSQL Schema & RLS Setup for HB+ (hbplus.fit)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text not null,
  avatar_url text default '',
  role text not null default 'user' check (role in ('user', 'admin')),
  assigned_program text not null default 'Strength Hypertrophy',
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can read own profile"
  on public.profiles for select
  to authenticated
  using (auth.uid() = id);

create policy "Admins can read all profiles"
  on public.profiles for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );`;

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase() || 'HB';
}

interface AthleteAvatarProps {
  name: string;
  src: string;
  sizeClass?: string;
}

const AthleteAvatar: React.FC<AthleteAvatarProps> = ({
  name,
  src,
  sizeClass = 'h-11 w-11',
}) => {
  const [failed, setFailed] = useState(false);

  if (src && !failed) {
    return (
      <img
        src={src}
        alt={`${name} portrait`}
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
        className={`${sizeClass} shrink-0 rounded-full border border-[#252B3B] object-cover bg-[#0A0C10]`}
      />
    );
  }

  return (
    <div
      className={`${sizeClass} shrink-0 rounded-full border border-[#252B3B] bg-[#0A0C10] flex items-center justify-center font-display text-xs font-bold text-[#CCFF00]`}
    >
      {getInitials(name)}
    </div>
  );
};

export const AdminScreen: React.FC = () => {
  const {
    athletes,
    allowedDomains,
    updateAthleteExercises,
    pushAthleteNutritionProtocol,
    postCoachFeedbackNote,
    addAllowedDomain,
    removeAllowedDomain,
  } = useAuth();

  const [selectedAthleteUid, setSelectedAthleteUid] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [directoryFilter, setDirectoryFilter] = useState<DirectoryFilter>('all');

  const [governanceExpanded, setGovernanceExpanded] = useState(false);
  const [domainInput, setDomainInput] = useState('');
  const [domainFeedback, setDomainFeedback] = useState<{
    type: 'error' | 'success';
    text: string;
  } | null>(null);
  const [showSqlDrawer, setShowSqlDrawer] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  const selectedAthlete: AthleteClientFile | null = useMemo(
    () => athletes.find((a) => a.uid === selectedAthleteUid) || null,
    [athletes, selectedAthleteUid]
  );

  const [isEditingSplit, setIsEditingSplit] = useState(false);
  const [draftProgram, setDraftProgram] = useState<string>(WORKOUT_PROGRAMS[0]);
  const [draftExercises, setDraftExercises] = useState<ExerciseItem[]>([]);

  const [draftCalories, setDraftCalories] = useState<number>(2350);
  const [draftProtein, setDraftProtein] = useState<number>(160);
  const [draftCarbs, setDraftCarbs] = useState<number>(210);
  const [draftFats, setDraftFats] = useState<number>(65);

  const [coachNoteDraft, setCoachNoteDraft] = useState<string>('');
  const [portalToast, setPortalToast] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedAthlete) return;
    setDraftProgram(selectedAthlete.assignedProgram);
    setDraftExercises(
      selectedAthlete.exercises.map((ex) => ({
        ...ex,
        setsCompleted: [...ex.setsCompleted],
      }))
    );
    setDraftCalories(selectedAthlete.nutritionProtocol.caloriesTarget);
    setDraftProtein(selectedAthlete.nutritionProtocol.proteinTarget);
    setDraftCarbs(selectedAthlete.nutritionProtocol.carbsTarget);
    setDraftFats(selectedAthlete.nutritionProtocol.fatsTarget);
    setIsEditingSplit(false);
    setCoachNoteDraft('');
  }, [selectedAthlete?.uid]);

  const showToast = (msg: string) => {
    setPortalToast(msg);
    window.setTimeout(() => {
      setPortalToast((prev) => (prev === msg ? null : prev));
    }, 3200);
  };

  const flaggedAthletesCount = useMemo(
    () => athletes.filter((a) => a.recoveryScore < 60).length,
    [athletes]
  );

  const filteredAthletes = useMemo(() => {
    return athletes.filter((athlete) => {
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        athlete.fullName.toLowerCase().includes(q) ||
        athlete.email.toLowerCase().includes(q) ||
        athlete.assignedProgram.toLowerCase().includes(q);

      if (!matchesSearch) return false;

      if (directoryFilter === 'needs_attention') {
        return athlete.recoveryScore < 60;
      }
      if (directoryFilter === 'strength_hypertrophy') {
        return athlete.assignedProgram.toLowerCase().includes('hypertrophy');
      }
      if (directoryFilter === 'metabolic_reset') {
        return athlete.assignedProgram.toLowerCase().includes('metabolic');
      }
      return true;
    });
  }, [athletes, directoryFilter, searchQuery]);

  const handleAutoDeload10Percent = async () => {
    if (!selectedAthlete) return;
    const reducedExercises = draftExercises.map((ex) => ({
      ...ex,
      loadKg: Math.max(2.5, Math.round(ex.loadKg * 0.9 * 2) / 2),
    }));
    setDraftExercises(reducedExercises);
    await updateAthleteExercises(
      selectedAthlete.uid,
      draftProgram,
      reducedExercises,
      true
    );
    showToast(
      `Applied -10% working volume deload to ${selectedAthlete.fullName.split(' ')[0]}'s split`
    );
  };

  const handleSaveSplitProtocol = async () => {
    if (!selectedAthlete) return;
    await updateAthleteExercises(selectedAthlete.uid, draftProgram, draftExercises);
    setIsEditingSplit(false);
    showToast(
      `Updated ${draftProgram} split and target loads for ${selectedAthlete.fullName}`
    );
  };

  const handleAddDraftExercise = () => {
    const unusedMovement =
      EXERCISE_ALTERNATIVES.find((name) => !draftExercises.some((d) => d.name === name)) ||
      EXERCISE_ALTERNATIVES[0];
    const newItem: ExerciseItem = {
      id: `ex-custom-${Date.now()}`,
      name: unusedMovement,
      sets: 3,
      repsCount: 12,
      reps: '12 reps',
      loadKg: 20,
      completed: false,
      setsCompleted: [false, false, false],
    };
    setDraftExercises((prev) => [...prev, newItem]);
  };

  const handleRemoveDraftExercise = (id: string) => {
    if (draftExercises.length <= 1) return;
    setDraftExercises((prev) => prev.filter((item) => item.id !== id));
  };

  const handlePushNutrition = () => {
    if (!selectedAthlete) return;
    pushAthleteNutritionProtocol(selectedAthlete.uid, {
      caloriesTarget: draftCalories,
      proteinTarget: draftProtein,
      carbsTarget: draftCarbs,
      fatsTarget: draftFats,
    });
    showToast("New nutrition protocol synced to member's dashboard");
  };

  const handlePostNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAthlete || !coachNoteDraft.trim()) return;
    postCoachFeedbackNote(selectedAthlete.uid, coachNoteDraft);
    setCoachNoteDraft('');
    showToast(`Coach feedback posted to ${selectedAthlete.fullName}'s file`);
  };

  const handleDomainSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDomainFeedback(null);
    const res = await addAllowedDomain(domainInput);
    if (!res.ok) {
      setDomainFeedback({ type: 'error', text: res.message || 'Invalid domain.' });
    } else {
      const clean = domainInput.trim().toLowerCase().replace(/^@/, '');
      setDomainFeedback({
        type: 'success',
        text: `Authorized @${clean} for HB+ Google OAuth access.`,
      });
      setDomainInput('');
    }
  };

  const handleCopySql = async () => {
    try {
      await navigator.clipboard.writeText(SUPABASE_SQL_SNIPPET);
      setCopiedSql(true);
      window.setTimeout(() => setCopiedSql(false), 2000);
    } catch {
      // Clipboard API fallback
    }
  };

  return (
    <div className="relative space-y-5 sm:space-y-6 min-w-0">
      {/* Global Portal Confirmation Toast */}
      <AnimatePresence>
        {portalToast && (
          <motion.div
            role="status"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.18 }}
            className="fixed bottom-20 md:bottom-6 left-4 right-4 sm:left-auto sm:right-6 z-40 flex items-center gap-2.5 rounded-xl border border-[#CCFF00]/50 bg-[#161922] px-4 py-3 text-xs sm:text-sm font-semibold text-white shadow-xl"
          >
            <Check className="h-4 w-4 text-[#CCFF00] shrink-0" aria-hidden="true" />
            <span className="break-words">{portalToast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {!selectedAthlete ? (
          /* =====================================================================
           * VIEW 1: COACH COMMAND CENTER (ALL ATHLETES OVERVIEW)
           * ===================================================================== */
          <motion.div
            key="coach-command-center"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="space-y-5 sm:space-y-6"
          >
            {/* 1. Coach Triage KPI Strip: 2x2 Grid on Mobile & Tablet, 4 Horizontal Cards on Desktop */}
            <section
              aria-label="Coach Triage Key Performance Indicators"
              className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4"
            >
              {/* Assigned Athletes */}
              <div className="rounded-2xl border border-[#252B3B] bg-[#161922] p-3.5 sm:p-5 min-w-0">
                <div className="flex items-center justify-between gap-1 text-[11px] sm:text-xs text-[#94A3B8]">
                  <span className="font-medium truncate">Athletes</span>
                  <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#00E5FF] shrink-0" aria-hidden="true" />
                </div>
                <div className="mt-2 font-mono text-lg sm:text-2xl font-bold text-white tabular-nums leading-tight">
                  28{' '}
                  <span className="font-sans text-xs sm:text-sm font-semibold text-[#94A3B8]">
                    Active
                  </span>
                </div>
                <p className="mt-1 text-[11px] sm:text-xs text-[#94A3B8] truncate">
                  Verified @hbplus.fit
                </p>
              </div>

              {/* Team Readiness */}
              <div className="rounded-2xl border border-[#252B3B] bg-[#161922] p-3.5 sm:p-5 min-w-0">
                <div className="flex items-center justify-between gap-1 text-[11px] sm:text-xs text-[#94A3B8]">
                  <span className="font-medium truncate">Readiness</span>
                  <HeartPulse className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#CCFF00] shrink-0" aria-hidden="true" />
                </div>
                <div className="mt-2 font-mono text-lg sm:text-2xl font-bold text-white tabular-nums leading-tight">
                  86%{' '}
                  <span className="font-sans text-xs sm:text-sm font-semibold text-[#CCFF00]">
                    Avg
                  </span>
                </div>
                <p className="mt-1 font-mono text-[10px] sm:text-xs text-[#94A3B8] tabular-nums truncate">
                  HRV 69ms · +3.4%
                </p>
              </div>

              {/* Flagged Attention (<60% Recovery) */}
              <button
                type="button"
                onClick={() =>
                  setDirectoryFilter((prev) =>
                    prev === 'needs_attention' ? 'all' : 'needs_attention'
                  )
                }
                className="rounded-2xl border border-[#FF5757]/40 bg-[#161922] p-3.5 sm:p-5 text-left transition-colors hover:border-[#FF5757] cursor-pointer min-w-0"
              >
                <div className="flex items-center justify-between gap-1 text-[11px] sm:text-xs text-[#F59E0B]">
                  <span className="font-semibold truncate">Flagged</span>
                  <AlertTriangle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#FF5757] shrink-0" aria-hidden="true" />
                </div>
                <div className="mt-2 font-mono text-lg sm:text-2xl font-bold text-[#FF5757] tabular-nums leading-tight">
                  {flaggedAthletesCount}{' '}
                  <span className="font-sans text-xs font-semibold text-[#F59E0B]">
                    (&lt;60%)
                  </span>
                </div>
                <p className="mt-1 text-[10px] sm:text-xs text-[#94A3B8] truncate">
                  {directoryFilter === 'needs_attention' ? 'Showing flagged' : 'Tap to filter'}
                </p>
              </button>

              {/* Weekly Check-in Completion */}
              <div className="rounded-2xl border border-[#252B3B] bg-[#161922] p-3.5 sm:p-5 min-w-0">
                <div className="flex items-center justify-between gap-1 text-[11px] sm:text-xs text-[#94A3B8]">
                  <span className="font-medium truncate">Check-ins</span>
                  <Activity className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#CCFF00] shrink-0" aria-hidden="true" />
                </div>
                <div className="mt-2 font-mono text-lg sm:text-2xl font-bold text-white tabular-nums leading-tight">
                  94%{' '}
                  <span className="font-sans text-xs sm:text-sm font-semibold text-[#CCFF00]">
                    On Track
                  </span>
                </div>
                <p className="mt-1 font-mono text-[10px] sm:text-xs text-[#94A3B8] tabular-nums truncate">
                  26 / 28 synced
                </p>
              </div>
            </section>

            {/* 2. Interactive Athlete Directory */}
            <section
              aria-labelledby="athlete-directory-heading"
              className="rounded-2xl border border-[#252B3B] bg-[#161922] p-4 sm:p-6 min-w-0"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="min-w-0">
                  <h2
                    id="athlete-directory-heading"
                    className="font-display text-xl font-bold text-white"
                  >
                    Athlete Telemetry Directory
                  </h2>
                  <p className="mt-0.5 text-xs text-[#94A3B8]">
                    Inspect real-time recovery readiness, modify hypertrophy splits, and push
                    precision nutrition updates.
                  </p>
                </div>

                {/* Search Input */}
                <div className="relative w-full lg:w-72">
                  <Search
                    className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#64748B]"
                    aria-hidden="true"
                  />
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search athlete or @hbplus.fit..."
                    aria-label="Search athletes by name or email"
                    className="min-h-[44px] w-full rounded-xl border border-[#252B3B] bg-[#0A0C10] pl-10 pr-3.5 py-2 text-xs text-white placeholder-[#64748B] focus:border-[#CCFF00] focus:outline-none"
                  />
                </div>
              </div>

              {/* Horizontal Swipeable Filter Controls on Mobile, Clean Bar on Desktop */}
              <div className="mt-4 -mx-1 px-1 overflow-x-auto no-scrollbar">
                <div className="inline-flex items-center gap-1.5 rounded-xl bg-[#0A0C10] p-1.5 border border-[#252B3B] min-w-max">
                  {(
                    [
                      { key: 'all', label: 'All Athletes' },
                      {
                        key: 'needs_attention',
                        label: `Needs Attention (${flaggedAthletesCount})`,
                      },
                      { key: 'strength_hypertrophy', label: 'Strength Hypertrophy' },
                      { key: 'metabolic_reset', label: 'Metabolic Reset' },
                    ] as const
                  ).map((tab) => {
                    const isActive = directoryFilter === tab.key;
                    return (
                      <button
                        key={tab.key}
                        type="button"
                        onClick={() => setDirectoryFilter(tab.key)}
                        className={`min-h-[40px] rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                          isActive
                            ? tab.key === 'needs_attention'
                              ? 'bg-[#FF5757]/20 text-[#FF5757]'
                              : 'bg-[#161922] text-[#CCFF00]'
                            : 'text-[#94A3B8] hover:text-white'
                        }`}
                      >
                        {tab.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Athlete Directory Cards (Mobile Card Layout w/ Top Recovery Status + Full-Width CTA; Desktop Row Layout) */}
              <div className="mt-5">
                {filteredAthletes.length === 0 ? (
                  <div className="rounded-xl bg-[#0A0C10] py-10 px-4 text-center">
                    <p className="text-sm font-semibold text-white">
                      No athletes match your active filter.
                    </p>
                    <p className="mt-1 text-xs text-[#94A3B8]">
                      Clear search terms or switch back to All Athletes to inspect the full roster.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        setDirectoryFilter('all');
                      }}
                      className="mt-4 min-h-[44px] rounded-xl bg-[#CCFF00] px-4 py-2 text-xs font-bold text-[#0A0C10] cursor-pointer"
                    >
                      Reset Directory Filters
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3 md:space-y-0 md:divide-y md:divide-[#252B3B]">
                    {filteredAthletes.map((athlete) => {
                      const isLowRecovery = athlete.recoveryScore < 60;
                      const recoveryStatusLabel = isLowRecovery
                        ? 'Flagged'
                        : athlete.recoveryScore >= 85
                        ? 'Optimal'
                        : 'Moderate';

                      return (
                        <div
                          key={athlete.uid}
                          className="rounded-2xl md:rounded-xl border border-[#252B3B] md:border-0 bg-[#0A0C10]/60 md:bg-transparent p-4 md:px-2 md:py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors md:hover:bg-[#0A0C10]/35 min-w-0"
                        >
                          {/* Top Row on Mobile: Avatar + Name + Recovery Status */}
                          <div className="flex items-start justify-between gap-3 md:w-[36%] min-w-0">
                            <div className="flex items-center gap-3 min-w-0">
                              <AthleteAvatar name={athlete.fullName} src={athlete.avatarUrl} />
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                                  <span className="font-display text-base font-bold text-white truncate">
                                    {athlete.fullName}
                                  </span>
                                  {athlete.uid === 'demo-member-01' && (
                                    <span className="text-[11px] font-medium text-[#00E5FF] whitespace-nowrap">
                                      · Live Sync
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-1.5 text-xs text-[#94A3B8] min-w-0">
                                  <ShieldCheck
                                    className="h-3.5 w-3.5 text-[#00E5FF] shrink-0"
                                    aria-hidden="true"
                                  />
                                  <span className="font-mono truncate">{athlete.email}</span>
                                </div>
                              </div>
                            </div>

                            {/* Mobile Top-Right Recovery Readout */}
                            <div className="md:hidden text-right shrink-0">
                              <span
                                className={`block font-mono text-sm font-bold tabular-nums ${
                                  isLowRecovery ? 'text-[#FF5757]' : 'text-[#CCFF00]'
                                }`}
                              >
                                {athlete.recoveryScore}%
                              </span>
                              <span
                                className={`block text-[10px] font-semibold ${
                                  isLowRecovery ? 'text-[#F59E0B]' : 'text-[#94A3B8]'
                                }`}
                              >
                                {recoveryStatusLabel}
                              </span>
                            </div>
                          </div>

                          {/* Middle Metadata: Program, Desktop Recovery & Adherence Streak */}
                          <div className="flex flex-wrap items-center justify-between md:justify-start gap-x-6 gap-y-2 md:flex-1 text-xs border-t border-[#252B3B] pt-3 md:border-t-0 md:pt-0">
                            <div className="min-w-[140px]">
                              <span className="block text-[11px] text-[#64748B]">
                                Current Program
                              </span>
                              <span className="font-semibold text-white">
                                {athlete.assignedProgram}
                              </span>
                            </div>

                            <div className="hidden md:block min-w-[145px]">
                              <span className="block text-[11px] text-[#64748B]">
                                Recovery &amp; Status
                              </span>
                              <div className="flex items-center gap-1.5 font-mono tabular-nums">
                                <span
                                  className={`font-bold ${
                                    isLowRecovery ? 'text-[#FF5757]' : 'text-[#CCFF00]'
                                  }`}
                                >
                                  {athlete.recoveryScore}%
                                </span>
                                <span className="text-[#64748B]" aria-hidden="true">
                                  ·
                                </span>
                                <span
                                  className={
                                    isLowRecovery ? 'text-[#F59E0B]' : 'text-[#94A3B8]'
                                  }
                                >
                                  {recoveryStatusLabel}
                                </span>
                              </div>
                            </div>

                            <div>
                              <span className="block text-[11px] text-[#64748B]">Adherence</span>
                              <div className="flex items-center gap-1 font-mono font-semibold text-white tabular-nums">
                                <Flame className="h-3.5 w-3.5 text-[#CCFF00]" aria-hidden="true" />
                                <span>{athlete.adherenceStreak}d streak</span>
                              </div>
                            </div>
                          </div>

                          {/* Bottom Full-Width Button on Mobile, Compact CTA on Tablet/Desktop */}
                          <div className="shrink-0 w-full md:w-auto">
                            <button
                              type="button"
                              onClick={() => setSelectedAthleteUid(athlete.uid)}
                              className="w-full md:w-auto min-h-[44px] inline-flex items-center justify-center gap-2 rounded-xl border border-[#252B3B] bg-[#161922] md:bg-[#0A0C10] px-4 py-2.5 text-xs font-bold text-white transition-colors hover:border-[#CCFF00] hover:bg-[#CCFF00] hover:text-[#0A0C10] cursor-pointer whitespace-nowrap"
                            >
                              <span>Open Athlete File</span>
                              <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </section>

            {/* 3. Enterprise Domain Whitelist & Supabase RLS Governance */}
            <section
              aria-labelledby="domain-governance-heading"
              className="rounded-2xl border border-[#252B3B] bg-[#161922] p-4 sm:p-6 min-w-0"
            >
              <button
                type="button"
                onClick={() => setGovernanceExpanded((prev) => !prev)}
                aria-expanded={governanceExpanded}
                className="flex w-full min-h-[44px] items-center justify-between gap-3 text-left cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0A0C10] text-[#CCFF00]">
                    <Globe className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <h2
                      id="domain-governance-heading"
                      className="font-display text-base sm:text-lg font-bold text-white break-words"
                    >
                      Enterprise Domain Whitelist &amp; Database Governance
                    </h2>
                    <p className="text-xs text-[#94A3B8] truncate">
                      {allowedDomains.length} authorized domain
                      {allowedDomains.length === 1 ? '' : 's'} (@{allowedDomains.join(', @')})
                    </p>
                  </div>
                </div>
                <ChevronDown
                  className={`h-5 w-5 text-[#94A3B8] transition-transform duration-200 shrink-0 ${
                    governanceExpanded ? 'rotate-180 text-[#CCFF00]' : ''
                  }`}
                  aria-hidden="true"
                />
              </button>

              {governanceExpanded && (
                <div className="mt-5 pt-5 border-t border-[#252B3B] grid grid-cols-1 md:grid-cols-12 gap-6">
                  <div className="md:col-span-7 min-w-0">
                    <p className="text-xs text-[#94A3B8]">
                      Only Google OAuth accounts matching an authorized domain below can establish an
                      authenticated HB+ session.
                    </p>

                    <form
                      onSubmit={handleDomainSubmit}
                      className="mt-3 flex flex-col sm:flex-row gap-2.5"
                    >
                      <input
                        type="text"
                        maxLength={100}
                        value={domainInput}
                        onChange={(e) => setDomainInput(e.target.value)}
                        placeholder="Add partner domain (e.g., coach.hbplus.fit)"
                        aria-label="Allowed email domain"
                        className="min-h-[44px] flex-1 rounded-xl border border-[#252B3B] bg-[#0A0C10] px-4 py-2.5 text-sm text-white placeholder-[#64748B] focus:border-[#CCFF00] focus:outline-none"
                      />
                      <button
                        type="submit"
                        className="min-h-[44px] inline-flex items-center justify-center gap-2 rounded-xl bg-[#CCFF00] px-4 py-2.5 text-xs font-bold text-[#0A0C10] transition-colors hover:bg-[#d8ff33] cursor-pointer whitespace-nowrap shrink-0"
                      >
                        <Plus className="h-4 w-4 stroke-[2.5]" aria-hidden="true" />
                        <span>Authorize Domain</span>
                      </button>
                    </form>

                    {domainFeedback && (
                      <p
                        className={`mt-2 text-xs font-medium break-words ${
                          domainFeedback.type === 'error' ? 'text-[#FF5757]' : 'text-[#CCFF00]'
                        }`}
                      >
                        {domainFeedback.text}
                      </p>
                    )}

                    <div className="mt-4 divide-y divide-[#252B3B] rounded-xl bg-[#0A0C10] px-4">
                      {allowedDomains.map((domain) => {
                        const isPrimaryRoot = domain === 'hbplus.fit';
                        return (
                          <div
                            key={domain}
                            className="flex items-center justify-between gap-3 py-3 text-sm"
                          >
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 min-w-0">
                              <ShieldCheck
                                className="h-4 w-4 text-[#CCFF00] shrink-0"
                                aria-hidden="true"
                              />
                              <span className="font-mono font-semibold text-white truncate">
                                @{domain}
                              </span>
                              <span className="text-xs text-[#64748B]" aria-hidden="true">
                                ·
                              </span>
                              <span className="text-xs text-[#94A3B8]">
                                {isPrimaryRoot ? 'Primary Corporate Root' : 'Partner Domain'}
                              </span>
                            </div>

                            {!isPrimaryRoot ? (
                              <button
                                type="button"
                                onClick={() => removeAllowedDomain(domain)}
                                aria-label={`Remove ${domain} from whitelist`}
                                className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-lg text-[#94A3B8] hover:bg-[#FF5757]/15 hover:text-[#FF5757] transition-colors cursor-pointer shrink-0"
                              >
                                <Trash2 className="h-4 w-4" aria-hidden="true" />
                              </button>
                            ) : (
                              <span className="font-mono text-[11px] text-[#64748B] whitespace-nowrap shrink-0">
                                Protected
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="md:col-span-5 flex flex-col justify-between rounded-xl bg-[#0A0C10] p-4 min-w-0">
                    <div>
                      <h3 className="font-display text-sm font-bold text-white">
                        Cross-Platform PostgreSQL + RLS Schema
                      </h3>
                      <p className="mt-1 text-xs text-[#94A3B8] leading-relaxed">
                        Exportable Supabase SQL schema with strict Row Level Security policies for
                        React Native &amp; Expo mobile deployments.
                      </p>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => setShowSqlDrawer((prev) => !prev)}
                        className="min-h-[44px] inline-flex items-center gap-2 rounded-xl border border-[#252B3B] bg-[#161922] px-3.5 py-2 text-xs font-semibold text-white hover:border-[#00E5FF] hover:text-[#00E5FF] cursor-pointer whitespace-nowrap"
                      >
                        <Code2 className="h-4 w-4" aria-hidden="true" />
                        <span>{showSqlDrawer ? 'Hide SQL' : 'Inspect SQL Schema'}</span>
                      </button>

                      {showSqlDrawer && (
                        <button
                          type="button"
                          onClick={handleCopySql}
                          className="min-h-[44px] inline-flex items-center gap-1.5 rounded-xl border border-[#252B3B] bg-[#161922] px-3 py-2 text-xs font-semibold text-white hover:border-[#CCFF00] cursor-pointer whitespace-nowrap"
                        >
                          {copiedSql ? (
                            <>
                              <Check className="h-3.5 w-3.5 text-[#CCFF00]" />
                              <span className="text-[#CCFF00]">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="h-3.5 w-3.5 text-[#94A3B8]" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>

                    {showSqlDrawer && (
                      <pre className="mt-3 max-h-56 overflow-auto rounded-lg bg-[#161922] p-3 font-mono text-[11px] text-[#94A3B8] leading-relaxed">
                        <code>{SUPABASE_SQL_SNIPPET}</code>
                      </pre>
                    )}
                  </div>
                </div>
              )}
            </section>
          </motion.div>
        ) : (
          /* =====================================================================
           * VIEW 2: ATHLETE DEEP-DIVE FILE (SELECTED CLIENT 360° MANAGEMENT VIEW)
           * ===================================================================== */
          <motion.div
            key={`athlete-file-${selectedAthlete.uid}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="space-y-5 sm:space-y-6"
          >
            {/* 1. Header Navigation & Selected Athlete Summary Card */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setSelectedAthleteUid(null)}
                className="min-h-[44px] inline-flex items-center gap-2 rounded-xl border border-[#252B3B] bg-[#161922] px-4 py-2 text-xs font-bold text-white transition-colors hover:border-[#CCFF00] hover:text-[#CCFF00] cursor-pointer whitespace-nowrap"
              >
                <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>Back to All Athletes</span>
              </button>

              <span className="font-mono text-xs text-[#94A3B8] tabular-nums">
                Last Synced: <span className="text-white">{selectedAthlete.lastSynced}</span>
              </span>
            </div>

            <section
              aria-label="Selected Athlete Overview"
              className="rounded-2xl border border-[#252B3B] bg-[#161922] p-4 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-5 min-w-0"
            >
              <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
                <AthleteAvatar
                  name={selectedAthlete.fullName}
                  src={selectedAthlete.avatarUrl}
                  sizeClass="h-14 w-14 sm:h-16 sm:w-16"
                />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-[#94A3B8]">
                    <span className="inline-flex items-center gap-1 text-[#00E5FF] font-medium truncate">
                      <ShieldCheck className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      <span className="truncate">{selectedAthlete.email}</span>
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{selectedAthlete.adherenceStreak}d streak</span>
                  </div>
                  <h2 className="mt-1 font-display text-xl sm:text-2xl font-bold text-white truncate">
                    {selectedAthlete.fullName}
                  </h2>
                  <p className="mt-0.5 text-xs text-[#94A3B8]">
                    Assigned Split:{' '}
                    <span className="font-semibold text-[#CCFF00]">
                      {selectedAthlete.assignedProgram}
                    </span>
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2.5 sm:gap-6 pt-4 lg:pt-0 border-t lg:border-t-0 border-[#252B3B]">
                <div className="min-w-0">
                  <span className="block text-[11px] text-[#94A3B8]">Recovery</span>
                  <span
                    className={`font-mono text-lg sm:text-xl font-bold tabular-nums ${
                      selectedAthlete.recoveryScore < 60 ? 'text-[#FF5757]' : 'text-[#CCFF00]'
                    }`}
                  >
                    {selectedAthlete.recoveryScore}%
                  </span>
                </div>
                <div className="min-w-0">
                  <span className="block text-[11px] text-[#94A3B8]">HRV / RHR</span>
                  <span className="font-mono text-base sm:text-xl font-bold text-white tabular-nums">
                    {selectedAthlete.hrvMs}
                    <span className="text-[10px] sm:text-xs font-normal text-[#94A3B8]">ms</span> ·{' '}
                    {selectedAthlete.rhrBpm}
                  </span>
                </div>
                <div className="min-w-0">
                  <span className="block text-[11px] text-[#94A3B8] truncate">
                    Sleep ({selectedAthlete.sleepEfficiency}%)
                  </span>
                  <span className="font-mono text-lg sm:text-xl font-bold text-[#00E5FF] tabular-nums">
                    {selectedAthlete.sleepDuration}
                  </span>
                </div>
              </div>
            </section>

            {/* 2. Client Telemetry Inspection + Contextual Coach Alert */}
            <section
              aria-labelledby="client-telemetry-heading"
              className="rounded-2xl border border-[#252B3B] bg-[#161922] p-4 sm:p-6 space-y-5 min-w-0"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <p className="text-xs font-medium text-[#94A3B8]">
                    Client Biometric Telemetry &amp; Weekly Compliance
                  </p>
                  <h3
                    id="client-telemetry-heading"
                    className="mt-0.5 font-display text-lg font-bold text-white"
                  >
                    7-Day Workout &amp; Recovery Compliance
                  </h3>
                </div>
                <div className="flex items-center gap-2 font-mono text-xs text-[#94A3B8] tabular-nums">
                  <Moon className="h-4 w-4 text-[#00E5FF]" aria-hidden="true" />
                  <span>
                    Avg Compliance:{' '}
                    <span className="font-bold text-white">
                      {Math.round(
                        selectedAthlete.weeklyCompliance.reduce((s, d) => s + d.pct, 0) /
                          selectedAthlete.weeklyCompliance.length
                      )}
                      %
                    </span>
                  </span>
                </div>
              </div>

              {/* 7-Day Compliance Bar Chart (Scales cleanly down to 360px) */}
              <div className="grid grid-cols-7 gap-1.5 sm:gap-4 rounded-xl bg-[#0A0C10] p-3 sm:p-5">
                {selectedAthlete.weeklyCompliance.map((item) => {
                  const isDip = item.pct < 70;
                  return (
                    <div key={item.day} className="flex flex-col items-center min-w-0">
                      <span
                        className={`font-mono text-[10px] sm:text-[11px] font-semibold tabular-nums ${
                          isDip ? 'text-[#FF5757]' : 'text-white'
                        }`}
                      >
                        {item.pct}%
                      </span>
                      <div className="mt-2 flex h-20 sm:h-24 w-full max-w-[34px] items-end overflow-hidden rounded-lg bg-[#161922] p-0.5 sm:p-1">
                        <div
                          className={`w-full rounded-md transition-all duration-300 ${
                            isDip ? 'bg-[#FF5757]' : 'bg-[#CCFF00]'
                          }`}
                          style={{ height: `${Math.max(12, item.pct)}%` }}
                        />
                      </div>
                      <span className="mt-1.5 text-[10px] sm:text-xs font-medium text-[#94A3B8]">
                        {item.day.slice(0, 3)}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Contextual Coach Alert / Readiness Banner */}
              {selectedAthlete.coachAlert ? (
                <div className="rounded-xl border border-[#F59E0B]/40 bg-[#0A0C10] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <AlertTriangle
                      className="h-5 w-5 text-[#F59E0B] shrink-0 mt-0.5"
                      aria-hidden="true"
                    />
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-[#F59E0B]">
                        Autonomic Coach Advisory
                      </span>
                      <p className="mt-0.5 text-xs sm:text-sm text-[#E2E8F0] leading-relaxed break-words">
                        {selectedAthlete.coachAlert}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleAutoDeload10Percent}
                    disabled={Boolean(selectedAthlete.volumeDeloadApplied)}
                    className="w-full sm:w-auto min-h-[44px] inline-flex items-center justify-center gap-2 rounded-xl border border-[#F59E0B]/50 bg-[#F59E0B]/15 px-4 py-2 text-xs font-bold text-[#F59E0B] transition-colors hover:bg-[#F59E0B]/25 disabled:opacity-50 cursor-pointer whitespace-nowrap shrink-0"
                  >
                    <TrendingDown className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>
                      {selectedAthlete.volumeDeloadApplied
                        ? '10% Deload Active'
                        : 'Auto-Reduce Volume (-10%)'}
                    </span>
                  </button>
                </div>
              ) : (
                <div className="rounded-xl border border-[#CCFF00]/30 bg-[#0A0C10] p-4 flex items-center gap-3">
                  <ShieldCheck className="h-5 w-5 text-[#CCFF00] shrink-0" aria-hidden="true" />
                  <p className="text-xs sm:text-sm text-[#E2E8F0]">
                    Autonomic biomarkers are in peak range ({selectedAthlete.recoveryScore}%
                    recovery, {selectedAthlete.hrvMs}ms HRV). Cleared for progressive overload.
                  </p>
                </div>
              )}
            </section>

            {/* 3 & 4: Stacked Vertically on Mobile (<768px), Side-by-Side on Tablet & Desktop (md:grid-cols-12) */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 lg:gap-6 items-start">
              {/* 3. Interactive Program & Split Editor (7 cols on Tablet/Desktop) */}
              <section
                aria-labelledby="split-editor-heading"
                className="rounded-2xl border border-[#252B3B] bg-[#161922] p-4 sm:p-6 md:col-span-7 min-w-0"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-[#94A3B8]">
                      Training Split &amp; Progressive Overload
                    </p>
                    <h3
                      id="split-editor-heading"
                      className="mt-0.5 font-display text-lg font-bold text-white"
                    >
                      Interactive Program &amp; Split Editor
                    </h3>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsEditingSplit((prev) => !prev)}
                    className={`w-full sm:w-auto min-h-[44px] inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                      isEditingSplit
                        ? 'border border-[#00E5FF]/50 bg-[#00E5FF]/15 text-[#00E5FF]'
                        : 'border border-[#252B3B] bg-[#0A0C10] text-white hover:border-[#CCFF00] hover:text-[#CCFF00]'
                    }`}
                  >
                    <Dumbbell className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>{isEditingSplit ? 'Editing Split...' : 'Modify Split / Adjust Load'}</span>
                  </button>
                </div>

                {/* Program Selector */}
                <div className="mt-4">
                  <label className="block text-xs font-medium text-[#94A3B8]">
                    Assigned Mesocycle Split
                  </label>
                  <select
                    value={draftProgram}
                    disabled={!isEditingSplit}
                    onChange={(e) => setDraftProgram(e.target.value)}
                    className="mt-1.5 min-h-[44px] w-full rounded-xl border border-[#252B3B] bg-[#0A0C10] px-3.5 py-2 text-sm font-semibold text-white disabled:opacity-75 focus:border-[#CCFF00] focus:outline-none cursor-pointer"
                  >
                    {WORKOUT_PROGRAMS.map((prog) => (
                      <option key={prog} value={prog}>
                        {prog}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Exercise Rows */}
                <div className="mt-5 divide-y divide-[#252B3B]">
                  {draftExercises.map((ex, idx) => (
                    <div key={ex.id} className="py-3.5 first:pt-0 last:pb-0 min-w-0">
                      {!isEditingSplit ? (
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <span className="block text-sm font-semibold text-white break-words">
                              {idx + 1}. {ex.name}
                            </span>
                            <span className="font-mono text-xs text-[#94A3B8] tabular-nums">
                              {ex.sets} sets × {ex.repsCount} reps
                            </span>
                          </div>
                          <div className="font-mono text-sm font-bold text-[#CCFF00] tabular-nums shrink-0">
                            {ex.loadKg} kg
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3 rounded-xl bg-[#0A0C10] p-3.5">
                          <div className="flex items-center justify-between gap-2">
                            <select
                              aria-label={`Select movement ${idx + 1}`}
                              value={ex.name}
                              onChange={(e) => {
                                const val = e.target.value;
                                setDraftExercises((prev) =>
                                  prev.map((item) =>
                                    item.id === ex.id ? { ...item, name: val } : item
                                  )
                                );
                              }}
                              className="min-h-[44px] flex-1 rounded-lg border border-[#252B3B] bg-[#161922] px-3 py-1.5 text-xs font-semibold text-white focus:border-[#CCFF00] focus:outline-none min-w-0"
                            >
                              {[
                                ex.name,
                                ...EXERCISE_ALTERNATIVES.filter((alt) => alt !== ex.name),
                              ].map((opt) => (
                                <option key={opt} value={opt}>
                                  {opt}
                                </option>
                              ))}
                            </select>

                            {draftExercises.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveDraftExercise(ex.id)}
                                aria-label={`Remove ${ex.name}`}
                                className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-lg text-[#94A3B8] hover:bg-[#FF5757]/15 hover:text-[#FF5757] cursor-pointer shrink-0"
                              >
                                <Trash2 className="h-4 w-4" aria-hidden="true" />
                              </button>
                            )}
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                            <label className="flex flex-col text-[11px] text-[#94A3B8]">
                              Sets
                              <input
                                type="number"
                                min={1}
                                max={8}
                                value={ex.sets}
                                onChange={(e) => {
                                  const nextSets = Math.max(
                                    1,
                                    Math.min(8, Number(e.target.value) || 1)
                                  );
                                  setDraftExercises((prev) =>
                                    prev.map((item) =>
                                      item.id === ex.id
                                        ? {
                                            ...item,
                                            sets: nextSets,
                                            setsCompleted: Array.from(
                                              { length: nextSets },
                                              (_, i) => Boolean(item.setsCompleted[i])
                                            ),
                                          }
                                        : item
                                    )
                                  );
                                }}
                                className="mt-1 min-h-[44px] rounded-lg border border-[#252B3B] bg-[#161922] px-3 py-1.5 font-mono text-xs text-white tabular-nums focus:border-[#CCFF00] focus:outline-none"
                              />
                            </label>

                            <label className="flex flex-col text-[11px] text-[#94A3B8]">
                              Reps
                              <input
                                type="number"
                                min={1}
                                max={30}
                                value={ex.repsCount}
                                onChange={(e) => {
                                  const nextReps = Math.max(
                                    1,
                                    Math.min(30, Number(e.target.value) || 1)
                                  );
                                  setDraftExercises((prev) =>
                                    prev.map((item) =>
                                      item.id === ex.id
                                        ? {
                                            ...item,
                                            repsCount: nextReps,
                                            reps: `${nextReps} reps`,
                                          }
                                        : item
                                    )
                                  );
                                }}
                                className="mt-1 min-h-[44px] rounded-lg border border-[#252B3B] bg-[#161922] px-3 py-1.5 font-mono text-xs text-white tabular-nums focus:border-[#CCFF00] focus:outline-none"
                              />
                            </label>

                            <div className="col-span-2 sm:col-span-1 flex flex-col text-[11px] text-[#94A3B8]">
                              <span>Target Load (kg)</span>
                              <div className="mt-1 flex items-center gap-1.5">
                                <button
                                  type="button"
                                  aria-label={`Decrease load for ${ex.name}`}
                                  onClick={() =>
                                    setDraftExercises((prev) =>
                                      prev.map((item) =>
                                        item.id === ex.id
                                          ? { ...item, loadKg: Math.max(0, item.loadKg - 2.5) }
                                          : item
                                      )
                                    )
                                  }
                                  className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg border border-[#252B3B] bg-[#161922] text-white hover:border-[#CCFF00] cursor-pointer"
                                >
                                  <Minus className="h-3.5 w-3.5" />
                                </button>
                                <span className="flex-1 text-center font-mono text-xs font-bold text-[#CCFF00] tabular-nums">
                                  {ex.loadKg} kg
                                </span>
                                <button
                                  type="button"
                                  aria-label={`Increase load for ${ex.name}`}
                                  onClick={() =>
                                    setDraftExercises((prev) =>
                                      prev.map((item) =>
                                        item.id === ex.id
                                          ? { ...item, loadKg: Math.min(350, item.loadKg + 2.5) }
                                          : item
                                      )
                                    )
                                  }
                                  className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg border border-[#252B3B] bg-[#161922] text-white hover:border-[#CCFF00] cursor-pointer"
                                >
                                  <Plus className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {isEditingSplit && (
                  <div className="mt-5 pt-4 border-t border-[#252B3B] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                    <button
                      type="button"
                      onClick={handleAddDraftExercise}
                      className="min-h-[44px] inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#252B3B] bg-[#0A0C10] px-3.5 py-2 text-xs font-semibold text-white hover:border-[#00E5FF] hover:text-[#00E5FF] cursor-pointer whitespace-nowrap"
                    >
                      <Plus className="h-4 w-4" aria-hidden="true" />
                      <span>Add Movement</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleSaveSplitProtocol}
                      className="min-h-[44px] inline-flex items-center justify-center gap-2 rounded-xl bg-[#CCFF00] px-4 py-2.5 text-xs font-bold text-[#0A0C10] hover:bg-[#d8ff33] cursor-pointer whitespace-nowrap"
                    >
                      <Check className="h-4 w-4 stroke-[2.5]" aria-hidden="true" />
                      <span>Save Split &amp; Sync Load</span>
                    </button>
                  </div>
                )}
              </section>

              {/* 4. Macro & Nutrition Protocol Manager (5 cols on Tablet/Desktop) */}
              <section
                aria-labelledby="macro-protocol-heading"
                className="rounded-2xl border border-[#252B3B] bg-[#161922] p-4 sm:p-6 md:col-span-5 min-w-0"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-medium text-[#94A3B8]">
                      Precision Metabolic Targets
                    </p>
                    <h3
                      id="macro-protocol-heading"
                      className="mt-0.5 font-display text-lg font-bold text-white"
                    >
                      Macro &amp; Nutrition Protocol
                    </h3>
                  </div>
                  <Sliders className="h-5 w-5 text-[#00E5FF] shrink-0" aria-hidden="true" />
                </div>

                <div className="mt-5 space-y-3.5">
                  {/* Daily Calories Slider */}
                  <div className="rounded-xl bg-[#0A0C10] p-3.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-white">Daily Calories</span>
                      <span className="font-mono text-sm font-bold text-[#CCFF00] tabular-nums">
                        {draftCalories.toLocaleString()} kcal
                      </span>
                    </div>
                    <input
                      type="range"
                      min={1400}
                      max={4000}
                      step={25}
                      value={draftCalories}
                      onChange={(e) => setDraftCalories(Number(e.target.value))}
                      aria-label="Daily calorie target"
                      className="mt-2 h-6 w-full accent-[#CCFF00] cursor-pointer"
                    />
                  </div>

                  {/* Protein Slider */}
                  <div className="rounded-xl bg-[#0A0C10] p-3.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-white">Protein Target</span>
                      <span className="font-mono text-sm font-bold text-[#CCFF00] tabular-nums">
                        {draftProtein} g
                      </span>
                    </div>
                    <input
                      type="range"
                      min={80}
                      max={260}
                      step={5}
                      value={draftProtein}
                      onChange={(e) => {
                        const nextP = Number(e.target.value);
                        setDraftProtein(nextP);
                        setDraftCalories(nextP * 4 + draftCarbs * 4 + draftFats * 9);
                      }}
                      aria-label="Daily protein target in grams"
                      className="mt-2 h-6 w-full accent-[#CCFF00] cursor-pointer"
                    />
                  </div>

                  {/* Carbs Slider */}
                  <div className="rounded-xl bg-[#0A0C10] p-3.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-white">Carbs Target</span>
                      <span className="font-mono text-sm font-bold text-[#00E5FF] tabular-nums">
                        {draftCarbs} g
                      </span>
                    </div>
                    <input
                      type="range"
                      min={60}
                      max={400}
                      step={5}
                      value={draftCarbs}
                      onChange={(e) => {
                        const nextC = Number(e.target.value);
                        setDraftCarbs(nextC);
                        setDraftCalories(draftProtein * 4 + nextC * 4 + draftFats * 9);
                      }}
                      aria-label="Daily carbohydrates target in grams"
                      className="mt-2 h-6 w-full accent-[#00E5FF] cursor-pointer"
                    />
                  </div>

                  {/* Fats Slider */}
                  <div className="rounded-xl bg-[#0A0C10] p-3.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-white">Fats Target</span>
                      <span className="font-mono text-sm font-bold text-[#FF5757] tabular-nums">
                        {draftFats} g
                      </span>
                    </div>
                    <input
                      type="range"
                      min={35}
                      max={130}
                      step={2}
                      value={draftFats}
                      onChange={(e) => {
                        const nextF = Number(e.target.value);
                        setDraftFats(nextF);
                        setDraftCalories(draftProtein * 4 + draftCarbs * 4 + nextF * 9);
                      }}
                      aria-label="Daily fats target in grams"
                      className="mt-2 h-6 w-full accent-[#FF5757] cursor-pointer"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handlePushNutrition}
                  className="mt-5 w-full min-h-[48px] inline-flex items-center justify-center gap-2 rounded-xl bg-[#CCFF00] px-4 py-3 text-xs font-bold text-[#0A0C10] transition-colors hover:bg-[#d8ff33] cursor-pointer whitespace-nowrap"
                >
                  <span>Push Protocol Update to Client</span>
                  <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
                </button>
              </section>
            </div>

            {/* 5. Coach Feedback & Direct Check-in Notes */}
            <section
              aria-labelledby="coach-notes-heading"
              className="rounded-2xl border border-[#252B3B] bg-[#161922] p-4 sm:p-6 min-w-0"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-medium text-[#94A3B8]">
                    Direct Athlete Accountability
                  </p>
                  <h3
                    id="coach-notes-heading"
                    className="mt-0.5 font-display text-lg font-bold text-white"
                  >
                    Coach Feedback &amp; Check-in Notes
                  </h3>
                </div>
                <span className="font-mono text-xs text-[#94A3B8] tabular-nums">
                  {selectedAthlete.coachNotes.length} logged{' '}
                  {selectedAthlete.coachNotes.length === 1 ? 'entry' : 'entries'}
                </span>
              </div>

              <form onSubmit={handlePostNote} className="mt-4 space-y-3">
                <textarea
                  rows={3}
                  maxLength={600}
                  value={coachNoteDraft}
                  onChange={(e) => setCoachNoteDraft(e.target.value)}
                  placeholder={`Leave feedback on ${
                    selectedAthlete.fullName.split(' ')[0]
                  }'s latest training session or recovery trend...`}
                  className="w-full rounded-xl border border-[#252B3B] bg-[#0A0C10] p-3.5 text-sm text-white placeholder-[#64748B] focus:border-[#CCFF00] focus:outline-none"
                />

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    {[
                      'Great bar speed — add +2.5kg next session.',
                      'Prioritize 2 rounds of 4-7-8 breathwork tonight.',
                      'Hit +500ml electrolytes 30m pre-training.',
                    ].map((quickSnippet) => (
                      <button
                        key={quickSnippet}
                        type="button"
                        onClick={() => setCoachNoteDraft(quickSnippet)}
                        className="min-h-[38px] rounded-lg border border-[#252B3B] bg-[#0A0C10] px-2.5 py-1.5 text-left text-[11px] font-medium text-[#94A3B8] hover:border-[#00E5FF] hover:text-white cursor-pointer"
                      >
                        {quickSnippet}
                      </button>
                    ))}
                  </div>

                  <button
                    type="submit"
                    disabled={!coachNoteDraft.trim()}
                    className="w-full sm:w-auto min-h-[44px] inline-flex items-center justify-center gap-2 rounded-xl bg-[#CCFF00] px-5 py-2.5 text-xs font-bold text-[#0A0C10] transition-colors hover:bg-[#d8ff33] disabled:opacity-45 cursor-pointer whitespace-nowrap shrink-0"
                  >
                    <MessageSquarePlus className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>Post Coach Note</span>
                  </button>
                </div>
              </form>

              {/* Historical Coach Notes Timeline */}
              <div className="mt-6 divide-y divide-[#252B3B]">
                {selectedAthlete.coachNotes.map((note) => (
                  <article key={note.id} className="py-4 first:pt-2 last:pb-0 min-w-0">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                        <span className="font-semibold text-white">{note.authorName}</span>
                        <span className="text-[#64748B]" aria-hidden="true">
                          ·
                        </span>
                        <span className="text-[#00E5FF]">{note.authorRole}</span>
                      </div>
                      <span className="font-mono text-[#64748B] tabular-nums">
                        {note.timestamp}
                      </span>
                    </div>
                    <p className="mt-1.5 text-sm text-[#CBD5E1] leading-relaxed break-words">
                      {note.content}
                    </p>
                  </article>
                ))}
              </div>
            </section>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
