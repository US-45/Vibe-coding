import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  CheckCircle, 
  ChevronRight, 
  ChevronLeft, 
  Zap, 
  FileText 
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface DemoTourModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTriggerExtremeDensity: () => void;
  onTriggerAdaptive: () => void;
  onTriggerAmbulance: () => void;
}

export const DemoTourModal: React.FC<DemoTourModalProps> = ({
  isOpen,
  onClose,
  onTriggerExtremeDensity,
  onTriggerAdaptive: _onTriggerAdaptive,
  onTriggerAmbulance,
}) => {
  const { currentTheme } = useTheme();
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const steps = [
    {
      time: '0:00 - 0:20',
      title: '1. Introduction & Context',
      summary: 'Indian 4-way intersection challenge & SmartJunction purpose',
      points: [
        'Welcome judges! SmartJunction simulates real-world Indian 4-way traffic conditions (Left-Hand Driving, mixed vehicle fleet including auto-rickshaws, bikes, buses, and cars).',
        'Traditional fixed-time signals cause massive queues on congested legs while green time is wasted on empty roads.',
        'SmartJunction proves how queue-actuated adaptive signal control dramatically cuts vehicle delay with zero cloud servers or paid APIs.',
      ],
      action: null,
    },
    {
      time: '0:20 - 1:10',
      title: '2. Must-Haves Verification',
      summary: 'Spawning, Signals, Queueing without overlap, Live Telemetry, Controls',
      points: [
        'Four-way junction drawn with crisp HTML5 Canvas and minimal Swiss aesthetic.',
        'Signals cycle through Green, Amber, Red with countdowns and B&W accessibility symbols (▲ GO, ◆ WAIT, ■ STOP).',
        'Cars stop at red, queue without any overlapping, and cross safely on green with zero middle-of-junction collisions.',
        'Live statistics update in real-time: Cars Passed, Average Waiting Time, Active Vehicles, Directional Queues.',
        'Fully working Start, Pause, Resume, and clean state Reset controls.',
      ],
      action: {
        label: 'Test Must-Haves (Medium 2.0 veh/s)',
        onClick: () => {
          // Keep running
        },
      },
    },
    {
      time: '1:10 - 2:10',
      title: '3. Stretch Goals Showcase',
      summary: 'Adaptive AI Mode, Free Left Turn, Emergency Green Corridor',
      points: [
        'Adaptive Mode: Senses queue length in real-time and dynamically allocates 6s-28s green time. Early gap-out triggers when a queue clears.',
        'Free Left Turn: Indian traffic rule allows vehicles in outer lane to slip turn left smoothly without blocking or being blocked by the signal.',
        'Emergency Green Corridor: Dispatching an ambulance triggers immediate safe clearance (Amber -> All-Red) and grants uninterrupted green priority!',
        'Side-by-side comparison benchmark proves measurable reduction in waiting times.',
      ],
      action: {
        label: 'Dispatch Emergency Ambulance Now',
        onClick: onTriggerAmbulance,
      },
    },
    {
      time: '2:10 - 2:40',
      title: '4. Extreme Stress Test & Collision Proofing',
      summary: 'High density queue verification (6.0 veh/s)',
      points: [
        'Judges will test: Raising spawn rate to Extreme (6 veh/s) until queues back up.',
        'Notice: Every vehicle maintains bumper-to-bumper gap (9px min) — ZERO overlapping!',
        'Spawning checks entry clearance: new cars never spawn on top of existing queued vehicles.',
        'Yellow box junction clearance prevents gridlock during phase switches.',
      ],
      action: {
        label: 'Set Extreme Density (6.0 veh/s)',
        onClick: onTriggerExtremeDensity,
      },
    },
    {
      time: '2:40 - 3:00',
      title: '5. Conclusion & Architecture',
      summary: 'Indian road safety and intelligent signal optimization',
      points: [
        'Architecture: Pure TypeScript with zero heavy animation frameworks or bloat.',
        'Scientifically Valid: Mulberry32 seeded PRNG generates mathematically identical vehicle arrivals for fair comparisons.',
        'DPDP Act 2023 Compliant: 100% client-side execution in your browser with zero remote telemetry.',
        'Result: Up to 38% reduction in waiting delay and higher overall throughput at peak hours.',
      ],
      action: null,
    },
  ];

  const current = steps[currentStep];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] transition-colors duration-250">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-subtle)] bg-[var(--bg-secondary)]">
          <div className="flex items-center space-x-2.5">
            <div 
              className="w-8 h-8 rounded-lg border flex items-center justify-center"
              style={{
                backgroundColor: currentTheme.mutedBg,
                borderColor: currentTheme.mutedBorder,
              }}
            >
              <FileText className="w-4 h-4" style={{ color: currentTheme.color }} />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider">
                  Interactive Demo Script
                </h2>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[var(--bg-card-elevated)] border border-[var(--border-color)] text-[var(--text-secondary)]">
                  Step {currentStep + 1} of {steps.length}
                </span>
              </div>
              <p className="text-[11px] text-[var(--text-secondary)]">3-Minute Structured Hackathon Presentation Guide</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-[var(--bg-card-elevated)] hover:bg-[var(--bg-card)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 text-xs overflow-y-auto">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[var(--text-primary)]">{current.title}</h3>
            <span 
              className="font-mono text-xs px-2.5 py-0.5 rounded bg-[var(--bg-card-elevated)] border border-[var(--border-color)]"
              style={{ color: currentTheme.color }}
            >
              {current.time}
            </span>
          </div>

          <p className="text-[var(--text-secondary)] font-medium">{current.summary}</p>

          <div className="space-y-2.5 bg-[var(--bg-secondary)] p-4 rounded-xl border border-[var(--border-color)]">
            {current.points.map((pt, idx) => (
              <div key={idx} className="flex items-start space-x-2.5">
                <CheckCircle className="w-4 h-4 text-[#36D98A] shrink-0 mt-0.5" />
                <span className="text-[var(--text-primary)] leading-relaxed">{pt}</span>
              </div>
            ))}
          </div>

          {/* Contextual Action Button */}
          {current.action && (
            <div className="pt-1">
              <button
                onClick={current.action.onClick}
                className="w-full py-2.5 px-4 rounded-lg font-bold text-xs uppercase tracking-wider transition-all shadow-sm flex items-center justify-center space-x-2 active:scale-[0.98] min-h-[44px]"
                style={{
                  backgroundColor: currentTheme.color,
                  color: currentTheme.textColor,
                  boxShadow: `0 0 12px ${currentTheme.glow}`,
                }}
              >
                <Zap className="w-3.5 h-3.5 fill-current" />
                <span>{current.action.label}</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="px-6 py-3 border-t border-[var(--border-subtle)] bg-[var(--bg-secondary)] flex items-center justify-between">
          <button
            onClick={() => setCurrentStep((prev) => Math.max(0, prev - 1))}
            disabled={currentStep === 0}
            className="px-3 py-1.5 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] disabled:opacity-40 text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-card-elevated)] flex items-center space-x-1 transition-colors min-h-[36px]"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Previous</span>
          </button>

          <div className="flex items-center space-x-1.5">
            {steps.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentStep(i)}
                className="w-2 h-2 rounded-full transition-all"
                style={{
                  backgroundColor: i === currentStep ? currentTheme.color : 'var(--border-color)',
                  width: i === currentStep ? '20px' : '8px',
                }}
              />
            ))}
          </div>

          {currentStep < steps.length - 1 ? (
            <button
              onClick={() => setCurrentStep((prev) => Math.min(steps.length - 1, prev + 1))}
              className="px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1 transition-colors shadow-sm min-h-[36px]"
              style={{
                backgroundColor: currentTheme.color,
                color: currentTheme.textColor,
              }}
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg bg-[#36D98A] hover:bg-[#2fc47b] text-xs font-bold text-[#0B0D10] flex items-center space-x-1 transition-colors min-h-[36px]"
            >
              <span>Ready to Demo</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
