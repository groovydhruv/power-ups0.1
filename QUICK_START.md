# 🎯 Quick Reference: Supabase Setup

## Step 1: Run This SQL in Supabase

1. Go to: **https://gzyfqozaremfkgrkrufb.supabase.co**
2. Click: **SQL Editor** (left sidebar)
3. Click: **New Query**
4. Copy contents from: `supabase-schema.sql`
5. Click: **Run**

## Step 2: Verify Tables Were Created

Run this in SQL Editor:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'powerups';
```

Expected result: 4 tables
- `users`
- `user_progress`
- `user_stats`
- `powerup_metadata`

## Step 3: Test Your App

```bash
npm run web
```

Then:
1. Create a username
2. Complete a conversation
3. Check if data appears in Supabase tables

## Verify Data in Supabase

```sql
-- Check users
SELECT * FROM powerups.users;

-- Check stats (XP, level, streak)
SELECT * FROM powerups.user_stats;

-- Check progress
SELECT * FROM powerups.user_progress;
```

## What's Already Done ✅

- Supabase installed
- Client configured
- Schema: `powerups`
- URL: `https://gzyfqozaremfkgrkrufb.supabase.co`
- Code updated to sync data automatically

## Database Schema Overview

```
powerups.users
├─ id (TEXT, PK)
├─ username (TEXT, UNIQUE)
└─ created_at, updated_at

powerups.user_progress
├─ id (SERIAL, PK)
├─ user_id (FK → users.id)
├─ resource_id (TEXT)
├─ started (BOOLEAN)
├─ completed (BOOLEAN)
└─ conversation_completed (BOOLEAN)

powerups.user_stats
├─ user_id (TEXT, PK, FK → users.id)
├─ xp (INTEGER)
├─ level (INTEGER)
├─ streak (INTEGER)
└─ last_active_date (TIMESTAMP)

powerups.powerup_metadata
├─ id (SERIAL, PK)
├─ title (TEXT)
├─ theme (TEXT)
├─ context (TEXT)
├─ url (TEXT)
├─ key_topics (TEXT[])
└─ transcript (TEXT)
```

## Troubleshooting

**Error: "relation does not exist"**
→ Run the SQL schema in Supabase

**No data saving**
→ Check browser console for errors
→ Verify SQL schema was executed

**Can't connect to Supabase**
→ Check credentials in `src/lib/supabaseClient.js`
→ Verify schema name is `powerups`

## Files to Review

- `supabase-schema.sql` - Complete SQL to run
- `SUPABASE_SETUP_GUIDE.md` - Detailed guide
- `INTEGRATION_COMPLETE.md` - What was changed
- `src/lib/supabaseClient.js` - Configuration
- `src/context/ProgressContext.jsx` - Sync logic

---

**That's it! Run the SQL and you're ready to go! 🚀**

