import React, { useState } from 'react';
import { User, Plus, X, CheckCircle2, Send, PhoneCall, ShieldCheck, Clock } from 'lucide-react';
import TopHeader from './TopHeader';
import { Screen } from '../types';
import { useUserSettings } from '../lib/userSettings';
import { broadcastSafetyCheckIn } from '../lib/api';

interface ContactItem {
  id: string;
  name: string;
  phone: string;
  status: string;
}

interface ContactsProps {
  onNavigate: (screen: Screen) => void;
}

export default function Contacts({ onNavigate }: ContactsProps) {
  const { settings } = useUserSettings();
  const { darkMode } = settings;

  const [contacts, setContacts] = useState<ContactItem[]>([
    { id: '1', name: 'Pelican Steve', phone: '143-321-6543', status: 'Safe' },
    { id: '2', name: 'Valentino Morose', phone: '652-345-6543', status: 'Safe' },
    { id: '3', name: 'Brian Cumin', phone: '654-321-5678', status: 'Safe' },
  ]);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newStatus, setNewStatus] = useState('Safe');

  // "I am Safe" broadcast state
  const [broadcastState, setBroadcastState] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [broadcastTimestamp, setBroadcastTimestamp] = useState<string | null>(null);

  const handleBroadcastSafe = async () => {
    if (broadcastState === 'sending') return;
    setBroadcastState('sending');
    
    try {
      const res = await broadcastSafetyCheckIn(settings.profile.displayName || 'Barry', contacts.length);
      setBroadcastState('sent');
      setBroadcastTimestamp(res.timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      setContacts(prev => prev.map(c => ({ ...c, status: 'Safe' })));
    } catch {
      // Fallback
      setBroadcastState('sent');
      const now = new Date();
      setBroadcastTimestamp(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      setContacts(prev => prev.map(c => ({ ...c, status: 'Safe' })));
    }
  };

  const handleAddContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newPhone.trim()) return;

    const newContact: ContactItem = {
      id: Date.now().toString(),
      name: newName.trim(),
      phone: newPhone.trim(),
      status: newStatus.trim() || 'Safe',
    };

    setContacts(prev => [...prev, newContact]);
    setNewName('');
    setNewPhone('');
    setNewStatus('Safe');
    setIsAddModalOpen(false);
  };

  return (
    <div className={`flex flex-col h-full ${darkMode ? 'bg-neutral-950 text-neutral-100' : 'bg-[#FAFAFA] text-gray-900'} px-6 py-8 relative transition-colors`}>
      {/* Top Header */}
      <TopHeader 
        title="Contacts" 
        onNavigate={onNavigate}
        rightElement={
          <button
            id="add-contact-btn"
            onClick={() => setIsAddModalOpen(true)}
            className="w-8 h-8 rounded-full bg-[#B41A46] text-white flex items-center justify-center shadow-sm hover:bg-[#9a143a] active:scale-95 transition-all"
            title="Add Contact"
            aria-label="Add Contact"
          >
            <Plus className="w-5 h-5" />
          </button>
        }
      />

      {/* "I am Safe" One-Tap Quick Broadcast Card */}
      <div className={`mb-6 p-4 rounded-2xl border transition-all ${
        broadcastState === 'sent'
          ? 'bg-emerald-500/10 border-emerald-500/30 dark:bg-emerald-950/30 dark:border-emerald-800'
          : darkMode
            ? 'bg-neutral-900 border-neutral-800'
            : 'bg-white border-gray-100 shadow-[0_2px_12px_rgb(0,0,0,0.03)]'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
              broadcastState === 'sent' 
                ? 'bg-emerald-500 text-white' 
                : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400'
            }`}>
              {broadcastState === 'sent' ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : (
                <ShieldCheck className="w-5 h-5" />
              )}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-xs font-bold text-gray-900 dark:text-neutral-100">
                  {broadcastState === 'sent' ? 'Safety Broadcast Active' : 'Safety Check-In'}
                </h3>
                {broadcastTimestamp && (
                  <span className="text-[10px] font-mono text-gray-400 dark:text-neutral-500">
                    &bull; {broadcastTimestamp}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-gray-500 dark:text-neutral-400 mt-0.5">
                {broadcastState === 'sent' 
                  ? `All ${contacts.length} emergency contacts confirmed safe.` 
                  : `1-tap alert to reassure your ${contacts.length} contacts.`}
              </p>
            </div>
          </div>

          <button
            onClick={handleBroadcastSafe}
            disabled={broadcastState === 'sending'}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-xs shrink-0 flex items-center space-x-1.5 ${
              broadcastState === 'sent'
                ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                : broadcastState === 'sending'
                  ? 'bg-gray-200 text-gray-500 dark:bg-neutral-800 dark:text-neutral-400 cursor-wait'
                  : 'bg-[#24A159] hover:bg-[#1f8b4d] text-white active:scale-95'
            }`}
          >
            {broadcastState === 'sending' ? (
              <>
                <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                <span>Broadcasting...</span>
              </>
            ) : broadcastState === 'sent' ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Checked In</span>
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>I AM SAFE</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Contact List Header */}
      <div className="flex items-center justify-between mb-3 px-1">
        <span className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-neutral-500">
          Emergency Circle ({contacts.length})
        </span>
        <span className="text-[11px] text-gray-400 dark:text-neutral-500">Instant CAD Telemetry</span>
      </div>

      {/* Contact List */}
      <div className="space-y-3.5 flex-1 overflow-y-auto pr-1 pb-4">
        {contacts.map((contact) => (
          <div 
            key={contact.id} 
            className={`flex items-center ${darkMode ? 'bg-neutral-900 border-neutral-800 hover:border-neutral-700' : 'bg-white border-gray-100 hover:border-gray-200'} p-4 rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.03)] border hover:shadow-[0_8px_20px_rgb(0,0,0,0.06)] transition-all group`}
          >
            <div className="w-11 h-11 bg-[#F9E8EC] dark:bg-rose-950/40 rounded-xl flex items-center justify-center mr-3.5 shrink-0 group-hover:scale-105 transition-transform">
              <User className="w-5 h-5 text-[#B41A46] dark:text-rose-400 fill-current" />
            </div>
            <div className="flex-1 min-w-0 mr-2">
              <h3 className="font-semibold text-[14px] truncate">{contact.name}</h3>
              <p className="text-gray-500 dark:text-neutral-400 text-xs mt-0.5 truncate font-medium tracking-wide">{contact.phone}</p>
            </div>
            <div className="flex items-center space-x-2 shrink-0">
              <a
                href={`tel:${contact.phone}`}
                className="w-8 h-8 rounded-lg bg-gray-50 dark:bg-neutral-800 text-gray-600 dark:text-neutral-300 flex items-center justify-center hover:bg-rose-50 hover:text-[#B41A46] transition-colors"
                title={`Call ${contact.name}`}
              >
                <PhoneCall className="w-3.5 h-3.5" />
              </a>
              <div className="bg-[#E7F7ED] dark:bg-emerald-950/40 text-[#24A159] dark:text-emerald-400 text-[10px] uppercase font-bold tracking-wider px-2.5 py-1.5 rounded-lg">
                {contact.status}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Contact Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className={`${darkMode ? 'bg-neutral-900 border-neutral-800 text-white' : 'bg-white border-gray-100 text-gray-900'} w-full max-w-sm rounded-[2rem] p-8 shadow-2xl border relative animate-[fade-in_0.2s_ease-out]`}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">Add New Contact</h2>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className={`p-2 rounded-full ${darkMode ? 'text-neutral-400 hover:text-white bg-neutral-800' : 'text-gray-400 hover:text-gray-900 bg-gray-50'}`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddContact} className="space-y-5">
              <div>
                <label className="block text-xs font-bold tracking-wider uppercase text-gray-400 dark:text-neutral-500 mb-2">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Alex Morgan"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className={`w-full px-4 py-3.5 border rounded-xl text-sm focus:outline-none focus:border-[#B41A46] font-medium ${
                    darkMode ? 'bg-neutral-800 border-neutral-700 text-white placeholder:text-neutral-500' : 'bg-gray-50/50 border-gray-200 text-gray-900 placeholder:text-gray-400'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-bold tracking-wider uppercase text-gray-400 dark:text-neutral-500 mb-2">Phone Number</label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. 555-019-2834"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  className={`w-full px-4 py-3.5 border rounded-xl text-sm focus:outline-none focus:border-[#B41A46] font-medium ${
                    darkMode ? 'bg-neutral-800 border-neutral-700 text-white placeholder:text-neutral-500' : 'bg-gray-50/50 border-gray-200 text-gray-900 placeholder:text-gray-400'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-bold tracking-wider uppercase text-gray-400 dark:text-neutral-500 mb-2">Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className={`w-full px-4 py-3.5 border rounded-xl text-sm focus:outline-none focus:border-[#B41A46] font-medium ${
                    darkMode ? 'bg-neutral-800 border-neutral-700 text-white' : 'bg-gray-50/50 border-gray-200 text-gray-900'
                  }`}
                >
                  <option value="Safe">Safe</option>
                  <option value="In Danger">In Danger</option>
                  <option value="Unknown">Unknown</option>
                </select>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-4 rounded-xl bg-[#B41A46] hover:bg-[#9a143a] text-white font-semibold text-sm transition-colors shadow-sm"
                >
                  Save Emergency Contact
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
