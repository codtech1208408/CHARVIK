import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  maxWidth?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  icon,
  children,
  maxWidth,
  size
}) => {
  const resolvedMaxWidth = maxWidth || (size === 'sm' ? 'max-w-md' : size === 'lg' ? 'max-w-4xl' : size === 'xl' ? 'max-w-5xl' : 'max-w-2xl');
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto print:static print:overflow-visible print:z-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity no-print"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="min-h-full flex items-center justify-center p-4 text-center sm:p-6 print:p-0 print:block print:min-h-0">
        <div
          className={`relative transform overflow-hidden rounded-2xl bg-white text-left shadow-2xl transition-all sm:my-8 w-full ${resolvedMaxWidth} border border-slate-100 flex flex-col max-h-[90vh] print:max-h-none print:overflow-visible print:shadow-none print:border-none print:my-0 print:w-full print:max-w-none`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Vibrant Colorful Header Banner Matching Reference Images */}
          <div className="relative px-6 py-4 bg-gradient-to-r from-[#072B56] via-[#0E52A5] to-[#0A3663] text-white flex items-center justify-between shrink-0 no-print overflow-hidden border-b-2 border-yellow-400">
            {/* Coach Bus on Highway Graphic on Right */}
            <div className="absolute right-8 top-0 bottom-0 pointer-events-none hidden sm:flex items-center overflow-hidden pr-6 select-none opacity-90">
              <svg className="w-56 h-18 -mr-2 drop-shadow-md" viewBox="0 0 240 80" fill="none">
                {/* Highway Road Perspective */}
                <path d="M0 72 Q120 68 240 45 L240 80 L0 80 Z" fill="#041629" opacity="0.55" />
                {/* Golden Road Curve */}
                <path d="M0 73 Q120 69 240 46" stroke="#FACC15" strokeWidth="2.5" strokeDasharray="8 5" />
                {/* Luxury Coach Bus */}
                <g transform="translate(132, 10) scale(0.68)">
                  <rect x="0" y="8" width="135" height="46" rx="6" fill="#FFFFFF" />
                  <path d="M118 8 Q135 12 135 28 L135 54 L0 54 L0 8 Z" fill="#FFFFFF" />
                  <path d="M108 12 L130 15 Q133 24 128 30 L108 30 Z" fill="#1E3A5F" />
                  <rect x="18" y="14" width="86" height="16" rx="2" fill="#1E3A5F" />
                  <line x1="38" y1="14" x2="38" y2="30" stroke="#FFFFFF" strokeWidth="1.5" />
                  <line x1="58" y1="14" x2="58" y2="30" stroke="#FFFFFF" strokeWidth="1.5" />
                  <line x1="78" y1="14" x2="78" y2="30" stroke="#FFFFFF" strokeWidth="1.5" />
                  <path d="M5 38 Q70 41 133 37 L133 42 Q70 45 5 42 Z" fill="#0284C7" />
                  <circle cx="132" cy="44" r="2.5" fill="#FACC15" />
                  <circle cx="2" cy="46" r="2" fill="#EF4444" />
                  <circle cx="26" cy="54" r="8" fill="#0F172A" />
                  <circle cx="26" cy="54" r="4" fill="#94A3B8" />
                  <circle cx="108" cy="54" r="8" fill="#0F172A" />
                  <circle cx="108" cy="54" r="4" fill="#94A3B8" />
                  <circle cx="92" cy="54" r="7.5" fill="#0F172A" />
                  <circle cx="92" cy="54" r="3.5" fill="#94A3B8" />
                </g>
              </svg>
            </div>

            {/* Left Header Title with Icon */}
            <div className="relative z-10 flex items-center gap-3 pr-8">
              {icon && (
                <div className="w-10 h-10 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center text-white shrink-0 shadow-xs">
                  {icon}
                </div>
              )}
              <div>
                <h3 className="text-lg sm:text-xl font-black tracking-tight text-white flex items-center gap-2 drop-shadow-xs">
                  {title}
                </h3>
                {subtitle && <p className="text-xs text-blue-100 font-medium mt-0.5 max-w-md">{subtitle}</p>}
              </div>
            </div>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="relative z-10 p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/15 transition-all cursor-pointer shrink-0"
              title="Close dialog"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="px-6 py-5 overflow-y-auto flex-1 print:p-0 print:overflow-visible">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};
