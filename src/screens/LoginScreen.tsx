import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  AlertCircle,
  ArrowLeft,
  ChevronDown,
  Dumbbell,
  Loader2,
  Lock,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { HB_ASSETS } from '../constants/assets';

const HERO_STUDIO_IMAGE = HB_ASSETS.hbplusHeroStudio;

const GoogleMarkSvg: React.FC = () => (
  <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
    <path
      fill="#EA4335"
      d="M12 10.2v3.9h5.4c-.2 1.3-1.6 3.8-5.4 3.8-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.4 14.6 2.4 12 2.4 6.7 2.4 2.4 6.7 2.4 12s4.3 9.6 9.6 9.6c5.5 0 9.2-3.9 9.2-9.4 0-.6-.1-1.1-.2-1.6H12z"
    />
    <path
      fill="#34A853"
      d="M3.5 7.4l3.2 2.4C7.6 7.7 9.6 6 12 6c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.4 14.6 2.4 12 2.4 8.3 2.4 5.1 4.5 3.5 7.4z"
    />
    <path
      fill="#FBBC05"
      d="M12 21.6c2.5 0 4.7-.8 6.3-2.3l-2.9-2.4c-.8.6-1.9 1-3.4 1-3.7 0-5.1-2.5-5.4-3.7l-3.2 2.5c1.6 3 4.8 4.9 8.6 4.9z"
    />
    <path
      fill="#4285F4"
      d="M21.2 12.2c0-.6-.1-1.1-.2-1.6H12v3.9h5.4c-.3 1.3-1.1 2.4-2.1 3.1l2.9 2.4c1.7-1.6 3-4.1 3-7.8z"
    />
  </svg>
);

export const LoginScreen: React.FC = () => {
  const {
    signInWithGoogle,
    isAuthenticating,
    authError,
    attemptedBlockedEmail,
    clearAuthError,
    allowedDomains,
    navigateToRoute,
    loginDemoMember,
    simulateBlockedUser,
    loginDemoAdmin,
  } = useAuth();

  const [sandboxOpen, setSandboxOpen] = useState<boolean>(true);
  const [heroFailed, setHeroFailed] = useState<boolean>(false);

  const formattedDomains = allowedDomains.map((d) => `@${d}`).join(' · ');

  return (
    <main className="min-h-screen w-full overflow-x-hidden bg-[#0A0C10] text-white flex flex-col justify-center px-4 py-6 md:px-7 lg:px-8 pt-safe pb-safe">
      <div className="mx-auto w-full max-w-[1280px]">
        {/* Top-Left Back to HB+ Home Navigation */}
        <div className="mb-5 flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigateToRoute('/')}
            className="min-h-[44px] inline-flex items-center gap-2 rounded-xl border border-[#252B3B] bg-[#161922] px-3.5 py-2 text-xs font-semibold text-[#94A3B8] transition-colors hover:border-[#CCFF00]/60 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#CCFF00] cursor-pointer whitespace-nowrap"
          >
            <ArrowLeft className="h-4 w-4 text-[#CCFF00] shrink-0" aria-hidden="true" />
            <span>Back to HB+ Experience</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch gap-6 lg:gap-8">
          {/* Left Column: Editorial Studio Showcase */}
          <div className="relative overflow-hidden rounded-3xl border border-[#252B3B] bg-[#161922] lg:col-span-7 min-h-[260px] sm:min-h-[340px] lg:min-h-[640px] flex flex-col justify-between min-w-0">
            {!heroFailed ? (
              <img
                src={HERO_STUDIO_IMAGE}
                alt="HB+ architectural strength and mindfulness studio"
                referrerPolicy="no-referrer"
                onError={() => setHeroFailed(true)}
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-[#161922] via-[#111520] to-[#0A0C10] flex items-center justify-center">
                <Dumbbell className="h-20 w-20 text-[#CCFF00]/20" aria-hidden="true" />
              </div>
            )}

            {/* Measured Contrast Scrim */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0A0C10] via-[#0A0C10]/60 to-[#0A0C10]/25" />

            <div className="relative z-10 p-5 sm:p-8 flex items-center justify-between">
              <span className="font-display text-2xl font-bold tracking-tight text-white">
                HB<span className="text-[#CCFF00]">+</span>
              </span>
              <span className="text-xs font-medium text-[#94A3B8]">hbplus.fit</span>
            </div>

            <div className="relative z-10 p-5 sm:p-8 lg:p-10 max-w-xl min-w-0">
              <p className="text-xs font-semibold tracking-wide text-[#CCFF00]">
                Performance · Longevity · Recovery
              </p>
              <h1
                className="mt-2 font-display text-2xl sm:text-4xl font-bold tracking-tight text-white leading-tight break-words"
                style={{ textWrap: 'balance' }}
              >
                HB+ | Holistic Strength, Nutrition &amp; Wellness
              </h1>
              <p className="mt-3 text-sm sm:text-base text-[#94A3B8] leading-relaxed">
                Unified training splits, precision macro telemetry, guided 4-7-8 nervous system
                down-regulation, and daily recovery vitals built for the HB+ team.
              </p>

              <div className="mt-6 pt-5 border-t border-white/10 grid grid-cols-3 gap-2.5 sm:gap-4 text-left">
                <div className="min-w-0">
                  <span className="block font-mono text-base sm:text-lg font-bold text-white tabular-nums">
                    4 Pillars
                  </span>
                  <span className="text-[11px] sm:text-xs text-[#94A3B8]">Daily protocol</span>
                </div>
                <div className="min-w-0">
                  <span className="block font-mono text-base sm:text-lg font-bold text-white tabular-nums">
                    4·7·8
                  </span>
                  <span className="text-[11px] sm:text-xs text-[#94A3B8]">Breathwork</span>
                </div>
                <div className="min-w-0">
                  <span className="block font-mono text-base sm:text-lg font-bold text-[#CCFF00] tabular-nums">
                    256-bit
                  </span>
                  <span className="text-[11px] sm:text-xs text-[#94A3B8]">Encrypted</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Authentication & Domain Gate Card */}
          <div className="rounded-3xl border border-[#252B3B] bg-[#161922] p-5 sm:p-8 lg:col-span-5 flex flex-col justify-between min-w-0">
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="font-display text-xl font-bold text-white">
                  Member &amp; Coach Sign-In
                </span>
                <Lock className="h-4 w-4 text-[#94A3B8] shrink-0" aria-hidden="true" />
              </div>

              <p className="mt-2 text-sm text-[#94A3B8]">
                Authenticate with your corporate Google Workspace account to sync training splits,
                macro targets, and daily recovery scores.
              </p>

              {/* Animated Domain Restriction Error Banner */}
              <AnimatePresence mode="wait">
                {authError && (
                  <motion.div
                    key={authError}
                    role="alert"
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.18 }}
                    className="mt-5 rounded-2xl border border-[#FF5757]/50 bg-[#FF5757]/12 p-4"
                  >
                    <div className="flex items-start gap-3">
                      <AlertCircle
                        className="mt-0.5 h-5 w-5 shrink-0 text-[#FF5757]"
                        aria-hidden="true"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-white">{authError}</p>
                        {attemptedBlockedEmail && (
                          <p className="mt-1 font-mono text-xs text-[#FF5757] tabular-nums break-all">
                            Rejected account: {attemptedBlockedEmail} · Session terminated
                          </p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={clearAuthError}
                        className="min-h-[36px] px-1 text-xs font-medium text-[#94A3B8] hover:text-white cursor-pointer shrink-0"
                      >
                        Dismiss
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Primary Google OAuth Button */}
              <div className="mt-6">
                <button
                  type="button"
                  onClick={signInWithGoogle}
                  disabled={isAuthenticating}
                  className="flex w-full min-h-[48px] items-center justify-center gap-3 rounded-xl bg-white px-5 py-3 text-sm font-bold text-[#0A0C10] transition-transform duration-150 hover:bg-slate-100 active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#CCFF00] disabled:opacity-60 cursor-pointer"
                >
                  {isAuthenticating ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin text-[#0A0C10] shrink-0" aria-hidden="true" />
                      <span className="truncate">Verifying Domain Credentials...</span>
                    </>
                  ) : (
                    <>
                      <GoogleMarkSvg />
                      <span className="truncate">Continue with Google</span>
                    </>
                  )}
                </button>
              </div>

              {/* Domain Security Notice */}
              <div className="mt-4 flex items-center gap-2 text-xs text-[#94A3B8]">
                <ShieldCheck className="h-4 w-4 shrink-0 text-[#CCFF00]" aria-hidden="true" />
                <span>Restricted to authorized @hbplus.fit personnel</span>
              </div>
              {allowedDomains.length > 1 && (
                <p className="mt-1 font-mono text-[11px] text-[#64748B] break-words">
                  Active domain whitelist: {formattedDomains}
                </p>
              )}
            </div>

            {/* Subtle, Collapsible Recruiter / Demo Testing Sandbox */}
            <div className="mt-8 pt-6 border-t border-[#252B3B]">
              <button
                type="button"
                onClick={() => setSandboxOpen((prev) => !prev)}
                aria-expanded={sandboxOpen}
                className="flex w-full min-h-[44px] items-center justify-between text-left text-xs font-semibold text-[#94A3B8] transition-colors hover:text-white cursor-pointer"
              >
                <span>Recruiter / Demo Testing Sandbox</span>
                <ChevronDown
                  className={`h-4 w-4 transition-transform duration-200 shrink-0 ${
                    sandboxOpen ? 'rotate-180 text-[#CCFF00]' : ''
                  }`}
                  aria-hidden="true"
                />
              </button>

              <AnimatePresence initial={false}>
                {sandboxOpen && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.16 }}
                    className="mt-3 space-y-2.5"
                  >
                    <p className="text-xs text-[#64748B]">
                      One-click domain validation &amp; RBAC role switcher for evaluation:
                    </p>

                    {/* 1. Test Allowed User */}
                    <button
                      type="button"
                      disabled={isAuthenticating}
                      onClick={loginDemoMember}
                      className="flex w-full min-h-[48px] items-center justify-between gap-3 rounded-xl border border-[#252B3B] bg-[#0A0C10] px-3.5 py-2.5 text-left transition-colors hover:border-[#CCFF00] cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <UserCheck className="h-4 w-4 shrink-0 text-[#CCFF00]" aria-hidden="true" />
                        <div className="min-w-0">
                          <span className="block text-xs font-semibold text-white truncate">
                            Test Allowed User
                          </span>
                          <span className="block font-mono text-[11px] text-[#94A3B8] truncate">
                            member@hbplus.fit · Member
                          </span>
                        </div>
                      </div>
                      <span className="text-xs font-semibold text-[#CCFF00] whitespace-nowrap shrink-0">
                        Launch
                      </span>
                    </button>

                    {/* 2. Test Blocked User */}
                    <button
                      type="button"
                      disabled={isAuthenticating}
                      onClick={simulateBlockedUser}
                      className="flex w-full min-h-[48px] items-center justify-between gap-3 rounded-xl border border-[#252B3B] bg-[#0A0C10] px-3.5 py-2.5 text-left transition-colors hover:border-[#FF5757] cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <ShieldAlert
                          className="h-4 w-4 shrink-0 text-[#FF5757]"
                          aria-hidden="true"
                        />
                        <div className="min-w-0">
                          <span className="block text-xs font-semibold text-white truncate">
                            Test Blocked User
                          </span>
                          <span className="block font-mono text-[11px] text-[#94A3B8] truncate">
                            user@gmail.com · Rejected
                          </span>
                        </div>
                      </div>
                      <span className="text-xs font-semibold text-[#FF5757] whitespace-nowrap shrink-0">
                        Simulate
                      </span>
                    </button>

                    {/* 3. Test Admin User */}
                    <button
                      type="button"
                      disabled={isAuthenticating}
                      onClick={loginDemoAdmin}
                      className="flex w-full min-h-[48px] items-center justify-between gap-3 rounded-xl border border-[#252B3B] bg-[#0A0C10] px-3.5 py-2.5 text-left transition-colors hover:border-[#00E5FF] cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <ShieldCheck
                          className="h-4 w-4 shrink-0 text-[#00E5FF]"
                          aria-hidden="true"
                        />
                        <div className="min-w-0">
                          <span className="block text-xs font-semibold text-white truncate">
                            Test Admin User
                          </span>
                          <span className="block font-mono text-[11px] text-[#94A3B8] truncate">
                            admin@hbplus.fit · Coach Portal
                          </span>
                        </div>
                      </div>
                      <span className="text-xs font-semibold text-[#00E5FF] whitespace-nowrap shrink-0">
                        Launch
                      </span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};
