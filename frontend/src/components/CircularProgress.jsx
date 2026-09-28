import React, { useEffect, useState } from 'react';

/**
 * Animated SVG Circular Progress Ring
 * @param {number} value - 0-100 percentage
 * @param {string} color - CSS color for the ring
 * @param {number} size - Diameter in px (default 100)
 * @param {number} strokeWidth - Ring thickness (default 8)
 * @param {string} label - Text below the number
 * @param {boolean} animate - Whether to animate on mount (default true)
 */
export default function CircularProgress({ value = 0, color = 'var(--ac)', size = 100, strokeWidth = 8, label = '', animate = true }) {
  const [animatedValue, setAnimatedValue] = useState(animate ? 0 : value);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (animatedValue / 100) * circumference;

  useEffect(() => {
    if (!animate) { setAnimatedValue(value); return; }
    let start = null;
    const duration = 1200;
    const from = 0;
    const to = Math.min(Math.max(value, 0), 100);

    function step(ts) {
      if (!start) start = ts;
      const elapsed = ts - start;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedValue(Math.round(from + (to - from) * eased));
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }, [value, animate]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          {/* Background track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--b1)"
            strokeWidth={strokeWidth}
            opacity={0.4}
          />
          {/* Filled arc */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{
              transition: animate ? 'none' : 'stroke-dashoffset 0.8s ease'
            }}
          />
        </svg>
        {/* Center text */}
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <span style={{
            fontSize: size * 0.28,
            fontWeight: 800,
            color: 'var(--t1)',
            lineHeight: 1,
            fontFamily: '"DM Sans", sans-serif'
          }}>
            {animatedValue}
          </span>
          <span style={{
            fontSize: size * 0.12,
            color: 'var(--t3)',
            fontWeight: 500,
            marginTop: 2
          }}>
            / 100
          </span>
        </div>
      </div>
      {label && (
        <div style={{
          fontSize: '0.8rem',
          fontWeight: 600,
          color,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          textAlign: 'center'
        }}>
          {label}
        </div>
      )}
    </div>
  );
}
