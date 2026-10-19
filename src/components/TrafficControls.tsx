import React, { useState } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Sliders, 
  Zap, 
  Siren, 
  CornerUpLeft,
} from 'lucide-react';
import { Direction, SignalMode } from '../types/simulation';
import { useTheme } from '../context/ThemeContext';

interface TrafficControlsProps {
  isRunning: boolean;
  isPaused: boolean;
  spawnRate: number;
  signalMode: SignalMode;
  freeLeftTurn: boolean;
  timeScale: number;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onReset: () => void;
  onSetSpawnRate: (rate: number) => void;
  onSetSignalMode: (mode: SignalMode) => void;
  onToggleFreeLeftTurn: () => void;
  onSetTimeScale: (scale: number) => void;
  onSpawnEmergency: (direction: Direction) => void;
}

export const TrafficControls: React.FC<TrafficControlsProps> = ({
  isRunning,
  isPaused,
  spawnRate,
  signalMode,
  freeLeftTurn,
  timeScale,
  onStart,
  onPause,
  onResume,
  onReset,
  onSetSpawnRate,
  onSetSignalMode,
  onToggleFreeLeftTurn,
  onSetTimeScale,
  onSpawnEmergency,
}) => {
  const { currentTheme, isDark } = useTheme();
  const [emergencyDir, setEmergencyDir] = useState<Direction>('south');

  const presets = [
    { label: 'Low', rate: 1.0, desc: '1.0 v/s' },
    { label: 'Medium', rate: 2.0, desc: '2.0 v/s' },
    { label: 'High', rate: 4.0, desc: '4.0 v/s' },
    { label: 'Extreme', rate: 6.0, desc: '6.0 v/s' },
  ];

  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-4 shadow-sm space-y-4 transition-colors duration-250">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-2.5">
        <div className="flex items-center space-x-2">
          <Sliders className="w-4 h-4" style={{ color: currentTheme.color }} />
          <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)]">
            Simulation Controls
          </h2>
        </div>
        
        {/* Simulation Speed */}
        <div className="flex items-center space-x-1 bg-[var(--bg-secondary)] p-0.5 rounded-md border border-[var(--border-color)]">
          {[1, 2, 4].map((scale) => (
            <button
              key={scale}
              onClick={() => onSetTimeScale(scale)}
              className="px-2 py-1 text-[10px] font-mono font-bold rounded transition-all touch-target-min"
              style={
                timeScale === scale
                  ? {
                      backgroundColor: currentTheme.color,
                      color: currentTheme.textColor,
                      boxShadow: `0 0 8px ${currentTheme.glow}`,
                    }
                  : {
                      color: 'var(--text-secondary)',
                    }
              }
            >
              {scale}x
            </button>
          ))}
        </div>
      </div>

      {/* Primary Actions: Start, Pause, Resume, Reset */}
      <div className="grid grid-cols-2 gap-2">
        {!isRunning ? (
          <button
            onClick={onStart}
            className="flex items-center justify-center space-x-2 py-2.5 px-4 rounded-lg font-bold text-xs uppercase tracking-wider transition-all active:scale-[0.98] min-h-[44px]"
            style={{
              backgroundColor: currentTheme.color,
              color: currentTheme.textColor,
              boxShadow: `0 0 14px ${currentTheme.glow}`,
            }}
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Start Simulation</span>
          </button>
        ) : isPaused ? (
          <button
            onClick={onResume}
            className="flex items-center justify-center space-x-2 py-2.5 px-4 rounded-lg bg-[#36D98A] hover:bg-[#2fc47b] text-[#0B0D10] font-bold text-xs uppercase tracking-wider shadow-sm transition-all active:scale-[0.98] min-h-[44px]"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Resume</span>
          </button>
        ) : (
          <button
            onClick={onPause}
            className="flex items-center justify-center space-x-2 py-2.5 px-4 rounded-lg bg-[var(--bg-card-elevated)] hover:bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[#FFBD59] font-bold text-xs uppercase tracking-wider shadow-sm transition-all active:scale-[0.98] min-h-[44px]"
          >
            <Pause className="w-4 h-4 fill-current" />
            <span>Pause</span>
          </button>
        )}

        <button
          onClick={onReset}
          className="flex items-center justify-center space-x-2 py-2.5 px-4 rounded-lg bg-[var(--bg-secondary)] hover:bg-[var(--bg-card-elevated)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-semibold text-xs uppercase tracking-wider transition-all active:scale-[0.98] min-h-[44px]"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset</span>
        </button>
      </div>

      {/* Signal Mode Selector: Fixed Timing vs Adaptive Timing */}
      <div>
        <label className="text-[10px] font-mono font-semibold text-[var(--text-secondary)] uppercase tracking-wider block mb-1.5">
          Signal Strategy
        </label>
        <div className="grid grid-cols-2 gap-2 p-1 bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-color)]">
          <button
            onClick={() => onSetSignalMode('fixed')}
            className="py-2.5 px-2.5 rounded-md text-xs font-semibold transition-all border min-h-[44px] flex items-center justify-center"
            style={
              signalMode === 'fixed'
                ? {
                    backgroundColor: currentTheme.mutedBg,
                    borderColor: currentTheme.mutedBorder,
                    color: currentTheme.color,
                  }
                : {
                    backgroundColor: 'transparent',
                    borderColor: 'transparent',
                    color: 'var(--text-secondary)',
                  }
            }
          >
            Fixed Timing
          </button>
          <button
            onClick={() => onSetSignalMode('adaptive')}
            className="py-2.5 px-2.5 rounded-md text-xs font-bold transition-all flex items-center justify-center space-x-1.5 border min-h-[44px]"
            style={
              signalMode === 'adaptive'
                ? {
                    backgroundColor: currentTheme.color,
                    borderColor: currentTheme.color,
                    color: currentTheme.textColor,
                    boxShadow: `0 0 10px ${currentTheme.glow}`,
                  }
                : {
                    backgroundColor: 'transparent',
                    borderColor: 'transparent',
                    color: 'var(--text-secondary)',
                  }
            }
          >
            <Zap className="w-3 h-3 fill-current" />
            <span>Adaptive Timing</span>
          </button>
        </div>
      </div>

      {/* Traffic Density: Slider & Segmented Selector */}
      <div className="space-y-2">
        <div className="flex justify-between items-center text-xs">
          <span className="font-mono text-[var(--text-secondary)] uppercase tracking-wider text-[10px]">
            Traffic Arrival Rate:
          </span>
          <span className="font-mono font-bold text-[var(--text-primary)] tabular-nums bg-[var(--bg-secondary)] px-2 py-0.5 rounded border border-[var(--border-color)]">
            {spawnRate.toFixed(1)} veh/s
          </span>
        </div>

        <input
          type="range"
          min="0.5"
          max="8.0"
          step="0.5"
          value={spawnRate}
          onChange={(e) => onSetSpawnRate(parseFloat(e.target.value))}
          className="w-full h-2 bg-[var(--bg-secondary)] rounded-lg appearance-none cursor-pointer border border-[var(--border-color)]"
        />

        {/* Segmented Selector for Low, Medium, High, Extreme */}
        <div className="grid grid-cols-4 gap-1.5">
          {presets.map((preset) => {
            const isSelected = Math.abs(spawnRate - preset.rate) < 0.1;
            return (
              <button
                key={preset.label}
                onClick={() => onSetSpawnRate(preset.rate)}
                className="py-1.5 px-1 rounded-md text-center transition-all border min-h-[40px] flex flex-col items-center justify-center"
                style={
                  isSelected
                    ? {
                        backgroundColor: currentTheme.mutedBg,
                        borderColor: currentTheme.color,
                        color: currentTheme.color,
                        fontWeight: 700,
                      }
                    : {
                        backgroundColor: 'var(--bg-secondary)',
                        borderColor: 'var(--border-color)',
                        color: 'var(--text-secondary)',
                      }
                }
              >
                <div className="text-[11px] leading-tight">{preset.label}</div>
                <div className="text-[9px] font-mono opacity-80">{preset.desc}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Stretch Goal Controls: Free Left Turn & Emergency Priority */}
      <div className="pt-1 space-y-2">
        {/* Free Left Turn */}
        <div className="p-2.5 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-color)] flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CornerUpLeft className="w-4 h-4 text-[#75B8FF]" />
            <div>
              <div className="text-xs font-semibold text-[var(--text-primary)]">Free Left Turn</div>
              <div className="text-[10px] text-[var(--text-secondary)]">Continuous slip lane without signal halt</div>
            </div>
          </div>
          <button
            onClick={onToggleFreeLeftTurn}
            aria-label="Toggle Free Left Turn"
            className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors touch-target-min"
            style={{
              backgroundColor: freeLeftTurn ? currentTheme.color : (isDark ? '#413939' : '#D8D2CA'),
            }}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full transition-transform ${
                freeLeftTurn ? 'translate-x-6' : 'translate-x-1'
              }`}
              style={{
                backgroundColor: freeLeftTurn ? currentTheme.textColor : (isDark ? '#A4A4A4' : '#6F6963'),
              }}
            />
          </button>
        </div>

        {/* Emergency Vehicle Green Corridor */}
        <div className="p-2.5 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-color)] space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1.5 text-xs font-semibold text-[var(--text-primary)]">
              <Siren className="w-3.5 h-3.5 text-[#FF6268]" />
              <span>Emergency Corridor</span>
            </div>
            <select
              value={emergencyDir}
              onChange={(e) => setEmergencyDir(e.target.value as Direction)}
              className="bg-[var(--bg-card-elevated)] text-[var(--text-primary)] text-[10px] font-mono rounded px-1.5 py-1 border border-[var(--border-color)] outline-none"
            >
              <option value="south">South Approach (Heading North)</option>
              <option value="north">North Approach (Heading South)</option>
              <option value="east">East Approach (Heading West)</option>
              <option value="west">West Approach (Heading East)</option>
            </select>
          </div>

          <button
            onClick={() => onSpawnEmergency(emergencyDir)}
            className="w-full py-2.5 px-3 rounded-lg bg-[var(--bg-card-elevated)] hover:bg-[#FF6268]/15 text-[#FF6268] text-xs font-semibold uppercase tracking-wider border border-[#FF6268]/40 hover:border-[#FF6268] transition-all flex items-center justify-center space-x-2 min-h-[44px]"
          >
            <Siren className="w-3.5 h-3.5" />
            <span>Dispatch 108 Ambulance</span>
          </button>
        </div>
      </div>
    </div>
  );
};
