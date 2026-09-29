import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, 
  MapPin, 
  Phone, 
  AlertTriangle, 
  Check, 
  Play, 
  Pause, 
  RotateCcw, 
  Shield, 
  CornerUpRight, 
  ChevronRight, 
  Heart 
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { 
  calculateRealRoute, 
  formatDistance, 
  formatEta, 
  getPositionAlongRoute, 
  RouteResult 
} from '../lib/routing';

interface ResponderViewProps {
  onBack: () => void;
}

type ResponderMode = 'offline' | 'waiting' | 'incoming' | 'en_route' | 'on_scene' | 'transporting';

// Responder unit base location: Unit 4 (Central Station, Balanga City)
const RESPONDER_BASE: [number, number] = [14.6735, 120.5340];
// Incident location: 142 Rizal St
const INCIDENT_COORDS: [number, number] = [14.6788, 120.5412];
// Hospital location: BGHMC Medical Center
const HOSPITAL_COORDS: [number, number] = [14.6850, 120.5410];

// Custom Leaflet Markers
const responderVehicleIcon = L.divIcon({
  html: `
    <div class="relative flex items-center justify-center select-none">
      <span class="absolute inline-flex h-10 w-10 animate-ping rounded-full bg-neutral-900 opacity-20"></span>
      <div class="relative w-9 h-9 bg-neutral-950 text-white rounded-full flex items-center justify-center shadow-2xl border-2 border-white text-sm font-bold">
        🚑
      </div>
    </div>
  `,
  className: '',
  iconSize: [36, 36],
  iconAnchor: [18, 18]
});

const incidentMarkerIcon = L.divIcon({
  html: `
    <div class="flex flex-col items-center justify-end h-full select-none pointer-events-none">
      <div class="bg-rose-600 text-white px-2 py-0.5 rounded shadow-md text-[10px] font-bold tracking-wider uppercase mb-1 flex items-center gap-1 border border-white">
        <span class="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
        <span>Patient</span>
      </div>
      <div class="w-3.5 h-3.5 bg-rose-600 rounded-full shadow-md border-2 border-white"></div>
    </div>
  `,
  className: '',
  iconSize: [80, 46],
  iconAnchor: [40, 46]
});

const hospitalMarkerIcon = L.divIcon({
  html: `
    <div class="flex flex-col items-center justify-end h-full select-none pointer-events-none">
      <div class="bg-blue-600 text-white px-2 py-0.5 rounded shadow-md text-[10px] font-bold tracking-wider uppercase mb-1 border border-white">
        BGHMC
      </div>
      <div class="w-3.5 h-3.5 bg-blue-600 rounded-full shadow-md border-2 border-white"></div>
    </div>
  `,
  className: '',
  iconSize: [80, 46],
  iconAnchor: [40, 46]
});

// Map View Controller to center on target coordinates
function MapAutoCenter({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.panTo(center, { animate: true, duration: 0.8 });
  }, [center, map]);
  return null;
}

// Play sound chime for incoming emergency call alert
function playAlertTone() {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime);
    osc.frequency.setValueAtTime(880, ctx.currentTime + 0.12);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.35);
  } catch {}
}

export default function ResponderView({ onBack }: ResponderViewProps) {
  // Mode: offline | waiting | incoming | en_route | on_scene | transporting
  const [mode, setMode] = useState<ResponderMode>('waiting');
  const [countdown, setCountdown] = useState<number>(15);
  
  // Navigation & Route states
  const [routeResult, setRouteResult] = useState<RouteResult | null>(null);
  const [routePoints, setRoutePoints] = useState<[number, number][]>([]);
  const [isSimulating, setIsSimulating] = useState(false);
  const [transitProgress, setTransitProgress] = useState(0); // 0 to 1
  const animFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);

  // Auto countdown for incoming call
  useEffect(() => {
    if (mode !== 'incoming') return;
    
    playAlertTone();
    setCountdown(15);
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setMode('waiting'); // missed/declined call
          return 15;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [mode]);

  // Compute road routes via Dijkstra when entering en_route or transporting
  useEffect(() => {
    if (mode === 'en_route') {
      calculateRealRoute(RESPONDER_BASE, INCIDENT_COORDS)
        .then((res) => {
          setRouteResult(res);
          setRoutePoints(res.coordinates);
          setTransitProgress(0);
          setIsSimulating(true); // auto-simulate movement towards patient
        })
        .catch(() => {});
    } else if (mode === 'transporting') {
      calculateRealRoute(INCIDENT_COORDS, HOSPITAL_COORDS)
        .then((res) => {
          setRouteResult(res);
          setRoutePoints(res.coordinates);
          setTransitProgress(0);
          setIsSimulating(true);
        })
        .catch(() => {});
    } else if (mode === 'waiting' || mode === 'offline') {
      setRouteResult(null);
      setRoutePoints([]);
      setIsSimulating(false);
      setTransitProgress(0);
    }
  }, [mode]);

  // Live animation loop along route polyline
  useEffect(() => {
    if (!isSimulating || routePoints.length < 2) {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      return;
    }

    const durationMs = 14000;
    lastTimeRef.current = performance.now();

    const step = (now: number) => {
      const delta = now - lastTimeRef.current;
      lastTimeRef.current = now;

      setTransitProgress((prev) => {
        const next = prev + delta / durationMs;
        if (next >= 1) {
          setIsSimulating(false);
          return 1;
        }
        return next;
      });

      animFrameRef.current = requestAnimationFrame(step);
    };

    animFrameRef.current = requestAnimationFrame(step);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isSimulating, routePoints]);

  const handleAcceptCall = () => {
    setMode('en_route');
  };

  const handleDeclineCall = () => {
    setMode('waiting');
  };

  // Determine active responder vehicle position
  const currentVehicleCoords = routePoints.length > 0 && transitProgress > 0
    ? getPositionAlongRoute(routePoints, transitProgress)
    : (mode === 'transporting' ? INCIDENT_COORDS : RESPONDER_BASE);

  // Active map center
  const mapCenter = mode === 'en_route' 
    ? INCIDENT_COORDS 
    : (mode === 'transporting' ? HOSPITAL_COORDS : RESPONDER_BASE);

  return (
    <div className="relative w-full h-[100dvh] bg-neutral-900 text-neutral-900 font-sans overflow-hidden select-none">
      {/* Fullscreen Map Canvas */}
      <div className="absolute inset-0 z-0">
        <MapContainer
          center={RESPONDER_BASE}
          zoom={15}
          zoomControl={false}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <MapAutoCenter center={mapCenter} />

          {/* Responder Vehicle Marker */}
          <Marker position={currentVehicleCoords} icon={responderVehicleIcon} zIndexOffset={1000} />

          {/* Incident Site Marker */}
          {(mode === 'incoming' || mode === 'en_route' || mode === 'on_scene') && (
            <Marker position={INCIDENT_COORDS} icon={incidentMarkerIcon} />
          )}

          {/* Hospital Marker */}
          {mode === 'transporting' && (
            <Marker position={HOSPITAL_COORDS} icon={hospitalMarkerIcon} />
          )}

          {/* Dijkstra Route Polyline */}
          {routePoints.length > 0 && (
            <Polyline
              positions={routePoints}
              color="#0f172a"
              weight={6}
              opacity={0.9}
              lineCap="round"
              lineJoin="round"
            />
          )}

          {/* Traveled portion overlay */}
          {transitProgress > 0 && routePoints.length > 0 && (
            <Polyline
              positions={routePoints.slice(0, Math.max(1, Math.floor(transitProgress * (routePoints.length - 1)) + 1))}
              color="#B41A46"
              weight={6}
              opacity={0.8}
            />
          )}
        </MapContainer>
      </div>

      {/* Top Floating Header with Back Button */}
      <div className="absolute top-4 left-4 z-20 pointer-events-none">
        <button
          onClick={onBack}
          className="pointer-events-auto w-10 h-10 bg-white/95 backdrop-blur-md rounded-full shadow-lg border border-neutral-200 flex items-center justify-center text-neutral-800 hover:bg-white active:scale-95 transition-all"
          aria-label="Back to portal"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
      </div>

      {/* Mode: EN ROUTE - Top Turn-by-Turn Navigation Banner (Uber Navigation HUD) */}
      {(mode === 'en_route' || mode === 'transporting') && (
        <div className="absolute top-16 left-4 right-4 z-20 bg-neutral-950 text-white rounded-2xl p-3.5 shadow-2xl border border-neutral-800 animate-[fade-in_0.2s_ease-out]">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
                <CornerUpRight className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-neutral-400 font-mono uppercase tracking-wider">
                  {mode === 'transporting' ? 'Transport to BGHMC' : 'In 200m turn right'}
                </p>
                <h3 className="text-sm font-bold text-white tracking-tight leading-snug">
                  {mode === 'transporting' ? 'Gov. J.J. Linao Rd towards BGHMC' : 'Capitol Blvd toward Rizal St'}
                </h3>
              </div>
            </div>

            <div className="text-right">
              <span className="block text-sm font-extrabold text-emerald-400 font-mono">
                {transitProgress >= 1 ? 'Arrived' : (routeResult ? formatEta(Math.round(routeResult.durationSeconds * (1 - transitProgress))) : '3 min')}
              </span>
              <span className="block text-[10px] text-neutral-400 font-mono">
                {routeResult ? formatDistance(Math.round(routeResult.distanceMeters * (1 - transitProgress))) : '1.2 km'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Floating Simulation Control for Demo / Testing */}
      {(mode === 'en_route' || mode === 'transporting') && routePoints.length > 1 && (
        <div className="absolute top-36 right-4 z-20 bg-white/90 backdrop-blur-md px-2.5 py-1.5 rounded-xl border border-neutral-200 shadow-md flex items-center space-x-2 text-xs">
          <button
            onClick={() => {
              if (transitProgress >= 1) setTransitProgress(0);
              setIsSimulating(!isSimulating);
            }}
            className="flex items-center space-x-1 font-semibold text-neutral-800 hover:text-[#B41A46]"
          >
            {isSimulating ? (
              <>
                <Pause className="w-3.5 h-3.5 text-[#B41A46]" />
                <span className="text-[11px]">Pause</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 text-emerald-600 fill-emerald-600" />
                <span className="text-[11px]">{transitProgress > 0 && transitProgress < 1 ? 'Resume' : 'Drive'}</span>
              </>
            )}
          </button>
          {transitProgress > 0 && (
            <button
              onClick={() => {
                setIsSimulating(false);
                setTransitProgress(0);
              }}
              className="p-1 text-neutral-400 hover:text-neutral-700"
              title="Reset Position"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* 1. BOTTOM SHEET: WAITING FOR A CALL (Responder Standby)   */}
      {/* ========================================================= */}
      {mode === 'waiting' && (
        <div className="absolute bottom-0 left-0 right-0 z-30 bg-white rounded-t-3xl shadow-[0_-8px_30px_rgba(0,0,0,0.2)] p-5 border-t border-neutral-100 animate-[fade-in_0.2s_ease-out]">
          <div className="w-10 h-1 bg-neutral-200 rounded-full mx-auto mb-4" />

          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                <h2 className="text-lg font-bold text-neutral-900 tracking-tight">On Standby</h2>
              </div>
              <p className="text-xs text-neutral-500 mt-0.5">
                Monitoring emergency dispatch CAD across Balanga City...
              </p>
            </div>

            <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs border border-emerald-200">
              <Shield className="w-5 h-5" />
            </div>
          </div>

          {/* Actions: Simulate Emergency Call Trigger + Go Offline */}
          <div className="space-y-2">
            <button
              onClick={() => setMode('incoming')}
              className="w-full py-3.5 bg-neutral-950 hover:bg-neutral-800 text-white rounded-2xl font-bold text-xs tracking-wider uppercase shadow-md active:scale-[0.99] transition-all flex items-center justify-center gap-2"
            >
              <span>Simulate Incoming Emergency Call</span>
              <ChevronRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => setMode('offline')}
              className="w-full py-2.5 text-neutral-500 hover:text-neutral-800 text-xs font-semibold text-center transition-colors"
            >
              Go Offline
            </button>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. BOTTOM SHEET: OFFLINE                                  */}
      {/* ========================================================= */}
      {mode === 'offline' && (
        <div className="absolute bottom-0 left-0 right-0 z-30 bg-white rounded-t-3xl shadow-2xl p-6 border-t border-neutral-100 text-center">
          <div className="w-10 h-1 bg-neutral-200 rounded-full mx-auto mb-4" />
          <h2 className="text-lg font-bold text-neutral-900">Unit Offline</h2>
          <p className="text-xs text-neutral-500 mt-1 max-w-xs mx-auto">
            You will not receive CAD emergency dispatch alerts or route assignments.
          </p>

          <button
            onClick={() => setMode('waiting')}
            className="w-full mt-5 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-xs tracking-wider uppercase shadow-lg active:scale-[0.99] transition-all"
          >
            GO ON STANDBY
          </button>
        </div>
      )}

      {/* ========================================================= */}
      {/* 3. BOTTOM SHEET: GETTING A CALL (Emergency Dispatch Alert) */}
      {/* ========================================================= */}
      {mode === 'incoming' && (
        <div className="absolute bottom-0 left-0 right-0 z-40 bg-neutral-950 text-white rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.6)] p-5 border-t border-neutral-800 animate-[fade-in_0.2s_ease-out]">
          {/* Countdown Bar */}
          <div className="w-full bg-neutral-800 h-1.5 rounded-full overflow-hidden mb-4">
            <div 
              className="bg-[#B41A46] h-full transition-all duration-1000 ease-linear"
              style={{ width: `${(countdown / 15) * 100}%` }}
            />
          </div>

          <div className="flex items-start justify-between">
            <div>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-extrabold bg-rose-600 text-white uppercase tracking-wider mb-1.5">
                CODE RED • INCOMING DISPATCH
              </span>
              <h2 className="text-lg font-extrabold text-white tracking-tight">
                Acute Dyspnea / Severe Chest Tightness
              </h2>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black text-white font-mono">{countdown}s</span>
            </div>
          </div>

          {/* Metrics Bar: 3 min • 1.2 km • Sector */}
          <div className="flex items-center space-x-3 my-3 p-3 bg-neutral-900 rounded-2xl border border-neutral-800">
            <div className="flex-1">
              <span className="text-[10px] text-neutral-400 uppercase font-mono block">ETA via Dijkstra</span>
              <span className="text-base font-bold text-emerald-400 font-mono">3 MIN</span>
            </div>
            <div className="w-px h-8 bg-neutral-800" />
            <div className="flex-1">
              <span className="text-[10px] text-neutral-400 uppercase font-mono block">Distance</span>
              <span className="text-base font-bold text-white font-mono">1.2 KM</span>
            </div>
            <div className="w-px h-8 bg-neutral-800" />
            <div className="flex-1">
              <span className="text-[10px] text-neutral-400 uppercase font-mono block">Sector</span>
              <span className="text-base font-bold text-white font-mono">Poblacion</span>
            </div>
          </div>

          {/* Incident & Patient Details */}
          <div className="p-3 bg-neutral-900/60 rounded-2xl border border-neutral-800/80 space-y-1.5 text-xs text-neutral-300 mb-4">
            <div className="flex items-start space-x-2">
              <MapPin className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span className="font-semibold text-white">142 Rizal Street, Brgy. Poblacion, Balanga City</span>
            </div>
            <div className="flex items-center justify-between text-[11px] pt-1 border-t border-neutral-800 text-neutral-400">
              <span>Patient: <strong className="text-white">Barry Allen (34 y/o M)</strong></span>
              <span className="px-1.5 py-0.5 rounded bg-neutral-800 font-mono text-white font-bold">O Rh-</span>
            </div>
            <div className="text-[11px] text-rose-400 flex items-center gap-1 font-medium">
              <AlertTriangle className="w-3 h-3 text-rose-400 shrink-0" />
              <span>Critical Allergy: Penicillin (Severe Anaphylaxis)</span>
            </div>
          </div>

          {/* Accept & Decline Buttons */}
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={handleDeclineCall}
              className="col-span-1 py-4 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 rounded-2xl font-bold text-xs uppercase tracking-wider transition-colors border border-neutral-700"
            >
              Decline
            </button>
            <button
              onClick={handleAcceptCall}
              className="col-span-2 py-4 bg-[#B41A46] hover:bg-[#9a143a] text-white rounded-2xl font-extrabold text-sm uppercase tracking-wider shadow-[0_4px_20px_rgba(180,26,70,0.5)] active:scale-[0.99] transition-all"
            >
              ACCEPT DISPATCH
            </button>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 4. BOTTOM SHEET: EN ROUTE (Navigating to Incident Site)   */}
      {/* ========================================================= */}
      {mode === 'en_route' && (
        <div className="absolute bottom-0 left-0 right-0 z-30 bg-white rounded-t-3xl shadow-2xl p-5 border-t border-neutral-100 animate-[fade-in_0.2s_ease-out]">
          <div className="w-10 h-1 bg-neutral-200 rounded-full mx-auto mb-3" />

          <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
            <div>
              <span className="text-[10px] font-mono text-rose-600 font-bold uppercase tracking-wider">
                ACTIVE PATIENT DISPATCH
              </span>
              <h3 className="text-base font-bold text-neutral-900">Barry Allen</h3>
              <p className="text-xs text-neutral-500">142 Rizal St, Poblacion</p>
            </div>

            <a
              href="tel:+639175550192"
              className="w-10 h-10 rounded-full bg-neutral-100 text-neutral-900 flex items-center justify-center hover:bg-neutral-200 transition-colors"
              title="Call Emergency Contact"
            >
              <Phone className="w-4 h-4" />
            </a>
          </div>

          {/* Medical Allergy Warning */}
          <div className="mt-3 p-2.5 bg-rose-50 border border-rose-100 rounded-xl flex items-center space-x-2 text-xs text-rose-800">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span className="font-semibold text-[11px]">ALLERGY ALERT: Penicillin (Severe) • Blood Type: O Rh-</span>
          </div>

          {/* Action: Mark Arrived */}
          <button
            onClick={() => setMode('on_scene')}
            className="w-full mt-4 py-4 bg-amber-600 hover:bg-amber-700 text-white rounded-2xl font-bold text-xs tracking-wider uppercase shadow-lg active:scale-[0.99] transition-all flex items-center justify-center gap-2"
          >
            <Check className="w-4 h-4" />
            <span>MARK ARRIVED ON SCENE</span>
          </button>
        </div>
      )}

      {/* ========================================================= */}
      {/* 5. BOTTOM SHEET: ON SCENE (Triage & Stabilization)        */}
      {/* ========================================================= */}
      {mode === 'on_scene' && (
        <div className="absolute bottom-0 left-0 right-0 z-30 bg-white rounded-t-3xl shadow-2xl p-5 border-t border-neutral-100 animate-[fade-in_0.2s_ease-out]">
          <div className="w-10 h-1 bg-neutral-200 rounded-full mx-auto mb-3" />

          <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
            <div>
              <span className="text-[10px] font-mono text-amber-600 font-bold uppercase tracking-wider">
                ON SCENE • TRIAGE ACTIVE
              </span>
              <h3 className="text-base font-bold text-neutral-900">Barry Allen (34 y/o M)</h3>
              <p className="text-xs text-neutral-500">Field stabilization in progress</p>
            </div>
            <div className="px-2.5 py-1 bg-neutral-900 text-white rounded-lg font-mono text-xs font-bold">
              O Rh-
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2 text-xs font-mono">
            <div className="p-2.5 bg-neutral-50 border border-neutral-200 rounded-xl">
              <span className="text-[10px] text-neutral-400 block">Vitals Status</span>
              <span className="font-bold text-neutral-800">SpO2 96% • HR 94</span>
            </div>
            <div className="p-2.5 bg-neutral-50 border border-neutral-200 rounded-xl">
              <span className="text-[10px] text-neutral-400 block">Receiving Facility</span>
              <span className="font-bold text-neutral-800">BGHMC Trauma</span>
            </div>
          </div>

          <button
            onClick={() => setMode('transporting')}
            className="w-full mt-4 py-4 bg-neutral-950 hover:bg-neutral-800 text-white rounded-2xl font-bold text-xs tracking-wider uppercase shadow-lg active:scale-[0.99] transition-all flex items-center justify-center gap-2"
          >
            <Heart className="w-4 h-4 text-rose-400 fill-current" />
            <span>PATIENT SECURED • COMMENCE TRANSPORT</span>
          </button>
        </div>
      )}

      {/* ========================================================= */}
      {/* 6. BOTTOM SHEET: TRANSPORTING TO HOSPITAL                 */}
      {/* ========================================================= */}
      {mode === 'transporting' && (
        <div className="absolute bottom-0 left-0 right-0 z-30 bg-white rounded-t-3xl shadow-2xl p-5 border-t border-neutral-100 animate-[fade-in_0.2s_ease-out]">
          <div className="w-10 h-1 bg-neutral-200 rounded-full mx-auto mb-3" />

          <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
            <div>
              <span className="text-[10px] font-mono text-blue-600 font-bold uppercase tracking-wider">
                EN ROUTE TO RECEIVING HOSPITAL
              </span>
              <h3 className="text-base font-bold text-neutral-900">BGHMC Medical Center</h3>
              <p className="text-xs text-neutral-500">Trauma ICU notified via CAD telemetry</p>
            </div>
            <div className="text-right">
              <span className="text-xs font-mono font-bold text-emerald-600">Bed 04 Reserved</span>
            </div>
          </div>

          <button
            onClick={() => setMode('waiting')}
            className="w-full mt-4 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-xs tracking-wider uppercase shadow-lg active:scale-[0.99] transition-all flex items-center justify-center gap-2"
          >
            <Check className="w-4 h-4" />
            <span>COMPLETE HANDOVER & CLEAR UNIT</span>
          </button>
        </div>
      )}
    </div>
  );
}
