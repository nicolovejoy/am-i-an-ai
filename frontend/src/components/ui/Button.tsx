import type { ReactNode, ButtonHTMLAttributes } from 'react';
import { forwardRef, useCallback } from 'react';
import { useRipple } from '@/hooks/useRipple';
import '@/styles/button-animations.css';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  interactive?: boolean;
  rippleColor?: string;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  fullWidth = false,
  interactive = true,
  rippleColor,
  className = '',
  disabled,
  onClick,
  ...props 
}, ref) => {
  const baseClasses = 'font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    secondary: 'bg-slate-100 text-slate-700 hover:bg-slate-200 focus:ring-slate-500',
    ghost: 'text-slate-600 hover:bg-slate-100 focus:ring-slate-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500'
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };

  const widthClass = fullWidth ? 'w-full' : '';
  
  // Get ripple color based on variant if not provided
  const getRippleColor = () => {
    if (rippleColor) return rippleColor;
    switch (variant) {
      case 'primary': return 'rgba(255, 255, 255, 0.6)';
      case 'danger': return 'rgba(255, 255, 255, 0.6)';
      case 'secondary': return 'rgba(100, 116, 139, 0.4)';
      case 'ghost': return 'rgba(100, 116, 139, 0.3)';
      default: return 'rgba(255, 255, 255, 0.6)';
    }
  };

  const { containerRef, createRipple } = useRipple({ 
    color: getRippleColor(),
    duration: 600 
  });

  const handleClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    if (interactive && !disabled) {
      createRipple(e);
      // Add haptic feedback
      if ('vibrate' in navigator) {
        navigator.vibrate(5);
      }
    }
    onClick?.(e);
  }, [interactive, disabled, createRipple, onClick]);

  const interactiveClass = interactive ? 'interactive-button' : '';

  return (
    <button
      ref={(node) => {
        if (typeof ref === 'function') {
          ref(node);
        } else if (ref) {
          ref.current = node;
        }
        if (node) {
          (containerRef as React.MutableRefObject<HTMLButtonElement>).current = node;
        }
      }}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${widthClass} ${interactiveClass} ${className}`}
      disabled={disabled}
      onClick={handleClick}
      {...props}
    >
      {children}
    </button>
  );
});

Button.displayName = 'Button';