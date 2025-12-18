import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
  // React Native compatible UUID generation
  return `user-${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

export const ProgressProvider = ({ children, storageKey = 'learning-platform-progress', username }) => {
  const [progress, setProgress] = useState({});
  const [xp, setXp] = useState(0);
  const [level, setLevel] = useState(1);
  const [streak, setStreak] = useState(0);
  const [lastActiveDate, setLastActiveDate] = useState(null);
  const [userId, setUserId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load progress, xp, level, and streak from AsyncStorage on mount
  useEffect(() => {
    const loadProgress = async () => {
      try {
        const saved = await AsyncStorage.getItem(storageKey);
        if (saved) {
          setProgress(JSON.parse(saved));
        }
        const savedXp = await AsyncStorage.getItem(`${storageKey}-xp`);
        if (savedXp) {
          setXp(parseInt(savedXp, 10));
        }
        const savedLevel = await AsyncStorage.getItem(`${storageKey}-level`);
        if (savedLevel) {
          setLevel(parseInt(savedLevel, 10));
        }
        const savedStreak = await AsyncStorage.getItem(`${storageKey}-streak`);
        const savedLastActive = await AsyncStorage.getItem(`${storageKey}-lastActive`);
        if (savedStreak) {
          setStreak(parseInt(savedStreak, 10));
        }
        if (savedLastActive) {
          setLastActiveDate(savedLastActive);
        }
      } catch (error) {
        console.warn('Failed to load progress from AsyncStorage:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadProgress();
  }, [storageKey]);

  // Save progress to AsyncStorage whenever it changes
  useEffect(() => {
    if (isLoading) return; // Don't save during initial load
    
    const saveProgress = async () => {
      try {
        await AsyncStorage.setItem(storageKey, JSON.stringify(progress));
      } catch (error) {
        console.warn('Failed to save progress to AsyncStorage:', error);
      }
    };
    saveProgress();
  }, [progress, storageKey, isLoading]);

  // Save xp to AsyncStorage whenever it changes
  useEffect(() => {
    if (isLoading) return; // Don't save during initial load
    
    const saveXp = async () => {
      try {
        await AsyncStorage.setItem(`${storageKey}-xp`, xp.toString());
      } catch (error) {
        console.warn('Failed to save xp to AsyncStorage:', error);
      }
    };
    saveXp();
  }, [xp, storageKey, isLoading]);

  // Save level to AsyncStorage whenever it changes
  useEffect(() => {
    if (isLoading) return; // Don't save during initial load
    
    const saveLevel = async () => {
      try {
        await AsyncStorage.setItem(`${storageKey}-level`, level.toString());
      } catch (error) {
        console.warn('Failed to save level to AsyncStorage:', error);
      }
    };
    saveLevel();
  }, [level, storageKey, isLoading]);

  // Save streak to AsyncStorage whenever it changes
  useEffect(() => {
    if (isLoading) return; // Don't save during initial load
    
    const saveStreak = async () => {
      try {
        await AsyncStorage.setItem(`${storageKey}-streak`, streak.toString());
        if (lastActiveDate) {
          await AsyncStorage.setItem(`${storageKey}-lastActive`, lastActiveDate);
        }
      } catch (error) {
        console.warn('Failed to save streak to AsyncStorage:', error);
      }
    };
    saveStreak();
  }, [streak, lastActiveDate, storageKey, isLoading]);

  // Establish a stable userId per username (stored in AsyncStorage)
  useEffect(() => {
    if (!username) return;
    
    const loadOrCreateUserId = async () => {
      try {
        const key = `navi_user_id_${username}`;
        const existing = await AsyncStorage.getItem(key);
        const id = existing || generateId();
        if (!existing) {
          await AsyncStorage.setItem(key, id);
        }
        setUserId(id);
      } catch (error) {
        console.warn('Failed to load/create user ID:', error);
        // Fallback to temporary ID
        setUserId(generateId());
      }
    };
    
    loadOrCreateUserId();
  }, [username]);

  // Fetch remote progress when userId is ready and Supabase is configured
  // Note: In prototype mode, Supabase is stubbed, so this won't run
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
  }, [userId, username]);

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
      [resourceId]: { 
        ...prev[resourceId], 
        started: true, 
        completed: false, 
        conversationCompleted: false,
        conversationInProgress: false
      },
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

  const markConversationStarted = (resourceId) => {
    setProgress((prev) => ({
      ...prev,
      [resourceId]: { 
        ...prev[resourceId], 
        completed: true,
        conversationInProgress: true,
        conversationCompleted: false
      },
    }));
    syncProgress(resourceId, { completed: true, conversation_completed: false });
  };

  const markConversationComplete = (resourceId, topics = [], resources = {}) => {
    setProgress((prev) => ({
      ...prev,
      [resourceId]: { 
        ...prev[resourceId], 
        conversationInProgress: false,
        conversationCompleted: true 
      },
    }));
    // Award 100 XP for completing conversation
    setXp((prev) => prev + 100);
    
    // Calculate level based on completed topics
    // Level up when a full topic is completed
    if (topics && resources) {
      const completedTopics = topics.filter((topic) => {
        const topicResources = resources[topic.id] || [];
        return topicResources.every((r) => {
          const status = progress[r.id] || {};
          // Include the resource we're currently completing
          if (r.id === resourceId) return true;
          return status.conversationCompleted;
        });
      });
      const newLevel = completedTopics.length + 1;
      setLevel(newLevel);
    }
    
    // Update streak
    const today = new Date().toDateString();
    const lastDate = lastActiveDate ? new Date(lastActiveDate).toDateString() : null;
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    
    if (lastDate === yesterday) {
      setStreak((prev) => prev + 1); // Continue streak
    } else if (lastDate !== today) {
      setStreak(1); // Start new streak or reset to 1 for today
    }
    // If lastDate === today, streak stays the same (already counted today)
    
    setLastActiveDate(new Date().toISOString());
    
    syncProgress(resourceId, { conversation_completed: true });
  };

  const getResourceStatus = (resourceId) => {
    return progress[resourceId] || { 
      started: false, 
      completed: false, 
      conversationInProgress: false,
      conversationCompleted: false 
    };
  };

  const isResourceUnlocked = (topicId, resourceOrder, resources) => {
    // First resource in a topic is always available
    if (resourceOrder === 1) return true;

    const prevResource = resources.find((r) => r.order === resourceOrder - 1);
    if (!prevResource) return true;

    const status = getResourceStatus(prevResource.id);
    // Unlock when the previous resource has been marked complete AND conversation is completed
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
        xp,
        level,
        streak,
        markResourceStarted,
        markResourceComplete,
        markConversationStarted,
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
