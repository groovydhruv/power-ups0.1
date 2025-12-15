import { supabase } from './supabaseClient';
import { topics as fallbackTopics, resources as fallbackResources } from '../data/mockData';

export const isSupabaseReady =
  !!import.meta.env.VITE_SUPABASE_URL && !!import.meta.env.VITE_SUPABASE_ANON_KEY;

/**
 * Fetch powerups from Supabase powerup_metadata table and map to topic/resource shape.
 * Falls back to local mock data on error.
 */
export async function fetchTopics() {
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
    console.info('[dataApi] Loaded powerups from Supabase:', data.length);
    return data.map((p) => ({
      id: `powerup-${p.id}`,
      title: p.title || 'Power-Up',
      description: p.theme || 'Power-Up content',
      image:
        'https://images.unsplash.com/photo-1557672172-298e090bd0f1?w=800&h=600&fit=crop&q=80',
      unlocked: false,
      position: p.id ?? 0,
      powerupId: p.id,
      keyTopics: p.key_topics || [],
      context: p.context || '',
      transcript: p.transcript || '',
      url: p.url || '',
    }));
  } catch (err) {
    console.warn('Supabase fetchTopics (powerup_metadata) failed, using fallback:', err?.message || err);
    return fallbackTopics;
  }
}

export async function fetchResourcesByTopic() {
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

    console.info('[dataApi] Loaded resources from powerup_metadata:', data.length);
    return grouped;
  } catch (err) {
    console.warn('Supabase fetchResources failed, using fallback:', err?.message || err);
    return fallbackResources;
  }
}

