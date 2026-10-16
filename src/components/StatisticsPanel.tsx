import React from 'react';
import { BarChart3, Car, Clock, Activity, Users } from 'lucide-react';
import { Direction, SimulationStats } from '../types/simulation';

interface StatisticsPanelProps {
  stats: SimulationStats;
}

export const StatisticsPanel: React.FC<StatisticsPanelProps> = ({ stats }) => {
  const directions: { dir: Direction; label: string }[] = [
    { dir: 'north', label: 'North' },
    { dir: 'south', label: 'South' },
    { dir: 'east', label: 'East' },
    { dir: 'west', label: 'West' },
  ];

  return (
    <div className="bg-[#12161B] border border-[#2A323B] rounded-xl p-4 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#1E252D] pb-2.5">
        <div className="flex items-center space-x-2">
          <BarChart3 className="w-4 h-4 text-[#C6F36B]" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#F3F5F7]">
            Live Traffic Metrics
          </h2>
        </div>
        <span className="text-[10px] font-mono text-[#36D98A] flex items-center space-x-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#36D98A] shadow-[0_0_6px_#36D98A]" />
          <span>SYNCHRONIZED</span>
        </span>
      </div>

      {/* 4 Primary Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        {/* 1. Cars Passed */}
        <div className="bg-[#191F26] border border-[#2A323B] rounded-lg p-3">
          <div className="flex items-center justify-between text-[#929DA9] mb-1">
            <span className="text-[10px] font-mono uppercase tracking-wider">Cars Passed</span>
            <Car className="w-3.5 h-3.5 text-[#36D98A]" />
          </div>
          <div className="text-2xl font-bold text-[#F3F5F7] font-mono tabular-nums">
            {stats.carsPassed}
          </div>
          <div className="text-[10px] text-[#929DA9] mt-0.5">Completed journeys</div>
        </div>

        {/* 2. Average Wait */}
        <div className="bg-[#191F26] border border-[#2A323B] rounded-lg p-3">
          <div className="flex items-center justify-between text-[#929DA9] mb-1">
            <span className="text-[10px] font-mono uppercase tracking-wider">Average Wait</span>
            <Clock className="w-3.5 h-3.5 text-[#C6F36B]" />
          </div>
          <div className="text-2xl font-bold text-[#C6F36B] font-mono tabular-nums">
            {stats.averageWaitTime.toFixed(1)}<span className="text-xs text-[#929DA9] ml-1">s</span>
          </div>
          <div className="text-[10px] text-[#929DA9] mt-0.5">Per cleared vehicle</div>
        </div>

        {/* 3. Active Vehicles */}
        <div className="bg-[#191F26] border border-[#2A323B] rounded-lg p-3">
          <div className="flex items-center justify-between text-[#929DA9] mb-1">
            <span className="text-[10px] font-mono uppercase tracking-wider">Active Vehicles</span>
            <Activity className="w-3.5 h-3.5 text-[#75B8FF]" />
          </div>
          <div className="text-2xl font-bold text-[#F3F5F7] font-mono tabular-nums">
            {stats.activeVehicles}
          </div>
          <div className="text-[10px] text-[#929DA9] mt-0.5">On network</div>
        </div>

        {/* 4. Maximum Queue */}
        <div className="bg-[#191F26] border border-[#2A323B] rounded-lg p-3">
          <div className="flex items-center justify-between text-[#929DA9] mb-1">
            <span className="text-[10px] font-mono uppercase tracking-wider">Maximum Queue</span>
            <Users className="w-3.5 h-3.5 text-[#FFBD59]" />
          </div>
          <div className="text-2xl font-bold text-[#F3F5F7] font-mono tabular-nums">
            {stats.maxRecordedQueue}
          </div>
          <div className="text-[10px] text-[#929DA9] mt-0.5">Peak queue observed</div>
        </div>
      </div>

      {/* Directional Queue Breakdown */}
      <div className="pt-1">
        <div className="text-[10px] font-mono font-semibold uppercase tracking-wider text-[#929DA9] mb-2 flex items-center justify-between">
          <span>Directional Queue Decomposition</span>
          <span>Waiting / Max</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {directions.map(({ dir, label }) => {
            const dStat = stats.directionStats[dir];
            const maxVal = Math.max(10, stats.maxRecordedQueue || 10);
            const fillPct = Math.min(100, (dStat.currentQueue / maxVal) * 100);

            return (
              <div
                key={dir}
                className="bg-[#191F26] border border-[#2A323B] rounded-lg p-2.5 flex flex-col justify-between"
              >
                <div className="flex justify-between items-center text-xs mb-1">
                  <span className="font-semibold text-[#F3F5F7]">{label}</span>
                  <span className="text-[10px] font-mono text-[#929DA9]">
                    Peak: {dStat.maxQueue}
                  </span>
                </div>

                <div className="flex items-baseline justify-between">
                  <div className="text-lg font-mono font-bold text-[#F3F5F7]">
                    {dStat.currentQueue} <span className="text-[10px] font-normal text-[#929DA9]">veh</span>
                  </div>
                  <div className="text-[10px] text-[#929DA9] font-mono">
                    {dStat.avgWaitTime.toFixed(1)}s wait
                  </div>
                </div>

                {/* Minimal horizontal queue indicator bar */}
                <div className="w-full h-1 bg-[#0B0D10] rounded-full overflow-hidden mt-2">
                  <div
                    className={`h-full transition-all duration-300 ${
                      dStat.currentQueue > 6 
                        ? 'bg-[#FF6268]' 
                        : dStat.currentQueue > 3 
                          ? 'bg-[#FFBD59]' 
                          : 'bg-[#36D98A]'
                    }`}
                    style={{ width: `${fillPct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
