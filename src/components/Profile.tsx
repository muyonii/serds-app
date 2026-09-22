import React, { useState, useEffect } from 'react';
import TopHeader from './TopHeader';
import { Screen } from '../types';
import { useUserSettings, calculateProfileCompletion } from '../lib/userSettings';
import { User as UserIcon, ChevronRight, X, PhoneCall, Shield, HeartHandshake, Copy, Check } from 'lucide-react';

interface ProfileProps {
  onNavigate: (screen: Screen | any) => void;
}

export default function Profile({ onNavigate }: ProfileProps) {
  const { settings } = useUserSettings();
  const { profile, location, darkMode } = settings;
  const [showMedicalId, setShowMedicalId] = useState(false);
  const [copiedPass, setCopiedPass] = useState(false);

  // Safe data fallbacks to prevent undefined access crashes
  const allergies = Array.isArray(profile?.allergies) ? profile.allergies : [];
  const chronicConditions = Array.isArray(profile?.chronicConditions) 
    ? profile.chronicConditions 
    : (profile?.chronicConditions ? [String(profile.chronicConditions)] : ['None Reported']);
  const emergencyContact = profile?.emergencyContact || {
    name: 'Iris West',
    relation: 'Spouse / Primary Contact',
    phone: '+63 917 555 0192'
  };

  const completionPct = typeof profile?.profileCompletionPct === 'number' 
    ? profile.profileCompletionPct 
    : calculateProfileCompletion(profile || {});
  const isProfileComplete = completionPct >= 100;
  const strokeOffset = 138.23 * (1 - completionPct / 100);

  // Calculate age from birthdate
  const calculateAge = (birthdateStr?: string) => {
    if (!birthdateStr) return 27;
    try {
      const birth = new Date(birthdateStr);
      const now = new Date();
      let age = now.getFullYear() - birth.getFullYear();
      const m = now.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) {
        age--;
      }
      return isNaN(age) ? 27 : age;
    } catch {
      return 27;
    }
  };

  const age = calculateAge(profile?.birthdate);

  // Escape key closes medical pass
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowMedicalId(false);
    };
    if (showMedicalId) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showMedicalId]);

  // Copy plain-text medical ID summary to clipboard
  const handleCopyMedicalManifest = () => {
    const lines = [
      `Medical ID`,
      `Name: ${profile?.fullName || 'Barry Gurnmeister'} (Age: ${age}, DOB: ${profile?.birthdate || 'N/A'})`,
      `Blood Type: ${profile?.bloodType || 'Unknown'}`,
      `Height: ${profile?.heightCm || 182} cm | Weight: ${profile?.weightKg || 72} kg`,
      `Medical Conditions: ${chronicConditions.length > 0 ? chronicConditions.join(', ') : 'None reported'}`,
      `Allergies: ${allergies.length > 0 ? allergies.map(a => `${a.allergen}${a.reaction ? ` (${a.reaction})` : ''}`).join(', ') : 'No known allergies'}`,
      `Emergency Contact: ${emergencyContact.name} (${emergencyContact.relation}) - ${emergencyContact.phone}`
    ];
    navigator.clipboard?.writeText(lines.join('\n'));
    setCopiedPass(true);
    setTimeout(() => setCopiedPass(false), 2500);
  };

  return (
    <div className={`flex flex-col h-full ${darkMode ? 'bg-neutral-950 text-neutral-100' : 'bg-[#FAFAFA] text-gray-900'} px-6 py-8 overflow-y-auto transition-colors`}>
      {/* Top Header */}
      <TopHeader title="Profile" onNavigate={onNavigate} />

      {/* Info Section */}
      <div className={`flex justify-between items-center mb-8 ${darkMode ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-gray-50'} p-5 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.03)] border`}>
        <div>
          <p className="text-gray-400 text-[10px] uppercase font-bold tracking-wider mb-1">Welcome Back</p>
          <p className="font-semibold text-lg leading-none">{profile.displayName || 'Barry'}</p>
        </div>
        <div className="text-right">
          <p className="text-gray-400 text-[10px] uppercase font-bold tracking-wider mb-1">Current Location</p>
          <p className="font-semibold text-sm leading-none truncate max-w-[150px]">
            {location.servicesEnabled ? (location.lastKnownAddress || 'Balanga City') : 'Location Paused'}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-medium text-gray-800 dark:text-neutral-200">Emergency Help Record</h2>
        <button
          onClick={() => setShowMedicalId(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 hover:border-neutral-300 dark:hover:border-neutral-700 text-xs font-medium transition-all shadow-2xs"
        >
          <Shield className="w-3.5 h-3.5 text-[#B41A46] dark:text-rose-400" />
          <span>Medical ID</span>
        </button>
      </div>

      {/* Profile Card */}
      <div 
        onClick={() => setShowMedicalId(true)}
        className={`${darkMode ? 'bg-neutral-900 border-neutral-800 hover:border-neutral-700' : 'bg-white border-gray-100'} p-5 rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.04)] border flex items-center justify-between mb-6 group cursor-pointer hover:shadow-[0_8px_20px_rgb(0,0,0,0.08)] transition-all`}
      >
        <div className="flex items-center">
          <div className="w-14 h-14 bg-[#F9E8EC] dark:bg-rose-950/50 rounded-2xl flex items-center justify-center mr-4 shrink-0 group-hover:scale-105 transition-transform">
            <UserIcon className="w-7 h-7 text-[#B41A46] dark:text-rose-400" />
          </div>
          <div>
            <h3 className="font-semibold text-[15px]">{profile.fullName}</h3>
            <p className="text-gray-500 dark:text-neutral-400 text-xs mt-0.5 font-medium tracking-wide">
              {profile.birthdate} • {profile.city}
            </p>
          </div>
        </div>
        {!isProfileComplete ? (
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 rounded-full border-[3px] border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 text-xs font-bold relative font-mono">
              {completionPct}%
              <svg className="absolute inset-[-3px] w-[calc(100%+6px)] h-[calc(100%+6px)] -rotate-90">
                <circle 
                  cx="50%" 
                  cy="50%" 
                  r="22" 
                  fill="transparent" 
                  stroke="#10b981" 
                  strokeWidth="3" 
                  strokeDasharray="138.23" 
                  strokeDashoffset={strokeOffset} 
                  strokeLinecap="round"
                ></circle>
              </svg>
            </div>
            <p className="text-[10px] text-gray-400 dark:text-neutral-500 mt-1.5 uppercase font-bold tracking-wider">Profile Data</p>
          </div>
        ) : (
          <div className="flex items-center text-gray-300 dark:text-neutral-600 group-hover:text-[#B41A46] dark:group-hover:text-rose-400 transition-colors">
            <ChevronRight className="w-5 h-5" />
          </div>
        )}
      </div>

      {/* Grid Stats */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className={`${darkMode ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-gray-100'} p-5 rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.04)] border relative hover:border-[#B41A46]/30 transition-all cursor-default`}>
          <p className="text-gray-400 text-[11px] uppercase font-bold tracking-wider mb-2">Age</p>
          <p className="font-semibold"><span className="text-2xl">{age}</span> <span className="text-xs font-medium text-gray-500 ml-0.5">years</span></p>
        </div>
        <div className={`${darkMode ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-gray-100'} p-5 rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.04)] border relative hover:border-[#B41A46]/30 transition-all cursor-default`}>
          <p className="text-gray-400 text-[11px] uppercase font-bold tracking-wider mb-2">Blood Type</p>
          <p className="font-bold text-2xl font-mono text-[#B41A46] dark:text-rose-400">{profile.bloodType}</p>
        </div>
        <div className={`${darkMode ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-gray-100'} p-5 rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.04)] border relative hover:border-[#B41A46]/30 transition-all cursor-default`}>
          <p className="text-gray-400 text-[11px] uppercase font-bold tracking-wider mb-2">Height</p>
          <p className="font-semibold"><span className="text-2xl font-mono">{profile.heightCm}</span> <span className="text-xs font-medium text-gray-500 ml-0.5">cm</span></p>
        </div>
        <div className={`${darkMode ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-gray-100'} p-5 rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.04)] border relative hover:border-[#B41A46]/30 transition-all cursor-default`}>
          <p className="text-gray-400 text-[11px] uppercase font-bold tracking-wider mb-2">Weight</p>
          <p className="font-semibold"><span className="text-2xl font-mono">{profile.weightKg}</span> <span className="text-xs font-medium text-gray-500 ml-0.5">kg</span></p>
        </div>
      </div>

      {/* Allergies & Reactions */}
      <div className={`${darkMode ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-gray-100'} p-6 rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.04)] border mb-6`}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold text-[15px]">Allergies & Reactions</h3>
          <button 
            onClick={() => setShowMedicalId(true)} 
            className="text-[11px] font-semibold text-[#B41A46] dark:text-rose-400 hover:underline"
          >
            View Details &rarr;
          </button>
        </div>
        
        <div className="space-y-3">
          {allergies.length === 0 ? (
            <p className="text-xs text-gray-400 italic">No allergies registered.</p>
          ) : (
            allergies.map(item => (
              <div key={item.id} className="flex items-center justify-between">
                <span className="font-medium text-sm">{item.allergen}</span>
                <span className={`text-xs font-medium px-2 py-1 rounded-md ${
                  item.severity === 'Severe'
                    ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 font-semibold'
                    : darkMode ? 'bg-neutral-800 text-neutral-300' : 'bg-gray-50 text-gray-600'
                }`}>
                  {item.reaction}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Primary Emergency Contact */}
      <div className={`${darkMode ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-gray-100'} p-5 rounded-2xl border shadow-2xs`}>
        <p className="text-gray-400 text-[10px] uppercase font-bold tracking-wider mb-2">Emergency Contact</p>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold text-sm">{emergencyContact.name}</p>
            <p className="text-xs text-gray-500 dark:text-neutral-400">{emergencyContact.relation}</p>
          </div>
          <a 
            href={`tel:${emergencyContact.phone}`}
            className="font-mono text-xs font-semibold text-[#B41A46] dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 px-3 py-1.5 rounded-lg hover:underline"
          >
            {emergencyContact.phone}
          </a>
        </div>
      </div>

      {/* Minimalist Emergency Medical ID Sheet */}
      {showMedicalId && (
        <div 
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowMedicalId(false);
          }}
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
        >
          <div className="bg-white dark:bg-neutral-900 w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-xl border border-neutral-200/80 dark:border-neutral-800 overflow-hidden flex flex-col max-h-[85vh] animate-[fade-in_0.15s_ease-out]">
            
            {/* Clean Header */}
            <div className="px-6 pt-5 pb-4 flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800">
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-[#B41A46]"></span>
                <h3 className="font-semibold text-sm tracking-tight text-neutral-900 dark:text-neutral-100">Medical ID</h3>
              </div>
              <button
                onClick={() => setShowMedicalId(false)}
                className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 p-1.5 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                aria-label="Close medical ID"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Medical Content: Flat, typography-driven layout */}
            <div className="px-6 py-5 space-y-4 overflow-y-auto">
              {/* Primary Identity & Blood Group */}
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-lg font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
                    {profile?.fullName || 'Barry Gurnmeister'}
                  </h4>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                    {profile?.birthdate ? `Born ${profile.birthdate} • ${age} years` : `${age} years`}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[11px] font-medium text-neutral-400 dark:text-neutral-500 block mb-0.5">Blood Type</span>
                  <span className="inline-block font-mono font-semibold text-sm text-[#9c1537] dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-2.5 py-0.5 rounded border border-rose-200/70 dark:border-rose-900/50">
                    {profile?.bloodType || 'O Rh-'}
                  </span>
                </div>
              </div>

              {/* Physical Metrics */}
              <div className="pt-3.5 border-t border-neutral-100 dark:border-neutral-800 flex items-center space-x-8 text-xs">
                <div>
                  <span className="text-neutral-400 dark:text-neutral-500 block text-[11px] mb-0.5">Height</span>
                  <span className="font-semibold text-neutral-900 dark:text-neutral-100 text-sm">{profile?.heightCm || 182} cm</span>
                </div>
                <div>
                  <span className="text-neutral-400 dark:text-neutral-500 block text-[11px] mb-0.5">Weight</span>
                  <span className="font-semibold text-neutral-900 dark:text-neutral-100 text-sm">{profile?.weightKg || 72} kg</span>
                </div>
              </div>

              {/* Medical Conditions */}
              <div className="pt-3.5 border-t border-neutral-100 dark:border-neutral-800">
                <span className="text-[11px] font-medium text-neutral-400 dark:text-neutral-500 block mb-1">
                  Medical Conditions
                </span>
                <p className="text-xs text-neutral-900 dark:text-neutral-100 font-medium leading-relaxed">
                  {chronicConditions.length > 0 ? chronicConditions.join(', ') : 'None reported'}
                </p>
              </div>

              {/* Allergies & Reactions */}
              <div className="pt-3.5 border-t border-neutral-100 dark:border-neutral-800">
                <span className="text-[11px] font-medium text-neutral-400 dark:text-neutral-500 block mb-1">
                  Allergies & Reactions
                </span>
                {allergies.length > 0 ? (
                  <div className="space-y-1.5">
                    {allergies.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs">
                        <span className="text-neutral-900 dark:text-neutral-100 font-medium">{item.allergen}</span>
                        <span className="text-neutral-500 dark:text-neutral-400 text-[11px]">
                          {item.reaction || 'Allergic reaction'} {item.severity ? `• ${item.severity}` : ''}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-neutral-900 dark:text-neutral-100 font-medium">
                    No known allergies
                  </p>
                )}
              </div>

              {/* Emergency Contact */}
              <div className="pt-3.5 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-medium text-neutral-400 dark:text-neutral-500 block">
                    Emergency Contact
                  </span>
                  <p className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 mt-0.5">
                    {emergencyContact.name}
                  </p>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                    {emergencyContact.relation}
                  </p>
                </div>
                <a
                  href={`tel:${emergencyContact.phone}`}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 text-xs font-medium hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors shadow-2xs"
                >
                  <PhoneCall className="w-3.5 h-3.5 text-[#B41A46] dark:text-rose-400" />
                  <span>Call</span>
                </a>
              </div>
            </div>

            {/* Clean Action Footer */}
            <div className="px-6 py-3.5 bg-neutral-50/70 dark:bg-neutral-900/70 border-t border-neutral-100 dark:border-neutral-800 flex items-center gap-2.5">
              <button
                type="button"
                onClick={handleCopyMedicalManifest}
                className="flex-1 flex items-center justify-center space-x-1.5 py-2 px-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 text-xs font-medium hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors shadow-2xs"
              >
                {copiedPass ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-emerald-600 dark:text-emerald-400">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-neutral-400" />
                    <span>Copy Details</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setShowMedicalId(false)}
                className="flex-1 py-2 px-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-100 dark:hover:bg-white text-white dark:text-neutral-900 text-xs font-medium transition-colors shadow-2xs"
              >
                Done
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
