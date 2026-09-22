import React, { useState } from 'react';
import { 
  ArrowLeft, 
  MapPin, 
  Check, 
  Search, 
  Phone, 
  PhoneOff, 
  Radio, 
  Volume2, 
  VolumeX, 
  Clock, 
  Navigation, 
  AlertCircle,
  SlidersHorizontal,
  ChevronRight
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { useWebRTC } from '../contexts/WebRTCContext';

interface DispatcherDashboardProps {
  onBack: () => void;
}

interface IncidentItem {
  id: string;
  code: string;
  type: string;
  priority: 'critical' | 'urgent' | 'standard';
  location: string;
  reportedTime: string;
  patientName: string;
  recommendedUnit: string;
  distanceKm: number;
  etaMins: number;
  routeAlgorithm: string;
  status: 'pending' | 'dispatched' | 'on_scene';
  coords: [number, number];
}

const INITIAL_INCIDENTS: IncidentItem[] = [
  {
    id: 'CAD-1042',
    code: '10-79',
    type: 'Medical Emergency (Cardiac/Dyspnea)',
    priority: 'critical',
    location: '142 Rizal St, Poblacion, Balanga',
    reportedTime: '11:58 PM',
    patientName: 'Barry Allen (34M)',
    recommendedUnit: 'Unit 4 (Paramedic)',
    distanceKm: 1.18,
    etaMins: 3.5,
    routeAlgorithm: 'Dijkstra (Optimal Node Path)',
    status: 'pending',
    coords: [14.6780, 120.5390]
  },
  {
    id: 'CAD-1041',
    code: '10-70',
    type: 'Transformer Smoke / Structure Risk',
    priority: 'urgent',
    location: 'Capitol Compound, San Jose',
    reportedTime: '11:52 PM',
    patientName: 'Commercial Property',
    recommendedUnit: 'Engine 2 (BFP Balanga)',
    distanceKm: 2.45,
    etaMins: 5.8,
    routeAlgorithm: 'Dijkstra (Weighted Artery)',
    status: 'dispatched',
    coords: [14.6740, 120.5330]
  },
  {
    id: 'CAD-1039',
    code: '10-50',
    type: 'Vehicular Accident (Minor)',
    priority: 'standard',
    location: 'Roman Superhighway Junction',
    reportedTime: '11:45 PM',
    patientName: '2 Vehicles Involved',
    recommendedUnit: 'Patrol 7 (PNP Traffic)',
    distanceKm: 3.80,
    etaMins: 8.2,
    routeAlgorithm: 'Dijkstra (Highway Segment)',
    status: 'on_scene',
    coords: [14.6820, 120.5450]
  }
];

const incidentIcon = L.divIcon({
  html: `
    <div class="relative flex items-center justify-center">
      <span class="absolute w-6 h-6 rounded-full bg-rose-500/20 animate-ping"></span>
      <span class="w-3.5 h-3.5 rounded-full bg-rose-600 border-2 border-white shadow-sm"></span>
    </div>
  `,
  className: '',
  iconSize: [24, 24],
  iconAnchor: [12, 12]
});

const unitIcon = L.divIcon({
  html: `
    <div class="relative flex items-center justify-center">
      <span class="w-3.5 h-3.5 rounded-full bg-neutral-900 border-2 border-white shadow-sm"></span>
    </div>
  `,
  className: '',
  iconSize: [24, 24],
  iconAnchor: [12, 12]
});

export default function DispatcherDashboard({ onBack }: DispatcherDashboardProps) {
  const { incomingCalls, acceptCall, endCall, isConnected } = useWebRTC();
  const [incidents, setIncidents] = useState<IncidentItem[]>(INITIAL_INCIDENTS);
  const [selectedIncidentId, setSelectedIncidentId] = useState<string>('CAD-1042');
  const [filter, setFilter] = useState<'all' | 'critical' | 'active'>('all');
  const [audioMuted, setAudioMuted] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Center map on Balanga City, Bataan
  const center: [number, number] = [14.6760, 120.5375];
  const selectedIncident = incidents.find(i => i.id === selectedIncidentId) || incidents[0];

  const handleDispatch = (id: string) => {
    setIncidents(prev => prev.map(inc => 
      inc.id === id ? { ...inc, status: 'dispatched' as const } : inc
    ));
  };

  const filteredIncidents = incidents.filter(item => {
    if (filter === 'critical') return item.priority === 'critical';
    if (filter === 'active') return item.status === 'dispatched' || item.status === 'pending';
    if (searchQuery.trim()) {
      return item.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
             item.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
             item.id.toLowerCase().includes(searchQuery.toLowerCase());
    }
    return true;
  });

  return (
    <div className="flex h-screen w-full bg-neutral-100 text-neutral-900 font-sans overflow-hidden">
      {/* Top Application Bar */}
      <div className="fixed top-0 left-0 right-0 h-14 bg-white border-b border-neutral-200 z-30 flex items-center justify-between px-5 select-none">
        <div className="flex items-center space-x-4">
          <button 
            onClick={onBack}
            className="p-1.5 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors"
            title="Return to Login"
            aria-label="Back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          
          <div className="flex items-center space-x-2.5">
            <span className="font-semibold text-sm tracking-tight text-neutral-950">SERD</span>
            <span className="text-neutral-300 font-light">/</span>
            <span className="text-xs font-mono font-medium text-neutral-500 tracking-wide uppercase">CAD CONSOLE</span>
          </div>

          <div className="hidden md:flex items-center pl-3 border-l border-neutral-200 text-xs text-neutral-500 space-x-3 font-mono">
            <span className="flex items-center">
              <span className="w-2 h-2 rounded-full bg-emerald-500 mr-1.5"></span>
              SECTOR 01 • BALANGA CENTRAL
            </span>
            <span className="text-neutral-300">|</span>
            <span className="flex items-center text-neutral-600">
              <Radio className="w-3 h-3 mr-1 text-emerald-600" />
              WEBRTC MESH ONLINE
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter ID, unit, location..."
              className="pl-8 pr-3 py-1.5 bg-neutral-50 border border-neutral-200 rounded-lg text-xs font-medium text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:bg-white focus:border-neutral-400 w-52 transition-colors"
            />
          </div>

          <button 
            onClick={() => setAudioMuted(!audioMuted)}
            className={`p-2 rounded-lg border text-xs transition-colors ${
              audioMuted 
                ? 'bg-neutral-100 border-neutral-200 text-neutral-400' 
                : 'bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-50'
            }`}
            title={audioMuted ? "Unmute Dispatch Radio" : "Mute Dispatch Radio"}
          >
            {audioMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>

          <div className="flex items-center pl-2 border-l border-neutral-200 text-xs font-mono text-neutral-500">
            <Clock className="w-3.5 h-3.5 mr-1 text-neutral-400" />
            <span>23:59:12 PHT</span>
          </div>
        </div>
      </div>

      {/* Main CAD Workspace */}
      <div className="flex flex-1 pt-14 h-full overflow-hidden">
        {/* Left Column: Incident Stream & WebRTC Link */}
        <div className="w-[440px] flex flex-col h-full bg-white border-r border-neutral-200 shrink-0 overflow-hidden z-10">
          
          {/* Incoming & Active WebRTC Calls HUD */}
          {incomingCalls.length > 0 && (
            <div className="p-3.5 bg-rose-50 border-b border-rose-200">
              {incomingCalls.map(call => (
                <div key={call.citizenId} className="flex flex-col space-y-2.5">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-rose-600 text-white tracking-wide uppercase">
                          INCOMING SOS CALL
                        </span>
                        <span className="text-[11px] font-mono text-rose-700">Citizen #{call.citizenId.slice(0, 6)}</span>
                      </div>
                      <p className="text-xs text-rose-950 font-medium mt-1 flex items-center">
                        <MapPin className="w-3 h-3 mr-1 text-rose-500 shrink-0" />
                        {call.location || 'Quezon Blvd / Rizal Street'}
                      </p>
                    </div>

                    <div className="flex items-center space-x-1 py-1">
                      <span className="w-1 h-3 bg-rose-500 rounded-full animate-pulse"></span>
                      <span className="w-1 h-4 bg-rose-600 rounded-full animate-pulse delay-75"></span>
                      <span className="w-1 h-2 bg-rose-500 rounded-full animate-pulse delay-150"></span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 pt-1">
                    <button
                      onClick={() => acceptCall(call.citizenId)}
                      className="flex-1 flex items-center justify-center space-x-1.5 bg-emerald-600 hover:bg-emerald-700 text-white py-2 px-3 rounded-lg text-xs font-medium transition-colors"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>Answer Audio Channel</span>
                    </button>
                    <button
                      onClick={endCall}
                      className="px-3 py-2 bg-white hover:bg-neutral-50 text-neutral-700 border border-neutral-200 rounded-lg text-xs font-medium transition-colors"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {isConnected && (
            <div className="p-3 bg-emerald-50 border-b border-emerald-200 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping"></span>
                <div>
                  <p className="text-xs font-semibold text-emerald-950">Audio Link Active</p>
                  <p className="text-[11px] font-mono text-emerald-700">Opus 48kHz • Full Duplex</p>
                </div>
              </div>
              <button
                onClick={endCall}
                className="flex items-center space-x-1 bg-rose-600 hover:bg-rose-700 text-white text-xs px-3 py-1.5 rounded-md font-medium transition-colors"
              >
                <PhoneOff className="w-3 h-3" />
                <span>Disconnect</span>
              </button>
            </div>
          )}

          {/* Incident Queue Header & Filters */}
          <div className="p-4 border-b border-neutral-100 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <h2 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">Queue</h2>
              <span className="px-1.5 py-0.5 rounded text-[11px] font-mono bg-neutral-100 text-neutral-600">
                {filteredIncidents.length}
              </span>
            </div>

            <div className="flex items-center space-x-1 bg-neutral-100 p-0.5 rounded-lg text-[11px] font-medium text-neutral-600">
              <button
                onClick={() => setFilter('all')}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  filter === 'all' ? 'bg-white text-neutral-950 shadow-xs' : 'hover:text-neutral-950'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter('critical')}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  filter === 'critical' ? 'bg-white text-neutral-950 shadow-xs' : 'hover:text-neutral-950'
                }`}
              >
                Priority 1
              </button>
              <button
                onClick={() => setFilter('active')}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  filter === 'active' ? 'bg-white text-neutral-950 shadow-xs' : 'hover:text-neutral-950'
                }`}
              >
                Active
              </button>
            </div>
          </div>

          {/* Scannable Incident List */}
          <div className="flex-1 overflow-y-auto divide-y divide-neutral-100">
            {filteredIncidents.map(inc => {
              const isSelected = inc.id === selectedIncidentId;
              return (
                <div
                  key={inc.id}
                  onClick={() => setSelectedIncidentId(inc.id)}
                  className={`p-4 cursor-pointer transition-colors relative ${
                    isSelected 
                      ? 'bg-neutral-50/80 border-l-2 border-neutral-900' 
                      : 'hover:bg-neutral-50 border-l-2 border-transparent'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-xs font-semibold text-neutral-900">{inc.id}</span>
                      <span className="text-neutral-300">•</span>
                      <span className="font-mono text-[11px] text-neutral-500">{inc.code}</span>
                      {inc.priority === 'critical' && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-rose-50 text-rose-700 border border-rose-200">
                          PRIORITY 1
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] font-mono text-neutral-400">{inc.reportedTime}</span>
                  </div>

                  <h3 className="text-sm font-medium text-neutral-900 leading-snug">
                    {inc.type}
                  </h3>

                  <p className="text-xs text-neutral-500 mt-1 flex items-center">
                    <MapPin className="w-3 h-3 mr-1 text-neutral-400 shrink-0" />
                    <span className="truncate">{inc.location}</span>
                  </p>

                  {/* Dijkstra Route Telemetry Badge */}
                  <div className="mt-3 pt-2.5 border-t border-neutral-100/80 flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-1.5 text-neutral-600 font-mono text-[11px]">
                      <span className="text-neutral-400">ASSIGN:</span>
                      <span className="font-semibold text-neutral-800">{inc.recommendedUnit}</span>
                    </div>

                    <div className="flex items-center space-x-2 font-mono text-[11px] text-neutral-500">
                      <span>{inc.distanceKm} km</span>
                      <span>•</span>
                      <span className="font-semibold text-neutral-800">{inc.etaMins}m ETA</span>
                    </div>
                  </div>

                  {isSelected && inc.status === 'pending' && (
                    <div className="mt-3 flex items-center space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDispatch(inc.id);
                        }}
                        className="flex-1 bg-neutral-900 hover:bg-neutral-800 text-white py-1.5 px-3 rounded-lg text-xs font-medium flex items-center justify-center space-x-1.5 transition-colors"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Confirm Dispatch via Dijkstra</span>
                      </button>
                    </div>
                  )}

                  {inc.status === 'dispatched' && (
                    <div className="mt-2.5 flex items-center justify-between text-[11px] font-mono text-amber-700 bg-amber-50/80 px-2.5 py-1 rounded">
                      <span className="flex items-center">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5"></span>
                        UNIT EN ROUTE
                      </span>
                      <span>SPEED: 44 KM/H</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Operator Footer Status */}
          <div className="p-3 border-t border-neutral-200 bg-neutral-50/50 flex items-center justify-between text-xs text-neutral-500">
            <span className="font-mono text-[11px]">OPERATOR: DISP-04 (CENTRAL)</span>
            <span className="font-mono text-[11px] text-emerald-600 font-medium">CAD ACTIVE</span>
          </div>
        </div>

        {/* Center/Right: Interactive Map & Tactical Telemetry */}
        <div className="flex-1 flex flex-col h-full relative overflow-hidden bg-neutral-200">
          
          {/* Leaflet GIS Map */}
          <div className="w-full h-full relative">
            <MapContainer
              center={center}
              zoom={15}
              zoomControl={false}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {/* Incidents Markers */}
              {incidents.map(inc => (
                <Marker 
                  key={inc.id} 
                  position={inc.coords} 
                  icon={incidentIcon}
                />
              ))}

              {/* Responder Unit Marker */}
              <Marker position={[14.6720, 120.5350]} icon={unitIcon} />

              {/* Computed Dijkstra Route to Selected Incident */}
              <Polyline
                positions={[
                  [14.6720, 120.5350],
                  [14.6750, 120.5370],
                  selectedIncident.coords
                ]}
                color="#0f172a"
                weight={4}
                opacity={0.8}
                dashArray="6, 6"
              />
            </MapContainer>

            {/* Minimalist Tactical Overlay Header */}
            <div className="absolute top-4 left-4 z-[400] bg-white/95 backdrop-blur-xs border border-neutral-200 rounded-xl p-3 shadow-xs max-w-sm">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-mono font-semibold text-neutral-900">{selectedIncident.id}</span>
                <span className="font-mono text-[10px] text-neutral-500">DIJKSTRA PATH VERIFIED</span>
              </div>
              <p className="text-xs font-medium text-neutral-700 truncate">{selectedIncident.location}</p>
              <div className="mt-2 pt-2 border-t border-neutral-100 flex items-center space-x-3 text-[11px] font-mono text-neutral-500">
                <span>SEGMENTS: 4</span>
                <span>•</span>
                <span>COST: 1.18 KM</span>
                <span>•</span>
                <span className="text-emerald-600 font-medium">TRAFFIC: LOW</span>
              </div>
            </div>

            {/* Fleet Status Dock */}
            <div className="absolute bottom-4 left-4 right-4 z-[400] bg-white/95 backdrop-blur-xs border border-neutral-200 rounded-xl p-3 shadow-xs flex items-center justify-between">
              <div className="flex items-center space-x-6">
                <div>
                  <span className="text-[10px] font-mono uppercase text-neutral-400 block">Assigned Unit</span>
                  <span className="text-xs font-medium text-neutral-900">{selectedIncident.recommendedUnit}</span>
                </div>
                <div className="border-l border-neutral-200 pl-6">
                  <span className="text-[10px] font-mono uppercase text-neutral-400 block">Telemetry ETA</span>
                  <span className="text-xs font-mono font-medium text-neutral-900">{selectedIncident.etaMins} mins</span>
                </div>
                <div className="border-l border-neutral-200 pl-6 hidden md:block">
                  <span className="text-[10px] font-mono uppercase text-neutral-400 block">Routing Engine</span>
                  <span className="text-xs font-mono text-neutral-600">{selectedIncident.routeAlgorithm}</span>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button 
                  onClick={() => handleDispatch(selectedIncident.id)}
                  disabled={selectedIncident.status === 'dispatched'}
                  className={`text-xs px-3.5 py-2 rounded-lg font-medium transition-colors ${
                    selectedIncident.status === 'dispatched'
                      ? 'bg-neutral-100 text-neutral-400 cursor-default'
                      : 'bg-neutral-900 hover:bg-neutral-800 text-white'
                  }`}
                >
                  {selectedIncident.status === 'dispatched' ? 'Dispatched' : 'Deploy Selected Unit'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
