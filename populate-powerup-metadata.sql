-- ============================================
-- Populate PowerUp Metadata Table
-- ============================================
-- Run this in your Supabase SQL Editor after creating the main schema
-- This maps learning resources to PowerUp entries for voice conversations

-- Week One PowerUps
INSERT INTO powerups.powerup_metadata (id, title, theme, context, url, key_topics, transcript)
VALUES 
(1, 'Stay hungry, stay foolish', 'Career & Life Philosophy', 
 'Steve Jobs'' 2005 Stanford Commencement Address about connecting the dots, following your passion, dealing with loss, and remembering mortality. A raw reminder that conventional success paths often lead to spiritual death.',
 'https://youtu.be/UF8uR6Z6KLc',
 ARRAY['passion', 'intuition', 'mortality', 'connecting dots', 'career choices'],
 'Full transcript would go here - you can add it later'),

(2, 'The Angel Philosopher', 'Money & Meaning',
 'Naval Ravikant on The Knowledge Project discussing wealth creation, meaning, happiness, and not wasting your one shot at life. Dense philosophical exploration of modern success.',
 'https://open.spotify.com/episode/5W0RQCDr28VSxVZOYJn3f5',
 ARRAY['wealth', 'meaning', 'happiness', 'leverage', 'philosophy'],
 'Full transcript available from podcast notes')

ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  theme = EXCLUDED.theme,
  context = EXCLUDED.context,
  url = EXCLUDED.url,
  key_topics = EXCLUDED.key_topics,
  updated_at = NOW();

-- Week Two PowerUps
INSERT INTO powerups.powerup_metadata (id, title, theme, context, url, key_topics, transcript)
VALUES 
(3, 'The Real Meaning of Life', 'Philosophy & Success',
 'A philosophical exploration that challenges conventional definitions of success and meaning. Twelve minutes that quietly attacks what you thought mattered.',
 'https://youtu.be/BHyVg2sXy5w',
 ARRAY['meaning', 'success', 'philosophy', 'values'],
 'Full transcript would go here'),

(4, 'Self-Knowledge', 'Psychology & Self-Discovery',
 'Mark Manson on digging up the unconscious stories and beliefs that run your life. How to find the narratives you inherited but never chose.',
 'https://www.dropbox.com/s/tv3w0zdebj1x3z6/Self',
 ARRAY['self-knowledge', 'beliefs', 'narratives', 'identity'],
 'Article content would go here'),

(5, 'Self-Awareness', 'Psychology & Ego',
 'Mark Manson on how your ego edits reality before you experience it. Understanding the gap between what happens and what you think happens.',
 'https://markmanson.net/self-awareness',
 ARRAY['self-awareness', 'ego', 'perception', 'blind spots'],
 'Article content would go here'),

(6, 'Happiness and Eudaimonia', 'Philosophy & Well-being',
 'Aristotle''s framework for human flourishing. Why feeling good was his lowest bar, not the goal. Ancient wisdom on what makes life worth living.',
 'http://www.pursuit-of-happiness.org/history-of-happiness/aristotle/',
 ARRAY['happiness', 'eudaimonia', 'virtue', 'flourishing', 'philosophy'],
 'Article content would go here')

ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  theme = EXCLUDED.theme,
  context = EXCLUDED.context,
  url = EXCLUDED.url,
  key_topics = EXCLUDED.key_topics,
  updated_at = NOW();

-- Week Three PowerUps
INSERT INTO powerups.powerup_metadata (id, title, theme, context, url, key_topics, transcript)
VALUES 
(7, 'Being Intentional', 'Productivity & Mindset',
 'A simple mental shift from drifting through days to deliberately choosing how they unfold. The difference between reacting and directing.',
 'https://www.lifeoptimizer.org/2018/02/10/being-intentional/',
 ARRAY['intentionality', 'mindfulness', 'decision-making', 'awareness'],
 'Article content would go here'),

(8, 'The Subtle Art of Not Giving a F**k', 'Values & Priorities',
 'Mark Manson''s framework for reallocating your limited f**ks. How to care about what actually matters and ignore the rest.',
 'https://youtu.be/zEESDrgidRM',
 ARRAY['priorities', 'values', 'caring', 'attention'],
 'Video summary content'),

(9, 'Fear Setting', 'Fear & Risk',
 'Tim Ferriss on defining your fears instead of your goals. A tactical method to expose fears as badly written horror scripts.',
 'https://youtu.be/5J6jAC6XxAI',
 ARRAY['fear', 'risk', 'decision-making', 'courage'],
 'TED talk transcript'),

(10, 'The Dunning-Kruger Effect', 'Psychology & Cognition',
 'Understanding the cognitive bias where incompetence prevents recognizing incompetence. Why "feeling sure" means nothing.',
 'https://youtu.be/Q9qjX1UhNo0',
 ARRAY['cognitive bias', 'confidence', 'competence', 'self-awareness'],
 'Video content'),

(11, '19 Great Truths My Grandmother Told Me', 'Wisdom & Life Lessons',
 'Short, suspiciously accurate rules from someone who''s played the whole game. Distilled wisdom that cuts through modern noise.',
 'http://www.marcandangel.com/2018/03/25/19-great-truths-my-grandmother-told-me-on-her-90th-birthday/',
 ARRAY['wisdom', 'life lessons', 'simplicity', 'truth'],
 'Article content would go here')

ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  theme = EXCLUDED.theme,
  context = EXCLUDED.context,
  url = EXCLUDED.url,
  key_topics = EXCLUDED.key_topics,
  updated_at = NOW();

-- Week Four PowerUps
INSERT INTO powerups.powerup_metadata (id, title, theme, context, url, key_topics, transcript)
VALUES 
(12, 'Inside the Mind of a Master Procrastinator', 'Productivity & Psychology',
 'Tim Urban''s hilarious and accurate tour of the mental circus behind "I''ll do it later." Understanding the forces that delay action.',
 'https://youtu.be/arj7oStGLkU',
 ARRAY['procrastination', 'productivity', 'psychology', 'habits'],
 'TED talk transcript'),

(13, 'Timeboxing', 'Time Management & Productivity',
 'Elon Musk''s method for forcing tasks to fit your calendar instead of expanding endlessly. Structured time allocation.',
 'https://youtu.be/fbAYK4KQrso',
 ARRAY['timeboxing', 'time management', 'productivity', 'scheduling'],
 'Video content'),

(14, 'The Eisenhower Matrix', 'Prioritization & Decision-Making',
 'A simple grid that reveals how much of your work is fake emergencies. Distinguishing urgent from important.',
 'https://youtu.be/tT89OZ7TNwc',
 ARRAY['prioritization', 'urgent', 'important', 'decision-making'],
 'Video content'),

(15, 'Atomic Habits', 'Habits & Systems',
 'James Clear on how tiny changes create remarkable results. Rigging your environment so good behavior is the lazy choice.',
 'https://youtu.be/YT7tQzmGRLA',
 ARRAY['habits', 'systems', 'environment design', 'behavior change'],
 'Video summary'),

(16, 'The Truth About Hard Work', 'Work & Leverage',
 'Naval Ravikant and Kapil Gupta on why unleveraged hard work is just a polite way to stay stuck. Finding multipliers.',
 'https://podcastnotes.org/naval-periscope-sessions/naval-kapil/',
 ARRAY['leverage', 'hard work', 'productivity', 'efficiency'],
 'Podcast notes content'),

(17, 'Social Media is Hacking You', 'Technology & Attention',
 'A breakdown of how your attention is being sold without consent. Understanding the attention economy and reclaiming focus.',
 'https://youtu.be/39RS3XbT2pU',
 ARRAY['social media', 'attention', 'technology', 'focus'],
 'Video content')

ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  theme = EXCLUDED.theme,
  context = EXCLUDED.context,
  url = EXCLUDED.url,
  key_topics = EXCLUDED.key_topics,
  updated_at = NOW();

-- Verify the data
SELECT id, title, theme, array_length(key_topics, 1) as topic_count
FROM powerups.powerup_metadata
ORDER BY id;

-- Check that all 17 PowerUps were created
SELECT COUNT(*) as total_powerups FROM powerups.powerup_metadata;

