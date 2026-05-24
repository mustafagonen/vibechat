import React, { useState, useEffect } from 'react';
import { X, Settings, Shield, Moon, Sun, Check, RefreshCw, Database } from 'lucide-react';

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

export default function SettingsModal({ onClose, currentTheme, onThemeToggle, bgDimLevel, onBgDimChange }) {
  const [activeTab, setActiveTab] = useState('firebase'); // 'firebase' | 'theme'
  const [config, setConfig] = useState({
    apiKey: '',
    authDomain: '',
    projectId: '',
    storageBucket: '',
    messagingSenderId: '',
    appId: ''
  });
  const [isFirebase, setIsFirebase] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const checkStatus = async () => {
      const { chatService, getSavedFirebaseConfig } = await import('../services/firebase');
      setIsFirebase(chatService.isFirebase());
      
      const saved = getSavedFirebaseConfig();
      if (saved) {
        setConfig(saved);
      }
    };
    checkStatus();
  }, []);

  const handleChange = (key, value) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const handleSaveConfig = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatusMessage('');

    try {
      const { saveFirebaseConfig, chatService } = await import('../services/firebase');
      const success = saveFirebaseConfig(config);
      
      if (!success) {
        throw new Error('Lütfen tüm alanları geçerli şekilde doldurun.');
      }

      // Reinitialize firebase
      const isConnected = await chatService.reinitialize();
      setIsFirebase(isConnected);

      if (isConnected) {
        setStatusMessage('Firebase başarıyla bağlandı ve kaydedildi!');
      } else {
        setStatusMessage('Firebase bağlantısı başarısız. Lütfen bilgileri kontrol edin.');
      }
    } catch (err) {
      setStatusMessage(err.message || 'Kaydetme sırasında bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const handleClearConfig = async () => {
    setLoading(true);
    setStatusMessage('');
    try {
      const { clearFirebaseConfig, chatService } = await import('../services/firebase');
      clearFirebaseConfig();
      setConfig({
        apiKey: '',
        authDomain: '',
        projectId: '',
        storageBucket: '',
        messagingSenderId: '',
        appId: ''
      });
      
      const isConnected = await chatService.reinitialize();
      setIsFirebase(isConnected);
      setStatusMessage('Firebase ayarları temizlendi. Yerel Demo moduna geçildi.');
    } catch (err) {
      setStatusMessage('Temizleme hatası.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade flex-center" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: 'rgba(0, 0, 0, 0.7)',
      backdropFilter: 'blur(8px)',
      zIndex: 9999,
      padding: '20px'
    }}>
      <div 
        className="glass-panel" 
        style={{
          width: '100%',
          maxWidth: '520px',
          background: 'var(--bg-secondary)',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90vh',
          overflow: 'hidden',
          border: '1px solid var(--border-color)'
        }}
      >
        {/* Modal Header */}
        <div style={{
          padding: '18px 24px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Settings size={20} style={{ color: 'var(--accent-primary)' }} />
            <h3 style={{ fontSize: '1.2rem', fontWeight: 600 }}>Ayarlar</h3>
          </div>
          <button onClick={onClose} className="btn-icon" style={{ border: 'none', width: '32px', height: '32px' }}>
            <X size={18} />
          </button>
        </div>

        {/* Modal Navigation */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid var(--border-color)',
          background: 'rgba(0,0,0,0.08)'
        }}>
          <button 
            onClick={() => setActiveTab('firebase')}
            style={{
              flex: 1,
              padding: '14px',
              background: activeTab === 'firebase' ? 'var(--bg-secondary)' : 'transparent',
              border: 'none',
              borderBottom: activeTab === 'firebase' ? '2px solid var(--accent-primary)' : 'none',
              color: activeTab === 'firebase' ? 'var(--text-primary)' : 'var(--text-secondary)',
              fontWeight: 500,
              fontSize: '0.9rem',
              cursor: 'pointer'
            }}
          >
            <Database size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
            Firebase Bağlantısı
          </button>
          <button 
            onClick={() => setActiveTab('theme')}
            style={{
              flex: 1,
              padding: '14px',
              background: activeTab === 'theme' ? 'var(--bg-secondary)' : 'transparent',
              border: 'none',
              borderBottom: activeTab === 'theme' ? '2px solid var(--accent-primary)' : 'none',
              color: activeTab === 'theme' ? 'var(--text-primary)' : 'var(--text-secondary)',
              fontWeight: 500,
              fontSize: '0.9rem',
              cursor: 'pointer'
            }}
          >
            <Moon size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
            Görünüm
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
          {activeTab === 'firebase' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Connection Status Banner */}
              <div style={{
                background: isFirebase ? 'rgba(16, 185, 129, 0.08)' : 'rgba(6, 182, 212, 0.08)',
                border: isFirebase ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid rgba(6, 182, 212, 0.2)',
                borderRadius: 'var(--radius-md)',
                padding: '14px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div className={`status-dot ${isFirebase ? 'online' : 'waiting'}`} />
                  <div>
                    <span style={{ fontSize: '0.88rem', fontWeight: 600, display: 'block' }}>
                      {isFirebase ? 'Firebase Aktif' : 'Yerel Demo Modu Aktif'}
                    </span>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                      {isFirebase ? 'Veriler Firestore\'a yazılıyor.' : 'Veriler tarayıcı belleğinde kalır.'}
                    </span>
                  </div>
                </div>
              </div>

              {statusMessage && (
                <div className="animate-fade" style={{
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.85rem',
                  background: statusMessage.includes('başarılı') || statusMessage.includes('kaydedildi')
                    ? 'rgba(16, 185, 129, 0.1)'
                    : 'rgba(239, 68, 68, 0.1)',
                  border: statusMessage.includes('başarılı') || statusMessage.includes('kaydedildi')
                    ? '1px solid rgba(16, 185, 129, 0.2)'
                    : '1px solid rgba(239, 68, 68, 0.2)',
                  color: statusMessage.includes('başarılı') || statusMessage.includes('kaydedildi')
                    ? 'var(--accent-green)'
                    : 'var(--accent-red)'
                }}>
                  {statusMessage}
                </div>
              )}

              <form onSubmit={handleSaveConfig} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>API Key</label>
                    <input 
                      type="text" 
                      value={config.apiKey} 
                      onChange={(e) => handleChange('apiKey', e.target.value)} 
                      placeholder="AIzaSy..." 
                      className="form-input"
                      required
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Auth Domain</label>
                    <input 
                      type="text" 
                      value={config.authDomain} 
                      onChange={(e) => handleChange('authDomain', e.target.value)} 
                      placeholder="proj-id.firebaseapp.com" 
                      className="form-input"
                      required
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Project ID</label>
                    <input 
                      type="text" 
                      value={config.projectId} 
                      onChange={(e) => handleChange('projectId', e.target.value)} 
                      placeholder="proj-id" 
                      className="form-input"
                      required
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Storage Bucket</label>
                    <input 
                      type="text" 
                      value={config.storageBucket} 
                      onChange={(e) => handleChange('storageBucket', e.target.value)} 
                      placeholder="proj-id.appspot.com" 
                      className="form-input"
                      required
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Sender ID</label>
                    <input 
                      type="text" 
                      value={config.messagingSenderId} 
                      onChange={(e) => handleChange('messagingSenderId', e.target.value)} 
                      placeholder="1234567890" 
                      className="form-input"
                      required
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>App ID</label>
                    <input 
                      type="text" 
                      value={config.appId} 
                      onChange={(e) => handleChange('appId', e.target.value)} 
                      placeholder="1:12345:web:abcd" 
                      className="form-input"
                      required
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                  <button 
                    type="submit" 
                    className="btn-primary" 
                    style={{ flex: 1, padding: '10px 16px', fontSize: '0.88rem' }}
                    disabled={loading}
                  >
                    {loading ? <RefreshCw className="animate-spin" size={16} /> : 'Kaydet ve Bağlan'}
                  </button>
                  
                  {isFirebase && (
                    <button 
                      type="button" 
                      onClick={handleClearConfig}
                      className="btn-secondary" 
                      style={{ padding: '10px 16px', fontSize: '0.88rem', color: 'var(--accent-red)' }}
                      disabled={loading}
                    >
                      Ayarları Temizle
                    </button>
                  )}
                </div>
              </form>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* Theme Selector */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingBottom: '16px',
                borderBottom: '1px solid var(--border-color)'
              }}>
                <div>
                  <span style={{ fontSize: '0.92rem', fontWeight: 600, display: 'block' }}>Koyu Tema / Açık Tema</span>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Arayüz görünüm modunu değiştirin.</span>
                </div>
                <button 
                  onClick={onThemeToggle} 
                  className="btn-icon" 
                  style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-full)' }}
                >
                  {currentTheme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                </button>
              </div>

              {/* Dimming Level Selector */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                paddingBottom: '16px',
                borderBottom: '1px solid var(--border-color)'
              }}>
                <div>
                  <span style={{ fontSize: '0.92rem', fontWeight: 600, display: 'block' }}>Gecenin Karanlığı (Hextech Dimmer)</span>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Tüm ekranın kararma seviyesi (Lvl 1 - 5). Seviye 5 en karanlık ve okuması zor olanıdır.</span>
                </div>
                
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginTop: '4px' }}>
                  {sunLevels.map(({ level, icon, tooltip }) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => onBgDimChange(level)}
                      className="btn-secondary"
                      style={{
                        flex: 1,
                        padding: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: bgDimLevel === level ? 'var(--accent-gradient)' : 'rgba(0,0,0,0.15)',
                        border: bgDimLevel === level ? 'none' : '1px solid var(--border-color)',
                        color: bgDimLevel === level ? '#fff' : 'var(--text-primary)',
                        borderRadius: 'var(--radius-md)',
                        boxShadow: bgDimLevel === level ? '0 4px 12px rgba(244, 63, 94, 0.35)' : 'none',
                        cursor: 'pointer',
                        transition: 'all var(--transition-fast)'
                      }}
                      title={tooltip}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                <p>💡 LuluChat modern şeffaf glassmorphism tasarımı ile oluşturulmuştur. Koyu modda loş siyah ve ateşli bordo renkleri, açık modda ise sıcak krem tonları hakimdir.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
