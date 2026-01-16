import React from 'react';

interface BallProps {
  digit: string;
  delay?: number;
  isRolling?: boolean;
}

export const Ball: React.FC<BallProps> = ({ digit, delay = 0, isRolling = false }) => {
  return (
    <div 
      className={`
        relative w-10 h-10 md:w-14 md:h-14 rounded-full 
        bg-gradient-to-br from-yellow-100 to-yellow-500 
        shadow-lg flex items-center justify-center 
        text-slate-900 font-bold text-xl md:text-2xl 
        border-2 border-yellow-200
        transition-all duration-300 transform
        ${isRolling ? 'animate-pulse scale-90 opacity-80' : 'scale-100 opacity-100'}
      `}
      style={{ animationDelay: `${delay}ms` }}
    >
      <span className="drop-shadow-sm">{digit}</span>
      
      {/* Shine effect */}
      <div className="absolute top-1 left-2 w-3 h-2 bg-white rounded-full opacity-60 blur-[1px]"></div>
    </div>
  );
};
