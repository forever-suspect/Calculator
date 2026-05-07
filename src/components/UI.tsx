import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merges Tailwind classes
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const Card = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <div className={cn("bg-white border border-[#E5E1D8] rounded-sm p-8 shadow-sm", className)}>
    {children}
  </div>
);

export const Button = ({ children, onClick, className, variant = 'primary', disabled }: { 
  children: React.ReactNode, 
  onClick?: () => void, 
  className?: string,
  variant?: 'primary' | 'secondary' | 'ghost',
  disabled?: boolean
}) => {
  const base = "px-8 py-3 font-sans text-[11px] uppercase tracking-widest transition-all duration-200 active:scale-[0.98] disabled:opacity-30 disabled:pointer-events-none";
  const variants = {
    primary: "bg-[#1A1A1A] text-white hover:opacity-90",
    secondary: "bg-transparent text-[#1A1A1A] border border-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-white",
    ghost: "bg-transparent text-[#A39E93] hover:text-[#1A1A1A] underline underline-offset-4 decoration-[#E5E1D8]"
  };
  
  return (
    <button onClick={onClick} className={cn(base, variants[variant], className)} disabled={disabled}>
      {children}
    </button>
  );
};

export const Input = ({ value, onChange, type = 'text', placeholder, className }: {
  value: string,
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void,
  type?: string,
  placeholder?: string,
  className?: string
}) => (
  <input
    type={type}
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    className={cn(
      "bg-transparent border-b border-[#1A1A1A] text-[#1A1A1A] rounded-none px-0 py-2 text-lg font-serif focus:outline-none focus:border-[#555] transition-colors placeholder:text-[#A39E93] placeholder:italic placeholder:font-light",
      className
    )}
  />
);
