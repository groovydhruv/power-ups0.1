/**
 * Data API - Connects to Supabase backend
 */

import { supabase } from './supabaseClient';
import { topics as fallbackTopics, resources as fallbackResources } from '../data/mockData';

export const isSupabaseReady = true;

/**
 * Fetch topics (powerups) from Supabase
 */
export async function fetchTopics() {
  console.log('[dataApi] 🔄 Fetching topics from Supabase...');
  try {
    const { data, error } = await supabase
      .from('powerup_metadata')
      .select('id, title, theme, context, url, key_topics, transcript, created_at')
      .order('created_at', { ascending: true });
      
    if (error) {
      console.error('[dataApi] ❌ Supabase fetchTopics failed:', error);
      throw error;
    }
    
    if (!data || data.length === 0) {
      console.warn('[dataApi] ⚠️ No topics found in powerup_metadata, using mock data');
      return fallbackTopics;
    }
    
    console.log(`[dataApi] ✅ Fetched ${data.length} topics from DB`);
    
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
    console.error('[dataApi] ❌ Fatal error in fetchTopics:', err);
    return fallbackTopics;
  }
}

/**
 * Fetch resources from Supabase
 */
export async function fetchResourcesByTopic() {
  console.log('[dataApi] 🔄 Fetching resources from Supabase...');
  try {
    const { data, error } = await supabase
      .from('powerup_metadata')
      .select('id, title, theme, context, url, key_topics, transcript, created_at');
      
    if (error) {
      console.error('[dataApi] ❌ Supabase fetchResources failed:', error);
      throw error;
    }
    
    if (!data || data.length === 0) {
      console.warn('[dataApi] ⚠️ No resources found in powerup_metadata, using mock data');
      return fallbackResources;
    }

    console.log(`[dataApi] ✅ Fetched resources for ${data.length} powerups from DB`);

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
    console.error('[dataApi] ❌ Fatal error in fetchResourcesByTopic:', err);
    return fallbackResources;
  }
}
