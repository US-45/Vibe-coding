import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, GitCompare, CheckCircle2 } from 'lucide-react';
import { SimulationEngine } from '../simulation/engine';
import { SimulationStats } from '../types/simulation';
import { useTheme } from '../context/ThemeContext';

export const DualArena: React.FC = () => {
  const { currentTheme } = useTheme();
  const fixedCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const adaptiveCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const fixedEngineRef = useRef<SimulationEngine | null>(null);
  const adaptiveEngineRef = useRef<SimulationEngine | null>(null);

  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [spawnRate, setSpawnRate] = useState<number>(3.5);
  const [freeLeftTurn] = useState<boolean>(true);

  const [fixedStats, setFixedStats] = useState<SimulationStats | null>(null);
  const [adaptiveStats, setAdaptiveStats] = useState<SimulationStats | null>(null);

  const seed = 555666777; // Identical seed for true scientific parity

  useEffect(() => {
    const fixedEng = new SimulationEngine({ spawnRate, signalMode: 'fixed', freeLeftTurn }, seed);
    const adaptEng = new SimulationEngine({ spawnRate, signalMode: 'adaptive', freeLeftTurn }, seed);

    fixedEng.setCallbacks(
      (stats) => setFixedStats({ ...stats }),
      () => {}
    );

    adaptEng.setCallbacks(
      (stats) => setAdaptiveStats({ ...stats }),
      () => {}
    );

    fixedEngineRef.current = fixedEng;
    adaptiveEngineRef.current = adaptEng;

    if (fixedCanvasRef.current) {
      fixedEng.setCanvas(fixedCanvasRef.current);
      fixedEng.render(performance.now());
    }
    if (adaptiveCanvasRef.current) {
      adaptEng.setCanvas(adaptiveCanvasRef.current);
      adaptEng.render(performance.now());
    }

    return () => {
      fixedEng.pause();
      adaptEng.pause();
    };
  }, []);

  const handleStart = () => {
    fixedEngineRef.current?.start();
    adaptiveEngineRef.current?.start();
    setIsRunning(true);
    setIsPaused(false);
  };

  const handlePause = () => {
    fixedEngineRef.current?.pause();
    adaptiveEngineRef.current?.pause();
    setIsPaused(true);
  };

  const handleResume = () => {
    fixedEngineRef.current?.resume();
    adaptiveEngineRef.current?.resume();
    setIsPaused(false);
  };

  const handleReset = () => {
    fixedEngineRef.current?.reset();
    adaptiveEngineRef.current?.reset();
    setIsRunning(false);
    setIsPaused(false);
  };

  const handleSpawnRateChange = (newRate: number) => {
    setSpawnRate(newRate);
    fixedEngineRef.current?.setSpawnRate(newRate);
    adaptiveEngineRef.current?.setSpawnRate(newRate);
  };

  return (
    <div className="space-y-4">
      {/* Top Banner & Synchronized Controls */}
      <div className="bg-[#12161B] border border-[#2A323B] rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-sm">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-[#C6F36B] shadow-[0_0_8px_#C6F36B]" />
            <h2 className="text-sm font-bold tracking-tight uppercase text-[#F3F5F7]">
              Live Dual-Junction Arena — Scientific Benchmark
            </h2>
          </div>
          <p className="text-xs text-[#929DA9] mt-0.5">
            Both junctions receive the <strong className="text-[#C6F36B]">exact same vehicle arrival sequence</strong> (Seed #{seed})
          </p>
        </div>

        {/* Global Synchronized Controls */}
        <div className="flex items-center space-x-2">
          {!isRunning ? (
            <button
              onClick={handleStart}
              className="py-1.5 px-4 rounded-lg font-bold text-xs uppercase tracking-wider transition-all flex items-center space-x-1.5 shadow-sm active:scale-[0.98]"
              style={{
                backgroundColor: currentTheme.color,
                color: currentTheme.textColor,
                boxShadow: `0 0 12px ${currentTheme.glow}`,
              }}
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Launch Both</span>
            </button>
          ) : isPaused ? (
            <button
              onClick={handleResume}
              className="py-1.5 px-4 rounded-lg bg-[#36D98A] text-[#0B0D10] font-bold text-xs uppercase tracking-wider transition-all flex items-center space-x-1.5 shadow-sm active:scale-[0.98]"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Resume</span>
            </button>
          ) : (
            <button
              onClick={handlePause}
              className="py-1.5 px-4 rounded-lg bg-[#191F26] border border-[#2A323B] text-[#FFBD59] font-bold text-xs uppercase tracking-wider transition-all flex items-center space-x-1.5 active:scale-[0.98]"
            >
              <Pause className="w-3.5 h-3.5 fill-current" />
              <span>Pause</span>
            </button>
          )}

          <button
            onClick={handleReset}
            className="py-1.5 px-3 rounded-lg bg-[#0B0D10] border border-[#2A323B] text-[#929DA9] hover:text-[#F3F5F7] font-semibold text-xs uppercase tracking-wider transition-all flex items-center space-x-1"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>

          <div className="h-6 w-px bg-[#2A323B] mx-1" />

          {/* Density preset for arena */}
          <div className="flex items-center space-x-1 text-xs font-mono">
            <span className="text-[10px] text-[#929DA9] uppercase">Rate:</span>
            {[2.0, 3.5, 5.0].map((r) => (
              <button
                key={r}
                onClick={() => handleSpawnRateChange(r)}
                className="px-2 py-0.5 rounded text-[10px] font-bold border transition-colors"
                style={
                  spawnRate === r
                    ? {
                        backgroundColor: currentTheme.color,
                        color: currentTheme.textColor,
                        borderColor: currentTheme.color,
                      }
                    : {
                        backgroundColor: '#0B0D10',
                        color: '#929DA9',
                        borderColor: '#2A323B',
                      }
                }
              >
                {r} v/s
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Split Canvases */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left: Fixed Signal Junction */}
        <div className="bg-[#12161B] border border-[#2A323B] rounded-xl p-3.5 shadow-sm space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="px-2 py-0.5 rounded bg-[#191F26] text-[10px] font-mono font-bold text-[#929DA9] border border-[#2A323B]">
                STRATEGY A
              </span>
              <span className="text-xs font-bold text-[#F3F5F7] uppercase tracking-wider">Fixed 15s Cycle</span>
            </div>
            <div className="text-xs font-mono text-[#929DA9]">
              Passed: <strong className="text-[#F3F5F7]">{fixedStats?.carsPassed || 0}</strong> | Wait: <strong className="text-[#F3F5F7]">{fixedStats?.averageWaitTime.toFixed(1) || 0}s</strong>
            </div>
          </div>

          <div className="relative rounded-lg overflow-hidden border border-[#2A323B] bg-[#0B0D10] flex items-center justify-center">
            <canvas
              ref={fixedCanvasRef}
              width={700}
              height={700}
              className="w-full aspect-square object-contain block"
            />
          </div>

          <div className="grid grid-cols-3 gap-2 text-center text-xs pt-1">
            <div className="bg-[#191F26] p-2 rounded-lg border border-[#2A323B]">
              <div className="text-[10px] font-mono text-[#929DA9] uppercase">Total Cleared</div>
              <div className="text-lg font-bold font-mono text-[#F3F5F7]">{fixedStats?.carsPassed || 0}</div>
            </div>
            <div className="bg-[#191F26] p-2 rounded-lg border border-[#2A323B]">
              <div className="text-[10px] font-mono text-[#929DA9] uppercase">Avg Delay</div>
              <div className="text-lg font-bold font-mono text-[#F3F5F7]">{fixedStats?.averageWaitTime.toFixed(1) || 0}s</div>
            </div>
            <div className="bg-[#191F26] p-2 rounded-lg border border-[#2A323B]">
              <div className="text-[10px] font-mono text-[#929DA9] uppercase">Peak Queue</div>
              <div className="text-lg font-bold font-mono text-[#FF6268]">{fixedStats?.maxRecordedQueue || 0}</div>
            </div>
          </div>
        </div>

        {/* Right: Adaptive AI Junction */}
        <div 
          className="bg-[#12161B] rounded-xl p-3.5 shadow-sm space-y-2.5 border"
          style={{ borderColor: currentTheme.mutedBorder }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span 
                className="px-2 py-0.5 rounded text-[10px] font-mono font-bold border"
                style={{
                  backgroundColor: currentTheme.mutedBg,
                  borderColor: currentTheme.mutedBorder,
                  color: currentTheme.color,
                }}
              >
                STRATEGY B
              </span>
              <span 
                className="text-xs font-bold uppercase tracking-wider"
                style={{ color: currentTheme.color }}
              >
                Adaptive Smart Timing
              </span>
            </div>
            <div className="text-xs font-mono" style={{ color: currentTheme.color }}>
              Passed: <strong className="text-[#F3F5F7]">{adaptiveStats?.carsPassed || 0}</strong> | Wait: <strong className="text-[#F3F5F7]">{adaptiveStats?.averageWaitTime.toFixed(1) || 0}s</strong>
            </div>
          </div>

          <div className="relative rounded-lg overflow-hidden border border-[#2A323B] bg-[#0B0D10] flex items-center justify-center">
            <canvas
              ref={adaptiveCanvasRef}
              width={700}
              height={700}
              className="w-full aspect-square object-contain block"
            />
          </div>

          <div className="grid grid-cols-3 gap-2 text-center text-xs pt-1">
            <div className="bg-[#191F26] p-2 rounded-lg border border-[#2A323B]">
              <div className="text-[10px] font-mono text-[#929DA9] uppercase">Total Cleared</div>
              <div className="text-lg font-bold font-mono" style={{ color: currentTheme.color }}>{adaptiveStats?.carsPassed || 0}</div>
            </div>
            <div className="bg-[#191F26] p-2 rounded-lg border border-[#2A323B]">
              <div className="text-[10px] font-mono text-[#929DA9] uppercase">Avg Delay</div>
              <div className="text-lg font-bold font-mono text-[#36D98A]">{adaptiveStats?.averageWaitTime.toFixed(1) || 0}s</div>
            </div>
            <div className="bg-[#191F26] p-2 rounded-lg border border-[#2A323B]">
              <div className="text-[10px] font-mono text-[#929DA9] uppercase">Peak Queue</div>
              <div className="text-lg font-bold font-mono text-[#36D98A]">{adaptiveStats?.maxRecordedQueue || 0}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
