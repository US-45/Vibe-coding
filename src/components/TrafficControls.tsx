import React, { useState } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Sliders, 
  Zap, 
  Siren, 
  CornerUpLeft,
  FastForward
} from 'lucide-react';
import { Direction, SignalMode } from '../types/simulation';

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
  const [emergencyDir, setEmergencyDir] = useState<Direction>('south');

  const presets = [
    { label: 'Low', rate: 1.0, desc: '1.0 v/s' },
    { label: 'Medium', rate: 2.0, desc: '2.0 v/s' },
    { label: 'High', rate: 4.0, desc: '4.0 v/s' },
    { label: 'Extreme', rate: 6.0, desc: '6.0 v/s' },
  ];

  return (
    <div className="bg-[#12161B] border border-[#2A323B] rounded-xl p-4 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#1E252D] pb-2.5">
        <div className="flex items-center space-x-2">
          <Sliders className="w-4 h-4 text-[#C6F36B]" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#F3F5F7]">
            Simulation Controls
          </h2>
        </div>
        
        {/* Simulation Speed */}
        <div className="flex items-center space-x-1 bg-[#0B0D10] p-0.5 rounded-md border border-[#2A323B]">
          {[1, 2, 4].map((scale) => (
            <button
              key={scale}
              onClick={() => onSetTimeScale(scale)}
              className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded transition-colors ${
                timeScale === scale
                  ? 'bg-[#C6F36B] text-[#0B0D10]'
                  : 'text-[#929DA9] hover:text-white'
              }`}
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
            className="flex items-center justify-center space-x-2 py-2.5 px-4 rounded-lg bg-[#C6F36B] hover:bg-[#d6f78b] text-[#0B0D10] font-bold text-xs uppercase tracking-wider shadow-sm transition-all active:scale-[0.98]"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Start Simulation</span>
          </button>
        ) : isPaused ? (
          <button
            onClick={onResume}
            className="flex items-center justify-center space-x-2 py-2.5 px-4 rounded-lg bg-[#36D98A] hover:bg-[#2fc47b] text-[#0B0D10] font-bold text-xs uppercase tracking-wider shadow-sm transition-all active:scale-[0.98]"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Resume</span>
          </button>
        ) : (
          <button
            onClick={onPause}
            className="flex items-center justify-center space-x-2 py-2.5 px-4 rounded-lg bg-[#191F26] hover:bg-[#202730] border border-[#2A323B] text-[#F3F5F7] font-bold text-xs uppercase tracking-wider shadow-sm transition-all active:scale-[0.98]"
          >
            <Pause className="w-4 h-4 fill-current" />
            <span>Pause</span>
          </button>
        )}

        <button
          onClick={onReset}
          className="flex items-center justify-center space-x-2 py-2.5 px-4 rounded-lg bg-[#0B0D10] hover:bg-[#191F26] border border-[#2A323B] text-[#929DA9] hover:text-white font-semibold text-xs uppercase tracking-wider transition-all active:scale-[0.98]"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset</span>
        </button>
      </div>

      {/* Signal Mode Selector: Fixed Timing vs Adaptive Timing */}
      <div>
        <label className="text-[10px] font-mono font-semibold text-[#929DA9] uppercase tracking-wider block mb-1.5">
          Signal Strategy
        </label>
        <div className="grid grid-cols-2 gap-2 p-1 bg-[#0B0D10] rounded-lg border border-[#2A323B]">
          <button
            onClick={() => onSetSignalMode('fixed')}
            className={`py-2 px-2.5 rounded-md text-xs font-semibold transition-all ${
              signalMode === 'fixed'
                ? 'bg-[#191F26] text-white border border-[#2A323B] shadow-sm'
                : 'text-[#929DA9] hover:text-white'
            }`}
          >
            Fixed Timing
          </button>
          <button
            onClick={() => onSetSignalMode('adaptive')}
            className={`py-2 px-2.5 rounded-md text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${
              signalMode === 'adaptive'
                ? 'bg-[#C6F36B] text-[#0B0D10] shadow-sm'
                : 'text-[#929DA9] hover:text-white'
            }`}
          >
            <Zap className="w-3 h-3 fill-current" />
            <span>Adaptive Timing</span>
          </button>
        </div>
      </div>

      {/* Traffic Density: Slider & Segmented Selector */}
      <div className="space-y-2">
        <div className="flex justify-between items-center text-xs">
          <span className="font-mono text-[#929DA9] uppercase tracking-wider text-[10px]">
            Traffic Arrival Rate:
          </span>
          <span className="font-mono font-bold text-[#F3F5F7] tabular-nums bg-[#0B0D10] px-2 py-0.5 rounded border border-[#2A323B]">
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
          className="w-full h-1.5 bg-[#0B0D10] rounded-lg appearance-none cursor-pointer border border-[#2A323B]"
        />

        {/* Segmented Selector for Low, Medium, High, Extreme */}
        <div className="grid grid-cols-4 gap-1.5">
          {presets.map((preset) => (
            <button
              key={preset.label}
              onClick={() => onSetSpawnRate(preset.rate)}
              className={`py-1 px-1 rounded-md text-center transition-colors border ${
                Math.abs(spawnRate - preset.rate) < 0.1
                  ? 'bg-[#191F26] text-[#C6F36B] border-[#C6F36B]/50 font-bold'
                  : 'bg-[#0B0D10] text-[#929DA9] border-[#2A323B] hover:text-white'
              }`}
            >
              <div className="text-[11px] leading-tight">{preset.label}</div>
              <div className="text-[9px] font-mono text-[#929DA9] opacity-75">{preset.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Stretch Goal Controls: Free Left Turn & Emergency Priority */}
      <div className="pt-1 space-y-2">
        {/* Free Left Turn */}
        <div className="p-2.5 rounded-lg bg-[#0B0D10] border border-[#2A323B] flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CornerUpLeft className="w-4 h-4 text-[#75B8FF]" />
            <div>
              <div className="text-xs font-semibold text-[#F3F5F7]">Free Left Turn</div>
              <div className="text-[10px] text-[#929DA9]">Continuous slip lane without signal halt</div>
            </div>
          </div>
          <button
            onClick={onToggleFreeLeftTurn}
            className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors ${
              freeLeftTurn ? 'bg-[#36D98A]' : 'bg-[#2A323B]'
            }`}
          >
            <span
              className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                freeLeftTurn ? 'translate-x-5' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Emergency Vehicle Green Corridor */}
        <div className="p-2.5 rounded-lg bg-[#0B0D10] border border-[#2A323B] space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1.5 text-xs font-semibold text-[#F3F5F7]">
              <Siren className="w-3.5 h-3.5 text-[#FF6268]" />
              <span>Emergency Corridor</span>
            </div>
            <select
              value={emergencyDir}
              onChange={(e) => setEmergencyDir(e.target.value as Direction)}
              className="bg-[#191F26] text-[#F3F5F7] text-[10px] font-mono rounded px-1.5 py-0.5 border border-[#2A323B] outline-none"
            >
              <option value="south">South Approach (Heading North)</option>
              <option value="north">North Approach (Heading South)</option>
              <option value="east">East Approach (Heading West)</option>
              <option value="west">West Approach (Heading East)</option>
            </select>
          </div>

          <button
            onClick={() => onSpawnEmergency(emergencyDir)}
            className="w-full py-1.5 px-3 rounded-lg bg-[#191F26] hover:bg-[#202730] text-[#FF6268] hover:text-white text-xs font-semibold uppercase tracking-wider border border-[#FF6268]/40 hover:border-[#FF6268] transition-all flex items-center justify-center space-x-2"
          >
            <Siren className="w-3.5 h-3.5" />
            <span>Dispatch 108 Ambulance</span>
          </button>
        </div>
      </div>
    </div>
  );
};
