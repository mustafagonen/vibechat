import React, { useState, useEffect } from 'react';
import { Heart, ArrowRight, Link, Shield, User, Copy, Check } from 'lucide-react';

export default function Auth({ onJoin, urlRoomId }) {
  const [isJoinMode, setIsJoinMode] = useState(!!urlRoomId);
  const [nickname, setNickname] = useState('');
  const [roomId, setRoomId] = useState(urlRoomId || '');
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [particles, setParticles] = useState([]);

  // Generate floating hearts/petals background elements on load
  useEffect(() => {
    const spawned = Array.from({ length: 18 }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      delay: `${Math.random() * 8}s`,
      duration: `${8 + Math.random() * 10}s`,
      size: `${12 + Math.random() * 16}px`,
      emoji: Math.random() > 0.4 ? '❤️' : '🌸'
    }));
    setParticles(spawned);
  }, []);

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
      
      {/* Floating Romantic Background Particles */}
      {particles.map((p) => (
        <span 
          key={p.id}
          className="romantic-particle"
          style={{
            left: p.left,
            animationDelay: p.delay,
            animationDuration: p.duration,
            fontSize: p.size,
            filter: 'drop-shadow(0 2px 4px rgba(244, 63, 94, 0.2))'
          }}
        >
          {p.emoji}
        </span>
      ))}

      {/* Main Authentication Card */}
      <div 
        className="auth-card glass-panel romantic-glow animate-slide-up" 
        style={{ 
          padding: '40px', 
          maxWidth: '460px', 
          width: '92%', 
          position: 'relative', 
          zIndex: 10,
          background: 'rgba(20, 12, 13, 0.82)',
          border: '1px solid rgba(244, 63, 94, 0.2)',
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
            boxShadow: '0 8px 24px rgba(244, 63, 94, 0.35)',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <Heart size={32} fill="#fff" />
          </div>
          <h1 style={{ 
            fontSize: '2.1rem', 
            marginBottom: '6px', 
            color: 'var(--text-primary)', 
            textAlign: 'center',
            fontFamily: 'var(--font-title)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            luluoynamiyorum 
            <Heart 
              size={20} 
              fill="var(--accent-primary)" 
              style={{ 
                color: 'var(--accent-primary)', 
                filter: 'drop-shadow(0 0 6px var(--accent-primary))',
                animation: 'float 2.5s infinite ease-in-out'
              }} 
            />
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', textAlign: 'center', fontWeight: 500 }}>
            Sihirdar Vadisi'nde İki Kalbin Gizli Haberleşme Odası 🌸
          </p>
        </div>

        {/* Tab Controls */}
        <div style={{
          display: 'flex',
          background: 'rgba(0, 0, 0, 0.25)',
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
              border: !isJoinMode ? '1px solid rgba(244, 63, 94, 0.25)' : 'none',
              padding: '10px',
              fontSize: '0.9rem',
              borderRadius: 'calc(var(--radius-md) - 2px)',
              color: !isJoinMode ? 'var(--text-primary)' : 'var(--text-secondary)',
              fontWeight: !isJoinMode ? 600 : 400,
              boxShadow: !isJoinMode ? '0 2px 8px rgba(244, 63, 94, 0.15)' : 'none',
              cursor: 'pointer',
              transition: 'all var(--transition-fast)'
            }}
          >
            Aşk Odası Kur
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => { setIsJoinMode(true); setError(''); }}
            style={{
              flex: 1,
              background: isJoinMode ? 'var(--bg-tertiary)' : 'transparent',
              border: isJoinMode ? '1px solid rgba(244, 63, 94, 0.25)' : 'none',
              padding: '10px',
              fontSize: '0.9rem',
              borderRadius: 'calc(var(--radius-md) - 2px)',
              color: isJoinMode ? 'var(--text-primary)' : 'var(--text-secondary)',
              fontWeight: isJoinMode ? 600 : 400,
              boxShadow: isJoinMode ? '0 2px 8px rgba(244, 63, 94, 0.15)' : 'none',
              cursor: 'pointer',
              transition: 'all var(--transition-fast)'
            }}
          >
            Odaya Işınlan
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
                placeholder="Örn: Miss Fortune (Sevgilinizin göreceği ad)"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="form-input"
                style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(244, 63, 94, 0.15)' }}
                required
                disabled={loading}
              />
            </div>

            <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', marginTop: '8px', gap: '8px' }}>
              {loading ? 'Aşk Odası Kuruluyor...' : 'Aşk Odası Kur ❤️'} <ArrowRight size={18} />
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
                placeholder="Örn: Graves (Giriş yapacağınız ad)"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="form-input"
                style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(244, 63, 94, 0.15)' }}
                required
                disabled={loading}
              />
            </div>

            <div style={{ display: 'flex', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1.2 }}>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Link size={14} style={{ color: 'var(--accent-primary)' }} /> Oda ID
                </label>
                <input
                  type="text"
                  placeholder="Gizli Oda ID"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  className="form-input"
                  style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(244, 63, 94, 0.15)' }}
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
                    background: 'rgba(0,0,0,0.3)', 
                    border: '1px solid rgba(244, 63, 94, 0.15)'
                  }}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', marginTop: '8px', gap: '8px' }}>
              {loading ? 'Işınlanılıyor...' : 'Sevdiğine Işınlan ✨'} <ArrowRight size={18} />
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
