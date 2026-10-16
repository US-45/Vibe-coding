import { useCallback, useEffect, useRef, useState } from 'react';
import { SimulationEngine } from '../simulation/engine';
import { Direction, SignalMode, SignalPhase, SignalState, SimulationStats } from '../types/simulation';

const DEFAULT_SIGNALS: Record<Direction, SignalState> = {
  north: { color: 'green', label: 'GO', symbol: '▲', remainingTime: 15, totalPhaseTime: 15 },
  south: { color: 'green', label: 'GO', symbol: '▲', remainingTime: 15, totalPhaseTime: 15 },
  east: { color: 'red', label: 'STOP', symbol: '■', remainingTime: 15, totalPhaseTime: 15 },
  west: { color: 'red', label: 'STOP', symbol: '■', remainingTime: 15, totalPhaseTime: 15 },
};

const DEFAULT_STATS: SimulationStats = {
  carsPassed: 0,
  activeVehicles: 0,
  totalWaitingVehicles: 0,
  averageWaitTime: 0,
  maxRecordedQueue: 0,
  elapsedTime: 0,
  directionStats: {
    north: { carsPassed: 0, currentQueue: 0, maxQueue: 0, totalWaitTime: 0, avgWaitTime: 0 },
    south: { carsPassed: 0, currentQueue: 0, maxQueue: 0, totalWaitTime: 0, avgWaitTime: 0 },
    east: { carsPassed: 0, currentQueue: 0, maxQueue: 0, totalWaitTime: 0, avgWaitTime: 0 },
    west: { carsPassed: 0, currentQueue: 0, maxQueue: 0, totalWaitTime: 0, avgWaitTime: 0 },
  },
  history: [],
};

export function useSimulation(seed?: number) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<SimulationEngine | null>(null);

  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [spawnRate, setSpawnRateState] = useState<number>(2.0);
  const [signalMode, setSignalModeState] = useState<SignalMode>('fixed');
  const [freeLeftTurn, setFreeLeftTurnState] = useState<boolean>(false);
  const [timeScale, setTimeScaleState] = useState<number>(1.0);

  const [stats, setStats] = useState<SimulationStats>(DEFAULT_STATS);
  const [signals, setSignals] = useState<Record<Direction, SignalState>>(DEFAULT_SIGNALS);
  const [phase, setPhase] = useState<SignalPhase>('NS_GREEN');
  const [adaptiveReason, setAdaptiveReason] = useState<string | null>(null);

  useEffect(() => {
    const engine = new SimulationEngine(
      {
        spawnRate,
        signalMode,
        freeLeftTurn,
        timeScale,
      },
      seed
    );

    engine.setCallbacks(
      (newStats) => {
        setStats({ ...newStats });
        const lastDec = engine.getAdaptiveLog();
        if (lastDec) {
          setAdaptiveReason(lastDec.reason);
        }
      },
      (newSignals, newPhase) => {
        setSignals({ ...newSignals });
        setPhase(newPhase);
      }
    );

    engineRef.current = engine;

    if (canvasRef.current) {
      engine.setCanvas(canvasRef.current);
      engine.render(performance.now());
    }

    return () => {
      engine.pause();
    };
  }, []);

  const attachCanvas = useCallback((canvas: HTMLCanvasElement | null) => {
    canvasRef.current = canvas;
    if (canvas && engineRef.current) {
      engineRef.current.setCanvas(canvas);
      engineRef.current.render(performance.now());
    }
  }, []);

  const start = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.start();
      setIsRunning(true);
      setIsPaused(false);
    }
  }, []);

  const pause = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.pause();
      setIsPaused(true);
    }
  }, []);

  const resume = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.resume();
      setIsPaused(false);
    }
  }, []);

  const reset = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.reset();
      setIsRunning(false);
      setIsPaused(false);
      setStats(DEFAULT_STATS);
      setSignals(DEFAULT_SIGNALS);
      setAdaptiveReason(null);
    }
  }, []);

  const setSpawnRate = useCallback((rate: number) => {
    setSpawnRateState(rate);
    if (engineRef.current) {
      engineRef.current.setSpawnRate(rate);
    }
  }, []);

  const setSignalMode = useCallback((mode: SignalMode) => {
    setSignalModeState(mode);
    if (engineRef.current) {
      engineRef.current.setSignalMode(mode);
    }
  }, []);

  const toggleFreeLeftTurn = useCallback(() => {
    setFreeLeftTurnState((prev) => {
      const next = !prev;
      if (engineRef.current) {
        engineRef.current.setFreeLeftTurn(next);
      }
      return next;
    });
  }, []);

  const setTimeScale = useCallback((scale: number) => {
    setTimeScaleState(scale);
    if (engineRef.current) {
      engineRef.current.setTimeScale(scale);
    }
  }, []);

  const spawnEmergency = useCallback((direction: Direction = 'south') => {
    if (engineRef.current) {
      engineRef.current.spawnEmergencyVehicle(direction);
    }
  }, []);

  return {
    canvasRef,
    attachCanvas,
    engineRef,
    isRunning,
    isPaused,
    spawnRate,
    signalMode,
    freeLeftTurn,
    timeScale,
    stats,
    signals,
    phase,
    adaptiveReason,
    start,
    pause,
    resume,
    reset,
    setSpawnRate,
    setSignalMode,
    toggleFreeLeftTurn,
    setTimeScale,
    spawnEmergency,
  };
}
