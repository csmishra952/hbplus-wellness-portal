import React, { useState } from 'react';
import { Check, Droplets, Plus, Utensils, X, Zap } from 'lucide-react';
import { MealPreset } from '../context/AuthContext';

interface NutritionPillarCardProps {
  caloriesConsumed: number;
  caloriesTarget: number;
  proteinGrams: number;
  proteinTarget: number;
  carbsGrams: number;
  carbsTarget: number;
  fatsGrams: number;
  fatsTarget: number;
  onLogMeal: (meal: MealPreset) => Promise<void>;
  onQuickWater500ml: () => Promise<void>;
}

const QUICK_MEALS: MealPreset[] = [
  {
    label: 'Whey Isolate & Oats Shake',
    calories: 340,
    protein: 32,
    carbs: 42,
    fats: 5,
  },
  {
    label: 'Grilled Salmon & Quinoa Bowl',
    calories: 520,
    protein: 40,
    carbs: 48,
    fats: 18,
  },
  {
    label: 'Greek Yogurt, Berries & Almonds',
    calories: 260,
    protein: 22,
    carbs: 20,
    fats: 10,
  },
];

const PROTEIN_SNACK_PRESET: MealPreset = {
  label: '25g Isolate Protein Snack',
  calories: 130,
  protein: 25,
  carbs: 4,
  fats: 1,
};

interface ResponsiveMacroRingProps {
  label: string;
  current: number;
  target: number;
  pct: number;
  strokeColor: string;
  textColorClass: string;
}

const ResponsiveMacroRing: React.FC<ResponsiveMacroRingProps> = ({
  label,
  current,
  target,
  pct,
  strokeColor,
  textColorClass,
}) => {
  const viewSize = 100;
  const strokeWidth = 8;
  const radius = (viewSize - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedRatio = Math.min(1, Math.max(0, pct / 100));
  const dashOffset = circumference * (1 - clampedRatio);

  return (
    <div className="flex flex-col items-center text-center min-w-[78px]">
      {/* Scales smoothly from ~72px on 360px mobile up to ~96px on desktop */}
      <div className="relative h-[72px] w-[72px] sm:h-[88px] sm:w-[88px] xl:h-[96px] xl:w-[96px] flex items-center justify-center">
        <svg
          className="h-full w-full -rotate-90"
          viewBox={`0 0 ${viewSize} ${viewSize}`}
          aria-hidden="true"
        >
          <circle
            cx={viewSize / 2}
            cy={viewSize / 2}
            r={radius}
            fill="transparent"
            stroke="#0A0C10"
            strokeWidth={strokeWidth}
          />
          <circle
            cx={viewSize / 2}
            cy={viewSize / 2}
            r={radius}
            fill="transparent"
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            className="transition-all duration-300"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center px-1">
          <span className="font-mono text-xs sm:text-sm font-bold text-white tabular-nums leading-none">
            {current}g
          </span>
          <span className="mt-0.5 font-mono text-[9px] sm:text-[10px] text-[#94A3B8] tabular-nums leading-none">
            / {target}g
          </span>
        </div>
      </div>

      <span className="mt-2 text-xs font-semibold text-white">{label}</span>
      <span className={`font-mono text-[11px] font-semibold tabular-nums ${textColorClass}`}>
        {pct}%
      </span>
    </div>
  );
};

export const NutritionPillarCard: React.FC<NutritionPillarCardProps> = ({
  caloriesConsumed,
  caloriesTarget,
  proteinGrams,
  proteinTarget,
  carbsGrams,
  carbsTarget,
  fatsGrams,
  fatsTarget,
  onLogMeal,
  onQuickWater500ml,
}) => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [quickToast, setQuickToast] = useState<string | null>(null);
  const [customMealName, setCustomMealName] = useState('');
  const [customProtein, setCustomProtein] = useState('28');
  const [customCarbs, setCustomCarbs] = useState('35');
  const [customFats, setCustomFats] = useState('9');

  const remainingCalories = Math.max(0, caloriesTarget - caloriesConsumed);
  const overCalories = Math.max(0, caloriesConsumed - caloriesTarget);
  const caloriePct = Math.min(
    100,
    Math.round((caloriesConsumed / Math.max(1, caloriesTarget)) * 100)
  );

  const proteinPct = Math.round((proteinGrams / Math.max(1, proteinTarget)) * 100);
  const carbsPct = Math.round((carbsGrams / Math.max(1, carbsTarget)) * 100);
  const fatsPct = Math.round((fatsGrams / Math.max(1, fatsTarget)) * 100);

  const triggerFeedback = (message: string) => {
    setQuickToast(message);
    window.setTimeout(() => {
      setQuickToast((current) => (current === message ? null : current));
    }, 2400);
  };

  const handleQuickProteinSnack = async () => {
    await onLogMeal(PROTEIN_SNACK_PRESET);
    triggerFeedback('Logged +25g Protein Snack (+130 kcal)');
  };

  const handleQuickHydration = async () => {
    await onQuickWater500ml();
    triggerFeedback('Logged +500ml Electrolyte Hydration');
  };

  const handleCustomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const p = Math.max(0, Math.min(200, Number(customProtein) || 0));
    const c = Math.max(0, Math.min(300, Number(customCarbs) || 0));
    const f = Math.max(0, Math.min(150, Number(customFats) || 0));
    const kcal = p * 4 + c * 4 + f * 9;
    if (kcal <= 0) return;

    const label = customMealName.trim() || 'Custom Macro Entry';
    await onLogMeal({
      label,
      calories: kcal,
      protein: p,
      carbs: c,
      fats: f,
    });
    setCustomMealName('');
    setDrawerOpen(false);
    triggerFeedback(`Logged ${label} (+${kcal} kcal)`);
  };

  return (
    <section
      id="pillar-nutrition"
      aria-labelledby="pillar-nutrition-heading"
      className="flex flex-col justify-between rounded-2xl border border-[#252B3B] bg-[#161922] p-4 sm:p-6 min-w-0"
    >
      <div>
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-[#94A3B8]">
              02. Precision Nutrition · Metabolic Fuel
            </p>
            <h2
              id="pillar-nutrition-heading"
              className="mt-1 font-display text-lg sm:text-xl font-bold text-white"
            >
              Caloric Gauge &amp; Macro Rings
            </h2>
          </div>

          <div className="text-right shrink-0">
            <span className="block font-mono text-base sm:text-lg font-bold text-white tabular-nums">
              {caloriesConsumed.toLocaleString()}{' '}
              <span className="text-xs font-normal text-[#94A3B8]">
                / {caloriesTarget.toLocaleString()} kcal
              </span>
            </span>
            <span
              className={`text-xs font-mono tabular-nums ${
                overCalories > 0 ? 'text-[#FF5757]' : 'text-[#CCFF00]'
              }`}
            >
              {overCalories > 0
                ? `+${overCalories.toLocaleString()} kcal surplus`
                : `${remainingCalories.toLocaleString()} kcal left`}
            </span>
          </div>
        </div>

        {/* Caloric Fuel Gauge */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs text-[#94A3B8]">
            <span>Daily Caloric Fuel Gauge</span>
            <span className="font-mono font-semibold text-white tabular-nums">{caloriePct}%</span>
          </div>
          <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-[#0A0C10]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#CCFF00] to-[#00E5FF] transition-transform duration-300 origin-left"
              style={{ transform: `scaleX(${caloriePct / 100})` }}
            />
          </div>
        </div>

        {/* 3 Responsive Macro Rings (justify-around flex row, scaling 60-72px mobile -> 80-96px desktop) */}
        <div className="mt-6 rounded-2xl bg-[#0A0C10] px-2 py-5 sm:px-4 flex flex-row flex-wrap items-center justify-around gap-3">
          <ResponsiveMacroRing
            label="Protein"
            current={proteinGrams}
            target={proteinTarget}
            pct={proteinPct}
            strokeColor="#CCFF00"
            textColorClass="text-[#CCFF00]"
          />
          <ResponsiveMacroRing
            label="Carbs"
            current={carbsGrams}
            target={carbsTarget}
            pct={carbsPct}
            strokeColor="#00E5FF"
            textColorClass="text-[#00E5FF]"
          />
          <ResponsiveMacroRing
            label="Fats"
            current={fatsGrams}
            target={fatsTarget}
            pct={fatsPct}
            strokeColor="#FF5757"
            textColorClass="text-[#FF5757]"
          />
        </div>

        {/* Instant Feedback Toast */}
        {quickToast && (
          <div
            role="status"
            className="mt-3 flex items-center gap-2 rounded-xl border border-[#CCFF00]/30 bg-[#0A0C10] px-3.5 py-2 text-xs font-medium text-[#CCFF00]"
          >
            <Check className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span className="break-words">{quickToast}</span>
          </div>
        )}

        {/* Expandable Custom & Preset Meal Logger */}
        {drawerOpen && (
          <div className="mt-4 border-t border-[#252B3B] pt-4">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-white">
                Select Clinical Meal or Macro Entry
              </span>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                aria-label="Close meal logger"
                className="flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center text-[#94A3B8] hover:text-white cursor-pointer shrink-0"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-2 space-y-2">
              {QUICK_MEALS.map((meal) => (
                <button
                  key={meal.label}
                  type="button"
                  onClick={async () => {
                    await onLogMeal(meal);
                    setDrawerOpen(false);
                    triggerFeedback(`Logged ${meal.label} (+${meal.calories} kcal)`);
                  }}
                  className="flex w-full min-h-[46px] flex-wrap items-center justify-between gap-2 rounded-xl border border-[#252B3B] bg-[#0A0C10] px-3.5 py-2.5 text-left transition-colors hover:border-[#CCFF00]/60 cursor-pointer"
                >
                  <span className="text-xs font-medium text-white min-w-0">{meal.label}</span>
                  <span className="font-mono text-[11px] sm:text-xs text-[#94A3B8] tabular-nums whitespace-nowrap">
                    +{meal.calories} kcal · {meal.protein}P / {meal.carbs}C / {meal.fats}F
                  </span>
                </button>
              ))}
            </div>

            <form onSubmit={handleCustomSubmit} className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
              <input
                type="text"
                maxLength={60}
                value={customMealName}
                onChange={(e) => setCustomMealName(e.target.value)}
                placeholder="Custom meal description"
                className="col-span-2 sm:col-span-4 min-h-[44px] rounded-lg border border-[#252B3B] bg-[#0A0C10] px-3 py-2 text-xs text-white placeholder-[#64748B] focus:border-[#CCFF00] focus:outline-none"
              />
              <label className="flex flex-col text-[11px] text-[#94A3B8]">
                Protein (g)
                <input
                  type="number"
                  min={0}
                  max={200}
                  value={customProtein}
                  onChange={(e) => setCustomProtein(e.target.value)}
                  className="mt-1 min-h-[42px] rounded-lg border border-[#252B3B] bg-[#0A0C10] px-2.5 py-1.5 font-mono text-xs text-white tabular-nums focus:border-[#CCFF00] focus:outline-none"
                />
              </label>
              <label className="flex flex-col text-[11px] text-[#94A3B8]">
                Carbs (g)
                <input
                  type="number"
                  min={0}
                  max={300}
                  value={customCarbs}
                  onChange={(e) => setCustomCarbs(e.target.value)}
                  className="mt-1 min-h-[42px] rounded-lg border border-[#252B3B] bg-[#0A0C10] px-2.5 py-1.5 font-mono text-xs text-white tabular-nums focus:border-[#CCFF00] focus:outline-none"
                />
              </label>
              <label className="flex flex-col text-[11px] text-[#94A3B8]">
                Fats (g)
                <input
                  type="number"
                  min={0}
                  max={150}
                  value={customFats}
                  onChange={(e) => setCustomFats(e.target.value)}
                  className="mt-1 min-h-[42px] rounded-lg border border-[#252B3B] bg-[#0A0C10] px-2.5 py-1.5 font-mono text-xs text-white tabular-nums focus:border-[#CCFF00] focus:outline-none"
                />
              </label>
              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full min-h-[42px] rounded-lg bg-[#CCFF00] px-3 py-1.5 text-xs font-bold text-[#0A0C10] hover:bg-[#d8ff33] cursor-pointer whitespace-nowrap"
                >
                  Save Meal
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Quick Log Action Bar (Fluid Flex-Wrap) */}
      <div className="mt-6 pt-4 border-t border-[#252B3B] flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex flex-wrap items-center gap-2 flex-1 sm:flex-initial">
          <button
            type="button"
            onClick={handleQuickProteinSnack}
            className="min-h-[44px] flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#CCFF00]/40 bg-[#CCFF00]/10 px-3 py-2 font-mono text-xs font-semibold text-[#CCFF00] transition-colors hover:bg-[#CCFF00]/20 cursor-pointer whitespace-nowrap tabular-nums"
          >
            <Zap className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>+25g Protein Snack</span>
          </button>

          <button
            type="button"
            onClick={handleQuickHydration}
            className="min-h-[44px] flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#252B3B] bg-[#0A0C10] px-3 py-2 font-mono text-xs font-semibold text-white transition-colors hover:border-[#00E5FF] hover:text-[#00E5FF] cursor-pointer whitespace-nowrap tabular-nums"
          >
            <Droplets className="h-3.5 w-3.5 text-[#00E5FF] shrink-0" aria-hidden="true" />
            <span>+500ml Hydration</span>
          </button>
        </div>

        <button
          type="button"
          onClick={() => setDrawerOpen((prev) => !prev)}
          className="w-full sm:w-auto min-h-[44px] inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#CCFF00] px-4 py-2.5 text-xs font-bold text-[#0A0C10] transition-colors hover:bg-[#d8ff33] cursor-pointer whitespace-nowrap"
        >
          {drawerOpen ? (
            <>
              <Utensils className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>Close Logger</span>
            </>
          ) : (
            <>
              <Plus className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>Log Meal</span>
            </>
          )}
        </button>
      </div>
    </section>
  );
};
