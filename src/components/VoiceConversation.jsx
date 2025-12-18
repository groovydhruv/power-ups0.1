import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet,
  ImageBackground,
  SafeAreaView,
  ScrollView,
  Animated,
  Dimensions,
  Image 
} from 'react-native';
import { useProgress } from '../context/ProgressContext';
import { CloseIcon, MicIcon, CheckIcon } from './Icons';
import { colors, spacing, borderRadius, fontSize } from '../styles/theme';

const { width } = Dimensions.get('window');
const isMobile = width < 600;

/**
 * MOCK WALKIE-TALKIE VOICE CONVERSATION SCREEN
 * 
 * TODO FOR DEVELOPERS:
 * This is a UI prototype for async voice note conversations.
 * To integrate real voice recording and playback:
 * 1. Install: npm install expo-av (for audio recording/playback)
 * 2. Request microphone permissions (iOS/Android)
 * 3. Replace mock recording with actual Audio.Recording
 * 4. Implement audio playback with Audio.Sound
 * 5. Store voice notes in backend/storage
 * 6. Use WebSocket or polling for new messages from Navi
 * 
 * See INTEGRATION_GUIDE.md for detailed instructions.
 */

// Mock voice messages data
const mockMessages = [
  {
    id: '1',
    sender: 'navi',
    duration: 45,
    timestamp: new Date(Date.now() - 300000).toISOString(),
    isPlaying: false
  },
  {
    id: '2',
    sender: 'user',
    duration: 32,
    timestamp: new Date(Date.now() - 240000).toISOString(),
    isPlaying: false
  },
  {
    id: '3',
    sender: 'navi',
    duration: 28,
    timestamp: new Date(Date.now() - 180000).toISOString(),
    isPlaying: false
  },
];

export default function VoiceConversation({ resource, topics = [], resources = {}, onExit }) {
  const { markConversationStarted, markConversationComplete } = useProgress();
  const [messages, setMessages] = useState(mockMessages);
  const [playingId, setPlayingId] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [pulseAnim] = useState(new Animated.Value(1));
  const [scaleAnim] = useState(new Animated.Value(1));

  // Mark conversation as in progress when component mounts
  useEffect(() => {
    markConversationStarted(resource.id);
  }, []);

  // Recording timer
  useEffect(() => {
    let interval;
    if (isRecording) {
    const start = Date.now();
      interval = setInterval(() => {
        setRecordingDuration(Math.floor((Date.now() - start) / 1000));
      }, 100);
    } else {
      setRecordingDuration(0);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  // Pulse animation when recording
  useEffect(() => {
    if (isRecording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.3,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isRecording, pulseAnim]);

  const formatDuration = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const formatTimestamp = (isoString) => {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  const handlePlayPause = (messageId) => {
    if (playingId === messageId) {
      setPlayingId(null);
    } else {
      setPlayingId(messageId);
      // Mock: auto-stop after duration (in real app, this would be tied to actual audio playback)
      const message = messages.find(m => m.id === messageId);
      setTimeout(() => setPlayingId(null), message.duration * 1000);
    }
  };

  const handleRecordStart = () => {
    setIsRecording(true);
    Animated.spring(scaleAnim, {
      toValue: 1.1,
      useNativeDriver: true,
    }).start();
  };

  const handleRecordStop = () => {
    setIsRecording(false);
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
    
    // Mock: add new message from user
    if (recordingDuration > 0) {
      const newMessage = {
        id: Date.now().toString(),
        sender: 'user',
        duration: recordingDuration,
        timestamp: new Date().toISOString(),
        isPlaying: false
      };
      setMessages([...messages, newMessage]);
    }
  };

  const handleEndConversation = () => {
    markConversationComplete(resource.id, topics, resources);
    onExit();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
          {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={onExit}
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerSubtitle}>Discussion on {resource.title}</Text>
        </View>

        <View style={styles.card}>
          {/* Topic Info with Navi Avatar */}
          <View style={styles.topicInfo}>
            <Image
              source={{ uri: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=200&h=200&fit=crop&q=80' }}
              style={styles.naviAvatar}
            />
            <View style={styles.titleContainer}>
              <Text style={styles.topicTitle}>Navi</Text>
            </View>
          </View>

          {/* Understanding Bar */}
          <View style={styles.understandingSection}>
            <Text style={styles.understandingLabel}>UNDERSTANDING BAR</Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: '0%' }]} />
            </View>
          </View>

          {/* Prototype Notice */}
          <View style={styles.prototypeNotice}>
            <Text style={styles.prototypeText}>
              🎤 This is a UI prototype. Voice conversation features will be integrated by your developers using LiveKit.
            </Text>
          </View>

          {/* Messages Thread */}
          <ScrollView 
            style={styles.messagesContainer}
            contentContainerStyle={styles.messagesContent}
            showsVerticalScrollIndicator={false}
          >
            {messages.map((message) => {
              const isNavi = message.sender === 'navi';
              const isPlaying = playingId === message.id;
              
              return (
                <View
                  key={message.id}
                  style={[
                    styles.messageRow,
                    isNavi ? styles.messageRowNavi : styles.messageRowUser
                  ]}
                >
                  <View style={[
                    styles.messageBubble,
                    isNavi ? styles.messageBubbleNavi : styles.messageBubbleUser
                  ]}>
                    <View style={styles.messageHeader}>
                      <Text style={[
                        styles.messageSender,
                        isNavi ? styles.messageSenderNavi : styles.messageSenderUser
                      ]}>
                        {isNavi ? 'Navi' : 'You'}
                      </Text>
                      <Text style={styles.messageTime}>
                        {formatTimestamp(message.timestamp)}
                      </Text>
                    </View>
                    
                    <TouchableOpacity
                      onPress={() => handlePlayPause(message.id)}
                      style={styles.audioPlayer}
                      activeOpacity={0.7}
                    >
                      <View style={[
                        styles.playButton,
                        isNavi ? styles.playButtonNavi : styles.playButtonUser
                      ]}>
                        {isPlaying ? (
                          <View style={styles.pauseIcon}>
                            <View style={[styles.pauseBar, isNavi ? styles.pauseBarNavi : styles.pauseBarUser]} />
                            <View style={[styles.pauseBar, isNavi ? styles.pauseBarNavi : styles.pauseBarUser]} />
                          </View>
                        ) : (
                          <View style={[styles.playIcon, isNavi ? styles.playIconNavi : styles.playIconUser]} />
                        )}
                      </View>
                      
                      <View style={styles.waveform}>
                        {[...Array(20)].map((_, i) => {
                          // Create varied heights for waveform visual
                          const heights = [30, 50, 70, 90, 60, 80, 95, 70, 85, 75, 65, 80, 90, 70, 60, 75, 85, 70, 50, 40];
                          const height = heights[i];
                          return (
                            <View
                              key={i}
                              style={[
                                styles.waveformBar,
                                isNavi ? styles.waveformBarNavi : styles.waveformBarUser,
                                isPlaying && i < 10 && styles.waveformBarActive,
                                { height: `${height}%` }
                              ]}
                            />
                          );
                        })}
                      </View>
                      
                      <Text style={[
                        styles.duration,
                        isNavi ? styles.durationNavi : styles.durationUser
                      ]}>
                        {formatDuration(message.duration)}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </ScrollView>

          {/* Recording Controls */}
          <View style={styles.recordingSection}>
            {isRecording && (
              <View style={styles.recordingIndicator}>
                <Animated.View style={[
                  styles.recordingDot,
                  { transform: [{ scale: pulseAnim }] }
                ]} />
                <Text style={styles.recordingText}>
                  Recording... {formatDuration(recordingDuration)}
                </Text>
              </View>
            )}
            
            <View style={styles.recordingControls}>
              <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
                <TouchableOpacity
                  onPressIn={handleRecordStart}
                  onPressOut={handleRecordStop}
                  style={[
                    styles.recordButton,
                    isRecording && styles.recordButtonActive
                  ]}
                  activeOpacity={0.9}
                >
                  <MicIcon 
                    color={isRecording ? colors.primaryLight : colors.textPrimary} 
                    boxSize={28} 
                  />
                </TouchableOpacity>
              </Animated.View>

              <TouchableOpacity
                onPress={handleEndConversation}
                style={styles.endButton}
                activeOpacity={0.8}
              >
                <Text style={styles.endButtonText}>End Conversation</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
  },
  header: {
    padding: isMobile ? spacing.lg : spacing.xl,
    paddingTop: isMobile ? spacing.md : spacing.lg,
    paddingBottom: isMobile ? spacing.lg : spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.cardBackground,
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    minHeight: 48,
    justifyContent: 'center',
    marginBottom: spacing.sm,
    backgroundColor: colors.buttonBackground,
  },
  backButtonText: {
    fontSize: isMobile ? fontSize.md : fontSize.lg,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  headerSubtitle: {
    fontSize: isMobile ? fontSize.sm : fontSize.md,
    color: colors.textSecondary,
    lineHeight: isMobile ? fontSize.sm * 1.5 : fontSize.md * 1.5,
  },
  card: {
    flex: 1,
    backgroundColor: colors.cardBackground,
    padding: isMobile ? spacing.lg : spacing.xl,
  },
  topicInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: isMobile ? spacing.md : spacing.lg,
    marginBottom: isMobile ? spacing.lg : spacing.xl,
    paddingBottom: isMobile ? spacing.lg : spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  naviAvatar: {
    width: isMobile ? 56 : 64,
    height: isMobile ? 56 : 64,
    borderRadius: isMobile ? 28 : 32,
    backgroundColor: colors.cardBackgroundSecondary,
    borderWidth: 2,
    borderColor: colors.border,
  },
  titleContainer: {
    flex: 1,
  },
  topicTitle: {
    fontSize: isMobile ? fontSize.xl : fontSize.xxl,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  understandingSection: {
    marginBottom: spacing.lg,
  },
  understandingLabel: {
    fontSize: fontSize.xs - 1,
    fontWeight: '500',
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: spacing.sm,
  },
  progressBar: {
    height: 4,
    backgroundColor: colors.progressBar,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.green,
  },
  prototypeNotice: {
    padding: spacing.md,
    backgroundColor: colors.buttonBackground,
    borderRadius: borderRadius.md,
    marginBottom: spacing.lg,
  },
  prototypeText: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: fontSize.xs * 1.5,
  },
  messagesContainer: {
    flex: 1,
    marginBottom: spacing.md,
  },
  messagesContent: {
    paddingVertical: spacing.sm,
  },
  messageRow: {
    marginBottom: spacing.md,
  },
  messageRowNavi: {
    alignItems: 'flex-start',
  },
  messageRowUser: {
    alignItems: 'flex-end',
  },
  messageBubble: {
    maxWidth: '85%',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
  },
  messageBubbleNavi: {
    backgroundColor: colors.cardBackgroundSecondary,
    borderColor: colors.border,
  },
  messageBubbleUser: {
    backgroundColor: colors.primaryDark,
    borderColor: colors.primary,
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  messageSender: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  messageSenderNavi: {
    color: colors.textSecondary,
  },
  messageSenderUser: {
    color: colors.primaryLight,
  },
  messageTime: {
    fontSize: fontSize.xs - 1,
    color: colors.textTertiary,
    marginLeft: spacing.sm,
  },
  audioPlayer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  playButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButtonNavi: {
    backgroundColor: colors.primary,
  },
  playButtonUser: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  playIcon: {
    width: 0,
    height: 0,
    borderLeftWidth: 10,
    borderTopWidth: 7,
    borderBottomWidth: 7,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    marginLeft: 2,
  },
  playIconNavi: {
    borderLeftColor: colors.primaryLight,
  },
  playIconUser: {
    borderLeftColor: colors.primaryDark,
  },
  pauseIcon: {
    flexDirection: 'row',
    gap: 3,
  },
  pauseBar: {
    width: 3,
    height: 12,
    borderRadius: 1,
  },
  pauseBarNavi: {
    backgroundColor: colors.primaryLight,
  },
  pauseBarUser: {
    backgroundColor: colors.primaryDark,
  },
  waveform: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    height: 32,
  },
  waveformBar: {
    width: 3,
    borderRadius: 2,
  },
  waveformBarNavi: {
    backgroundColor: colors.textPrimary,
    opacity: 0.7,
  },
  waveformBarUser: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
  },
  waveformBarActive: {
    opacity: 1,
  },
  duration: {
    fontSize: fontSize.xs,
    fontWeight: '500',
    fontVariant: ['tabular-nums'],
  },
  durationNavi: {
    color: colors.textSecondary,
  },
  durationUser: {
    color: 'rgba(255, 255, 255, 0.9)',
  },
  recordingSection: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
    paddingVertical: spacing.sm,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.error,
  },
  recordingText: {
    fontSize: fontSize.sm,
    color: colors.error,
    fontWeight: '500',
    fontVariant: ['tabular-nums'],
  },
  recordingControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: isMobile ? spacing.lg : spacing.xl,
  },
  recordButton: {
    width: isMobile ? 68 : 72,
    height: isMobile ? 68 : 72,
    borderRadius: isMobile ? 34 : 36,
    backgroundColor: colors.cardBackgroundSecondary,
    borderWidth: 3,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  recordButtonActive: {
    backgroundColor: colors.error,
    borderColor: colors.error,
    shadowColor: colors.error,
    shadowOpacity: 0.3,
  },
  endButton: {
    flex: 1,
    paddingVertical: isMobile ? spacing.lg : spacing.lg + 2,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.full,
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: colors.primary,
    minHeight: isMobile ? 56 : 60,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  endButtonText: {
    fontSize: isMobile ? fontSize.md : fontSize.lg,
    color: colors.primaryLight,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
