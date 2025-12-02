import { useState } from 'react';
import { useProgress } from '../context/ProgressContext';
import { CloseIcon } from './Icons';

const mockMessages = [
  { type: 'ai', text: "Great! Let's start with a simple question. What is the core principle of Stoicism that you learned from this resource?" },
  { type: 'user', text: "The dichotomy of control - focusing on what we can control and accepting what we can't." },
  { type: 'ai', text: "Excellent understanding! Can you give me an example of how you might apply this in your daily life?" },
];

export default function VoiceConversation({ resource, onExit }) {
  const { markConversationComplete, getResourceStatus } = useProgress();
  const [isMuted, setIsMuted] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [messages] = useState(mockMessages);
  const status = getResourceStatus(resource.id);

  const handleComplete = () => {
    markConversationComplete(resource.id);
    onExit();
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0a0a0a', padding: '2rem', color: '#e0e0e0', fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h1 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#e0e0e0', letterSpacing: '-0.02em', marginBottom: '0.25rem' }}>
                Voice Conversation
              </h1>
              <p style={{ fontSize: '0.875rem', color: '#999999' }}>{resource.title}</p>
            </div>
            <button
              onClick={onExit}
              style={{
                color: '#999999',
                padding: '0.5rem',
                borderRadius: '0.25rem',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#e0e0e0';
                e.currentTarget.style.backgroundColor = '#1a1a1a';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#999999';
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
              aria-label="Exit conversation"
            >
              <CloseIcon color="#999999" />
            </button>
          </div>

          <div style={{
            backgroundColor: '#111111',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '0.5rem',
            padding: '1.5rem',
            minHeight: '400px',
            maxHeight: '500px',
            overflowY: 'auto',
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    justifyContent: msg.type === 'user' ? 'flex-end' : 'flex-start',
                  }}
                >
                  <div
                    style={{
                      maxWidth: '70%',
                      padding: '1rem',
                      borderRadius: '0.75rem',
                      fontSize: '0.875rem',
                      lineHeight: '1.6',
                      backgroundColor: msg.type === 'user' ? '#e0e0e0' : '#1a1a1a',
                      color: msg.type === 'user' ? '#0a0a0a' : '#e0e0e0',
                    }}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
              {isListening && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#999999' }}>
                  <div style={{
                    width: '16px',
                    height: '16px',
                    border: '2px solid #e0e0e0',
                    borderTopColor: 'transparent',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                  }} />
                  <span style={{ fontSize: '0.75rem' }}>Listening...</span>
                </div>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
            <button
              onClick={() => setIsMuted(!isMuted)}
              style={{
                padding: '0.75rem 1.5rem',
                fontSize: '1rem',
                borderRadius: '0.25rem',
                border: '1px solid rgba(255,255,255,0.08)',
                color: '#e0e0e0',
                backgroundColor: 'transparent',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#1a1a1a';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
              }}
            >
              {isMuted ? 'Unmute' : 'Mute'}
            </button>
            <button
              onClick={() => setIsListening(!isListening)}
              style={{
                padding: '0.75rem 1.5rem',
                fontSize: '1rem',
                borderRadius: '0.25rem',
                border: '1px solid rgba(255,255,255,0.08)',
                color: '#e0e0e0',
                backgroundColor: 'transparent',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#1a1a1a';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
              }}
            >
              {isListening ? 'Stop' : 'Start Speaking'}
            </button>
          </div>

          {!status.conversationCompleted && (
            <button
              onClick={handleComplete}
              style={{
                width: '100%',
                padding: '0.75rem 1.5rem',
                fontSize: '1rem',
                borderRadius: '0.25rem',
                border: '1px solid rgba(255,255,255,0.08)',
                color: '#e0e0e0',
                backgroundColor: 'transparent',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#1a1a1a';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
              }}
            >
              Complete Conversation
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
