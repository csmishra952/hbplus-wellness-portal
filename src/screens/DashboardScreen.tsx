import React from 'react';
import { motion } from 'motion/react';
import {
  Activity,
  CalendarCheck2,
  HeartPulse,
  LayoutDashboard,
  MessageSquare,
  Moon,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Header } from '../components/Header';
import { StrengthPillarCard } from '../components/StrengthPillarCard';
import { NutritionPillarCard } from '../components/NutritionPillarCard';
import { BreathworkWidget } from '../components/BreathworkWidget';
import { VitalsPillarCard } from '../components/VitalsPillarCard';
import { AdminScreen } from './AdminScreen';

export const DashboardScreen: React.FC = () => {
  const {
    profile,
    wellness,
    athletes,
    activeTab,
    setActiveTab,
    navigateToRoute,
    logout,
    isAuthenticating,
    isDemoSession,
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
  } = useAuth();

  if (!profile) {
    return null;
  }

  // Evaluate each of the 4 pillars dynamically
  const completedSetsTotal = wellness.exercises.reduce((acc, ex) => {
    const arr =
      ex.setsCompleted && ex.setsCompleted.length === ex.sets
        ? ex.setsCompleted
        : Array.from({ length: ex.sets }, () => ex.completed);
    return acc + arr.filter(Boolean).length;
  }, 0);

  const pillarStatuses = [
    {
      id: 'pillar-strength',
      label: 'Strength',
      shortLabel: 'Str',
      aligned: wellness.workoutCompleted || completedSetsTotal >= 7,
    },
    {
      id: 'pillar-nutrition',
      label: 'Nutrition',
      shortLabel: 'Nut',
      aligned: wellness.proteinGrams >= wellness.proteinTarget * 0.8,
    },
    {
      id: 'pillar-mindset',
      label: 'Mindset',
      shortLabel: 'Mind',
      aligned: wellness.breathworkSessions >= 1,
    },
    {
      id: 'pillar-vitals',
      label: 'Vitals',
      shortLabel: 'Vit',
      aligned: wellness.stepsCount >= wellness.stepsTarget * 0.8 && wellness.waterGlasses >= 6,
    },
  ];

  const pillarsOnTrack = pillarStatuses.filter((p) => p.aligned).length;
  const emailDomain = profile.email.split('@')[1] || 'hbplus.fit';

  // Recovery circular ring geometry
  const recSize = 64;
  const recStroke = 6;
  const recRadius = (recSize - recStroke) / 2;
  const recCircumference = 2 * Math.PI * recRadius;
  const recOffset = recCircumference * (1 - Math.min(1, wellness.recoveryScore / 100));

  // Sleep stage percentages
  const totalSleepMins =
    wellness.sleepStages.deepMinutes +
    wellness.sleepStages.remMinutes +
    wellness.sleepStages.lightMinutes;
  const deepPct = Math.round((wellness.sleepStages.deepMinutes / Math.max(1, totalSleepMins)) * 100);
  const remPct = Math.round((wellness.sleepStages.remMinutes / Math.max(1, totalSleepMins)) * 100);
  const lightPct = Math.max(0, 100 - deepPct - remPct);

  // Sleep efficiency SVG semi-arc
  const arcRadius = 24;
  const arcCircumference = Math.PI * arcRadius;
  const arcOffset = arcCircumference * (1 - Math.min(1, wellness.sleepEfficiency / 100));

  const adherenceDaysCompleted = wellness.weeklyAdherence.filter((d) => d.completed).length;

  const linkedAthleteFile = athletes.find(
    (a) => a.uid === profile.uid || a.email.toLowerCase() === profile.email.toLowerCase()
  );
  const latestCoachNote = linkedAthleteFile?.coachNotes?.[0] || null;

  const scrollToPillar = (elementId: string) => {
    const el = document.getElementById(elementId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-[#0A0C10] text-white pb-20 md:pb-14">
      <Header
        profile={profile}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onNavigateHome={() => navigateToRoute('/')}
        onLogout={logout}
        isLoggingOut={isAuthenticating}
      />

      <main className="mx-auto w-full max-w-[1280px] px-4 pt-5 md:px-7 md:pt-7 lg:px-8 lg:pt-8">
        {/* Contextual Workspace Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 sm:gap-4 pb-5 sm:pb-6 border-b border-[#252B3B]">
          <div className="min-w-0">
            <p className="text-xs font-medium text-[#94A3B8] flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
              <span>HB+ Verified Ecosystem</span>
              <span aria-hidden="true">·</span>
              <span>@{emailDomain}</span>
              <span aria-hidden="true">·</span>
              <span>{profile.role === 'admin' ? 'Coach Clearance' : 'Member'}</span>
              {isDemoSession && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>Sandbox</span>
                </>
              )}
            </p>
            <h1 className="mt-1 font-display text-2xl sm:text-3xl font-bold tracking-tight text-white break-words">
              {activeTab === 'admin' && profile.role === 'admin'
                ? 'Coach & Admin Command Portal'
                : `Welcome back, ${profile.fullName.split(' ')[0]}`}
            </h1>
          </div>

          <div className="flex items-center gap-2 text-xs text-[#94A3B8] shrink-0">
            <span>
              Active Split:{' '}
              <span className="font-semibold text-white">{profile.assignedProgram}</span>
            </span>
          </div>
        </div>

        {activeTab === 'admin' && profile.role === 'admin' ? (
          <div className="mt-5 sm:mt-6">
            <AdminScreen />
          </div>
        ) : (
          <>
            {/* Top Metric Strip: 2x2 Compact Grid on Mobile/Tablet, 4 Horizontal Cards on Desktop */}
            <section
              aria-label="Biometric Readiness and Adherence Telemetry"
              className="mt-5 sm:mt-6 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4"
            >
              {/* Card 1: Rest Recovery */}
              <div className="rounded-2xl border border-[#252B3B] bg-[#161922] p-3.5 sm:p-5 flex flex-col justify-between min-w-0">
                <div className="flex items-center justify-between gap-1 text-[11px] sm:text-xs text-[#94A3B8]">
                  <span className="font-medium truncate">Recovery</span>
                  <motion.div
                    animate={{ scale: [1, 1.15, 1], opacity: [0.8, 1, 0.8] }}
                    transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
                    className="flex items-center gap-1 text-[#CCFF00] shrink-0"
                  >
                    <HeartPulse className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden="true" />
                    <span className="font-mono text-[10px] sm:text-[11px] font-semibold tabular-nums">
                      {wellness.rhrBpm} bpm
                    </span>
                  </motion.div>
                </div>

                <div className="mt-2.5 sm:mt-3 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3.5 min-w-0">
                  <div className="relative h-12 w-12 sm:h-16 sm:w-16 shrink-0">
                    <svg
                      className="h-full w-full -rotate-90"
                      viewBox={`0 0 ${recSize} ${recSize}`}
                      aria-hidden="true"
                    >
                      <circle
                        cx={recSize / 2}
                        cy={recSize / 2}
                        r={recRadius}
                        fill="transparent"
                        stroke="#0A0C10"
                        strokeWidth={recStroke}
                      />
                      <circle
                        cx={recSize / 2}
                        cy={recSize / 2}
                        r={recRadius}
                        fill="transparent"
                        stroke="#CCFF00"
                        strokeWidth={recStroke}
                        strokeLinecap="round"
                        strokeDasharray={recCircumference}
                        strokeDashoffset={recOffset}
                        className="transition-all duration-500"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="font-mono text-xs sm:text-sm font-bold text-white tabular-nums">
                        {wellness.recoveryScore}%
                      </span>
                    </div>
                  </div>

                  <div className="min-w-0">
                    <div className="font-display text-sm sm:text-lg font-bold text-[#CCFF00] leading-tight">
                      {wellness.recoveryScore}% Optimal
                    </div>
                    <p className="mt-0.5 font-mono text-[10px] sm:text-xs text-[#94A3B8] tabular-nums">
                      HRV {wellness.hrvMs}ms · RHR {wellness.rhrBpm}
                    </p>
                  </div>
                </div>
              </div>

              {/* Card 2: Sleep Architecture */}
              <div className="rounded-2xl border border-[#252B3B] bg-[#161922] p-3.5 sm:p-5 flex flex-col justify-between min-w-0">
                <div className="flex items-center justify-between gap-1 text-[11px] sm:text-xs text-[#94A3B8]">
                  <span className="font-medium truncate">Sleep</span>
                  <div className="flex items-center gap-1 text-[#00E5FF] shrink-0">
                    <Moon className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden="true" />
                    <span className="font-mono text-[10px] sm:text-xs font-semibold tabular-nums">
                      {wellness.sleepEfficiency}%
                    </span>
                  </div>
                </div>

                <div className="mt-2.5 sm:mt-3 flex items-end justify-between gap-2 min-w-0">
                  <div className="min-w-0">
                    <div className="font-mono text-lg sm:text-2xl font-bold text-white tabular-nums leading-tight">
                      {wellness.sleepDuration}
                    </div>
                    <p className="mt-0.5 font-mono text-[10px] sm:text-[11px] text-[#94A3B8] tabular-nums leading-snug">
                      Deep 1h 52m · REM 1h 48m
                    </p>
                  </div>

                  <svg
                    className="hidden sm:block h-8 w-14 shrink-0"
                    viewBox="0 0 60 34"
                    aria-hidden="true"
                  >
                    <path
                      d="M 6 30 A 24 24 0 0 1 54 30"
                      fill="none"
                      stroke="#0A0C10"
                      strokeWidth="5.5"
                      strokeLinecap="round"
                    />
                    <path
                      d="M 6 30 A 24 24 0 0 1 54 30"
                      fill="none"
                      stroke="#00E5FF"
                      strokeWidth="5.5"
                      strokeLinecap="round"
                      strokeDasharray={arcCircumference}
                      strokeDashoffset={arcOffset}
                    />
                  </svg>
                </div>

                <div className="mt-2.5 sm:mt-3 flex h-1.5 sm:h-2 w-full overflow-hidden rounded-full bg-[#0A0C10] gap-0.5">
                  <div
                    title={`Deep Sleep: ${deepPct}%`}
                    className="h-full bg-[#00E5FF]"
                    style={{ width: `${deepPct}%` }}
                  />
                  <div
                    title={`REM Sleep: ${remPct}%`}
                    className="h-full bg-[#CCFF00]"
                    style={{ width: `${remPct}%` }}
                  />
                  <div
                    title={`Light Sleep: ${lightPct}%`}
                    className="h-full bg-[#64748B]"
                    style={{ width: `${lightPct}%` }}
                  />
                </div>
              </div>

              {/* Card 3: Daily Pillar Score */}
              <div className="rounded-2xl border border-[#252B3B] bg-[#161922] p-3.5 sm:p-5 flex flex-col justify-between min-w-0">
                <div className="flex items-center justify-between gap-1 text-[11px] sm:text-xs text-[#94A3B8]">
                  <span className="font-medium truncate">Pillars</span>
                  <Activity className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#CCFF00] shrink-0" aria-hidden="true" />
                </div>

                <div className="mt-2">
                  <div className="font-mono text-lg sm:text-2xl font-bold text-white tabular-nums leading-tight">
                    {pillarsOnTrack} / 4{' '}
                    <span className="font-sans text-xs sm:text-sm font-semibold text-[#CCFF00]">
                      Aligned
                    </span>
                  </div>
                  <p className="mt-0.5 text-[10px] sm:text-xs text-[#94A3B8] truncate">
                    Tap segment to jump
                  </p>
                </div>

                <div className="mt-2.5 sm:mt-3 grid grid-cols-4 gap-1 sm:gap-1.5">
                  {pillarStatuses.map((pillar) => (
                    <button
                      key={pillar.id}
                      type="button"
                      onClick={() => scrollToPillar(pillar.id)}
                      className="group flex flex-col items-start text-left focus-visible:outline-2 focus-visible:outline-[#CCFF00] cursor-pointer py-1 min-w-0"
                    >
                      <span
                        className={`h-1.5 sm:h-2 w-full rounded-full transition-colors ${
                          pillar.aligned
                            ? 'bg-[#CCFF00]'
                            : 'bg-[#0A0C10] group-hover:bg-[#252B3B]'
                        }`}
                      />
                      <span
                        className={`mt-1 text-[9px] sm:text-[10px] font-semibold truncate w-full ${
                          pillar.aligned
                            ? 'text-white'
                            : 'text-[#64748B] group-hover:text-[#94A3B8]'
                        }`}
                      >
                        <span className="sm:hidden">{pillar.shortLabel}</span>
                        <span className="hidden sm:inline">{pillar.label}</span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Card 4: Weekly Adherence Heatmap */}
              <div className="rounded-2xl border border-[#252B3B] bg-[#161922] p-3.5 sm:p-5 flex flex-col justify-between min-w-0">
                <div className="flex items-center justify-between gap-1 text-[11px] sm:text-xs text-[#94A3B8]">
                  <span className="font-medium truncate">Adherence</span>
                  <div className="flex items-center gap-1 text-[#CCFF00] shrink-0">
                    <CalendarCheck2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden="true" />
                    <span className="font-mono text-[10px] sm:text-xs font-semibold tabular-nums">
                      {adherenceDaysCompleted}/7d
                    </span>
                  </div>
                </div>

                <div className="mt-2.5 sm:mt-3 grid grid-cols-4 sm:grid-cols-7 gap-1 sm:gap-1.5">
                  {wellness.weeklyAdherence.map((entry, idx) => (
                    <button
                      key={entry.day}
                      type="button"
                      onClick={() => toggleAdherenceDay(idx)}
                      aria-pressed={entry.completed}
                      title={`${entry.day}: ${entry.completed ? 'Protocol completed' : 'In progress'}`}
                      className={`min-h-[36px] sm:min-h-[46px] flex flex-col items-center justify-center rounded-lg sm:rounded-xl border transition-colors cursor-pointer ${
                        entry.completed
                          ? 'border-[#CCFF00]/60 bg-[#CCFF00]/15 text-[#CCFF00]'
                          : 'border-[#252B3B] bg-[#0A0C10] text-[#64748B] hover:border-[#94A3B8] hover:text-white'
                      }`}
                    >
                      <span className="text-[9px] sm:text-[10px] font-semibold">
                        {entry.day.slice(0, 2)}
                      </span>
                      <span className="font-mono text-[10px] sm:text-[11px] font-bold tabular-nums">
                        {entry.dateLabel}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </section>

            {/* Latest Coach Check-in Note Banner */}
            {latestCoachNote && (
              <section
                aria-label="Latest Coach Feedback"
                className="mt-4 sm:mt-5 rounded-2xl border border-[#252B3B] bg-[#161922] px-4 py-3.5 sm:px-5 sm:py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#0A0C10] text-[#00E5FF]">
                    <MessageSquare className="h-4 w-4" aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-[#94A3B8]">
                      <span className="font-semibold text-white">{latestCoachNote.authorName}</span>
                      <span aria-hidden="true">·</span>
                      <span>Coach Note</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums">{latestCoachNote.timestamp}</span>
                    </div>
                    <p className="mt-1 text-xs sm:text-sm text-[#CBD5E1] leading-relaxed break-words">
                      {latestCoachNote.content}
                    </p>
                  </div>
                </div>
              </section>
            )}

            {/* 4 Holistic Wellness Pillars: Single-Col Stack on Mobile (<768px), 2-Col Grid on Tablet & Desktop */}
            <div className="mt-5 sm:mt-6 grid grid-cols-1 md:grid-cols-2 gap-5 lg:gap-6">
              <StrengthPillarCard
                exercises={wellness.exercises}
                workoutCompleted={wellness.workoutCompleted}
                workoutStreak={wellness.workoutStreak}
                assignedProgram={profile.assignedProgram}
                onToggleExercise={toggleExerciseCompleted}
                onToggleSet={toggleSetCompleted}
                onAdjustLoad={updateExerciseLoad}
                onToggleWorkout={toggleWorkoutCompleted}
              />

              <NutritionPillarCard
                caloriesConsumed={wellness.caloriesConsumed}
                caloriesTarget={wellness.caloriesTarget}
                proteinGrams={wellness.proteinGrams}
                proteinTarget={wellness.proteinTarget}
                carbsGrams={wellness.carbsGrams}
                carbsTarget={wellness.carbsTarget}
                fatsGrams={wellness.fatsGrams}
                fatsTarget={wellness.fatsTarget}
                onLogMeal={logMeal}
                onQuickWater500ml={() => adjustWaterGlasses(2)}
              />

              <BreathworkWidget
                mindfulnessStreak={wellness.mindfulnessStreak}
                breathworkSessions={wellness.breathworkSessions}
                onCompleteCycle={completeBreathworkCycle}
              />

              <VitalsPillarCard
                stepsCount={wellness.stepsCount}
                stepsTarget={wellness.stepsTarget}
                waterGlasses={wellness.waterGlasses}
                waterTarget={wellness.waterTarget}
                onAdjustWater={adjustWaterGlasses}
                onSelectWaterGlass={setWaterGlassesDirect}
                onAddSteps={addSteps}
              />
            </div>
          </>
        )}
      </main>

      {/* Mobile Ergonomic Thumb-Zone Switcher for Admin RBAC (Safe-Area Aware, <= 15% Viewport Cap) */}
      {profile.role === 'admin' && (
        <nav
          aria-label="Mobile Admin Navigation"
          className="fixed bottom-0 left-0 right-0 z-30 md:hidden border-t border-[#252B3B] bg-[#0A0C10]/95 backdrop-blur-md pb-safe"
        >
          <div className="grid grid-cols-2 h-13">
            <button
              type="button"
              onClick={() => setActiveTab('admin')}
              className={`min-h-[44px] flex flex-col items-center justify-center text-[11px] font-semibold transition-colors cursor-pointer ${
                activeTab === 'admin' ? 'text-[#CCFF00]' : 'text-[#94A3B8]'
              }`}
            >
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              <span className="mt-0.5">Coach &amp; Admin Portal</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('overview')}
              className={`min-h-[44px] flex flex-col items-center justify-center text-[11px] font-semibold transition-colors cursor-pointer ${
                activeTab === 'overview' ? 'text-[#CCFF00]' : 'text-[#94A3B8]'
              }`}
            >
              <LayoutDashboard className="h-4 w-4" aria-hidden="true" />
              <span className="mt-0.5">Personal Telemetry</span>
            </button>
          </div>
        </nav>
      )}
    </div>
  );
};
