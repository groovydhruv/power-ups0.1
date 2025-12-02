import { createContext, useContext, useState, useEffect } from 'react';

const ProgressContext = createContext();

export const useProgress = () => {
  const context = useContext(ProgressContext);
  if (!context) {
    throw new Error('useProgress must be used within ProgressProvider');
  }
  return context;
};

export const ProgressProvider = ({ children }) => {
  const [progress, setProgress] = useState(() => {
    const saved = localStorage.getItem('learning-platform-progress');
    return saved ? JSON.parse(saved) : {};
  });

  useEffect(() => {
    localStorage.setItem('learning-platform-progress', JSON.stringify(progress));
  }, [progress]);

  const markResourceStarted = (resourceId) => {
    setProgress((prev) => ({
      ...prev,
      [resourceId]: { ...prev[resourceId], started: true, completed: false, conversationCompleted: false },
    }));
  };

  const markResourceComplete = (resourceId) => {
    setProgress((prev) => ({
      ...prev,
      [resourceId]: { ...prev[resourceId], completed: true },
    }));
  };

  const markConversationComplete = (resourceId) => {
    setProgress((prev) => ({
      ...prev,
      [resourceId]: { ...prev[resourceId], conversationCompleted: true },
    }));
  };

  const getResourceStatus = (resourceId) => {
    return progress[resourceId] || { started: false, completed: false, conversationCompleted: false };
  };

  const isResourceUnlocked = (topicId, resourceOrder, resources) => {
    if (resourceOrder === 1) return true;
    const prevResource = resources.find((r) => r.order === resourceOrder - 1);
    if (!prevResource) return true;
    const status = getResourceStatus(prevResource.id);
    return status.completed && status.conversationCompleted;
  };

  const getTopicProgress = (topicId, resources) => {
    if (!resources || resources.length === 0) return 0;
    const completed = resources.filter((r) => {
      const status = getResourceStatus(r.id);
      return status.completed && status.conversationCompleted;
    }).length;
    return Math.round((completed / resources.length) * 100);
  };

  return (
    <ProgressContext.Provider
      value={{
        progress,
        markResourceStarted,
        markResourceComplete,
        markConversationComplete,
        getResourceStatus,
        isResourceUnlocked,
        getTopicProgress,
      }}
    >
      {children}
    </ProgressContext.Provider>
  );
};
