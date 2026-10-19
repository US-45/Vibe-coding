import React from 'react';
import { Cpu, Zap, Activity } from 'lucide-react';
import { Direction, SignalMode, SignalPhase, SignalState } from '../types/simulation';
import { useTheme } from '../context/ThemeContext';

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
  signals: _signals,
  queues,
  adaptiveReason,
  phaseElapsed,
  phaseDuration,
}) => {
  const { currentTheme } = useTheme();

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

  const activeColor = isEmergency
    ? '#EF4444'
    : isClearance
      ? '#F59E0B'
      : '#10B981';

  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-4 shadow-sm space-y-3.5 transition-colors duration-250">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-2.5">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 rounded-md bg-[#0284C7]/15 border border-[#0284C7]/30 flex items-center justify-center text-[#0284C7]">
            <Cpu className="w-3.5 h-3.5" />
          </div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)]">
            Signal Intelligence
          </h2>
        </div>
        <span className={`text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded-md border ${
          signalMode === 'adaptive'
            ? 'bg-[#10B981]/15 text-[#10B981] border-[#10B981]/40 shadow-sm'
            : 'bg-[#F59E0B]/15 text-[#F59E0B] border-[#F59E0B]/40 shadow-sm'
        }`}>
          {signalMode === 'adaptive' ? 'Actuated Dynamic' : 'Static Fixed'}
        </span>
      </div>

      {/* Current Phase & Countdown Display */}
      <div className="bg-[var(--bg-card-elevated)] border border-[var(--border-color)] rounded-xl p-3.5 space-y-2.5 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-secondary)] font-semibold">
              Active Corridor
            </div>
            <div className="text-xs font-black tracking-tight flex items-center space-x-1.5" style={{ color: activeColor }}>
              <span 
                className="w-2.5 h-2.5 rounded-full shadow-[0_0_8px_currentColor] animate-pulse" 
                style={{ backgroundColor: activeColor }} 
              />
              <span>{phaseLabel}</span>
            </div>
          </div>

          <div className="text-right">
            <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-secondary)] font-semibold">
              Remaining Green
            </div>
            <div className="text-sm font-mono font-black tabular-nums text-[var(--text-primary)]">
              <span className="text-base" style={{ color: activeColor }}>{remainingSeconds}s</span>
              <span className="text-[10px] text-[var(--text-secondary)] font-normal ml-1">/ {phaseDuration}s</span>
            </div>
          </div>
        </div>

        {/* Phase Progress Bar with rich vibrant gradient */}
        <div className="w-full h-2 bg-[var(--bg-secondary)] rounded-full overflow-hidden border border-[var(--border-subtle)] p-0.5">
          <div
            className="h-full rounded-full transition-all duration-200"
            style={{
              width: `${progressPct}%`,
              background: isEmergency 
                ? 'linear-gradient(90deg, #DC2626, #EF4444)' 
                : isClearance 
                  ? 'linear-gradient(90deg, #D97706, #F59E0B)' 
                  : 'linear-gradient(90deg, #059669, #10B981)',
              boxShadow: `0 0 8px ${activeColor}80`,
            }}
          />
        </div>
      </div>

      {/* Approach Queue Dual Comparison */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        {/* NS Approach Queue */}
        <div className={`p-3 rounded-xl border transition-all ${
          isNsActive 
            ? 'bg-[#0284C7]/10 border-[#0284C7] shadow-sm' 
            : 'bg-[var(--bg-secondary)] border-[var(--border-color)]'
        }`}>
          <div className="flex justify-between items-center mb-1">
            <span className="font-bold text-[11px] text-[#0284C7]">North–South</span>
            {isNsActive ? (
              <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-[#0284C7] text-white uppercase">
                Active
              </span>
            ) : (
              <span className="text-[9px] font-mono text-[var(--text-secondary)]">Standby</span>
            )}
          </div>
          <div className="text-xl font-mono font-black text-[var(--text-primary)] tabular-nums">
            {nsQueue} <span className="text-[10px] font-normal text-[var(--text-secondary)]">waiting veh</span>
          </div>
        </div>

        {/* EW Approach Queue */}
        <div className={`p-3 rounded-xl border transition-all ${
          isEwActive 
            ? 'bg-[#10B981]/10 border-[#10B981] shadow-sm' 
            : 'bg-[var(--bg-secondary)] border-[var(--border-color)]'
        }`}>
          <div className="flex justify-between items-center mb-1">
            <span className="font-bold text-[11px] text-[#10B981]">East–West</span>
            {isEwActive ? (
              <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-[#10B981] text-white uppercase">
                Active
              </span>
            ) : (
              <span className="text-[9px] font-mono text-[var(--text-secondary)]">Standby</span>
            )}
          </div>
          <div className="text-xl font-mono font-black text-[var(--text-primary)] tabular-nums">
            {ewQueue} <span className="text-[10px] font-normal text-[var(--text-secondary)]">waiting veh</span>
          </div>
        </div>
      </div>

      {/* Decision Rationale / Dynamic Controller Logic */}
      <div className="bg-[var(--bg-secondary)] border border-[#0284C7]/30 rounded-xl p-3 space-y-1.5 shadow-sm">
        <div className="flex items-center space-x-1.5 text-[10px] font-mono font-bold uppercase text-[#0284C7]">
          <Zap className="w-3.5 h-3.5 fill-current" />
          <span>Actuation Intelligence Log:</span>
        </div>
        <p className="text-[11px] text-[var(--text-primary)] leading-relaxed font-sans">
          {signalMode === 'adaptive'
            ? adaptiveReason || (
                isEmergency 
                  ? 'Priority green corridor locked for emergency response. All conflicting cross-traffic held at red stop line.'
                  : nsQueue > ewQueue
                    ? `Actuated controller favoring North-South corridor (load differential +${nsQueue - ewQueue} vehicles) to relieve corridor congestion.`
                    : ewQueue > nsQueue
                      ? `Actuated controller favoring East-West corridor (load differential +${ewQueue - nsQueue} vehicles) to mitigate gridlock.`
                      : 'Approach queues balanced; adaptive controller maintaining standard actuated throughput.'
              )
            : 'Static fixed-time cycling without congestion adaptation. Fixed 15s green / 3s amber intervals.'}
        </p>
      </div>
    </div>
  );
};
