import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import luxuryCoachHeader from '../../assets/luxury-coach-header.png';

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
  const resolvedMaxWidth =
    maxWidth ||
    (size === 'sm'
      ? 'max-w-md'
      : size === 'lg'
        ? 'max-w-4xl'
        : size === 'xl'
          ? 'max-w-5xl'
          : 'max-w-2xl');

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
          className={`relative transform overflow-hidden rounded-3xl bg-white text-left shadow-2xl transition-all sm:my-8 w-full ${resolvedMaxWidth} border border-slate-100 flex flex-col max-h-[92vh] print:max-h-none print:overflow-visible print:shadow-none print:border-none print:my-0 print:w-full print:max-w-none`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* ── HEADER: Exact replica of the user reference images ── */}
          <div
            className="relative shrink-0 no-print overflow-hidden rounded-t-3xl min-h-[96px] sm:min-h-[105px] flex items-center"
            style={{
              background: 'linear-gradient(90deg, #00367A 0%, #004B9E 45%, #0056B3 100%)',
              borderBottom: '3.5px solid #F59E0B',
            }}
          >
            {/* The EXACT Luxury Coach Bus Image on the right side */}
            <img
              src={luxuryCoachHeader}
              alt="Luxury Coach Fleet"
              className="absolute right-0 bottom-0 h-full w-auto max-w-[38%] sm:max-w-[36%] md:max-w-[33%] object-contain object-right-bottom pointer-events-none select-none z-0"
            />

            {/* Header Content: Icon Badge + Title + Subtitle (Constrained to left 62% so it never overlaps bus) */}
            <div className="relative z-10 flex items-center px-5 sm:px-6 py-4 max-w-[62%] sm:max-w-[65%]">
              <div className="flex items-center gap-3.5">
                {icon && (
                  <div
                    className="w-11 h-11 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-md"
                    style={{
                      background: 'rgba(255, 255, 255, 0.18)',
                      border: '1.5px solid rgba(255, 255, 255, 0.3)',
                      backdropFilter: 'blur(8px)',
                    }}
                  >
                    {icon}
                  </div>
                )}
                <div>
                  <h3 className="text-lg sm:text-xl font-black tracking-tight text-white leading-tight drop-shadow-xs">
                    {title}
                  </h3>
                  {subtitle && (
                    <p className="text-xs text-blue-100 font-medium mt-1 leading-snug opacity-95">
                      {subtitle}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Close Button pinned to absolute top-right of the modal header */}
            <button
              onClick={onClose}
              className="absolute right-3.5 top-3.5 z-20 p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/20 transition-all cursor-pointer shrink-0"
              title="Close dialog"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="px-6 py-5 overflow-y-auto flex-1 print:p-0 print:overflow-visible bg-white">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};
