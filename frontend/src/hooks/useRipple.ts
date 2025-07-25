import { useCallback, useRef } from 'react';

interface RippleOptions {
  color?: string;
  duration?: number;
  size?: number;
  opacity?: number;
}

export function useRipple(options: RippleOptions = {}) {
  const {
    color = 'rgba(255, 255, 255, 0.7)',
    duration = 600,
    opacity = 0.7,
  } = options;

  const containerRef = useRef<HTMLElement>(null);

  const createRipple = useCallback((event: React.MouseEvent) => {
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const ripple = document.createElement('span');
    const diameter = Math.max(rect.width, rect.height);
    const radius = diameter / 2;

    // Calculate position relative to the container
    const x = event.clientX - rect.left - radius;
    const y = event.clientY - rect.top - radius;

    ripple.style.position = 'absolute';
    ripple.style.width = ripple.style.height = `${diameter}px`;
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;
    ripple.style.borderRadius = '50%';
    ripple.style.background = color;
    ripple.style.opacity = opacity.toString();
    ripple.style.transform = 'scale(0)';
    ripple.style.animation = `ripple ${duration}ms ease-out`;
    ripple.style.pointerEvents = 'none';

    // Ensure container has relative positioning
    if (getComputedStyle(container).position === 'static') {
      container.style.position = 'relative';
    }
    container.style.overflow = 'hidden';

    container.appendChild(ripple);

    // Remove ripple after animation
    setTimeout(() => {
      ripple.remove();
    }, duration);
  }, [color, duration, opacity]);

  return {
    containerRef,
    createRipple,
  };
}

// Also export a more advanced version with glow effect
export function useGlowRipple(options: RippleOptions & { glowColor?: string; glowIntensity?: number }) {
  const {
    color = 'rgba(59, 130, 246, 0.5)',
    glowColor = 'rgba(59, 130, 246, 0.3)',
    glowIntensity = 2,
    duration = 800,
    opacity = 0.6,
  } = options;

  const containerRef = useRef<HTMLElement>(null);

  const createGlowRipple = useCallback((event: React.MouseEvent) => {
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const ripple = document.createElement('span');
    const diameter = Math.max(rect.width, rect.height) * 1.5;
    const radius = diameter / 2;

    const x = event.clientX - rect.left - radius;
    const y = event.clientY - rect.top - radius;

    ripple.style.position = 'absolute';
    ripple.style.width = ripple.style.height = `${diameter}px`;
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;
    ripple.style.borderRadius = '50%';
    ripple.style.background = `radial-gradient(circle, ${color} 0%, ${glowColor} 50%, transparent 70%)`;
    ripple.style.opacity = opacity.toString();
    ripple.style.transform = 'scale(0)';
    ripple.style.filter = `blur(${glowIntensity}px)`;
    ripple.style.animation = `glowRipple ${duration}ms ease-out`;
    ripple.style.pointerEvents = 'none';

    if (getComputedStyle(container).position === 'static') {
      container.style.position = 'relative';
    }
    container.style.overflow = 'hidden';

    container.appendChild(ripple);

    setTimeout(() => {
      ripple.remove();
    }, duration);
  }, [color, glowColor, glowIntensity, duration, opacity]);

  return {
    containerRef,
    createRipple: createGlowRipple,
  };
}