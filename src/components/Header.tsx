import React, { useState } from 'react';
import { LogOut, Menu, ShieldCheck, X } from 'lucide-react';
import { ActiveTab, HBProfile } from '../context/AuthContext';

interface HeaderProps {
  profile: HBProfile;
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  onNavigateHome: () => void;
  onLogout: () => Promise<void>;
  isLoggingOut: boolean;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase() || 'HB';
}

export const Header: React.FC<HeaderProps> = ({
  profile,
  activeTab,
  onSelectTab,
  onNavigateHome,
  onLogout,
  isLoggingOut,
}) => {
  const [avatarFailed, setAvatarFailed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const emailDomain = profile.email.split('@')[1] || 'hbplus.fit';
  const roleLabel = profile.role === 'admin' ? 'Coach & Admin' : 'Member';

  return (
    <header className="sticky top-0 z-30 border-b border-[#252B3B] bg-[#0A0C10]/90 backdrop-blur-md pt-safe">
      <div className="mx-auto flex max-w-[1280px] items-center justify-between gap-3 px-4 py-2.5 md:px-7 md:py-3 lg:px-8 lg:gap-8">
        {/* Zone 1: Single-line Brand Wordmark */}
        <a
          href="/"
          title="Return to HB+ Website"
          onClick={(e) => {
            e.preventDefault();
            setMobileDrawerOpen(false);
            onNavigateHome();
          }}
          className="font-display text-xl font-bold tracking-tight text-white whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#CCFF00]"
        >
          HB<span className="text-[#CCFF00]">+</span>
        </a>

        {/* Zone 2: Concise Single-Line Navigation Links (Tablet & Desktop >= 768px) */}
        {profile.role === 'admin' ? (
          <nav
            aria-label="Primary Workspace Navigation"
            className="hidden md:flex items-center gap-6 text-sm font-medium"
          >
            <button
              type="button"
              onClick={() => onSelectTab('admin')}
              className={`min-h-[40px] px-1 transition-colors whitespace-nowrap shrink-0 border-b-2 cursor-pointer ${
                activeTab === 'admin'
                  ? 'border-[#CCFF00] text-white'
                  : 'border-transparent text-[#94A3B8] hover:text-white'
              }`}
            >
              Coach &amp; Admin Portal
            </button>
            <button
              type="button"
              onClick={() => onSelectTab('overview')}
              className={`min-h-[40px] px-1 transition-colors whitespace-nowrap shrink-0 border-b-2 cursor-pointer ${
                activeTab === 'overview'
                  ? 'border-[#CCFF00] text-white'
                  : 'border-transparent text-[#94A3B8] hover:text-white'
              }`}
            >
              Personal Telemetry
            </button>
            <button
              type="button"
              onClick={onNavigateHome}
              className="min-h-[40px] px-1 text-[#94A3B8] hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              HB+ Ecosystem
            </button>
          </nav>
        ) : (
          <nav
            aria-label="Member Navigation"
            className="hidden md:flex items-center gap-6 text-sm font-medium"
          >
            <span className="text-white border-b-2 border-[#CCFF00] py-2 whitespace-nowrap shrink-0">
              Daily Telemetry
            </span>
            <button
              type="button"
              onClick={onNavigateHome}
              className="min-h-[40px] px-1 text-[#94A3B8] hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              HB+ Ecosystem
            </button>
          </nav>
        )}

        {/* Zone 3: Verified Member Identity, Logout & Mobile Drawer Toggle */}
        <div className="flex items-center gap-2.5 sm:gap-3.5 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="relative h-9 w-9 sm:h-10 sm:w-10 shrink-0 overflow-hidden rounded-full border border-[#252B3B] bg-[#161922] flex items-center justify-center">
              {profile.avatarUrl && !avatarFailed ? (
                <img
                  src={profile.avatarUrl}
                  alt={`${profile.fullName} profile photo`}
                  referrerPolicy="no-referrer"
                  onError={() => setAvatarFailed(true)}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="font-display text-xs font-bold tracking-wider text-[#CCFF00]">
                  {getInitials(profile.fullName)}
                </span>
              )}
            </div>

            <div className="hidden lg:flex flex-col text-left">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-white truncate max-w-[160px]">
                  {profile.fullName}
                </span>
                <span className="text-xs text-[#64748B]" aria-hidden="true">
                  ·
                </span>
                <span
                  className={`text-xs font-semibold whitespace-nowrap ${
                    profile.role === 'admin' ? 'text-[#CCFF00]' : 'text-[#94A3B8]'
                  }`}
                >
                  {roleLabel}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-[#94A3B8]">
                <ShieldCheck className="h-3.5 w-3.5 text-[#00E5FF] shrink-0" aria-hidden="true" />
                <span className="truncate max-w-[200px]">Verified @{emailDomain}</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onLogout}
            disabled={isLoggingOut}
            className="hidden sm:inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-[#252B3B] bg-[#161922] px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:border-[#FF5757]/60 hover:bg-[#FF5757]/10 hover:text-[#FF5757] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#CCFF00] disabled:opacity-50 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <LogOut className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>Logout</span>
          </button>

          {/* Compact Mobile Logout + Menu Toggle (< 768px) */}
          <button
            type="button"
            onClick={onLogout}
            disabled={isLoggingOut}
            aria-label="Logout"
            className="sm:hidden flex h-11 min-h-[44px] items-center justify-center gap-1.5 rounded-xl border border-[#252B3B] bg-[#161922] px-3 text-xs font-semibold text-white hover:border-[#FF5757]/60 hover:text-[#FF5757] disabled:opacity-50 shrink-0 cursor-pointer"
          >
            <LogOut className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>Exit</span>
          </button>

          <button
            type="button"
            aria-label={mobileDrawerOpen ? 'Close workspace menu' : 'Open workspace menu'}
            aria-expanded={mobileDrawerOpen}
            onClick={() => setMobileDrawerOpen((prev) => !prev)}
            className="md:hidden flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-[#252B3B] bg-[#161922] text-white shrink-0 cursor-pointer"
          >
            {mobileDrawerOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Dark Glass Workspace Menu (< 768px) */}
      {mobileDrawerOpen && (
        <div className="md:hidden border-t border-[#252B3B] bg-[#0A0C10]/98 backdrop-blur-2xl px-4 py-4 space-y-2">
          <div className="rounded-xl bg-[#161922] p-3.5 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white truncate">{profile.fullName}</p>
              <p className="font-mono text-xs text-[#00E5FF] truncate">{profile.email}</p>
            </div>
            <span className="text-xs font-semibold text-[#CCFF00] shrink-0">{roleLabel}</span>
          </div>

          {profile.role === 'admin' && (
            <>
              <button
                type="button"
                onClick={() => {
                  onSelectTab('admin');
                  setMobileDrawerOpen(false);
                }}
                className={`flex w-full min-h-[46px] items-center justify-between rounded-xl px-4 py-2.5 text-left text-sm font-semibold cursor-pointer ${
                  activeTab === 'admin'
                    ? 'bg-[#CCFF00]/15 text-[#CCFF00] border border-[#CCFF00]/40'
                    : 'bg-[#161922] text-white'
                }`}
              >
                <span>Coach &amp; Admin Portal</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onSelectTab('overview');
                  setMobileDrawerOpen(false);
                }}
                className={`flex w-full min-h-[46px] items-center justify-between rounded-xl px-4 py-2.5 text-left text-sm font-semibold cursor-pointer ${
                  activeTab === 'overview'
                    ? 'bg-[#CCFF00]/15 text-[#CCFF00] border border-[#CCFF00]/40'
                    : 'bg-[#161922] text-white'
                }`}
              >
                <span>Personal Telemetry</span>
              </button>
            </>
          )}

          <button
            type="button"
            onClick={() => {
              setMobileDrawerOpen(false);
              onNavigateHome();
            }}
            className="flex w-full min-h-[46px] items-center justify-between rounded-xl bg-[#161922] px-4 py-2.5 text-left text-sm font-medium text-[#94A3B8] hover:text-white cursor-pointer"
          >
            <span>Return to HB+ Website</span>
          </button>
        </div>
      )}
    </header>
  );
};
