import React, { useState } from 'react';
import { 
  Clock, 
  GitCompare, 
  Sparkles, 
  ShieldCheck, 
  Palette,
  Check,
  Sun,
  Moon
} from 'lucide-react';
import { SignalMode } from '../types/simulation';
import { useTheme } from '../context/ThemeContext';

interface NavbarProps {
  isRunning: boolean;
  isPaused: boolean;
  signalMode: SignalMode;
  elapsedTime: number;
  onOpenDemoTour: () => void;
  onOpenPrivacy: () => void;
  viewMode: 'single' | 'arena';
  onToggleViewMode: () => void;
  onNavigate: (section: 'simulation' | 'analytics' | 'about') => void;
  viewDimension?: '2D' | '3D';
  onToggleDimension?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  isRunning,
  isPaused,
  signalMode,
  elapsedTime,
  onOpenDemoTour,
  onOpenPrivacy,
  viewMode,
  onToggleViewMode,
  onNavigate,
  viewDimension = '2D',
  onToggleDimension,
}) => {
  const { mode, toggleMode, theme, setTheme, themeList, currentTheme } = useTheme();
  const [isThemePickerOpen, setIsThemePickerOpen] = useState(false);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <header className="bg-[var(--bg-primary)]/95 backdrop-blur-md border-b border-[var(--border-color)] px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3 sticky top-0 z-40 transition-colors duration-250">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
        {/* Brand & Wordmark */}
        <div className="flex items-center space-x-2.5 sm:space-x-3.5 shrink-0">
          {/* Custom Geometric 4-way intersection symbol */}
          <div className="w-8 h-8 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-color)] flex items-center justify-center p-1.5 shadow-sm group">
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
            <div className="flex items-center space-x-1.5 sm:space-x-2">
              <span className="font-extrabold text-sm sm:text-base tracking-tight text-[var(--text-primary)] font-sans">
                SmartJunction
              </span>
              <span 
                className="text-[9px] font-mono uppercase tracking-widest px-1.5 py-0.5 rounded bg-[var(--bg-secondary)] border border-[var(--border-color)] font-semibold"
                style={{ color: currentTheme.color }}
              >
                v2.4
              </span>
            </div>
            <div className="text-[10px] font-mono tracking-wider text-[var(--text-secondary)] uppercase hidden sm:block">
              Traffic Intelligence Simulator
            </div>
          </div>
        </div>

        {/* Center Nav Links (Hidden on small screens) */}
        <nav className="hidden md:flex items-center space-x-1 bg-[var(--bg-secondary)] p-1 rounded-lg border border-[var(--border-color)] text-xs font-medium">
          <button
            onClick={() => onNavigate('simulation')}
            className="px-3 py-1 rounded text-[var(--text-primary)] hover:bg-[var(--bg-card)] transition-colors"
          >
            Simulation
          </button>
          <button
            onClick={() => onNavigate('analytics')}
            className="px-3 py-1 rounded text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card)] transition-colors"
          >
            Analytics
          </button>
          <button
            onClick={() => onNavigate('about')}
            className="px-3 py-1 rounded text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card)] transition-colors"
          >
            About
          </button>
        </nav>

        {/* Right Status & Controls */}
        <div className="flex items-center space-x-1.5 sm:space-x-2">
          {/* Running / Paused Status Indicator */}
          <div className="hidden xs:flex items-center space-x-1.5 px-2 sm:px-2.5 py-1 rounded-md bg-[var(--bg-secondary)] border border-[var(--border-color)] text-xs">
            <span className={`w-2 h-2 rounded-full ${
              isRunning && !isPaused 
                ? 'bg-[#36D98A] shadow-[0_0_8px_#36D98A]' 
                : isPaused 
                  ? 'bg-[#FFBD59]' 
                  : 'bg-[var(--text-secondary)]'
            }`} />
            <span className="font-mono text-[10px] sm:text-[11px] font-semibold text-[var(--text-primary)] uppercase tracking-wide">
              {isRunning && !isPaused ? 'RUNNING' : isPaused ? 'PAUSED' : 'IDLE'}
            </span>
          </div>

          {/* Mode Pill (Hidden on mobile) */}
          <div 
            className="hidden lg:flex items-center space-x-1 px-2.5 py-1 rounded-md border text-xs font-mono transition-colors"
            style={{
              backgroundColor: signalMode === 'adaptive' ? currentTheme.mutedBg : 'var(--bg-secondary)',
              borderColor: signalMode === 'adaptive' ? currentTheme.mutedBorder : 'var(--border-color)',
              color: signalMode === 'adaptive' ? currentTheme.color : 'var(--text-secondary)',
            }}
          >
            <span>MODE:</span>
            <span className="font-bold">{signalMode === 'adaptive' ? 'ADAPTIVE' : 'FIXED'}</span>
          </div>

          {/* Elapsed Timer */}
          <div className="flex items-center space-x-1 px-2 sm:px-2.5 py-1 rounded-md bg-[var(--bg-secondary)] border border-[var(--border-color)] text-xs font-mono text-[var(--text-primary)]">
            <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[var(--text-secondary)]" />
            <span className="tabular-nums font-bold text-[11px] sm:text-xs">{formatTime(elapsedTime)}</span>
          </div>

          {/* 1. LIGHT / DARK THEME TOGGLE BUTTON */}
          <button
            onClick={toggleMode}
            className="p-1.5 sm:px-2.5 sm:py-1 rounded-md bg-[var(--bg-secondary)] hover:bg-[var(--bg-card-elevated)] border border-[var(--border-color)] text-[var(--text-primary)] transition-all flex items-center space-x-1.5 shadow-sm touch-target-min"
            title={mode === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme (Asphalt Noir)'}
            aria-label={mode === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
          >
            {mode === 'dark' ? (
              <>
                <Sun className="w-4 h-4 text-[#FFBD59] sm:w-3.5 sm:h-3.5" />
                <span className="hidden xl:inline text-[11px] font-semibold text-[var(--text-secondary)]">Light</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-[#A41717] sm:w-3.5 sm:h-3.5" />
                <span className="hidden xl:inline text-[11px] font-semibold text-[var(--text-secondary)]">Dark</span>
              </>
            )}
          </button>

          {/* Theme Palette Switcher Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsThemePickerOpen(!isThemePickerOpen)}
              className="flex items-center space-x-1 px-2 sm:px-2.5 py-1 rounded-md text-xs font-medium bg-[var(--bg-secondary)] hover:bg-[var(--bg-card-elevated)] border border-[var(--border-color)] transition-all touch-target-min"
              style={{
                borderColor: isThemePickerOpen ? currentTheme.color : 'var(--border-color)',
              }}
              title="Change UI Accent Color Palette"
              aria-label="Change UI Accent Color Palette"
            >
              <Palette className="w-3.5 h-3.5" style={{ color: currentTheme.color }} />
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: currentTheme.color }} />
              <span className="hidden 2xl:inline text-[var(--text-secondary)] text-[11px]">{currentTheme.name}</span>
            </button>

            {isThemePickerOpen && (
              <div className="absolute right-0 mt-1.5 w-48 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-2 shadow-2xl z-50 animate-fadeIn">
                <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-secondary)] px-2 py-1 border-b border-[var(--border-subtle)] mb-1">
                  UI Accent Palette
                </div>
                <div className="space-y-1">
                  {themeList.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => {
                        setTheme(t.id);
                        setIsThemePickerOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                        theme === t.id 
                          ? 'bg-[var(--bg-card-elevated)] font-bold text-[var(--text-primary)]' 
                          : 'hover:bg-[var(--bg-card-elevated)] text-[var(--text-secondary)]'
                      }`}
                      style={{ color: theme === t.id ? t.color : undefined }}
                    >
                      <div className="flex items-center space-x-2">
                        <span className="w-3 h-3 rounded-full border border-black/20 shadow-sm" style={{ backgroundColor: t.color }} />
                        <span>{t.name}</span>
                      </div>
                      {theme === t.id && <Check className="w-3.5 h-3.5" />}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 2D Plan / 3D Model View Toggle */}
          {onToggleDimension && viewMode === 'single' && (
            <button
              onClick={onToggleDimension}
              className="flex items-center space-x-1.5 px-2 sm:px-2.5 py-1 rounded-md text-xs font-medium border transition-all touch-target-min"
              style={
                viewDimension === '3D'
                  ? {
                      backgroundColor: currentTheme.color,
                      color: currentTheme.textColor,
                      borderColor: currentTheme.color,
                      fontWeight: 700,
                      boxShadow: `0 0 10px ${currentTheme.glow}`,
                    }
                  : {
                      backgroundColor: 'var(--bg-secondary)',
                      color: 'var(--text-primary)',
                      borderColor: 'var(--border-color)',
                    }
              }
              title="Toggle between 2D Top-Down Canvas and 3D Model"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{viewDimension === '3D' ? '3D Active' : '3D View'}</span>
            </button>
          )}

          {/* Dual Arena View Toggle */}
          <button
            onClick={onToggleViewMode}
            className="flex items-center space-x-1.5 px-2 sm:px-2.5 py-1 rounded-md text-xs font-medium border transition-all touch-target-min"
            style={
              viewMode === 'arena'
                ? {
                    backgroundColor: currentTheme.color,
                    color: currentTheme.textColor,
                    borderColor: currentTheme.color,
                    fontWeight: 700,
                  }
                : {
                    backgroundColor: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    borderColor: 'var(--border-color)',
                  }
            }
            title="Side-by-side comparative arena"
          >
            <GitCompare className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">{viewMode === 'arena' ? 'Single View' : 'Live Arena'}</span>
          </button>

          {/* 3-Min Walkthrough Script */}
          <button
            onClick={onOpenDemoTour}
            className="flex items-center space-x-1.5 px-2 sm:px-2.5 py-1 rounded-md text-xs font-semibold bg-[var(--bg-secondary)] hover:bg-[var(--bg-card-elevated)] transition-all touch-target-min"
            style={{
              color: currentTheme.color,
              borderColor: currentTheme.mutedBorder,
              borderWidth: 1,
            }}
            title="Interactive 3-minute demo tour"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Demo Script</span>
          </button>

          {/* Privacy Notice */}
          <button
            onClick={onOpenPrivacy}
            className="p-1.5 rounded-md bg-[var(--bg-secondary)] hover:bg-[var(--bg-card-elevated)] text-[var(--text-secondary)] hover:text-[#36D98A] border border-[var(--border-color)] transition-colors touch-target-min"
            title="DPDP Act, 2023 Compliance & Zero Telemetry"
            aria-label="Privacy & DPDP Act Compliance"
          >
            <ShieldCheck className="w-4 h-4 text-[#36D98A]" />
          </button>
        </div>
      </div>
    </header>
  );
};
