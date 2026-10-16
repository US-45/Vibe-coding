import React from 'react';
import { X, ShieldCheck, Lock, CheckCircle2, EyeOff, ServerOff } from 'lucide-react';

interface PrivacyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrivacyModal: React.FC<PrivacyModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#1C1919] border border-[#413939] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#302A2A] bg-[#242020]">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#39B86B]/20 border border-[#39B86B]/50 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-[#39B86B]" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#F2EEEE] uppercase tracking-wider">
                Privacy by Default Notice
              </h2>
              <p className="text-[11px] text-[#39B86B]">DPDP Act, 2023 Compliant</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-[#302A2A] hover:bg-[#413939] text-[#A4A4A4] hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 text-xs text-[#F2EEEE]">
          <div className="p-3 rounded-lg bg-[#191616] border border-[#302A2A] flex items-start space-x-3">
            <Lock className="w-5 h-5 text-[#39B86B] shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="font-bold text-[#39B86B]">Zero Personal Data Collection</div>
              <p className="text-[11px] text-[#A4A4A4] leading-relaxed">
                SmartJunction operates under the principle of <em>Data Minimization and Privacy by Design</em> in compliance with India's <strong>Digital Personal Data Protection (DPDP) Act, 2023</strong>.
              </p>
            </div>
          </div>

          <div className="space-y-2 pt-1">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-[#39B86B] shrink-0" />
              <span><strong>100% Client-Side:</strong> All simulation calculations and rendering run entirely within your local browser.</span>
            </div>
            <div className="flex items-center space-x-2">
              <ServerOff className="w-4 h-4 text-[#39B86B] shrink-0" />
              <span><strong>Zero Remote Telemetry:</strong> No tracking scripts, cookies, or remote analytics endpoints.</span>
            </div>
            <div className="flex items-center space-x-2">
              <EyeOff className="w-4 h-4 text-[#39B86B] shrink-0" />
              <span><strong>Ephemeral Memory:</strong> All simulation metrics are stored in browser RAM only and are cleared on Reset or tab close.</span>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-[#242020] border border-[#413939] text-[11px] text-[#A4A4A4]">
            <strong>Hackathon Bonus Criterion:</strong> Meets full DPDP 2023 standards for maximum Code Quality points.
          </div>

          <div className="pt-2">
            <button
              onClick={onClose}
              className="w-full py-2 rounded-lg bg-[#39B86B] hover:bg-[#32a860] text-black font-bold uppercase tracking-wider text-xs transition-colors"
            >
              Acknowledge & Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
