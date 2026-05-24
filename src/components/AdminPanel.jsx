import React, { useState, useEffect } from 'react';
import { Shield, Lock, Eye, LogOut, Loader, BookOpen, Clock, Users, ArrowLeft, Image as ImageIcon, X } from 'lucide-react';

export default function AdminPanel({ onExit }) {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState('');
  const [rooms, setRooms] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [roomMessages, setRoomMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [zoomImage, setZoomImage] = useState(null);

  const correctPassword = '01Mtt71!!!';

  const handleLogin = (e) => {
    e.preventDefault();
    setError('');

    if (password === correctPassword) {
      setIsAuthenticated(true);
      loadDisbandedRooms();
    } else {
      setError('Erişim Reddedildi! Geçersiz Hextech Arşiv Anahtarı.');
    }
  };

  const loadDisbandedRooms = async () => {
    setLoadingRooms(true);
    try {
      const { chatService } = await import('../services/firebase');
      const disbanded = await chatService.getDisbandedRooms();
      setRooms(disbanded);
    } catch (err) {
      console.error('Odalar yüklenemedi:', err);
    } finally {
      setLoadingRooms(false);
    }
  };

  const handleInspectRoom = async (room) => {
    setSelectedRoom(room);
    setLoadingMessages(true);
    try {
      const { chatService } = await import('../services/firebase');
      const messages = await chatService.getRoomMessages(room.id);
      setRoomMessages(messages);
    } catch (err) {
      console.error('Mesajlar yüklenemedi:', err);
    } finally {
      setLoadingMessages(false);
    }
  };

  const formatDateTime = (isoString) => {
    if (!isoString) return 'Bilinmiyor';
    const date = new Date(isoString);
    return date.toLocaleString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Render 1: Admin Authentication Screen
  if (!isAuthenticated) {
    return (
      <div className="auth-card glass-panel animate-slide-up" style={{ padding: '40px', maxWidth: '440px', width: '100%' }}>
        <div className="flex-center" style={{ flexDirection: 'column', marginBottom: '30px' }}>
          <div className="flex-center" style={{
            width: '64px',
            height: '64px',
            background: 'var(--accent-gradient)',
            borderRadius: 'var(--radius-full)',
            color: '#fff',
            marginBottom: '16px',
            boxShadow: '0 8px 24px rgba(244, 63, 94, 0.3)'
          }}>
            <Shield size={32} />
          </div>
          <h1 style={{ fontSize: '1.8rem', marginBottom: '8px', color: 'var(--text-primary)', textAlign: 'center' }}>luluoynamiyorum Arşivi</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textAlign: 'center' }}>
            Hextech Günlükleri & Lobi Geçmişi Portalı
          </p>
        </div>

        {error && (
          <div className="animate-fade" style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            color: 'var(--accent-red)',
            padding: '12px 16px',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.88rem',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <Shield size={16} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Lock size={14} /> Hextech Arşiv Şifresi
            </label>
            <input
              type="password"
              placeholder="Şifreyi girin..."
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="form-input"
              required
            />
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
            <button type="button" onClick={onExit} className="btn-secondary" style={{ flex: 1 }}>
              Geri Dön
            </button>
            <button type="submit" className="btn-primary" style={{ flex: 1.5 }}>
              Arşivi Aç <Eye size={16} />
            </button>
          </div>
        </form>
      </div>
    );
  }

  // Render 2: Admin Dashboard (Rooms List)
  return (
    <div className="glass-panel animate-fade" style={{
      display: 'flex',
      flexDirection: 'column',
      width: '100%',
      height: '100%',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        padding: '18px 24px',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'rgba(0, 0, 0, 0.05)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div className="flex-center" style={{
            width: '40px',
            height: '40px',
            background: 'rgba(245, 158, 11, 0.1)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--accent-cyan)'
          }}>
            <Shield size={20} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Hextech Lobi Arşivi</h3>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Kapanan ve Dağıtılan Sihirdar Lobileri</span>
          </div>
        </div>

        <button 
          onClick={onExit} 
          className="btn-secondary" 
          style={{ padding: '8px 14px', fontSize: '0.85rem' }}
        >
          <LogOut size={14} /> Panelden Çık
        </button>
      </div>

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
        
        {/* Left Side: Disbanded Rooms List */}
        <div style={{
          width: selectedRoom ? '45%' : '100%',
          borderRight: selectedRoom ? '1px solid var(--border-color)' : 'none',
          overflowY: 'auto',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
          transition: 'width var(--transition-normal)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
              Kayıtlı Savaş Lobileri ({rooms.length})
            </span>
            <button onClick={loadDisbandedRooms} disabled={loadingRooms} className="btn-icon" style={{ width: '32px', height: '32px' }} title="Tazele">
              {loadingRooms ? <Loader size={14} className="animate-spin" /> : <RefreshCwIcon size={14} />}
            </button>
          </div>

          {rooms.length === 0 ? (
            <div className="flex-center" style={{ flexDirection: 'column', height: '200px', color: 'var(--text-muted)', gap: '10px' }}>
              <Clock size={28} />
              <p style={{ fontSize: '0.88rem' }}>{loadingRooms ? 'Lobiler yükleniyor...' : 'Kapanmış veya dağıtılmış bir lobi kaydı bulunamadı.'}</p>
            </div>
          ) : (
            rooms.map((room) => {
              const isSelected = selectedRoom?.id === room.id;
              return (
                <div 
                  key={room.id}
                  onClick={() => handleInspectRoom(room)}
                  style={{
                    background: isSelected ? 'rgba(244, 63, 94, 0.08)' : 'rgba(0, 0, 0, 0.15)',
                    border: isSelected ? '1px solid rgba(244, 63, 94, 0.3)' : '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    padding: '16px',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    transition: 'all var(--transition-fast)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--accent-primary)', fontSize: '0.95rem' }}>
                      #{room.id}
                    </span>
                    <span style={{
                      background: 'rgba(133, 114, 117, 0.15)',
                      color: 'var(--text-secondary)',
                      fontSize: '0.7rem',
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-full)',
                      fontWeight: 500
                    }}>
                      Kapandı
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                    <Users size={14} style={{ color: 'var(--text-muted)' }} />
                    <span style={{ fontWeight: 600 }}>{room.creatorName}</span> 
                    <span style={{ color: 'var(--text-muted)' }}>&</span>
                    <span style={{ fontWeight: 600 }}>{room.joinedName || 'Bağlantısız'}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={12} /> {formatDateTime(room.createdAt)}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--accent-primary)' }}>
                      Günlüğü Oku <BookOpen size={12} />
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Side: Message logs for the selected room */}
        {selectedRoom ? (
          <div className="animate-fade" style={{
            width: '55%',
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            background: 'rgba(0, 0, 0, 0.1)'
          }}>
            {/* Log Header */}
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'rgba(0,0,0,0.15)'
            }}>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--accent-primary)', fontWeight: 700, fontFamily: 'monospace' }}>
                  #{selectedRoom.id} ARŞİVİ
                </span>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {selectedRoom.creatorName} & {selectedRoom.joinedName || 'Ortağı Yok'} Sohbeti
                </h4>
              </div>
              <button 
                onClick={() => setSelectedRoom(null)} 
                className="btn-icon" 
                style={{ width: '32px', height: '32px', border: 'none' }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Log Messages List */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              {loadingMessages ? (
                <div className="flex-center" style={{ flexDirection: 'column', height: '100%', color: 'var(--text-muted)', gap: '10px' }}>
                  <Loader className="animate-spin" size={24} />
                  <span style={{ fontSize: '0.85rem' }}>Hextech günlükleri deşifre ediliyor...</span>
                </div>
              ) : roomMessages.length === 0 ? (
                <div className="flex-center" style={{ height: '100%', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  Bu lobide herhangi bir konuşma kaydı bulunamadı.
                </div>
              ) : (
                roomMessages.map((msg) => {
                  const isCreatorMsg = msg.sender === selectedRoom.creatorName;
                  return (
                    <div 
                      key={msg.id}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: isCreatorMsg ? 'flex-start' : 'flex-end',
                        background: 'rgba(0, 0, 0, 0.15)',
                        border: '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-md)',
                        padding: '10px 14px',
                        maxWidth: '85%',
                        alignSelf: isCreatorMsg ? 'flex-start' : 'flex-end'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', gap: '30px', marginBottom: '4px' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: isCreatorMsg ? 'var(--accent-primary)' : 'var(--accent-cyan)' }}>
                          {msg.sender}
                        </span>
                        <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                          {formatDateTime(msg.timestamp)}
                        </span>
                      </div>

                      {msg.image && (
                        <div style={{
                          maxWidth: '120px',
                          maxHeight: '120px',
                          borderRadius: 'var(--radius-sm)',
                          overflow: 'hidden',
                          cursor: 'zoom-in',
                          marginBlock: '6px'
                        }} onClick={() => setZoomImage(msg.image)}>
                          <img src={msg.image} alt="Log media" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                      )}

                      {msg.text && (
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-primary)', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                          {msg.text}
                        </p>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        ) : (
          <div className="flex-center" style={{
            width: '55%',
            height: '100%',
            color: 'var(--text-muted)',
            flexDirection: 'column',
            gap: '8px'
          }}>
            <BookOpen size={32} />
            <p style={{ fontSize: '0.88rem' }}>Konuşma geçmişini incelemek için sol listeden bir savaş lobisi seçin.</p>
          </div>
        )}
      </div>

      {/* Image Zoom Modal for Admin Viewer */}
      {zoomImage && (
        <div 
          className="animate-fade flex-center"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(0,0,0,0.85)',
            backdropFilter: 'blur(10px)',
            zIndex: 99999,
            padding: '40px'
          }}
          onClick={() => setZoomImage(null)}
        >
          <button 
            onClick={() => setZoomImage(null)} 
            className="btn-icon" 
            style={{ position: 'absolute', top: '20px', right: '20px', background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff' }}
          >
            <X size={20} />
          </button>
          <img 
            src={zoomImage} 
            alt="Zoomed log" 
            style={{
              maxWidth: '90%',
              maxHeight: '80%',
              objectFit: 'contain',
              borderRadius: 'var(--radius-md)'
            }}
          />
        </div>
      )}
    </div>
  );
}

// Simple Refresh icon component inline helper
function RefreshCwIcon({ size = 16, className = "" }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
      <path d="M3 21v-5h5" />
    </svg>
  );
}
