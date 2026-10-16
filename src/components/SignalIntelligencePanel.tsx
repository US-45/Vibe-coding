import React from 'react';
import { Cpu, Clock, Activity, Zap, CheckCircle2, ShieldAlert } from 'lucide-react';
import { Direction, SignalMode, SignalPhase, SignalState } from '../types/simulation';

interface SignalIntelligencePanelProps {
  currentPhase: SignalPhase;
  signalMode: SignalMode;
  signals: Record<Direction, SignalState>;
  queues: Record<Direction, number>;
  adaptiveReason?: string | null;
  phaseElapsed: number;
  phaseDuration: number;
}

export const SignalIntelligencePanel: React.FC<SignalIntelligencePanelProps> = ({
  currentPhase,
  signalMode,
  signals,
  queues,
  adaptiveReason,
  phaseElapsed,
  phaseDuration,
}) => {
  const nsQueue = (queues.north || 0) + (queues.south || 0);
  const ewQueue = (queues.east || 0) + (queues.west || 0);

  const isNsActive = currentPhase === 'NS_GREEN' || currentPhase === 'NS_AMBER';
  const isEwActive = currentPhase === 'EW_GREEN' || currentPhase === 'EW_AMBER';
  const isClearance = currentPhase === 'ALL_RED_1' || currentPhase === 'ALL_RED_2' || currentPhase === 'EMERGENCY_CLEARANCE';
  const isEmergency = currentPhase === 'EMERGENCY_ACTIVE';

  const phaseLabel = isEmergency
    ? 'EMERGENCY GREEN CORRIDOR'
    : isClearance
      ? 'ALL-RED CLEARANCE INTERVAL'
      : isNsActive
        ? 'NORTH–SOUTH PHASE ACTIVE'
        : 'EAST–WEST PHASE ACTIVE';

  const remainingSeconds = Math.max(0, Math.ceil(phaseDuration - phaseElapsed));
  const progressPct = Math.min(100, (phaseElapsed / Math.max(1, phaseDuration)) * 100);

  return (
    <div className="bg-[#12161B] border border-[#2A323B] rounded-xl p-4 shadow-sm space-y-3.5">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#1E252D] pb-2.5">
        <div className="flex items-center space-x-2">
          <Cpu className="w-4 h-4 text-[#C6F36B]" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#F3F5F7]">
            Signal Intelligence
          </h2>
        </div>
        <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[#191F26] text-[#929DA9] border border-[#2A323B]">
          {signalMode === 'adaptive' ? 'Actuated Logic' : 'Static Cycle'}
        </span>
      </div>

      {/* Current Phase & Countdown Display */}
      <div className="bg-[#191F26] border border-[#2A323B] rounded-lg p-3 space-y-2">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="text-[10px] font-mono uppercase tracking-wider text-[#929DA9]">
              Active Corridor
            </div>
            <div className="text-xs font-bold text-[#F3F5F7] tracking-tight flex items-center space-x-1.5">
              <span className={`w-2 h-2 rounded-full ${
                isEmergency 
                  ? 'bg-[#FF6268] animate-ping' 
                  : isClearance 
                    ? 'bg-[#FFBD59]' 
                    : 'bg-[#36D98A]'
              }`} />
              <span>{phaseLabel}</span>
            </div>
          </div>

          <div className="text-right">
            <div className="text-[10px] font-mono uppercase tracking-wider text-[#929DA9]">
              Remaining
            </div>
            <div className="text-sm font-mono font-bold text-[#C6F36B] tabular-nums">
              {remainingSeconds}s <span className="text-[10px] text-[#929DA9] font-normal">/ {phaseDuration}s</span>
            </div>
          </div>
        </div>

        {/* Phase Progress Bar */}
        <div className="w-full h-1.5 bg-[#0B0D10] rounded-full overflow-hidden border border-[#2A323B]/60">
          <div
            className="h-full bg-[#C6F36B] transition-all duration-200"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Eligible Phase Queue Comparison */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        {/* NS Approach Queue */}
        <div className={`p-2.5 rounded-lg border transition-all ${
          isNsActive 
            ? 'bg-[#191F26] border-[#36D98A]/50 text-[#F3F5F7]' 
            : 'bg-[#0B0D10]/50 border-[#2A323B] text-[#929DA9]'
        }`}>
          <div className="flex justify-between items-center mb-1">
            <span className="font-semibold text-[11px]">North–South</span>
            {isNsActive && <span className="text-[9px] font-bold text-[#36D98A] uppercase">Active</span>}
          </div>
          <div className="text-lg font-mono font-bold text-[#F3F5F7] tabular-nums">
            {nsQueue} <span className="text-[10px] font-normal text-[#929DA9]">waiting</span>
          </div>
        </div>

        {/* EW Approach Queue */}
        <div className={`p-2.5 rounded-lg border transition-all ${
          isEwActive 
            ? 'bg-[#191F26] border-[#36D98A]/50 text-[#F3F5F7]' 
            : 'bg-[#0B0D10]/50 border-[#2A323B] text-[#929DA9]'
        }`}>
          <div className="flex justify-between items-center mb-1">
            <span className="font-semibold text-[11px]">East–West</span>
            {isEwActive && <span className="text-[9px] font-bold text-[#36D98A] uppercase">Active</span>}
          </div>
          <div className="text-lg font-mono font-bold text-[#F3F5F7] tabular-nums">
            {ewQueue} <span className="text-[10px] font-normal text-[#929DA9]">waiting</span>
          </div>
        </div>
      </div>

      {/* Decision Rationale / Explanation */}
      <div className="bg-[#0B0D10] border border-[#2A323B] rounded-lg p-2.5 space-y-1">
        <div className="flex items-center space-x-1.5 text-[10px] font-mono uppercase text-[#C6F36B]">
          <Zap className="w-3 h-3" />
          <span>Controller Rationale:</span>
        </div>
        <p className="text-[11px] text-[#F3F5F7] leading-relaxed">
          {signalMode === 'adaptive'
            ? adaptiveReason || (
                nsQueue > ewQueue
                  ? `North–South selected: higher observed demand (${nsQueue} vs ${ewQueue} vehicles). Allocating extended green.`
                  : ewQueue > nsQueue
                    ? `East–West selected: higher observed demand (${ewQueue} vs ${nsQueue} vehicles). Allocating extended green.`
                    : `Balanced queue demand observed (${nsQueue} vs ${ewQueue} vehicles). Standard phase allocated.`
              )
            : 'Fixed timing active: running predetermined 15s green / 3s amber cycle regardless of queue imbalance.'}
        </p>
      </div>

      {/* Constraints & Limits */}
      <div className="flex items-center justify-between text-[10px] font-mono text-[#929DA9] pt-1">
        <span>Min Green: 6s • Max Green: 28s</span>
        <span>All-Red Clearance: 1.5s</span>
      </div>
    </div>
  );
};
