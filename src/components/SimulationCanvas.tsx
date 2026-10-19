import React, { useEffect, useRef } from 'react';
import { Siren, Compass, Layers, Sparkles } from 'lucide-react';
import { Direction, SignalMode, SignalPhase, SignalState } from '../types/simulation';
import { SimulationEngine } from '../simulation/engine';
import { useTheme } from '../context/ThemeContext';

interface SimulationCanvasProps {
  onCanvasReady: (canvas: HTMLCanvasElement | null) => void;
  currentPhase: SignalPhase;
  signalMode: SignalMode;
  signals: Record<Direction, SignalState>;
  elapsedTime: number;
  activeVehiclesCount: number;
  freeLeftTurnEnabled: boolean;
  onSwitchTo3D?: () => void;
  engine?: SimulationEngine | null;
}

export const SimulationCanvas: React.FC<SimulationCanvasProps> = ({
  onCanvasReady,
  currentPhase,
  signalMode: _signalMode,
  signals,
  elapsedTime,
  activeVehiclesCount,
  freeLeftTurnEnabled: _freeLeftTurnEnabled,
  onSwitchTo3D,
  engine,
}) => {
  const { currentTheme, mode, isDark, tokens } = useTheme();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Sync theme mode to simulation engine whenever theme toggles
  useEffect(() => {
    if (engine) {
      engine.setThemeMode(mode);
    }
  }, [engine, mode]);

  useEffect(() => {
    if (canvasRef.current) {
      onCanvasReady(canvasRef.current);
    }
    return () => {
      onCanvasReady(null);
    };
  }, [onCanvasReady]);

  // Responsive canvas observer ensuring crisp rendering across all screen sizes
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver(() => {
      if (engine && canvasRef.current) {
        engine.resizeCanvas();
      }
    });

    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, [engine]);

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
    <div 
      ref={containerRef}
      className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-3 sm:p-4 shadow-sm flex flex-col items-center relative overflow-hidden transition-colors duration-250 w-full"
    >
      {/* Top Header & Compact Overlay Bar */}
      <div className="w-full flex flex-wrap items-center justify-between gap-2 mb-3 text-xs">
        <div className="flex items-center space-x-2">
          {onSwitchTo3D && (
            <div className="flex items-center space-x-1 bg-[var(--bg-secondary)] p-0.5 rounded-lg border border-[var(--border-color)]">
              <button
                className="px-2.5 py-1 rounded-md text-[11px] font-bold shadow-sm transition-colors flex items-center space-x-1 touch-target-min"
                style={{
                  backgroundColor: currentTheme.color,
                  color: currentTheme.textColor,
                }}
              >
                <Layers className="w-3 h-3" />
                <span>2D Plan</span>
              </button>
              <button
                onClick={onSwitchTo3D}
                className="px-2.5 py-1 rounded-md text-[11px] font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors flex items-center space-x-1 touch-target-min"
                title="Switch to Interactive 3D Model"
              >
                <Sparkles className="w-3 h-3 text-[#75B8FF]" />
                <span>3D Model</span>
              </button>
            </div>
          )}
          <span className="w-2 h-2 rounded-full hidden sm:inline-block" style={{ backgroundColor: currentTheme.color }} />
          <span className="font-mono font-bold tracking-wider uppercase text-[var(--text-primary)] text-[11px] hidden sm:inline-block">
            FOUR-WAY INTERSECTION — LIVE FEED
          </span>
        </div>

        {/* Compact Simulation Status Overlay */}
        <div className="flex items-center space-x-1.5 sm:space-x-2 font-mono text-[10px]">
          <span className="px-2 py-0.5 rounded bg-[var(--bg-card-elevated)] border border-[var(--border-color)] text-[var(--text-secondary)]">
            PHASE: <strong className="text-[var(--text-primary)]">{phaseDisplay}</strong>
          </span>
          <span className="px-2 py-0.5 rounded bg-[var(--bg-card-elevated)] border border-[var(--border-color)] text-[var(--text-secondary)]">
            TIME: <strong style={{ color: currentTheme.color }}>{formatTime(elapsedTime)}</strong>
          </span>
          <span className="px-2 py-0.5 rounded bg-[var(--bg-card-elevated)] border border-[var(--border-color)] text-[var(--text-secondary)]">
            ON GRID: <strong className="text-[var(--text-primary)]">{activeVehiclesCount}</strong>
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
      <div 
        className="relative rounded-lg overflow-hidden border border-[var(--border-color)] bg-[var(--bg-primary)] shadow-inner flex items-center justify-center w-full aspect-square max-w-[620px]"
        style={{
          backgroundColor: isDark ? tokens.bgPrimary : tokens.bgSecondary,
        }}
      >
        <canvas
          ref={canvasRef}
          width={700}
          height={700}
          className="w-full h-full max-w-[620px] aspect-square object-contain block select-none cursor-crosshair"
          title="Indian Four-Way Junction Simulation"
        />

        {/* Compass Watermark */}
        <div className="absolute top-3 left-3 flex items-center space-x-1 font-mono text-[9px] text-[var(--text-secondary)] bg-[var(--bg-card)]/90 px-2 py-1 rounded border border-[var(--border-color)] shadow-sm pointer-events-none">
          <Compass className="w-3 h-3 text-[#75B8FF]" />
          <span>LHT • INDIA</span>
        </div>
      </div>

      {/* Approach Signal States & Legend */}
      <div className="w-full mt-3 pt-3 border-t border-[var(--border-subtle)] flex flex-wrap items-center justify-between gap-2 sm:gap-3 text-[11px] text-[var(--text-secondary)]">
        {/* Signal State Quick Indicators */}
        <div className="flex items-center space-x-2 sm:space-x-3 font-mono text-[10px] sm:text-[11px]">
          <span className="font-semibold text-[var(--text-primary)]">Signals:</span>
          {(['north', 'south', 'east', 'west'] as Direction[]).map((d) => {
            const sig = signals[d];
            const isGreen = sig.color === 'green';
            const isAmber = sig.color === 'amber';
            const colorClass = isGreen ? 'text-[#36D98A]' : (isAmber ? 'text-[#FFBD59]' : 'text-[#FF6268]');
            return (
              <span key={d} className="flex items-center space-x-1">
                <span className="uppercase text-[10px] text-[var(--text-secondary)]">{d[0]}:</span>
                <span className={`font-bold ${colorClass}`}>{sig.label}</span>
                <span className="text-[9px] text-[var(--text-secondary)]">({sig.remainingTime}s)</span>
              </span>
            );
          })}
        </div>

        {/* Vehicle legend */}
        <div className="flex items-center space-x-2 sm:space-x-3 text-[10px]">
          <div className="flex items-center space-x-1">
            <span className="w-2.5 h-2 rounded-sm bg-[#E2E8F0] inline-block border border-black/10" />
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
