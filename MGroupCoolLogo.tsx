import React from 'react';

interface LogoProps {
  className?: string;
  size?: number | string;
  variant?: 'full' | 'icon' | 'badge';
  customLogoUrl?: string; // Base64 or URL from Super Admin
}

export default function MGroupCoolLogo({ className = '', size = '100%', variant = 'full', customLogoUrl }: LogoProps) {
  // If the admin has uploaded an custom logo, use it securely with standard image referrers.
  if (customLogoUrl) {
    return (
      <img 
        src={customLogoUrl} 
        alt="M Group Cool ERP" 
        className={`${className} object-contain`} 
        style={{ height: size, maxWidth: '100%' }}
        referrerPolicy="no-referrer"
      />
    );
  }

  if (variant === 'icon') {
    return (
      <svg
        className={className}
        width={size}
        height={size}
        viewBox="0 0 160 160"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="v_coolBlue" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#1e5bf2" />
            <stop offset="100%" stopColor="#0a359c" />
          </linearGradient>
          <linearGradient id="v_coolBlueLight" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#60a5fa" />
            <stop offset="100%" stopColor="#2563eb" />
          </linearGradient>
          <filter id="v_3d_shadow" x="-10%" y="-10%" width="130%" height="130%">
            <feDropShadow dx="2" dy="4" stdDeviation="2" floodColor="#041d5c" floodOpacity="0.5" />
          </filter>
        </defs>

        {/* Waves Top Left */}
        <path d="M15 25 C 25 15, 35 35, 45 25 M15 35 C 25 25, 35 45, 45 35" stroke="#1e5bf2" strokeWidth="4" strokeLinecap="round" />

        {/* Large 3D M */}
        <g filter="url(#v_3d_shadow)">
          <path
            d="M35 130 V60 L60 95 L85 60 V130 H105 V40 H80 L60 70 L40 40 H15 V130 H35Z"
            fill="url(#v_coolBlue)"
            stroke="#0a359c"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          {/* Inner Highlights */}
          <path
            d="M35 130 V60 L60 95 L85 60 V130"
            stroke="url(#v_coolBlueLight)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.6"
          />
        </g>

        {/* Small Snowflake item */}
        <path d="M125 75 L135 85 M135 75 L125 85 M130 70 V90 M120 80 H140" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="130" cy="80" r="2.5" fill="#1e5bf2" />
      </svg>
    );
  }

  if (variant === 'badge') {
    return (
      <div className={`inline-flex items-center gap-2 ${className}`}>
        <svg
          width="36"
          height="36"
          viewBox="0 0 160 160"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="b_coolBlue" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#1e5bf2" />
              <stop offset="100%" stopColor="#0a359c" />
            </linearGradient>
            <filter id="b_3d_shadow" x="-15%" y="-15%" width="130%" height="130%">
              <feDropShadow dx="1.5" dy="2.5" stdDeviation="1.5" floodColor="#041d5c" floodOpacity="0.4" />
            </filter>
          </defs>
          <path
            d="M35 130 V60 L60 95 L85 60 V130 H105 V40 H80 L60 70 L40 40 H15 V130 H35Z"
            fill="url(#b_coolBlue)"
            stroke="#0a359c"
            strokeWidth="2"
            strokeLinejoin="round"
            filter="url(#b_3d_shadow)"
          />
        </svg>
        <span className="font-extrabold text-lg tracking-tight font-sans bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-indigo-500 to-sky-400">
          M Group Cool
        </span>
      </div>
    );
  }

  return (
    <svg
      className={className}
      width={size === '100%' ? undefined : size}
      height={size === '100%' ? undefined : size}
      viewBox="0 0 600 500"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={size === '100%' ? { width: '100%', height: 'auto' } : undefined}
    >
      <defs>
        {/* Metal Silver Gradient */}
        <linearGradient id="silverGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="20%" stopColor="#f1f5f9" />
          <stop offset="45%" stopColor="#cbd5e1" />
          <stop offset="60%" stopColor="#94a3b8" />
          <stop offset="85%" stopColor="#64748b" />
          <stop offset="100%" stopColor="#475569" />
        </linearGradient>

        {/* Neon Royal Blue beveled gradients */}
        <linearGradient id="mCoolBlue" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#2563eb" />
          <stop offset="50%" stopColor="#1d4ed8" />
          <stop offset="100%" stopColor="#1e3a8a" />
        </linearGradient>

        <linearGradient id="highlightBlue" x1="0%" y1="0%" x2="100%" y2="50%">
          <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#2563eb" stopOpacity="0.1" />
        </linearGradient>

        {/* Dark Blue stroke backup for 3D effect */}
        <filter id="m3dShadow" x="-10%" y="-10%" width="125%" height="125%">
          <feDropShadow dx="4" dy="8" stdDeviation="4" floodColor="#061c52" floodOpacity="0.6" />
        </filter>

        <filter id="silverLetterShadow" x="-10%" y="-10%" width="125%" height="125%">
          <feDropShadow dx="2" dy="5" stdDeviation="3" floodColor="#03153d" floodOpacity="0.5" />
        </filter>
      </defs>

      {/* Waves top-left of 'M' */}
      <path 
        d="M35 130 C 55 110, 85 155, 115 130 M35 150 C 55 130, 85 175, 115 150" 
        stroke="#1d4ed8" 
        strokeWidth="7" 
        strokeLinecap="round" 
        fill="none" 
      />

      {/* Waves bottom-right of 'COOL' */}
      <path 
        d="M470 350 C 490 330, 520 375, 550 350 M470 370 C 490 350, 520 395, 550 370" 
        stroke="#1d4ed8" 
        strokeWidth="7" 
        strokeLinecap="round" 
        fill="none" 
      />

      {/* Star Snowflake Left */}
      <g stroke="#1d4ed8" strokeWidth="6" strokeLinecap="round" fill="none">
        <path d="M50 295 L90 295 M70 275 L70 315 M55 280 L85 310 M55 310 L85 280" />
        <circle cx="70" cy="295" r="5" fill="#2563eb" />
      </g>

      {/* Star Snowflake Right */}
      <g stroke="#1d4ed8" strokeWidth="6" strokeLinecap="round" fill="none">
        <path d="M510 295 L550 295 M530 275 L530 315 M515 280 L545 310 M515 310 L545 280" />
        <circle cx="530" cy="295" r="5" fill="#2563eb" />
      </g>

      {/* Large Emblem M on Left */}
      <g filter="url(#m3dShadow)">
        {/* Core M Path */}
        <path
          d="M75 425 V215 L145 315 L215 215 V425 H265 V150 H205 L145 235 L85 150 H25 V425 H75Z"
          fill="url(#mCoolBlue)"
          stroke="#0f2a7a"
          strokeWidth="6"
          strokeLinejoin="round"
        />
        {/* Shiny Highlight */}
        <path
          d="M75 425 V215 L145 315 L215 215 V425"
          stroke="url(#highlightBlue)"
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </g>

      {/* Group Word Rendering with High Precision Bevel Pathing */}
      <g filter="url(#silverLetterShadow)">
        <text 
          x="280" 
          y="235" 
          fontFamily='"Inter", system-ui, sans-serif' 
          fontWeight="900" 
          fontSize="72" 
          fill="url(#silverGradient)" 
          stroke="#0c3294" 
          strokeWidth="4" 
          letterSpacing="2"
        >
          GROUP
        </text>
      </g>

      {/* COOL Word Rendering */}
      <g filter="url(#silverLetterShadow)">
        <text 
          x="160" 
          y="350" 
          fontFamily='"Inter", system-ui, sans-serif' 
          fontWeight="900" 
          fontSize="115" 
          fill="url(#silverGradient)" 
          stroke="#0c3294" 
          strokeWidth="6" 
          letterSpacing="4"
        >
          COOL
        </text>
      </g>
    </svg>
  );
}
