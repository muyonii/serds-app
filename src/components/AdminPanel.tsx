import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Search, 
  Network, 
  Users, 
  Activity, 
  FileSpreadsheet, 
  Check, 
  AlertTriangle, 
  Clock, 
  Download,
  Filter,
  RefreshCw,
  Layers,
  Settings2
} from 'lucide-react';

interface AdminPanelProps {
  onBack: () => void;
}

interface GraphEdge {
  id: string;
  source: string;
  target: string;
  distanceMeters: number;
  weightMultiplier: number;
  status: 'clear' | 'congested' | 'blocked';
}

interface PersonnelRecord {
  id: string;
  name: string;
  role: 'Dispatcher' | 'Paramedic' | 'Firefighter' | 'Police';
  unit: string;
  sector: string;
  status: 'On Duty' | 'En Route' | 'Standby' | 'Offline';
  batteryPct: number;
  lastCheckin: string;
}

interface AuditLog {
  timestamp: string;
  event: string;
  actor: string;
  details: string;
  level: 'info' | 'warn' | 'success';
}

const INITIAL_EDGES: GraphEdge[] = [
  { id: 'E-01', source: 'Node 1 (Plaza Mayor)', target: 'Node 2 (Capitol Compound)', distanceMeters: 850, weightMultiplier: 1.0, status: 'clear' },
  { id: 'E-02', source: 'Node 2 (Capitol Compound)', target: 'Node 3 (Rizal St Junction)', distanceMeters: 620, weightMultiplier: 1.0, status: 'clear' },
  { id: 'E-03', source: 'Node 3 (Rizal St Junction)', target: 'Node 4 (Bataan Gen Hospital)', distanceMeters: 1200, weightMultiplier: 1.0, status: 'clear' },
  { id: 'E-04', source: 'Node 1 (Plaza Mayor)', target: 'Node 5 (Roman Superhighway)', distanceMeters: 2100, weightMultiplier: 1.2, status: 'congested' },
  { id: 'E-05', source: 'Node 2 (Capitol Compound)', target: 'Node 6 (San Jose Elementary)', distanceMeters: 740, weightMultiplier: 1.0, status: 'clear' },
];

const INITIAL_PERSONNEL: PersonnelRecord[] = [
  { id: 'PRS-04', name: 'Alpha 4 (Ingredia Nutrisha)', role: 'Paramedic', unit: 'Ambulance 04', sector: 'Sector 1 (Central)', status: 'En Route', batteryPct: 88, lastCheckin: '1 min ago' },
  { id: 'PRS-02', name: 'Engine 2 (Capt. R. Santos)', role: 'Firefighter', unit: 'Pumper Truck 02', sector: 'Sector 2 (San Jose)', status: 'Standby', batteryPct: 94, lastCheckin: '3 mins ago' },
  { id: 'PRS-07', name: 'Patrol 7 (Off. M. David)', role: 'Police', unit: 'Cruiser 07', sector: 'Roman Superhighway', status: 'On Duty', batteryPct: 76, lastCheckin: 'Just now' },
  { id: 'DSP-01', name: 'Operator C. Rivera', role: 'Dispatcher', unit: 'Console 01', sector: 'HQ Operations', status: 'On Duty', batteryPct: 100, lastCheckin: 'Connected' },
  { id: 'PRS-09', name: 'Medic 9 (J. Bautista)', role: 'Paramedic', unit: 'Ambulance 09', sector: 'Sector 3 (Puerto Rivas)', status: 'Offline', batteryPct: 15, lastCheckin: '2 hours ago' },
];

const AUDIT_LOGS: AuditLog[] = [
  { timestamp: '23:58:44', event: 'Dijkstra Route Recalculated', actor: 'Routing Engine', details: 'Cost recalculated for Incident CAD-1042 (Unit 4 optimal: 1.18 km)', level: 'success' },
  { timestamp: '23:57:12', event: 'WebRTC Signaling Peer Bound', actor: 'Signaling Gateway', details: 'Peer connection established for citizen ID: #8410', level: 'info' },
  { timestamp: '23:55:04', event: 'Emergency SOS Broadcast', actor: 'Citizen Portal', details: 'Critical alert initiated at Rizal St, Balanga', level: 'warn' },
  { timestamp: '23:42:19', event: 'Graph Edge Weight Altered', actor: 'Admin AD-01', details: 'Set Edge E-04 weight to 1.2x (Traffic advisory)', level: 'info' },
  { timestamp: '23:30:00', event: 'Telemetry Ping Cycle Complete', actor: 'System Daemon', details: 'All 8 field units synced within 240ms delta', level: 'success' },
];

export default function AdminPanel({ onBack }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<'topology' | 'telemetry' | 'personnel' | 'logs'>('topology');
  const [edges, setEdges] = useState<GraphEdge[]>(INITIAL_EDGES);
  const [personnelFilter, setPersonnelFilter] = useState('');
  const [logNotification, setLogNotification] = useState<string | null>(null);

  const toggleEdgeStatus = (id: string) => {
    setEdges(prev => prev.map(edge => {
      if (edge.id !== id) return edge;
      const nextStatus = edge.status === 'clear' ? 'blocked' : edge.status === 'blocked' ? 'congested' : 'clear';
      const nextMultiplier = nextStatus === 'blocked' ? 99.0 : nextStatus === 'congested' ? 1.8 : 1.0;
      return { ...edge, status: nextStatus, weightMultiplier: nextMultiplier };
    }));
    setLogNotification(`Updated graph topology: Edge ${id} recalculating weights.`);
    setTimeout(() => setLogNotification(null), 3500);
  };

  const filteredPersonnel = INITIAL_PERSONNEL.filter(p => 
    p.name.toLowerCase().includes(personnelFilter.toLowerCase()) ||
    p.role.toLowerCase().includes(personnelFilter.toLowerCase()) ||
    p.unit.toLowerCase().includes(personnelFilter.toLowerCase())
  );

  return (
    <div className="flex h-screen w-full bg-neutral-100 text-neutral-900 font-sans overflow-hidden">
      {/* Structural Sidebar */}
      <aside className="w-64 bg-white border-r border-neutral-200 flex flex-col z-20 shrink-0">
        {/* Header */}
        <div className="h-14 px-5 border-b border-neutral-200 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="font-semibold text-sm tracking-tight text-neutral-950">SERD</span>
            <span className="text-neutral-300 font-light">/</span>
            <span className="text-xs font-mono text-neutral-500 uppercase">SYSADMIN</span>
          </div>
          <button 
            onClick={onBack}
            className="p-1 text-neutral-400 hover:text-neutral-900 rounded-md transition-colors"
            title="Return to Main"
            aria-label="Back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Rail */}
        <div className="p-3 space-y-1">
          <p className="px-3 py-2 text-[10px] font-mono uppercase text-neutral-400 font-semibold tracking-wider">
            Infrastructure & Logic
          </p>

          <button
            onClick={() => setActiveTab('topology')}
            className={`w-full flex items-center px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
              activeTab === 'topology' 
                ? 'bg-neutral-900 text-white' 
                : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
            }`}
          >
            <Network className="w-4 h-4 mr-2.5" />
            Road Network Graph
          </button>

          <button
            onClick={() => setActiveTab('telemetry')}
            className={`w-full flex items-center px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
              activeTab === 'telemetry' 
                ? 'bg-neutral-900 text-white' 
                : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
            }`}
          >
            <Activity className="w-4 h-4 mr-2.5" />
            System Health & Routing
          </button>

          <button
            onClick={() => setActiveTab('personnel')}
            className={`w-full flex items-center px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
              activeTab === 'personnel' 
                ? 'bg-neutral-900 text-white' 
                : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
            }`}
          >
            <Users className="w-4 h-4 mr-2.5" />
            Personnel & Fleet
          </button>

          <button
            onClick={() => setActiveTab('logs')}
            className={`w-full flex items-center px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
              activeTab === 'logs' 
                ? 'bg-neutral-900 text-white' 
                : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 mr-2.5" />
            Audit Ledger
          </button>
        </div>

        {/* System Daemon Status Footer */}
        <div className="mt-auto p-4 border-t border-neutral-200 bg-neutral-50/50">
          <div className="flex items-center justify-between text-[11px] font-mono text-neutral-500 mb-1">
            <span>CORE SOLVER</span>
            <span className="text-emerald-600 font-semibold">DIJKSTRA v2.4</span>
          </div>
          <div className="w-full bg-neutral-200 h-1 rounded-full overflow-hidden">
            <div className="bg-emerald-500 h-full w-[98%]"></div>
          </div>
          <p className="text-[10px] text-neutral-400 mt-2 font-mono">NODE RELAY: BALANGA-RTK-01</p>
        </div>
      </aside>

      {/* Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-neutral-50">
        {/* Top Header Strip */}
        <header className="h-14 px-8 bg-white border-b border-neutral-200 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <h1 className="text-sm font-semibold text-neutral-900">
              {activeTab === 'topology' && 'Graph Topology & Edge Weight Management'}
              {activeTab === 'telemetry' && 'System Performance & Routing Engine Telemetry'}
              {activeTab === 'personnel' && 'Active Responder Fleet & Personnel Directory'}
              {activeTab === 'logs' && 'Immutable Event Ledger & Dispatch Audit Trail'}
            </h1>
            {logNotification && (
              <span className="text-xs font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded animate-fade-in">
                {logNotification}
              </span>
            )}
          </div>

          <div className="flex items-center space-x-3 text-xs font-mono text-neutral-500">
            <span className="flex items-center">
              <span className="w-2 h-2 rounded-full bg-emerald-500 mr-1.5"></span>
              CLUSTER: ONLINE
            </span>
            <span>•</span>
            <span>UPTIME: 99.98%</span>
          </div>
        </header>

        {/* Tab 1: Road Network Graph (Dijkstra Topology) */}
        {activeTab === 'topology' && (
          <div className="flex-1 p-8 overflow-y-auto space-y-6">
            <div className="bg-white border border-neutral-200 rounded-xl p-5">
              <div className="flex items-start justify-between pb-4 border-b border-neutral-100 mb-4">
                <div>
                  <h2 className="text-sm font-semibold text-neutral-900">Balanga City Graph Representation</h2>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    Edges and vertex weights directly compute the shortest response paths used by the Dispatcher and Mobile Responder.
                  </p>
                </div>
                <div className="flex items-center space-x-2 text-xs font-mono">
                  <span className="px-2 py-1 bg-neutral-100 rounded text-neutral-700">6 Vertices</span>
                  <span className="px-2 py-1 bg-neutral-100 rounded text-neutral-700">{edges.length} Directed Edges</span>
                </div>
              </div>

              {/* Edge Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-neutral-200 text-neutral-400 font-mono uppercase text-[10px]">
                      <th className="py-2.5 font-medium">Edge ID</th>
                      <th className="py-2.5 font-medium">Source Vertex</th>
                      <th className="py-2.5 font-medium">Target Vertex</th>
                      <th className="py-2.5 font-medium">Metric Distance</th>
                      <th className="py-2.5 font-medium">Current Cost Multiplier</th>
                      <th className="py-2.5 font-medium">Status</th>
                      <th className="py-2.5 font-medium text-right">Simulation Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 font-mono">
                    {edges.map(edge => (
                      <tr key={edge.id} className="hover:bg-neutral-50/80 transition-colors">
                        <td className="py-3 font-semibold text-neutral-900">{edge.id}</td>
                        <td className="py-3 text-neutral-700 font-sans">{edge.source}</td>
                        <td className="py-3 text-neutral-700 font-sans">{edge.target}</td>
                        <td className="py-3 text-neutral-500">{edge.distanceMeters} m</td>
                        <td className="py-3">
                          <span className={edge.weightMultiplier > 1 ? 'text-rose-600 font-semibold' : 'text-neutral-700'}>
                            {edge.weightMultiplier.toFixed(1)}x
                          </span>
                        </td>
                        <td className="py-3 font-sans">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-medium ${
                            edge.status === 'clear' 
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                              : edge.status === 'congested'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}>
                            {edge.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-3 text-right">
                          <button
                            onClick={() => toggleEdgeStatus(edge.id)}
                            className="px-2.5 py-1 text-[11px] bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded font-sans transition-colors"
                          >
                            Toggle Hazard / Flood
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Dijkstra Heuristic Controls */}
            <div className="bg-white border border-neutral-200 rounded-xl p-5">
              <h3 className="text-xs font-bold text-neutral-900 uppercase tracking-wider mb-2">Algorithm Hyperparameters</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2 text-xs">
                <div>
                  <label className="block text-neutral-500 font-medium mb-1">Path Heuristic Priority</label>
                  <select className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-2 font-mono text-neutral-800 text-xs focus:outline-none focus:bg-white">
                    <option>Pure Dijkstra (Euclidean Distance)</option>
                    <option>Traffic-Weighted Dijkstra (Real-Time Cost)</option>
                    <option>Emergency Velocity Biased (Clearance Priority)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-neutral-500 font-medium mb-1">Graph Recalculation Cadence</label>
                  <select className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-2 font-mono text-neutral-800 text-xs focus:outline-none focus:bg-white">
                    <option>1000 ms (High-frequency Telemetry)</option>
                    <option>5000 ms (Standard Operation)</option>
                    <option>On Incident Creation Only</option>
                  </select>
                </div>

                <div>
                  <label className="block text-neutral-500 font-medium mb-1">Max Graph Search Depth</label>
                  <input 
                    type="number" 
                    defaultValue={128} 
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-2 font-mono text-neutral-800 text-xs focus:outline-none focus:bg-white" 
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: System Health & Routing Telemetry */}
        {activeTab === 'telemetry' && (
          <div className="flex-1 p-8 overflow-y-auto space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Telemetry Matrix */}
              <div className="bg-white border border-neutral-200 rounded-xl p-5">
                <h3 className="text-xs font-bold text-neutral-900 uppercase tracking-wider mb-4">Real-Time Service Nodes</h3>
                <div className="divide-y divide-neutral-100 text-xs font-mono">
                  <div className="py-2.5 flex items-center justify-between">
                    <span className="text-neutral-500">Dijkstra Routing Engine</span>
                    <span className="text-emerald-600 font-semibold">14ms latency • OK</span>
                  </div>
                  <div className="py-2.5 flex items-center justify-between">
                    <span className="text-neutral-500">WebRTC Audio Signaling Mesh</span>
                    <span className="text-emerald-600 font-semibold">PeerJS Relay • Connected</span>
                  </div>
                  <div className="py-2.5 flex items-center justify-between">
                    <span className="text-neutral-500">Leaflet OpenStreetMap Cache</span>
                    <span className="text-neutral-800 font-semibold">99.4% hit rate</span>
                  </div>
                  <div className="py-2.5 flex items-center justify-between">
                    <span className="text-neutral-500">GPS Differential Correction (RTK)</span>
                    <span className="text-emerald-600 font-semibold">±1.2m precision</span>
                  </div>
                </div>
              </div>

              {/* Response Time Distribution */}
              <div className="bg-white border border-neutral-200 rounded-xl p-5">
                <h3 className="text-xs font-bold text-neutral-900 uppercase tracking-wider mb-4">Response Time Latency Breakdown</h3>
                <div className="space-y-3 font-mono text-xs">
                  <div>
                    <div className="flex justify-between text-neutral-600 mb-1">
                      <span>P50 Response (Median)</span>
                      <span className="font-semibold text-neutral-900">3.2 minutes</span>
                    </div>
                    <div className="w-full bg-neutral-100 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-emerald-500 h-full w-[45%]"></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-neutral-600 mb-1">
                      <span>P90 Response (Critical Target)</span>
                      <span className="font-semibold text-neutral-900">4.8 minutes</span>
                    </div>
                    <div className="w-full bg-neutral-100 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-neutral-800 h-full w-[70%]"></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-neutral-600 mb-1">
                      <span>P99 Outlier</span>
                      <span className="font-semibold text-neutral-900">6.4 minutes</span>
                    </div>
                    <div className="w-full bg-neutral-100 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-rose-500 h-full w-[85%]"></div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* Tab 3: Personnel & Fleet */}
        {activeTab === 'personnel' && (
          <div className="flex-1 p-8 overflow-y-auto space-y-6">
            <div className="bg-white border border-neutral-200 rounded-xl p-5">
              <div className="flex items-center justify-between pb-4 border-b border-neutral-100 mb-4">
                <div className="relative w-72">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <input
                    type="text"
                    value={personnelFilter}
                    onChange={(e) => setPersonnelFilter(e.target.value)}
                    placeholder="Search personnel or unit..."
                    className="w-full pl-8 pr-3 py-1.5 bg-neutral-50 border border-neutral-200 rounded-lg text-xs font-medium text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:bg-white"
                  />
                </div>

                <div className="text-xs text-neutral-500 font-mono">
                  Active Units: {INITIAL_PERSONNEL.filter(p => p.status !== 'Offline').length} / {INITIAL_PERSONNEL.length}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-neutral-200 text-neutral-400 font-mono uppercase text-[10px]">
                      <th className="py-2.5 font-medium">Responder ID</th>
                      <th className="py-2.5 font-medium">Name</th>
                      <th className="py-2.5 font-medium">Assigned Vehicle</th>
                      <th className="py-2.5 font-medium">Assigned Sector</th>
                      <th className="py-2.5 font-medium">Status</th>
                      <th className="py-2.5 font-medium">Battery</th>
                      <th className="py-2.5 font-medium text-right">Heartbeat</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {filteredPersonnel.map(record => (
                      <tr key={record.id} className="hover:bg-neutral-50/80 transition-colors">
                        <td className="py-3 font-mono font-semibold text-neutral-900">{record.id}</td>
                        <td className="py-3 font-medium text-neutral-900">{record.name}</td>
                        <td className="py-3 font-mono text-neutral-600">{record.unit}</td>
                        <td className="py-3 text-neutral-600">{record.sector}</td>
                        <td className="py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-medium ${
                            record.status === 'On Duty' 
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : record.status === 'En Route'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : record.status === 'Standby'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-neutral-100 text-neutral-500'
                          }`}>
                            {record.status}
                          </span>
                        </td>
                        <td className="py-3 font-mono text-neutral-600">{record.batteryPct}%</td>
                        <td className="py-3 font-mono text-neutral-400 text-right">{record.lastCheckin}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Audit Ledger */}
        {activeTab === 'logs' && (
          <div className="flex-1 p-8 overflow-y-auto space-y-6">
            <div className="bg-white border border-neutral-200 rounded-xl p-5">
              <div className="flex items-center justify-between pb-4 border-b border-neutral-100 mb-4">
                <div>
                  <h2 className="text-sm font-semibold text-neutral-900">Incident & Dispatch System Audit Trail</h2>
                  <p className="text-xs text-neutral-500 mt-0.5">Chronological record of routing triggers, telemetry handshakes, and dispatcher authorizations.</p>
                </div>
                <button
                  onClick={() => alert("Exporting audit CSV log...")}
                  className="flex items-center space-x-1.5 px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-xs font-medium transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export CSV Log</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="border-b border-neutral-200 text-neutral-400 uppercase text-[10px]">
                      <th className="py-2.5 font-medium">Timestamp</th>
                      <th className="py-2.5 font-medium">Event</th>
                      <th className="py-2.5 font-medium">Actor</th>
                      <th className="py-2.5 font-medium">Diagnostic Details</th>
                      <th className="py-2.5 font-medium text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {AUDIT_LOGS.map((log, index) => (
                      <tr key={index} className="hover:bg-neutral-50/80 transition-colors">
                        <td className="py-3 text-neutral-400">{log.timestamp}</td>
                        <td className="py-3 font-semibold text-neutral-900 font-sans">{log.event}</td>
                        <td className="py-3 text-neutral-600">{log.actor}</td>
                        <td className="py-3 text-neutral-500 font-sans">{log.details}</td>
                        <td className="py-3 text-right">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                            log.level === 'success' 
                              ? 'bg-emerald-50 text-emerald-700' 
                              : log.level === 'warn'
                              ? 'bg-rose-50 text-rose-700'
                              : 'bg-neutral-100 text-neutral-700'
                          }`}>
                            {log.level}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
