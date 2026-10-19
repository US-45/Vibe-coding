import React, { useState } from 'react';
import { 
  GitCompare, 
  TrendingUp, 
  TrendingDown, 
  CheckCircle2, 
  RefreshCw,
  Award,
  Inbox
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip
} from 'recharts';
import { SimulationEngine } from '../simulation/engine';
import { SimulationStats } from '../types/simulation';
import { useTheme } from '../context/ThemeContext';

interface ComparisonPanelProps {
  currentStats: SimulationStats;
  currentMode: 'fixed' | 'adaptive';
}

interface BenchmarkResult {
  fixed: {
    carsPassed: number;
    avgWaitTime: number;
    maxQueue: number;
    avgQueue: number;
  };
  adaptive: {
    carsPassed: number;
    avgWaitTime: number;
    maxQueue: number;
    avgQueue: number;
  };
  improvementPct: {
    throughput: number;
    waitTime: number;
    queue: number;
  };
  duration: number;
  spawnRate: number;
}

export const ComparisonPanel: React.FC<ComparisonPanelProps> = ({ currentStats }) => {
  const { currentTheme, tokens } = useTheme();
  const [isBenchmarking, setIsBenchmarking] = useState(false);
  const [benchmarkResult, setBenchmarkResult] = useState<BenchmarkResult | null>(null);

  /**
   * Runs an automated 60-second deterministic test of Fixed vs Adaptive timing
   * using identical pseudo-random arrival seeds (Mulberry32).
   */
  const runControlledBenchmark = () => {
    setIsBenchmarking(true);

    setTimeout(() => {
      const benchmarkSeed = 987654321;
      const testDuration = 60; // 60 seconds
      const spawnRate = 3.5; // High demand test
      const timeStep = 0.05; // 50ms discrete step

      // 1. Run Fixed Simulation
      const fixedEngine = new SimulationEngine(
        { spawnRate, signalMode: 'fixed' },
        benchmarkSeed
      );
      for (let t = 0; t < testDuration; t += timeStep) {
        fixedEngine.updatePhysics(timeStep);
      }
      const fixedStats = fixedEngine.getStats();

      // 2. Run Adaptive Simulation with EXACT SAME SEED
      const adaptiveEngine = new SimulationEngine(
        { spawnRate, signalMode: 'adaptive' },
        benchmarkSeed
      );
      for (let t = 0; t < testDuration; t += timeStep) {
        adaptiveEngine.updatePhysics(timeStep);
      }
      const adaptiveStats = adaptiveEngine.getStats();

      // 3. Compute accurate honest percentage differences
      const throughputDelta = fixedStats.carsPassed > 0
        ? ((adaptiveStats.carsPassed - fixedStats.carsPassed) / fixedStats.carsPassed) * 100
        : 0;

      const waitDelta = fixedStats.averageWaitTime > 0
        ? ((fixedStats.averageWaitTime - adaptiveStats.averageWaitTime) / fixedStats.averageWaitTime) * 100
        : 0;

      const queueDelta = fixedStats.maxRecordedQueue > 0
        ? ((fixedStats.maxRecordedQueue - adaptiveStats.maxRecordedQueue) / fixedStats.maxRecordedQueue) * 100
        : 0;

      setBenchmarkResult({
        fixed: {
          carsPassed: fixedStats.carsPassed,
          avgWaitTime: fixedStats.averageWaitTime,
          maxQueue: fixedStats.maxRecordedQueue,
          avgQueue: Number((fixedStats.totalWaitingVehicles / 4).toFixed(1)),
        },
        adaptive: {
          carsPassed: adaptiveStats.carsPassed,
          avgWaitTime: adaptiveStats.averageWaitTime,
          maxQueue: adaptiveStats.maxRecordedQueue,
          avgQueue: Number((adaptiveStats.totalWaitingVehicles / 4).toFixed(1)),
        },
        improvementPct: {
          throughput: Number(throughputDelta.toFixed(1)),
          waitTime: Number(waitDelta.toFixed(1)),
          queue: Number(queueDelta.toFixed(1)),
        },
        duration: testDuration,
        spawnRate,
      });

      setIsBenchmarking(false);
    }, 80);
  };

  const chartData = currentStats.history.map((h) => ({
    time: `${h.time}s`,
    wait: Number((h.avgWaitTime || 0).toFixed(1)),
    queue: h.queueLength || 0,
  }));

  return (
    <section className="space-y-4">
      {/* Section Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div 
            className="flex items-center space-x-2 font-mono text-xs uppercase tracking-widest font-semibold"
            style={{ color: currentTheme.color }}
          >
            <GitCompare className="w-3.5 h-3.5" />
            <span>Empirical Benchmark</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--text-primary)] font-sans">
            Measure the difference.
          </h2>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-0.5">
            Run equivalent traffic conditions and compare actual simulation results.
          </p>
        </div>

        <button
          onClick={runControlledBenchmark}
          disabled={isBenchmarking}
          className="flex items-center space-x-2 px-3.5 py-2 rounded-lg font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-50 shadow-sm active:scale-[0.98] min-h-[44px]"
          style={{
            backgroundColor: currentTheme.color,
            color: currentTheme.textColor,
            boxShadow: `0 0 12px ${currentTheme.glow}`,
          }}
        >
          {isBenchmarking ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Running Simulation...</span>
            </>
          ) : (
            <>
              <Award className="w-3.5 h-3.5" />
              <span>Run 60s Scientific Benchmark</span>
            </>
          )}
        </button>
      </div>

      {/* Main Analytics Card */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-4 sm:p-5 shadow-sm space-y-4 transition-colors duration-250">
        {/* Results or Empty State */}
        {benchmarkResult ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-[var(--text-primary)] flex items-center space-x-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#36D98A]" />
                <span>Measured Benchmark Results: Identical Seed (#987654321 @ 3.5 veh/s)</span>
              </span>
              <span className="text-[11px] font-mono text-[var(--text-secondary)]">60s Controlled Test</span>
            </div>

            {/* Metrics Comparison Table / Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Metric 1: Average Waiting Time */}
              <div className="bg-[var(--bg-card-elevated)] border border-[var(--border-color)] rounded-lg p-3.5 text-center">
                <div className="text-[11px] font-mono text-[var(--text-secondary)] uppercase">Average Wait Time</div>
                <div className="flex items-center justify-center space-x-2.5 my-1.5 font-mono">
                  <span className="text-sm line-through text-[var(--text-secondary)]">{benchmarkResult.fixed.avgWaitTime}s</span>
                  <span className="text-2xl font-bold text-[#36D98A]">
                    {benchmarkResult.adaptive.avgWaitTime}s
                  </span>
                </div>
                <div className="text-xs font-semibold text-[#36D98A] flex items-center justify-center space-x-1">
                  <TrendingDown className="w-3.5 h-3.5" />
                  <span>{benchmarkResult.improvementPct.waitTime}% Less Delay</span>
                </div>
              </div>

              {/* Metric 2: Vehicles Cleared */}
              <div className="bg-[var(--bg-card-elevated)] border border-[var(--border-color)] rounded-lg p-3.5 text-center">
                <div className="text-[11px] font-mono text-[var(--text-secondary)] uppercase">Total Cars Passed</div>
                <div className="flex items-center justify-center space-x-2.5 my-1.5 font-mono">
                  <span className="text-sm line-through text-[var(--text-secondary)]">{benchmarkResult.fixed.carsPassed}</span>
                  <span className="text-2xl font-bold" style={{ color: currentTheme.color }}>
                    {benchmarkResult.adaptive.carsPassed}
                  </span>
                </div>
                <div className="text-xs font-semibold text-[#36D98A] flex items-center justify-center space-x-1">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>+{benchmarkResult.improvementPct.throughput}% Higher Throughput</span>
                </div>
              </div>

              {/* Metric 3: Peak Queue */}
              <div className="bg-[var(--bg-card-elevated)] border border-[var(--border-color)] rounded-lg p-3.5 text-center">
                <div className="text-[11px] font-mono text-[var(--text-secondary)] uppercase">Peak Queue Length</div>
                <div className="flex items-center justify-center space-x-2.5 my-1.5 font-mono">
                  <span className="text-sm line-through text-[var(--text-secondary)]">{benchmarkResult.fixed.maxQueue}</span>
                  <span className="text-2xl font-bold text-[var(--text-primary)]">
                    {benchmarkResult.adaptive.maxQueue}
                  </span>
                </div>
                <div className="text-xs font-semibold text-[#36D98A] flex items-center justify-center space-x-1">
                  <TrendingDown className="w-3.5 h-3.5" />
                  <span>{benchmarkResult.improvementPct.queue}% Shorter Backlog</span>
                </div>
              </div>
            </div>

            {/* Explanatory Data-Driven Summary */}
            <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] p-3 rounded-lg text-xs text-[var(--text-secondary)] leading-relaxed">
              <strong className="text-[var(--text-primary)]">Empirical Evaluation Summary: </strong>
              Under identical arrival conditions ({benchmarkResult.spawnRate} veh/s over {benchmarkResult.duration} seconds), 
              the Adaptive Controller produced <strong className="text-[#36D98A]">{benchmarkResult.improvementPct.waitTime}% lower average vehicle delay</strong> and 
              cleared <strong style={{ color: currentTheme.color }}>{benchmarkResult.improvementPct.throughput}% more vehicles</strong> by dynamically reallocating green seconds away from empty directions to clearing queues.
            </div>
          </div>
        ) : (
          /* Informative Empty State */
          <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg p-6 text-center space-y-2">
            <Inbox className="w-8 h-8 text-[var(--text-secondary)] mx-auto opacity-60" />
            <div className="text-sm font-semibold text-[var(--text-primary)]">No Comparison Run Yet</div>
            <p className="text-xs text-[var(--text-secondary)] max-w-md mx-auto">
              Click <strong>"Run 60s Scientific Benchmark"</strong> to execute two independent simulations with identical seeded traffic arrivals and measure the performance difference.
            </p>
          </div>
        )}

        {/* Live Timeline Telemetry (Recharts) */}
        <div className="pt-2">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="font-mono font-semibold text-[var(--text-primary)] uppercase tracking-wider text-[11px]">
              Live Simulation Telemetry: Delay (s) vs Total Queue Length
            </span>
            <span className="text-[10px] font-mono text-[var(--text-secondary)]">Rolling 120s Buffer</span>
          </div>

          <div className="h-44 w-full bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-color)] p-2">
            {chartData.length > 1 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="waitGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={currentTheme.color} stopOpacity={0.35} />
                      <stop offset="95%" stopColor={currentTheme.color} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="queueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#75B8FF" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#75B8FF" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="time" stroke={tokens.secondaryText} fontSize={9} tickLine={false} />
                  <YAxis stroke={tokens.secondaryText} fontSize={9} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: tokens.cards,
                      borderColor: tokens.borders,
                      fontSize: '11px',
                      borderRadius: '8px',
                      color: tokens.primaryText,
                      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    }}
                    itemStyle={{
                      color: tokens.primaryText,
                    }}
                    labelStyle={{
                      color: tokens.secondaryText,
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="wait"
                    name="Avg Wait (s)"
                    stroke={currentTheme.color}
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#waitGrad)"
                  />
                  <Area
                    type="monotone"
                    dataKey="queue"
                    name="Total Queue"
                    stroke="#75B8FF"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#queueGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-[var(--text-secondary)] font-mono">
                Start the simulation to plot live telemetry stream
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
