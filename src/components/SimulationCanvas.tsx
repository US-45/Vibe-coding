import React, { useEffect, useRef } from 'react';
import { AlertTriangle, Siren, ShieldAlert } from 'lucide-react';
import { SignalPhase } from '../types/simulation';

interface SimulationCanvasProps {
  onCanvasReady: (canvas: HTMLCanvasElement | null) => void;
  currentPhase: SignalPhase;
  adaptiveReason?: string | null;
  freeLeftTurnEnabled: boolean;
}

export const SimulationCanvas: React.FC<SimulationCanvasProps> = ({
  onCanvasReady,
  currentPhase,
  adaptiveReason,
  freeLeftTurnEnabled,
}) => {
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

  return (
    <div className="bg-[#242020] border border-[#413939] rounded-xl p-3 sm:p-4 shadow-xl flex flex-col items-center relative overflow-hidden">
      {/* Top Header / Status bar inside canvas box */}
      <div className="w-full flex items-center justify-between mb-3 text-xs">
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#A41717]" />
          <span className="font-bold tracking-wider uppercase text-[#F2EEEE]">4-WAY INTERSECTION — LIVE FEED</span>
        </div>

        {freeLeftTurnEnabled && (
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-[#B59447]/20 border border-[#B59447]/50 text-[#E2C785] flex items-center space-x-1">
            <span>Free Left Turn Active</span>
          </span>
        )}
      </div>

      {/* Emergency Corridor Alert Banner */}
      {isEmergency && (
        <div className="w-full mb-3 bg-[#A41717] text-white px-3 py-1.5 rounded-lg flex items-center justify-center space-x-2 font-bold text-xs uppercase tracking-wide animate-pulse shadow-lg">
          <Siren className="w-4 h-4" />
          <span>EMERGENCY CORRIDOR ACTIVE — CLEARING INTERSECTION FOR AMBULANCE</span>
        </div>
      )}

      {/* Adaptive Decision Notification */}
      {adaptiveReason && (
        <div className="w-full mb-2 bg-[#302A2A] border border-[#B59447]/50 px-3 py-1 rounded text-[11px] text-[#E2C785] flex items-center justify-between">
          <span className="font-semibold">⚡ Adaptive Engine:</span>
          <span className="truncate max-w-[85%]">{adaptiveReason}</span>
        </div>
      )}

      {/* Canvas Container */}
      <div className="relative rounded-lg overflow-hidden border border-[#413939] bg-[#191616] shadow-2xl flex items-center justify-center">
        <canvas
          ref={canvasRef}
          width={700}
          height={700}
          className="w-full max-w-[620px] aspect-square object-contain block select-none cursor-crosshair"
          title="Indian Four-Way Junction Simulation"
        />
      </div>

      {/* Visual Legend below canvas */}
      <div className="w-full mt-3 pt-3 border-t border-[#302A2A] flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#A4A4A4]">
        {/* Vehicles */}
        <div className="flex items-center space-x-3">
          <span className="font-semibold text-[#F2EEEE]">Vehicles:</span>
          <div className="flex items-center space-x-1">
            <span className="w-3 h-2 rounded-sm bg-[#D64045] inline-block" />
            <span>Car</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="w-2.5 h-2 rounded-sm bg-[#F59E0B] inline-block" />
            <span>Auto</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="w-4 h-2 rounded-sm bg-[#2563EB] inline-block" />
            <span>Bus</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="w-2 h-1.5 rounded-sm bg-[#8B5CF6] inline-block" />
            <span>Bike</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="w-3.5 h-2 rounded-sm bg-white border border-red-500 inline-block" />
            <span>Ambulance</span>
          </div>
        </div>

        {/* Signals Accessibility */}
        <div className="flex items-center space-x-3">
          <span className="font-semibold text-[#F2EEEE]">Signals:</span>
          <span className="text-[#39B86B] font-bold">▲ GO</span>
          <span className="text-[#F2B544] font-bold">◆ WAIT</span>
          <span className="text-[#E54848] font-bold">■ STOP</span>
        </div>
      </div>
    </div>
  );
};
