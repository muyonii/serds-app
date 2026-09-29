import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import SignUp from './components/SignUp';
import MainLayout from './components/MainLayout';
import Home from './components/Home';
import Contacts from './components/Contacts';
import Profile from './components/Profile';
import MapScreen from './components/MapScreen';
import ChatAssistant from './components/ChatAssistant';
import DispatcherDashboard from './components/DispatcherDashboard';
import ResponderView from './components/ResponderView';
import AdminPanel from './components/AdminPanel';
import { Screen, Tab } from './types';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('login');
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [initialChatMessage, setInitialChatMessage] = useState<string>('');
  const [mapAutoDispatch, setMapAutoDispatch] = useState<boolean>(false);

  // Early pre-cache real device GPS location so the map screen opens instantly without placeholder coordinates
  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = [pos.coords.latitude, pos.coords.longitude];
          try {
            sessionStorage.setItem('serd_real_user_location', JSON.stringify(coords));
            localStorage.setItem('serd_real_user_location', JSON.stringify(coords));
          } catch {}
        },
        () => {},
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      );
    }
  }, []);

  const handleNavigate = (screen: Screen | any) => {
    if (screen === 'home' || screen === 'contacts' || screen === 'profile') {
      setCurrentScreen('main');
      setActiveTab(screen);
    } else if (screen === 'map' || screen === 'mapTab') {
      setMapAutoDispatch(false);
      setCurrentScreen('main');
      setActiveTab('mapTab');
    } else {
      setCurrentScreen(screen);
    }
  };

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    setCurrentScreen('main');
  };

  const isDesktop = currentScreen === 'dispatcher' || currentScreen === 'admin';

  return (
    <>
      {isDesktop ? (
        <div className="w-full min-h-screen bg-gray-50 text-gray-900 font-sans flex relative">
          {currentScreen === 'dispatcher' && <DispatcherDashboard onBack={() => setCurrentScreen('login')} />}
          {currentScreen === 'admin' && <AdminPanel onBack={() => setCurrentScreen('login')} />}
        </div>
      ) : (
        <div className="w-full h-[100dvh] bg-white overflow-hidden relative flex flex-col font-sans">
          {currentScreen === 'login' && <Login onNavigate={handleNavigate} />}
          {currentScreen === 'signup' && <SignUp onNavigate={handleNavigate} />}
          
          {currentScreen === 'main' && (
            <MainLayout activeTab={activeTab} onTabChange={handleTabChange}>
              {activeTab === 'home' && (
                <Home 
                  onSOSClick={(auto) => {
                    setMapAutoDispatch(!!auto);
                    setActiveTab('mapTab');
                  }} 
                  onChatClick={(msg?: string) => {
                    if (msg) setInitialChatMessage(msg);
                    else setInitialChatMessage('');
                    setCurrentScreen('chat');
                  }}
                  onNavigate={handleNavigate}
                />
              )}
              {activeTab === 'mapTab' && (
                <MapScreen 
                  autoDispatch={mapAutoDispatch}
                  onBack={() => {
                    setMapAutoDispatch(false);
                    setActiveTab('home');
                  }} 
                />
              )}
              {activeTab === 'contacts' && <Contacts onNavigate={handleNavigate} />}
              {activeTab === 'profile' && <Profile onNavigate={handleNavigate} />}
            </MainLayout>
          )}

          {currentScreen === 'map' && (
            <MainLayout activeTab="mapTab" onTabChange={handleTabChange}>
              <MapScreen 
                autoDispatch={mapAutoDispatch}
                onBack={() => {
                  setMapAutoDispatch(false);
                  setCurrentScreen('main');
                  setActiveTab('home');
                }} 
              />
            </MainLayout>
          )}

          {currentScreen === 'chat' && <ChatAssistant initialMessage={initialChatMessage} onBack={() => setCurrentScreen('main')} />}
          {currentScreen === 'responder' && <ResponderView onBack={() => setCurrentScreen('login')} />}
        </div>
      )}
    </>
  );
}
