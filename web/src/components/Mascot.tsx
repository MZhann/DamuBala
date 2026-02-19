"use client";

interface MascotProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  animate?: boolean;
}

export function Mascot({ size = "md", className = "", animate = true }: MascotProps) {
  const sizeClasses = {
    sm: "w-16 h-16",
    md: "w-24 h-24",
    lg: "w-40 h-40",
  };

  return (
    <div className={`${sizeClasses[size]} ${animate ? "animate-float" : ""} ${className}`}>
      <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Body */}
        <ellipse cx="60" cy="65" rx="45" ry="40" fill="#7EC8E8"/>
        <ellipse cx="60" cy="68" rx="40" ry="35" fill="#9DD5EC"/>
        
        {/* Belly */}
        <ellipse cx="60" cy="75" rx="25" ry="20" fill="#E8F4FD"/>
        
        {/* Eyes */}
        <ellipse cx="45" cy="55" rx="10" ry="12" fill="white"/>
        <ellipse cx="75" cy="55" rx="10" ry="12" fill="white"/>
        <circle cx="47" cy="56" r="5" fill="#2D3748"/>
        <circle cx="77" cy="56" r="5" fill="#2D3748"/>
        <circle cx="48" cy="54" r="2" fill="white"/>
        <circle cx="78" cy="54" r="2" fill="white"/>
        
        {/* Blush */}
        <ellipse cx="35" cy="65" rx="6" ry="3" fill="#FFB5C5" opacity="0.6"/>
        <ellipse cx="85" cy="65" rx="6" ry="3" fill="#FFB5C5" opacity="0.6"/>
        
        {/* Smile */}
        <path d="M50 72 Q60 82 70 72" stroke="#2D3748" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
        
        {/* Little arms/fins */}
        <ellipse cx="20" cy="65" rx="10" ry="6" fill="#7EC8E8" transform="rotate(-20 20 65)"/>
        <ellipse cx="100" cy="65" rx="10" ry="6" fill="#7EC8E8" transform="rotate(20 100 65)"/>
        
        {/* Top fin/hair */}
        <ellipse cx="60" cy="30" rx="8" ry="12" fill="#5BB5E0"/>
        <ellipse cx="50" cy="35" rx="5" ry="8" fill="#5BB5E0"/>
        <ellipse cx="70" cy="35" rx="5" ry="8" fill="#5BB5E0"/>
        
        {/* Sparkles */}
        <path d="M95 25 L97 30 L102 30 L98 33 L100 38 L95 35 L90 38 L92 33 L88 30 L93 30 Z" fill="#FFD93D"/>
        <circle cx="25" cy="40" r="3" fill="#FFD93D"/>
        <circle cx="20" cy="35" r="2" fill="#FFD93D"/>
      </svg>
    </div>
  );
}

export function MascotSmall({ className = "" }: { className?: string }) {
  return (
    <div className={`w-10 h-10 ${className}`}>
      <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="20" cy="22" rx="15" ry="13" fill="#7EC8E8"/>
        <ellipse cx="20" cy="24" rx="12" ry="10" fill="#9DD5EC"/>
        <circle cx="15" cy="19" r="3" fill="white"/>
        <circle cx="25" cy="19" r="3" fill="white"/>
        <circle cx="15.5" cy="19.5" r="1.5" fill="#2D3748"/>
        <circle cx="25.5" cy="19.5" r="1.5" fill="#2D3748"/>
        <path d="M17 26 Q20 29 23 26" stroke="#2D3748" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
      </svg>
    </div>
  );
}

