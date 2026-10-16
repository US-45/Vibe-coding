import React, { useState } from 'react';
import { useSimulation } from '../hooks/useSimulation';
import { Navbar } from './Navbar';
import { SimulationCanvas } from './SimulationCanvas';
import { Simulation3DView } from './Simulation3DView';
import { TrafficControls } from './TrafficControls';
import { TrafficSignals } from './TrafficSignals';
import { StatisticsPanel } from './StatisticsPanel';
import { ComparisonPanel } from './ComparisonPanel';
import { SignalIntelligencePanel } from './SignalIntelligencePanel';
import { ExperimentConfigPanel } from './ExperimentConfigPanel';
import { DualArena } from './DualArena';
import { PrivacyModal } from './PrivacyModal';
import { DemoTourModal } from './DemoTourModal';
import { AboutModal } from './AboutModal';
import { Activity, Cpu, Sparkles, ShieldCheck } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export const Dashboard: React.FC = () => {
  const { currentTheme } = useTheme();
  const [viewMode, setViewMode] = useState<'single' | 'arena'>('single');
  const [viewDimension, setViewDimension] = useState<'2D' | '3D'>('2D');
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [isDemoTourOpen, setIsDemoTourOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);

  const {
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
  } = useSimulation();

  const handleNavigate = (section: 'simulation' | 'analytics' | 'about') => {
    if (section === 'about') {
      setIsAboutOpen(true);
    } else if (section === 'simulation') {
      if (viewMode !== 'single') setViewMode('single');
      setTimeout(() => {
        document.getElementById('simulation-section')?.scrollIntoView({ behavior: 'smooth' });
      }, 50);
    } else if (section === 'analytics') {
      if (viewMode !== 'single') setViewMode('single');
      setTimeout(() => {
        document.getElementById('analytics-section')?.scrollIntoView({ behavior: 'smooth' });
      }, 50);
    }
  };

  const phaseDuration = signals.north.totalPhaseTime || 15;
  const phaseElapsed = Math.max(0, phaseDuration - (signals.north.remainingTime || 0));

  return (
    <div className="min-h-screen bg-[#0B0D10] text-[#F3F5F7] flex flex-col font-sans selection:bg-[#C6F36B] selection:text-[#0B0D10]">
      {/* Top Navigation Bar */}
      <Navbar
        isRunning={isRunning}
        isPaused={isPaused}
        signalMode={signalMode}
        elapsedTime={stats.elapsedTime}
        onOpenDemoTour={() => setIsDemoTourOpen(true)}
        onOpenPrivacy={() => setIsPrivacyOpen(true)}
        viewMode={viewMode}
        onToggleViewMode={() => setViewMode((prev) => (prev === 'single' ? 'arena' : 'single'))}
        onNavigate={handleNavigate}
        viewDimension={viewDimension}
        onToggleDimension={() => setViewDimension((prev) => (prev === '2D' ? '3D' : '2D'))}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
        {/* Section 4.B: Hero and Introduction */}
        <section className="flex flex-wrap items-end justify-between gap-4 border-b border-[#2A323B] pb-6">
          <div className="space-y-1.5">
            <div 
              className="flex items-center space-x-2 font-mono text-xs uppercase tracking-widest font-semibold"
              style={{ color: currentTheme.color }}
            >
              <span className="w-2 h-0.5" style={{ backgroundColor: currentTheme.color }} />
              <span>URBAN MOBILITY / SIMULATION LAB</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#F3F5F7]">
              Make every green second count.
            </h1>
            <p className="text-xs sm:text-sm text-[#929DA9] max-w-2xl leading-relaxed">
              Explore how adaptive traffic signals respond to congestion and improve traffic flow at busy intersections.
            </p>
          </div>

          {/* Quick Header Indicators */}
          <div className="flex items-center space-x-2.5 text-xs font-mono">
            {isRunning && !isPaused && (
              <div className="px-3 py-1.5 rounded-lg bg-[#36D98A]/10 border border-[#36D98A]/30 flex items-center space-x-2 text-[#36D98A]">
                <span className="w-2 h-2 rounded-full bg-[#36D98A] shadow-[0_0_8px_#36D98A] animate-pulse" />
                <span className="font-bold tracking-wider">LIVE SIMULATION</span>
              </div>
            )}

            <div className="px-3 py-1.5 rounded-lg bg-[#12161B] border border-[#2A323B] flex items-center space-x-2">
              <Activity className="w-3.5 h-3.5 text-[#75B8FF]" />
              <span className="text-[#929DA9]">Grid Load:</span>
              <span className="font-bold text-[#F3F5F7] tabular-nums">{stats.activeVehicles} veh</span>
            </div>

            <div className="px-3 py-1.5 rounded-lg bg-[#12161B] border border-[#2A323B] flex items-center space-x-2">
              <Cpu className="w-3.5 h-3.5" style={{ color: currentTheme.color }} />
              <span className="text-[#929DA9]">Logic:</span>
              <span className="font-bold uppercase" style={{ color: currentTheme.color }}>
                {signalMode === 'adaptive' ? 'Actuated' : 'Fixed'}
              </span>
            </div>
          </div>
        </section>

        {/* View Selection: Single Junction vs Dual Comparative Arena */}
        {viewMode === 'single' ? (
          <div className="space-y-8">
            {/* Simulation Canvas & Immediate Controls */}
            <section id="simulation-section" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Section 4.C: Main Traffic Simulation Canvas (7 cols ~60%) */}
                <div className="lg:col-span-7 flex flex-col justify-center">
                  {viewDimension === '2D' ? (
                    <SimulationCanvas
                      onCanvasReady={attachCanvas}
                      currentPhase={phase}
                      signalMode={signalMode}
                      signals={signals}
                      elapsedTime={stats.elapsedTime}
                      activeVehiclesCount={stats.activeVehicles}
                      freeLeftTurnEnabled={freeLeftTurn}
                      onSwitchTo3D={() => setViewDimension('3D')}
                    />
                  ) : (
                    <Simulation3DView
                      engine={engineRef.current}
                      currentPhase={phase}
                      signals={signals}
                      elapsedTime={stats.elapsedTime}
                      activeVehiclesCount={stats.activeVehicles}
                      freeLeftTurnEnabled={freeLeftTurn}
                      onSwitchTo2D={() => setViewDimension('2D')}
                    />
                  )}
                </div>

                {/* Section 4.D: Primary Simulator Controls & Approach Signals (5 cols) */}
                <div className="lg:col-span-5 space-y-4">
                  <TrafficControls
                    isRunning={isRunning}
                    isPaused={isPaused}
                    spawnRate={spawnRate}
                    signalMode={signalMode}
                    freeLeftTurn={freeLeftTurn}
                    timeScale={timeScale}
                    onStart={start}
                    onPause={pause}
                    onResume={resume}
                    onReset={reset}
                    onSetSpawnRate={setSpawnRate}
                    onSetSignalMode={setSignalMode}
                    onToggleFreeLeftTurn={toggleFreeLeftTurn}
                    onSetTimeScale={setTimeScale}
                    onSpawnEmergency={spawnEmergency}
                  />

                  <TrafficSignals signals={signals} />
                </div>
              </div>
            </section>

            {/* Metrics & Signal Intelligence Row */}
            <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Section 4.E: Primary Live Statistics */}
              <div className="lg:col-span-7">
                <StatisticsPanel stats={stats} />
              </div>

              {/* Section 4.F: Signal Intelligence Panel */}
              <div className="lg:col-span-5">
                <SignalIntelligencePanel
                  currentPhase={phase}
                  signalMode={signalMode}
                  signals={signals}
                  queues={{
                    north: stats.directionStats.north.currentQueue,
                    south: stats.directionStats.south.currentQueue,
                    east: stats.directionStats.east.currentQueue,
                    west: stats.directionStats.west.currentQueue,
                  }}
                  adaptiveReason={adaptiveReason}
                  phaseElapsed={phaseElapsed}
                  phaseDuration={phaseDuration}
                />
              </div>
            </section>

            {/* Section 4.G & 4.H: Comparison & Analytics Section */}
            <section id="analytics-section" className="space-y-4 pt-4 border-t border-[#2A323B]">
              <div className="space-y-1">
                <div 
                  className="text-[10px] font-mono uppercase tracking-widest font-semibold"
                  style={{ color: currentTheme.color }}
                >
                  REAL-TIME COMPARISON & BENCHMARKING
                </div>
                <h2 className="text-2xl font-bold tracking-tight text-[#F3F5F7]">
                  Measure the difference.
                </h2>
                <p className="text-xs text-[#929DA9]">
                  Evaluate queue-actuated adaptive signal optimization against static fixed-time cycles under identical arrival conditions.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <div className="lg:col-span-8">
                  <ComparisonPanel currentStats={stats} currentMode={signalMode} />
                </div>
                <div className="lg:col-span-4">
                  <ExperimentConfigPanel
                    spawnRate={spawnRate}
                    signalMode={signalMode}
                    elapsedTime={stats.elapsedTime}
                    totalVehiclesGenerated={stats.carsPassed + stats.activeVehicles}
                    freeLeftTurn={freeLeftTurn}
                    onReset={reset}
                    onRerunBenchmark={() => {
                      if (!isRunning) start();
                    }}
                  />
                </div>
              </div>
            </section>
          </div>
        ) : (
          /* Live Dual-Junction Arena (Side-by-Side Synchronized Comparison) */
          <div className="space-y-6">
            <DualArena />
          </div>
        )}
      </main>

      {/* Section 4.I: Understated Footer */}
      <footer className="bg-[#0B0D10] border-t border-[#2A323B] py-5 px-4 sm:px-6 lg:px-8 text-xs text-[#929DA9] mt-12">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2.5">
            {/* Custom geometric mark */}
            <div className="w-5 h-5 rounded bg-[#191F26] border border-[#2A323B] flex items-center justify-center p-1">
              <svg 
                className="w-full h-full" 
                style={{ color: currentTheme.color }}
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2.5"
              >
                <path d="M12 3v18M3 12h18" />
              </svg>
            </div>
            <span className="font-semibold text-[#F3F5F7]">SmartJunction</span>
            <span>•</span>
            <span className="text-[11px]">Intelligent Traffic Junction Simulator</span>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-[11px]">
            <span className="flex items-center space-x-1.5 text-[#36D98A]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#36D98A]" />
              <span>DPDP Act, 2023 Compliant (Zero Telemetry)</span>
            </span>
            <span>•</span>
            <span className="text-[#929DA9]">IRC Left-Hand Driving Standard</span>
            <span>•</span>
            <button
              onClick={() => setIsAboutOpen(true)}
              className="hover:underline font-medium"
              style={{ color: currentTheme.color }}
            >
              About System
            </button>
          </div>
        </div>
      </footer>

      {/* Interactive Modals */}
      <PrivacyModal
        isOpen={isPrivacyOpen}
        onClose={() => setIsPrivacyOpen(false)}
      />

      <DemoTourModal
        isOpen={isDemoTourOpen}
        onClose={() => setIsDemoTourOpen(false)}
        onTriggerExtremeDensity={() => {
          setSpawnRate(6.0);
          if (!isRunning) start();
        }}
        onTriggerAdaptive={() => setSignalMode('adaptive')}
        onTriggerAmbulance={() => {
          if (!isRunning) start();
          spawnEmergency('south');
        }}
      />

      <AboutModal
        isOpen={isAboutOpen}
        onClose={() => setIsAboutOpen(false)}
      />
    </div>
  );
};
