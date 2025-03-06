import React from 'react';

interface AppIconProps {
  className?: string;
  width?: number;
  height?: number;
  glowColor?: string;
}

const AppIcon: React.FC<AppIconProps> = ({
  className = '',
  width = 100,
  height = 100,
  glowColor = 'var(--neon-blue)',
}) => {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Filter for neon glow effect */}
      <defs>
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Background grid */}
      <rect width="100" height="100" rx="10" fill="#0F1A2A" />

      {/* Grid lines */}
      <g opacity="0.3" stroke="#43D0FF" strokeWidth="0.5">
        {/* Horizontal grid lines */}
        {Array.from({ length: 10 }).map((_, i) => (
          <line key={`h-${i}`} x1="0" y1={i * 10} x2="100" y2={i * 10} />
        ))}
        {/* Vertical grid lines */}
        {Array.from({ length: 10 }).map((_, i) => (
          <line key={`v-${i}`} x1={i * 10} y1="0" x2={i * 10} y2="100" />
        ))}
      </g>

      {/* Robot head outline */}
      <g filter="url(#glow)">
        {/* Robot head */}
        <rect x="25" y="20" width="50" height="60" rx="5" stroke={glowColor} strokeWidth="2" />

        {/* Robot antenna */}
        <line x1="50" y1="20" x2="50" y2="10" stroke={glowColor} strokeWidth="2" />
        <circle cx="50" cy="8" r="3" stroke={glowColor} strokeWidth="2" />

        {/* Robot eyes */}
        <rect x="35" y="35" width="10" height="10" rx="2" fill={glowColor} />
        <rect x="55" y="35" width="10" height="10" rx="2" fill={glowColor} />

        {/* Robot mouth */}
        <rect x="35" y="55" width="30" height="5" rx="2" stroke={glowColor} strokeWidth="2" />
        <line x1="40" y1="55" x2="40" y2="60" stroke={glowColor} strokeWidth="1" />
        <line x1="50" y1="55" x2="50" y2="60" stroke={glowColor} strokeWidth="1" />
        <line x1="60" y1="55" x2="60" y2="60" stroke={glowColor} strokeWidth="1" />

        {/* Circuit board patterns */}
        <line x1="25" y1="30" x2="35" y2="30" stroke={glowColor} strokeWidth="1" />
        <line x1="65" y1="30" x2="75" y2="30" stroke={glowColor} strokeWidth="1" />
        <line x1="25" y1="50" x2="35" y2="50" stroke={glowColor} strokeWidth="1" />
        <line x1="65" y1="50" x2="75" y2="50" stroke={glowColor} strokeWidth="1" />

        {/* Binary code at the bottom */}
        <text x="30" y="85" fill={glowColor} fontFamily="monospace" fontSize="8">
          10100111
        </text>
      </g>

      {/* Question mark overlay */}
      <g filter="url(#glow)">
        <text
          x="50"
          y="95"
          fill={glowColor}
          fontFamily="monospace"
          fontSize="12"
          fontWeight="bold"
          textAnchor="middle"
        >
          AI?
        </text>
      </g>
    </svg>
  );
};

export default AppIcon;
