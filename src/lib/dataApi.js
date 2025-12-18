/**
 * Data API - Returns mock data for prototype
 * 
 * TODO FOR DEVELOPERS:
 * Replace the implementations below with actual Supabase queries.
 * The data structure is already set up - just uncomment and modify
 * the Supabase calls when ready.
 */

import { supabase } from './supabaseClient';
import { topics as fallbackTopics, resources as fallbackResources } from '../data/mockData';

export const isSupabaseReady = false; // Set to true when Supabase is configured

/**
 * Fetch topics (or powerups) from the backend
 * Currently returns mock data
 * 
 * TODO: Replace with actual Supabase query when ready
 */
export async function fetchTopics() {
  // For prototype, always return mock data
  console.log('[dataApi] Using mock topics data');
  return fallbackTopics;

  /* TODO: Uncomment when Supabase is configured
  if (!isSupabaseReady || !supabase) {
    console.warn('[dataApi] Supabase not configured, using fallback topics');
    return fallbackTopics;
  }
  
  try {
    const { data, error } = await supabase
      .from('powerup_metadata')
      .select('id, title, theme, context, url, key_topics, transcript, created_at')
      .order('created_at', { ascending: true });
      
    if (error) throw error;
    if (!data || data.length === 0) {
      console.warn('[dataApi] powerup_metadata empty, using fallback topics');
      return fallbackTopics;
    }
    
    return data.map((p) => ({
      id: `powerup-${p.id}`,
      title: p.title || 'Power-Up',
      description: p.theme || 'Power-Up content',
      image: 'https://images.unsplash.com/photo-1557672172-298e090bd0f1?w=800&h=600&fit=crop&q=80',
      unlocked: false,
      position: p.id ?? 0,
      powerupId: p.id,
      keyTopics: p.key_topics || [],
      context: p.context || '',
      transcript: p.transcript || '',
      url: p.url || '',
    }));
  } catch (err) {
    console.warn('Supabase fetchTopics failed:', err?.message || err);
    return fallbackTopics;
  }
  */
}

/**
 * Fetch resources grouped by topic
 * Currently returns mock data
 * 
 * TODO: Replace with actual Supabase query when ready
 */
export async function fetchResourcesByTopic() {
  // For prototype, always return mock data
  console.log('[dataApi] Using mock resources data');
  return fallbackResources;

  /* TODO: Uncomment when Supabase is configured
  if (!isSupabaseReady || !supabase) {
    console.warn('[dataApi] Supabase not configured, using fallback resources');
    return fallbackResources;
  }
  
  try {
    const { data, error } = await supabase
      .from('powerup_metadata')
      .select('id, title, theme, context, url, key_topics, transcript, created_at');
      
    if (error) throw error;
    if (!data || data.length === 0) {
      console.warn('[dataApi] powerup_metadata empty, using fallback resources');
      return fallbackResources;
    }

    const grouped = {};
    data.forEach((p) => {
      const topicId = `powerup-${p.id}`;
      grouped[topicId] = [
        {
          id: `powerup-resource-${p.id}`,
          title: p.title || 'Power-Up Resource',
          type: 'video',
          duration: '',
          description: p.context || p.theme || 'Power-Up content',
          order: 1,
          thumbnail: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=450&fit=crop&q=80',
          link: p.url || '',
          powerupId: p.id,
          keyTopics: p.key_topics || [],
        },
      ];
    });

    return grouped;
  } catch (err) {
    console.warn('Supabase fetchResources failed:', err?.message || err);
    return fallbackResources;
  }
  */
}
