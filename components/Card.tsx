import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  noPadding?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, className = "", onClick, noPadding = false }) => {
  return (
    <div 
      onClick={onClick}
      className={`posh-card rounded-[24px] ${noPadding ? '' : 'p-6'} ${onClick ? 'cursor-pointer active:scale-[0.98]' : ''} ${className}`}
    >
      {children}
    </div>
  );
};