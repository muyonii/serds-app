import React, { useState, useRef } from 'react';
import { Phone, Menu } from 'lucide-react';
import { Screen } from '../types';
import { useUserSettings } from '../lib/userSettings';
import { createEmergencyIncident } from '../lib/api';

interface HomeProps {
  onSOSClick: () => void;
  onChatClick: (message?: string) => void;
  onNavigate: (screen: Screen | any) => void;
}

export default function Home({ onSOSClick, onChatClick, onNavigate }: HomeProps) {
  const { settings } = useUserSettings();
  const { profile, location } = settings;

  const [isHolding, setIsHolding] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0); // 0 to 100
  const progressAnimRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  const cleanUpHold = () => {
    if (progressAnimRef.current) {
      cancelAnimationFrame(progressAnimRef.current);
      progressAnimRef.current = null;
    }
    startTimeRef.current = null;
    setHoldProgress(0);
    setIsHolding(false);
  };

  const startHold = (e: React.MouseEvent | React.TouchEvent) => {
    if ('button' in e && e.button !== 0) return;
    
    setIsHolding(true);
    startTimeRef.current = Date.now();

    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(40);
      } catch {}
    }

    const animateProgress = () => {
      if (!startTimeRef.current) return;
      const elapsed = Date.now() - startTimeRef.current;
      const pct = Math.min(100, (elapsed / 3000) * 100);
      setHoldProgress(pct);

      if (pct >= 100) {
        if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
          try {
            navigator.vibrate([100, 50, 150]);
          } catch {}
        }
        cleanUpHold();
        
        // Dispatch emergency report as specified in paper
        createEmergencyIncident({
          type: 'General SOS Alert',
          location: location.lastKnownAddress || 'Balanga City Center, Plaza Mayor',
          patientName: profile.fullName || 'Barry Allen',
          priority: 'critical',
          coords: location.lastKnownCoords ? [location.lastKnownCoords.lat, location.lastKnownCoords.lng] : [14.6780, 120.5390]
        });

        onSOSClick();
      } else {
        progressAnimRef.current = requestAnimationFrame(animateProgress);
      }
    };

    progressAnimRef.current = requestAnimationFrame(animateProgress);
  };

  const stopHold = () => {
    cleanUpHold();
  };

  const RING_RADIUS = 64;
  const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;
  const ringOffset = RING_CIRCUMFERENCE - (holdProgress / 100) * RING_CIRCUMFERENCE;

  return (
    <div className="flex flex-col h-full bg-[#FAFAFA] text-gray-900 px-6 pt-7 pb-4 font-sans select-none overflow-hidden">
      {/* Top Bar Header Matching Paper Page 22 */}
      <div className="flex items-center justify-between mb-3">
        <button 
          onClick={() => onNavigate('profile')}
          className="text-gray-800 p-1 -ml-1 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Navigation Menu"
        >
          <Menu className="w-6 h-6" strokeWidth={2.2} />
        </button>
        <span className="text-sm font-semibold text-gray-800">Home</span>
        <div className="w-6" />
      </div>

      {/* Sub-header User & Location Context (Page 22) */}
      <div className="flex justify-between items-start pt-1 pb-6 text-xs">
        <div>
          <p className="font-semibold text-gray-900 text-sm leading-tight">
            Hello, {profile.displayName || 'Barry'}
          </p>
          <button 
            onClick={() => onNavigate('profile')}
            className="text-gray-400 text-[11px] hover:text-[#B41A46] transition-colors"
          >
            Complete Your Profile
          </button>
        </div>

        <div className="text-right">
          <p className="font-semibold text-gray-900 text-sm leading-tight">
            Define Location
          </p>
          <p className="text-gray-400 text-[11px] truncate max-w-[140px]">
            {location.lastKnownAddress || 'What is your location'}
          </p>
        </div>
      </div>

      {/* Main Action Area (Page 22 UI Design 4) */}
      <div className="flex-1 flex flex-col items-center justify-center -mt-4">
        <h2 className="text-[28px] font-semibold text-gray-900 leading-tight text-center tracking-tight mb-2">
          Emergency Help<br />Needed?
        </h2>
        
        <p className="text-gray-400 text-xs tracking-wide mb-8">
          {isHolding ? 'Hold to confirm dispatch...' : 'Just hold the button to call'}
        </p>

        {/* Circular Press-and-Hold Button with Outer Soft Ring (Page 22) */}
        <div className="relative flex items-center justify-center w-64 h-64 select-none touch-none">
          {/* Outer Soft Pink Ring */}
          <div className={`absolute w-56 h-56 rounded-full bg-[#F9E8EC] transition-transform duration-300 ${isHolding ? 'scale-105' : ''}`} />

          {/* Progress SVG Ring */}
          <svg className="absolute w-44 h-44 -rotate-90 pointer-events-none z-20">
            <circle
              cx="88"
              cy="88"
              r={RING_RADIUS}
              fill="transparent"
              stroke="#B41A46"
              strokeWidth="4"
              strokeDasharray={RING_CIRCUMFERENCE}
              strokeDashoffset={ringOffset}
              strokeLinecap="round"
              className={isHolding ? 'transition-none' : 'transition-all duration-200'}
            />
          </svg>

          {/* Red Emergency Trigger Button */}
          <div
            onMouseDown={startHold}
            onMouseUp={stopHold}
            onMouseLeave={stopHold}
            onTouchStart={startHold}
            onTouchEnd={stopHold}
            onContextMenu={(e) => e.preventDefault()}
            className={`relative w-28 h-28 bg-[#B41A46] rounded-full flex items-center justify-center shadow-lg shadow-rose-900/20 z-30 cursor-pointer transition-transform duration-200 select-none ${
              isHolding ? 'scale-95' : 'hover:scale-105 active:scale-95'
            }`}
          >
            <Phone className="w-10 h-10 text-white fill-current" />
          </div>
        </div>

        {/* "Not Sure What To Do" Option Matching Paper Page 22 */}
        <div className="mt-8 text-center">
          <button
            type="button"
            onClick={() => onChatClick()}
            className="group flex flex-col items-center justify-center p-2 rounded-xl transition-all"
          >
            <span className="text-xs font-semibold text-gray-800 group-hover:text-[#B41A46] transition-colors">
              Not Sure What To Do
            </span>
            <span className="text-[11px] text-gray-400 group-hover:text-gray-600 transition-colors">
              Choose chat to...
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
