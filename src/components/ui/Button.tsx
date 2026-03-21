'use client';

import { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'ghost';
  size?: 'lg' | 'md' | 'sm';
  fullWidth?: boolean;
}

const variants = {
  primary: 'bg-green-600 text-white hover:bg-green-700 active:bg-green-800 focus:ring-green-400',
  secondary: 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 focus:ring-blue-400',
  danger: 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800 focus:ring-red-400',
  success: 'bg-emerald-600 text-white hover:bg-emerald-700 active:bg-emerald-800 focus:ring-emerald-400',
  ghost: 'bg-gray-100 text-gray-800 hover:bg-gray-200 active:bg-gray-300 focus:ring-gray-400',
};

const sizes = {
  lg: 'py-4 px-8 text-xl rounded-2xl min-h-[60px]',
  md: 'py-3 px-6 text-lg rounded-xl min-h-[48px]',
  sm: 'py-2 px-4 text-base rounded-lg min-h-[40px]',
};

export default function Button({
  children,
  variant = 'primary',
  size = 'lg',
  fullWidth = false,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`
        font-bold transition-colors duration-150
        focus:outline-none focus:ring-4
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variants[variant]}
        ${sizes[size]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
