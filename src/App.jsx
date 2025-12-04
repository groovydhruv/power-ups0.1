import { useState } from 'react';
import { ProgressProvider } from './context/ProgressContext';
import TopicSelection from './components/TopicSelection';
import ResourceList from './components/ResourceList';
import VoiceConversation from './components/VoiceConversation';
import UsernameScreen from './components/UsernameScreen';

export default function App() {
  const [username, setUsername] = useState(() => {
    if (typeof window === 'undefined') return '';
    try {
      return localStorage.getItem('navi_username') || '';
    } catch {
      return '';
    }
  });

  const [currentScreen, setCurrentScreen] = useState('topics');
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [selectedResource, setSelectedResource] = useState(null);
  const [pendingConversationResource, setPendingConversationResource] = useState(null);
  const [showConversationConfirm, setShowConversationConfirm] = useState(false);

  const handleSelectTopic = (topic) => {
    setSelectedTopic(topic);
    setCurrentScreen('resources');
  };

  const handleBackToTopics = () => {
    setCurrentScreen('topics');
    setSelectedTopic(null);
  };

  const handleStartConversation = (resource) => {
    setPendingConversationResource(resource);
    setShowConversationConfirm(true);
  };

  const handleExitConversation = () => {
    setCurrentScreen('resources');
    setSelectedResource(null);
  };

  const handleConfirmConversation = () => {
    if (!pendingConversationResource) {
      setShowConversationConfirm(false);
      return;
    }
    setSelectedResource(pendingConversationResource);
    setShowConversationConfirm(false);
    setCurrentScreen('conversation');
  };

  const handleCancelConversation = () => {
    setPendingConversationResource(null);
    setShowConversationConfirm(false);
  };

  const handleLogout = () => {
    try {
      localStorage.removeItem('navi_username');
    } catch {
      // ignore storage errors in prototype
    }
    setSelectedResource(null);
    setSelectedTopic(null);
    setCurrentScreen('topics');
    setUsername('');
  };

  const handleUsernameComplete = (name) => {
    try {
      localStorage.setItem('navi_username', name);
    } catch {
      // ignore storage errors in prototype
    }
    setUsername(name);
  };

  if (!username) {
    return <UsernameScreen onComplete={handleUsernameComplete} />;
  }

  return (
    <ProgressProvider storageKey={`learning-platform-progress-${username}`} key={username}>
      {currentScreen === 'topics' && (
        <TopicSelection
          onSelectTopic={handleSelectTopic}
          username={username}
          onLogout={handleLogout}
        />
      )}
      {currentScreen === 'resources' && selectedTopic && (
        <ResourceList
          topic={selectedTopic}
          onBack={handleBackToTopics}
          onStartConversation={handleStartConversation}
        />
      )}
      {currentScreen === 'conversation' && selectedResource && (
        <VoiceConversation
          resource={selectedResource}
          onExit={handleExitConversation}
        />
      )}

      {showConversationConfirm && pendingConversationResource && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15,23,42,0.12)',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 40,
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '420px',
              borderRadius: '0.85rem',
              border: '1px solid rgba(15,23,42,0.08)',
              backgroundColor: '#ffffff',
              padding: '1.5rem 1.4rem 1.25rem',
              color: '#111827',
              fontFamily: "'Fustat', 'Inter', -apple-system, system-ui, BlinkMacSystemFont, 'Segoe UI', sans-serif",
              boxShadow: '0 18px 45px rgba(15,23,42,0.18)',
            }}
          >
            <h2
              style={{
                fontSize: '1rem',
                fontWeight: 500,
                letterSpacing: '-0.01em',
                marginBottom: '0.5rem',
              }}
            >
              You&apos;re about to talk with Navi
            </h2>
            <p
              style={{
                fontSize: '0.85rem',
                color: '#4b5563',
                lineHeight: 1.6,
                marginBottom: '1.1rem',
              }}
            >
              You will now have a conversation with <span style={{ color: '#111827' }}>Navi</span>. He&apos;ll be
              ready to discuss the main points from this resource, so make sure you&apos;ve fully consumed it.
            </p>

            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '0.75rem',
                marginTop: '0.25rem',
              }}
            >
              <button
                type="button"
                onClick={handleCancelConversation}
                style={{
                  padding: '0.55rem 0.95rem',
                  fontSize: '0.85rem',
                  borderRadius: '999px',
                  border: '1px solid rgba(148,163,184,0.6)',
                  backgroundColor: '#f9fafb',
                  color: '#111827',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#e5e7eb';
                  e.currentTarget.style.borderColor = 'rgba(148,163,184,0.9)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#f9fafb';
                  e.currentTarget.style.borderColor = 'rgba(148,163,184,0.6)';
                }}
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleConfirmConversation}
                style={{
                  padding: '0.55rem 1.1rem',
                  fontSize: '0.85rem',
                  borderRadius: '999px',
                  border: '1px solid #111827',
                  background: '#111827',
                  color: '#f9fafb',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.filter = 'brightness(1.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.filter = 'brightness(1)';
                }}
              >
                Begin
              </button>
            </div>
          </div>
        </div>
      )}
    </ProgressProvider>
  );
}
