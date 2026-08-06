'use client';

import { useState } from 'react';
import UserHomeClient from './user/user-home/userhome-client';
import CompanyHomeClient from './company/company-home/page';

interface HomeSwitcherProps {
  initialUser: any;
}

export default function HomeSwitcher({ initialUser }: HomeSwitcherProps) {
  const [mode, setMode] = useState<'user' | 'company'>('user');
  const particles = ['30deg', '60deg', '90deg', '120deg', '150deg', '180deg'];

  const handleToggleChange = (checked: boolean) => {
    setMode(checked ? 'company' : 'user');
  };

  return (
    <main className="relative min-h-screen">
      <div className="floating-mode-switcher">
        <span className="mode-label">
          {mode === 'company' ? 'COMPANY MODE' : 'USER MODE'}
        </span>

        <label className="cosmic-toggle">
          <input
            className="toggle"
            type="checkbox"
            checked={mode === 'company'}
            onChange={(e) => handleToggleChange(e.target.checked)}
          />
          <div className="slider">
            <div className="cosmos"></div>
            <div className="energy-line"></div>
            <div className="energy-line"></div>
            <div className="energy-line"></div>

            <div className="toggle-orb">
              <div className="inner-orb"></div>
              <div className="ring"></div>
            </div>

            <div className="particles">
              {particles.map((angle, index) => (
                <div
                  key={index}
                  className="particle"
                  style={{ '--angle': angle } as React.CSSProperties}
                />
              ))}
            </div>
          </div>
        </label>
      </div>

      {mode === 'user' ? (
        <UserHomeClient initialUser={initialUser} />
      ) : (
        <CompanyHomeClient initialUser={initialUser} />
      )}

      <style jsx global>{`
        .floating-mode-switcher {
          position: Absolute;
          top: 20px; /* ดันลงมาจาก Navbar สีดำ */
          display: flex;
          left: 10px;
          align-items: center;
          gap: 12px;
          background: rgba(15, 23, 42, 0.9);
          backdrop-filter: blur(8px);
          padding: 6px 14px;
          border-radius: 40px;
          border: 1px solid rgba(255, 255, 255, 0.2);
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5);
        }

        .mode-label {
          color: #ffffff;
          font-size: 0.85rem;
          font-weight: 700;
          letter-spacing: 0.05em;
          white-space: nowrap;
        }

        .cosmic-toggle {
          position: relative;
          width: 80px;
          height: 40px;
          transform-style: preserve-3d;
          perspective: 500px;
          display: inline-block;
        }

        .toggle {
          opacity: 0;
          width: 0;
          height: 0;
          position: absolute;
        }

        .slider {
          position: absolute;
          cursor: pointer;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(45deg, #1a1a2e, #16213e);
          border-radius: 20px;
          transition: 0.5s;
          transform-style: preserve-3d;
          box-shadow:
            0 0 15px rgba(0, 0, 0, 0.5),
            inset 0 0 10px rgba(255, 255, 255, 0.05);
          overflow: hidden;
        }

        .cosmos {
          position: absolute;
          inset: 0;
          background: radial-gradient(1px 1px at 10% 10%, #fff 100%, transparent),
            radial-gradient(1px 1px at 30% 30%, #fff 100%, transparent),
            radial-gradient(1px 1px at 50% 50%, #fff 100%, transparent),
            radial-gradient(1px 1px at 70% 70%, #fff 100%, transparent),
            radial-gradient(1px 1px at 90% 90%, #fff 100%, transparent);
          background-size: 200% 200%;
          opacity: 0.2;
          transition: 0.5s;
        }

        .toggle-orb {
          position: absolute;
          height: 32px;
          width: 32px;
          left: 4px;
          bottom: 4px;
          background: linear-gradient(145deg, #ff6b6b, #4ecdc4);
          border-radius: 50%;
          transition: 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
          transform-style: preserve-3d;
          z-index: 2;
        }

        .inner-orb {
          position: absolute;
          inset: 3px;
          border-radius: 50%;
          background: linear-gradient(145deg, #fff, #e6e6e6);
          transition: 0.5s;
          overflow: hidden;
        }

        .inner-orb::before {
          content: "";
          position: absolute;
          inset: 0;
          background: repeating-conic-gradient(
            from 0deg,
            transparent 0deg,
            rgba(0, 0, 0, 0.1) 10deg,
            transparent 20deg
          );
          animation: patternRotate 10s linear infinite;
        }

        .ring {
          position: absolute;
          inset: -2px;
          border: 2px solid rgba(255, 255, 255, 0.15);
          border-radius: 50%;
          transition: 0.5s;
        }

        .toggle:checked + .slider {
          background: linear-gradient(45deg, #16213e, #0f172a);
        }

        .toggle:checked + .slider .toggle-orb {
          transform: translateX(40px) rotate(360deg);
          background: linear-gradient(145deg, #4ecdc4, #45b7af);
        }

        .toggle:checked + .slider .inner-orb {
          background: linear-gradient(145deg, #45b7af, #3da89f);
          transform: scale(0.9);
        }

        .toggle:checked + .slider .ring {
          border-color: rgba(78, 205, 196, 0.4);
          animation: ringPulse 2s infinite;
        }

        .energy-line {
          position: absolute;
          width: 100%;
          height: 2px;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(78, 205, 196, 0.5),
            transparent
          );
          transform-origin: left;
          opacity: 0;
          transition: 0.5s;
        }

        .energy-line:nth-of-type(1) { top: 20%; transform: rotate(15deg); }
        .energy-line:nth-of-type(2) { top: 50%; transform: rotate(0deg); }
        .energy-line:nth-of-type(3) { top: 80%; transform: rotate(-15deg); }

        .toggle:checked + .slider .energy-line {
          opacity: 1;
          animation: energyFlow 2s linear infinite;
        }

        .particles {
          position: absolute;
          width: 100%;
          height: 100%;
        }

        .particle {
          position: absolute;
          width: 3px;
          height: 3px;
          background: #4ecdc4;
          border-radius: 50%;
          opacity: 0;
        }

        .toggle:checked + .slider .particle {
          animation: particleBurst 1s ease-out infinite;
        }

        .particle:nth-child(1) { left: 20%; animation-delay: 0s; }
        .particle:nth-child(2) { left: 40%; animation-delay: 0.2s; }
        .particle:nth-child(3) { left: 60%; animation-delay: 0.4s; }
        .particle:nth-child(4) { left: 80%; animation-delay: 0.6s; }
        .particle:nth-child(5) { left: 30%; animation-delay: 0.8s; }
        .particle:nth-child(6) { left: 70%; animation-delay: 1s; }

        @keyframes ringPulse {
          0%, 100% { transform: scale(1); opacity: 0.3; }
          50% { transform: scale(1.1); opacity: 0.6; }
        }

        @keyframes patternRotate {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @keyframes energyFlow {
          0% { transform: scaleX(0) translateX(0); opacity: 0; }
          50% { transform: scaleX(1) translateX(50%); opacity: 1; }
          100% { transform: scaleX(0) translateX(100%); opacity: 0; }
        }

        @keyframes particleBurst {
          0% { transform: translate(0, 0) scale(1); opacity: 1; }
          100% {
            transform: translate(
                calc(cos(var(--angle)) * 25px),
                calc(sin(var(--angle)) * 25px)
              )
              scale(0);
            opacity: 0;
          }
        }
      `}</style>
    </main>
  );
}