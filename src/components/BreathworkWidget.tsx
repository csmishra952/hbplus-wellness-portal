import React, { useEffect, useState } from 'react';
import { Pause, Play, RotateCcw, Wind } from 'lucide-react';

interface BreathworkWidgetProps {
  mindfulnessStreak: number;
  breathworkSessions: number;
  onCompleteCycle: () => Promise<void>;
}

type BreathPhase = 'idle' | 'inhale' | 'hold' | 'exhale';

const PHASE_DURATIONS: Record<Exclude<BreathPhase, 'idle'>, number> = {
  inhale: 4,
  hold: 7,
  exhale: 8,
};

const PHASE_LABELS: Record<BreathPhase, string> = {
  idle: 'Ready · Parasympathetic 4-7-8 Cadence',
  inhale: 'Inhale Slowly Through Nose (4s)',
  hold: 'Hold — Vagal Tone Activation (7s)',
  exhale: 'Exhale Gently Through Mouth (8s)',
};

export const BreathworkWidget: React.FC<BreathworkWidgetProps> = ({
  mindfulnessStreak,
  breathworkSessions,
  onCompleteCycle,
}) => {
  const [isRunning, setIsRunning] = useState(false);
  const [phase, setPhase] = useState<BreathPhase>('idle');
  const [secondsLeft, setSecondsLeft] = useState<number>(4);
  const [completedRounds, setCompletedRounds] = useState<number>(0);

  useEffect(() => {
    if (!isRunning) return;

    const timer = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev > 1) {
          return prev - 1;
        }

        setPhase((currentPhase) => {
          if (currentPhase === 'inhale' || currentPhase === 'idle') {
            setSecondsLeft(PHASE_DURATIONS.hold);
            return 'hold';
          }
          if (currentPhase === 'hold') {
            setSecondsLeft(PHASE_DURATIONS.exhale);
            return 'exhale';
          }
          setCompletedRounds((r) => r + 1);
          void onCompleteCycle();
          setSecondsLeft(PHASE_DURATIONS.inhale);
          return 'inhale';
        });

        return prev;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [isRunning, onCompleteCycle]);

  const handleToggleStart = () => {
    if (!isRunning) {
      if (phase === 'idle') {
        setPhase('inhale');
        setSecondsLeft(PHASE_DURATIONS.inhale);
      }
      setIsRunning(true);
    } else {
      setIsRunning(false);
    }
  };

  const handleReset = () => {
    setIsRunning(false);
    setPhase('idle');
    setSecondsLeft(PHASE_DURATIONS.inhale);
  };

  const orbScale =
    phase === 'inhale' ? 1.22 : phase === 'hold' ? 1.22 : phase === 'exhale' ? 0.85 : 1;

  const orbTransitionClass =
    phase === 'inhale'
      ? 'duration-[4000ms]'
      : phase === 'exhale'
      ? 'duration-[8000ms]'
      : 'duration-300';

  const stageItems: { key: Exclude<BreathPhase, 'idle'>; label: string; sec: string }[] = [
    { key: 'inhale', label: 'Inhale', sec: '4s' },
    { key: 'hold', label: 'Hold', sec: '7s' },
    { key: 'exhale', label: 'Exhale', sec: '8s' },
  ];

  return (
    <section
      id="pillar-mindset"
      aria-labelledby="pillar-mindset-heading"
      className="flex flex-col justify-between rounded-2xl border border-[#252B3B] bg-[#161922] p-4 sm:p-6 min-w-0"
    >
      <div>
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-[#94A3B8]">
              03. Autonomic Mindset · Nervous System
            </p>
            <h2
              id="pillar-mindset-heading"
              className="mt-1 font-display text-lg sm:text-xl font-bold text-white"
            >
              Kinetic 4-7-8 Parasympathetic Reset
            </h2>
          </div>

          <div className="text-right shrink-0">
            <span className="block font-mono text-xs sm:text-sm font-semibold text-white tabular-nums">
              {mindfulnessStreak}d streak
            </span>
            <span className="font-mono text-[11px] sm:text-xs text-[#00E5FF] tabular-nums">
              {breathworkSessions} cycles logged
            </span>
          </div>
        </div>

        {/* Centered Kinetic Breathing Orb with Fluid Responsive Diameter min(220px, 60vw) */}
        <div className="my-5 flex flex-col items-center justify-center rounded-2xl bg-[#0A0C10] py-6 px-3 sm:px-4 overflow-hidden">
          <div
            style={{ width: 'min(220px, 60vw)', height: 'min(220px, 60vw)' }}
            className="relative mx-auto flex items-center justify-center"
          >
            {/* Exhale Gentle Ripple Ring */}
            <div
              aria-hidden="true"
              className={`absolute inset-2 rounded-full border border-[#00E5FF]/50 transition-all ease-out ${
                phase === 'exhale' ? 'duration-[8000ms]' : 'duration-500'
              }`}
              style={{
                transform: phase === 'exhale' ? 'scale(1.32)' : 'scale(0.92)',
                opacity: phase === 'exhale' ? 0 : phase === 'hold' ? 0.55 : 0.15,
              }}
            />

            {/* Hold Neon Halo */}
            <div
              aria-hidden="true"
              className={`absolute inset-5 rounded-full transition-all ease-in-out ${orbTransitionClass} ${
                phase === 'hold'
                  ? 'border-2 border-[#CCFF00] bg-[#CCFF00]/15'
                  : phase === 'inhale'
                  ? 'border border-[#00E5FF]/60 bg-[#00E5FF]/10'
                  : 'border border-[#252B3B] bg-[#161922]/40'
              }`}
              style={{
                transform: `scale(${orbScale})`,
                opacity: phase === 'hold' ? 1 : 0.75,
              }}
            />

            {/* Primary Breathing Core */}
            <div
              className={`relative flex h-[60%] w-[60%] flex-col items-center justify-center rounded-full border-2 bg-[#161922] transition-transform ease-in-out ${orbTransitionClass} ${
                phase === 'hold'
                  ? 'border-[#CCFF00]'
                  : phase === 'inhale'
                  ? 'border-[#00E5FF]'
                  : phase === 'exhale'
                  ? 'border-[#00E5FF]/70'
                  : 'border-[#CCFF00]/80'
              }`}
              style={{ transform: `scale(${phase === 'idle' ? 1 : orbScale * 0.9})` }}
            >
              <span className="font-mono text-xl sm:text-2xl font-bold text-white tabular-nums">
                {phase === 'idle' ? '4·7·8' : `${secondsLeft}s`}
              </span>
              <span
                className={`mt-0.5 text-[10px] sm:text-[11px] font-semibold ${
                  phase === 'hold'
                    ? 'text-[#CCFF00]'
                    : phase === 'inhale' || phase === 'exhale'
                    ? 'text-[#00E5FF]'
                    : 'text-[#94A3B8]'
                }`}
              >
                {phase === 'idle'
                  ? 'Cadence'
                  : phase === 'inhale'
                  ? 'Inhale'
                  : phase === 'hold'
                  ? 'Hold Halo'
                  : 'Exhale'}
              </span>
            </div>
          </div>

          <p className="mt-4 text-xs sm:text-sm font-semibold text-white text-center px-2">
            {PHASE_LABELS[phase]}
          </p>

          <div className="mt-2.5 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs font-mono tabular-nums">
            {stageItems.map((st, idx) => {
              const isActive = phase === st.key;
              return (
                <React.Fragment key={st.key}>
                  {idx > 0 && (
                    <span className="text-[#64748B]" aria-hidden="true">
                      ·
                    </span>
                  )}
                  <span
                    className={
                      isActive ? 'font-bold text-[#CCFF00]' : 'font-normal text-[#94A3B8]'
                    }
                  >
                    {st.label} ({st.sec})
                  </span>
                </React.Fragment>
              );
            })}
          </div>

          <p className="mt-2 text-xs text-[#64748B] font-mono tabular-nums">
            Completed rounds: {completedRounds}
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="pt-4 border-t border-[#252B3B] flex items-center justify-between gap-2.5">
        <button
          type="button"
          onClick={handleReset}
          disabled={phase === 'idle' && !isRunning}
          className="min-h-[44px] inline-flex items-center justify-center gap-2 rounded-xl border border-[#252B3B] bg-[#0A0C10] px-3.5 py-2 text-xs font-semibold text-[#94A3B8] transition-colors hover:text-white disabled:opacity-40 cursor-pointer whitespace-nowrap shrink-0"
        >
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          <span>Reset</span>
        </button>

        <button
          type="button"
          onClick={handleToggleStart}
          className={`flex-1 sm:flex-initial min-h-[44px] inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold transition-colors whitespace-nowrap cursor-pointer ${
            isRunning
              ? 'border border-[#FF5757]/50 bg-[#FF5757]/15 text-[#FF5757] hover:bg-[#FF5757]/25'
              : 'bg-[#CCFF00] text-[#0A0C10] hover:bg-[#d8ff33]'
          }`}
        >
          {isRunning ? (
            <>
              <Pause className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>Pause Breathwork</span>
            </>
          ) : (
            <>
              {phase === 'idle' ? (
                <Wind className="h-4 w-4 shrink-0" aria-hidden="true" />
              ) : (
                <Play className="h-4 w-4 shrink-0" aria-hidden="true" />
              )}
              <span>{phase === 'idle' ? 'Start 4-7-8 Reset' : 'Resume Reset'}</span>
            </>
          )}
        </button>
      </div>
    </section>
  );
};
