import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Check, Dumbbell, Flame, Minus, Plus, SkipForward, Timer } from 'lucide-react';
import { ExerciseItem } from '../context/AuthContext';

interface StrengthPillarCardProps {
  exercises: ExerciseItem[];
  workoutCompleted: boolean;
  workoutStreak: number;
  assignedProgram: string;
  onToggleExercise: (id: string) => void;
  onToggleSet: (exerciseId: string, setIndex: number) => Promise<boolean>;
  onAdjustLoad: (id: string, deltaKg: number) => void;
  onToggleWorkout: () => void;
}

function formatTimerClock(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export const StrengthPillarCard: React.FC<StrengthPillarCardProps> = ({
  exercises,
  workoutCompleted,
  workoutStreak,
  assignedProgram,
  onToggleExercise,
  onToggleSet,
  onAdjustLoad,
  onToggleWorkout,
}) => {
  const [restSecondsLeft, setRestSecondsLeft] = useState<number>(0);
  const [restDurationBase, setRestDurationBase] = useState<number>(60);
  const [lastCompletedLabel, setLastCompletedLabel] = useState<string>('');

  useEffect(() => {
    if (restSecondsLeft <= 0) return;

    const interval = window.setInterval(() => {
      setRestSecondsLeft((prev) => (prev > 1 ? prev - 1 : 0));
    }, 1000);

    return () => window.clearInterval(interval);
  }, [restSecondsLeft]);

  const volumeStats = useMemo(() => {
    let completedSetsCount = 0;
    let totalSetsCount = 0;
    let completedTonnageKg = 0;
    let plannedTonnageKg = 0;

    for (const ex of exercises) {
      const setsArr =
        ex.setsCompleted && ex.setsCompleted.length === ex.sets
          ? ex.setsCompleted
          : Array.from({ length: ex.sets }, () => ex.completed);

      const repsNum = ex.repsCount || parseInt(ex.reps, 10) || 10;
      const doneInEx = setsArr.filter(Boolean).length;

      completedSetsCount += doneInEx;
      totalSetsCount += ex.sets;
      completedTonnageKg += doneInEx * repsNum * ex.loadKg;
      plannedTonnageKg += ex.sets * repsNum * ex.loadKg;
    }

    const pct = Math.round((completedSetsCount / Math.max(1, totalSetsCount)) * 100);
    return {
      completedSetsCount,
      totalSetsCount,
      completedTonnageKg: Math.round(completedTonnageKg),
      plannedTonnageKg: Math.round(plannedTonnageKg),
      pct,
    };
  }, [exercises]);

  const handleSetClick = async (exercise: ExerciseItem, setIndex: number) => {
    const newlyChecked = await onToggleSet(exercise.id, setIndex);
    if (newlyChecked) {
      setRestDurationBase(60);
      setRestSecondsLeft(60);
      setLastCompletedLabel(`${exercise.name} · Set ${setIndex + 1}`);
    }
  };

  const handleExerciseToggle = (exercise: ExerciseItem) => {
    const willComplete = !exercise.completed;
    onToggleExercise(exercise.id);
    if (willComplete) {
      setRestDurationBase(60);
      setRestSecondsLeft(60);
      setLastCompletedLabel(`${exercise.name} · All Sets`);
    }
  };

  return (
    <section
      id="pillar-strength"
      aria-labelledby="pillar-strength-heading"
      className="flex flex-col justify-between rounded-2xl border border-[#252B3B] bg-[#161922] p-4 sm:p-6 min-w-0"
    >
      <div>
        {/* Card Header with Wrap Protection */}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-[#94A3B8] break-words">
              01. Strength · {assignedProgram}
            </p>
            <h2
              id="pillar-strength-heading"
              className="mt-1 font-display text-lg sm:text-xl font-bold text-white"
            >
              Push Hypertrophy Tracker
            </h2>
          </div>

          <div className="flex flex-col items-end text-right shrink-0">
            <div className="flex items-center gap-1.5">
              <Flame className="h-4 w-4 text-[#CCFF00]" aria-hidden="true" />
              <span className="font-mono text-xs sm:text-sm font-semibold text-white tabular-nums">
                {workoutStreak}d streak
              </span>
            </div>
            <span className="mt-0.5 font-mono text-[11px] sm:text-xs text-[#00E5FF] tabular-nums">
              {volumeStats.completedTonnageKg.toLocaleString()} /{' '}
              {volumeStats.plannedTonnageKg.toLocaleString()} kg
            </span>
          </div>
        </div>

        {/* Dynamic Set & Tonnage Progress Bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between gap-2 text-xs text-[#94A3B8]">
            <span className="truncate">
              Sets Completed ({volumeStats.completedSetsCount} / {volumeStats.totalSetsCount})
            </span>
            <span className="font-mono font-semibold tabular-nums text-white shrink-0">
              {volumeStats.pct}%
            </span>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[#0A0C10]">
            <div
              className="h-full rounded-full bg-[#CCFF00] transition-transform duration-200 origin-left"
              style={{ transform: `scaleX(${volumeStats.pct / 100})` }}
            />
          </div>
        </div>

        {/* Live 60-Second Rest Countdown Banner (Non-Overlapping Flex-Wrap) */}
        <AnimatePresence initial={false}>
          {restSecondsLeft > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.18 }}
              className="mt-4 rounded-xl border border-[#00E5FF]/35 bg-[#0A0C10] p-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <Timer className="h-4 w-4 text-[#00E5FF] shrink-0" aria-hidden="true" />
                  <span className="font-mono text-xs font-bold text-[#00E5FF] tabular-nums whitespace-nowrap">
                    Resting: {formatTimerClock(restSecondsLeft)}...
                  </span>
                  {lastCompletedLabel && (
                    <span className="text-xs text-[#94A3B8] truncate">
                      · {lastCompletedLabel}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setRestDurationBase((b) => Math.max(b, restSecondsLeft + 15));
                      setRestSecondsLeft((s) => Math.min(180, s + 15));
                    }}
                    className="min-h-[38px] rounded-lg border border-[#252B3B] bg-[#161922] px-2.5 py-1 font-mono text-[11px] font-semibold text-white hover:border-[#00E5FF] cursor-pointer whitespace-nowrap tabular-nums"
                  >
                    +15s
                  </button>
                  <button
                    type="button"
                    onClick={() => setRestSecondsLeft(0)}
                    className="min-h-[38px] inline-flex items-center gap-1 rounded-lg border border-[#252B3B] bg-[#161922] px-2.5 py-1 text-[11px] font-semibold text-[#94A3B8] hover:text-white cursor-pointer whitespace-nowrap"
                  >
                    <SkipForward className="h-3 w-3" aria-hidden="true" />
                    <span>Skip</span>
                  </button>
                </div>
              </div>

              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[#161922]">
                <div
                  className="h-full rounded-full bg-[#00E5FF] transition-transform duration-300 origin-left"
                  style={{
                    transform: `scaleX(${Math.min(1, restSecondsLeft / Math.max(1, restDurationBase))})`,
                  }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Interactive Exercise & Per-Set Checkboxes */}
        <div className="mt-5 divide-y divide-[#252B3B]">
          {exercises.map((exercise) => {
            const setsArr =
              exercise.setsCompleted && exercise.setsCompleted.length === exercise.sets
                ? exercise.setsCompleted
                : Array.from({ length: exercise.sets }, () => exercise.completed);
            const repsNum = exercise.repsCount || parseInt(exercise.reps, 10) || 10;
            const exerciseTonnage = Math.round(
              setsArr.filter(Boolean).length * repsNum * exercise.loadKg
            );

            return (
              <div key={exercise.id} className="py-3.5 first:pt-0 last:pb-0 min-w-0">
                <div className="flex items-start sm:items-center justify-between gap-2.5">
                  <button
                    type="button"
                    onClick={() => handleExerciseToggle(exercise)}
                    className="group flex min-h-[44px] flex-1 items-start sm:items-center gap-2.5 sm:gap-3 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#CCFF00] cursor-pointer min-w-0"
                  >
                    <span
                      className={`mt-0.5 sm:mt-0 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border transition-colors ${
                        exercise.completed
                          ? 'border-[#CCFF00] bg-[#CCFF00] text-[#0A0C10]'
                          : 'border-[#64748B] bg-[#0A0C10] text-transparent group-hover:border-[#CCFF00]'
                      }`}
                    >
                      <Check className="h-4 w-4 stroke-[2.5]" aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span
                        className={`block text-sm font-semibold transition-colors leading-snug break-words ${
                          exercise.completed ? 'text-[#94A3B8] line-through' : 'text-white'
                        }`}
                      >
                        {exercise.name}
                      </span>
                      <span className="mt-0.5 block font-mono text-[11px] sm:text-xs text-[#94A3B8] tabular-nums">
                        {exercise.sets}×{repsNum} @ {exercise.loadKg} kg ·{' '}
                        <span className="text-white">{exerciseTonnage} kg</span>
                      </span>
                    </span>
                  </button>

                  {/* Working Load Adjuster (44x44px Touch Targets) */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      aria-label={`Decrease load for ${exercise.name}`}
                      onClick={() => onAdjustLoad(exercise.id, -2.5)}
                      className="flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border border-[#252B3B] bg-[#0A0C10] text-[#94A3B8] transition-colors hover:border-[#94A3B8] hover:text-white cursor-pointer"
                    >
                      <Minus className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      aria-label={`Increase load for ${exercise.name}`}
                      onClick={() => onAdjustLoad(exercise.id, 2.5)}
                      className="flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border border-[#252B3B] bg-[#0A0C10] text-[#94A3B8] transition-colors hover:border-[#CCFF00] hover:text-[#CCFF00] cursor-pointer"
                    >
                      <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  </div>
                </div>

                {/* Per-Set Interactive Checkboxes (Flex-Wrap for Fluid Mobile Spacing) */}
                <div className="mt-2.5 sm:pl-9 flex flex-wrap items-center gap-2">
                  {setsArr.map((isSetDone, sIdx) => (
                    <button
                      key={`${exercise.id}-set-${sIdx}`}
                      type="button"
                      onClick={() => handleSetClick(exercise, sIdx)}
                      aria-pressed={isSetDone}
                      className={`min-h-[44px] min-w-[60px] flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 rounded-lg border px-2.5 py-1.5 font-mono text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap tabular-nums ${
                        isSetDone
                          ? 'border-[#CCFF00]/60 bg-[#CCFF00]/15 text-[#CCFF00]'
                          : 'border-[#252B3B] bg-[#0A0C10] text-[#94A3B8] hover:border-[#64748B] hover:text-white'
                      }`}
                    >
                      {isSetDone && <Check className="h-3 w-3 stroke-[2.5]" aria-hidden="true" />}
                      <span>S{sIdx + 1}</span>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Primary Session Completion & Rest Trigger Footer */}
      <div className="mt-6 pt-4 border-t border-[#252B3B] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        <button
          type="button"
          onClick={() => {
            setRestDurationBase(60);
            setRestSecondsLeft(60);
            setLastCompletedLabel('Manual Recovery Interval');
          }}
          className="min-h-[44px] inline-flex items-center justify-center gap-2 rounded-xl border border-[#252B3B] bg-[#0A0C10] px-3.5 py-2 font-mono text-xs font-semibold text-[#94A3B8] transition-colors hover:border-[#00E5FF] hover:text-[#00E5FF] cursor-pointer whitespace-nowrap tabular-nums"
        >
          <Timer className="h-4 w-4 text-[#00E5FF]" aria-hidden="true" />
          <span>Start 60s Rest</span>
        </button>

        <button
          type="button"
          onClick={onToggleWorkout}
          className={`min-h-[44px] inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-colors whitespace-nowrap cursor-pointer ${
            workoutCompleted
              ? 'border border-[#CCFF00]/40 bg-[#CCFF00]/15 text-[#CCFF00] hover:bg-[#CCFF00]/25'
              : 'bg-[#CCFF00] text-[#0A0C10] hover:bg-[#d8ff33]'
          }`}
        >
          <Dumbbell className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{workoutCompleted ? 'Session Logged' : 'Complete Full Split'}</span>
        </button>
      </div>
    </section>
  );
};
