import { useProgress } from '../context/ProgressContext';
import { topics, resources } from '../data/mockData';
import { LockIcon, LogoutIcon } from './Icons';

export default function TopicSelection({ onSelectTopic, username, onLogout }) {
  const { getTopicProgress } = useProgress();

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#f5f3f0',
        padding: '2.5rem 2rem',
        color: '#111827',
        fontFamily: "'Fustat', 'Inter', -apple-system, system-ui, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div
          style={{
            marginBottom: '3rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '1.5rem',
          }}
        >
          <div>
            <h1
              style={{
                fontSize: '2.5rem',
                fontWeight: 600,
                color: '#111827',
                letterSpacing: '-0.03em',
                marginBottom: '0.4rem',
              }}
            >
              Power-Ups
            </h1>
            <p style={{ fontSize: '1rem', color: '#6b7280', fontWeight: '400', maxWidth: '520px' }}>
              Consume each resource thoroughly. Validate your insights and knowledge with a
              conversation. That&apos;s the only way to progress.
            </p>
          </div>

          {username && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                fontSize: '0.85rem',
                color: '#6b7280',
              }}
            >
              <span>
                Signed in as <span style={{ color: '#111827' }}>{username}</span>
              </span>
              <button
                onClick={onLogout}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0.35rem 0.55rem',
                  borderRadius: '999px',
                  border: '1px solid rgba(148,163,184,0.6)',
                  background: '#f9fafb',
                  cursor: 'pointer',
                }}
                aria-label="Log out"
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#e5e7eb';
                  e.currentTarget.style.borderColor = 'rgba(148,163,184,0.9)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#f9fafb';
                  e.currentTarget.style.borderColor = 'rgba(148,163,184,0.6)';
                }}
              >
                <LogoutIcon color="#111827" />
              </button>
            </div>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {topics.map((topic, index) => {
            const topicResources = resources[topic.id] || [];
            const progress = getTopicProgress(topic.id, topicResources);
            let isLocked = false;

            if (index === 0) {
              // First topic is always unlocked
              isLocked = false;
            } else {
              const prevTopic = topics[index - 1];
              const prevResources = resources[prevTopic.id] || [];
              const prevProgress = getTopicProgress(prevTopic.id, prevResources);
              // Unlock this topic only when previous topic is 100% complete
              isLocked = prevProgress < 100;
            }

            return (
              <div
                key={topic.id}
                style={{
                  height: '400px',
                  borderRadius: '0.75rem',
                  border: '1px solid rgba(15,23,42,0.08)',
                  transition: 'all 0.2s',
                  backgroundColor: isLocked ? '#f3f4f6' : '#ffffff',
                  opacity: isLocked ? 0.7 : 1,
                  cursor: isLocked ? 'not-allowed' : 'pointer',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                }}
                onMouseEnter={(e) => {
                  if (!isLocked) {
                    e.currentTarget.style.borderColor = 'rgba(15,23,42,0.16)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isLocked) {
                    e.currentTarget.style.borderColor = 'rgba(15,23,42,0.08)';
                  }
                }}
                onClick={() => !isLocked && onSelectTopic(topic)}
              >
                <div
                  style={{
                    height: '40%',
                    backgroundImage: `url(${topic.image})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    position: 'relative',
                  }}
                >
                  {isLocked && (
                    <div style={{ position: 'absolute', top: '1rem', right: '1rem' }}>
                      <LockIcon color="#999999" />
                    </div>
                  )}
                </div>
                <div style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <h2
                      style={{
                        fontSize: '1.25rem',
                        fontWeight: '600',
                        color: '#111827',
                        marginBottom: '0.5rem',
                        letterSpacing: '-0.01em',
                      }}
                    >
                      {topic.title}
                    </h2>
                    <p
                      style={{
                        fontSize: '0.875rem',
                        color: '#6b7280',
                        marginBottom: '1rem',
                        lineHeight: '1.6',
                      }}
                    >
                      {topic.description}
                    </p>
                  </div>
                  {!isLocked && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div
                        style={{
                          flex: 1,
                          height: '2px',
                          backgroundColor: '#e5e7eb',
                          borderRadius: '9999px',
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            height: '100%',
                            backgroundColor: '#111827',
                            transition: 'width 0.3s',
                            width: `${progress}%`,
                          }}
                        />
                      </div>
                      <span
                        style={{
                          fontSize: '0.75rem',
                          color: '#6b7280',
                          minWidth: '40px',
                          textAlign: 'right',
                        }}
                      >
                        {progress}%
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
