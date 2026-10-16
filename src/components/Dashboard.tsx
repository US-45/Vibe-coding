import React, { useState } from 'react';
import { useSimulation } from '../hooks/useSimulation';
import { Navbar } from './Navbar';
import { SimulationCanvas } from './SimulationCanvas';
import { TrafficControls } from './TrafficControls';
import { TrafficSignals } from './TrafficSignals';
import { StatisticsPanel } from './StatisticsPanel';
import { ComparisonPanel } from './ComparisonPanel';
import { DualArena } from './DualArena';
import { PrivacyModal } from './PrivacyModal';
import { DemoTourModal } from './DemoTourModal';
import { Activity, Cpu } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const [viewMode, setViewMode] = useState<'single' | 'arena'>('single');
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [isDemoTourOpen, setIsDemoTourOpen] = useState(false);

  const {
    attachCanvas,
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

  return (
    <div className="min-h-screen bg-[#141010] text-[#F2EEEE] flex flex-col">
      {/* Top Navigation */}
      <Navbar
        isRunning={isRunning}
        isPaused={isPaused}
        signalMode={signalMode}
        elapsedTime={stats.elapsedTime}
        onOpenDemoTour={() => setIsDemoTourOpen(true)}
        onOpenPrivacy={() => setIsPrivacyOpen(true)}
        viewMode={viewMode}
        onToggleViewMode={() => setViewMode((prev) => (prev === 'single' ? 'arena' : 'single'))}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Main Dashboard Editorial Header */}
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[#302A2A] pb-4">
          <div>
            <div className="flex items-center space-x-2 text-[#A41717] font-bold text-xs uppercase tracking-widest mb-1">
              <span className="w-2 h-0.5 bg-[#A41717]" />
              <span>Autonomous Urban Mobility</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#F2EEEE] uppercase font-sans">
              Traffic Intelligence System
            </h1>
            <p className="text-xs sm:text-sm text-[#A4A4A4] max-w-2xl mt-0.5">
              Indian four-way signalized junction simulation • Queue-actuated adaptive signal optimization • Zero backend or API keys
            </p>
          </div>

          {/* Quick Header Badges */}
          <div className="flex items-center space-x-2 text-xs">
            <div className="px-3 py-1 rounded bg-[#242020] border border-[#413939] flex items-center space-x-1.5">
              <Activity className="w-3.5 h-3.5 text-[#39B86B]" />
              <span className="text-[#A4A4A4]">Grid Load:</span>
              <span className="font-bold font-mono text-[#F2EEEE]">{stats.activeVehicles} veh</span>
            </div>

            <div className="px-3 py-1 rounded bg-[#242020] border border-[#413939] flex items-center space-x-1.5">
              <Cpu className="w-3.5 h-3.5 text-[#B59447]" />
              <span className="text-[#A4A4A4]">Logic:</span>
              <span className="font-bold text-[#E2C785]">{signalMode === 'adaptive' ? 'Actuated' : 'Fixed'}</span>
            </div>
          </div>
        </div>

        {/* View Selection: Single Junction vs Dual Arena */}
        {viewMode === 'single' ? (
          <div className="space-y-6">
            {/* Top Grid: Canvas on Left, Controls & Signals on Right */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Main Simulation Canvas (7 Cols on desktop) */}
              <div className="lg:col-span-7 flex flex-col justify-center">
                <SimulationCanvas
                  onCanvasReady={attachCanvas}
                  currentPhase={phase}
                  adaptiveReason={adaptiveReason}
                  freeLeftTurnEnabled={freeLeftTurn}
                />
              </div>

              {/* Sidebar: Controls & Live Signals (5 Cols on desktop) */}
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

            {/* Bottom Row: Live Statistics & Performance Comparison */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-6">
                <StatisticsPanel stats={stats} />
              </div>
              <div className="lg:col-span-6">
                <ComparisonPanel currentStats={stats} currentMode={signalMode} />
              </div>
            </div>
          </div>
        ) : (
          /* Live Dual-Junction Arena (Side-by-Side Comparison) */
          <DualArena />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-[#1C1919] border-t border-[#413939] py-3 px-4 text-center text-xs text-[#777171]">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <span>SmartJunction v2.0 • Asphalt Noir Design System</span>
          <div className="flex items-center space-x-3">
            <span className="text-[#39B86B] flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-[#39B86B]" />
              <span>DPDP Act 2023 Compliant (Zero Telemetry)</span>
            </span>
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
    </div>
  );
};
