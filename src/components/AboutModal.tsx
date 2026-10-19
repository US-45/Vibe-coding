import React from 'react';
import { X, Info, Compass, Cpu, ShieldCheck } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
  const { currentTheme } = useTheme();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col transition-colors duration-250">
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
              <Info className="w-4 h-4" style={{ color: currentTheme.color }} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider">
                About SmartJunction
              </h2>
              <p className="text-[11px] text-[var(--text-secondary)]">Urban Mobility & Signal Simulation Lab</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-[var(--bg-card-elevated)] hover:bg-[var(--bg-card)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 text-xs text-[var(--text-primary)] leading-relaxed">
          <div className="p-3.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] space-y-2">
            <div className="font-bold text-sm" style={{ color: currentTheme.color }}>
              Make every green second count.
            </div>
            <p className="text-[var(--text-secondary)] text-xs">
              SmartJunction is an interactive browser-based traffic simulation designed to demonstrate the efficiency gains of queue-actuated adaptive signal control over rigid, fixed-time signal cycles at busy Indian intersections.
            </p>
          </div>

          <div className="space-y-2.5 pt-1">
            <div className="flex items-start space-x-2.5">
              <Compass className="w-4 h-4 text-[#75B8FF] shrink-0 mt-0.5" />
              <div>
                <strong className="text-[var(--text-primary)]">Indian Left-Hand Driving (LHT):</strong> Built strictly to Indian road specifications, with physical raised concrete medians (IRC yellow/black kerb striping), channelized free left-turn slip lanes, and mixed Indian vehicle fleets (Auto-rickshaws, city buses, 2-wheelers, and cars).
              </div>
            </div>

            <div className="flex items-start space-x-2.5">
              <Cpu className="w-4 h-4 shrink-0 mt-0.5" style={{ color: currentTheme.color }} />
              <div>
                <strong className="text-[var(--text-primary)]">Adaptive Signal Logic:</strong> Continuously senses directional queues and dynamically allocates green phases between 6s and 28s. Detects early gap-out when queues clear to prevent green time waste on empty approaches.
              </div>
            </div>

            <div className="flex items-start space-x-2.5">
              <ShieldCheck className="w-4 h-4 text-[#36D98A] shrink-0 mt-0.5" />
              <div>
                <strong className="text-[var(--text-primary)]">Privacy by Default (DPDP Act, 2023):</strong> Executes 100% in local browser memory. Zero cookies, zero personal data collected, and zero external network calls.
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={onClose}
              className="w-full py-2.5 rounded-lg font-bold uppercase tracking-wider text-xs transition-colors shadow-sm min-h-[44px]"
              style={{
                backgroundColor: currentTheme.color,
                color: currentTheme.textColor,
                boxShadow: `0 0 12px ${currentTheme.glow}`,
              }}
            >
              Close & Explore Simulation
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
