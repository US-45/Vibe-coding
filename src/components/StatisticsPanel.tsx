import React from 'react';
import { 
  BarChart2, 
  Car, 
  Hourglass, 
  Activity, 
  Users, 
  ArrowUpRight,
  ShieldCheck
} from 'lucide-react';
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
    <div className="bg-[#242020] border border-[#413939] rounded-xl p-4 shadow-xl space-y-4">
      {/* Panel Header */}
      <div className="flex items-center justify-between border-b border-[#302A2A] pb-2">
        <div className="flex items-center space-x-2">
          <BarChart2 className="w-4 h-4 text-[#A41717]" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#F2EEEE]">Live Telemetry & KPIs</h2>
        </div>
        <span className="text-[10px] text-[#39B86B] font-mono flex items-center space-x-1">
          <span className="w-1.5 h-1.5 rounded-full bg-[#39B86B] animate-ping" />
          <span>REAL-TIME</span>
        </span>
      </div>

      {/* 4 Main KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        {/* Cars Passed */}
        <div className="bg-[#1C1919] border border-[#413939] rounded-lg p-3">
          <div className="flex items-center justify-between text-[#A4A4A4] mb-1">
            <span className="text-[10px] uppercase font-bold tracking-wider">Cars Passed</span>
            <Car className="w-3.5 h-3.5 text-[#39B86B]" />
          </div>
          <div className="text-2xl font-black text-[#F2EEEE] font-mono tabular-nums">
            {stats.carsPassed}
          </div>
          <div className="text-[10px] text-[#777171] mt-0.5">Cleared junction</div>
        </div>

        {/* Average Waiting Time */}
        <div className="bg-[#1C1919] border border-[#413939] rounded-lg p-3">
          <div className="flex items-center justify-between text-[#A4A4A4] mb-1">
            <span className="text-[10px] uppercase font-bold tracking-wider">Avg Wait Time</span>
            <Hourglass className="w-3.5 h-3.5 text-[#B59447]" />
          </div>
          <div className="text-2xl font-black text-[#E2C785] font-mono tabular-nums">
            {stats.averageWaitTime.toFixed(1)}<span className="text-sm font-normal text-[#A4A4A4] ml-1">s</span>
          </div>
          <div className="text-[10px] text-[#777171] mt-0.5">Per transit vehicle</div>
        </div>

        {/* Active Vehicles */}
        <div className="bg-[#1C1919] border border-[#413939] rounded-lg p-3">
          <div className="flex items-center justify-between text-[#A4A4A4] mb-1">
            <span className="text-[10px] uppercase font-bold tracking-wider">Active Road</span>
            <Activity className="w-3.5 h-3.5 text-[#3B82F6]" />
          </div>
          <div className="text-2xl font-black text-[#F2EEEE] font-mono tabular-nums">
            {stats.activeVehicles}
          </div>
          <div className="text-[10px] text-[#777171] mt-0.5">Vehicles on grid</div>
        </div>

        {/* Total Waiting in Queues */}
        <div className="bg-[#1C1919] border border-[#413939] rounded-lg p-3">
          <div className="flex items-center justify-between text-[#A4A4A4] mb-1">
            <span className="text-[10px] uppercase font-bold tracking-wider">Total Queued</span>
            <Users className="w-3.5 h-3.5 text-[#E54848]" />
          </div>
          <div className={`text-2xl font-black font-mono tabular-nums ${
            stats.totalWaitingVehicles > 10 ? 'text-[#E54848]' : 'text-[#F2EEEE]'
          }`}>
            {stats.totalWaitingVehicles}
          </div>
          <div className="text-[10px] text-[#777171] mt-0.5">Peak queue: {stats.maxRecordedQueue}</div>
        </div>
      </div>

      {/* Per-Direction Queue Lengths */}
      <div className="pt-2">
        <div className="text-[11px] font-bold uppercase tracking-wider text-[#A4A4A4] mb-2 flex items-center justify-between">
          <span>Directional Queue Decomposition</span>
          <span className="text-[10px] font-normal text-[#777171]">Current / Peak</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {directions.map(({ dir, label }) => {
            const dStat = stats.directionStats[dir];
            return (
              <div
                key={dir}
                className="bg-[#1C1919] border border-[#302A2A] rounded-lg p-2.5 flex flex-col justify-between"
              >
                <div className="flex justify-between items-center text-xs mb-1">
                  <span className="font-bold text-[#F2EEEE]">{label}</span>
                  <span className="text-[10px] font-mono text-[#A4A4A4]">
                    Peak: {dStat.maxQueue}
                  </span>
                </div>

                <div className="flex items-baseline justify-between">
                  <div className="text-lg font-mono font-bold text-[#F2EEEE]">
                    {dStat.currentQueue} <span className="text-[10px] font-normal text-[#777171]">waiting</span>
                  </div>
                  <div className="text-[10px] text-[#A4A4A4] font-mono">
                    {dStat.avgWaitTime.toFixed(1)}s wait
                  </div>
                </div>

                {/* Queue length visual bar */}
                <div className="w-full h-1.5 bg-[#141010] rounded-full overflow-hidden mt-1.5 border border-[#302A2A]">
                  <div
                    className={`h-full transition-all duration-300 ${
                      dStat.currentQueue > 6 
                        ? 'bg-[#E54848]' 
                        : dStat.currentQueue > 3 
                          ? 'bg-[#F2B544]' 
                          : 'bg-[#39B86B]'
                    }`}
                    style={{ width: `${Math.min(100, (dStat.currentQueue / 12) * 100)}%` }}
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
