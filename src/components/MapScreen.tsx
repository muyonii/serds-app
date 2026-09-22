import React, { useState } from 'react';
import { ArrowLeft, User } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Polyline } from 'react-leaflet';
import L from 'leaflet';

// Custom icons matching Page 23 of approved paper
const startIcon = L.divIcon({
  html: `
    <div class="flex flex-col items-center justify-end h-full">
      <div class="bg-white px-2.5 py-1 rounded-xl shadow-xs border border-gray-100 text-[11px] font-medium text-gray-500 whitespace-nowrap mb-1">Unit Dispatched</div>
      <div class="w-3.5 h-3.5 bg-white border-[3px] border-[#B41A46] rounded-full shadow-xs"></div>
    </div>
  `,
  className: '',
  iconSize: [120, 60],
  iconAnchor: [60, 60]
});

const endIcon = L.divIcon({
  html: `
    <div class="flex flex-col items-center justify-end h-full">
      <div class="bg-white px-2.5 py-1 rounded-xl shadow-xs border border-gray-100 text-[11px] font-medium text-gray-500 whitespace-nowrap mb-1">Emergency Site</div>
      <div class="w-3 h-3 bg-[#B41A46] rounded-full shadow-xs"></div>
    </div>
  `,
  className: '',
  iconSize: [120, 60],
  iconAnchor: [60, 60]
});

interface MapScreenProps {
  onBack: () => void;
  onCallClick?: () => void;
}

export default function MapScreen({ onBack, onCallClick }: MapScreenProps) {
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [messageSent, setMessageSent] = useState(false);

  // Municipal coordinates centered on Balanga City road network
  const center: [number, number] = [14.6780, 120.5390];
  const startLocation: [number, number] = [14.6735, 120.5340]; // Station / Unit
  const endLocation: [number, number] = [14.6815, 120.5425]; // Emergency Site
  
  // Dijkstra computed route path
  const routePoints: [number, number][] = [
    startLocation,
    [14.6750, 120.5360],
    [14.6775, 120.5385],
    [14.6795, 120.5410],
    endLocation
  ];

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

  return (
    <div className="flex flex-col h-full bg-[#FAFAFA] font-sans relative overflow-hidden">
      {/* Top Header Matching Paper Page 23 */}
      <div className="px-6 pt-6 pb-4 z-20 bg-white shadow-xs shrink-0">
        <div className="flex items-center justify-between mb-3">
          <button 
            onClick={onBack} 
            className="text-gray-900 p-1 -ml-1 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-sm font-semibold text-gray-900 absolute left-1/2 -translate-x-1/2">
            Emergency Place
          </h1>
          <div className="w-5" />
        </div>
        
        <h2 className="text-xl font-semibold text-gray-900 leading-snug tracking-tight">
          Shortest route<br />computed via Dijkstra
        </h2>
        <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">
          Dispatch intelligence active. Finding the most efficient emergency response unit for your location.
        </p>
      </div>

      {/* Map Area */}
      <div className="flex-1 relative bg-[#F5F2EC] overflow-hidden z-10">
        <MapContainer 
          center={center} 
          zoom={15} 
          zoomControl={false}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png"
          />
          
          <Marker position={startLocation} icon={startIcon} />
          <Marker position={endLocation} icon={endIcon} />
          
          <Polyline 
            positions={routePoints} 
            color="#B41A46" 
            weight={5} 
            opacity={0.9}
            lineCap="round"
            lineJoin="round"
          />
        </MapContainer>

        {/* Floating Bottom Card Matching Paper Page 23 */}
        <div className="absolute bottom-4 left-4 right-4 bg-white rounded-2xl shadow-lg border border-gray-100 p-4 z-[400]">
          {/* Responder Identity */}
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-9 h-9 bg-[#F9E8EC] rounded-full flex items-center justify-center shrink-0">
              <User className="w-4 h-4 text-[#B41A46]" />
            </div>
            <div>
              <h3 className="text-xs font-semibold text-gray-900">
                Ingredia Nutrisha (Paramedic)
              </h3>
              <p className="text-[10px] text-gray-400">
                Dispatched at: 11:59 PM &bull; Status: En Route
              </p>
            </div>
          </div>

          {/* 3 Metrics: Algorithm, Distance, Est. Time */}
          <div className="grid grid-cols-3 text-center py-2.5 my-2 border-y border-gray-100">
            <div>
              <span className="block text-[10px] text-gray-400 font-medium">Algorithm</span>
              <span className="text-xs font-semibold text-gray-800">Dijkstra</span>
            </div>
            <div>
              <span className="block text-[10px] text-gray-400 font-medium">Distance</span>
              <span className="text-xs font-semibold text-gray-800">0.68 km</span>
            </div>
            <div>
              <span className="block text-[10px] text-gray-400 font-medium">Est. Time</span>
              <span className="text-xs font-semibold text-gray-800">1 mins</span>
            </div>
          </div>

          {/* Dual Action Buttons Matching Paper Page 23: CALL and MESSAGE */}
          <div className="grid grid-cols-2 gap-3 mt-3">
            <button 
              type="button"
              onClick={() => {
                if (onCallClick) onCallClick();
                else window.location.href = 'tel:911';
              }}
              className="py-2.5 bg-[#B41A46] text-white rounded-xl font-semibold text-xs tracking-wider uppercase hover:bg-[#9a143a] active:scale-[0.99] transition-all text-center"
            >
              CALL
            </button>

            <button 
              type="button"
              onClick={() => setShowMessageModal(true)}
              className="py-2.5 bg-white border border-[#B41A46] text-[#B41A46] rounded-xl font-semibold text-xs tracking-wider uppercase hover:bg-rose-50 active:scale-[0.99] transition-all text-center"
            >
              MESSAGE
            </button>
          </div>
        </div>
      </div>

      {/* Message Modal for Direct Messaging Action */}
      {showMessageModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-6 z-[600]">
          <div className="bg-white rounded-2xl p-5 w-full max-w-xs shadow-xl space-y-3">
            <h3 className="text-xs font-semibold text-gray-900">
              Message Assigned Responder
            </h3>
            <p className="text-[11px] text-gray-500">
              Send immediate field instruction or landmark information to Ingredia Nutrisha.
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
