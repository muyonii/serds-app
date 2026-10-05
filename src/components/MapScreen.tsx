import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  User, 
  Play, 
  Pause, 
  RotateCcw,
  Phone,
  PhoneCall,
  PhoneOff,
  MessageSquare,
  Crosshair,
  AlertTriangle,
  Shield,
  Ambulance,
  Flame,
  Lock
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Polyline, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import { 
  calculateRealRoute, 
  formatDistance, 
  formatEta, 
  getPositionAlongRoute, 
  calculateDistance, 
  RouteResult 
} from '../lib/routing';
import { createEmergencyIncident } from '../lib/api';
import { useUserSettings } from '../lib/userSettings';

export type EmergencyServiceType = 'police' | 'ambulance' | 'fire';

export interface DispatcherStation {
  id: string;
  name: string;
  stationName: string;
  role: string;
  unitCode: string;
  coords: [number, number];
  status: 'active' | 'standby';
  vehicleType: string;
  serviceCategory: EmergencyServiceType;
}

// Generate local municipal emergency stations situated relative to the citizen's real location
export function getDispatcherStations(coords: [number, number]): DispatcherStation[] {
  const [lat, lng] = coords;
  return [
    {
      id: 'unit-4',
      name: 'Ingredia Nutrisha',
      stationName: 'Central EMS Station',
      role: 'Paramedic Lead',
      unitCode: 'Unit 4',
      coords: [Number((lat + 0.0055).toFixed(6)), Number((lng - 0.0048).toFixed(6))],
      status: 'active',
      vehicleType: 'Ambulance',
      serviceCategory: 'ambulance'
    },
    {
      id: 'precinct-1',
      name: 'Capt. Ramon Valdez',
      stationName: 'Municipal Police Precinct',
      role: 'Patrol Commander',
      unitCode: 'Patrol 101',
      coords: [Number((lat + 0.0042).toFixed(6)), Number((lng + 0.0051).toFixed(6))],
      status: 'active',
      vehicleType: 'Police Cruiser',
      serviceCategory: 'police'
    },
    {
      id: 'station-bfp',
      name: 'Insp. Dante Santos',
      stationName: 'Municipal Fire & Rescue',
      role: 'Rescue & Fire Captain',
      unitCode: 'Engine 1',
      coords: [Number((lat - 0.0040).toFixed(6)), Number((lng - 0.0052).toFixed(6))],
      status: 'active',
      vehicleType: 'Rescue Unit',
      serviceCategory: 'fire'
    },
    {
      id: 'station-bghmc',
      name: 'Dr. Andrea Cruz',
      stationName: 'Emergency Trauma Center',
      role: 'Emergency Medical',
      unitCode: 'Medic 2',
      coords: [Number((lat - 0.0052).toFixed(6)), Number((lng + 0.0058).toFixed(6))],
      status: 'active',
      vehicleType: 'Mobile ICU',
      serviceCategory: 'ambulance'
    },
    {
      id: 'precinct-tactical',
      name: 'Officer L. Ramos',
      stationName: 'Police Tactical Sub-Station',
      role: 'Tactical Patrol',
      unitCode: 'Tactical 07',
      coords: [Number((lat - 0.0035).toFixed(6)), Number((lng + 0.0038).toFixed(6))],
      status: 'active',
      vehicleType: 'Police Mobile',
      serviceCategory: 'police'
    }
  ];
}

// Active fallback stations if needed for initial typing
export const DISPATCHER_STATIONS: DispatcherStation[] = [
  {
    id: 'unit-4',
    name: 'Ingredia Nutrisha',
    stationName: 'Central EMS Station',
    role: 'Paramedic Lead',
    unitCode: 'Unit 4',
    coords: [14.6735, 120.5340],
    status: 'active',
    vehicleType: 'Ambulance',
    serviceCategory: 'ambulance'
  },
  {
    id: 'precinct-1',
    name: 'Capt. Ramon Valdez',
    stationName: 'Municipal Police Precinct',
    role: 'Patrol Commander',
    unitCode: 'Patrol 101',
    coords: [14.6760, 120.5420],
    status: 'active',
    vehicleType: 'Police Cruiser',
    serviceCategory: 'police'
  },
  {
    id: 'station-bfp',
    name: 'Insp. Dante Santos',
    stationName: 'Municipal Fire & Rescue',
    role: 'Rescue & Fire Captain',
    unitCode: 'Engine 1',
    coords: [14.6710, 120.5365],
    status: 'active',
    vehicleType: 'Rescue Unit',
    serviceCategory: 'fire'
  }
];

// Custom Leaflet Icons with Dynamic Zoom Adaptability

// 1. Citizen Marker: Adaptive zoom behavior to avoid cluttering when zoomed out
export const createCitizenIcon = (zoom: number) => {
  // Far Zoom Out (zoom <= 12): Pure radar beacon dot, NO text box at all
  if (zoom <= 12) {
    return L.divIcon({
      html: `
        <div class="relative flex items-center justify-center select-none pointer-events-none serd-marker-tag">
          <span class="absolute w-6 h-6 rounded-full bg-[#B41A46] opacity-35 animate-ping"></span>
          <div class="w-3.5 h-3.5 bg-[#B41A46] rounded-full shadow-md border-2 border-white"></div>
        </div>
      `,
      className: '',
      iconSize: [26, 26],
      iconAnchor: [13, 13]
    });
  }

  // Moderate Zoom Out (zoom 13-14): Compact micro tag "You"
  if (zoom <= 14) {
    return L.divIcon({
      html: `
        <div class="flex flex-col items-center justify-end h-full select-none pointer-events-none serd-marker-tag">
          <div class="bg-[#B41A46] text-white px-2 py-0.5 rounded-full shadow-md text-[9px] font-bold tracking-wide whitespace-nowrap mb-1 flex items-center gap-1 border border-white">
            <span class="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
            <span>You</span>
          </div>
          <div class="relative flex items-center justify-center">
            <span class="absolute w-5 h-5 rounded-full bg-[#B41A46] opacity-35 animate-ping"></span>
            <div class="w-3.5 h-3.5 bg-[#B41A46] rounded-full shadow-xs border-2 border-white"></div>
          </div>
        </div>
      `,
      className: '',
      iconSize: [60, 42],
      iconAnchor: [30, 42]
    });
  }

  // Standard (zoom 15) and Street-level (zoom >= 16): "Where am I" tag
  return L.divIcon({
    html: `
      <div class="flex flex-col items-center justify-end h-full select-none pointer-events-none serd-marker-tag">
        <div class="bg-[#B41A46] text-white px-2.5 py-0.5 rounded-full shadow-md text-[10px] font-bold tracking-wide whitespace-nowrap mb-1 flex items-center gap-1.5 border border-white">
          <span class="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
          <span>Where am I</span>
        </div>
        <div class="relative flex items-center justify-center">
          <span class="absolute w-5 h-5 rounded-full bg-[#B41A46] opacity-35 animate-ping"></span>
          <div class="w-3.5 h-3.5 bg-[#B41A46] rounded-full shadow-xs border-2 border-white"></div>
        </div>
      </div>
    `,
    className: '',
    iconSize: [110, 50],
    iconAnchor: [55, 50]
  });
};

// 2. Dispatcher Station Marker: Adaptive zoom behavior to prevent overlapping and clogging
export const createDispatcherIcon = (station: DispatcherStation, isSelectedForDispatch: boolean, zoom: number) => {
  const isPolice = station.serviceCategory === 'police';
  const isFire = station.serviceCategory === 'fire';
  const themeColor = isSelectedForDispatch
    ? '#B41A46'
    : isPolice
    ? '#2563eb'
    : isFire
    ? '#d97706'
    : '#059669';

  const dotIndicatorClass = isSelectedForDispatch
    ? 'bg-emerald-400 animate-pulse'
    : isPolice
    ? 'bg-blue-500'
    : isFire
    ? 'bg-amber-500'
    : 'bg-emerald-500';

  // Far Zoom Out (zoom <= 12): Pure responder dot with status ring, ZERO text clutter!
  if (zoom <= 12) {
    return L.divIcon({
      html: `
        <div class="relative flex items-center justify-center select-none pointer-events-none serd-marker-tag">
          ${isSelectedForDispatch ? '<span class="absolute w-6 h-6 rounded-full bg-[#B41A46] opacity-40 animate-ping"></span>' : ''}
          <div class="w-3.5 h-3.5 rounded-full shadow-md border-2 border-white flex items-center justify-center" style="background-color: ${themeColor}">
            <span class="w-1 h-1 rounded-full bg-white"></span>
          </div>
        </div>
      `,
      className: '',
      iconSize: [22, 22],
      iconAnchor: [11, 11]
    });
  }

  // Moderate Zoom Out (zoom 13-14): Ultra-compact unit badge (e.g. "Unit 4", "Patrol 101", "Engine 1")
  // Short and neat so multiple stations never overlap or clog the screen
  if (zoom <= 14) {
    return L.divIcon({
      html: `
        <div class="flex flex-col items-center justify-end h-full select-none pointer-events-none serd-marker-tag">
          <div class="${isSelectedForDispatch ? 'bg-neutral-900 text-white border-neutral-700 shadow-sm ring-1 ring-[#B41A46]/60' : 'bg-white text-gray-800 border-gray-200 shadow-xs'} px-1.5 py-0.5 rounded-md border text-[9px] font-bold whitespace-nowrap mb-1 flex items-center gap-1">
            <span class="w-1.5 h-1.5 rounded-full ${dotIndicatorClass}"></span>
            <span>${station.unitCode}</span>
          </div>
          <div class="w-3 h-3 rounded-full shadow-xs border-2 border-white" style="background-color: ${themeColor}"></div>
        </div>
      `,
      className: '',
      iconSize: [64, 38],
      iconAnchor: [32, 38]
    });
  }

  // Default Zoom 15: Concise station badge with shortened title and max-width truncation
  if (zoom === 15) {
    const shortStation = station.stationName
      .replace(' Station', '')
      .replace(' Center', '')
      .replace('Municipal ', '');

    return L.divIcon({
      html: `
        <div class="flex flex-col items-center justify-end h-full select-none pointer-events-none serd-marker-tag">
          <div class="${isSelectedForDispatch ? 'bg-neutral-900 text-white border-neutral-700 shadow-sm ring-1 ring-[#B41A46]/60' : 'bg-white text-gray-800 border-gray-200 shadow-xs'} px-2 py-0.5 rounded-lg border text-[10px] font-semibold whitespace-nowrap mb-1 flex items-center gap-1 max-w-[130px] truncate">
            <span class="w-1.5 h-1.5 rounded-full shrink-0 ${dotIndicatorClass}"></span>
            <span class="truncate">${station.unitCode} (${shortStation})</span>
          </div>
          <div class="w-3.5 h-3.5 rounded-full shadow-xs border-2 border-white" style="background-color: ${themeColor}"></div>
        </div>
      `,
      className: '',
      iconSize: [136, 44],
      iconAnchor: [68, 44]
    });
  }

  // Close-up Zoom (zoom >= 16): Full detailed street-level tag
  return L.divIcon({
    html: `
      <div class="flex flex-col items-center justify-end h-full select-none pointer-events-none serd-marker-tag">
        <div class="${isSelectedForDispatch ? 'bg-neutral-900 text-white border-neutral-700 shadow-sm ring-1 ring-[#B41A46]/60' : 'bg-white text-gray-800 border-gray-200 shadow-xs'} px-2.5 py-0.5 rounded-lg border text-[10px] font-semibold whitespace-nowrap mb-1 flex items-center gap-1.5">
          <span class="w-1.5 h-1.5 rounded-full shrink-0 ${dotIndicatorClass}"></span>
          <span>Dispatcher: ${station.unitCode} (${station.stationName})</span>
        </div>
        <div class="w-3.5 h-3.5 rounded-full shadow-xs border-2 border-white" style="background-color: ${themeColor}"></div>
      </div>
    `,
    className: '',
    iconSize: [180, 48],
    iconAnchor: [90, 48]
  });
};

// 3. Live En-Route Responder Vehicle Icon
const getUnitEnRouteIcon = (vehicleType: string = 'Ambulance') => {
  let emoji = '🚑';
  const v = vehicleType.toLowerCase();
  if (v.includes('police') || v.includes('patrol') || v.includes('tactical')) emoji = '🚓';
  else if (v.includes('fire') || v.includes('engine') || v.includes('rescue')) emoji = '🚒';

  return L.divIcon({
    html: `
      <div class="relative flex items-center justify-center select-none">
        <span class="absolute inline-flex h-8 w-8 animate-ping rounded-full bg-[#B41A46] opacity-35"></span>
        <div class="relative w-8 h-8 bg-neutral-900 text-white rounded-full flex items-center justify-center shadow-lg border-2 border-white text-xs font-bold">
          ${emoji}
        </div>
      </div>
    `,
    className: '',
    iconSize: [32, 32],
    iconAnchor: [16, 16]
  });
};

// Helper component to lock and center map view on user's exact location
function MapLocationLock({ position }: { position: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(position, map.getZoom(), { animate: true });
  }, [position, map]);
  return null;
}

// Tracks live map zoom level to dynamically adapt marker text sizes and prevent clutter
function MapZoomTracker({ onZoomChange }: { onZoomChange: (zoom: number) => void }) {
  const map = useMap();
  useEffect(() => {
    const handleZoom = () => {
      onZoomChange(Math.round(map.getZoom()));
    };
    handleZoom();
    map.on('zoom', handleZoom);
    map.on('zoomend', handleZoom);
    return () => {
      map.off('zoom', handleZoom);
      map.off('zoomend', handleZoom);
    };
  }, [map, onZoomChange]);
  return null;
}

// Floating Zoom and Recenter Controls for effortless map navigation
function MapFloatingControls({ citizenLocation }: { citizenLocation: [number, number] }) {
  const map = useMap();
  return (
    <div className="absolute top-3 left-3 z-[400] flex flex-col gap-1.5 select-none pointer-events-auto">
      <div className="bg-white/95 backdrop-blur-md rounded-xl shadow-md border border-gray-200/80 overflow-hidden flex flex-col">
        <button
          type="button"
          onClick={() => map.zoomIn()}
          aria-label="Zoom in"
          className="w-8 h-8 flex items-center justify-center text-gray-700 hover:text-gray-900 hover:bg-gray-100 active:bg-gray-200 transition-colors font-bold text-sm cursor-pointer"
          title="Zoom in"
        >
          +
        </button>
        <div className="h-[1px] bg-gray-200 w-full" />
        <button
          type="button"
          onClick={() => map.zoomOut()}
          aria-label="Zoom out"
          className="w-8 h-8 flex items-center justify-center text-gray-700 hover:text-gray-900 hover:bg-gray-100 active:bg-gray-200 transition-colors font-bold text-base cursor-pointer"
          title="Zoom out"
        >
          &minus;
        </button>
      </div>
      <button
        type="button"
        onClick={() => map.setView(citizenLocation, 15, { animate: true })}
        aria-label="Center on my location"
        className="w-8 h-8 bg-white/95 backdrop-blur-md rounded-xl shadow-md border border-gray-200/80 flex items-center justify-center text-gray-700 hover:text-[#B41A46] hover:bg-gray-100 active:bg-gray-200 transition-colors cursor-pointer"
        title="Center on my location"
      >
        <Crosshair className="w-4 h-4" />
      </button>
    </div>
  );
}

// Find nearest dispatcher station based on distance
function findNearestDispatcher(lat: number, lng: number, stations: DispatcherStation[]): DispatcherStation {
  let nearest = stations[0] || DISPATCHER_STATIONS[0];
  let minDist = Infinity;
  for (const st of stations) {
    const d = calculateDistance(lat, lng, st.coords[0], st.coords[1]);
    if (d < minDist) {
      minDist = d;
      nearest = st;
    }
  }
  return nearest;
}

// Check session / local storage for verified real GPS coordinates
function getInitialRealLocation(): [number, number] | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem('serd_real_user_location') || localStorage.getItem('serd_real_user_location');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length === 2 && typeof parsed[0] === 'number' && typeof parsed[1] === 'number') {
        return [parsed[0], parsed[1]];
      }
    }
  } catch {}
  return null;
}

interface MapScreenProps {
  onBack?: () => void;
  onCallClick?: () => void;
  autoDispatch?: boolean;
}

export default function MapScreen({ onBack: _onBack, onCallClick, autoDispatch = false }: MapScreenProps) {
  const { settings, updateLocation } = useUserSettings();
  const { location } = settings;

  const [showMessageModal, setShowMessageModal] = useState(false);
  const [showCallConfirmModal, setShowCallConfirmModal] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [messageSent, setMessageSent] = useState(false);

  // Strictly real device GPS location - NO fake / placeholder location is ever loaded
  const [citizenLocation, setCitizenLocation] = useState<[number, number] | null>(() => getInitialRealLocation());
  const [isLocating, setIsLocating] = useState<boolean>(() => !getInitialRealLocation());
  const [locationError, setLocationError] = useState<string | null>(null);

  // Live map zoom level to dynamically adjust marker sizes and remove clutter when zoomed out
  const [mapZoom, setMapZoom] = useState<number>(15);

  const requestLocation = () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser or device.');
      setIsLocating(false);
      return;
    }
    setIsLocating(true);
    setLocationError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        try {
          sessionStorage.setItem('serd_real_user_location', JSON.stringify(coords));
          localStorage.setItem('serd_real_user_location', JSON.stringify(coords));
        } catch {}
        setCitizenLocation(coords);
        setIsLocating(false);
        setLocationError(null);
        updateLocation({
          lastKnownCoords: { lat: coords[0], lng: coords[1] },
          lastKnownAddress: `Lat ${coords[0].toFixed(4)}, Lng ${coords[1].toFixed(4)}`
        });
      },
      (err) => {
        setIsLocating(false);
        if (err.code === 1) {
          setLocationError('Location permission denied. Please allow location access in your browser to view your emergency map.');
        } else if (err.code === 2) {
          setLocationError('Position unavailable. Please ensure your device GPS is turned on and try again.');
        } else if (err.code === 3) {
          setLocationError('GPS request timed out while locking coordinates. Please retry.');
        } else {
          setLocationError('Unable to acquire GPS lock. Please tap retry.');
        }
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  };

  useEffect(() => {
    if (!citizenLocation) {
      requestLocation();
    }
  }, []);

  // Dispatch state: NO ROUTE initially until CALL confirmation (or autoDispatch from Home hold)
  const [isDispatched, setIsDispatched] = useState<boolean>(false);
  const [dispatchedStation, setDispatchedStation] = useState<DispatcherStation | null>(null);
  const [hasCancelled, setHasCancelled] = useState<boolean>(false);
  const [showCancelConfirmModal, setShowCancelConfirmModal] = useState<boolean>(false);
  const [cancelNotice, setCancelNotice] = useState<string | null>(null);
  
  // Selected emergency service category: Police, Ambulance, Fire
  const [selectedService, setSelectedService] = useState<EmergencyServiceType>('ambulance');

  // Real routing calculation state (only calculated after dispatch)
  const [routeResult, setRouteResult] = useState<RouteResult | null>(null);
  const [routePoints, setRoutePoints] = useState<[number, number][]>([]);
  const [isCalculating, setIsCalculating] = useState(false);

  // Simulated live unit transit along computed route
  const [isSimulating, setIsSimulating] = useState(false);
  const [transitProgress, setTransitProgress] = useState(0); // 0 to 1
  const animFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);

  // Stations situated dynamically near citizen's real location
  const stations = useMemo(() => {
    if (!citizenLocation) return [];
    return getDispatcherStations(citizenLocation);
  }, [citizenLocation]);

  // Current active nearest dispatcher based on locked citizen position and selected emergency service
  const activeNearest = useMemo(() => {
    if (!citizenLocation || stations.length === 0) {
      const fallback = DISPATCHER_STATIONS.find(s => s.serviceCategory === selectedService) || DISPATCHER_STATIONS[0];
      return fallback;
    }
    const matching = stations.filter(s => s.serviceCategory === selectedService);
    const candidatePool = matching.length > 0 ? matching : stations;
    return findNearestDispatcher(citizenLocation[0], citizenLocation[1], candidatePool);
  }, [citizenLocation, stations, selectedService]);

  const currentResponder = dispatchedStation || activeNearest;

  // Auto-updates nearest unit when citizen selects what emergency service they need (locked when call is active)
  const handleSelectService = (service: EmergencyServiceType) => {
    if (isDispatched) {
      setCancelNotice('Active emergency call in progress. Cancel current call first to switch services.');
      setTimeout(() => setCancelNotice(null), 3000);
      return;
    }
    setSelectedService(service);
    if (!citizenLocation || stations.length === 0) return;
    const matching = stations.filter(s => s.serviceCategory === service);
    const targetStation = findNearestDispatcher(citizenLocation[0], citizenLocation[1], matching.length > 0 ? matching : stations);
    setDispatchedStation(targetStation);
  };

  // Perform dispatch: notifies CAD backend & calculates Dijkstra road route from nearest dispatcher
  const triggerDispatch = (stationToUse?: DispatcherStation) => {
    if (!citizenLocation) return;
    setHasCancelled(false);
    const station = stationToUse || currentResponder;
    setDispatchedStation(station);
    setIsDispatched(true);
    setIsCalculating(true);

    // Notify CAD backend of live incident
    createEmergencyIncident({
      type: `Emergency Response Dispatch - ${station.serviceCategory.toUpperCase()}`,
      location: location?.lastKnownAddress || `Lat ${citizenLocation[0].toFixed(4)}, Lng ${citizenLocation[1].toFixed(4)}`,
      patientName: 'Barry Allen',
      priority: 'critical',
      coords: citizenLocation,
      details: `Dispatched ${station.unitCode} (${station.name}) from ${station.stationName}`
    });

    calculateRealRoute(station.coords, citizenLocation)
      .then((res) => {
        setRouteResult(res);
        setRoutePoints(res.coordinates);
        setIsCalculating(false);
        setTransitProgress(0);
        setIsSimulating(false);
      })
      .catch(() => {
        setIsCalculating(false);
      });
  };

  // Auto-dispatch effect when passed from Home button hold countdown
  useEffect(() => {
    if (autoDispatch && !isDispatched && !hasCancelled && citizenLocation) {
      triggerDispatch();
    }
  }, [autoDispatch, isDispatched, hasCancelled, citizenLocation]);

  // Re-calculate route if citizen location changes while already dispatched
  useEffect(() => {
    if (isDispatched && dispatchedStation && citizenLocation) {
      setIsCalculating(true);
      calculateRealRoute(dispatchedStation.coords, citizenLocation)
        .then((res) => {
          setRouteResult(res);
          setRoutePoints(res.coordinates);
          setIsCalculating(false);
        })
        .catch(() => {
          setIsCalculating(false);
        });
    }
  }, [citizenLocation, isDispatched, dispatchedStation]);

  // Live animation loop when transit simulation is active
  useEffect(() => {
    if (!isSimulating || routePoints.length < 2) {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      return;
    }

    const simulationDurationMs = 12000;
    lastTimeRef.current = performance.now();

    const step = (now: number) => {
      const delta = now - lastTimeRef.current;
      lastTimeRef.current = now;

      setTransitProgress((prev) => {
        const next = prev + delta / simulationDurationMs;
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

  // CALL / CANCEL button click handler:
  // If NOT dispatched: open confirmation popup to CALL
  // If ALREADY dispatched: open confirmation to CANCEL dispatch
  const handleCallClick = () => {
    if (!isDispatched) {
      setShowCallConfirmModal(true);
    } else {
      setShowCancelConfirmModal(true);
    }
  };

  // Cancel emergency dispatch handler
  const handleCancelCall = () => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    setIsSimulating(false);
    setTransitProgress(0);
    setRouteResult(null);
    setRoutePoints([]);
    setIsDispatched(false);
    setHasCancelled(true);
    setShowCancelConfirmModal(false);
    setCancelNotice('Emergency dispatch cancelled. Units stood down.');
    setTimeout(() => {
      setCancelNotice(null);
    }, 3500);
  };

  // Confirm call in popup modal
  const handleConfirmCall = () => {
    setShowCallConfirmModal(false);
    triggerDispatch(currentResponder);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;
    setMessageSent(true);
    setTimeout(() => {
      setMessageSent(false);
      setShowMessageModal(false);
      setChatMessage('');
    }, 1500);
  };

  // Active responder vehicle position
  const currentUnitCoords = isSimulating || transitProgress > 0
    ? getPositionAlongRoute(routePoints, transitProgress)
    : currentResponder.coords;

  // Remaining distance & ETA
  const remainingDistanceMeters = routeResult 
    ? Math.max(0, Math.round(routeResult.distanceMeters * (1 - transitProgress)))
    : 0;

  const remainingDurationSeconds = routeResult
    ? Math.max(0, Math.round(routeResult.durationSeconds * (1 - transitProgress)))
    : 0;

  // Direct distance from citizen to currently selected dispatcher before dispatch
  const standbyEstDistanceMeters = citizenLocation ? calculateDistance(
    citizenLocation[0],
    citizenLocation[1],
    currentResponder.coords[0],
    currentResponder.coords[1]
  ) : 0;

  const standbyEstDurationSeconds = Math.max(60, Math.round(standbyEstDistanceMeters / 12.5));
  const standbyEtaFormatted = formatEta(standbyEstDurationSeconds);

  if (!citizenLocation) {
    return (
      <div className="flex flex-col h-full bg-[#0F172A] font-sans relative overflow-hidden items-center justify-center p-6 text-center select-none">
        {/* Pulsing GPS Radar Animation */}
        <div className="relative w-48 h-48 flex items-center justify-center mb-6">
          <div className="absolute inset-0 rounded-full border border-rose-500/20 animate-ping" style={{ animationDuration: '3s' }} />
          <div className="absolute inset-4 rounded-full border border-rose-500/30 animate-pulse" />
          <div className="absolute inset-10 rounded-full border border-rose-500/40" />
          <div className="w-16 h-16 rounded-full bg-[#B41A46] text-white flex items-center justify-center shadow-lg shadow-rose-900/60 z-10">
            <Crosshair className={`w-8 h-8 ${isLocating ? 'animate-spin' : ''}`} style={{ animationDuration: '4s' }} />
          </div>
        </div>

        {locationError ? (
          <div className="max-w-sm bg-neutral-900 border border-neutral-800 p-6 rounded-2xl shadow-2xl text-white">
            <div className="w-10 h-10 rounded-full bg-amber-500/10 text-amber-400 mx-auto flex items-center justify-center mb-3">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold mb-1.5">GPS Location Required</h3>
            <p className="text-xs text-gray-400 leading-relaxed mb-4">
              {locationError}
            </p>
            <button
              type="button"
              onClick={requestLocation}
              className="w-full py-2.5 px-4 bg-[#B41A46] hover:bg-[#9a143a] text-white rounded-xl text-xs font-bold tracking-wide uppercase transition-all shadow-xs cursor-pointer"
            >
              Retry GPS Lock
            </button>
          </div>
        ) : (
          <div className="max-w-xs text-white">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-950/70 border border-rose-800/40 text-rose-300 text-xs font-semibold uppercase tracking-wider mb-3">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              <span>Locking Coordinates</span>
            </div>
            <h2 className="text-lg font-bold tracking-tight text-white mb-1.5">
              Acquiring Your Real Location
            </h2>
            <p className="text-xs text-gray-400 leading-relaxed">
              Detecting your exact GPS coordinates. No placeholder or simulated location will be loaded.
            </p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#FAFAFA] font-sans relative overflow-hidden">
      {/* Map Area with Live Interactive Dijkstra Graph */}
      <div className="flex-1 relative bg-[#F5F2EC] overflow-hidden z-10">
        <MapContainer 
          center={citizenLocation} 
          zoom={15} 
          zoomControl={false}
          style={{ height: '100%', width: '100%' }}
        >
          {/* Detailed OpenStreetMap Basemap */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {/* Locks and centers map directly on citizen's auto-located coordinates */}
          <MapLocationLock position={citizenLocation} />

          {/* Dynamic Map Zoom Listener to adapt marker label density */}
          <MapZoomTracker onZoomChange={setMapZoom} />

          {/* Floating Map Zoom (+ / −) and Recenter GPS Controls */}
          <MapFloatingControls citizenLocation={citizenLocation} />

          {/* Citizen Location Marker with Adaptive Zoom Tag & Tooltip */}
          <Marker 
            position={citizenLocation} 
            icon={createCitizenIcon(mapZoom)} 
            draggable={false}
          >
            <Tooltip direction="top" offset={[0, -12]} className="serd-map-tooltip">
              <div className="font-bold text-white text-[11px]">Your Current Location</div>
              <div className="text-[9px] text-gray-300">Live GPS Verified</div>
            </Tooltip>
          </Marker>

          {/* Dispatcher Station Markers with Adaptive Zoom Tags & Tooltips */}
          {stations.map((station) => {
            const isSelected = dispatchedStation ? dispatchedStation.id === station.id : activeNearest.id === station.id;
            return (
              <Marker 
                key={station.id}
                position={station.coords} 
                icon={createDispatcherIcon(station, isSelected, mapZoom)} 
              >
                <Tooltip direction="top" offset={[0, -10]} className="serd-map-tooltip">
                  <div className="font-bold text-white text-[11px]">{station.unitCode} &bull; {station.name}</div>
                  <div className="text-[9px] text-gray-300">{station.stationName} ({station.vehicleType})</div>
                  <div className={`text-[9px] font-semibold ${isSelected ? 'text-emerald-400' : 'text-rose-300'}`}>
                    {isSelected ? 'Nearest Emergency Unit' : 'Standby Municipal Unit'}
                  </div>
                </Tooltip>
              </Marker>
            );
          })}

          {/* Live Animated Responder Unit Marker (Only shown during dispatch transit) */}
          {isDispatched && (isSimulating || transitProgress > 0) && (
            <Marker position={currentUnitCoords} icon={getUnitEnRouteIcon(currentResponder.vehicleType)} zIndexOffset={1000} />
          )}
          
          {/* Computed Dijkstra Real Road Network Polyline (ONLY shown once dispatched) */}
          {isDispatched && routePoints.length > 0 && (
            <Polyline 
              positions={routePoints} 
              color="#B41A46" 
              weight={5} 
              opacity={0.9}
              lineCap="round"
              lineJoin="round"
            />
          )}

          {/* Traveled portion overlay if simulation is running */}
          {isDispatched && transitProgress > 0 && (
            <Polyline
              positions={routePoints.slice(0, Math.max(1, Math.floor(transitProgress * (routePoints.length - 1)) + 1))}
              color="#0f172a"
              weight={6}
              opacity={0.7}
              lineCap="round"
              lineJoin="round"
            />
          )}
        </MapContainer>

        {/* Floating Quick Action: Simulation Controller (Only visible when dispatched) */}
        {isDispatched && routePoints.length > 1 && (
          <div className="absolute top-3 right-3 z-[400] flex items-center space-x-1.5 bg-white/90 backdrop-blur-md px-2.5 py-1.5 rounded-xl border border-gray-200 shadow-xs">
            <button
              onClick={() => {
                if (transitProgress >= 1) setTransitProgress(0);
                setIsSimulating(!isSimulating);
              }}
              className="flex items-center space-x-1 text-xs font-medium text-gray-800 hover:text-[#B41A46] transition-colors"
              title={isSimulating ? 'Pause Transit Simulation' : 'Simulate Vehicle En Route'}
            >
              {isSimulating ? (
                <>
                  <Pause className="w-3.5 h-3.5 text-[#B41A46]" />
                  <span className="text-[11px]">Pause Run</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 text-emerald-600 fill-emerald-600" />
                  <span className="text-[11px]">{transitProgress > 0 && transitProgress < 1 ? 'Resume' : 'Simulate Transit'}</span>
                </>
              )}
            </button>
            {transitProgress > 0 && (
              <button
                onClick={() => {
                  setIsSimulating(false);
                  setTransitProgress(0);
                }}
                className="p-1 text-gray-400 hover:text-gray-700 transition-colors"
                title="Reset Position"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            )}
          </div>
        )}

        {/* Floating Bottom Card Matching Paper Page 23 - Mobile Optimized */}
        <div className="absolute bottom-3 sm:bottom-4 left-3 sm:left-4 right-3 sm:right-4 max-w-md mx-auto bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md rounded-2xl shadow-xl border border-gray-100 dark:border-neutral-800 p-3 sm:p-4 z-[400] animate-[fade-in_0.2s_ease-out]">
          {/* Responder Identity */}
          <div className="flex items-center justify-between gap-2 mb-2 sm:mb-2.5">
            <div className="flex items-center space-x-2.5 sm:space-x-3 min-w-0 flex-1">
              <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center shrink-0 ${
                currentResponder.serviceCategory === 'police'
                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400'
                  : currentResponder.serviceCategory === 'fire'
                  ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400'
                  : 'bg-[#F9E8EC] text-[#B41A46] dark:bg-rose-950/50 dark:text-rose-400'
              }`}>
                {currentResponder.serviceCategory === 'police' && <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                {currentResponder.serviceCategory === 'fire' && <Flame className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                {currentResponder.serviceCategory === 'ambulance' && <Ambulance className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-xs font-semibold text-gray-900 dark:text-neutral-100 truncate leading-tight">
                  {currentResponder.name} <span className="text-[11px] text-gray-500 dark:text-neutral-400 font-normal">({currentResponder.role})</span>
                </h3>
                <p className="text-[10px] text-gray-400 dark:text-neutral-500 truncate mt-0.5">
                  {currentResponder.unitCode} &bull; {isDispatched ? (
                    isSimulating || transitProgress > 0 
                      ? (transitProgress >= 1 ? 'Arrived on Scene' : 'In Transit') 
                      : 'Dispatched from ' + currentResponder.stationName
                  ) : (
                    `Nearest ${currentResponder.serviceCategory.charAt(0).toUpperCase() + currentResponder.serviceCategory.slice(1)} • ` + currentResponder.stationName
                  )}
                </p>
              </div>
            </div>

            {/* Minimalist estimated distance and time indicator */}
            <div className="shrink-0 text-right">
              {isDispatched ? (
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-900/50 text-[#B41A46] dark:text-rose-400 text-[11px] sm:text-xs font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#B41A46] dark:bg-rose-400 animate-pulse" />
                  <span>
                    {transitProgress >= 1 
                      ? 'ARRIVED' 
                      : (routeResult 
                        ? `${formatDistance(remainingDistanceMeters)} • ${remainingDurationSeconds <= 0 ? '0m' : formatEta(remainingDurationSeconds)}` 
                        : 'EN ROUTE')}
                  </span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-1 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg bg-gray-50 dark:bg-neutral-800 border border-gray-200/80 dark:border-neutral-700 text-gray-800 dark:text-neutral-200 text-[11px] sm:text-xs font-medium">
                  <span className="font-bold text-gray-900 dark:text-white">{formatDistance(standbyEstDistanceMeters)}</span>
                  <span className="text-gray-300 dark:text-neutral-600 font-normal">&bull;</span>
                  <span className="text-[#B41A46] dark:text-rose-400 font-semibold">{standbyEtaFormatted}</span>
                </div>
              )}
            </div>
          </div>

          {/* Emergency Service Selector: Police, Ambulance, Fire */}
          <div className="py-0.5 sm:py-1 my-1 sm:my-1.5">
            <div className="flex items-center justify-between text-[11px] mb-1 px-0.5">
              <span className="font-semibold text-gray-600 dark:text-neutral-400 text-[10px] sm:text-[11px]">Emergency Service</span>
              {isDispatched ? (
                <span className="text-[10px] text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-1">
                  <Lock className="w-2.5 h-2.5" />
                  Locked &bull; Dispatched
                </span>
              ) : (
                <span className="text-[10px] text-gray-400 dark:text-neutral-500">Tap to select</span>
              )}
            </div>

            <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
              <button
                type="button"
                disabled={isDispatched}
                onClick={() => handleSelectService('police')}
                className={`py-1.5 sm:py-2 px-1.5 sm:px-2 rounded-xl text-[11px] sm:text-xs font-bold flex items-center justify-center gap-1 sm:gap-1.5 transition-all select-none border ${
                  isDispatched && selectedService !== 'police'
                    ? 'opacity-35 bg-gray-100 dark:bg-neutral-800 text-gray-400 dark:text-neutral-500 border-gray-200 dark:border-neutral-700 cursor-not-allowed'
                    : selectedService === 'police'
                    ? 'bg-blue-900 text-white border-blue-900 shadow-xs ring-1 ring-blue-500/50'
                    : 'bg-gray-50/90 dark:bg-neutral-800/80 text-gray-700 dark:text-neutral-300 border-gray-200 dark:border-neutral-700 hover:bg-blue-50/40 hover:border-blue-200 cursor-pointer'
                }`}
              >
                <Shield className={`w-3.5 h-3.5 shrink-0 ${selectedService === 'police' ? 'text-white' : 'text-blue-600 dark:text-blue-400'}`} />
                <span className="truncate">Police</span>
                {isDispatched && selectedService === 'police' && <Lock className="w-2.5 h-2.5 text-white/80 shrink-0" />}
              </button>

              <button
                type="button"
                disabled={isDispatched}
                onClick={() => handleSelectService('ambulance')}
                className={`py-1.5 sm:py-2 px-1.5 sm:px-2 rounded-xl text-[11px] sm:text-xs font-bold flex items-center justify-center gap-1 sm:gap-1.5 transition-all select-none border ${
                  isDispatched && selectedService !== 'ambulance'
                    ? 'opacity-35 bg-gray-100 dark:bg-neutral-800 text-gray-400 dark:text-neutral-500 border-gray-200 dark:border-neutral-700 cursor-not-allowed'
                    : selectedService === 'ambulance'
                    ? 'bg-[#B41A46] text-white border-[#B41A46] shadow-xs ring-1 ring-rose-500/50'
                    : 'bg-gray-50/90 dark:bg-neutral-800/80 text-gray-700 dark:text-neutral-300 border-gray-200 dark:border-neutral-700 hover:bg-rose-50/40 hover:border-rose-200 cursor-pointer'
                }`}
              >
                <Ambulance className={`w-3.5 h-3.5 shrink-0 ${selectedService === 'ambulance' ? 'text-white' : 'text-[#B41A46] dark:text-rose-400'}`} />
                <span className="truncate">EMS</span>
                {isDispatched && selectedService === 'ambulance' && <Lock className="w-2.5 h-2.5 text-white/80 shrink-0" />}
              </button>

              <button
                type="button"
                disabled={isDispatched}
                onClick={() => handleSelectService('fire')}
                className={`py-1.5 sm:py-2 px-1.5 sm:px-2 rounded-xl text-[11px] sm:text-xs font-bold flex items-center justify-center gap-1 sm:gap-1.5 transition-all select-none border ${
                  isDispatched && selectedService !== 'fire'
                    ? 'opacity-35 bg-gray-100 dark:bg-neutral-800 text-gray-400 dark:text-neutral-500 border-gray-200 dark:border-neutral-700 cursor-not-allowed'
                    : selectedService === 'fire'
                    ? 'bg-amber-600 text-white border-amber-600 shadow-xs ring-1 ring-amber-400/50'
                    : 'bg-gray-50/90 dark:bg-neutral-800/80 text-gray-700 dark:text-neutral-300 border-gray-200 dark:border-neutral-700 hover:bg-amber-50/40 hover:border-amber-200 cursor-pointer'
                }`}
              >
                <Flame className={`w-3.5 h-3.5 shrink-0 ${selectedService === 'fire' ? 'text-white' : 'text-amber-600 dark:text-amber-400'}`} />
                <span className="truncate">Fire</span>
                {isDispatched && selectedService === 'fire' && <Lock className="w-2.5 h-2.5 text-white/80 shrink-0" />}
              </button>
            </div>
          </div>

          {/* Dual Action Buttons: CALL or CANCEL and MESSAGE */}
          <div className="grid grid-cols-2 gap-2 sm:gap-3 mt-2 sm:mt-2.5">
            {isDispatched ? (
              <button 
                type="button"
                onClick={handleCallClick}
                className="py-2.5 sm:py-3 bg-rose-600 text-white rounded-xl font-semibold text-xs tracking-wider uppercase hover:bg-rose-700 active:scale-[0.99] transition-all text-center flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
              >
                <PhoneOff className="w-3.5 h-3.5 shrink-0" />
                <span>CANCEL</span>
              </button>
            ) : (
              <button 
                type="button"
                onClick={handleCallClick}
                className="py-2.5 sm:py-3 bg-[#B41A46] text-white rounded-xl font-semibold text-xs tracking-wider uppercase hover:bg-[#9a143a] active:scale-[0.99] transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Phone className="w-3.5 h-3.5 fill-current shrink-0" />
                <span>CALL</span>
              </button>
            )}

            <button 
              type="button"
              onClick={() => setShowMessageModal(true)}
              className="py-2.5 sm:py-3 bg-white dark:bg-neutral-900 border border-[#B41A46] text-[#B41A46] dark:text-rose-400 rounded-xl font-semibold text-xs tracking-wider uppercase hover:bg-rose-50 dark:hover:bg-rose-950/40 active:scale-[0.99] transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5 shrink-0" />
              <span>MESSAGE</span>
            </button>
          </div>
        </div>
      </div>

      {/* Floating Notification Banner on Cancellation */}
      {cancelNotice && (
        <div className="absolute top-4 left-4 right-4 z-[650] bg-neutral-900/95 backdrop-blur-md text-white text-xs px-4 py-3 rounded-2xl shadow-xl border border-neutral-800 flex items-center justify-between animate-[fade-in_0.2s_ease-out]">
          <div className="flex items-center space-x-2.5">
            <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse" />
            <span className="font-medium">{cancelNotice}</span>
          </div>
          <button 
            type="button"
            onClick={() => setCancelNotice(null)}
            className="text-gray-400 hover:text-white p-1 text-xs cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Cancellation Confirmation Modal when user taps CANCEL */}
      {showCancelConfirmModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-5 z-[700] animate-[fade-in_0.15s_ease-out]">
          <div className="bg-white rounded-2xl p-5 w-full max-w-sm shadow-2xl border border-gray-100 space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                <PhoneOff className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900">
                  Cancel Emergency Call?
                </h3>
                <p className="text-[11px] text-gray-500">
                  Responders will stand down and the route will reset
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-rose-50/60 rounded-xl space-y-2 border border-rose-100 text-xs">
              <div className="flex justify-between items-center text-gray-700">
                <span className="text-[11px] text-gray-500 font-medium">Assigned Unit</span>
                <span className="font-semibold text-rose-900">
                  {currentResponder.unitCode} ({currentResponder.name})
                </span>
              </div>
              <div className="flex justify-between items-center text-gray-700">
                <span className="text-[11px] text-gray-500 font-medium">Station</span>
                <span className="text-gray-800">{currentResponder.stationName}</span>
              </div>
            </div>

            <p className="text-[11px] text-gray-500 leading-relaxed">
              If this request was triggered by accident or the emergency is resolved, confirm below to cancel the dispatch.
            </p>

            <div className="flex space-x-2.5 pt-1">
              <button
                type="button"
                onClick={() => setShowCancelConfirmModal(false)}
                className="flex-1 py-2.5 border border-gray-200 text-gray-700 text-xs font-semibold rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Keep Active
              </button>
              <button
                type="button"
                onClick={handleCancelCall}
                className="flex-1 py-2.5 bg-rose-600 text-white text-xs font-semibold rounded-xl hover:bg-rose-700 shadow-xs active:scale-[0.99] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <PhoneOff className="w-3.5 h-3.5" />
                <span>Yes, Cancel Call</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Popup Modal for CALL button on Emergency Place & Routing Screen */}
      {showCallConfirmModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-5 z-[700] animate-[fade-in_0.15s_ease-out]">
          <div className="bg-white rounded-2xl p-5 w-full max-w-sm shadow-2xl border border-gray-100 space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-rose-50 text-[#B41A46] flex items-center justify-center shrink-0">
                <PhoneCall className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900">
                  Confirm Emergency Call
                </h3>
                <p className="text-[11px] text-gray-500">
                  Dispatch nearest {selectedService} unit to your location
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-gray-50 rounded-xl space-y-2.5 border border-gray-100 text-xs">
              <div className="flex justify-between items-center text-gray-600">
                <span className="text-[11px] text-gray-400 font-medium">Your Position</span>
                <span className="font-mono text-[11px] text-gray-800">
                  {citizenLocation[0].toFixed(4)}, {citizenLocation[1].toFixed(4)}
                </span>
              </div>
              <div className="flex justify-between items-center text-gray-600">
                <span className="text-[11px] text-gray-400 font-medium">Selected Unit</span>
                <span className="font-semibold text-[#B41A46]">
                  {currentResponder.unitCode} ({currentResponder.name})
                </span>
              </div>
              <div className="flex justify-between items-center text-gray-600">
                <span className="text-[11px] text-gray-400 font-medium">Station</span>
                <span className="text-gray-700">{currentResponder.stationName}</span>
              </div>
              <div className="flex justify-between items-center text-gray-600">
                <span className="text-[11px] text-gray-400 font-medium">Est. Distance & Time</span>
                <span className="font-mono font-semibold text-gray-800">
                  {formatDistance(standbyEstDistanceMeters)} &bull; {standbyEtaFormatted}
                </span>
              </div>
            </div>

            <p className="text-[11px] text-gray-500 leading-relaxed">
              Confirming will immediately alert the municipal dispatcher CAD and generate the optimal Dijkstra road route.
            </p>

            <div className="flex space-x-2.5 pt-1">
              <button
                type="button"
                onClick={() => setShowCallConfirmModal(false)}
                className="flex-1 py-2.5 border border-gray-200 text-gray-700 text-xs font-semibold rounded-xl hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmCall}
                className="flex-1 py-2.5 bg-[#B41A46] text-white text-xs font-semibold rounded-xl hover:bg-[#9a143a] shadow-xs active:scale-[0.99] transition-all flex items-center justify-center gap-1.5"
              >
                <Phone className="w-3.5 h-3.5 fill-current" />
                <span>Confirm & Call</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Message Modal for Direct Messaging Action */}
      {showMessageModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-6 z-[600]">
          <div className="bg-white rounded-2xl p-5 w-full max-w-xs shadow-xl space-y-3">
            <h3 className="text-xs font-semibold text-gray-900">
              Message Assigned Responder
            </h3>
            <p className="text-[11px] text-gray-500">
              Send immediate field instruction or landmark information to {currentResponder.name}.
            </p>

            {messageSent ? (
              <div className="p-3 bg-emerald-50 text-emerald-700 text-xs rounded-xl text-center font-medium">
                Message transmitted to responder unit!
              </div>
            ) : (
              <form onSubmit={handleSendMessage} className="space-y-3">
                <textarea
                  rows={3}
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  placeholder="e.g. Waiting near the main entrance..."
                  className="w-full p-2.5 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#B41A46]"
                  autoFocus
                />
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowMessageModal(false)}
                    className="flex-1 py-2 border border-gray-200 text-gray-700 text-xs font-semibold rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!chatMessage.trim()}
                    className="flex-1 py-2 bg-[#B41A46] text-white text-xs font-semibold rounded-xl disabled:opacity-50"
                  >
                    Send
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
