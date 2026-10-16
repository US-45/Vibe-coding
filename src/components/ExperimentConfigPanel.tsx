import React from 'react';
import { Sliders, RotateCcw, Hash, Play, CheckCircle2 } from 'lucide-react';
import { SignalMode } from '../types/simulation';

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
  totalVehiclesGenerated,
  freeLeftTurn,
  onReset,
  onRerunBenchmark,
}) => {
  return (
    <div className="bg-[#12161B] border border-[#2A323B] rounded-xl p-4 shadow-sm space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#1E252D] pb-2.5">
        <div className="flex items-center space-x-2">
          <Sliders className="w-4 h-4 text-[#75B8FF]" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#F3F5F7]">
            Experiment Configuration & Seed
          </h2>
        </div>
        <div className="flex items-center space-x-1.5 text-[10px] font-mono text-[#929DA9]">
          <Hash className="w-3 h-3 text-[#C6F36B]" />
          <span>SEED: #555666777</span>
        </div>
      </div>

      {/* Grid of parameters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs font-mono">
        <div className="bg-[#191F26] border border-[#2A323B] p-2.5 rounded-lg">
          <div className="text-[10px] text-[#929DA9] uppercase">Spawn Density</div>
          <div className="font-bold text-[#F3F5F7] text-sm mt-0.5">{spawnRate.toFixed(1)} veh/s</div>
        </div>

        <div className="bg-[#191F26] border border-[#2A323B] p-2.5 rounded-lg">
          <div className="text-[10px] text-[#929DA9] uppercase">Active Strategy</div>
          <div className="font-bold text-[#C6F36B] text-sm mt-0.5 uppercase">{signalMode} Timing</div>
        </div>

        <div className="bg-[#191F26] border border-[#2A323B] p-2.5 rounded-lg">
          <div className="text-[10px] text-[#929DA9] uppercase">Test Duration</div>
          <div className="font-bold text-[#F3F5F7] text-sm mt-0.5">{elapsedTime}s elapsed</div>
        </div>

        <div className="bg-[#191F26] border border-[#2A323B] p-2.5 rounded-lg">
          <div className="text-[10px] text-[#929DA9] uppercase">Free Left Turn</div>
          <div className="font-bold text-[#F3F5F7] text-sm mt-0.5">{freeLeftTurn ? 'Enabled' : 'Disabled'}</div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
        <div className="text-[11px] text-[#929DA9] flex items-center space-x-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-[#36D98A]" />
          <span>Seeded Mulberry32 PRNG ensures 100% reproducible traffic arrival sequences.</span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={onRerunBenchmark}
            className="px-3 py-1.5 rounded-lg bg-[#191F26] hover:bg-[#202730] text-[#C6F36B] border border-[#C6F36B]/40 hover:border-[#C6F36B] text-xs font-semibold transition-all flex items-center space-x-1"
          >
            <Play className="w-3 h-3 fill-current" />
            <span>Rerun 60s Test</span>
          </button>
          <button
            onClick={onReset}
            className="px-3 py-1.5 rounded-lg bg-[#0B0D10] hover:bg-[#191F26] text-[#929DA9] hover:text-white border border-[#2A323B] text-xs font-medium transition-all flex items-center space-x-1"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset State</span>
          </button>
        </div>
      </div>
    </div>
  );
};
