import { useState } from 'react';
import { useProgress } from '../context/ProgressContext';
import { resources } from '../data/mockData';
import { ChevronDownIcon, ChevronUpIcon, CheckIcon, LockIcon } from './Icons';

export default function ResourceList({ topic, onBack, onStartConversation }) {
  const { getResourceStatus, isResourceUnlocked, markResourceStarted, markResourceComplete } = useProgress();
  const [expanded, setExpanded] = useState({});
  const topicResources = resources[topic.id] || [];
  const sortedResources = [...topicResources].sort((a, b) => a.order - b.order);

  const toggleExpand = (resourceId) => {
    setExpanded((prev) => ({ ...prev, [resourceId]: !prev[resourceId] }));
  };

  const handleAction = (resource) => {
    const status = getResourceStatus(resource.id);
    if (!status.started) {
      // Auto-expand when starting, but don't mark as complete yet
      setExpanded((prev) => ({ ...prev, [resource.id]: true }));
      // Mark as started but not completed
      markResourceStarted(resource.id);
    } else if (status.started && !status.completed) {
      // Mark as complete
      markResourceComplete(resource.id);
    } else if (status.completed && !status.conversationCompleted) {
      onStartConversation(resource);
    }
  };

  const getButtonText = (resource) => {
    const status = getResourceStatus(resource.id);
    if (!status.started) return 'Start';
    if (status.started && !status.completed) return 'Mark as Complete';
    if (status.completed && !status.conversationCompleted) return 'Start Conversation';
    return 'Completed';
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0a0a0a', padding: '2rem', color: '#e0e0e0', fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <button
            onClick={onBack}
            style={{
              fontSize: '0.875rem',
              color: '#999999',
              padding: '0.375rem 0.75rem',
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
          >
            Back
          </button>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <h1 style={{ fontSize: '2.25rem', fontWeight: '600', color: '#e0e0e0', letterSpacing: '-0.02em', marginBottom: '0.5rem' }}>
            {topic.title}
          </h1>
          <p style={{ fontSize: '1rem', color: '#999999', fontWeight: '400' }}>
            {topic.description}
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {sortedResources.map((resource, index) => {
            const status = getResourceStatus(resource.id);
            const unlocked = isResourceUnlocked(topic.id, resource.order, sortedResources);
            const isExpanded = expanded[resource.id];

            return (
              <div
                key={resource.id}
                style={{
                  borderRadius: '0.5rem',
                  border: '1px solid rgba(255,255,255,0.08)',
                  overflow: 'hidden',
                  backgroundColor: unlocked ? '#111111' : '#0d0d0d',
                  opacity: unlocked ? 1 : 0.6,
                }}
              >
                <div
                  style={{
                    padding: '1.25rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: unlocked ? 'pointer' : 'not-allowed',
                  }}
                  onClick={() => unlocked && toggleExpand(resource.id)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.875rem', color: '#999999', fontWeight: '500' }}>
                          {index + 1}
                        </span>
                        <span style={{ fontSize: '1rem', fontWeight: '500', color: '#e0e0e0', letterSpacing: '-0.01em' }}>
                          {resource.title}
                        </span>
                        {status.completed && status.conversationCompleted && (
                          <CheckIcon color="#e0e0e0" boxSize={12} />
                        )}
                        {!unlocked && <LockIcon color="#999999" />}
                      </div>
                      <p style={{ fontSize: '0.75rem', color: '#999999', marginTop: '0.125rem' }}>
                        {resource.type} · {resource.duration}
                      </p>
                    </div>
                  </div>

                  {unlocked && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAction(resource);
                        }}
                        disabled={status.completed && status.conversationCompleted}
                        style={{
                          padding: '0.5rem 1rem',
                          fontSize: '0.875rem',
                          borderRadius: '0.25rem',
                          border: '1px solid rgba(255,255,255,0.08)',
                          color: status.started && !status.completed 
                            ? '#b0b0b0' 
                            : status.completed && status.conversationCompleted 
                            ? '#999999' 
                            : '#e0e0e0',
                          backgroundColor: 'transparent',
                          cursor: status.completed && status.conversationCompleted ? 'not-allowed' : 'pointer',
                        }}
                        onMouseEnter={(e) => {
                          if (!(status.completed && status.conversationCompleted)) {
                            e.currentTarget.style.backgroundColor = '#1a1a1a';
                            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!(status.completed && status.conversationCompleted)) {
                            e.currentTarget.style.backgroundColor = 'transparent';
                            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                          }
                        }}
                      >
                        {getButtonText(resource)}
                      </button>
                      {isExpanded ? (
                        <ChevronUpIcon boxSize={20} color="#999999" />
                      ) : (
                        <ChevronDownIcon boxSize={20} color="#999999" />
                      )}
                    </div>
                  )}
                </div>

                {isExpanded && unlocked && (
                  <div style={{ padding: '0 1.25rem 1.25rem 1.25rem' }}>
                    <p style={{ fontSize: '0.875rem', color: '#999999', lineHeight: '1.6', marginTop: '0.5rem', marginBottom: '1rem' }}>
                      {resource.description}
                    </p>
                    {resource.thumbnail && (
                      <div
                        style={{
                          position: 'relative',
                          width: '100%',
                          height: '200px',
                          borderRadius: '0.5rem',
                          overflow: 'hidden',
                          cursor: 'pointer',
                          marginTop: '1rem',
                        }}
                        onClick={() => resource.link && window.open(resource.link, '_blank')}
                        onMouseEnter={(e) => {
                          const img = e.currentTarget.querySelector('img');
                          const overlay = e.currentTarget.querySelector('.resource-overlay');
                          if (img) img.style.filter = 'blur(4px)';
                          if (overlay) overlay.style.opacity = '1';
                        }}
                        onMouseLeave={(e) => {
                          const img = e.currentTarget.querySelector('img');
                          const overlay = e.currentTarget.querySelector('.resource-overlay');
                          if (img) img.style.filter = 'blur(0px)';
                          if (overlay) overlay.style.opacity = '0';
                        }}
                      >
                        <img
                          src={resource.thumbnail}
                          alt={resource.title}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            transition: 'filter 0.3s ease',
                          }}
                        />
                        <div
                          className="resource-overlay"
                          style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundColor: 'rgba(0, 0, 0, 0.6)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            opacity: 0,
                            transition: 'opacity 0.3s ease',
                            pointerEvents: 'none',
                          }}
                        >
                          <span style={{
                            color: '#e0e0e0',
                            fontSize: '1rem',
                            fontWeight: '500',
                            letterSpacing: '0.02em',
                          }}>
                            Open Resource
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
