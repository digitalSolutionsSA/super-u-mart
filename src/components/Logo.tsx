import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  light?: boolean;
}

export default function Logo({ size = 'md', light = false }: LogoProps) {
  const sizes = { sm: 120, md: 180, lg: 240 };
  const w = sizes[size];

  return (
    <svg width={w} height={w * 0.28} viewBox="0 0 300 84" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Background */}
      <rect width="300" height="84" rx="6" fill="#1a2e7a" />
      
      {/* Super text */}
      <text x="18" y="58" fontFamily="Barlow, Arial, sans-serif" fontWeight="800" fontSize="42" fill="white">Super</text>
      
      {/* U letter with orange */}
      <text x="140" y="58" fontFamily="Barlow, Arial, sans-serif" fontWeight="800" fontSize="42" fill="#f97316">U</text>
      
      {/* Leaf on U */}
      <ellipse cx="163" cy="14" rx="7" ry="4" fill="#22c55e" transform="rotate(-30 163 14)" />
      <ellipse cx="168" cy="12" rx="5" ry="3" fill="#16a34a" transform="rotate(-15 168 12)" />
      
      {/* Mart text */}
      <text x="178" y="58" fontFamily="Barlow, Arial, sans-serif" fontWeight="800" fontSize="42" fill="white">Mart</text>
    </svg>
  );
}

export function LogoMark({ size = 36 }: { size?: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ fontFamily: 'Barlow, sans-serif', fontWeight: 800, fontSize: size * 0.7, color: 'white' }}>
        Super{' '}
        <span style={{ color: '#f97316', position: 'relative' }}>
          Ü
        </span>{' '}
        Mart
      </span>
    </div>
  );
}
