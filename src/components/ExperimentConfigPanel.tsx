import React from 'react';
import { Sliders, RotateCcw, Hash, Play, CheckCircle2 } from 'lucide-react';
import { SignalMode } from '../types/simulation';
import { useTheme } from '../context/ThemeContext';

interface ExperimentConfigPanelProps {
  spawnRate: number;
  signalMode: SignalMode;
  elapsedTime: number;
  totalVehiclesGenerated: number;
  freeLeftTurn: boolean;
  onReset: () => void;
  onRerunBenchmark: () => void;
}

export const ExperimentConfigPanel: React.FC<ExperimentConfigPanelProps> = ({
  spawnRate,
  signalMode,
  elapsedTime,
  totalVehiclesGenerated: _totalVehiclesGenerated,
  freeLeftTurn,
  onReset,
  onRerunBenchmark,
}) => {
  const { currentTheme } = useTheme();

  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-4 shadow-sm space-y-3 transition-colors duration-250">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-2.5">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 rounded-md bg-[#0284C7]/15 border border-[#0284C7]/30 flex items-center justify-center text-[#0284C7]">
            <Sliders className="w-3.5 h-3.5" />
          </div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)]">
            Experiment Configuration & Seed
          </h2>
        </div>
        <div className="flex items-center space-x-1.5 text-[10px] font-mono text-[var(--text-secondary)] font-bold">
          <Hash className="w-3 h-3 text-[#0284C7]" />
          <span>SEED: #555666777</span>
        </div>
      </div>

      {/* Grid of parameters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs font-mono">
        {/* Spawn Density */}
        <div className="bg-[var(--bg-card-elevated)] border border-[#0284C7]/30 hover:border-[#0284C7] p-2.5 rounded-xl shadow-sm">
          <div className="text-[10px] text-[var(--text-secondary)] uppercase font-semibold">Spawn Density</div>
          <div className="font-bold text-[#0284C7] text-sm mt-0.5">{spawnRate.toFixed(1)} veh/s</div>
        </div>

        {/* Active Strategy */}
        <div className={`bg-[var(--bg-card-elevated)] border p-2.5 rounded-xl shadow-sm ${
          signalMode === 'adaptive' ? 'border-[#10B981]/40' : 'border-[#F59E0B]/40'
        }`}>
          <div className="text-[10px] text-[var(--text-secondary)] uppercase font-semibold">Active Strategy</div>
          <div className={`font-bold text-sm mt-0.5 uppercase ${
            signalMode === 'adaptive' ? 'text-[#10B981]' : 'text-[#F59E0B]'
          }`}>
            {signalMode} Timing
          </div>
        </div>

        {/* Test Duration */}
        <div className="bg-[var(--bg-card-elevated)] border border-[#F59E0B]/30 hover:border-[#F59E0B] p-2.5 rounded-xl shadow-sm">
          <div className="text-[10px] text-[var(--text-secondary)] uppercase font-semibold">Test Duration</div>
          <div className="font-bold text-[#F59E0B] text-sm mt-0.5">{elapsedTime}s elapsed</div>
        </div>

        {/* Free Left Turn */}
        <div className={`bg-[var(--bg-card-elevated)] border p-2.5 rounded-xl shadow-sm ${
          freeLeftTurn ? 'border-[#10B981]/40' : 'border-[var(--border-color)]'
        }`}>
          <div className="text-[10px] text-[var(--text-secondary)] uppercase font-semibold">Free Left Turn</div>
          <div className={`font-bold text-sm mt-0.5 ${freeLeftTurn ? 'text-[#10B981]' : 'text-[var(--text-secondary)]'}`}>
            {freeLeftTurn ? 'Enabled' : 'Disabled'}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
        <div className="text-[11px] text-[var(--text-secondary)] flex items-center space-x-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />
          <span>Seeded Mulberry32 PRNG ensures 100% reproducible traffic arrival sequences.</span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={onRerunBenchmark}
            className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-[#0284C7] to-[#2563EB] hover:from-[#0369A1] hover:to-[#1D4ED8] text-white text-xs font-bold transition-all flex items-center space-x-1.5 shadow-sm touch-target-min"
          >
            <Play className="w-3 h-3 fill-current" />
            <span>Rerun 60s Test</span>
          </button>
          <button
            onClick={onReset}
            className="px-3 py-1.5 rounded-lg bg-[var(--bg-secondary)] hover:bg-[var(--bg-card-elevated)] text-[var(--text-secondary)] hover:text-[#0284C7] border border-[var(--border-color)] text-xs font-semibold transition-all flex items-center space-x-1 touch-target-min"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset State</span>
          </button>
        </div>
      </div>
    </div>
  );
};
