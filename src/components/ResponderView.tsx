import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Navigation, 
  MapPin, 
  Phone, 
  AlertTriangle, 
  Check, 
  Clock, 
  Radio, 
  Heart,
  ChevronRight
} from 'lucide-react';

interface ResponderViewProps {
  onBack: () => void;
}

type ResponderStatus = 'en_route' | 'on_scene' | 'transporting' | 'available';

export default function ResponderView({ onBack }: ResponderViewProps) {
  const [status, setStatus] = useState<ResponderStatus>('en_route');
  const [fieldNote, setFieldNote] = useState('');
  const [notesLog, setNotesLog] = useState<string[]>([
    '23:59: Paramedic unit en route via Capitol Blvd (Dijkstra path).'
  ]);

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fieldNote.trim()) return;
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setNotesLog(prev => [...prev, `${timeStr}: ${fieldNote.trim()}`]);
    setFieldNote('');
  };

  return (
    <div className="flex flex-col h-full bg-neutral-100 text-neutral-900 font-sans select-none">
      {/* Tactical Status Header */}
      <div className="bg-white border-b border-neutral-200 px-4 py-3 shrink-0 flex items-center justify-between z-20">
        <div className="flex items-center space-x-3">
          <button 
            onClick={onBack}
            className="p-1.5 -ml-1 text-neutral-500 hover:text-neutral-900 rounded-md transition-colors"
            title="Back to portal"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="font-semibold text-sm text-neutral-950">UNIT 4</span>
              <span className="text-neutral-300">•</span>
              <span className="text-xs font-mono text-neutral-500">PARAMEDIC</span>
            </div>
            <p className="text-[10px] font-mono text-neutral-400">GPS FIX: ±1.2M • SECTOR 01</p>
          </div>
        </div>

        {/* Operational Status Pill */}
        <div className="flex items-center space-x-1 font-mono text-[10px] uppercase font-semibold">
          <span className={`inline-flex items-center px-2 py-1 rounded-md ${
            status === 'available' 
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : status === 'en_route'
              ? 'bg-amber-50 text-amber-700 border border-amber-200'
              : status === 'on_scene'
              ? 'bg-rose-50 text-rose-700 border border-rose-200'
              : 'bg-neutral-900 text-white'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
              status === 'available' ? 'bg-emerald-500' : status === 'en_route' ? 'bg-amber-500' : 'bg-rose-500'
            }`}></span>
            {status.replace('_', ' ')}
          </span>
        </div>
      </div>

      {/* Main Field Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {status !== 'available' ? (
          <>
            {/* Active Dispatch Card */}
            <div className="bg-white border border-neutral-200 rounded-xl p-4 shadow-2xs">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-[11px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded">
                    CODE RED
                  </span>
                  <span className="font-mono text-xs text-neutral-500">CAD-1042</span>
                </div>
                <div className="text-right font-mono text-xs text-neutral-500">
                  <span className="flex items-center justify-end">
                    <Clock className="w-3 h-3 mr-1 text-neutral-400" />
                    <span>3.5m ETA</span>
                  </span>
                </div>
              </div>

              <div className="mt-3">
                <h2 className="text-base font-semibold text-neutral-900 leading-snug">
                  Acute Dyspnea / Severe Chest Tightness
                </h2>
                <p className="text-xs text-neutral-600 mt-1 flex items-start">
                  <MapPin className="w-3.5 h-3.5 mr-1 text-neutral-400 shrink-0 mt-0.5" />
                  <span>142 Rizal Street, Brgy. Poblacion, Balanga City</span>
                </p>
              </div>

              {/* Dijkstra Routing Metric Bar */}
              <div className="mt-3.5 p-2.5 bg-neutral-50 border border-neutral-200 rounded-lg flex items-center justify-between text-xs font-mono">
                <div>
                  <span className="text-[10px] text-neutral-400 block uppercase">Routing Computation</span>
                  <span className="text-neutral-800 font-medium">1.18 km via Capitol Blvd</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-neutral-400 block uppercase">Algorithm</span>
                  <span className="text-emerald-700 font-medium">Dijkstra Optimal</span>
                </div>
              </div>

              <button
                onClick={() => alert("Launching turn-by-turn routing along Dijkstra path...")}
                className="mt-3 w-full flex items-center justify-center space-x-2 bg-neutral-900 hover:bg-neutral-800 text-white py-2.5 px-4 rounded-lg text-xs font-medium transition-colors"
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>Open Navigation Turn-by-Turn</span>
              </button>
            </div>

            {/* Critical Patient Triage Manifest */}
            <div className="bg-white border border-neutral-200 rounded-xl p-4 shadow-2xs space-y-3">
              <div className="flex items-center justify-between pb-2.5 border-b border-neutral-100">
                <span className="text-[11px] font-mono uppercase font-semibold text-neutral-500">
                  Citizen Medical Manifest
                </span>
                <span className="text-[11px] font-mono text-emerald-600">ID VERIFIED</span>
              </div>

              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-neutral-900">Barry Allen</h3>
                  <p className="text-xs text-neutral-500">34 y/o Male • Citizen ID #8410</p>
                </div>
                
                {/* Blood Type Stark Badge */}
                <div className="px-2 py-1 bg-neutral-900 text-white rounded font-mono text-xs font-semibold">
                  O Rh-
                </div>
              </div>

              {/* Severe Allergy Warning Strip */}
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg flex items-start space-x-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <p className="font-semibold text-rose-900">CRITICAL ALLERGY: PENICILLIN</p>
                  <p className="text-rose-700 text-[11px]">Severe anaphylactic reaction reported in medical record.</p>
                </div>
              </div>

              {/* Emergency Contact Quick Dial */}
              <div className="pt-1 flex items-center justify-between text-xs">
                <span className="text-neutral-500">Emergency Contact:</span>
                <a 
                  href="tel:+639175550192" 
                  className="font-mono text-neutral-900 font-semibold flex items-center hover:underline"
                >
                  <Phone className="w-3 h-3 mr-1 text-neutral-400" />
                  Iris West (+63 917 555 0192)
                </a>
              </div>
            </div>

            {/* Field Activity Log */}
            <div className="bg-white border border-neutral-200 rounded-xl p-4 shadow-2xs">
              <span className="text-[11px] font-mono uppercase font-semibold text-neutral-500 block mb-2">
                Field Vitals & Dispatch Notes
              </span>

              <div className="space-y-1.5 max-h-24 overflow-y-auto text-xs font-mono text-neutral-600 divide-y divide-neutral-50">
                {notesLog.map((entry, idx) => (
                  <div key={idx} className="pt-1 first:pt-0">
                    {entry}
                  </div>
                ))}
              </div>

              <form onSubmit={handleAddNote} className="mt-3 flex items-center space-x-2">
                <input
                  type="text"
                  value={fieldNote}
                  onChange={(e) => setFieldNote(e.target.value)}
                  placeholder="Record vital (e.g., HR: 88, SpO2: 98%)..."
                  className="flex-1 px-3 py-1.5 bg-neutral-50 border border-neutral-200 rounded-lg text-xs text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:bg-white"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-lg text-xs font-medium transition-colors"
                >
                  Log
                </button>
              </form>
            </div>
          </>
        ) : (
          /* Available / Standby Screen */
          <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
            <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
              <Check className="w-5 h-5" />
            </div>

            <div>
              <h2 className="text-base font-semibold text-neutral-900">Unit 4 On Standby</h2>
              <p className="text-xs text-neutral-500 mt-1 max-w-xs">
                Stationed at Balanga Central Sector. Telemetry heartbeat transmitting to CAD Dispatcher every 1.0s.
              </p>
            </div>

            <div className="w-full max-w-xs bg-white border border-neutral-200 rounded-xl p-3 text-left font-mono text-xs space-y-1 text-neutral-600">
              <div className="flex justify-between">
                <span>LAT / LON:</span>
                <span className="text-neutral-900">14.6760° N, 120.5375° E</span>
              </div>
              <div className="flex justify-between">
                <span>BATTERY:</span>
                <span className="text-neutral-900">88% (Vehicle Tethered)</span>
              </div>
              <div className="flex justify-between">
                <span>SIGNALING:</span>
                <span className="text-emerald-600 font-semibold">WebRTC Ready</span>
              </div>
            </div>

            <button
              onClick={() => setStatus('en_route')}
              className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-xs font-medium transition-colors"
            >
              Simulate Incoming Dispatch Alert
            </button>
          </div>
        )}
      </div>

      {/* Persistent Field Action Bar */}
      {status !== 'available' && (
        <div className="p-3.5 bg-white border-t border-neutral-200 shrink-0 z-20 space-y-2">
          {status === 'en_route' && (
            <button
              onClick={() => {
                setStatus('on_scene');
                setNotesLog(prev => [...prev, `${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}: Unit arrived on scene at Rizal St.`]);
              }}
              className="w-full bg-amber-600 hover:bg-amber-700 text-white font-medium py-3 px-4 rounded-xl text-xs tracking-wide transition-colors flex items-center justify-center space-x-2"
            >
              <Check className="w-4 h-4" />
              <span>MARK ARRIVED ON SCENE</span>
            </button>
          )}

          {status === 'on_scene' && (
            <button
              onClick={() => {
                setStatus('transporting');
                setNotesLog(prev => [...prev, `${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}: Patient secured. Commencing transport to Bataan General Hospital.`]);
              }}
              className="w-full bg-neutral-900 hover:bg-neutral-800 text-white font-medium py-3 px-4 rounded-xl text-xs tracking-wide transition-colors flex items-center justify-center space-x-2"
            >
              <Heart className="w-4 h-4" />
              <span>PATIENT STABILIZED • COMMENCE TRANSPORT</span>
            </button>
          )}

          {status === 'transporting' && (
            <button
              onClick={() => {
                setStatus('available');
                setNotesLog(prev => [...prev, `${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}: Handover complete. Unit 4 cleared and returning to standby.`]);
              }}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-3 px-4 rounded-xl text-xs tracking-wide transition-colors flex items-center justify-center space-x-2"
            >
              <Check className="w-4 h-4" />
              <span>COMPLETE HANDOVER & CLEAR UNIT</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
