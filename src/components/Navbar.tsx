import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  ShieldCheck, 
  Sun, 
  Moon,
  Box,
  Layers,
  Menu,
  X,
  Activity,
  Sliders,
  Info,
  CheckCircle2
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface NavbarProps {
  isRunning: boolean;
  isPaused: boolean;
  elapsedTime: number;
  onOpenPrivacy: () => void;
  onNavigate: (section: 'simulation' | 'analytics' | 'about') => void;
  viewDimension?: '2D' | '3D';
  onToggleDimension?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  isRunning,
  isPaused,
  elapsedTime,
  onOpenPrivacy,
  onNavigate,
  viewDimension = '2D',
  onToggleDimension,
}) => {
  const { mode, toggleMode, currentTheme } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close mobile drawer on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobileMenuOpen]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleMobileNav = (section: 'simulation' | 'analytics' | 'about') => {
    setIsMobileMenuOpen(false);
    onNavigate(section);
  };

  return (
    <>
      <header className="bg-[var(--bg-primary)]/95 backdrop-blur-md border-b border-[var(--border-color)] px-3 sm:px-6 lg:px-8 py-2.5 sticky top-0 z-40 transition-colors duration-250">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          {/* Left: Brand Identity & Descriptor */}
          <div 
            className="flex items-center space-x-3 shrink-0 cursor-pointer group"
            onClick={() => onNavigate('simulation')}
            title="SmartJunction Overview"
          >
            {/* Custom Geometric 4-way intersection symbol */}
            <div className="w-8 h-8 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] flex items-center justify-center p-1.5 shadow-sm group-hover:border-[#0284C7] transition-all">
              <svg 
                className="w-full h-full transition-transform group-hover:rotate-90 duration-500" 
                style={{ color: currentTheme.color }}
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2.5" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" strokeOpacity="0.4" fill="none" />
                <path d="M12 3v18" stroke="currentColor" strokeWidth="2.5" />
                <path d="M3 12h18" stroke="currentColor" strokeWidth="2.5" />
                <circle cx="12" cy="12" r="2.5" fill="currentColor" />
              </svg>
            </div>

            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-sm sm:text-base tracking-tight text-[var(--text-primary)] font-sans">
                  SmartJunction
                </span>
                <span 
                  className="text-[9px] font-mono uppercase tracking-widest px-1.5 py-0.5 rounded bg-[var(--bg-card)] border border-[var(--border-color)] font-semibold text-[#0284C7]"
                >
                  v2.4
                </span>
              </div>
              <div className="text-[10px] font-mono tracking-wider text-[var(--text-secondary)] uppercase hidden sm:block">
                Traffic Intelligence Simulator
              </div>
            </div>
          </div>

          {/* Desktop Only: Combined Dock */}
          <div className="hidden md:flex items-center space-x-1.5 p-1 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-sm">
            {/* 1. Integrated Navigation Links */}
            <div className="flex items-center space-x-0.5 bg-[var(--bg-secondary)] p-0.5 rounded-lg border border-[var(--border-subtle)]">
              <button
                onClick={() => onNavigate('simulation')}
                className="px-3 py-1 rounded-md text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-card)] transition-colors"
              >
                Simulation
              </button>
              <button
                onClick={() => onNavigate('analytics')}
                className="px-3 py-1 rounded-md text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card)] transition-colors"
              >
                Analytics
              </button>
              <button
                onClick={() => onNavigate('about')}
                className="px-3 py-1 rounded-md text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card)] transition-colors"
              >
                About
              </button>
            </div>

            {/* Divider */}
            <div className="w-px h-5 bg-[var(--border-color)] mx-0.5" />

            {/* 2. Live Status Badge */}
            <div className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-[var(--bg-secondary)] text-xs font-mono border border-[var(--border-subtle)]">
              <span className={`w-2 h-2 rounded-full ${
                isRunning && !isPaused 
                  ? 'bg-[#10B981] shadow-[0_0_8px_#10B981] animate-pulse' 
                  : isPaused 
                    ? 'bg-[#F59E0B]' 
                    : 'bg-[var(--text-secondary)]'
              }`} />
              <span className="text-[11px] font-bold text-[var(--text-primary)]">
                {isRunning && !isPaused ? 'LIVE' : isPaused ? 'PAUSED' : 'IDLE'}
              </span>
            </div>

            {/* 3. Session Timer */}
            <div className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-[var(--bg-secondary)] text-xs font-mono font-bold text-[var(--text-primary)] border border-[var(--border-subtle)]">
              <Clock className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
              <span className="tabular-nums text-[11px]">{formatTime(elapsedTime)}</span>
            </div>

            {/* 4. 2D / 3D Model Quick Switcher */}
            {onToggleDimension && (
              <button
                onClick={onToggleDimension}
                className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-[var(--bg-secondary)] hover:bg-[var(--bg-card-elevated)] border border-[var(--border-subtle)] text-[var(--text-primary)] flex items-center space-x-1.5 transition-all touch-target-min"
                title="Toggle between 2D Top-Down Plan and 3D WebGL Model"
                aria-label="Toggle 2D/3D view"
              >
                {viewDimension === '3D' ? (
                  <>
                    <Layers className="w-3.5 h-3.5 text-[#10B981]" />
                    <span className="text-[11px] font-bold text-[#10B981]">3D</span>
                  </>
                ) : (
                  <>
                    <Box className="w-3.5 h-3.5 text-[#0284C7]" />
                    <span className="text-[11px] font-medium text-[var(--text-secondary)]">2D</span>
                  </>
                )}
              </button>
            )}

            {/* 5. Light / Dark Theme Switcher */}
            <button
              onClick={toggleMode}
              className="px-2.5 py-1.5 rounded-lg bg-[var(--bg-secondary)] hover:bg-[var(--bg-card-elevated)] border border-[var(--border-subtle)] text-[var(--text-primary)] flex items-center space-x-1.5 transition-all touch-target-min"
              title={mode === 'dark' ? 'Switch to Cool Grey Theme' : 'Switch to Dark Theme (Asphalt Noir)'}
              aria-label="Toggle light or dark theme"
            >
              {mode === 'dark' ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-[#F59E0B]" />
                  <span className="hidden xl:inline text-[11px] font-medium text-[var(--text-secondary)]">Light</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-[#6366F1]" />
                  <span className="hidden xl:inline text-[11px] font-medium text-[var(--text-secondary)]">Dark</span>
                </>
              )}
            </button>

            {/* 6. DPDP Privacy Shield */}
            <button
              onClick={onOpenPrivacy}
              className="p-1.5 rounded-lg bg-[var(--bg-secondary)] hover:bg-[var(--bg-card-elevated)] text-[var(--text-secondary)] hover:text-[#10B981] border border-[var(--border-subtle)] transition-colors touch-target-min"
              title="DPDP Act, 2023 Compliant (Zero Telemetry)"
              aria-label="DPDP Act Compliance"
            >
              <ShieldCheck className="w-4 h-4 text-[#10B981]" />
            </button>
          </div>

          {/* Mobile Only: Compact Header Actions (Quick Theme Toggle + Hamburger Menu Button) */}
          <div className="flex md:hidden items-center space-x-2">
            {/* Quick Theme Switcher */}
            <button
              onClick={toggleMode}
              className="p-2 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-primary)] shadow-sm active:scale-95 transition-all"
              title={mode === 'dark' ? 'Switch to Cool Grey Theme' : 'Switch to Dark Theme'}
              aria-label="Toggle theme"
            >
              {mode === 'dark' ? (
                <Sun className="w-4 h-4 text-[#F59E0B]" />
              ) : (
                <Moon className="w-4 h-4 text-[#6366F1]" />
              )}
            </button>

            {/* Hamburger Button to Open Mobile Sidebar */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-primary)] hover:border-[#0284C7] shadow-sm active:scale-95 transition-all flex items-center justify-center"
              aria-label="Open mobile navigation menu"
              aria-expanded={isMobileMenuOpen}
            >
              <Menu className="w-5 h-5 text-[var(--text-primary)]" />
            </button>
          </div>
        </div>
      </header>

      {/* MOBILE SLIDE-OUT SIDEBAR DRAWER */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex justify-end">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity duration-300"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-hidden="true"
          />

          {/* Sidebar Drawer Panel */}
          <div className="relative w-80 max-w-[85vw] h-full bg-[var(--bg-card)] border-l border-[var(--border-color)] shadow-2xl flex flex-col justify-between p-5 z-10 overflow-y-auto animate-in slide-in-from-right duration-300">
            {/* Top Section */}
            <div className="space-y-6">
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-4 border-b border-[var(--border-color)]">
                <div className="flex items-center space-x-2.5">
                  <div className="w-7 h-7 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-color)] flex items-center justify-center p-1">
                    <svg 
                      className="w-full h-full text-[#0284C7]" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2.5"
                    >
                      <rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" strokeOpacity="0.4" fill="none" />
                      <path d="M12 3v18" stroke="currentColor" strokeWidth="2.5" />
                      <path d="M3 12h18" stroke="currentColor" strokeWidth="2.5" />
                      <circle cx="12" cy="12" r="2.5" fill="currentColor" />
                    </svg>
                  </div>
                  <div>
                    <span className="font-extrabold text-sm text-[var(--text-primary)]">SmartJunction</span>
                    <span className="ml-1.5 text-[9px] font-mono font-bold text-[#0284C7] bg-[var(--bg-secondary)] px-1.5 py-0.5 rounded border border-[var(--border-subtle)]">
                      v2.4
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Status Banner */}
              <div className="p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${
                    isRunning && !isPaused 
                      ? 'bg-[#10B981] shadow-[0_0_8px_#10B981] animate-pulse' 
                      : isPaused 
                        ? 'bg-[#F59E0B]' 
                        : 'bg-[var(--text-secondary)]'
                  }`} />
                  <span className="text-xs font-mono font-bold text-[var(--text-primary)]">
                    {isRunning && !isPaused ? 'SIMULATION LIVE' : isPaused ? 'SIMULATION PAUSED' : 'SIMULATION IDLE'}
                  </span>
                </div>
                <div className="flex items-center space-x-1.5 text-xs font-mono text-[var(--text-secondary)]">
                  <Clock className="w-3.5 h-3.5" />
                  <span className="tabular-nums font-bold text-[var(--text-primary)]">{formatTime(elapsedTime)}</span>
                </div>
              </div>

              {/* Navigation Links */}
              <div className="space-y-1">
                <div className="text-[10px] font-mono tracking-widest text-[var(--text-secondary)] uppercase px-2 mb-2 font-semibold">
                  Navigation
                </div>

                <button
                  onClick={() => handleMobileNav('simulation')}
                  className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl font-medium text-sm text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] active:bg-[var(--bg-secondary)] transition-colors text-left"
                >
                  <Sliders className="w-4 h-4 text-[#0284C7]" />
                  <span>Simulation & Controls</span>
                </button>

                <button
                  onClick={() => handleMobileNav('analytics')}
                  className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl font-medium text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] active:bg-[var(--bg-secondary)] transition-colors text-left"
                >
                  <Activity className="w-4 h-4 text-[#10B981]" />
                  <span>Live Analytics & Graphs</span>
                </button>

                <button
                  onClick={() => handleMobileNav('about')}
                  className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl font-medium text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] active:bg-[var(--bg-secondary)] transition-colors text-left"
                >
                  <Info className="w-4 h-4 text-[#F59E0B]" />
                  <span>About & Hackathon Criteria</span>
                </button>
              </div>

              {/* Display & Mode Controls */}
              <div className="space-y-2 pt-2 border-t border-[var(--border-color)]">
                <div className="text-[10px] font-mono tracking-widest text-[var(--text-secondary)] uppercase px-2 font-semibold">
                  View & Preferences
                </div>

                {/* 2D / 3D Switch */}
                {onToggleDimension && (
                  <button
                    onClick={() => {
                      onToggleDimension();
                    }}
                    className="w-full p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] flex items-center justify-between text-left hover:border-[#0284C7] transition-all"
                  >
                    <div className="flex items-center space-x-2.5">
                      {viewDimension === '3D' ? (
                        <Layers className="w-4 h-4 text-[#10B981]" />
                      ) : (
                        <Box className="w-4 h-4 text-[#0284C7]" />
                      )}
                      <div>
                        <div className="text-xs font-bold text-[var(--text-primary)]">
                          Junction View Model
                        </div>
                        <div className="text-[11px] text-[var(--text-secondary)]">
                          {viewDimension === '3D' ? '3D Isometric WebGL Scene' : '2D Architectural Top-Down'}
                        </div>
                      </div>
                    </div>
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                      viewDimension === '3D'
                        ? 'bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/40'
                        : 'bg-[#0284C7]/20 text-[#0284C7] border border-[#0284C7]/40'
                    }`}>
                      {viewDimension}
                    </span>
                  </button>
                )}

                {/* Theme Mode Toggle Button */}
                <button
                  onClick={toggleMode}
                  className="w-full p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] flex items-center justify-between text-left hover:border-[#0284C7] transition-all"
                >
                  <div className="flex items-center space-x-2.5">
                    {mode === 'dark' ? (
                      <Sun className="w-4 h-4 text-[#F59E0B]" />
                    ) : (
                      <Moon className="w-4 h-4 text-[#6366F1]" />
                    )}
                    <div>
                      <div className="text-xs font-bold text-[var(--text-primary)]">
                        Interface Theme
                      </div>
                      <div className="text-[11px] text-[var(--text-secondary)]">
                        {mode === 'dark' ? 'Asphalt Noir (Dark)' : 'Cool Grey (Light)'}
                      </div>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-[var(--text-secondary)] bg-[var(--bg-card)] px-2 py-0.5 rounded border border-[var(--border-subtle)]">
                    {mode === 'dark' ? 'Dark' : 'Light'}
                  </span>
                </button>

                {/* DPDP Privacy Policy Button */}
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onOpenPrivacy();
                  }}
                  className="w-full p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] flex items-center justify-between text-left hover:border-[#10B981] transition-all"
                >
                  <div className="flex items-center space-x-2.5">
                    <ShieldCheck className="w-4 h-4 text-[#10B981]" />
                    <div>
                      <div className="text-xs font-bold text-[var(--text-primary)]">
                        DPDP Act, 2023 Compliance
                      </div>
                      <div className="text-[11px] text-[#10B981]">
                        100% Client-Side • Zero Telemetry
                      </div>
                    </div>
                  </div>
                  <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
                </button>
              </div>
            </div>

            {/* Bottom Footer Info */}
            <div className="pt-4 border-t border-[var(--border-color)] space-y-1 text-center">
              <div className="text-[10px] font-mono text-[var(--text-secondary)]">
                SmartJunction • Intelligent Traffic Simulator
              </div>
              <div className="text-[9px] font-mono text-[var(--text-secondary)]/70">
                Four-Way Signal Optimization Engine
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
