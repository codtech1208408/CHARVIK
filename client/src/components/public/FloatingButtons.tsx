import React, { useState, useEffect } from 'react';
import { MessageCircle, ArrowUp } from 'lucide-react';

export const FloatingButtons: React.FC = () => {
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>

      {/* Floating Action Container (Bottom Right) */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end space-y-3">
        {/* Scroll to top button */}
        {showScrollTop && (
          <button
            onClick={scrollToTop}
            className="w-10 h-10 rounded-full bg-white text-slate-700 hover:text-[#142B4A] hover:bg-slate-50 flex items-center justify-center shadow-md border border-slate-200 transition-all duration-200 hover:-translate-y-0.5"
            aria-label="Scroll to top"
            title="Scroll to top"
          >
            <ArrowUp className="w-5 h-5" />
          </button>
        )}

        {/* WhatsApp Floating Button */}
        <div className="flex items-center group">
          <div className="mr-3 hidden sm:block opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
            <span className="bg-emerald-800 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-md whitespace-nowrap">
              Chat on WhatsApp
            </span>
          </div>
          <a
            href="https://wa.me/919876543210?text=Hello%20Charvik%20Fleet%20Support%2C%20I%20would%20like%20to%20enquire%20about%20your%20services."
            target="_blank"
            rel="noopener noreferrer"
            className="w-14 h-14 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-110 active:scale-95 border-2 border-white ring-4 ring-emerald-500/20 relative"
            title="Chat with us on WhatsApp"
            aria-label="WhatsApp Charvik"
          >
            <MessageCircle className="w-7 h-7" />
            <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center animate-ping"></span>
            <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center border-2 border-white">
              1
            </span>
          </a>
        </div>
      </div>
    </>
  );
};
