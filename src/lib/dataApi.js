import { supabase } from './supabaseClient';
import { topics as fallbackTopics, resources as fallbackResources } from '../data/mockData';

const isSupabaseReady =
  !!import.meta.env.VITE_SUPABASE_URL && !!import.meta.env.VITE_SUPABASE_ANON_KEY;

/**
 * Fetch topics from Supabase. Falls back to local mock data on error.
 * Expected Supabase table: topics(id, title, description, image, position)
 */
export async function fetchTopics() {
  if (!isSupabaseReady) return fallbackTopics;
  try {
    const { data, error } = await supabase
      .from('topics')
      .select('id, title, description, image, position')
      .order('position', { ascending: true });
    if (error) throw error;
    if (!data) return fallbackTopics;
    return data.map((t) => ({
      id: t.id,
      title: t.title,
      description: t.description,
      image: t.image,
      unlocked: false, // unlock logic handled in TopicSelection
      position: t.position ?? 0,
    }));
  } catch (err) {
    console.warn('Supabase fetchTopics failed, using fallback:', err?.message || err);
    return fallbackTopics;
  }
}

/**
 * Fetch resources from Supabase. Falls back to local mock data on error.
 * Expected Supabase table: resources(id, topic_id, title, type, duration, description, order_in_topic, thumbnail, link)
 * Returns an object keyed by topicId => array of resources.
 */
export async function fetchResourcesByTopic() {
  if (!isSupabaseReady) return fallbackResources;
  try {
    const { data, error } = await supabase
      .from('resources')
      .select(
        'id, topic_id, title, type, duration, description, order_in_topic, thumbnail, link'
      );
    if (error) throw error;
    if (!data) return fallbackResources;

    const grouped = {};
    data.forEach((r) => {
      if (!grouped[r.topic_id]) grouped[r.topic_id] = [];
      grouped[r.topic_id].push({
        id: r.id,
        title: r.title,
        type: r.type,
        duration: r.duration,
        description: r.description,
        order: r.order_in_topic ?? 0,
        thumbnail: r.thumbnail,
        link: r.link,
      });
    });

    // Ensure each topic’s resources are sorted by order
    Object.keys(grouped).forEach((k) => {
      grouped[k] = grouped[k].sort((a, b) => a.order - b.order);
    });

    return grouped;
  } catch (err) {
    console.warn('Supabase fetchResources failed, using fallback:', err?.message || err);
    return fallbackResources;
  }
}

