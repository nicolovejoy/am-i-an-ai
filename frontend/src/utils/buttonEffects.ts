import type { RefObject } from 'react';

interface ButtonEffectOptions {
  rippleColor?: string;
  duration?: number;
  scale?: number;
  haptic?: boolean;
}

/**
 * Apply ripple effect to any element
 */
export function applyRippleEffect(
  element: HTMLElement,
  event: MouseEvent,
  options: ButtonEffectOptions = {}
) {
  const {
    rippleColor = 'rgba(255, 255, 255, 0.6)',
    duration = 600,
  } = options;

  const rect = element.getBoundingClientRect();
  const ripple = document.createElement('span');
  const diameter = Math.max(rect.width, rect.height);
  const radius = diameter / 2;

  const x = event.clientX - rect.left - radius;
  const y = event.clientY - rect.top - radius;

  ripple.style.position = 'absolute';
  ripple.style.width = ripple.style.height = `${diameter}px`;
  ripple.style.left = `${x}px`;
  ripple.style.top = `${y}px`;
  ripple.style.borderRadius = '50%';
  ripple.style.background = rippleColor;
  ripple.style.transform = 'scale(0)';
  ripple.style.animation = `ripple ${duration}ms ease-out`;
  ripple.style.pointerEvents = 'none';

  // Ensure parent has proper positioning
  const computedStyle = getComputedStyle(element);
  if (computedStyle.position === 'static') {
    element.style.position = 'relative';
  }
  element.style.overflow = 'hidden';

  element.appendChild(ripple);

  setTimeout(() => {
    ripple.remove();
  }, duration);
}

/**
 * Apply scale animation on press
 */
export function applyPressAnimation(element: HTMLElement, options: ButtonEffectOptions = {}) {
  const { scale = 0.95, duration = 200 } = options;
  
  element.style.transition = `transform ${duration}ms cubic-bezier(0.4, 0, 0.2, 1)`;
  element.style.transform = `scale(${scale})`;
  
  setTimeout(() => {
    element.style.transform = 'scale(1)';
  }, duration);
}

/**
 * Apply haptic feedback
 */
export function applyHapticFeedback(intensity: number = 10) {
  if ('vibrate' in navigator) {
    navigator.vibrate(intensity);
  }
}

/**
 * Enhanced button click handler that combines all effects
 */
export function enhancedButtonClick(
  element: HTMLElement,
  event: MouseEvent,
  options: ButtonEffectOptions = {}
) {
  const { haptic = true } = options;
  
  // Apply ripple
  applyRippleEffect(element, event, options);
  
  // Apply press animation
  applyPressAnimation(element, options);
  
  // Apply haptic feedback
  if (haptic) {
    applyHapticFeedback();
  }
}

/**
 * Hook to automatically enhance a button ref
 */
export function useButtonEnhancement(
  buttonRef: RefObject<HTMLButtonElement>,
  options: ButtonEffectOptions = {}
) {
  if (buttonRef.current) {
    const button = buttonRef.current;
    
    const handleClick = (e: MouseEvent) => {
      enhancedButtonClick(button, e, options);
    };
    
    button.addEventListener('click', handleClick);
    
    return () => {
      button.removeEventListener('click', handleClick);
    };
  }
}

/**
 * Add a glow pulse effect to an element
 */
export function addGlowPulse(element: HTMLElement, color: string = '#3b82f6') {
  element.style.animation = 'glowPulse 1.5s infinite';
  element.style.boxShadow = `0 0 0 0 ${color}40`;
}

/**
 * Create a magnetic hover effect
 */
export function createMagneticEffect(element: HTMLElement, strength: number = 0.3) {
  const handleMouseMove = (e: MouseEvent) => {
    const rect = element.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    
    element.style.transform = `translate(${x * strength}px, ${y * strength}px)`;
  };
  
  const handleMouseLeave = () => {
    element.style.transform = '';
  };
  
  element.addEventListener('mousemove', handleMouseMove);
  element.addEventListener('mouseleave', handleMouseLeave);
  
  return () => {
    element.removeEventListener('mousemove', handleMouseMove);
    element.removeEventListener('mouseleave', handleMouseLeave);
  };
}