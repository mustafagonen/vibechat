import React, { useState, useEffect } from 'react';
import Auth from './components/Auth';
import ChatArea from './components/ChatArea';
import SettingsModal from './components/SettingsModal';
import AdminPanel from './components/AdminPanel';
import { Settings, Shield, Sun } from 'lucide-react';

// Sun icons representing 5 stages of brightness
const SunLevel1 = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.35 }}>
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const SunLevel2 = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.6 }}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M2 12h2M20 12h2" />
  </svg>
);

const SunLevel3 = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.8 }}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
  </svg>
);

const SunLevel4 = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5" />
    <path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3M4.22 19.78l2.12-2.12M17.66 5.64l2.12-2.12" />
  </svg>
);

const SunLevel5 = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--accent-cyan)' }}>
    <circle cx="12" cy="12" r="5" />
    <path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3M4.22 19.78l2.12-2.12M17.66 5.64l2.12-2.12" />
  </svg>
);

const sunLevels = [
  { level: 5, icon: <SunLevel1 />, tooltip: 'Çok Karanlık (Lvl 5)' },
  { level: 4, icon: <SunLevel2 />, tooltip: 'Karanlık (Lvl 4)' },
  { level: 3, icon: <SunLevel3 />, tooltip: 'Loş (Lvl 3)' },
  { level: 2, icon: <SunLevel4 />, tooltip: 'Aydınlık (Lvl 2)' },
  { level: 1, icon: <SunLevel5 />, tooltip: 'Çok Aydınlık (Lvl 1)' }
];

export default function App() {
  const [roomState, setRoomState] = useState(null);
  const [nickname, setNickname] = useState('');
  const [role, setRole] = useState('');
  const [urlRoomId, setUrlRoomId] = useState('');
  const [isAdminRoute, setIsAdminRoute] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [bgDimLevel, setBgDimLevel] = useState(() => {
    return Number(localStorage.getItem('luluchat_bg_dim')) || 1;
  });
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('luluchat_theme') || 'dark';
  });
  const [isControlCenterCollapsed, setIsControlCenterCollapsed] = useState(false);

  // Extract roomId or admin route from URL if present on load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const room = params.get('room');
    const admin = params.get('admin');
    
    if (admin === 'true') {
      setIsAdminRoute(true);
    } else if (room) {
      setUrlRoomId(room);
    }
  }, []);

  // Sync background brightness dimming level
  useEffect(() => {
    localStorage.setItem('luluchat_bg_dim', bgDimLevel);
  }, [bgDimLevel]);

  // Sync theme attribute with document body
  useEffect(() => {
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('luluchat_theme', theme);
  }, [theme]);

  // Real-time listener to room document updates (handles status transitions & deletion)
  useEffect(() => {
    let unsubscribe = () => {};

    if (roomState && roomState.id) {
      const listenRoom = async () => {
        const { chatService } = await import('./services/firebase');
        unsubscribe = chatService.listenToRoom(roomState.id, (updatedRoom) => {
          if (!updatedRoom || updatedRoom.status === 'disbanded') {
            setRoomState(null);
            setNickname('');
            setRole('');
            setUrlRoomId('');
            const cleanUrl = `${window.location.origin}${window.location.pathname}`;
            window.history.pushState({ path: cleanUrl }, '', cleanUrl);
          } else {
            setRoomState(updatedRoom);
          }
        });
      };
      listenRoom();
    }

    return () => unsubscribe();
  }, [roomState?.id]);

  const handleJoin = ({ room, nickname, role }) => {
    setRoomState(room);
    setNickname(nickname);
    setRole(role);
    
    // Set query parameter in URL without reloading
    const newUrl = `${window.location.origin}${window.location.pathname}?room=${room.id}`;
    window.history.pushState({ path: newUrl }, '', newUrl);
  };

  const handleLeaveRoom = async () => {
    if (roomState) {
      try {
        const { chatService } = await import('./services/firebase');
        await chatService.leaveRoom(roomState.id, nickname);
      } catch (err) {
        console.error('Lobi terk edilirken hata:', err);
      }
    }
    
    setRoomState(null);
    setNickname('');
    setRole('');
    setUrlRoomId('');
    
    // Clear URL parameters
    const cleanUrl = `${window.location.origin}${window.location.pathname}`;
    window.history.pushState({ path: cleanUrl }, '', cleanUrl);
  };

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const handleExitAdmin = () => {
    setIsAdminRoute(false);
    // Clear URL parameters
    const cleanUrl = `${window.location.origin}${window.location.pathname}`;
    window.history.pushState({ path: cleanUrl }, '', cleanUrl);
  };

  return (
    <div className="flex-center" style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      
      {/* App Container */}
      <div className="app-container">
        {isAdminRoute ? (
          <AdminPanel onExit={handleExitAdmin} />
        ) : roomState === null ? (
          <Auth onJoin={handleJoin} urlRoomId={urlRoomId} />
        ) : (
          <ChatArea 
            roomState={roomState} 
            nickname={nickname} 
            onLeave={handleLeaveRoom} 
          />
        )}
      </div>

      {/* Hextech Global Control Center Panel */}
      {isControlCenterCollapsed ? (
        <button 
          onClick={() => setIsControlCenterCollapsed(false)}
          className="glass-panel"
          style={{
            position: 'fixed',
            top: '24px',
            left: '24px',
            zIndex: 950,
            padding: '10px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
            fontSize: '0.75rem',
            fontWeight: 700,
            color: 'var(--accent-primary)',
            background: 'var(--bg-glass)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-sm)'
          }}
          title="Gecenin Karanlığı Kısayollarını Aç"
        >
          <Sun size={14} style={{ color: 'var(--accent-primary)' }} />
          <span>KARANLIK</span>
        </button>
      ) : (
        <div className="glass-panel" style={{
          position: 'fixed',
          top: '24px',
          left: '24px',
          zIndex: 950,
          padding: '12px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          background: 'var(--bg-glass)',
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--shadow-md)',
          fontSize: '0.82rem',
          textAlign: 'left'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Sun size={14} style={{ color: 'var(--accent-primary)' }} />
              <span style={{ fontWeight: 700, letterSpacing: '0.5px', color: 'var(--text-primary)', fontSize: '0.78rem' }}>GECENİN KARANLIĞI</span>
            </div>
            <button 
              onClick={() => setIsControlCenterCollapsed(true)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                fontSize: '0.68rem',
                fontWeight: 'bold',
                textDecoration: 'underline'
              }}
              title="Küçült"
            >
              [Gizle]
            </button>
          </div>

          {/* Brightness dimmer shortcut using growing Sun icons */}
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginTop: '4px' }}>
            {sunLevels.map(({ level, icon, tooltip }) => (
              <button
                key={level}
                type="button"
                onClick={() => setBgDimLevel(level)}
                className="btn-secondary"
                style={{
                  padding: '8px',
                  background: bgDimLevel === level ? 'var(--accent-gradient)' : 'rgba(0,0,0,0.15)',
                  border: bgDimLevel === level ? 'none' : '1px solid var(--border-color)',
                  color: bgDimLevel === level ? '#fff' : 'var(--text-primary)',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all var(--transition-fast)',
                  boxShadow: bgDimLevel === level ? '0 3px 8px rgba(244, 63, 94, 0.3)' : 'none'
                }}
                title={tooltip}
              >
                {icon}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Floating Settings Button */}
      <button 
        onClick={() => setIsSettingsOpen(true)} 
        className="btn-icon glass-panel"
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 900,
          background: 'var(--bg-glass)',
          width: '48px',
          height: '48px',
          borderRadius: 'var(--radius-full)',
          boxShadow: 'var(--shadow-md)'
        }}
        title="Ayarlar"
      >
        <Settings size={20} />
      </button>

      {/* Settings Modal overlay */}
      {isSettingsOpen && (
        <SettingsModal 
          onClose={() => setIsSettingsOpen(false)} 
          currentTheme={theme}
          onThemeToggle={toggleTheme}
          bgDimLevel={bgDimLevel}
          onBgDimChange={setBgDimLevel}
        />
      )}

      {/* Global System-Wide Brightness Overlay */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: '#000000',
        opacity: bgDimLevel === 1 ? 0 : 
                 bgDimLevel === 2 ? 0.35 : 
                 bgDimLevel === 3 ? 0.60 : 
                 bgDimLevel === 4 ? 0.82 : 0.95,
        pointerEvents: 'none',
        zIndex: 999999, // Higher than all other layers to dim the entire screen
        transition: 'opacity var(--transition-normal)'
      }} />
    </div>
  );
}
