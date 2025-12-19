# Gamification System Documentation

## Overview

The Power-Ups learning platform uses a minimalist gamification system with three core mechanics: **XP (Experience Points)**, **Levels**, and **Daily Streaks**. These systems are designed to motivate learners without being overly distracting or game-like.

---

## 🌟 XP (Experience Points) System

### How XP Works

- **Starting XP**: Users begin with `0 XP`
- **Earning XP**: Users earn **100 XP** for each completed conversation
- **Trigger**: XP is awarded when a user clicks the "End Conversation" button after completing a voice conversation with Navi
- **Display**: XP is shown in a prominent card at the top of the main screen with a star emoji (⭐)

### XP Calculation

```javascript
// XP is awarded upon conversation completion
When: User clicks "End Conversation"
Reward: +100 XP
```

### Key Points

- XP is cumulative and never decreases
- Only completed conversations award XP (not just viewing or starting resources)
- Each conversation awards the same amount (100 XP) regardless of topic difficulty
- XP persists across sessions via AsyncStorage

---

## 🏆 Level System

### How Levels Work

- **Starting Level**: Users begin at `Level 1`
- **Level Progression**: Level increases by 1 for each completed topic
- **Trigger**: Level is calculated when the last resource in a topic is completed
- **Display**: Level is shown in a prominent card at the top with a trophy emoji (🏆)

### Level Calculation Logic

```javascript
Level = Number of Completed Topics + 1

Example:
- 0 topics completed = Level 1 (starting level)
- 1 topic completed = Level 2
- 2 topics completed = Level 3
- And so on...
```

### Topic Completion Criteria

A topic is considered "completed" when:
1. **All resources** in that topic have been consumed
2. **All conversations** for those resources have been completed (clicked "End Conversation")

### Key Points

- Levels are sequential and tied directly to topic completion
- You cannot skip levels
- Levels never decrease
- Topics must be completed in order (subsequent topics are locked until the previous one is finished)
- Levels persist across sessions via AsyncStorage

---

## 🔥 Daily Streak System

### How Streaks Work

- **Starting Streak**: Users begin with `0 days`
- **Streak Increment**: Increases by 1 when a user completes a conversation on a new day
- **Trigger**: Calculated when "End Conversation" is clicked
- **Display**: Streak is shown in a prominent card at the top with a fire emoji (🔥)

### Streak Calculation Logic

The system compares the last active date with today's date:

```javascript
const today = new Date().toDateString();
const lastDate = lastActiveDate ? new Date(lastActiveDate).toDateString() : null;
const yesterday = new Date(Date.now() - 86400000).toDateString();

if (lastDate === yesterday) {
  streak += 1; // Continue streak (consecutive day)
} else if (lastDate !== today) {
  streak = 1; // Start new streak (broke streak or first activity)
}
// If lastDate === today, streak stays the same (already counted today)
```

### Streak Scenarios

| Last Active Date | Today's Activity | Result |
|-----------------|------------------|---------|
| Yesterday | Complete conversation | Streak +1 (continued) |
| 2+ days ago | Complete conversation | Streak resets to 1 |
| Today (earlier) | Complete another conversation | Streak unchanged |
| Never | Complete first conversation | Streak = 1 |

### Key Points

- Streaks measure **consecutive days** of activity
- Only **one activity per day** counts (multiple conversations in one day don't increase streak)
- Missing a day resets the streak to 1 (not 0, to count the current day)
- Streaks persist across sessions via AsyncStorage

---

## 🎯 How the Systems Work Together

### Typical User Flow

1. **User starts learning** (Level 1, 0 XP, 0 day streak)
2. **User completes first conversation** → +100 XP, Streak = 1 day
3. **User completes all conversations in Topic 1** → Level 2
4. **User returns next day and completes a conversation** → +100 XP, Streak = 2 days
5. **Continues until all topics are completed** → Final Level = Number of Topics + 1

### Example Progression

| Action | XP | Level | Streak |
|--------|-------|-------|---------|
| Start | 0 | 1 | 0 |
| Complete 1st conversation (Day 1) | 100 | 1 | 1 |
| Complete 2nd conversation (Day 1) | 200 | 1 | 1 |
| Complete Topic 1 (Day 1) | 200+ | 2 | 1 |
| Complete 1st conversation (Day 2) | 300+ | 2 | 2 |
| Skip Day 3 | 300+ | 2 | 2 |
| Complete conversation (Day 4) | 400+ | 2 | 1 |

---

## 📊 Visual Indicators

### Stat Cards Display

All three metrics are displayed prominently at the top of the main screen in three equal-width cards:

```
┌─────────────────┬─────────────────┬─────────────────┐
│       🏆        │       🔥        │       ⭐        │
│        2        │        1        │       300       │
│      LEVEL      │   DAY STREAK    │       XP        │
└─────────────────┴─────────────────┴─────────────────┘
```

### Additional Visual Feedback

- **Completed Topics**: Show a large green checkmark (✅) in the center of the topic card image
- **Completed Resources**: Show a prominent green checkmark instead of action buttons
- **In-Progress Resources**: Blue border (2px)
- **Next Resource to Consume**: Dark border (3px) with enhanced shadow
- **Progress Indicators**: Show X/Y completed count with a visual progress bar

---

## 💾 Data Persistence

### Storage Method

All gamification data is stored locally using React Native's `AsyncStorage`:

- `learning-platform-progress-xp`: Stores XP value
- `learning-platform-progress-level`: Stores current level
- `learning-platform-progress-streak`: Stores current streak
- `learning-platform-progress-lastActive`: Stores last active date (ISO string)
- `learning-platform-progress`: Stores resource completion status

### Automatic Saving

Data is automatically saved whenever any value changes:
- Real-time updates (no manual save required)
- Survives app restarts
- Per-user data isolation (based on username)

### Data Reset

To reset a user's progress, clear AsyncStorage:
```javascript
await AsyncStorage.clear();
```

---

## 🔧 Technical Implementation

### Context Provider

The gamification system is implemented in `src/context/ProgressContext.jsx`:

- **State Management**: React hooks (`useState`, `useEffect`)
- **Persistence**: AsyncStorage for local data
- **Future-Ready**: Stubbed Supabase integration for backend sync

### Key Functions

- `markConversationComplete(resourceId, topics, resources)`: Awards XP, calculates level, updates streak
- `markConversationStarted(resourceId)`: Marks conversation as in-progress
- `getResourceStatus(resourceId)`: Returns completion status
- `isResourceUnlocked(topicId, resourceOrder, resources)`: Checks if resource is accessible

### Exposed Context Values

```javascript
{
  xp,              // Current XP
  level,           // Current level
  streak,          // Current daily streak
  progress,        // Resource completion status
  markResourceStarted,
  markResourceComplete,
  markConversationStarted,
  markConversationComplete,
  getResourceStatus,
  isResourceUnlocked,
  getTopicProgress
}
```

---

## 🚀 Future Enhancements (Optional)

If you want to expand the gamification system in the future, consider:

- **Achievements/Badges**: For special milestones
- **XP-based rewards**: Unlock themes, avatars, or features at certain XP thresholds
- **Leaderboards**: Compare progress with other learners (requires backend)
- **Streak rewards**: Bonus XP for maintaining long streaks
- **Variable XP**: Award more XP for harder topics or longer conversations
- **Weekly goals**: Additional metric for engagement

---

## 📝 Summary

| Metric | Starting Value | How to Earn | Display |
|--------|----------------|-------------|---------|
| **XP** | 0 | +100 per completed conversation | ⭐ 300 XP |
| **Level** | 1 | +1 per completed topic | 🏆 Level 2 |
| **Streak** | 0 | +1 per consecutive active day | 🔥 1 day streak |

**The system is intentionally minimal** to maintain focus on learning while providing gentle motivation and progress tracking. All metrics are cumulative and positive (never decrease), creating an encouraging experience.

