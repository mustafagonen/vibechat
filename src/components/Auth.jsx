import React, { useState, useEffect } from 'react';
import { ArrowRight, Link, Shield, User, Copy, Check } from 'lucide-react';

export default function Auth({ onJoin, urlRoomId }) {
  const [isJoinMode, setIsJoinMode] = useState(!!urlRoomId);
  const [nickname, setNickname] = useState('');
  const [roomId, setRoomId] = useState(urlRoomId || '');
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (urlRoomId) {
      setRoomId(urlRoomId);
      setIsJoinMode(true);
    }
  }, [urlRoomId]);

  const validateNickname = (name) => {
    if (!name.trim()) return 'Lütfen bir Sihirdar adı girin.';
    if (name.length < 3) return 'Sihirdar adı en az 3 karakter olmalıdır.';
    if (name.length > 15) return 'Sihirdar adı en fazla 15 karakter olmalıdır.';
    return '';
  };

  const handleCreateLobby = async (e) => {
    e.preventDefault();
    setError('');
    const nickErr = validateNickname(nickname);
    if (nickErr) {
      setError(nickErr);
      return;
    }

    setLoading(true);
    try {
      const { chatService } = await import('../services/firebase');
      const room = await chatService.createRoom(nickname.trim());
      onJoin({
        room,
        nickname: nickname.trim(),
        role: 'creator'
      });
    } catch (err) {
      setError(err.message || 'Savaş Lobisi oluşturulamadı.');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinLobby = async (e) => {
    e.preventDefault();
    setError('');
    
    const nickErr = validateNickname(nickname);
    if (nickErr) {
      setError(nickErr);
      return;
    }
    
    if (!roomId.trim()) {
      setError('Lütfen bir Oda ID girin.');
      return;
    }

    if (!passcode.trim()) {
      setError('Lütfen 6 haneli lobi şifresini girin.');
      return;
    }

    setLoading(true);
    try {
      const { chatService } = await import('../services/firebase');
      const room = await chatService.joinRoom(roomId.trim(), passcode.trim(), nickname.trim());
      onJoin({
        room,
        nickname: nickname.trim(),
        role: room.creatorName === nickname.trim() ? 'creator' : 'joined'
      });
    } catch (err) {
      setError(err.message || 'Lobiye ışınlanma başarısız.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>
      
      {/* Main Authentication Card */}
      <div 
        className="auth-card glass-panel animate-slide-up" 
        style={{ 
          padding: '40px', 
          maxWidth: '460px', 
          width: '92%', 
          position: 'relative', 
          zIndex: 10,
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)'
        }}
      >
        <div className="flex-center" style={{ flexDirection: 'column', marginBottom: '30px' }}>
          <div className="flex-center" style={{
            width: '64px',
            height: '64px',
            background: 'var(--accent-gradient)',
            borderRadius: 'var(--radius-md)',
            color: '#fff',
            marginBottom: '18px',
            boxShadow: '0 8px 24px rgba(244, 63, 94, 0.22)',
            border: '1px solid rgba(255, 255, 255, 0.05)'
          }}>
            <Shield size={32} />
          </div>
          <h1 style={{ 
            fontSize: '2.1rem', 
            marginBottom: '6px', 
            color: 'var(--text-primary)', 
            textAlign: 'center',
            fontFamily: 'var(--font-title)'
          }}>
            luluoynamiyorum
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', textAlign: 'center', fontWeight: 500 }}>
            Sihirdar Vadisi 1v1 Stratejik Haberleşme Geçidi ⚔️
          </p>
        </div>

        {/* Tab Controls */}
        <div style={{
          display: 'flex',
          background: 'rgba(0, 0, 0, 0.15)',
          padding: '4px',
          borderRadius: 'var(--radius-md)',
          marginBottom: '28px',
          border: '1px solid var(--border-color)'
        }}>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => { setIsJoinMode(false); setError(''); }}
            style={{
              flex: 1,
              background: !isJoinMode ? 'var(--bg-tertiary)' : 'transparent',
              border: 'none',
              padding: '10px',
              fontSize: '0.9rem',
              borderRadius: 'calc(var(--radius-md) - 2px)',
              color: !isJoinMode ? 'var(--text-primary)' : 'var(--text-secondary)',
              fontWeight: !isJoinMode ? 600 : 400,
              cursor: 'pointer',
              transition: 'all var(--transition-fast)'
            }}
          >
            Lobi Kur
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => { setIsJoinMode(true); setError(''); }}
            style={{
              flex: 1,
              background: isJoinMode ? 'var(--bg-tertiary)' : 'transparent',
              border: 'none',
              padding: '10px',
              fontSize: '0.9rem',
              borderRadius: 'calc(var(--radius-md) - 2px)',
              color: isJoinMode ? 'var(--text-primary)' : 'var(--text-secondary)',
              fontWeight: isJoinMode ? 600 : 400,
              cursor: 'pointer',
              transition: 'all var(--transition-fast)'
            }}
          >
            Lobiye Işınlan
          </button>
        </div>

        {error && (
          <div className="animate-fade" style={{
            background: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.28)',
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

        {!isJoinMode ? (
          <form onSubmit={handleCreateLobby} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <User size={14} style={{ color: 'var(--accent-primary)' }} /> Sihirdar Adınız
              </label>
              <input
                type="text"
                placeholder="Örn: Miss Fortune"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="form-input"
                style={{ background: 'rgba(0,0,0,0.15)' }}
                required
                disabled={loading}
              />
            </div>

            <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', marginTop: '8px', gap: '8px' }}>
              {loading ? 'Portal Hazırlanıyor...' : 'Lobi Portalı Aç'} <ArrowRight size={18} />
            </button>
          </form>
        ) : (
          <form onSubmit={handleJoinLobby} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <User size={14} style={{ color: 'var(--accent-primary)' }} /> Sihirdar Adınız
              </label>
              <input
                type="text"
                placeholder="Örn: Graves"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="form-input"
                style={{ background: 'rgba(0,0,0,0.15)' }}
                required
                disabled={loading}
              />
            </div>

            <div style={{ display: 'flex', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1.2 }}>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Link size={14} style={{ color: 'var(--accent-primary)' }} /> Geçit Kodu (Lobi ID)
                </label>
                <input
                  type="text"
                  placeholder="Geçit Kodu"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  className="form-input"
                  style={{ background: 'rgba(0,0,0,0.15)' }}
                  required
                  disabled={loading || !!urlRoomId}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 0.8 }}>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Shield size={14} style={{ color: 'var(--accent-primary)' }} /> Şifre
                </label>
                <input
                  type="password"
                  placeholder="6 Haneli"
                  maxLength={6}
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value.replace(/\D/g, ''))} // only digits
                  className="form-input"
                  style={{ 
                    letterSpacing: passcode ? '4px' : 'normal', 
                    textAlign: 'center',
                    background: 'rgba(0,0,0,0.15)'
                  }}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', marginTop: '8px', gap: '8px' }}>
              {loading ? 'Işınlanılıyor...' : "Sihirdar Vadisi'ne İniş Yap"} <ArrowRight size={18} />
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
