import React, { useState } from 'react';
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

  const handleNavigate = (screen: Screen | any) => {
    if (screen === 'home' || screen === 'contacts' || screen === 'profile') {
      setCurrentScreen('main');
      setActiveTab(screen);
    } else if (screen === 'mapTab') {
      setCurrentScreen('map');
    } else {
      setCurrentScreen(screen);
    }
  };

  const handleTabChange = (tab: Tab) => {
    if (tab === 'mapTab') {
      setCurrentScreen('map');
    } else {
      setActiveTab(tab);
    }
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
                  onSOSClick={() => setCurrentScreen('map')} 
                  onChatClick={(msg?: string) => {
                    if (msg) setInitialChatMessage(msg);
                    else setInitialChatMessage('');
                    setCurrentScreen('chat');
                  }}
                  onNavigate={handleNavigate}
                />
              )}
              {activeTab === 'contacts' && <Contacts onNavigate={handleNavigate} />}
              {activeTab === 'profile' && <Profile onNavigate={handleNavigate} />}
            </MainLayout>
          )}

          {currentScreen === 'map' && <MapScreen onBack={() => setCurrentScreen('main')} />}
          {currentScreen === 'chat' && <ChatAssistant initialMessage={initialChatMessage} onBack={() => setCurrentScreen('main')} />}
          {currentScreen === 'responder' && <ResponderView onBack={() => setCurrentScreen('login')} />}
        </div>
      )}
    </>
  );
}
