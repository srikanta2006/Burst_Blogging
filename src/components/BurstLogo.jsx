// src/components/BurstLogo.jsx

import styles from './BurstLogo.module.css';

function BurstLogo({ size = 'md', className = '' }) {
  return (
    <div className={`${styles.brandWrapper} ${styles[size]} ${className}`}>
      {/* Ambient Backdrop Glow */}
      <div className={styles.ambientGlow} aria-hidden="true" />

      {/* Kinetic Supernova Emblem */}
      <div className={styles.emblemContainer} aria-hidden="true">
        <svg
          viewBox="0 0 44 44"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={styles.emblemSvg}
        >
          <defs>
            <linearGradient id="burstShieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#4f46e5" />
              <stop offset="40%" stopColor="#7c3aed" />
              <stop offset="80%" stopColor="#db2777" />
              <stop offset="100%" stopColor="#f43f5e" />
            </linearGradient>

            <linearGradient id="burstInnerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
              <stop offset="50%" stopColor="#fdf4ff" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#fbcfe8" stopOpacity="0.9" />
            </linearGradient>

            <linearGradient id="burstGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fef08a" />
              <stop offset="100%" stopColor="#f59e0b" />
            </linearGradient>

            <filter id="burstCoreGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Squircle Base with Dual Rim */}
          <rect
            x="2.5"
            y="2.5"
            width="39"
            height="39"
            rx="12.5"
            fill="url(#burstShieldGrad)"
            className={styles.shieldBase}
          />
          <rect
            x="2.5"
            y="2.5"
            width="39"
            height="39"
            rx="12.5"
            stroke="rgba(255, 255, 255, 0.45)"
            strokeWidth="1.2"
            className={styles.shieldRim}
          />

          {/* Radiating Kinetic Energy Rays */}
          <g filter="url(#burstCoreGlow)">
            {/* Primary 8-point Supernova Star */}
            <path
              d="M22 6 L24.8 19.2 L38 22 L24.8 24.8 L22 38 L19.2 24.8 L6 22 L19.2 19.2 Z"
              fill="url(#burstInnerGrad)"
              className={styles.rayPrimary}
            />

            {/* 45-degree Angled Golden Cross Flares */}
            <path
              d="M22 12.5 L23.8 20.2 L31.5 22 L23.8 23.8 L22 31.5 L20.2 23.8 L12.5 22 L20.2 20.2 Z"
              transform="rotate(45 22 22)"
              fill="url(#burstGoldGrad)"
              className={styles.raySecondary}
            />

            {/* Orbital Satellite Energy Sparkles */}
            <circle cx="10" cy="10" r="1.3" fill="#ffffff" opacity="0.8" />
            <circle cx="34" cy="10" r="1.3" fill="#ffffff" opacity="0.8" />
            <circle cx="34" cy="34" r="1.3" fill="#ffffff" opacity="0.8" />
            <circle cx="10" cy="34" r="1.3" fill="#ffffff" opacity="0.8" />

            {/* Radiant Center Core */}
            <circle cx="22" cy="22" r="3.2" fill="#ffffff" />
            <circle cx="22" cy="22" r="1.6" fill="#fef08a" />
          </g>
        </svg>
      </div>

      {/* High-Impact Wordmark */}
      <div className={styles.wordmarkGroup}>
        <span className={styles.brandText}>
          BURST
          <span className={styles.sparkBadge} aria-hidden="true">
            ✦
          </span>
        </span>
      </div>
    </div>
  );
}

export default BurstLogo;
