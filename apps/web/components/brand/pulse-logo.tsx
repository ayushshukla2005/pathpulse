import * as React from "react";

interface PulseLogoProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
  size?: number;
}

export function PulseLogo({ className = "w-6 h-6", size = 24, ...props }: PulseLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <defs>
        <linearGradient
          id="pp-pulse-gradient"
          x1="2"
          y1="16"
          x2="30"
          y2="16"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#22d3ee" />
          <stop offset="50%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#818cf8" />
        </linearGradient>
      </defs>
      <circle cx="16" cy="16" r="14" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.25" />
      <path
        d="M16 4C11.58 4 8 7.58 8 12C8 17.25 16 26 16 26C16 26 24 17.25 24 12C24 7.58 20.42 4 16 4Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="16" cy="12" r="3" fill="currentColor" fillOpacity="0.4" />
      <path
        d="M2 16H8L11 11L15 21L18 13L21 17H30"
        stroke="url(#pp-pulse-gradient)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
