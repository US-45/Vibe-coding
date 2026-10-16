import React, { useEffect, useRef } from 'react';
import { Siren, Compass, Cpu, Clock, Car } from 'lucide-react';
import { Direction, SignalMode, SignalPhase, SignalState } from '../types/simulation';
import { useTheme } from '../context/ThemeContext';

interface SimulationCanvasProps {
  onCanvasReady: (canvas: HTMLCanvasElement | null) => void;
  currentPhase: SignalPhase;
  signalMode: SignalMode;
  signals: Record<Direction, SignalState>;
  elapsedTime: number;
  activeVehiclesCount: number;
  freeLeftTurnEnabled: boolean;
}

export const SimulationCanvas: React.FC<SimulationCanvasProps> = ({
  onCanvasReady,
  currentPhase,
  signalMode,
  signals,
  elapsedTime,
  activeVehiclesCount,
  freeLeftTurnEnabled,
}) => {
  const { currentTheme } = useTheme();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (canvasRef.current) {
      onCanvasReady(canvasRef.current);
    }
    return () => {
      onCanvasReady(null);
    };
  }, [onCanvasReady]);

  const isEmergency = currentPhase === 'EMERGENCY_ACTIVE' || currentPhase === 'EMERGENCY_CLEARANCE';

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Human-readable phase label
  const phaseDisplay = isEmergency
    ? 'EMERGENCY CORRIDOR'
    : currentPhase === 'NS_GREEN'
      ? 'NORTH–SOUTH GREEN'
      : currentPhase === 'NS_AMBER'
        ? 'NORTH–SOUTH AMBER'
        : currentPhase === 'EW_GREEN'
          ? 'EAST–WEST GREEN'
          : currentPhase === 'EW_AMBER'
            ? 'EAST–WEST AMBER'
            : 'ALL-RED CLEARANCE';

  return (
    <div className="bg-[#12161B] border border-[#2A323B] rounded-xl p-3 sm:p-4 shadow-sm flex flex-col items-center relative overflow-hidden">
      {/* Top Header & Compact Overlay Bar */}
      <div className="w-full flex flex-wrap items-center justify-between gap-2 mb-3 text-xs">
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: currentTheme.color }} />
          <span className="font-mono font-bold tracking-wider uppercase text-[#F3F5F7] text-[11px]">
            FOUR-WAY INTERSECTION — LIVE FEED
          </span>
        </div>

        {/* Compact Simulation Status Overlay */}
        <div className="flex items-center space-x-2 font-mono text-[10px]">
          <span className="px-2 py-0.5 rounded bg-[#191F26] border border-[#2A323B] text-[#929DA9]">
            PHASE: <strong className="text-[#F3F5F7]">{phaseDisplay}</strong>
          </span>
          <span className="px-2 py-0.5 rounded bg-[#191F26] border border-[#2A323B] text-[#929DA9]">
            TIME: <strong style={{ color: currentTheme.color }}>{formatTime(elapsedTime)}</strong>
          </span>
          <span className="px-2 py-0.5 rounded bg-[#191F26] border border-[#2A323B] text-[#929DA9]">
            ON GRID: <strong className="text-[#F3F5F7]">{activeVehiclesCount}</strong>
          </span>
        </div>
      </div>

      {/* Emergency Corridor Alert Banner */}
      {isEmergency && (
        <div className="w-full mb-3 bg-[#FF6268]/20 border border-[#FF6268] text-[#FF6268] px-3 py-1.5 rounded-lg flex items-center justify-center space-x-2 font-bold text-xs uppercase tracking-wide animate-pulse">
          <Siren className="w-4 h-4" />
          <span>108 EMERGENCY CORRIDOR ACTIVE — CLEARING CENTRAL BOX</span>
        </div>
      )}

      {/* Main HTML5 Canvas Container */}
      <div className="relative rounded-lg overflow-hidden border border-[#2A323B] bg-[#0B0D10] shadow-inner flex items-center justify-center w-full">
        <canvas
          ref={canvasRef}
          width={700}
          height={700}
          className="w-full max-w-[620px] aspect-square object-contain block select-none cursor-crosshair"
          title="Indian Four-Way Junction Simulation"
        />

        {/* Compass Watermark */}
        <div className="absolute top-3 left-3 flex items-center space-x-1 font-mono text-[9px] text-[#929DA9] bg-[#12161B]/80 px-2 py-1 rounded border border-[#2A323B]">
          <Compass className="w-3 h-3 text-[#75B8FF]" />
          <span>LHT • INDIA</span>
        </div>
      </div>

      {/* Approach Signal States & Legend */}
      <div className="w-full mt-3 pt-3 border-t border-[#1E252D] flex flex-wrap items-center justify-between gap-3 text-[11px] text-[#929DA9]">
        {/* Signal State Quick Indicators */}
        <div className="flex items-center space-x-3 font-mono">
          <span className="font-semibold text-[#F3F5F7]">Signals:</span>
          {(['north', 'south', 'east', 'west'] as Direction[]).map((d) => {
            const sig = signals[d];
            const isGreen = sig.color === 'green';
            const isAmber = sig.color === 'amber';
            const colorClass = isGreen ? 'text-[#36D98A]' : (isAmber ? 'text-[#FFBD59]' : 'text-[#FF6268]');
            return (
              <span key={d} className="flex items-center space-x-1">
                <span className="uppercase text-[10px] text-[#929DA9]">{d[0]}:</span>
                <span className={`font-bold ${colorClass}`}>{sig.label}</span>
                <span className="text-[9px] text-[#929DA9]">({sig.remainingTime}s)</span>
              </span>
            );
          })}
        </div>

        {/* Vehicle legend */}
        <div className="flex items-center space-x-3 text-[10px]">
          <div className="flex items-center space-x-1">
            <span className="w-2.5 h-2 rounded-sm bg-[#E2E8F0] inline-block" />
            <span>Car</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="w-2.5 h-2 rounded-sm bg-[#F59E0B] inline-block" />
            <span>Auto</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="w-3.5 h-2 rounded-sm bg-[#DC2626] inline-block" />
            <span>Bus</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="w-2 h-1.5 rounded-sm bg-[#75B8FF] inline-block" />
            <span>Bike</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="w-3 h-2 rounded-sm bg-[#F1F5F9] border border-[#FF6268] inline-block" />
            <span>108 Amb</span>
          </div>
        </div>
      </div>
    </div>
  );
};
