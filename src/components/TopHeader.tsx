import React, { useState, useRef, useEffect } from 'react';
import { Menu, Shield, LogOut } from 'lucide-react';
import { Screen } from '../types';

interface TopHeaderProps {
  title: string;
  onNavigate?: (screen: Screen | any) => void;
  rightElement?: React.ReactNode;
}

export default function TopHeader({ title, onNavigate, rightElement }: TopHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleAction = (screen: Screen | string) => {
    setMenuOpen(false);
    if (onNavigate) {
      onNavigate(screen);
    }
  };

  return (
    <div className="flex items-center justify-between mb-6 relative z-50">
      <div className="relative" ref={menuRef}>
        <button 
          onClick={() => setMenuOpen(!menuOpen)}
          className="text-gray-900 p-2 -ml-2 hover:bg-gray-100 rounded-lg transition-colors relative"
          aria-label="Open Navigation Menu"
        >
          <Menu className="w-6 h-6" strokeWidth={2.2} />
        </button>

        {menuOpen && (
          <div className="absolute top-full left-0 mt-2 w-52 bg-white border border-gray-100 rounded-2xl shadow-xl overflow-hidden animate-[fade-in_0.15s_ease-out] origin-top-left z-50">
            <div className="py-2">
              <div className="px-4 py-1.5 mb-1">
                <p className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Account</p>
              </div>
              <button 
                onClick={() => handleAction('profile')} 
                className="w-full flex items-center px-4 py-2.5 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Shield className="w-4 h-4 mr-3 text-[#B41A46]" />
                Emergency Medical Profile
              </button>
              <div className="border-t border-gray-100 my-1"></div>
              <button 
                onClick={() => handleAction('login')} 
                className="w-full flex items-center px-4 py-2.5 text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors"
              >
                <LogOut className="w-4 h-4 mr-3" />
                Log Out
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col items-center absolute left-1/2 -translate-x-1/2 pointer-events-auto">
        <h1 className="text-gray-900 font-semibold text-base tracking-tight leading-tight">{title}</h1>
      </div>
      
      <div className="w-10 flex justify-end">
        {rightElement}
      </div>
    </div>
  );
}
