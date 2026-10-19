import React from 'react';
import { Compass, Clock } from 'lucide-react';
import { Direction, SignalState } from '../types/simulation';

interface TrafficSignalsProps {
  signals: Record<Direction, SignalState>;
}

export const TrafficSignals: React.FC<TrafficSignalsProps> = ({ signals }) => {
  const directions: { dir: Direction; label: string; sub: string; accentColor: string; accentBg: string }[] = [
    { dir: 'north', label: 'NORTH', sub: 'Southbound Flow', accentColor: '#0284C7', accentBg: 'rgba(2, 132, 199, 0.12)' },
    { dir: 'south', label: 'SOUTH', sub: 'Northbound Flow', accentColor: '#6366F1', accentBg: 'rgba(99, 102, 241, 0.12)' },
    { dir: 'east', label: 'EAST', sub: 'Westbound Flow', accentColor: '#F59E0B', accentBg: 'rgba(245, 158, 11, 0.12)' },
    { dir: 'west', label: 'WEST', sub: 'Eastbound Flow', accentColor: '#10B981', accentBg: 'rgba(16, 185, 129, 0.12)' },
  ];

  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-4 shadow-sm space-y-3 transition-colors duration-250">
      <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-2">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 rounded-md bg-[#0284C7]/15 border border-[#0284C7]/30 flex items-center justify-center text-[#0284C7]">
            <Compass className="w-3.5 h-3.5" />
          </div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)]">
            Signal Phase Array
          </h2>
        </div>
        <span className="text-[10px] font-mono text-[var(--text-secondary)]">IRC Standard 4-Way</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {directions.map(({ dir, label, sub, accentColor, accentBg }) => {
          const sig = signals[dir];
          const isGreen = sig.color === 'green';
          const isAmber = sig.color === 'amber';
          const isRed = sig.color === 'red';

          const cardBorder = isGreen 
            ? 'border-[#10B981]/60 shadow-[0_0_12px_rgba(16,185,129,0.15)]' 
            : isAmber 
              ? 'border-[#F59E0B]/60 shadow-[0_0_12px_rgba(245,158,11,0.15)]' 
              : 'border-[#EF4444]/40 shadow-[0_0_12px_rgba(239,68,68,0.1)]';

          const statusBadge = isGreen 
            ? 'bg-[#10B981] text-white shadow-sm' 
            : isAmber 
              ? 'bg-[#F59E0B] text-black shadow-sm' 
              : 'bg-[#EF4444] text-white shadow-sm';

          return (
            <div
              key={dir}
              className={`bg-[var(--bg-card-elevated)] border ${cardBorder} rounded-xl p-3 flex flex-col justify-between transition-all relative overflow-hidden`}
            >
              {/* Top Colored Direction Pill & Countdown */}
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="flex items-center space-x-1.5">
                    <span 
                      className="w-2 h-2 rounded-full" 
                      style={{ backgroundColor: accentColor }} 
                    />
                    <span className="font-bold text-xs text-[var(--text-primary)] tracking-wide">
                      {label}
                    </span>
                  </div>
                  <div className="text-[10px] text-[var(--text-secondary)] truncate mt-0.5">{sub}</div>
                </div>

                <div className="flex items-center space-x-1 text-xs font-mono font-bold text-[var(--text-primary)] bg-[var(--bg-secondary)] px-2 py-0.5 rounded-md border border-[var(--border-subtle)]">
                  <Clock className="w-2.5 h-2.5 text-[var(--text-secondary)]" />
                  <span className="tabular-nums">{sig.remainingTime}s</span>
                </div>
              </div>

              {/* Middle: 3-Lamp Miniature Signal */}
              <div className="my-1.5 py-1.5 px-3 bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-color)] flex items-center justify-around">
                {/* Red Lamp */}
                <div
                  className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-black transition-all ${
                    isRed 
                      ? 'bg-[#EF4444] text-white shadow-[0_0_10px_#EF4444]' 
                      : 'bg-black/20 text-transparent opacity-30 border border-black/10'
                  }`}
                  title="Red Light - STOP"
                >
                  ■
                </div>
                {/* Amber Lamp */}
                <div
                  className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-black transition-all ${
                    isAmber 
                      ? 'bg-[#F59E0B] text-black shadow-[0_0_10px_#F59E0B]' 
                      : 'bg-black/20 text-transparent opacity-30 border border-black/10'
                  }`}
                  title="Amber Light - CLEAR"
                >
                  ◆
                </div>
                {/* Green Lamp */}
                <div
                  className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-black transition-all ${
                    isGreen 
                      ? 'bg-[#10B981] text-white shadow-[0_0_10px_#10B981]' 
                      : 'bg-black/20 text-transparent opacity-30 border border-black/10'
                  }`}
                  title="Green Light - GO"
                >
                  ▲
                </div>
              </div>

              {/* Bottom: Status Pill with Symbol */}
              <div className={`w-full py-1 rounded-md text-center text-xs font-black tracking-widest uppercase flex items-center justify-center space-x-1.5 ${statusBadge} mt-1`}>
                <span>{sig.symbol}</span>
                <span>{sig.label}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
