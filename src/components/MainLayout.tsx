import React from 'react';
import { Home as HomeIcon, MapPin, MessageSquare, User } from 'lucide-react';
import { Tab } from '../types';

interface MainLayoutProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  children: React.ReactNode;
}

export default function MainLayout({ activeTab, onTabChange, children }: MainLayoutProps) {
  return (
    <div className="flex flex-col h-full bg-[#FAFAFA] dark:bg-neutral-950 font-sans overflow-hidden transition-colors">
      <div className="flex-1 overflow-y-auto">
        {children}
      </div>

      <div className="bg-white/90 dark:bg-neutral-900/90 backdrop-blur-2xl border-t border-gray-100/50 dark:border-neutral-800/80 flex justify-between items-center px-8 py-5 relative z-20 shadow-[0_-8px_30px_rgb(0,0,0,0.03)] dark:shadow-none">
        <button
          onClick={() => onTabChange('home')}
          className={`p-2 transition-all duration-300 ease-out ${activeTab === 'home' ? 'text-[#B41A46] dark:text-rose-400 scale-110' : 'text-gray-400 dark:text-neutral-500 hover:text-gray-600 dark:hover:text-neutral-300 hover:bg-gray-50 dark:hover:bg-neutral-800 rounded-xl'}`}
          aria-label="Home"
        >
          <HomeIcon className="w-6 h-6" fill={activeTab === 'home' ? 'currentColor' : 'none'} strokeWidth={activeTab === 'home' ? 1.5 : 2} />
        </button>
        <button
          onClick={() => onTabChange('mapTab')}
          className={`p-2 transition-all duration-300 ease-out ${activeTab === 'mapTab' ? 'text-[#B41A46] dark:text-rose-400 scale-110' : 'text-gray-400 dark:text-neutral-500 hover:text-gray-600 dark:hover:text-neutral-300 hover:bg-gray-50 dark:hover:bg-neutral-800 rounded-xl'}`}
          aria-label="Map"
        >
          <MapPin className="w-6 h-6" fill={activeTab === 'mapTab' ? 'currentColor' : 'none'} strokeWidth={activeTab === 'mapTab' ? 1.5 : 2} />
        </button>
        <button
          onClick={() => onTabChange('contacts')}
          className={`p-2 transition-all duration-300 ease-out ${activeTab === 'contacts' ? 'text-[#B41A46] dark:text-rose-400 scale-110' : 'text-gray-400 dark:text-neutral-500 hover:text-gray-600 dark:hover:text-neutral-300 hover:bg-gray-50 dark:hover:bg-neutral-800 rounded-xl'}`}
          aria-label="Contacts"
        >
          <MessageSquare className="w-6 h-6" fill={activeTab === 'contacts' ? 'currentColor' : 'none'} strokeWidth={activeTab === 'contacts' ? 1.5 : 2} />
        </button>
        <button
          onClick={() => onTabChange('profile')}
          className={`p-2 transition-all duration-300 ease-out ${activeTab === 'profile' ? 'text-[#B41A46] dark:text-rose-400 scale-110' : 'text-gray-400 dark:text-neutral-500 hover:text-gray-600 dark:hover:text-neutral-300 hover:bg-gray-50 dark:hover:bg-neutral-800 rounded-xl'}`}
          aria-label="Profile"
        >
          <User className="w-6 h-6" fill={activeTab === 'profile' ? 'currentColor' : 'none'} strokeWidth={activeTab === 'profile' ? 1.5 : 2} />
        </button>
      </div>
    </div>
  );
}
