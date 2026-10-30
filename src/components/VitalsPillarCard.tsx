import React from 'react';
import { Droplets, Footprints, Minus, Plus } from 'lucide-react';

interface VitalsPillarCardProps {
  stepsCount: number;
  stepsTarget: number;
  waterGlasses: number;
  waterTarget: number;
  onAdjustWater: (delta: number) => Promise<void>;
  onSelectWaterGlass: (targetGlasses: number) => Promise<void>;
  onAddSteps: (deltaSteps: number) => Promise<void>;
}

export const VitalsPillarCard: React.FC<VitalsPillarCardProps> = ({
  stepsCount,
  stepsTarget,
  waterGlasses,
  waterTarget,
  onAdjustWater,
  onSelectWaterGlass,
  onAddSteps,
}) => {
  const stepRatio = Math.min(100, Math.round((stepsCount / Math.max(1, stepsTarget)) * 100));
  const hydrationLiters = (waterGlasses * 0.25).toFixed(2);
  const targetLiters = (waterTarget * 0.25).toFixed(1);
  const activeCaloriesBurned = Math.round(stepsCount * 0.044);

  const handleGlassTap = async (glassNumber: number) => {
    if (waterGlasses === glassNumber) {
      await onSelectWaterGlass(glassNumber - 1);
    } else {
      await onSelectWaterGlass(glassNumber);
    }
  };

  return (
    <section
      id="pillar-vitals"
      aria-labelledby="pillar-vitals-heading"
      className="flex flex-col justify-between rounded-2xl border border-[#252B3B] bg-[#161922] p-4 sm:p-6 min-w-0"
    >
      <div>
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-[#94A3B8]">
              04. Movement &amp; Hydration · Daily NEAT
            </p>
            <h2
              id="pillar-vitals-heading"
              className="mt-1 font-display text-lg sm:text-xl font-bold text-white"
            >
              Steps &amp; Interactive Hydration
            </h2>
          </div>
          <span className="font-mono text-xs font-semibold text-[#00E5FF] tabular-nums shrink-0">
            {stepRatio}% goal
          </span>
        </div>

        {/* Live Step Progress Section */}
        <div className="mt-5 rounded-xl bg-[#0A0C10] p-3.5 sm:p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#161922] text-[#CCFF00]">
                <Footprints className="h-5 w-5" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <span className="block text-xs text-[#94A3B8]">Live Step Progress</span>
                <span className="font-mono text-lg sm:text-xl font-bold text-white tabular-nums">
                  {stepsCount.toLocaleString()}{' '}
                  <span className="text-xs font-normal text-[#94A3B8]">
                    / {stepsTarget.toLocaleString()}
                  </span>
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onAddSteps(500)}
              className="min-h-[44px] rounded-xl border border-[#252B3B] bg-[#161922] px-3.5 py-2 font-mono text-xs font-semibold text-white transition-colors hover:border-[#CCFF00] hover:text-[#CCFF00] cursor-pointer whitespace-nowrap shrink-0 tabular-nums"
            >
              +500 Steps
            </button>
          </div>

          <div className="mt-3.5 h-2.5 w-full overflow-hidden rounded-full bg-[#161922]">
            <div
              className="h-full rounded-full bg-[#CCFF00] transition-transform duration-300 origin-left"
              style={{ transform: `scaleX(${stepRatio / 100})` }}
            />
          </div>
        </div>

        {/* Interactive Clickable Glass Water Tracker */}
        <div className="mt-4 sm:mt-5 rounded-xl bg-[#0A0C10] p-3.5 sm:p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <span className="block text-xs text-[#94A3B8]">
                Tap any glass to set hydration (250ml)
              </span>
              <span className="font-mono text-base sm:text-lg font-bold text-white tabular-nums">
                {waterGlasses} / {waterTarget} glasses{' '}
                <span className="text-xs font-normal text-[#00E5FF]">
                  ({hydrationLiters}L / {targetLiters}L)
                </span>
              </span>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                aria-label="Remove one glass of water"
                disabled={waterGlasses <= 0}
                onClick={() => onAdjustWater(-1)}
                className="flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-[#252B3B] bg-[#161922] text-white transition-colors hover:border-[#FF5757] hover:text-[#FF5757] disabled:opacity-40 cursor-pointer"
              >
                <Minus className="h-4 w-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                aria-label="Add one glass of water"
                onClick={() => onAdjustWater(1)}
                className="flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-xl bg-[#00E5FF] text-[#0A0C10] transition-colors hover:bg-[#33ecff] cursor-pointer"
              >
                <Plus className="h-4 w-4 stroke-[2.5]" aria-hidden="true" />
              </button>
            </div>
          </div>

          {/* 8 Interactive Fluid Glass Buttons (4x2 on Mobile/Tablet, 8x1 on Wide Desktop) */}
          <div className="mt-4 grid grid-cols-4 xl:grid-cols-8 gap-2">
            {Array.from({ length: waterTarget }).map((_, idx) => {
              const glassNum = idx + 1;
              const isFilled = glassNum <= waterGlasses;
              return (
                <button
                  key={glassNum}
                  type="button"
                  onClick={() => handleGlassTap(glassNum)}
                  aria-label={`Set water intake to ${glassNum} glasses (${glassNum * 250}ml)`}
                  aria-pressed={isFilled}
                  className={`group relative flex min-h-[48px] flex-col items-center justify-center rounded-xl border transition-all duration-200 cursor-pointer ${
                    isFilled
                      ? 'border-[#00E5FF]/70 bg-[#00E5FF]/15 text-[#00E5FF] shadow-[0_0_14px_rgba(0,229,255,0.18)]'
                      : 'border-[#252B3B] bg-[#161922] text-[#64748B] hover:border-[#00E5FF]/40 hover:text-white'
                  }`}
                >
                  <Droplets
                    className={`h-4 w-4 transition-transform duration-200 ${
                      isFilled ? 'scale-110 text-[#00E5FF]' : 'group-hover:scale-105'
                    }`}
                    aria-hidden="true"
                  />
                  <span className="mt-1 font-mono text-[10px] font-semibold tabular-nums">
                    {glassNum}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Summary Footer */}
      <div className="mt-6 pt-4 border-t border-[#252B3B] flex flex-wrap items-center justify-between gap-2 text-xs text-[#94A3B8]">
        <span>Active NEAT caloric expenditure</span>
        <span className="font-mono font-semibold text-white tabular-nums">
          {activeCaloriesBurned} kcal burned
        </span>
      </div>
    </section>
  );
};
