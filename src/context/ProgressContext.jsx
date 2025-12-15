import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { isSupabaseReady } from '../lib/dataApi';

const ProgressContext = createContext();

export const useProgress = () => {
  const context = useContext(ProgressContext);
  if (!context) {
    throw new Error('useProgress must be used within ProgressProvider');
  }
  return context;
};

const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `user-${Math.random().toString(36).slice(2)}`;
};

export const ProgressProvider = ({ children, storageKey = 'learning-platform-progress', username }) => {
  const [progress, setProgress] = useState(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem(storageKey) : null;
    return saved ? JSON.parse(saved) : {};
  });
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(storageKey, JSON.stringify(progress));
  }, [progress, storageKey]);

  // Establish a stable userId per username (stored locally)
  useEffect(() => {
    if (!username) return;
    if (typeof window === 'undefined') return;
    const key = `navi_user_id_${username}`;
    const existing = localStorage.getItem(key);
    const id = existing || generateId();
    if (!existing) localStorage.setItem(key, id);
    setUserId(id);
  }, [username]);

  // Fetch remote progress when userId is ready and Supabase is configured
  useEffect(() => {
    const fetchProgress = async () => {
      if (!isSupabaseReady || !supabase || !userId) return;
      try {
        // Upsert user profile
        await supabase.from('users').upsert({ id: userId, username }).select();

        const { data, error } = await supabase
          .from('user_progress')
          .select('resource_id, started, completed, conversation_completed')
          .eq('user_id', userId);
        if (error) throw error;
        const merged = {};
        (data || []).forEach((row) => {
          merged[row.resource_id] = {
            started: !!row.started,
            completed: !!row.completed,
            conversationCompleted: !!row.conversation_completed,
          };
        });
        setProgress((prev) => ({ ...prev, ...merged }));
      } catch (err) {
        console.warn('Supabase fetch progress failed:', err?.message || err);
      }
    };
    fetchProgress();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const syncProgress = async (resourceId, payload) => {
    if (!isSupabaseReady || !supabase || !userId) return;
    try {
      await supabase
        .from('user_progress')
        .upsert({
          user_id: userId,
          resource_id: resourceId,
          ...payload,
          updated_at: new Date().toISOString(),
        });
    } catch (err) {
      console.warn('Supabase sync failed:', err?.message || err);
    }
  };

  const markResourceStarted = (resourceId) => {
    setProgress((prev) => ({
      ...prev,
      [resourceId]: { ...prev[resourceId], started: true, completed: false, conversationCompleted: false },
    }));
    syncProgress(resourceId, { started: true, completed: false, conversation_completed: false });
  };

  const markResourceComplete = (resourceId) => {
    setProgress((prev) => ({
      ...prev,
      [resourceId]: { ...prev[resourceId], completed: true },
    }));
    syncProgress(resourceId, { completed: true });
  };

  const markConversationComplete = (resourceId) => {
    setProgress((prev) => ({
      ...prev,
      [resourceId]: { ...prev[resourceId], conversationCompleted: true },
    }));
    syncProgress(resourceId, { conversation_completed: true });
  };

  const getResourceStatus = (resourceId) => {
    return progress[resourceId] || { started: false, completed: false, conversationCompleted: false };
  };

  const isResourceUnlocked = (topicId, resourceOrder, resources) => {
    // First resource in a topic is always available
    if (resourceOrder === 1) return true;

    const prevResource = resources.find((r) => r.order === resourceOrder - 1);
    if (!prevResource) return true;

    const status = getResourceStatus(prevResource.id);
    // Unlock when the previous resource has been marked complete
    return status.completed;
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
