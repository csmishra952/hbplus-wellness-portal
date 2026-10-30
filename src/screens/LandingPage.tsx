import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Activity,
  ArrowDown,
  ArrowRight,
  Brain,
  Check,
  Dumbbell,
  FlaskConical,
  HeartPulse,
  Lock,
  MapPin,
  Menu,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  Utensils,
  X,
  Zap,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { HB_ASSETS } from '../constants/assets';

// Bundled High-Resolution Editorial Assets (Vite production-safe)
const HERO_ATHLETE_IMAGE = HB_ASSETS.heroAthleticLongevity;
const ECO_COACHING_IMAGE = HB_ASSETS.ecoPersonalCoaching;
const ECO_LABS_IMAGE = HB_ASSETS.ecoDiagnosticLabs;
const ECO_NUTRITION_IMAGE = HB_ASSETS.ecoSmartNutrition;
const ECO_RECOVERY_IMAGE = HB_ASSETS.ecoRecoverySanctuary;
const HOP_STUDIO_IMAGE = HB_ASSETS.hopStudioBhubaneswar;

const COACH_STRENGTH_AVATAR = HB_ASSETS.avatarAdminCoach;
const COACH_NUTRITION_AVATAR = HB_ASSETS.coachNutritionSpecialist;
const COACH_MINDSET_AVATAR = HB_ASSETS.coachMindsetSpecialist;

type HotspotId = 'mind' | 'gut' | 'force';

interface BiomarkerMetric {
  label: string;
  value: string;
  unit: string;
  delta: string;
  progress: number;
}

interface HotspotConfig {
  id: HotspotId;
  code: string;
  title: string;
  subtitle: string;
  description: string;
  accentColor: string;
  coordinates: { cx: number; cy: number };
  metrics: BiomarkerMetric[];
  curvePoints: string;
  protocolNote: string;
}

const DIGITAL_TWIN_HOTSPOTS: Record<HotspotId, HotspotConfig> = {
  mind: {
    id: 'mind',
    code: 'SYS-01 · AUTONOMIC & NEURAL',
    title: 'Mind & Autonomic Nervous System',
    subtitle: '4-7-8 guided downregulation, stress resilience, circadian sleep depth.',
    description:
      'Quantifies parasympathetic rebound after high-intensity CNS load using nocturnal heart-rate variability, respiratory sinus arrhythmia, and deep-sleep spindle architecture.',
    accentColor: '#00E5FF',
    coordinates: { cx: 160, cy: 64 },
    metrics: [
      {
        label: 'Nocturnal HRV Balance',
        value: '78',
        unit: 'ms',
        delta: '+14 ms vs 30d baseline',
        progress: 0.88,
      },
      {
        label: 'Restorative Sleep Depth',
        value: '91.4',
        unit: '%',
        delta: '1h 54m Slow-Wave + REM',
        progress: 0.91,
      },
      {
        label: '4-7-8 Vagal Recovery Index',
        value: '9.4',
        unit: '/ 10',
        delta: 'Optimal cortisol clearance',
        progress: 0.94,
      },
    ],
    curvePoints: '0,68 45,62 90,54 135,48 180,35 225,26 270,18',
    protocolNote: 'Prescribed: 4 rounds of 4-7-8 nasal cadence post-training & 60m pre-sleep.',
  },
  gut: {
    id: 'gut',
    code: 'SYS-02 · METABOLIC & ENTERIC',
    title: 'Metabolic & Gut Core',
    subtitle: 'Microbiome diversity, glycemic control, macro absorption telemetry.',
    description:
      'Aligns daily macronutrient intake (Protein, Carbs, Essential Fats) with post-prandial glycemic stability, digestive enzyme efficiency, and anti-inflammatory gut barrier integrity.',
    accentColor: '#CCFF00',
    coordinates: { cx: 160, cy: 196 },
    metrics: [
      {
        label: 'Glycemic Variability Score',
        value: '86',
        unit: 'mg/dL',
        delta: '96% time-in-tight-range',
        progress: 0.95,
      },
      {
        label: 'Microbiome Diversity Tier',
        value: '94.2',
        unit: 'pct',
        delta: '+28% short-chain fatty acids',
        progress: 0.94,
      },
      {
        label: 'Bioavailable Protein Uptake',
        value: '160',
        unit: 'g/day',
        delta: '4×40g leucine-threshold boluses',
        progress: 0.86,
      },
    ],
    curvePoints: '0,72 45,65 90,51 135,44 180,38 225,24 270,15',
    protocolNote:
      'Prescribed: 2,350 kcal recomposition split (160g P · 210g C · 65g F) + 2.5L electrolytes.',
  },
  force: {
    id: 'force',
    code: 'SYS-03 · KINETIC & HYPERTROPHY',
    title: 'Musculoskeletal Force',
    subtitle: 'Push/Pull hypertrophy, explosive power output, joint longevity.',
    description:
      'Tracks mechanical tension volume, bar-velocity fatigue thresholds, bilateral force symmetry, and connective tissue resilience across periodized hypertrophy mesocycles.',
    accentColor: '#CCFF00',
    coordinates: { cx: 112, cy: 142 },
    metrics: [
      {
        label: 'Relative Force Output',
        value: '+18.6',
        unit: '%',
        delta: '12-week progressive overload',
        progress: 0.89,
      },
      {
        label: 'VO2 Max Longevity Index',
        value: '54.8',
        unit: 'mL/kg',
        delta: 'Top 5% age-adjusted cohort',
        progress: 0.92,
      },
      {
        label: 'Bilateral Joint Symmetry',
        value: '98.4',
        unit: '%',
        delta: 'Zero compensatory torque drift',
        progress: 0.98,
      },
    ],
    curvePoints: '0,74 45,66 90,59 135,45 180,34 225,25 270,14',
    protocolNote: 'Prescribed: Push / Pull / Legs 4-Exercise Hypertrophy Split @ RIR 1–2.',
  },
};

interface EcosystemCardItem {
  number: string;
  title: string;
  description: string;
  metricTag: string;
  image: string;
  ctaLabel: string;
  actionType: 'consult' | 'diagnostics' | 'portal' | 'studio';
}

const ECOSYSTEM_CARDS: EcosystemCardItem[] = [
  {
    number: '01',
    title: 'Elite Personal Coaching',
    description: 'Backed by certified exercise physiologists and performance coaches.',
    metricTag: '1:1 Periodized Programming · Weekly Video Form Audits',
    image: ECO_COACHING_IMAGE,
    ctaLabel: 'Meet Coaching Team',
    actionType: 'consult',
  },
  {
    number: '02',
    title: 'Diagnostic Labs & Biomarkers',
    description:
      'Know your body from within — lipid profiles, hormonal balance & metabolic panels.',
    metricTag: '65+ Clinical Blood & Metabolic Markers Tracked Quarterly',
    image: ECO_LABS_IMAGE,
    ctaLabel: 'Inspect Biomarkers',
    actionType: 'diagnostics',
  },
  {
    number: '03',
    title: 'Smart Habit & Nutrition Architecture',
    description: 'Precision macros engineered for fuel, recovery, and cognitive focus.',
    metricTag: '160g Protein · 210g Carbs · 65g Healthy Fats Telemetry',
    image: ECO_NUTRITION_IMAGE,
    ctaLabel: 'Open Nutrition Portal',
    actionType: 'portal',
  },
  {
    number: '04',
    title: 'Hop Studio & Recovery Lounge',
    description: 'Infrared therapy, guided breathwork, and community strength.',
    metricTag: 'Bhubaneswar Flagship Sanctuary + Global Digital App',
    image: ECO_RECOVERY_IMAGE,
    ctaLabel: 'Explore Hop Studio',
    actionType: 'studio',
  },
];

const COACH_ROSTER = [
  {
    name: 'Coach Marcus Vance',
    specialty: 'Head of Strength & Biomechanics',
    credentials: 'CSCS · M.S. Exercise Physiology',
    stat: '+18.6% avg compound strength gain in 12 weeks',
    avatar: COACH_STRENGTH_AVATAR,
    initials: 'MV',
  },
  {
    name: 'Dr. Priya Sharma',
    specialty: 'Clinical Nutrition & Gut Longevity',
    credentials: 'M.Sc. Clinical Sports Nutrition · Metabolic Diagnostics',
    stat: '94.2% long-term metabolic adherence without crash dieting',
    avatar: COACH_NUTRITION_AVATAR,
    initials: 'PS',
  },
  {
    name: 'Arjun Mehta',
    specialty: 'Autonomic Breathwork & Mindset',
    credentials: 'HRV Biofeedback & Parasympathetic Specialist',
    stat: '+14 ms average nocturnal HRV improvement',
    avatar: COACH_MINDSET_AVATAR,
    initials: 'AM',
  },
];

export const LandingPage: React.FC = () => {
  const { profile, navigateToRoute } = useAuth();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeHotspot, setActiveHotspot] = useState<HotspotId>('mind');
  const [liveBpm, setLiveBpm] = useState<number>(72);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  // Quick-Consult Coach Modal state
  const [consultModalOpen, setConsultModalOpen] = useState(false);
  const [consultGoal, setConsultGoal] = useState('Strength & Hypertrophy');
  const [consultEmail, setConsultEmail] = useState('');
  const [consultError, setConsultError] = useState('');
  const [consultSubmitted, setConsultSubmitted] = useState(false);

  // Footer Policy Notice state
  const [footerNotice, setFooterNotice] = useState<'privacy' | 'encryption' | null>(null);

  // Lock background scroll while full-screen mobile drawer is open
  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.body.style.overflow = mobileMenuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  // Subtle live biometric heart-rate stream (70–74 BPM)
  useEffect(() => {
    const interval = window.setInterval(() => {
      setLiveBpm((prev) => {
        const delta = Math.random() > 0.5 ? 1 : -1;
        const next = prev + delta;
        return Math.min(74, Math.max(70, next));
      });
    }, 2600);
    return () => window.clearInterval(interval);
  }, []);

  const markImageFailed = (key: string) => {
    setFailedImages((prev) => ({ ...prev, [key]: true }));
  };

  const handlePortalNavigation = () => {
    setMobileMenuOpen(false);
    navigateToRoute(profile ? '/dashboard' : '/login');
  };

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    window.setTimeout(() => {
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 40);
  };

  const handleEcosystemAction = (actionType: EcosystemCardItem['actionType']) => {
    if (actionType === 'consult') {
      setConsultSubmitted(false);
      setConsultError('');
      setConsultModalOpen(true);
      return;
    }
    if (actionType === 'diagnostics') {
      scrollToSection('diagnostics');
      return;
    }
    if (actionType === 'studio') {
      scrollToSection('hop-studio');
      return;
    }
    handlePortalNavigation();
  };

  const handleConsultSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = consultEmail.trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(cleaned)) {
      setConsultError('Please enter a valid work or personal email address.');
      return;
    }
    setConsultError('');
    setConsultSubmitted(true);
    setConsultEmail('');
  };

  const currentHotspot = DIGITAL_TWIN_HOTSPOTS[activeHotspot];

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-[#0A0C10] text-white selection:bg-[#CCFF00] selection:text-[#0A0C10]">
      {/* Subtle Cosmic Obsidian Vertical Hairline Grid Guides & Radial Backlights */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 opacity-100"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(255, 255, 255, 0.035) 1px, transparent 1px)',
          backgroundSize: '120px 100%',
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 left-1/4 z-0 h-[420px] w-[420px] sm:h-[520px] sm:w-[520px] rounded-full bg-[#CCFF00]/[0.07] blur-[130px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-[780px] right-1/5 z-0 h-[360px] w-[360px] sm:h-[460px] sm:w-[460px] rounded-full bg-[#00E5FF]/[0.06] blur-[130px]"
      />

      {/* A. Futuristic Glass Header (Sticky Responsive Navbar) */}
      <header className="sticky top-0 z-40 border-b border-white/[0.08] bg-[#0A0C10]/90 backdrop-blur-xl pt-safe">
        <div className="mx-auto flex max-w-[1280px] items-center justify-between gap-3 px-4 py-3 md:px-7 lg:px-8 lg:gap-8">
          {/* Zone 1: Brand Logomark */}
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              setMobileMenuOpen(false);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="font-display text-2xl font-bold tracking-tight text-white whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#CCFF00]"
          >
            HB
            <span className="text-[#CCFF00] drop-shadow-[0_0_12px_rgba(204,255,0,0.55)]">+</span>
          </a>

          {/* Zone 2: Center Navigation Links (Tablet & Desktop >= 768px) */}
          <nav
            aria-label="Primary Navigation"
            className="hidden md:flex items-center gap-5 lg:gap-7 text-sm font-medium text-[#94A3B8]"
          >
            {[
              { label: 'Philosophy', id: 'philosophy' },
              { label: 'Ecosystem', id: 'ecosystem' },
              { label: 'Diagnostics', id: 'diagnostics' },
              { label: 'Smart Tech', id: 'smart-tech' },
              { label: 'Coaches', id: 'coaches' },
            ].map((navItem) => (
              <a
                key={navItem.id}
                href={`#${navItem.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  scrollToSection(navItem.id);
                }}
                className="hover:text-white hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
              >
                {navItem.label}
              </a>
            ))}
          </nav>

          {/* Zone 3: Responsive Right Controls */}
          <div className="flex items-center gap-2.5 sm:gap-3.5 shrink-0">
            {/* Desktop (>= 768px) Full Portal CTA */}
            <button
              type="button"
              onClick={handlePortalNavigation}
              className="hidden md:inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-[#CCFF00] px-4 py-2.5 text-xs font-bold text-[#0A0C10] transition-transform duration-150 hover:bg-[#d8ff33] active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#CCFF00] whitespace-nowrap shrink-0 cursor-pointer"
            >
              <span>{profile ? 'Return to Dashboard' : 'Member & Coach Portal'}</span>
              <ArrowRight className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            </button>

            {/* Mobile (< 768px) Compact Non-Colliding Portal Button + Hamburger Drawer Trigger */}
            <button
              type="button"
              onClick={handlePortalNavigation}
              className="md:hidden min-h-[44px] inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#CCFF00] px-3.5 py-2 text-xs font-bold text-[#0A0C10] transition-transform duration-150 active:scale-[0.98] whitespace-nowrap shrink-0 cursor-pointer"
            >
              <span>{profile ? 'Dashboard' : 'Portal'}</span>
              <ArrowRight className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            </button>

            <button
              type="button"
              aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={mobileMenuOpen}
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className="md:hidden flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-white/12 bg-[#161922] text-white shrink-0 cursor-pointer"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Full-Screen Animated Dark Glass Mobile Navigation Drawer (< 768px) */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-x-0 top-[68px] bottom-0 z-50 md:hidden bg-[#0A0C10]/96 backdrop-blur-2xl border-t border-white/10 flex flex-col justify-between px-4 pt-5 pb-8 pb-safe overflow-y-auto"
          >
            <nav aria-label="Mobile Navigation Drawer" className="space-y-1.5">
              {[
                { label: 'Philosophy & Longevity', id: 'philosophy' },
                { label: 'Body Intelligence & Biomarkers', id: 'diagnostics' },
                { label: 'The 4-Pillar Ecosystem', id: 'ecosystem' },
                { label: 'Certified Coaches & Hop Studio', id: 'coaches' },
                { label: 'Enterprise Workspace Security', id: 'smart-tech' },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => scrollToSection(item.id)}
                  className="flex w-full min-h-[52px] items-center justify-between rounded-2xl border border-white/[0.06] bg-[#161922]/80 px-4 py-3 text-left text-base font-semibold text-white hover:border-[#CCFF00]/50 transition-colors cursor-pointer"
                >
                  <span className="min-w-0 pr-2">{item.label}</span>
                  <ArrowRight className="h-4 w-4 text-[#CCFF00] shrink-0" aria-hidden="true" />
                </button>
              ))}
            </nav>

            <div className="mt-6 pt-5 border-t border-white/10 space-y-3">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setConsultSubmitted(false);
                  setConsultError('');
                  setConsultModalOpen(true);
                }}
                className="flex w-full min-h-[48px] items-center justify-center gap-2 rounded-xl border border-[#00E5FF]/40 bg-[#00E5FF]/10 px-4 py-3 text-sm font-semibold text-[#00E5FF] cursor-pointer"
              >
                <MessageSquare className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>Talk to an HB+ Specialist</span>
              </button>

              <button
                type="button"
                onClick={handlePortalNavigation}
                className="flex w-full min-h-[52px] items-center justify-center gap-2.5 rounded-xl bg-[#CCFF00] px-5 py-3.5 text-sm font-bold text-[#0A0C10] cursor-pointer"
              >
                <Lock className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{profile ? 'Return to Member Dashboard' : 'Member & Coach Sign In'}</span>
                <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="relative z-10">
        {/* B. Hero Section: Dynamic Responsive Scaling & Reflow */}
        <section
          id="philosophy"
          className="mx-auto max-w-[1280px] px-4 pt-8 pb-14 md:px-7 md:pt-12 md:pb-20 lg:px-8 lg:pt-16 lg:pb-24"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch gap-8 md:gap-10 lg:gap-12">
            {/* Left Column: Fluid Typography, Responsive Stacked/Row CTAs & Trust Strip */}
            <div className="lg:col-span-7 flex flex-col justify-center min-w-0">
              <p className="text-xs sm:text-sm font-semibold tracking-wider text-[#CCFF00] flex flex-wrap items-center gap-x-1.5 gap-y-1">
                <span>The Integrated Wellness Ecosystem</span>
                <span className="text-[#64748B]" aria-hidden="true">
                  ·
                </span>
                <span className="text-[#94A3B8]">Body | Mind | Gut</span>
              </p>

              <h1
                className="mt-3 sm:mt-4 font-display font-bold tracking-tight text-white text-[32px] leading-[38px] sm:text-[44px] sm:leading-[50px] lg:text-[56px] lg:leading-[64px] break-words"
                style={{ textWrap: 'balance' }}
              >
                Peak Performance Meets Measurable Longevity.
              </h1>

              <p className="mt-4 sm:mt-5 max-w-2xl text-sm sm:text-base lg:text-lg text-[#94A3B8] leading-relaxed">
                The choices we make shape our vitality. HB+ unifies hyper-personalized strength
                programming, precision gut nutrition, and autonomic nervous system regulation into
                one clinical platform.
              </p>

              {/* Hero Action Buttons: Full-Width Vertical Stack on Mobile, Row on Tablet/Desktop */}
              <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 sm:gap-4 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handlePortalNavigation}
                  className="w-full sm:w-auto min-h-[50px] inline-flex items-center justify-center gap-2.5 rounded-xl bg-[#CCFF00] px-6 sm:px-7 py-3.5 text-sm font-bold text-[#0A0C10] transition-transform duration-150 hover:bg-[#d8ff33] active:scale-[0.99] whitespace-nowrap cursor-pointer"
                >
                  <span>{profile ? 'Open Member Dashboard' : 'Enter Member Portal'}</span>
                  <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
                </button>

                <button
                  type="button"
                  onClick={() => scrollToSection('diagnostics')}
                  className="w-full sm:w-auto min-h-[50px] inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-[#161922] px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:border-[#00E5FF]/60 hover:text-[#00E5FF] whitespace-nowrap cursor-pointer"
                >
                  <span>Explore Biomarkers</span>
                  <ArrowDown className="h-4 w-4 text-[#00E5FF] shrink-0" aria-hidden="true" />
                </button>
              </div>

              {/* Reassuring Enterprise Privacy & Clinical Trust Strip */}
              <div className="mt-7 sm:mt-8 pt-5 sm:pt-6 border-t border-white/[0.08] flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-[#94A3B8]">
                <span className="inline-flex items-center gap-1.5 min-w-0">
                  <ShieldCheck className="h-4 w-4 text-[#CCFF00] shrink-0" aria-hidden="true" />
                  <span>Enterprise-Grade Privacy &amp; Security</span>
                </span>
                <span className="hidden sm:inline text-[#475569]" aria-hidden="true">
                  ·
                </span>
                <span className="inline-flex items-center gap-1.5 min-w-0">
                  <Lock className="h-3.5 w-3.5 text-[#00E5FF] shrink-0" aria-hidden="true" />
                  <span>HB+ Verified Health Ecosystem</span>
                </span>
                <span className="hidden sm:inline text-[#475569]" aria-hidden="true">
                  ·
                </span>
                <span className="inline-flex items-center gap-1.5 min-w-0">
                  <Sparkles className="h-3.5 w-3.5 text-[#CCFF00] shrink-0" aria-hidden="true" />
                  <span>ISO-Grade HIPAA &amp; Workspace Encrypted</span>
                </span>
              </div>
            </div>

            {/* Right Column: Dynamic Hero Showcase with Layered Holographic Telemetry */}
            <div className="lg:col-span-5 relative min-h-[380px] sm:min-h-[480px] flex items-stretch min-w-0">
              <div className="relative w-full overflow-hidden rounded-3xl border border-white/10 bg-[#161922]">
                {!failedImages.hero ? (
                  <img
                    src={HERO_ATHLETE_IMAGE}
                    alt="Athlete performing overhead barbell strength training in HB+ studio"
                    referrerPolicy="no-referrer"
                    onError={() => markImageFailed('hero')}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full bg-gradient-to-br from-[#161C28] via-[#0F1219] to-[#0A0C10] flex items-center justify-center">
                    <Dumbbell className="h-20 w-20 text-[#CCFF00]/25" aria-hidden="true" />
                  </div>
                )}

                {/* Measured Contrast Scrim */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0A0C10] via-[#0A0C10]/30 to-[#0A0C10]/20" />

                {/* Floating Holographic Telemetry Card 1 (Top) */}
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className="absolute top-3.5 right-3.5 left-3.5 sm:left-auto sm:w-[272px] rounded-2xl border border-white/15 bg-[#0A0C10]/85 backdrop-blur-md p-3 sm:p-3.5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-1.5">
                    <span className="text-[11px] font-semibold text-[#94A3B8]">
                      Recovery: <strong className="text-[#CCFF00]">92% Optimal</strong>
                    </span>
                    <span className="inline-flex items-center gap-1 font-mono text-[11px] font-semibold text-[#00E5FF] tabular-nums">
                      <HeartPulse className="h-3.5 w-3.5 text-[#FF5757]" aria-hidden="true" />
                      {liveBpm} BPM
                    </span>
                  </div>
                  <p className="mt-1 font-mono text-xs text-white tabular-nums">
                    HRV 78 ms · Parasympathetic Peak
                  </p>
                </motion.div>

                {/* Floating Holographic Telemetry Card 2 (Bottom) */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className="absolute bottom-3.5 left-3.5 right-3.5 sm:right-auto sm:w-[292px] rounded-2xl border border-white/15 bg-[#0A0C10]/85 backdrop-blur-md p-3.5 sm:p-4"
                >
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="font-semibold text-white truncate">
                      Push Hypertrophy · Set 4 Complete
                    </span>
                    <span className="font-mono font-bold text-[#CCFF00] tabular-nums shrink-0">
                      100%
                    </span>
                  </div>
                  <p className="mt-1 font-mono text-[11px] text-[#94A3B8] tabular-nums">
                    Overhead Press · 4×8 @ 75 kg · RIR 1
                  </p>
                  <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                    <motion.div
                      initial={{ scaleX: 0.25 }}
                      animate={{ scaleX: 1 }}
                      transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                      className="h-full rounded-full bg-[#CCFF00] origin-left"
                    />
                  </div>
                </motion.div>
              </div>
            </div>
          </div>

          {/* Stat Strip: 2x2 Grid on Mobile & Tablet, 4-in-a-Row on Desktop */}
          <div className="mt-10 sm:mt-12 grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 rounded-2xl border border-white/10 bg-[#161922]/90 p-4 sm:p-6 lg:p-7">
            <div className="min-w-0 lg:border-r lg:border-white/[0.08] lg:pr-4">
              <span className="block font-mono text-xl sm:text-3xl font-bold text-white tabular-nums">
                10,000+
              </span>
              <span className="mt-1 block text-xs text-[#94A3B8]">Active Transformations</span>
            </div>
            <div className="min-w-0 lg:border-r lg:border-white/[0.08] lg:px-4">
              <span className="block font-mono text-xl sm:text-3xl font-bold text-[#CCFF00] tabular-nums">
                94.2%
              </span>
              <span className="mt-1 block text-xs text-[#94A3B8]">Metabolic Adherence</span>
            </div>
            <div className="min-w-0 pt-3 border-t border-white/[0.06] lg:pt-0 lg:border-t-0 lg:border-r lg:border-white/[0.08] lg:px-4">
              <span className="block font-mono text-xl sm:text-3xl font-bold text-white tabular-nums">
                4.9 ★
              </span>
              <span className="mt-1 block text-xs text-[#94A3B8]">Certified Coach Rating</span>
            </div>
            <div className="min-w-0 pt-3 border-t border-white/[0.06] lg:pt-0 lg:border-t-0 lg:pl-4">
              <span className="block font-mono text-xl sm:text-3xl font-bold text-[#00E5FF] tabular-nums">
                256-bit
              </span>
              <span className="mt-1 block text-xs text-[#94A3B8]">
                Verified Workspace Security
              </span>
            </div>
          </div>
        </section>

        {/* C. Biometric "Body Intelligence & Longevity" Section */}
        <section
          id="diagnostics"
          className="border-t border-white/[0.08] bg-[#0D1017] py-14 md:py-20 lg:py-24"
        >
          <div className="mx-auto max-w-[1280px] px-4 md:px-7 lg:px-8">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5 lg:gap-8">
              <div className="max-w-2xl min-w-0">
                <p className="text-xs font-semibold tracking-wider text-[#00E5FF]">
                  Body Intelligence &amp; Biometric Telemetry
                </p>
                <h2
                  className="mt-2 font-display text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-white"
                  style={{ textWrap: 'balance' }}
                >
                  Monitor and Maximize Your Healthspan.
                </h2>
                <p className="mt-2.5 sm:mt-3 text-sm sm:text-base text-[#94A3B8]">
                  Select any physiological hotspot on the biometric model below to inspect how HB+
                  synchronizes nervous system recovery, gut metabolism, and muscular force.
                </p>
              </div>

              {/* Horizontal Swipeable Hotspot Selector (Zero Clipping on Mobile) */}
              <div className="-mx-4 px-4 md:mx-0 md:px-0 overflow-x-auto no-scrollbar">
                <div className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-[#0A0C10] p-1.5 min-w-max">
                  {[
                    { id: 'mind' as HotspotId, label: 'Mind & ANS', icon: Brain },
                    { id: 'gut' as HotspotId, label: 'Metabolic & Gut', icon: FlaskConical },
                    { id: 'force' as HotspotId, label: 'Musculoskeletal', icon: Zap },
                  ].map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeHotspot === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveHotspot(tab.id)}
                        className={`min-h-[42px] inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                          isActive
                            ? 'bg-[#161922] text-[#CCFF00]'
                            : 'text-[#94A3B8] hover:text-white'
                        }`}
                      >
                        <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Responsive Split Biometric Console: Stacked on Mobile/Tablet, 2-Column on Desktop */}
            <div className="mt-8 sm:mt-10 grid grid-cols-1 lg:grid-cols-12 items-stretch gap-6 lg:gap-8">
              {/* Left/Top Column: Responsive Anatomical Digital-Twin SVG Model */}
              <div className="lg:col-span-5 rounded-3xl border border-white/10 bg-[#0A0C10] p-5 sm:p-6 flex flex-col justify-between relative overflow-hidden min-w-0">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-[#64748B] tabular-nums">
                  <span>BIOMETRIC SCAN · CALIBRATED</span>
                  <span className="text-[#00E5FF]">3 ACTIVE NODES</span>
                </div>

                {/* Responsive Aspect-Locked Body Container (max-h-340px on mobile, zero clipping) */}
                <div className="my-4 flex w-full aspect-square max-h-[310px] sm:max-h-[340px] lg:max-h-[360px] items-center justify-center mx-auto">
                  <div className="relative h-full aspect-[320/380] max-w-full flex items-center justify-center">
                    <svg
                      viewBox="0 0 320 380"
                      preserveAspectRatio="xMidYMid meet"
                      className="h-full w-full block"
                      aria-label="Human Body Intelligence Biometric Silhouette"
                    >
                      <line
                        x1="160"
                        y1="16"
                        x2="160"
                        y2="364"
                        stroke="rgba(148,163,184,0.12)"
                        strokeDasharray="4 4"
                      />
                      <line
                        x1="36"
                        y1="196"
                        x2="284"
                        y2="196"
                        stroke="rgba(148,163,184,0.12)"
                        strokeDasharray="4 4"
                      />
                      <circle
                        cx="160"
                        cy="190"
                        r="134"
                        fill="none"
                        stroke="rgba(0,229,255,0.08)"
                        strokeWidth="1"
                      />

                      <g
                        fill="rgba(22,25,34,0.82)"
                        stroke="rgba(0,229,255,0.45)"
                        strokeWidth="1.6"
                        strokeLinejoin="round"
                      >
                        <circle cx="160" cy="64" r="24" />
                        <path d="M150 88 L170 88 L173 104 L147 104 Z" />
                        <path d="M112 108 C128 102, 192 102, 208 108 L228 182 L212 188 L198 134 L194 226 L126 226 L122 134 L108 188 L92 182 Z" />
                        <path d="M126 228 L194 228 L188 352 L168 352 L160 266 L152 352 L132 352 Z" />
                      </g>

                      <path
                        d="M160 64 L160 196 M160 124 L112 142 M160 124 L208 142"
                        stroke="#CCFF00"
                        strokeOpacity="0.45"
                        strokeWidth="1.5"
                        fill="none"
                      />

                      <circle
                        cx={currentHotspot.coordinates.cx}
                        cy={currentHotspot.coordinates.cy}
                        r="22"
                        fill="none"
                        stroke={currentHotspot.accentColor}
                        strokeOpacity="0.55"
                        strokeWidth="1.5"
                      />
                    </svg>

                    {/* Hotspot 1: Mind & ANS (cx=160/320=50%, cy=64/380=16.84%) */}
                    <button
                      type="button"
                      aria-label="Inspect Mind and Autonomic Nervous System biomarkers"
                      onClick={() => setActiveHotspot('mind')}
                      style={{ top: '16.8%', left: '50%', transform: 'translate(-50%, -50%)' }}
                      className={`absolute flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-full border-2 transition-transform duration-150 hover:scale-110 cursor-pointer ${
                        activeHotspot === 'mind'
                          ? 'border-[#00E5FF] bg-[#00E5FF] text-[#0A0C10]'
                          : 'border-[#00E5FF]/60 bg-[#0A0C10]/90 text-[#00E5FF]'
                      }`}
                    >
                      <Brain className="h-4 w-4" aria-hidden="true" />
                    </button>

                    {/* Hotspot 2: Musculoskeletal Force (cx=112/320=35%, cy=142/380=37.37%) */}
                    <button
                      type="button"
                      aria-label="Inspect Musculoskeletal Force biomarkers"
                      onClick={() => setActiveHotspot('force')}
                      style={{ top: '37.4%', left: '35%', transform: 'translate(-50%, -50%)' }}
                      className={`absolute flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-full border-2 transition-transform duration-150 hover:scale-110 cursor-pointer ${
                        activeHotspot === 'force'
                          ? 'border-[#CCFF00] bg-[#CCFF00] text-[#0A0C10]'
                          : 'border-[#CCFF00]/60 bg-[#0A0C10]/90 text-[#CCFF00]'
                      }`}
                    >
                      <Zap className="h-4 w-4" aria-hidden="true" />
                    </button>

                    {/* Hotspot 3: Metabolic & Gut Core (cx=160/320=50%, cy=196/380=51.58%) */}
                    <button
                      type="button"
                      aria-label="Inspect Metabolic and Gut Core biomarkers"
                      onClick={() => setActiveHotspot('gut')}
                      style={{ top: '51.6%', left: '50%', transform: 'translate(-50%, -50%)' }}
                      className={`absolute flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-full border-2 transition-transform duration-150 hover:scale-110 cursor-pointer ${
                        activeHotspot === 'gut'
                          ? 'border-[#CCFF00] bg-[#CCFF00] text-[#0A0C10]'
                          : 'border-[#CCFF00]/60 bg-[#0A0C10]/90 text-[#CCFF00]'
                      }`}
                    >
                      <FlaskConical className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#94A3B8] border-t border-white/[0.08] pt-4">
                  <span>Tap any node on silhouette</span>
                  <span className="font-mono text-white tabular-nums">{currentHotspot.code}</span>
                </div>
              </div>

              {/* Right/Bottom Column: Telemetry Readout Card (Below on Mobile, Beside on Desktop) */}
              <div className="lg:col-span-7 rounded-3xl border border-white/10 bg-[#161922] p-5 sm:p-7 lg:p-8 flex flex-col justify-between min-w-0">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentHotspot.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.16 }}
                    className="flex-1 flex flex-col justify-between min-w-0"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-mono text-xs font-semibold text-[#00E5FF] tabular-nums">
                          {currentHotspot.code}
                        </span>
                        <Activity className="h-4 w-4 text-[#CCFF00] shrink-0" aria-hidden="true" />
                      </div>

                      <h3 className="mt-2 font-display text-xl sm:text-3xl font-bold text-white break-words">
                        {currentHotspot.title}
                      </h3>
                      <p className="mt-1 text-xs sm:text-sm font-medium text-[#CCFF00]">
                        {currentHotspot.subtitle}
                      </p>
                      <p className="mt-3 text-sm text-[#94A3B8] leading-relaxed">
                        {currentHotspot.description}
                      </p>

                      {/* 3 Animated Biomarker Cards */}
                      <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4">
                        {currentHotspot.metrics.map((metric) => (
                          <div
                            key={metric.label}
                            className="rounded-2xl border border-white/[0.08] bg-[#0A0C10] p-4 min-w-0"
                          >
                            <span className="block text-xs text-[#94A3B8]">{metric.label}</span>
                            <div className="mt-2 flex items-baseline flex-wrap">
                              <span className="font-mono text-2xl font-bold text-white tabular-nums">
                                {metric.value}
                              </span>
                              <span className="ml-1.5 font-mono text-xs text-[#94A3B8]">
                                {metric.unit}
                              </span>
                            </div>
                            <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                              <motion.div
                                initial={{ scaleX: 0 }}
                                animate={{ scaleX: metric.progress }}
                                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                                className="h-full rounded-full bg-[#CCFF00] origin-left"
                              />
                            </div>
                            <span className="mt-2 block font-mono text-[11px] text-[#00E5FF] tabular-nums">
                              {metric.delta}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* 12-Week Empirical Adaptation Trajectory Curve */}
                      <div className="mt-5 sm:mt-6 rounded-2xl border border-white/[0.08] bg-[#0A0C10] p-4">
                        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                          <span className="font-medium text-white">
                            12-Week Biomarker Adaptation Curve
                          </span>
                          <span className="font-mono text-[#CCFF00] tabular-nums">
                            Validated Trajectory
                          </span>
                        </div>
                        <svg
                          viewBox="0 0 270 84"
                          className="mt-3 h-16 w-full overflow-visible"
                          aria-hidden="true"
                        >
                          <line
                            x1="0"
                            y1="76"
                            x2="270"
                            y2="76"
                            stroke="rgba(148,163,184,0.16)"
                            strokeWidth="1"
                          />
                          <line
                            x1="0"
                            y1="42"
                            x2="270"
                            y2="42"
                            stroke="rgba(148,163,184,0.1)"
                            strokeDasharray="3 3"
                            strokeWidth="1"
                          />
                          <polyline
                            fill="none"
                            stroke="#00E5FF"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            points={currentHotspot.curvePoints}
                          />
                        </svg>
                      </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <span className="text-xs text-[#94A3B8] leading-relaxed">
                        {currentHotspot.protocolNote}
                      </span>
                      <button
                        type="button"
                        onClick={handlePortalNavigation}
                        className="min-h-[44px] inline-flex items-center gap-1.5 text-xs font-bold text-[#CCFF00] hover:underline cursor-pointer whitespace-nowrap shrink-0"
                      >
                        <span>Track in Member Portal</span>
                        <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>
        </section>

        {/* D. The 4-Pillar Ecosystem Grid (1-Col Mobile, 2-Col Tablet, 2x2 Desktop) */}
        <section id="ecosystem" className="border-t border-white/[0.08] py-14 md:py-20 lg:py-24">
          <div className="mx-auto max-w-[1280px] px-4 md:px-7 lg:px-8">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold tracking-wider text-[#CCFF00]">
                The Complete HB+ Architecture
              </p>
              <h2
                className="mt-2 font-display text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-white"
                style={{ textWrap: 'balance' }}
              >
                Clinical Diagnostics, Precision Coaching &amp; Physical Sanctuary
              </h2>
              <p className="mt-3 text-sm sm:text-base text-[#94A3B8]">
                Every pillar of your physiology is measured, coached, and refined inside one
                connected ecosystem.
              </p>
            </div>

            <div className="mt-8 sm:mt-10 grid grid-cols-1 md:grid-cols-2 gap-6">
              {ECOSYSTEM_CARDS.map((card) => {
                const imgKey = `eco-${card.number}`;
                const hasFailed = Boolean(failedImages[imgKey]);

                return (
                  <article
                    key={card.number}
                    className="group overflow-hidden rounded-3xl border border-white/10 bg-[#161922] flex flex-col justify-between transition-transform duration-200 hover:-translate-y-1 min-w-0"
                  >
                    <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#0A0C10]">
                      {!hasFailed ? (
                        <img
                          src={card.image}
                          alt={card.title}
                          referrerPolicy="no-referrer"
                          onError={() => markImageFailed(imgKey)}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="h-full w-full bg-gradient-to-br from-[#1A1F2B] to-[#0A0C10] flex items-center justify-center">
                          <Utensils className="h-12 w-12 text-[#CCFF00]/25" aria-hidden="true" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-[#161922] via-[#161922]/30 to-transparent" />
                      <div className="absolute bottom-3 left-5 right-5 flex items-center justify-between">
                        <span className="font-mono text-xs font-semibold text-[#CCFF00] tabular-nums">
                          {card.number}. HB+ MODULE
                        </span>
                      </div>
                    </div>

                    <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between min-w-0">
                      <div>
                        <h3 className="font-display text-xl sm:text-2xl font-bold text-white">
                          {card.number}. {card.title}
                        </h3>
                        <p className="mt-2 text-sm text-[#94A3B8] leading-relaxed">
                          {card.description}
                        </p>
                      </div>

                      <div className="mt-5 sm:mt-6 pt-4 border-t border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4">
                        <span className="font-mono text-xs text-[#94A3B8] leading-snug">
                          {card.metricTag}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleEcosystemAction(card.actionType)}
                          className="min-h-[44px] inline-flex items-center gap-1.5 text-xs font-bold text-white group-hover:text-[#CCFF00] transition-colors whitespace-nowrap shrink-0 cursor-pointer self-start sm:self-auto"
                        >
                          <span>{card.ctaLabel}</span>
                          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        {/* Certified Multidisciplinary Coaches & Hop Studio Spotlight */}
        <section
          id="coaches"
          className="border-t border-white/[0.08] bg-[#0D1017] py-14 md:py-20 lg:py-24"
        >
          <div className="mx-auto max-w-[1280px] px-4 md:px-7 lg:px-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-5">
              <div className="max-w-2xl">
                <p className="text-xs font-semibold tracking-wider text-[#CCFF00]">
                  Human Accountability · Clinical Precision
                </p>
                <h2
                  className="mt-2 font-display text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-white"
                  style={{ textWrap: 'balance' }}
                >
                  Guided by Exercise Physiologists, Clinical Nutritionists &amp; Mindset Leads
                </h2>
              </div>

              <button
                type="button"
                onClick={() => {
                  setConsultSubmitted(false);
                  setConsultError('');
                  setConsultModalOpen(true);
                }}
                className="w-full sm:w-auto min-h-[46px] inline-flex items-center justify-center gap-2 rounded-xl border border-[#CCFF00]/50 bg-[#CCFF00]/10 px-5 py-2.5 text-xs font-bold text-[#CCFF00] hover:bg-[#CCFF00] hover:text-[#0A0C10] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <MessageSquare className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>Book 1:1 Strategy Consult</span>
              </button>
            </div>

            <div className="mt-8 sm:mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {COACH_ROSTER.map((coach) => {
                const avatarKey = `coach-${coach.initials}`;
                const failed = Boolean(failedImages[avatarKey]);
                return (
                  <article
                    key={coach.name}
                    className="rounded-2xl border border-white/10 bg-[#161922] p-5 sm:p-6 flex flex-col justify-between min-w-0"
                  >
                    <div>
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="h-14 w-14 shrink-0 overflow-hidden rounded-full border border-white/15 bg-[#0A0C10] flex items-center justify-center">
                          {!failed ? (
                            <img
                              src={coach.avatar}
                              alt={coach.name}
                              referrerPolicy="no-referrer"
                              onError={() => markImageFailed(avatarKey)}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <span className="font-display text-sm font-bold text-[#CCFF00]">
                              {coach.initials}
                            </span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-display text-lg font-bold text-white truncate">
                            {coach.name}
                          </h3>
                          <p className="text-xs font-medium text-[#00E5FF]">{coach.specialty}</p>
                        </div>
                      </div>
                      <p className="mt-4 text-xs text-[#94A3B8]">{coach.credentials}</p>
                    </div>

                    <p className="mt-5 pt-4 border-t border-white/[0.08] font-mono text-xs text-white tabular-nums">
                      {coach.stat}
                    </p>
                  </article>
                );
              })}
            </div>

            {/* Flagship Hop Studio Architectural Highlight */}
            <div
              id="hop-studio"
              className="mt-10 sm:mt-12 grid grid-cols-1 lg:grid-cols-12 items-stretch overflow-hidden rounded-3xl border border-white/10 bg-[#161922]"
            >
              <div className="relative lg:col-span-6 min-h-[240px] sm:min-h-[320px]">
                {!failedImages.hopStudio ? (
                  <img
                    src={HOP_STUDIO_IMAGE}
                    alt="HB+ Hop Studio Bhubaneswar training floor and mindfulness lounge"
                    referrerPolicy="no-referrer"
                    onError={() => markImageFailed('hopStudio')}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full bg-gradient-to-br from-[#1A1F2B] to-[#0A0C10] flex items-center justify-center">
                    <MapPin className="h-12 w-12 text-[#CCFF00]/30" aria-hidden="true" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[#161922] via-transparent to-transparent lg:bg-gradient-to-r lg:from-transparent lg:to-[#161922]/85" />
              </div>

              <div className="lg:col-span-6 p-5 sm:p-8 lg:p-10 flex flex-col justify-between min-w-0">
                <div>
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#CCFF00]">
                    <MapPin className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>Flagship Physical Sanctuary · Bhubaneswar, India</span>
                  </div>
                  <h3 className="mt-2 font-display text-2xl sm:text-3xl font-bold text-white">
                    Hop Studio &amp; Connected Cloud Ecosystem
                  </h3>
                  <p className="mt-3 text-sm text-[#94A3B8] leading-relaxed">
                    Train on Olympic lifting platforms, unwind in cedar recovery lounges, and sync
                    every in-studio session directly with your cross-platform Web and Mobile HB+
                    profile.
                  </p>
                </div>

                <div className="mt-6 pt-5 border-t border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[#94A3B8]">
                  <span>Strength Floor · Breathwork Lounge · Clinical Assessments</span>
                  <button
                    type="button"
                    onClick={handlePortalNavigation}
                    className="min-h-[44px] inline-flex items-center gap-1.5 font-bold text-[#CCFF00] hover:underline cursor-pointer whitespace-nowrap self-start sm:self-auto"
                  >
                    <span>Member Check-In</span>
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* E. Reassuring Enterprise Security & Ecosystem Banner */}
        <section id="smart-tech" className="border-t border-white/[0.08] py-14 md:py-20 lg:py-24">
          <div className="mx-auto max-w-[1280px] px-4 md:px-7 lg:px-8">
            <div className="relative overflow-hidden rounded-3xl border border-white/12 bg-gradient-to-br from-[#161922] via-[#111520] to-[#0A0C10] p-6 sm:p-10 lg:p-12">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -right-20 -bottom-20 h-72 w-72 rounded-full bg-[#CCFF00]/10 blur-3xl"
              />

              <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6 lg:gap-8">
                <div className="max-w-2xl min-w-0">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-2xl border border-[#CCFF00]/40 bg-[#CCFF00]/12 text-[#CCFF00]">
                      <ShieldCheck className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden="true" />
                    </div>
                    <div className="text-xs font-semibold text-[#CCFF00] leading-snug">
                      Enterprise-Grade Privacy &amp; Security · ISO-Grade HIPAA &amp; Workspace
                      Encrypted
                    </div>
                  </div>

                  <h2
                    className="mt-5 font-display text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-white"
                    style={{ textWrap: 'balance' }}
                  >
                    Enterprise Workspace Integration &amp; Secure Access
                  </h2>

                  <p className="mt-3 text-sm sm:text-base text-[#94A3B8] leading-relaxed">
                    Exclusively configured for HB+ team members, certified coaches, and
                    authenticated corporate partners. Instant single sign-on with Google Workspace.
                  </p>
                </div>

                <div className="shrink-0 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={handlePortalNavigation}
                    className="w-full sm:w-auto min-h-[52px] inline-flex items-center justify-center gap-2.5 rounded-xl bg-[#CCFF00] px-7 py-3.5 text-sm font-bold text-[#0A0C10] transition-transform duration-150 hover:bg-[#d8ff33] active:scale-[0.99] whitespace-nowrap cursor-pointer"
                  >
                    <span>{profile ? 'Return to Dashboard' : 'Launch Official Portal'}</span>
                    <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* F. Dark Glassmorphism Footer */}
      <footer className="relative z-10 border-t border-white/[0.08] bg-[#07090D]/90 backdrop-blur-xl py-12 pb-safe">
        <div className="mx-auto max-w-[1280px] px-4 md:px-7 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-8 border-b border-white/[0.08]">
            <div className="md:col-span-5">
              <span className="font-display text-2xl font-bold tracking-tight text-white">
                HB<span className="text-[#CCFF00]">+</span>
              </span>
              <p className="mt-3 max-w-sm text-xs sm:text-sm text-[#94A3B8] leading-relaxed">
                Unifying biomechanics, clinical gut nutrition, and autonomic breathwork into a
                measurable human longevity platform.
              </p>
              <p className="mt-3 text-xs text-[#64748B]">
                Hop Studio Flagship · Bhubaneswar, Odisha · Global Digital Ecosystem (hbplus.fit)
              </p>
            </div>

            <div className="md:col-span-3 space-y-2.5 text-xs text-[#94A3B8]">
              <p className="font-semibold text-white">Platform</p>
              <button
                type="button"
                onClick={() => scrollToSection('diagnostics')}
                className="block py-1 hover:text-white transition-colors cursor-pointer"
              >
                Body Intelligence &amp; Biomarkers
              </button>
              <button
                type="button"
                onClick={() => scrollToSection('ecosystem')}
                className="block py-1 hover:text-white transition-colors cursor-pointer"
              >
                4-Pillar Health Ecosystem
              </button>
              <button
                type="button"
                onClick={() => scrollToSection('coaches')}
                className="block py-1 hover:text-white transition-colors cursor-pointer"
              >
                Certified Physiologists &amp; Coaches
              </button>
            </div>

            <div className="md:col-span-4 flex flex-col justify-between items-start md:items-end">
              <div className="text-left md:text-right">
                <p className="text-xs font-semibold text-white">HB+ Verified Health Ecosystem</p>
                <p className="mt-1 text-xs text-[#94A3B8]">
                  Instant Google Workspace SSO &amp; Recruiter Testing Sandbox
                </p>
              </div>

              <button
                type="button"
                onClick={() => navigateToRoute('/login')}
                className="mt-4 w-full sm:w-auto min-h-[44px] inline-flex items-center justify-center gap-2 rounded-xl border border-[#CCFF00]/50 bg-[#CCFF00]/10 px-4 py-2.5 text-xs font-bold text-[#CCFF00] transition-colors hover:bg-[#CCFF00] hover:text-[#0A0C10] whitespace-nowrap cursor-pointer"
              >
                <span>Evaluator / Recruiter Fast Access</span>
                <ArrowRight className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              </button>
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs text-[#64748B]">
            <p>
              © {new Date().getFullYear()} HB+ Holistic Wellness (hbplus.fit). All rights reserved.
            </p>

            <div className="flex flex-wrap items-center gap-5">
              <button
                type="button"
                onClick={() => setFooterNotice((prev) => (prev === 'privacy' ? null : 'privacy'))}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Privacy &amp; Data Ethics
              </button>
              <button
                type="button"
                onClick={() =>
                  setFooterNotice((prev) => (prev === 'encryption' ? null : 'encryption'))
                }
                className="hover:text-white transition-colors cursor-pointer"
              >
                Enterprise Workspace Security
              </button>
            </div>
          </div>

          {footerNotice && (
            <div className="mt-5 rounded-2xl border border-white/10 bg-[#161922] p-4 text-xs text-[#94A3B8] flex items-start justify-between gap-4">
              <p className="leading-relaxed">
                {footerNotice === 'privacy'
                  ? 'Enterprise-Grade Privacy & Security: All member training splits, biomarker panels, and nutrition logs are encrypted in transit and at rest, isolated per verified account with strict role-based privacy.'
                  : 'ISO-Grade HIPAA & Workspace Encrypted: Authentication is seamlessly verified via corporate @hbplus.fit Google Workspace Single Sign-On to protect team and clinical coaching records.'}
              </p>
              <button
                type="button"
                onClick={() => setFooterNotice(null)}
                aria-label="Dismiss notice"
                className="min-h-[36px] min-w-[36px] inline-flex items-center justify-center text-white hover:text-[#CCFF00] shrink-0 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </footer>

      {/* Interactive "Talk to a Coach" Consultation Modal */}
      <AnimatePresence>
        {consultModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="consult-modal-title"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.16 }}
              className="w-full max-w-md rounded-3xl border border-white/15 bg-[#161922] p-5 sm:p-7 text-white max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold text-[#00E5FF]">
                    1:1 Performance &amp; Longevity Consult
                  </p>
                  <h3 id="consult-modal-title" className="mt-1 font-display text-xl font-bold">
                    Talk to an HB+ Specialist
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setConsultModalOpen(false)}
                  aria-label="Close consultation modal"
                  className="flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-xl text-[#94A3B8] hover:text-white cursor-pointer shrink-0"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {consultSubmitted ? (
                <div className="mt-6 rounded-2xl border border-[#CCFF00]/40 bg-[#CCFF00]/10 p-5">
                  <div className="flex items-center gap-2 text-sm font-bold text-[#CCFF00]">
                    <Check className="h-5 w-5 shrink-0" aria-hidden="true" />
                    <span>Consultation Request Confirmed</span>
                  </div>
                  <p className="mt-2 text-xs text-[#94A3B8] leading-relaxed">
                    An HB+ specialist in <strong className="text-white">{consultGoal}</strong> will
                    reach out within one business day with onboarding availability.
                  </p>
                  <button
                    type="button"
                    onClick={() => setConsultModalOpen(false)}
                    className="mt-4 w-full min-h-[44px] rounded-xl bg-[#CCFF00] px-4 py-2.5 text-xs font-bold text-[#0A0C10] cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              ) : (
                <form onSubmit={handleConsultSubmit} className="mt-5 space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-[#94A3B8]">
                      Primary Healthspan Focus
                    </label>
                    <div className="mt-2 grid grid-cols-1 gap-2">
                      {[
                        'Strength & Hypertrophy',
                        'Clinical Gut & Precision Nutrition',
                        'Autonomic Breathwork & Recovery',
                      ].map((option) => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => setConsultGoal(option)}
                          className={`min-h-[44px] rounded-xl border px-3.5 py-2 text-left text-xs font-semibold transition-colors cursor-pointer ${
                            consultGoal === option
                              ? 'border-[#CCFF00] bg-[#CCFF00]/12 text-[#CCFF00]'
                              : 'border-white/10 bg-[#0A0C10] text-[#94A3B8] hover:text-white'
                          }`}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="consult-email-input"
                      className="block text-xs font-medium text-[#94A3B8]"
                    >
                      Your Email Address
                    </label>
                    <input
                      id="consult-email-input"
                      type="email"
                      value={consultEmail}
                      onChange={(e) => {
                        setConsultEmail(e.target.value);
                        if (consultError) setConsultError('');
                      }}
                      placeholder="you@hbplus.fit or work email"
                      className="mt-1.5 w-full min-h-[44px] rounded-xl border border-white/15 bg-[#0A0C10] px-4 py-2.5 text-sm text-white placeholder-[#64748B] focus:border-[#CCFF00] focus:outline-none"
                    />
                    {consultError && (
                      <p className="mt-1.5 text-xs text-[#FF5757]">{consultError}</p>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="w-full min-h-[46px] rounded-xl bg-[#CCFF00] px-5 py-3 text-xs font-bold text-[#0A0C10] hover:bg-[#d8ff33] transition-colors cursor-pointer"
                  >
                    Request Coach Callback
                  </button>
                </form>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
