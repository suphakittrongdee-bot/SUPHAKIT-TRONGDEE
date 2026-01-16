import React from 'react';
import { Ball } from './Ball';

interface SectionProps {
  title: string;
  subtitle: string;
  numbers: string[];
  isRolling: boolean;
  cols?: number; // How many numbers to show per row
}

export const Section: React.FC<SectionProps> = ({ title, subtitle, numbers, isRolling, cols = 1 }) => {
  
  return (
    <div className="glass-panel rounded-2xl p-6 flex flex-col items-center justify-center w-full shadow-xl border-t border-white/20">
      <h3 className="text-thai-gold font-bold text-lg md:text-xl uppercase tracking-wider mb-1">{title}</h3>
      <p className="text-gray-400 text-xs md:text-sm mb-6">{subtitle}</p>
      
      <div className={`grid gap-6 w-full ${cols > 1 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'} place-items-center`}>
        {numbers.map((numStr, idx) => (
          <div key={`${title}-${idx}`} className="flex gap-2">
            {numStr.split('').map((digit, dIdx) => (
              <Ball 
                key={`${title}-${idx}-${dIdx}`} 
                digit={isRolling ? '?' : digit} 
                delay={dIdx * 50} 
                isRolling={isRolling}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};
