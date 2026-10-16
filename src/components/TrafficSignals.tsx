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
    <div className="bg-[#242020] border border-[#413939] rounded-xl p-4 shadow-xl space-y-3">
      <div className="flex items-center justify-between border-b border-[#302A2A] pb-2">
        <div className="flex items-center space-x-2">
          <Compass className="w-4 h-4 text-[#A41717]" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#F2EEEE]">Signal Phase Array</h2>
        </div>
        <span className="text-[10px] text-[#A4A4A4]">High Accessibility B&W</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {directions.map(({ dir, label, sub }) => {
          const sig = signals[dir];
          const isGreen = sig.color === 'green';
          const isAmber = sig.color === 'amber';
          const isRed = sig.color === 'red';

          const borderColor = isGreen ? 'border-[#39B86B]' : (isAmber ? 'border-[#F2B544]' : 'border-[#413939]');
          const bgPill = isGreen ? 'bg-[#39B86B]/15 text-[#39B86B]' : (isAmber ? 'bg-[#F2B544]/15 text-[#F2B544]' : 'bg-[#E54848]/15 text-[#E54848]');

          return (
            <div
              key={dir}
              className={`bg-[#1C1919] border ${borderColor} rounded-lg p-3 flex flex-col justify-between transition-colors shadow-sm relative overflow-hidden`}
            >
              {/* Top: Direction and Countdown */}
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-bold text-xs text-[#F2EEEE]">{label}</div>
                  <div className="text-[10px] text-[#A4A4A4] truncate">{sub}</div>
                </div>
                <div className="flex items-center space-x-1 text-xs font-mono font-bold text-[#F2EEEE] bg-[#242020] px-1.5 py-0.5 rounded border border-[#413939]">
                  <Clock className="w-2.5 h-2.5 text-[#A4A4A4]" />
                  <span>{sig.remainingTime}s</span>
                </div>
              </div>

              {/* Middle: 3-Lamp Miniature Signal */}
              <div className="my-2 py-1.5 px-2 bg-[#141010] rounded-md border border-[#302A2A] flex items-center justify-around">
                {/* Red */}
                <div
                  className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-black transition-all ${
                    isRed ? 'bg-[#E54848] text-white shadow-[0_0_8px_#E54848]' : 'bg-[#2A1818] text-[#552B2B]'
                  }`}
                  title="Red Light - STOP"
                >
                  ■
                </div>
                {/* Amber */}
                <div
                  className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-black transition-all ${
                    isAmber ? 'bg-[#F2B544] text-black shadow-[0_0_8px_#F2B544]' : 'bg-[#2D2415] text-[#5A4520]'
                  }`}
                  title="Amber Light - WAIT"
                >
                  ◆
                </div>
                {/* Green */}
                <div
                  className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-black transition-all ${
                    isGreen ? 'bg-[#39B86B] text-black shadow-[0_0_8px_#39B86B]' : 'bg-[#152B1E] text-[#245237]'
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
