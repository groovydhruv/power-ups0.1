import { useProgress } from '../context/ProgressContext';
import { topics, resources } from '../data/mockData';
import { LockIcon } from './Icons';

export default function TopicSelection({ onSelectTopic }) {
  const { getTopicProgress } = useProgress();

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0a0a0a', padding: '2rem', color: '#e0e0e0', fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ marginBottom: '3rem' }}>
          <h1 style={{ fontSize: '2.25rem', fontWeight: '600', color: '#e0e0e0', letterSpacing: '-0.02em', marginBottom: '0.5rem' }}>
            Power-Ups
          </h1>
          <p style={{ fontSize: '1rem', color: '#999999', fontWeight: '400' }}>
            Explore mindset topics and unlock your potential
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {topics.map((topic) => {
            const topicResources = resources[topic.id] || [];
            const progress = getTopicProgress(topic.id, topicResources);
            const isLocked = !topic.unlocked;

            return (
              <div
                key={topic.id}
                style={{
                  height: '400px',
                  borderRadius: '0.5rem',
                  border: '1px solid rgba(255,255,255,0.08)',
                  transition: 'all 0.2s',
                  backgroundColor: isLocked ? '#0d0d0d' : '#111111',
                  opacity: isLocked ? 0.6 : 1,
                  cursor: isLocked ? 'not-allowed' : 'pointer',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                }}
                onMouseEnter={(e) => {
                  if (!isLocked) {
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isLocked) {
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
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
                    <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#e0e0e0', marginBottom: '0.5rem', letterSpacing: '-0.01em' }}>
                      {topic.title}
                    </h2>
                    <p style={{ fontSize: '0.875rem', color: '#999999', marginBottom: '1rem', lineHeight: '1.6' }}>
                      {topic.description}
                    </p>
                  </div>
                  {!isLocked && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{ flex: 1, height: '2px', backgroundColor: '#1a1a1a', borderRadius: '9999px', overflow: 'hidden' }}>
                        <div
                          style={{ height: '100%', backgroundColor: '#e0e0e0', transition: 'width 0.3s', width: `${progress}%` }}
                        />
                      </div>
                      <span style={{ fontSize: '0.75rem', color: '#999999', minWidth: '40px', textAlign: 'right' }}>
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
