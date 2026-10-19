import React from 'react';
import { BarChart3, Car, Clock, Activity, Users } from 'lucide-react';
import { Direction, SimulationStats } from '../types/simulation';
import { useTheme } from '../context/ThemeContext';

interface StatisticsPanelProps {
  stats: SimulationStats;
}

export const StatisticsPanel: React.FC<StatisticsPanelProps> = ({ stats }) => {
  const { currentTheme } = useTheme();

  const directions: { dir: Direction; label: string; color: string; bg: string }[] = [
    { dir: 'north', label: 'North', color: '#0284C7', bg: 'rgba(2, 132, 199, 0.12)' },
    { dir: 'south', label: 'South', color: '#6366F1', bg: 'rgba(99, 102, 241, 0.12)' },
    { dir: 'east', label: 'East', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.12)' },
    { dir: 'west', label: 'West', color: '#10B981', bg: 'rgba(16, 185, 129, 0.12)' },
  ];

  const vehicleDistribution = [
    { label: 'Auto-Rickshaw', share: '30%', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.15)' },
    { label: 'Two-Wheeler', share: '23%', color: '#10B981', bg: 'rgba(16, 185, 129, 0.15)' },
    { label: 'Car / Sedan', share: '35%', color: '#0284C7', bg: 'rgba(2, 132, 199, 0.15)' },
    { label: 'Public Bus', share: '12%', color: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.15)' },
    { label: '108 Ambulance', share: 'Priority', color: '#EF4444', bg: 'rgba(239, 68, 68, 0.15)' },
  ];

  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-4 shadow-sm space-y-4 transition-colors duration-250">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-2.5">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 rounded-md bg-[#0284C7]/15 border border-[#0284C7]/30 flex items-center justify-center text-[#0284C7]">
            <BarChart3 className="w-3.5 h-3.5" />
          </div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)]">
            Live Traffic Metrics
          </h2>
        </div>
        <span className="text-[10px] font-mono text-[#10B981] flex items-center space-x-1.5 font-bold">
          <span className="w-2 h-2 rounded-full bg-[#10B981] shadow-[0_0_8px_#10B981] animate-pulse" />
          <span>SYNCHRONIZED</span>
        </span>
      </div>

      {/* 4 Primary Colored KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        {/* 1. Cars Passed (Emerald Green) */}
        <div className="bg-[var(--bg-card-elevated)] border border-[#10B981]/30 hover:border-[#10B981] rounded-xl p-3 transition-all shadow-sm">
          <div className="flex items-center justify-between text-[var(--text-secondary)] mb-1">
            <span className="text-[10px] font-mono uppercase tracking-wider font-semibold">Cars Passed</span>
            <div className="w-6 h-6 rounded-md bg-[#10B981]/15 text-[#10B981] flex items-center justify-center">
              <Car className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-black text-[#10B981] font-mono tabular-nums">
            {stats.carsPassed}
          </div>
          <div className="text-[10px] text-[var(--text-secondary)] mt-0.5">Completed journeys</div>
        </div>

        {/* 2. Average Wait (Solar Amber / Gold) */}
        <div className="bg-[var(--bg-card-elevated)] border border-[#F59E0B]/30 hover:border-[#F59E0B] rounded-xl p-3 transition-all shadow-sm">
          <div className="flex items-center justify-between text-[var(--text-secondary)] mb-1">
            <span className="text-[10px] font-mono uppercase tracking-wider font-semibold">Average Wait</span>
            <div className="w-6 h-6 rounded-md bg-[#F59E0B]/15 text-[#F59E0B] flex items-center justify-center">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-black text-[#F59E0B] font-mono tabular-nums">
            {stats.averageWaitTime.toFixed(1)}<span className="text-xs text-[var(--text-secondary)] ml-1">s</span>
          </div>
          <div className="text-[10px] text-[var(--text-secondary)] mt-0.5">Per cleared vehicle</div>
        </div>

        {/* 3. Active Vehicles (Sky Cyan) */}
        <div className="bg-[var(--bg-card-elevated)] border border-[#0284C7]/30 hover:border-[#0284C7] rounded-xl p-3 transition-all shadow-sm">
          <div className="flex items-center justify-between text-[var(--text-secondary)] mb-1">
            <span className="text-[10px] font-mono uppercase tracking-wider font-semibold">Active Vehicles</span>
            <div className="w-6 h-6 rounded-md bg-[#0284C7]/15 text-[#0284C7] flex items-center justify-center">
              <Activity className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-black text-[#0284C7] font-mono tabular-nums">
            {stats.activeVehicles}
          </div>
          <div className="text-[10px] text-[var(--text-secondary)] mt-0.5">Live on junction</div>
        </div>

        {/* 4. Maximum Queue (Crimson Red / Purple) */}
        <div className="bg-[var(--bg-card-elevated)] border border-[#8B5CF6]/30 hover:border-[#8B5CF6] rounded-xl p-3 transition-all shadow-sm">
          <div className="flex items-center justify-between text-[var(--text-secondary)] mb-1">
            <span className="text-[10px] font-mono uppercase tracking-wider font-semibold">Max Queue</span>
            <div className="w-6 h-6 rounded-md bg-[#8B5CF6]/15 text-[#8B5CF6] flex items-center justify-center">
              <Users className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-black text-[#8B5CF6] font-mono tabular-nums">
            {stats.maxRecordedQueue}
          </div>
          <div className="text-[10px] text-[var(--text-secondary)] mt-0.5">Peak queue observed</div>
        </div>
      </div>

      {/* Directional Queue Decomposition */}
      <div className="pt-1">
        <div className="text-[10px] font-mono font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-2 flex items-center justify-between">
          <span>Directional Queue Decomposition</span>
          <span>Waiting / Max Observed</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {directions.map(({ dir, label, color, bg }) => {
            const dStat = stats.directionStats[dir];
            const maxVal = Math.max(10, stats.maxRecordedQueue || 10);
            const fillPct = Math.min(100, (dStat.currentQueue / maxVal) * 100);

            return (
              <div
                key={dir}
                className="bg-[var(--bg-card-elevated)] border border-[var(--border-color)] rounded-xl p-2.5 flex flex-col justify-between shadow-sm relative overflow-hidden"
              >
                <div className="flex justify-between items-center text-xs mb-1">
                  <div className="flex items-center space-x-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                    <span className="font-bold text-[var(--text-primary)]">{label}</span>
                  </div>
                  <span className="text-[10px] font-mono text-[var(--text-secondary)]">
                    Peak: {dStat.maxQueue}
                  </span>
                </div>

                <div className="flex items-baseline justify-between mt-1">
                  <div className="text-lg font-mono font-black" style={{ color }}>
                    {dStat.currentQueue} <span className="text-[10px] font-normal text-[var(--text-secondary)]">veh</span>
                  </div>
                  <div className="text-[10px] text-[var(--text-secondary)] font-mono">
                    {dStat.avgWaitTime.toFixed(1)}s avg
                  </div>
                </div>

                {/* Queue level meter */}
                <div className="w-full h-1.5 bg-[var(--bg-secondary)] rounded-full overflow-hidden mt-2">
                  <div
                    className={`h-full transition-all duration-300 ${
                      dStat.currentQueue > 6 
                        ? 'bg-[#EF4444]' 
                        : dStat.currentQueue > 3 
                          ? 'bg-[#F59E0B]' 
                          : 'bg-[#10B981]'
                    }`}
                    style={{ width: `${fillPct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Indian Vehicle Modal Composition Legend */}
      <div className="pt-1 border-t border-[var(--border-subtle)]">
        <div className="text-[10px] font-mono font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
          Heterogeneous Vehicle Traffic Mix (Indian Urban IRC Standard)
        </div>
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          {vehicleDistribution.map((v) => (
            <div
              key={v.label}
              className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg border text-xs font-mono font-medium"
              style={{
                backgroundColor: v.bg,
                borderColor: `${v.color}40`,
                color: v.color,
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: v.color }} />
              <span className="font-sans font-semibold text-[11px]">{v.label}</span>
              <span className="text-[10px] font-bold opacity-90">({v.share})</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
