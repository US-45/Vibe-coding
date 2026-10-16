import React, { useState } from 'react';
import { 
  Clock, 
  GitCompare, 
  Sparkles, 
  ShieldCheck, 
  Palette,
  Check
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
  const { theme, setTheme, themeList, currentTheme } = useTheme();
  const [isThemePickerOpen, setIsThemePickerOpen] = useState(false);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <header className="bg-[#0B0D10]/95 backdrop-blur-md border-b border-[#2A323B] px-4 sm:px-6 lg:px-8 py-3 sticky top-0 z-40 transition-colors">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Brand & Wordmark */}
        <div className="flex items-center space-x-3.5">
          {/* Custom Geometric 4-way intersection symbol */}
          <div className="w-8 h-8 rounded-lg bg-[#191F26] border border-[#2A323B] flex items-center justify-center p-1.5 shadow-sm group">
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
              <rect x="3" y="3" width="18" height="18" rx="3" stroke="#2A323B" fill="#12161B" />
              <path d="M12 3v18" stroke="currentColor" strokeWidth="2.5" />
              <path d="M3 12h18" stroke="currentColor" strokeWidth="2.5" />
              <circle cx="12" cy="12" r="2.5" fill="currentColor" />
            </svg>
          </div>

          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-sm tracking-tight text-[#F3F5F7] font-sans">
                SmartJunction
              </span>
              <span 
                className="text-[9px] font-mono uppercase tracking-widest px-1.5 py-0.5 rounded bg-[#191F26] border border-[#2A323B] transition-colors"
                style={{ color: currentTheme.color }}
              >
                v2.4
              </span>
            </div>
            <div className="text-[10px] font-mono tracking-wider text-[#929DA9] uppercase hidden sm:block">
              Traffic Intelligence Simulator
            </div>
          </div>
        </div>

        {/* Center Nav Links */}
        <nav className="hidden md:flex items-center space-x-1 bg-[#12161B] p-1 rounded-lg border border-[#2A323B] text-xs font-medium">
          <button
            onClick={() => onNavigate('simulation')}
            className="px-3 py-1 rounded text-[#F3F5F7] hover:bg-[#191F26] transition-colors"
            style={{ '--hover-color': currentTheme.color } as any}
          >
            Simulation
          </button>
          <button
            onClick={() => onNavigate('analytics')}
            className="px-3 py-1 rounded text-[#929DA9] hover:text-[#F3F5F7] hover:bg-[#191F26] transition-colors"
          >
            Analytics
          </button>
          <button
            onClick={() => onNavigate('about')}
            className="px-3 py-1 rounded text-[#929DA9] hover:text-[#F3F5F7] hover:bg-[#191F26] transition-colors"
          >
            About
          </button>
        </nav>

        {/* Right Status & Controls */}
        <div className="flex items-center space-x-2 sm:space-x-2.5">
          {/* Status Indicator */}
          <div className="flex items-center space-x-2 px-2.5 py-1 rounded-md bg-[#12161B] border border-[#2A323B] text-xs">
            <span className={`w-2 h-2 rounded-full ${
              isRunning && !isPaused 
                ? 'bg-[#36D98A] shadow-[0_0_8px_#36D98A]' 
                : isPaused 
                  ? 'bg-[#FFBD59]' 
                  : 'bg-[#929DA9]'
            }`} />
            <span className="font-mono text-[11px] font-semibold text-[#F3F5F7] uppercase tracking-wide">
              {isRunning && !isPaused ? 'RUNNING' : isPaused ? 'PAUSED' : 'IDLE'}
            </span>
          </div>

          {/* Mode Pill */}
          <div 
            className="hidden sm:flex items-center space-x-1 px-2.5 py-1 rounded-md border text-xs font-mono transition-colors"
            style={{
              backgroundColor: signalMode === 'adaptive' ? currentTheme.mutedBg : '#12161B',
              borderColor: signalMode === 'adaptive' ? currentTheme.mutedBorder : '#2A323B',
              color: signalMode === 'adaptive' ? currentTheme.color : '#929DA9',
            }}
          >
            <span>MODE:</span>
            <span className="font-bold">{signalMode === 'adaptive' ? 'ADAPTIVE' : 'FIXED'}</span>
          </div>

          {/* Elapsed Timer */}
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-[#12161B] border border-[#2A323B] text-xs font-mono text-[#F3F5F7]">
            <Clock className="w-3.5 h-3.5 text-[#929DA9]" />
            <span className="tabular-nums font-bold">{formatTime(elapsedTime)}</span>
          </div>

          {/* Theme Palette Switcher Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsThemePickerOpen(!isThemePickerOpen)}
              className="flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-[#12161B] hover:bg-[#191F26] border border-[#2A323B] transition-all"
              style={{
                borderColor: isThemePickerOpen ? currentTheme.color : '#2A323B',
              }}
              title="Change UI Theme Accent"
            >
              <Palette className="w-3.5 h-3.5" style={{ color: currentTheme.color }} />
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: currentTheme.color }} />
              <span className="hidden xl:inline text-[#929DA9] text-[11px]">{currentTheme.name}</span>
            </button>

            {isThemePickerOpen && (
              <div className="absolute right-0 mt-1.5 w-48 bg-[#12161B] border border-[#2A323B] rounded-xl p-2 shadow-2xl z-50 animate-fadeIn">
                <div className="text-[10px] font-mono uppercase tracking-wider text-[#929DA9] px-2 py-1 border-b border-[#1E252D] mb-1">
                  UI Theme Accent
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
                        theme === t.id ? 'bg-[#191F26] font-bold' : 'hover:bg-[#191F26] text-[#929DA9]'
                      }`}
                      style={{ color: theme === t.id ? t.color : undefined }}
                    >
                      <div className="flex items-center space-x-2">
                        <span className="w-3 h-3 rounded-full border border-black/40 shadow-sm" style={{ backgroundColor: t.color }} />
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
              className="flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-xs font-medium border transition-all"
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
                      backgroundColor: '#191F26',
                      color: '#F3F5F7',
                      borderColor: '#2A323B',
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
            className="flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-xs font-medium border transition-all"
            style={
              viewMode === 'arena'
                ? {
                    backgroundColor: currentTheme.color,
                    color: currentTheme.textColor,
                    borderColor: currentTheme.color,
                    fontWeight: 700,
                  }
                : {
                    backgroundColor: '#191F26',
                    color: '#F3F5F7',
                    borderColor: '#2A323B',
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
            className="flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-[#191F26] hover:bg-[#202730] transition-all"
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
            className="p-1.5 rounded-md bg-[#12161B] hover:bg-[#191F26] text-[#929DA9] hover:text-[#36D98A] border border-[#2A323B] transition-colors"
            title="DPDP Act, 2023 Compliance & Zero Telemetry"
          >
            <ShieldCheck className="w-4 h-4 text-[#36D98A]" />
          </button>
        </div>
      </div>
    </header>
  );
};
