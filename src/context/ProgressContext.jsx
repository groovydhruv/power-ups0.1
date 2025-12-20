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

  // establish stable userId and initialize in DB
  useEffect(() => {
    if (!username) return;
    
    const initializeUser = async () => {
      try {
        const key = `navi_user_id_${username}`;
        const existing = await AsyncStorage.getItem(key);
        const id = existing || generateId();
        if (!existing) {
          await AsyncStorage.setItem(key, id);
          console.log(`[ProgressContext] Generated new user ID for ${username}: ${id}`);
        } else {
          console.log(`[ProgressContext] Loaded existing user ID for ${username}: ${id}`);
        }
        setUserId(id);

        if (isSupabaseReady && supabase) {
          console.log(`[ProgressContext] 🚀 Attempting DB initialization for user: ${username} (${id})`);
          
          // 1. Ensure user exists
          const { data: userData, error: userError } = await supabase
            .from('users')
            .upsert({ id, username })
            .select();
          
          if (userError) {
            console.error('[ProgressContext] ❌ User upsert failed:', {
              message: userError.message,
              code: userError.code,
              details: userError.details,
              hint: userError.hint
            });
          } else {
            console.log('[ProgressContext] ✅ User upsert successful:', userData);
          }
          
          // 2. Ensure stats exist
          const { data: stats, error: statsFetchError } = await supabase
            .from('user_stats')
            .select('user_id')
            .eq('user_id', id)
            .single();
          
          if (statsFetchError && statsFetchError.code !== 'PGRST116') {
            console.error('[ProgressContext] ❌ Stats fetch failed:', statsFetchError);
          }

          if (!stats) {
            console.log('[ProgressContext] ℹ️ No stats found, creating initial stats...');
            const { data: newStats, error: statsInsertError } = await supabase
              .from('user_stats')
              .insert({
                user_id: id,
                xp: 0,
                level: 1,
                streak: 0
              })
              .select();
            
            if (statsInsertError) {
              console.error('[ProgressContext] ❌ Initial stats creation failed:', statsInsertError);
            } else {
              console.log('[ProgressContext] ✅ Initial stats created:', newStats);
            }
          } else {
            console.log('[ProgressContext] ✅ Existing stats found for user');
          }
        } else {
          console.warn('[ProgressContext] ⚠️ Supabase not ready for initialization');
        }
      } catch (error) {
        console.error('[ProgressContext] ❌ Fatal error in initializeUser:', error);
      }
    };
    
    initializeUser();
  }, [username]);

  // Fetch remote progress when userId is ready and Supabase is configured
  useEffect(() => {
    const fetchProgress = async () => {
      if (!isSupabaseReady || !supabase || !userId) {
        console.log('[ProgressContext] ⏳ Fetch progress deferred: Supabase or userId not ready');
        return;
      }
      
      try {
        console.log(`[ProgressContext] 🔄 Fetching remote progress for user: ${userId}`);
        
        // Fetch user progress
        const { data, error } = await supabase
          .from('user_progress')
          .select('resource_id, started, completed, conversation_completed, conversation_history')
          .eq('user_id', userId);
          
        if (error) {
          console.error('[ProgressContext] ❌ Fetch progress failed:', error);
          throw error;
        }
        
        console.log(`[ProgressContext] ✅ Fetched ${data?.length || 0} progress rows`);
        
        const merged = {};
        (data || []).forEach((row) => {
          merged[row.resource_id] = {
            started: !!row.started,
            completed: !!row.completed,
            conversationCompleted: !!row.conversation_completed,
            conversationHistory: row.conversation_history || null
          };
        });
        setProgress((prev) => ({ ...prev, ...merged }));

        // Fetch user stats (XP, level, streak)
        console.log(`[ProgressContext] 🔄 Fetching user stats for: ${userId}`);
        const { data: statsData, error: statsError } = await supabase
          .from('user_stats')
          .select('xp, level, streak, last_active_date')
          .eq('user_id', userId)
          .single();

        if (statsError) {
          if (statsError.code === 'PGRST116') {
            console.log('[ProgressContext] ℹ️ No stats found in fetchProgress (expected for new users)');
          } else {
            console.error('[ProgressContext] ❌ User stats fetch failed:', statsError);
          }
        } else if (statsData) {
          console.log('[ProgressContext] ✅ User stats loaded:', statsData);
          setXp(statsData.xp || 0);
          setLevel(statsData.level || 1);
          setStreak(statsData.streak || 0);
          setLastActiveDate(statsData.last_active_date || null);
        }
      } catch (err) {
        console.error('[ProgressContext] ❌ Supabase fetch progress fatal error:', err);
      }
    };
    
    fetchProgress();
  }, [userId, username]);

  const syncProgress = async (resourceId, payload) => {
    if (!isSupabaseReady || !supabase || !userId) {
      console.warn('[ProgressContext] ⚠️ syncProgress skipped: Supabase or userId not ready');
      return;
    }
    
    try {
      console.log(`[ProgressContext] 📤 Syncing progress for ${resourceId}:`, payload);
      const { data, error } = await supabase
        .from('user_progress')
        .upsert(
          {
            user_id: userId,
            resource_id: resourceId,
            ...payload,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id,resource_id' }
        )
        .select();
      
      if (error) {
        console.error('[ProgressContext] ❌ Supabase sync progress failed:', error);
      } else {
        console.log('[ProgressContext] ✅ Supabase sync progress successful:', data);
      }
    } catch (err) {
      console.error('[ProgressContext] ❌ Supabase sync progress fatal error:', err);
    }
  };

  const syncStats = async (statsPayload) => {
    if (!isSupabaseReady || !supabase || !userId) {
      console.warn('[ProgressContext] ⚠️ syncStats skipped: Supabase or userId not ready');
      return;
    }
    
    try {
      console.log(`[ProgressContext] 📤 Syncing user stats:`, statsPayload);
      const { data, error } = await supabase
        .from('user_stats')
        .upsert(
          {
            user_id: userId,
            ...statsPayload,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' }
        )
        .select();
      
      if (error) {
        console.error('[ProgressContext] ❌ Supabase stats sync failed:', error);
      } else {
        console.log('[ProgressContext] ✅ Supabase stats sync successful:', data);
      }
    } catch (err) {
      console.error('[ProgressContext] ❌ Supabase stats sync fatal error:', err);
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
        started: true,
        conversationInProgress: true,
        conversationCompleted: false
      },
    }));
    // Explicitly set started: true when they enter the conversation
    syncProgress(resourceId, { started: true, conversation_completed: false });
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
    const newXp = xp + 100;
    setXp(newXp);
    
    // Calculate level based on completed topics
    // Level up when a full topic is completed
    let newLevel = level;
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
      newLevel = completedTopics.length + 1;
      setLevel(newLevel);
    }
    
    // Update streak
    const today = new Date().toDateString();
    const lastDate = lastActiveDate ? new Date(lastActiveDate).toDateString() : null;
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    
    let newStreak = streak;
    if (lastDate === yesterday) {
      newStreak = streak + 1;
      setStreak(newStreak); // Continue streak
    } else if (lastDate !== today) {
      newStreak = 1;
      setStreak(1); // Start new streak or reset to 1 for today
    }
    // If lastDate === today, streak stays the same (already counted today)
    
    const newLastActive = new Date().toISOString();
    setLastActiveDate(newLastActive);
    
    syncProgress(resourceId, { conversation_completed: true });
    syncStats({
      xp: newXp,
      level: newLevel,
      streak: newStreak,
      last_active_date: newLastActive
    });
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

  const saveConversationHistory = async (resourceId, history) => {
    if (!isSupabaseReady || !supabase || !userId) {
      console.warn('[ProgressContext] ⚠️ saveConversationHistory skipped: Supabase or userId not ready');
      return;
    }
    
    try {
      console.log(`[ProgressContext] 📤 Saving conversation history for ${resourceId} (${history?.length || 0} messages)`);
      const { data, error } = await supabase
        .from('user_progress')
        .upsert(
          {
            user_id: userId,
            resource_id: resourceId,
            conversation_history: history,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id,resource_id' }
        )
        .select();
      
      if (error) {
        console.error('[ProgressContext] ❌ Supabase history save failed:', JSON.stringify(error, null, 2));
      } else {
        console.log('[ProgressContext] ✅ Supabase history save successful:', data);
      }
    } catch (err) {
      console.error('[ProgressContext] ❌ Supabase history save fatal error:', err);
    }
  };

  return (
    <ProgressContext.Provider
      value={{
        userId,
        progress,
        xp,
        level,
        streak,
        markResourceStarted,
        markResourceComplete,
        markConversationStarted,
        markConversationComplete,
        saveConversationHistory,
        getResourceStatus,
        isResourceUnlocked,
        getTopicProgress,
      }}
    >
      {children}
    </ProgressContext.Provider>
  );
};
