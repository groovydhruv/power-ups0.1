import { useEffect, useMemo, useState } from 'react';
import { useProgress } from '../context/ProgressContext';
import { CloseIcon, MicIcon, MicOffIcon } from './Icons';
import { LiveKitRoom, RoomAudioRenderer, useLocalParticipant } from '@livekit/components-react';
import { fetchLivekitToken } from '../lib/livekitClient';

export default function VoiceConversation({ resource, onExit }) {
  const { markConversationComplete } = useProgress();
  const [isMuted, setIsMuted] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [lkToken, setLkToken] = useState('');
  const [lkUrl, setLkUrl] = useState('');
  const [connecting, setConnecting] = useState(true);
  const [connectError, setConnectError] = useState('');

  useEffect(() => {
    const start = Date.now();
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - start) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60)
      .toString()
      .padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleEndConversation = () => {
    markConversationComplete(resource.id);
    onExit();
  };

  const roomName = useMemo(() => {
    // use powerupId if available, else resource id
    return resource.powerupId ? `powerup-${resource.powerupId}` : resource.id;
  }, [resource]);

  const identity = useMemo(() => {
    // basic identity; can be enhanced with username if passed down
    return `user-${Math.random().toString(36).slice(2)}`;
  }, []);

  useEffect(() => {
    let isMounted = true;
    const loadToken = async () => {
      setConnecting(true);
      setConnectError('');
      try {
        const { token, url } = await fetchLivekitToken({
          roomName,
          identity,
        });
        if (!isMounted) return;
        setLkToken(token);
        setLkUrl(url);
      } catch (err) {
        if (!isMounted) return;
        setConnectError(err?.message || 'Failed to get LiveKit token');
      } finally {
        if (isMounted) setConnecting(false);
      }
    };
    loadToken();
    return () => {
      isMounted = false;
    };
  }, [roomName, identity]);

  const handleMicToggle = () => {
    setIsMuted((prev) => !prev);
  };

  function MicController() {
    const { localParticipant } = useLocalParticipant();
    useEffect(() => {
      if (!localParticipant) return;
      localParticipant.setMicrophoneEnabled(!isMuted);
    }, [isMuted, localParticipant]);
    return null;
  }

  const renderLiveKit = () => {
    if (connectError) {
      return (
        <div style={{ color: '#b91c1c', fontSize: '0.9rem' }}>
          LiveKit connection failed: {connectError}
        </div>
      );
    }
    if (connecting || !lkToken || !lkUrl) {
      return (
        <div style={{ color: '#6b7280', fontSize: '0.9rem' }}>
          Connecting to conversation...
        </div>
      );
    }
    return (
      <LiveKitRoom
        serverUrl={lkUrl}
        token={lkToken}
        connect={true}
        audio={true}
        video={false}
        style={{ height: 0, width: 0, overflow: 'hidden' }}
      >
        <RoomAudioRenderer />
        <MicController />
      </LiveKitRoom>
    );
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#f5f3f0',
        padding: '2.5rem 2rem',
        color: '#111827',
        fontFamily: "'Fustat', 'Inter', -apple-system, system-ui, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <div style={{ maxWidth: '720px', width: '100%' }}>
        <div
          style={{
            borderRadius: '1rem',
            border: '1px solid rgba(15,23,42,0.08)',
            backgroundColor: '#ffffff',
            padding: '1.75rem 1.5rem 1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem',
            boxShadow: '0 18px 45px rgba(15,23,42,0.12)',
          }}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              position: 'relative',
            }}
          >
            <div>
              <h1
                style={{
                  fontSize: '1.1rem',
                  fontWeight: 500,
                  letterSpacing: '-0.02em',
                  marginBottom: '0.2rem',
                  color: '#111827',
                }}
              >
                Discussion
              </h1>
              <p style={{ fontSize: '0.8rem', color: '#6b7280' }}>{resource.title}</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span
                style={{
                  fontVariantNumeric: 'tabular-nums',
                  fontSize: '0.85rem',
                  color: '#4b5563',
                  fontWeight: 500,
                }}
              >
                {formatTime(elapsed)}
              </span>
              <button
                onClick={onExit}
                style={{
                  color: '#9ca3af',
                  padding: '0.4rem',
                  borderRadius: '999px',
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#e5e7eb';
                  e.currentTarget.style.color = '#111827';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = '#9ca3af';
                }}
                aria-label="Exit conversation"
              >
                <CloseIcon color="#9ca3af" />
              </button>
            </div>
          </div>

          {/* Understanding Bar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <span
              style={{
                fontSize: '0.7rem',
                fontWeight: 500,
                color: '#9ca3af',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Understanding bar
            </span>
            <div
              style={{
                height: '6px',
                backgroundColor: '#e5e7eb',
                borderRadius: '999px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: '0%',
                  backgroundColor: '#10b981',
                  transition: 'width 0.3s ease',
                }}
              />
            </div>
          </div>

          {/* Navi Video Card */}
          <div
            style={{
              position: 'relative',
              width: '100%',
              height: '240px',
              borderRadius: '0.75rem',
              overflow: 'hidden',
              backgroundColor: '#111827',
              backgroundImage: 'url(/navi-card.jpg)', // place the provided image as public/navi-card.jpg
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0.75rem',
              boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.05), 0 4px 10px rgba(0,0,0,0.2)',
            }}
          >
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0) 50%)',
                zIndex: 1,
              }}
            />
            <div
              style={{
                position: 'relative',
                zIndex: 2,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                backgroundColor: 'rgba(15,23,42,0.75)',
                borderRadius: '999px',
                padding: '0.3rem 0.7rem',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
            >
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: '#10b981',
                }}
              />
              <span style={{ color: '#f9fafb', fontSize: '0.8rem', fontWeight: 500 }}>Navi</span>
            </div>
          </div>

          {/* LiveKit connection status */}
          <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>{renderLiveKit()}</div>

          {/* Controls */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '1rem',
              marginTop: '0.75rem',
            }}
          >
            <button
              onClick={handleMicToggle}
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '999px',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                backgroundColor: isMuted ? '#f9fafb' : '#e5f9ef',
                boxShadow: isMuted ? '0 0 0 1px rgba(148,163,184,0.6)' : '0 0 0 1px #16a34a',
              }}
              aria-label={isMuted ? 'Unmute microphone' : 'Mute microphone'}
            >
              {isMuted ? (
                <MicOffIcon color="#6b7280" boxSize={20} />
              ) : (
                <MicIcon color="#166534" boxSize={20} />
              )}
            </button>

            <button
              onClick={handleEndConversation}
              style={{
                flex: 1,
                padding: '0.75rem 1rem',
                fontSize: '0.9rem',
                borderRadius: '999px',
                border: '1px solid #111827',
                color: '#f9fafb',
                background: '#111827',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.filter = 'brightness(1.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.filter = 'brightness(1)';
              }}
            >
              End Conversation
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

