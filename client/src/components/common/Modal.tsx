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
          {/* ── HEADER ── exact replica of the reference images ── */}
          <div
            className="relative shrink-0 no-print overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, #072B56 0%, #0E52A5 55%, #0A3A6B 100%)',
              borderBottom: '3px solid #F59E0B',
            }}
          >
            {/* Stars / subtle dots in background */}
            <div className="absolute inset-0 pointer-events-none">
              {[...Array(18)].map((_, i) => (
                <div
                  key={i}
                  className="absolute rounded-full bg-white"
                  style={{
                    width: i % 3 === 0 ? '3px' : '2px',
                    height: i % 3 === 0 ? '3px' : '2px',
                    left: `${(i * 37 + 11) % 92}%`,
                    top: `${(i * 23 + 7) % 70}%`,
                    opacity: 0.12 + (i % 4) * 0.05,
                  }}
                />
              ))}
            </div>

            {/* Road strip at the very bottom of header */}
            <div
              className="absolute bottom-0 left-0 right-0 h-6 pointer-events-none"
              style={{ background: 'linear-gradient(to top, #041629 0%, transparent 100%)' }}
            />
            {/* Road dashes */}
            <div className="absolute bottom-1 left-0 right-0 flex gap-4 px-4 pointer-events-none opacity-60">
              {[...Array(14)].map((_, i) => (
                <div key={i} className="h-1 w-6 rounded-full bg-yellow-400 shrink-0" />
              ))}
            </div>

            {/* Bus illustration - right side */}
            <div className="absolute right-0 bottom-0 pointer-events-none hidden sm:block select-none" style={{ width: '220px', height: '100px' }}>
              <svg viewBox="0 0 320 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-lg">
                {/* Bus Body */}
                <rect x="38" y="18" width="232" height="80" rx="10" fill="#F8FAFC"/>
                {/* Blue accent stripe */}
                <rect x="38" y="58" width="232" height="9" fill="#1D4ED8" opacity="0.9"/>
                {/* Bottom skirt */}
                <rect x="42" y="88" width="224" height="6" rx="3" fill="#CBD5E1"/>
                {/* Roof curve */}
                <rect x="38" y="18" width="232" height="12" rx="8" fill="#E2E8F0"/>

                {/* Rear face */}
                <path d="M38 18 Q26 23 26 36 L26 90 L38 90 Z" fill="#CBD5E1"/>
                <path d="M28 42 L38 40 L38 60 L28 62 Z" fill="#BFDBFE" opacity="0.6"/>
                <rect x="28" y="68" width="8" height="6" rx="1" fill="#FCA5A5" opacity="0.9"/>

                {/* Front face */}
                <path d="M270 18 Q282 23 282 38 L282 90 L270 90 Z" fill="#E2E8F0"/>
                {/* Front windshield */}
                <path d="M270 22 L280 26 L280 50 L270 50 Z" fill="#BFDBFE" opacity="0.85"/>
                {/* Headlights */}
                <rect x="272" y="62" width="8" height="5" rx="2" fill="#FEF3C7"/>
                <rect x="272" y="68" width="8" height="3" rx="1" fill="#FACC15" opacity="0.8"/>
                {/* Front grille */}
                <rect x="272" y="80" width="10" height="7" rx="2" fill="#94A3B8"/>

                {/* Side Windows row */}
                <rect x="52" y="24" width="26" height="20" rx="4" fill="#BFDBFE" opacity="0.9"/>
                <rect x="84" y="24" width="26" height="20" rx="4" fill="#BFDBFE" opacity="0.9"/>
                <rect x="116" y="24" width="26" height="20" rx="4" fill="#BFDBFE" opacity="0.9"/>
                <rect x="148" y="24" width="26" height="20" rx="4" fill="#BFDBFE" opacity="0.9"/>
                <rect x="180" y="24" width="26" height="20" rx="4" fill="#BFDBFE" opacity="0.9"/>
                <rect x="212" y="24" width="26" height="20" rx="4" fill="#BFDBFE" opacity="0.9"/>
                <rect x="244" y="24" width="22" height="20" rx="4" fill="#BFDBFE" opacity="0.9"/>

                {/* Window column dividers */}
                {[52, 84, 116, 148, 180, 212].map((x, i) => (
                  <rect key={i} x={x + 25} y="24" width="2" height="20" rx="1" fill="#93C5FD" opacity="0.4"/>
                ))}

                {/* Door */}
                <rect x="66" y="66" width="24" height="22" rx="3" fill="#CBD5E1" stroke="#94A3B8" strokeWidth="1"/>
                <rect x="68" y="68" width="10" height="18" rx="2" fill="#E2E8F0"/>
                <rect x="79" y="68" width="10" height="18" rx="2" fill="#E2E8F0"/>
                <rect x="77" y="76" width="4" height="2" rx="1" fill="#64748B"/>

                {/* Destination board */}
                <rect x="100" y="20" width="110" height="10" rx="2" fill="#1E3A8A"/>
                <text x="155" y="28" textAnchor="middle" fill="#FFFFFF" fontSize="6" fontFamily="Arial" fontWeight="bold">CHARVIK EXPRESS</text>

                {/* AC unit */}
                <rect x="130" y="12" width="52" height="8" rx="3" fill="#CBD5E1"/>
                <rect x="140" y="10" width="32" height="4" rx="2" fill="#94A3B8"/>

                {/* Side mirror */}
                <rect x="276" y="36" width="10" height="6" rx="2" fill="#94A3B8"/>

                {/* Undercarriage */}
                <rect x="60" y="90" width="200" height="4" rx="2" fill="#94A3B8"/>

                {/* Rear wheel set */}
                <circle cx="80" cy="102" r="13" fill="#1E293B"/>
                <circle cx="80" cy="102" r="8" fill="#334155"/>
                <circle cx="80" cy="102" r="4" fill="#64748B"/>
                <circle cx="80" cy="94" r="1.5" fill="#94A3B8"/>
                <circle cx="88" cy="102" r="1.5" fill="#94A3B8"/>
                <circle cx="80" cy="110" r="1.5" fill="#94A3B8"/>
                <circle cx="72" cy="102" r="1.5" fill="#94A3B8"/>

                {/* Front wheel */}
                <circle cx="236" cy="102" r="13" fill="#1E293B"/>
                <circle cx="236" cy="102" r="8" fill="#334155"/>
                <circle cx="236" cy="102" r="4" fill="#64748B"/>
                <circle cx="236" cy="94" r="1.5" fill="#94A3B8"/>
                <circle cx="244" cy="102" r="1.5" fill="#94A3B8"/>
                <circle cx="236" cy="110" r="1.5" fill="#94A3B8"/>
                <circle cx="228" cy="102" r="1.5" fill="#94A3B8"/>
              </svg>
            </div>

            {/* GPS Pin decorations (reference images show yellow & blue location pins) */}
            <div className="absolute right-52 top-3 hidden sm:block pointer-events-none select-none">
              {/* Yellow GPS pin */}
              <svg width="22" height="28" viewBox="0 0 22 28">
                <circle cx="11" cy="11" r="10" fill="#FACC15"/>
                <circle cx="11" cy="11" r="5" fill="#fff" opacity="0.7"/>
                <path d="M11 20 L4 28 Q11 22 18 28 Z" fill="#FACC15"/>
              </svg>
            </div>
            <div className="absolute right-32 top-8 hidden sm:block pointer-events-none select-none opacity-80">
              {/* Blue GPS pin */}
              <svg width="18" height="23" viewBox="0 0 22 28">
                <circle cx="11" cy="11" r="10" fill="#3B82F6"/>
                <circle cx="11" cy="11" r="5" fill="#fff" opacity="0.7"/>
                <path d="M11 20 L4 28 Q11 22 18 28 Z" fill="#3B82F6"/>
              </svg>
            </div>

            {/* Header content row */}
            <div className="relative z-10 flex items-center justify-between px-5 py-4 pr-[230px] sm:pr-[240px]">
              {/* Left: icon badge + title */}
              <div className="flex items-center gap-3">
                {icon && (
                  <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-md"
                    style={{ background: 'rgba(255,255,255,0.15)', border: '1.5px solid rgba(255,255,255,0.25)' }}>
                    {icon}
                  </div>
                )}
                <div>
                  <h3 className="text-lg sm:text-xl font-black tracking-tight text-white leading-tight drop-shadow">
                    {title}
                  </h3>
                  {subtitle && (
                    <p className="text-xs text-blue-200 font-medium mt-0.5 max-w-xs leading-snug">{subtitle}</p>
                  )}
                </div>
              </div>

              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute right-4 top-4 z-20 p-1.5 rounded-xl text-white/80 hover:text-white hover:bg-white/15 transition-all cursor-pointer shrink-0"
                title="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Orange/gold wave curve at the bottom — matches reference */}
            <div className="relative h-5 no-print" style={{ marginTop: '-2px' }}>
              <svg viewBox="0 0 400 20" preserveAspectRatio="none" className="w-full h-full" fill="none">
                <path d="M0 0 Q100 20 200 10 Q300 0 400 15 L400 20 L0 20 Z" fill="white"/>
              </svg>
            </div>
          </div>

          {/* Body */}
          <div className="px-6 py-5 overflow-y-auto flex-1 print:p-0 print:overflow-visible bg-white">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};
