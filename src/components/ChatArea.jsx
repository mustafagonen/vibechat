import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, Image as ImageIcon, X, Copy, Check, LogOut, 
  User, Shield, Loader, Lock, ZoomIn, Download, ExternalLink 
} from 'lucide-react';

export default function ChatArea({ roomState, nickname, onLeave }) {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [selectedImage, setSelectedImage] = useState(null); // base64 string
  const [imageFileName, setImageFileName] = useState('');
  const [isCompressing, setIsCompressing] = useState(false);
  const [zoomImage, setZoomImage] = useState(null);
  const [linkCopied, setLinkCopied] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);
  const [isDisbandConfirmOpen, setIsDisbandConfirmOpen] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const { id: roomId, passcode, creatorName, joinedName, status } = roomState;
  const isCreator = nickname === creatorName;
  const partnerName = isCreator ? joinedName : creatorName;
  const shareableUrl = `${window.location.origin}${window.location.pathname}?room=${roomId}`;

  // Subscribe to messages when active
  useEffect(() => {
    let unsubscribe = () => {};
    if (status === 'active') {
      const loadMessages = async () => {
        const { chatService } = await import('../services/firebase');
        unsubscribe = chatService.listenToMessages(roomId, (msgs) => {
          setMessages(msgs);
        });
      };
      loadMessages();
    }
    return () => unsubscribe();
  }, [roomId, status]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, selectedImage]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareableUrl);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(passcode);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  };

  // Compress image using HTML5 Canvas to keep base64 strings lightweight
  const compressAndConvertImage = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 800;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          
          // Output compressed jpeg at 0.7 quality
          const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
          resolve(dataUrl);
        };
      };
    });
  };

  const handleImageSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Lütfen geçerli bir görsel dosyası seçin.');
      return;
    }

    setIsCompressing(true);
    try {
      const base64 = await compressAndConvertImage(file);
      setSelectedImage(base64);
      setImageFileName(file.name);
    } catch (err) {
      console.error('Görsel işleme hatası:', err);
    } finally {
      setIsCompressing(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim() && !selectedImage) return;

    const textToSend = inputText.trim();
    const imageToSend = selectedImage || '';

    // Clear inputs immediately for snappy feel
    setInputText('');
    setSelectedImage(null);
    setImageFileName('');

    try {
      const { chatService } = await import('../services/firebase');
      await chatService.sendMessage(roomId, nickname, textToSend, imageToSend);
    } catch (err) {
      console.error('Mesaj gönderilemedi:', err);
      // restore values if failed
      setInputText(textToSend);
      setSelectedImage(imageToSend);
    }
  };

  const formatTime = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const triggerFileSelect = () => {
    fileInputRef.current.click();
  };

  const handleDownloadImage = (base64Data, filename = 'luluchat-media.jpg') => {
    const link = document.createElement('a');
    link.href = base64Data;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Render 1: Lobby Waiting State
  if (status === 'waiting') {
    return (
      <div className="glass-panel animate-fade flex-center" style={{
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        padding: '30px',
        textAlign: 'center',
        justifyContent: 'center',
        position: 'relative'
      }}>
        <button 
          onClick={() => setIsDisbandConfirmOpen(true)} 
          className="btn-icon" 
          style={{ position: 'absolute', top: '20px', right: '20px' }}
          title="Lobiyi Kapat"
        >
          <LogOut size={18} />
        </button>

        <div className="flex-center" style={{
          width: '80px',
          height: '80px',
          background: 'rgba(6, 182, 212, 0.1)',
          border: '1px solid rgba(6, 182, 212, 0.2)',
          borderRadius: 'var(--radius-full)',
          color: 'var(--accent-cyan)',
          marginBottom: '24px',
          animation: 'pulse-glow 2s infinite'
        }}>
          <Lock size={36} />
        </div>

        <h2 style={{ fontSize: '1.8rem', marginBottom: '8px' }}>Savaş Lobisi Kuruldu</h2>
        <p style={{ color: 'var(--text-secondary)', maxWidth: '420px', fontSize: '0.95rem', marginBottom: '32px' }}>
          Lobi geçidi başarıyla açıldı. Görüşmenin başlaması için 2. Sihirdarın aşağıdaki bilgileri kullanarak lobiye ışınlanması gerekiyor.
        </p>

        <div style={{
          width: '100%',
          maxWidth: '480px',
          background: 'rgba(0, 0, 0, 0.15)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          textAlign: 'left'
        }}>
          {/* Room Link */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Geçit Davet Linki</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input 
                type="text" 
                readOnly 
                value={shareableUrl} 
                className="form-input" 
                style={{ background: 'rgba(0, 0, 0, 0.2)' }}
              />
              <button onClick={handleCopyLink} className="btn-icon" style={{ flexShrink: 0 }}>
                {linkCopied ? <Check size={18} style={{ color: 'var(--accent-green)' }} /> : <Copy size={18} />}
              </button>
            </div>
          </div>

          {/* Passcode */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Şifre</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <div style={{
                background: 'rgba(0, 0, 0, 0.2)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                flex: 1,
                padding: '12px 16px',
                fontSize: '1.25rem',
                fontWeight: 700,
                letterSpacing: '4px',
                textAlign: 'center',
                color: 'var(--accent-primary)',
                fontFamily: 'monospace'
              }}>
                {passcode}
              </div>
              <button onClick={handleCopyCode} className="btn-icon" style={{ flexShrink: 0, height: '53px', width: '53px' }}>
                {codeCopied ? <Check size={18} style={{ color: 'var(--accent-green)' }} /> : <Copy size={18} />}
              </button>
            </div>
          </div>
        </div>

        <div className="flex-center" style={{ gap: '10px', marginTop: '36px', color: 'var(--text-secondary)' }}>
          <Loader size={16} className="animate-spin" style={{ animation: 'spin 2s linear infinite' }} />
          <span style={{ fontSize: '0.9rem' }}>Diğer Sihirdar bekleniyor... (1/2)</span>
        </div>
      </div>
    );
  }

  // Render 2: Active Chat State
  return (
    <div className="glass-panel animate-fade" style={{
      display: 'flex',
      flexDirection: 'column',
      width: '100%',
      height: '100%',
      overflow: 'hidden'
    }}>
      {/* Chat Header */}
      <div style={{
        padding: '18px 24px',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'rgba(0, 0, 0, 0.05)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div className="flex-center" style={{
            width: '42px',
            height: '42px',
            background: 'var(--bg-tertiary)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--accent-primary)',
            position: 'relative'
          }}>
            <User size={20} />
            <div className="status-dot online" style={{
              position: 'absolute',
              bottom: '-2px',
              right: '-2px',
              border: '2px solid var(--bg-secondary)'
            }} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 600 }}>{partnerName || 'Sihirdar Yükleniyor...'}</h3>
            <span style={{ fontSize: '0.78rem', color: 'var(--accent-green)', fontWeight: 500 }}>Vadidesiniz (2/2) - Bağlantı Güvenli</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            onClick={() => setIsDisbandConfirmOpen(true)} 
            className="btn-secondary" 
            style={{ 
              padding: '8px 14px', 
              fontSize: '0.85rem',
              color: 'var(--accent-red)',
              borderColor: 'rgba(239, 68, 68, 0.2)'
            }}
          >
            <LogOut size={14} /> Savaştan Çekil
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
        {messages.length === 0 ? (
          <div className="flex-center" style={{ flexDirection: 'column', height: '100%', color: 'var(--text-muted)', gap: '8px' }}>
            <Lock size={24} />
            <p style={{ fontSize: '0.9rem' }}>Geçit kuruldu. Lulu fısıltılarınızı Hextech şifrelemeyle koruyor.</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender === nickname;
            return (
              <div 
                key={msg.id} 
                style={{
                  display: 'flex',
                  justifyContent: isMe ? 'flex-end' : 'flex-start',
                  animation: isMe ? 'messageInRight 0.25s ease-out' : 'messageInLeft 0.25s ease-out'
                }}
              >
                <div style={{
                  maxWidth: '75%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: isMe ? 'flex-end' : 'flex-start'
                }}>
                  {/* Sender Name */}
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px', padding: '0 4px' }}>
                    {isMe ? 'Siz' : msg.sender}
                  </span>

                  {/* Bubble */}
                  <div style={{
                    background: isMe ? 'var(--accent-gradient)' : 'var(--bg-tertiary)',
                    color: isMe ? '#ffffff' : 'var(--text-primary)',
                    padding: msg.image ? '8px' : '12px 16px',
                    borderRadius: isMe 
                      ? 'var(--radius-md) var(--radius-md) 4px var(--radius-md)'
                      : 'var(--radius-md) var(--radius-md) var(--radius-md) 4px',
                    border: isMe ? 'none' : '1px solid var(--border-color)',
                    boxShadow: 'var(--shadow-sm)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px'
                  }}>
                    {msg.image && (
                      <div className="image-container" style={{
                        position: 'relative',
                        borderRadius: 'calc(var(--radius-md) - 4px)',
                        overflow: 'hidden',
                        cursor: 'zoom-in',
                        maxWidth: '100%',
                        maxHeight: '300px'
                      }} onClick={() => setZoomImage(msg.image)}>
                        <img 
                          src={msg.image} 
                          alt="Paylaşılan görsel" 
                          style={{
                            width: '100%',
                            height: 'auto',
                            maxHeight: '300px',
                            objectFit: 'cover',
                            display: 'block'
                          }} 
                        />
                        <div style={{
                          position: 'absolute',
                          top: '8px',
                          right: '8px',
                          background: 'rgba(0,0,0,0.6)',
                          borderRadius: 'var(--radius-full)',
                          padding: '4px',
                          color: '#fff',
                          opacity: 0,
                          transition: 'opacity 0.2s'
                        }} className="zoom-hover-icon">
                          <ZoomIn size={14} />
                        </div>
                      </div>
                    )}

                    {msg.text && (
                      <p style={{ 
                        fontSize: '0.92rem', 
                        whiteSpace: 'pre-wrap', 
                        wordBreak: 'break-word',
                        padding: msg.image ? '4px 8px 4px 8px' : '0'
                      }}>
                        {msg.text}
                      </p>
                    )}

                    <span style={{ 
                      fontSize: '0.7rem', 
                      color: isMe ? 'rgba(255, 255, 255, 0.7)' : 'var(--text-muted)',
                      alignSelf: 'flex-end',
                      padding: '0 2px'
                    }}>
                      {formatTime(msg.timestamp)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Selected Image Preview Area */}
      {selectedImage && (
        <div className="animate-fade" style={{
          padding: '12px 24px',
          borderTop: '1px solid var(--border-color)',
          background: 'rgba(0, 0, 0, 0.15)',
          display: 'flex',
          alignItems: 'center',
          gap: '16px'
        }}>
          <div style={{
            position: 'relative',
            width: '60px',
            height: '60px',
            borderRadius: 'var(--radius-sm)',
            overflow: 'hidden',
            border: '1px solid var(--border-color)'
          }}>
            <img src={selectedImage} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <button 
              onClick={() => { setSelectedImage(null); setImageFileName(''); }} 
              style={{
                position: 'absolute',
                top: '2px',
                right: '2px',
                background: 'rgba(0, 0, 0, 0.7)',
                color: '#fff',
                border: 'none',
                borderRadius: 'var(--radius-full)',
                width: '16px',
                height: '16px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <X size={10} />
            </button>
          </div>
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 500, display: 'block', color: 'var(--text-primary)' }}>
              Hextech Görsel Yüklendi
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              {imageFileName}
            </span>
          </div>
        </div>
      )}

      {/* Input Form Footer */}
      <form onSubmit={handleSendMessage} style={{
        padding: '16px 24px',
        borderTop: '1px solid var(--border-color)',
        background: 'rgba(0, 0, 0, 0.1)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleImageSelect} 
          accept="image/*" 
          style={{ display: 'none' }} 
        />
        
        <button 
          type="button" 
          onClick={triggerFileSelect} 
          className="btn-icon"
          disabled={isCompressing}
          title="Görsel Yükle"
          style={{ flexShrink: 0 }}
        >
          {isCompressing ? <Loader className="animate-spin" size={20} /> : <ImageIcon size={20} />}
        </button>

        <input 
          type="text" 
          placeholder={selectedImage ? "Görsel açıklaması yaz..." : "Vadiye bir fısıltı gönder..."}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          className="form-input"
          style={{ flex: 1 }}
        />

        <button 
          type="submit" 
          className="btn-primary" 
          style={{ 
            height: '42px', 
            width: '42px', 
            padding: 0, 
            borderRadius: 'var(--radius-md)', 
            flexShrink: 0 
          }}
          disabled={!inputText.trim() && !selectedImage}
        >
          <Send size={18} />
        </button>
      </form>

      {/* CSS injection for hover selector overlay */}
      <style>{`
        .image-container:hover .zoom-hover-icon {
          opacity: 1 !important;
        }
      `}</style>

      {/* Image Zoom Overlay Modal */}
      {zoomImage && (
        <div 
          className="animate-fade"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(0,0,0,0.85)',
            backdropFilter: 'blur(10px)',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '40px'
          }}
          onClick={() => setZoomImage(null)}
        >
          {/* Control Bar */}
          <div 
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              display: 'flex',
              gap: '12px'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={() => handleDownloadImage(zoomImage)} 
              className="btn-icon" 
              style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff' }}
              title="İndir"
            >
              <Download size={20} />
            </button>
            <button 
              onClick={() => setZoomImage(null)} 
              className="btn-icon" 
              style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff' }}
              title="Kapat"
            >
              <X size={20} />
            </button>
          </div>

          {/* Zoomed Image */}
          <img 
            src={zoomImage} 
            alt="Zoomed" 
            style={{
              maxWidth: '90%',
              maxHeight: '80%',
              objectFit: 'contain',
              borderRadius: 'var(--radius-md)',
              boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
            }}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* Disband Confirmation Dialog Modal */}
      {isDisbandConfirmOpen && (
        <div className="animate-fade" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0,0,0,0.85)',
          backdropFilter: 'blur(10px)',
          zIndex: 99999,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '20px'
        }} onClick={() => setIsDisbandConfirmOpen(false)}>
          <div className="glass-panel animate-slide-up" style={{
            maxWidth: '385px',
            width: '100%',
            padding: '36px 30px',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            textAlign: 'center',
            boxShadow: 'var(--shadow-lg)'
          }} onClick={(e) => e.stopPropagation()}>
            
            <p style={{ 
              color: 'var(--text-primary)', 
              fontSize: '1.18rem', 
              fontWeight: 600,
              lineHeight: '1.5', 
              marginBottom: '32px'
            }}>
              Ondan kopmak istemediğine emin misin?
            </p>
            
            <div style={{ display: 'flex', gap: '14px' }}>
              <button 
                onClick={onLeave} 
                className="btn-primary" 
                style={{ flex: 1.1, padding: '12px 14px', fontSize: '0.85rem', background: 'var(--accent-gradient-hover)' }}
              >
                BUGÜNLÜK EVET
              </button>
              <button 
                onClick={() => setIsDisbandConfirmOpen(false)} 
                className="btn-secondary" 
                style={{ flex: 1.3, padding: '12px 10px', fontSize: '0.82rem' }}
              >
                HAYIR, KIVRANMAYA DEVAM
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
