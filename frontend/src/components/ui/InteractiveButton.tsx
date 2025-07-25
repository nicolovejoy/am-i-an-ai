import React, { forwardRef, useCallback, useState } from 'react';
import { useRipple, useGlowRipple } from '@/hooks/useRipple';
import '@/styles/button-animations.css';

interface InteractiveButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'gradient' | 'neon' | 'minimal';
  theme?: 'blue' | 'purple' | 'pink' | 'green';
  rippleColor?: string;
  glowEffect?: boolean;
  magneticEffect?: boolean;
  hapticFeedback?: boolean;
  children: React.ReactNode;
}

export const InteractiveButton = forwardRef<HTMLButtonElement, InteractiveButtonProps>(
  (
    {
      variant = 'default',
      theme = 'blue',
      rippleColor,
      glowEffect = false,
      magneticEffect = false,
      hapticFeedback = true,
      className = '',
      onClick,
      onMouseMove,
      onMouseLeave,
      children,
      ...props
    },
    ref
  ) => {
    const [isPressed, setIsPressed] = useState(false);
    const normalRipple = useRipple({ color: rippleColor });
    const glowRipple = useGlowRipple({ color: rippleColor });
    const { containerRef, createRipple } = glowEffect ? glowRipple : normalRipple;

    const handleClick = useCallback(
      (e: React.MouseEvent<HTMLButtonElement>) => {
        // Create ripple effect
        createRipple(e);

        // Haptic feedback (if supported)
        if (hapticFeedback && 'vibrate' in navigator) {
          navigator.vibrate(10);
        }

        // Call original onClick
        onClick?.(e);
      },
      [createRipple, hapticFeedback, onClick]
    );

    const handleMouseMove = useCallback(
      (e: React.MouseEvent<HTMLButtonElement>) => {
        if (magneticEffect) {
          const button = e.currentTarget;
          const rect = button.getBoundingClientRect();
          const x = e.clientX - rect.left - rect.width / 2;
          const y = e.clientY - rect.top - rect.height / 2;
          
          // Magnetic pull effect
          const pull = 0.3;
          button.style.transform = `translate(${x * pull}px, ${y * pull}px)`;
        }
        onMouseMove?.(e);
      },
      [magneticEffect, onMouseMove]
    );

    const handleMouseLeave = useCallback(
      (e: React.MouseEvent<HTMLButtonElement>) => {
        if (magneticEffect) {
          e.currentTarget.style.transform = '';
        }
        onMouseLeave?.(e);
      },
      [magneticEffect, onMouseLeave]
    );

    const classes = [
      'interactive-button',
      `theme-${theme}`,
      variant === 'gradient' && 'gradient-shift',
      variant === 'neon' && 'neon',
      glowEffect && 'glow',
      magneticEffect && 'magnetic',
      isPressed && 'pressed',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <button
        ref={(node) => {
          // Handle both refs
          if (typeof ref === 'function') {
            ref(node);
          } else if (ref) {
            ref.current = node;
          }
          if (node) {
            (containerRef as React.MutableRefObject<HTMLButtonElement>).current = node;
          }
        }}
        className={classes}
        onClick={handleClick}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onMouseDown={() => setIsPressed(true)}
        onMouseUp={() => setIsPressed(false)}
        {...props}
      >
        {children}
      </button>
    );
  }
);

InteractiveButton.displayName = 'InteractiveButton';

// Export a preset for primary buttons
export const PrimaryButton: React.FC<Omit<InteractiveButtonProps, 'variant' | 'glowEffect'>> = (props) => (
  <InteractiveButton
    variant="gradient"
    glowEffect
    theme="blue"
    className="px-6 py-3 font-semibold text-white rounded-lg"
    {...props}
  />
);

// Export a preset for secondary buttons
export const SecondaryButton: React.FC<Omit<InteractiveButtonProps, 'variant'>> = (props) => (
  <InteractiveButton
    variant="minimal"
    theme="purple"
    className="px-4 py-2 font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
    {...props}
  />
);

// Export a preset for neon buttons
export const NeonButton: React.FC<Omit<InteractiveButtonProps, 'variant' | 'magneticEffect'>> = (props) => (
  <InteractiveButton
    variant="neon"
    magneticEffect
    theme="pink"
    className="px-6 py-3 font-bold text-pink-400 bg-transparent rounded-lg"
    {...props}
  />
);