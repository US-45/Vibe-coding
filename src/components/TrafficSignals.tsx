import React from 'react';
import { Compass, Clock } from 'lucide-react';
import { Direction, SignalState } from '../types/simulation';

interface TrafficSignalsProps {
  signals: Record<Direction, SignalState>;
}

export const TrafficSignals: React.FC<TrafficSignalsProps> = ({ signals }) => {
  const directions: { dir: Direction; label: string; sub: string }[] = [
    { dir: 'north', label: 'NORTH', sub: 'Southbound Flow' },
    { dir: 'south', label: 'SOUTH', sub: 'Northbound Flow' },
    { dir: 'east', label: 'EAST', sub: 'Westbound Flow' },
    { dir: 'west', label: 'WEST', sub: 'Eastbound Flow' },
  ];

  return (
    <div className="bg-[#12161B] border border-[#2A323B] rounded-xl p-4 shadow-sm space-y-3">
      <div className="flex items-center justify-between border-b border-[#1E252D] pb-2">
        <div className="flex items-center space-x-2">
          <Compass className="w-4 h-4 text-[#75B8FF]" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#F3F5F7]">
            Signal Phase Array
          </h2>
        </div>
        <span className="text-[10px] font-mono text-[#929DA9]">High Accessibility B&W</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {directions.map(({ dir, label, sub }) => {
          const sig = signals[dir];
          const isGreen = sig.color === 'green';
          const isAmber = sig.color === 'amber';
          const isRed = sig.color === 'red';

          const borderColor = isGreen ? 'border-[#36D98A]/60' : (isAmber ? 'border-[#FFBD59]/60' : 'border-[#2A323B]');
          const bgPill = isGreen 
            ? 'bg-[#36D98A]/15 text-[#36D98A]' 
            : isAmber 
              ? 'bg-[#FFBD59]/15 text-[#FFBD59]' 
              : 'bg-[#FF6268]/15 text-[#FF6268]';

          return (
            <div
              key={dir}
              className={`bg-[#191F26] border ${borderColor} rounded-lg p-3 flex flex-col justify-between transition-colors shadow-sm relative overflow-hidden`}
            >
              {/* Top: Direction and Countdown */}
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-bold text-xs text-[#F3F5F7]">{label}</div>
                  <div className="text-[10px] text-[#929DA9] truncate">{sub}</div>
                </div>
                <div className="flex items-center space-x-1 text-xs font-mono font-bold text-[#F3F5F7] bg-[#0B0D10] px-1.5 py-0.5 rounded border border-[#2A323B]">
                  <Clock className="w-2.5 h-2.5 text-[#929DA9]" />
                  <span>{sig.remainingTime}s</span>
                </div>
              </div>

              {/* Middle: 3-Lamp Miniature Signal */}
              <div className="my-2 py-1.5 px-2 bg-[#0B0D10] rounded-md border border-[#2A323B] flex items-center justify-around">
                {/* Red */}
                <div
                  className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-black transition-all ${
                    isRed ? 'bg-[#FF6268] text-white shadow-[0_0_8px_#FF6268]' : 'bg-[#261618] text-[#552B2B]'
                  }`}
                  title="Red Light - STOP"
                >
                  ■
                </div>
                {/* Amber */}
                <div
                  className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-black transition-all ${
                    isAmber ? 'bg-[#FFBD59] text-black shadow-[0_0_8px_#FFBD59]' : 'bg-[#292214] text-[#5A4520]'
                  }`}
                  title="Amber Light - WAIT"
                >
                  ◆
                </div>
                {/* Green */}
                <div
                  className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-black transition-all ${
                    isGreen ? 'bg-[#36D98A] text-black shadow-[0_0_8px_#36D98A]' : 'bg-[#11261B] text-[#245237]'
                  }`}
                  title="Green Light - GO"
                >
                  ▲
                </div>
              </div>

              {/* Bottom: Explicit Text Label & Distinct Shape for B&W */}
              <div className={`w-full py-1 rounded text-center text-xs font-black tracking-widest uppercase flex items-center justify-center space-x-1.5 ${bgPill}`}>
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
