# 🌐 Web Preview Guide

This React Native app can now run in your browser for quick iteration and testing!

## 🚀 Quick Start

### 1. Install Dependencies (First Time Only)

```bash
npm install
```

### 2. Start the Web Preview

```bash
npm run web
```

This will:
- Start a development server on `http://localhost:3000`
- Automatically open your browser
- Show the mobile UI in a phone-sized frame

### 3. Make Changes & See Updates

The app has **hot reload** enabled:
- Edit any component in `src/`
- Save the file
- Changes appear instantly in the browser (no refresh needed!)

## 📱 Viewing Options

### Desktop Browser (Current Setup)
The app shows in a mobile-sized frame (414px wide - iPhone size).

**To test different screen sizes:**
1. Open Chrome DevTools (F12 or Cmd+Option+I)
2. Click the device toggle icon (or Cmd+Shift+M)
3. Select different devices (iPhone, iPad, Pixel, etc.)

### Full Screen
Remove the `.mobile-frame` styles in `index.html` if you want full screen.

## 🎨 What You Can Test

✅ **Full Navigation Flow**
- Username entry
- Topic selection
- Resource lists
- Voice conversation UI

✅ **Interactions**
- Click/tap buttons
- Scroll lists
- Expand/collapse items
- Progress tracking

✅ **Visual Design**
- Colors and theming
- Layout and spacing
- Typography
- Images and icons

✅ **Data Flow**
- Mock data loading
- Progress persistence (localStorage in browser)
- Navigation between screens

## ⚠️ What Won't Work Exactly

Some mobile-specific features behave differently in the browser:

- **Gestures**: Swipe back works with browser back button
- **Keyboard**: Uses standard web keyboard instead of mobile keyboard
- **Safe Areas**: Won't show notch simulation
- **Permissions**: Microphone/camera permissions work differently

**These will all work perfectly when your developers test on real devices!**

## 🔧 Debugging

### React DevTools
Install the [React DevTools](https://chrome.google.com/webstore/detail/react-developer-tools/fmkadmapgofadopljbjfkapdkoienihi) Chrome extension to inspect components.

### Console Logs
Open browser console (F12) to see:
- Data loading logs
- Navigation events
- AsyncStorage operations (uses localStorage in browser)

### Network Tab
Check if images are loading correctly.

## 📦 Build for Production Preview

```bash
npm run build:web
npm run preview:web
```

This creates an optimized build and previews it.

## 🔄 Switching Between Mobile & Web

### Run Mobile (iOS/Android)
```bash
npm run ios      # iOS simulator (Mac only)
npm run android  # Android emulator
```

### Run Web Preview
```bash
npm run web      # Browser preview
```

Both use the **same codebase** - changes affect both!

## 💡 Tips for Iteration

1. **Keep the web preview running** while you edit
2. **Use browser DevTools** to inspect element sizes and layouts
3. **Test on different screen sizes** using DevTools device toolbar
4. **Check console** for any warnings or errors
5. **Refresh page** if hot reload doesn't work (Cmd+R or Ctrl+R)

## 🎯 Common Tasks

### Change Colors
Edit `src/styles/theme.js` - changes appear immediately

### Modify Layout
Edit component files in `src/components/` - hot reload updates the view

### Update Mock Data
Edit `src/data/mockData.js` to test with different content

### Test Navigation
Click through the app flow - all navigation works in browser

## ✨ This is Perfect For

- 👀 **Showing stakeholders** - Share `localhost:3000` on your network
- 🎨 **Design iterations** - Quick visual tweaks
- 📝 **Content testing** - Try different text/images
- 🔄 **Flow testing** - Walk through user journeys
- 🐛 **Bug hunting** - Faster than mobile emulators

## 🚀 Ready to Hand Off?

When you're happy with the UI:
1. Your developers run `npm run ios` or `npm run android`
2. They see the **exact same UI** on mobile
3. They follow `INTEGRATION_GUIDE.md` to add backend

---

**Pro Tip**: Keep this running in a browser tab while working - instant feedback is 🔥!

