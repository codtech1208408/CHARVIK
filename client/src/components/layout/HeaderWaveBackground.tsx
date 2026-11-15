import React from 'react';

export const HeaderWaveBackground: React.FC = () => {
  return (
    <div className="absolute inset-0 pointer-events-none select-none overflow-hidden z-0">
      {/* Top Royal Blue Border Line */}
      <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-[#0072E5] z-10" />

      {/* Bottom Royal Blue Border Line with soft cyan glow */}
      <div className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-[#0072E5] shadow-[0_2px_8px_rgba(0,114,229,0.22)] z-10" />

      {/* Flowing Ambient Cyan Wave across header */}
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 1440 90"
        preserveAspectRatio="none"
        fill="none"
      >
        <defs>
          <linearGradient id="ambientWave1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.18" />
            <stop offset="35%" stopColor="#0EA5E9" stopOpacity="0.10" />
            <stop offset="70%" stopColor="#0284C7" stopOpacity="0.04" />
            <stop offset="100%" stopColor="#0284C7" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="ambientWave2" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#00A3FF" stopOpacity="0.15" />
            <stop offset="45%" stopColor="#38BDF8" stopOpacity="0.08" />
            <stop offset="85%" stopColor="#BAE6FD" stopOpacity="0.04" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* Upper flowing ribbon from top-left */}
        <path
          d="M0,0 C180,18 360,42 560,50 C760,58 980,36 1200,22 C1320,14 1390,26 1440,36 L1440,0 Z"
          fill="url(#ambientWave1)"
        />
        {/* Lower sweeping ribbon across middle */}
        <path
          d="M80,90 C240,78 400,52 580,48 C760,44 940,64 1160,58 C1280,55 1370,42 1440,32 L1440,90 Z"
          fill="url(#ambientWave2)"
        />
      </svg>

      {/* Left Corner: Orange Curved Ribbon & Royal Blue Wave - Confined to corner under hamburger button */}
      <svg
        className="absolute left-0 bottom-0 top-0 h-full w-[95px] sm:w-[115px]"
        viewBox="0 0 115 90"
        preserveAspectRatio="none"
        fill="none"
      >
        <defs>
          <linearGradient id="leftOrangeRibbonGrad" x1="0%" y1="40%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FF7A00" />
            <stop offset="60%" stopColor="#FF9500" />
            <stop offset="100%" stopColor="#FFAA00" />
          </linearGradient>
          <linearGradient id="leftBlueWaveGrad" x1="0%" y1="30%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#004AD6" />
            <stop offset="45%" stopColor="#0066EE" />
            <stop offset="100%" stopColor="#0088FF" />
          </linearGradient>
          <linearGradient id="leftDarkBlueBase" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#002D88" />
            <stop offset="100%" stopColor="#004CB8" />
          </linearGradient>
        </defs>

        {/* Base dark blue foundation layer in corner */}
        <path
          d="M0,58 Q30,70 65,78 Q85,84 105,90 L0,90 Z"
          fill="url(#leftDarkBlueBase)"
        />

        {/* Main Royal Blue Wave sweeping down to bottom edge */}
        <path
          d="M0,62 C25,70 50,77 78,82 C92,85 104,88 115,90 L0,90 Z"
          fill="url(#leftBlueWaveGrad)"
        />

        {/* Dynamic Orange Curved Ribbon riding on top of the blue wave */}
        <path
          d="M0,48 C20,58 45,67 70,73 C88,77 102,80 112,82 C95,80 75,76 55,70 C35,62 18,52 0,44 Z"
          fill="url(#leftOrangeRibbonGrad)"
        />
      </svg>

      {/* Right Corner: Orange Curved Ribbon & Royal Blue Wave */}
      <svg
        className="absolute right-0 top-0 bottom-0 h-full w-[220px] sm:w-[280px]"
        viewBox="0 0 280 90"
        preserveAspectRatio="none"
        fill="none"
      >
        <defs>
          <linearGradient id="rightOrangeRibbonGrad" x1="0%" y1="0%" x2="100%" y2="60%">
            <stop offset="0%" stopColor="#FFAA00" />
            <stop offset="40%" stopColor="#FF9500" />
            <stop offset="100%" stopColor="#FF7A00" />
          </linearGradient>
          <linearGradient id="rightBlueWaveGrad" x1="0%" y1="0%" x2="100%" y2="80%">
            <stop offset="0%" stopColor="#0088FF" />
            <stop offset="55%" stopColor="#0066EE" />
            <stop offset="100%" stopColor="#004AD6" />
          </linearGradient>
          <linearGradient id="rightDarkBlueBase" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#004CB8" />
            <stop offset="100%" stopColor="#002D88" />
          </linearGradient>
        </defs>

        {/* Base dark blue foundation layer in top-right */}
        <path
          d="M50,0 Q110,6 165,14 Q230,24 280,42 L280,0 Z"
          fill="url(#rightDarkBlueBase)"
        />

        {/* Main Royal Blue Wave in top-right */}
        <path
          d="M10,0 C75,6 135,13 190,22 C230,28 258,34 280,48 L280,0 Z"
          fill="url(#rightBlueWaveGrad)"
        />

        {/* Dynamic Orange Curved Ribbon in top-right */}
        <path
          d="M60,5 C95,8 135,13 175,20 C215,27 250,36 280,50 C252,35 218,25 180,18 C142,11 102,7 60,5 Z"
          fill="url(#rightOrangeRibbonGrad)"
        />
      </svg>
    </div>
  );
};
