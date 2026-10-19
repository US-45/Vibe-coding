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
          <Sliders className="w-4 h-4 text-[#75B8FF]" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)]">
            Experiment Configuration & Seed
          </h2>
        </div>
        <div className="flex items-center space-x-1.5 text-[10px] font-mono text-[var(--text-secondary)]">
          <Hash className="w-3 h-3" style={{ color: currentTheme.color }} />
          <span>SEED: #555666777</span>
        </div>
      </div>

      {/* Grid of parameters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs font-mono">
        <div className="bg-[var(--bg-card-elevated)] border border-[var(--border-color)] p-2.5 rounded-lg">
          <div className="text-[10px] text-[var(--text-secondary)] uppercase">Spawn Density</div>
          <div className="font-bold text-[var(--text-primary)] text-sm mt-0.5">{spawnRate.toFixed(1)} veh/s</div>
        </div>

        <div className="bg-[var(--bg-card-elevated)] border border-[var(--border-color)] p-2.5 rounded-lg">
          <div className="text-[10px] text-[var(--text-secondary)] uppercase">Active Strategy</div>
          <div className="font-bold text-sm mt-0.5 uppercase" style={{ color: currentTheme.color }}>
            {signalMode} Timing
          </div>
        </div>

        <div className="bg-[var(--bg-card-elevated)] border border-[var(--border-color)] p-2.5 rounded-lg">
          <div className="text-[10px] text-[var(--text-secondary)] uppercase">Test Duration</div>
          <div className="font-bold text-[var(--text-primary)] text-sm mt-0.5">{elapsedTime}s elapsed</div>
        </div>

        <div className="bg-[var(--bg-card-elevated)] border border-[var(--border-color)] p-2.5 rounded-lg">
          <div className="text-[10px] text-[var(--text-secondary)] uppercase">Free Left Turn</div>
          <div className="font-bold text-[var(--text-primary)] text-sm mt-0.5">{freeLeftTurn ? 'Enabled' : 'Disabled'}</div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
        <div className="text-[11px] text-[var(--text-secondary)] flex items-center space-x-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-[#36D98A]" />
          <span>Seeded Mulberry32 PRNG ensures 100% reproducible traffic arrival sequences.</span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={onRerunBenchmark}
            className="px-3 py-1.5 rounded-lg bg-[var(--bg-card-elevated)] hover:bg-[var(--bg-secondary)] text-xs font-semibold transition-all flex items-center space-x-1 border touch-target-min"
            style={{
              color: currentTheme.color,
              borderColor: currentTheme.mutedBorder,
            }}
          >
            <Play className="w-3 h-3 fill-current" />
            <span>Rerun 60s Test</span>
          </button>
          <button
            onClick={onReset}
            className="px-3 py-1.5 rounded-lg bg-[var(--bg-secondary)] hover:bg-[var(--bg-card-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-color)] text-xs font-medium transition-all flex items-center space-x-1 touch-target-min"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset State</span>
          </button>
        </div>
      </div>
    </div>
  );
};
