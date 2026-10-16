import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  Clock, 
  CheckCircle, 
  ChevronRight, 
  ChevronLeft, 
  Play, 
  Zap, 
  Siren, 
  Sliders, 
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
  onTriggerAdaptive,
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
        'Demonstrated working Must-Haves: Top-down 4-way LHT Indian junction, queueing without overlap, live statistics, pause/resume/reset.',
        'Demonstrated High-Value Stretch Goals: Queue-actuated Adaptive AI mode with side-by-side comparison, Free Left Turn, and Emergency Ambulance Green Corridor.',
        'Privacy by Default: Zero personal data collected, 100% client-side in-memory simulation in full compliance with the DPDP Act, 2023.',
      ],
      action: {
        label: 'Complete 3-Minute Walkthrough',
        onClick: onClose,
      },
    },
  ];

  const current = steps[currentStep];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#12161B] border border-[#2A323B] rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1E252D] bg-[#191F26]">
          <div className="flex items-center space-x-2.5">
            <div 
              className="w-8 h-8 rounded-lg border flex items-center justify-center"
              style={{
                backgroundColor: currentTheme.mutedBg,
                borderColor: currentTheme.mutedBorder,
              }}
            >
              <Sparkles className="w-4 h-4" style={{ color: currentTheme.color }} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#F3F5F7] uppercase tracking-wider">
                3-Minute Hackathon Demo Script
              </h2>
              <p className="text-[11px] text-[#929DA9] font-mono">Step {currentStep + 1} of {steps.length} • {current.time}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-[#12161B] hover:bg-[#2A323B] text-[#929DA9] hover:text-[#F3F5F7] flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 text-xs">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#F3F5F7]">{current.title}</h3>
            <span 
              className="font-mono text-xs px-2.5 py-0.5 rounded bg-[#191F26] border border-[#2A323B]"
              style={{ color: currentTheme.color }}
            >
              {current.time}
            </span>
          </div>

          <p className="text-[#929DA9] font-medium">{current.summary}</p>

          <div className="space-y-2.5 bg-[#0B0D10] p-4 rounded-xl border border-[#2A323B]">
            {current.points.map((pt, idx) => (
              <div key={idx} className="flex items-start space-x-2.5">
                <CheckCircle className="w-4 h-4 text-[#36D98A] shrink-0 mt-0.5" />
                <span className="text-[#F3F5F7] leading-relaxed">{pt}</span>
              </div>
            ))}
          </div>

          {/* Contextual Action Button */}
          {current.action && (
            <div className="pt-1">
              <button
                onClick={current.action.onClick}
                className="w-full py-2.5 px-4 rounded-lg font-bold text-xs uppercase tracking-wider transition-all shadow-sm flex items-center justify-center space-x-2 active:scale-[0.98]"
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
        <div className="px-6 py-3 border-t border-[#1E252D] bg-[#191F26] flex items-center justify-between">
          <button
            onClick={() => setCurrentStep((prev) => Math.max(0, prev - 1))}
            disabled={currentStep === 0}
            className="px-3 py-1.5 rounded-lg bg-[#12161B] border border-[#2A323B] disabled:opacity-40 text-xs font-semibold text-[#F3F5F7] hover:bg-[#202730] flex items-center space-x-1 transition-colors"
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
                  backgroundColor: i === currentStep ? currentTheme.color : '#2A323B',
                  width: i === currentStep ? '20px' : '8px',
                }}
              />
            ))}
          </div>

          {currentStep < steps.length - 1 ? (
            <button
              onClick={() => setCurrentStep((prev) => Math.min(steps.length - 1, prev + 1))}
              className="px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1 transition-colors shadow-sm"
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
              className="px-3 py-1.5 rounded-lg bg-[#36D98A] hover:bg-[#2fc47b] text-xs font-bold text-[#0B0D10] flex items-center space-x-1 transition-colors"
            >
              <span>Ready to Demo</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
