import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, Award, CheckCircle, TrendingDown, TrendingUp, Sliders } from 'lucide-react';
import { SimulationEngine } from '../simulation/engine';
import { SimulationStats } from '../types/simulation';

export const DualArena: React.FC = () => {
  const fixedCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const adaptiveCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const fixedEngineRef = useRef<SimulationEngine | null>(null);
  const adaptiveEngineRef = useRef<SimulationEngine | null>(null);

  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [spawnRate, setSpawnRate] = useState<number>(3.5);
  const [freeLeftTurn, setFreeLeftTurn] = useState<boolean>(true);

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

  const handleFreeLeftToggle = () => {
    const next = !freeLeftTurn;
    setFreeLeftTurn(next);
    fixedEngineRef.current?.setFreeLeftTurn(next);
    adaptiveEngineRef.current?.setFreeLeftTurn(next);
  };

  return (
    <div className="space-y-4">
      {/* Top Banner & Arena Controls */}
      <div className="bg-[#242020] border border-[#413939] rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-xl">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#B59447] animate-pulse" />
            <h2 className="text-sm font-extrabold tracking-wider uppercase text-[#F2EEEE]">
              LIVE DUAL-JUNCTION ARENA — SCIENTIFIC BENCHMARK
            </h2>
          </div>
          <p className="text-xs text-[#A4A4A4]">
            Both junctions receive the <span className="text-[#E2C785] font-bold">exact same vehicle arrival sequence</span> (Seed #{seed})
          </p>
        </div>

        {/* Global Synchronized Controls */}
        <div className="flex items-center space-x-2">
          {!isRunning ? (
            <button
              onClick={handleStart}
              className="py-1.5 px-4 rounded-lg bg-[#A41717] hover:bg-[#bd1e1e] text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center space-x-1.5"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>Launch Both</span>
            </button>
          ) : isPaused ? (
            <button
              onClick={handleResume}
              className="py-1.5 px-4 rounded-lg bg-[#39B86B] text-black font-bold text-xs uppercase tracking-wider transition-all flex items-center space-x-1.5"
            >
              <Play className="w-3.5 h-3.5 fill-black" />
              <span>Resume</span>
            </button>
          ) : (
            <button
              onClick={handlePause}
              className="py-1.5 px-4 rounded-lg bg-[#302A2A] border border-[#532121] text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center space-x-1.5"
            >
              <Pause className="w-3.5 h-3.5 fill-white" />
              <span>Pause</span>
            </button>
          )}

          <button
            onClick={handleReset}
            className="py-1.5 px-3 rounded-lg bg-[#1C1919] border border-[#413939] text-[#A4A4A4] hover:text-white font-semibold text-xs uppercase tracking-wider transition-all flex items-center space-x-1"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>

          <div className="h-6 w-px bg-[#413939] mx-1" />

          {/* Density preset for arena */}
          <div className="flex items-center space-x-1 text-xs">
            <span className="text-[11px] text-[#A4A4A4]">Density:</span>
            {[2.0, 3.5, 5.0].map((r) => (
              <button
                key={r}
                onClick={() => handleSpawnRateChange(r)}
                className={`px-2 py-1 rounded text-[10px] font-bold border transition-colors ${
                  spawnRate === r ? 'bg-[#B59447] text-black border-[#B59447]' : 'bg-[#1C1919] text-[#A4A4A4] border-[#413939]'
                }`}
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
        <div className="bg-[#242020] border border-[#413939] rounded-xl p-3 shadow-xl space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="px-2 py-0.5 rounded bg-[#302A2A] text-xs font-bold text-[#A4A4A4] border border-[#413939]">
                STRATEGY A
              </span>
              <span className="text-xs font-bold text-[#F2EEEE] uppercase tracking-wider">Fixed 15s Cycle</span>
            </div>
            <div className="text-xs font-mono text-[#A4A4A4]">
              Passed: <strong className="text-white">{fixedStats?.carsPassed || 0}</strong> | Wait: <strong className="text-white">{fixedStats?.averageWaitTime.toFixed(1) || 0}s</strong>
            </div>
          </div>

          <div className="relative rounded-lg overflow-hidden border border-[#413939] bg-[#191616] flex items-center justify-center">
            <canvas
              ref={fixedCanvasRef}
              width={700}
              height={700}
              className="w-full aspect-square object-contain block"
            />
          </div>

          <div className="grid grid-cols-3 gap-2 text-center text-xs pt-1">
            <div className="bg-[#1C1919] p-2 rounded border border-[#302A2A]">
              <div className="text-[10px] text-[#A4A4A4]">Total Cleared</div>
              <div className="text-lg font-bold font-mono text-[#F2EEEE]">{fixedStats?.carsPassed || 0}</div>
            </div>
            <div className="bg-[#1C1919] p-2 rounded border border-[#302A2A]">
              <div className="text-[10px] text-[#A4A4A4]">Avg Delay</div>
              <div className="text-lg font-bold font-mono text-[#F2EEEE]">{fixedStats?.averageWaitTime.toFixed(1) || 0}s</div>
            </div>
            <div className="bg-[#1C1919] p-2 rounded border border-[#302A2A]">
              <div className="text-[10px] text-[#A4A4A4]">Peak Queue</div>
              <div className="text-lg font-bold font-mono text-[#E54848]">{fixedStats?.maxRecordedQueue || 0}</div>
            </div>
          </div>
        </div>

        {/* Right: Adaptive AI Junction */}
        <div className="bg-[#242020] border border-[#B59447]/60 rounded-xl p-3 shadow-xl space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="px-2 py-0.5 rounded bg-[#B59447]/20 text-xs font-bold text-[#E2C785] border border-[#B59447]">
                STRATEGY B
              </span>
              <span className="text-xs font-bold text-[#E2C785] uppercase tracking-wider">Adaptive Smart Timing</span>
            </div>
            <div className="text-xs font-mono text-[#E2C785]">
              Passed: <strong className="text-white">{adaptiveStats?.carsPassed || 0}</strong> | Wait: <strong className="text-white">{adaptiveStats?.averageWaitTime.toFixed(1) || 0}s</strong>
            </div>
          </div>

          <div className="relative rounded-lg overflow-hidden border border-[#532121] bg-[#191616] flex items-center justify-center">
            <canvas
              ref={adaptiveCanvasRef}
              width={700}
              height={700}
              className="w-full aspect-square object-contain block"
            />
          </div>

          <div className="grid grid-cols-3 gap-2 text-center text-xs pt-1">
            <div className="bg-[#1C1919] p-2 rounded border border-[#532121]">
              <div className="text-[10px] text-[#A4A4A4]">Total Cleared</div>
              <div className="text-lg font-bold font-mono text-[#E2C785]">{adaptiveStats?.carsPassed || 0}</div>
            </div>
            <div className="bg-[#1C1919] p-2 rounded border border-[#532121]">
              <div className="text-[10px] text-[#A4A4A4]">Avg Delay</div>
              <div className="text-lg font-bold font-mono text-[#39B86B]">{adaptiveStats?.averageWaitTime.toFixed(1) || 0}s</div>
            </div>
            <div className="bg-[#1C1919] p-2 rounded border border-[#532121]">
              <div className="text-[10px] text-[#A4A4A4]">Peak Queue</div>
              <div className="text-lg font-bold font-mono text-[#39B86B]">{adaptiveStats?.maxRecordedQueue || 0}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
