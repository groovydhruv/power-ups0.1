import React, { useEffect, useState, useRef } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Animated,
  Dimensions,
  Image,
  Alert,
  Platform 
} from 'react-native';
import { useProgress } from '../context/ProgressContext';
import { MicIcon } from './Icons';
import { colors, spacing, borderRadius, fontSize } from '../styles/theme';
import WalkieTalkieService from '../services/WalkieTalkieService';

const { width } = Dimensions.get('window');
const isMobile = width < 600;

export default function VoiceConversation({ resource, topics = [], resources = {}, onExit }) {
  const { 
    userId,
    markConversationStarted, 
    markConversationComplete,
    saveConversationHistory,
    getResourceStatus
  } = useProgress();
  const [messages, setMessages] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isReady, setIsReady] = useState(false); // Ready to record
  const [isReceiving, setIsReceiving] = useState(false); // Backend is streaming audio to client
  const [isThinking, setIsThinking] = useState(false); // User sent, waiting for backend
  const [error, setError] = useState(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [pulseAnim] = useState(new Animated.Value(1));
  const [scaleAnim] = useState(new Animated.Value(1));
  const [waveformAnim] = useState(new Animated.Value(0));
  const scrollRef = useRef(null);
  const serviceRef = useRef(null);
  const messageIdCounter = useRef(0);
  const activeMessageRef = useRef(null); // Track active message being played
  const autoPlayStartedRef = useRef(new Set()); // Track which messages have already auto-played

  // Waveform animation loop
  useEffect(() => {
    if (isPlaying) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(waveformAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(waveformAnim, {
            toValue: 0,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      waveformAnim.stopAnimation();
      waveformAnim.setValue(0);
    }
  }, [isPlaying, waveformAnim]);

  // Auto-save conversation history only when messages are finalized
  useEffect(() => {
    // Only save if the last message is NOT a receiving/streaming message
    const lastMessage = messages[messages.length - 1];
    const isFinalized = lastMessage && !lastMessage.isReceiving && !lastMessage.isStreaming;
    
    if (messages.length > 0 && userId && resource.id && isFinalized) {
      console.log('[VoiceConversation] 💾 Finalizing and saving history...');
      const history = messages.map(m => ({
        id: m.id,
        sender: m.sender,
        text: m.text || '',
        timestamp: m.timestamp,
        duration: m.duration || 0,
        audioUrl: m.audioUrl || null, // SAVE THE CLOUD URL
        hasAudio: true 
      }));
      saveConversationHistory(resource.id, history);
    }
  }, [messages.length, userId, resource.id]); // Only trigger on length change (new message) or id change

  // Recording timer
  const [username, setUsername] = useState('');
  useEffect(() => {
    try {
      const storedUsername = localStorage.getItem('navi_username') || 'Student';
      setUsername(storedUsername);
    } catch (error) {
      console.warn('Could not get username:', error);
      setUsername('Student');
    }
  }, []);

  // Initialize voice service when userId is ready
  useEffect(() => {
    if (!userId) return;

    const startConversation = async () => {
      // 1. Load existing history if available
      const status = getResourceStatus(resource.id);
      let speaksFirst = true;

      if (status.conversationHistory && status.conversationHistory.length > 0) {
        console.log(`[VoiceConversation] Loading existing history for ${resource.id}`);
        speaksFirst = false; // DON'T speak first if we have history
        
        // Filter out the "weird static" prompt message if it exists in history
        const filteredHistory = status.conversationHistory.filter(m => 
          m.id !== 'initial-greeting' && 
          !(m.text && m.text.includes("You're starting a voice conversation"))
        );
        
        setMessages(filteredHistory.map(m => ({
          ...m,
          isPlaying: false,
          isReplaying: false,
          isReceiving: false,
          waveformHeights: Array.from({ length: 20 }, () => Math.floor(Math.random() * 60) + 30)
        })));
      }

      // 2. Initialize service with conditional greeting
      await initializeVoiceService(speaksFirst);
      markConversationStarted(resource.id);
    };

    startConversation();

    return () => {
      // Cleanup on unmount
      if (serviceRef.current) {
        serviceRef.current.endSession().catch(err => 
          console.error('Error ending session:', err)
        );
      }
    };
  }, [resource.id, userId]);

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

  /**
   * Initialize voice service and connect to backend
   */
  const initializeVoiceService = async (aiSpeaksFirst = true) => {
    try {
      setIsInitializing(true);
      setError(null);

      // Check if powerupId is available
      if (!resource.powerupId) {
        throw new Error('Resource does not have a powerupId. Cannot start conversation.');
      }

      // Create service instance
      serviceRef.current = new WalkieTalkieService();

      // Register message callback
      serviceRef.current.onMessage((message) => {
        handleVoiceMessage(message);
      });

      // Register error callback
      serviceRef.current.onError((err) => {
        console.error('Voice service error:', err);
        setError(err.message);
        Alert.alert('Voice Error', err.message);
      });

      // Initialize session
      const sessionData = await serviceRef.current.initializeSession(
        userId || 'demo_user_id', // Use real userId from context
        resource.powerupId,
        aiSpeaksFirst // AI speaks first only if it's the first time
      );

      console.log('Session initialized:', sessionData);

      setIsInitializing(false);
    } catch (error) {
      console.error('Failed to initialize voice service:', error);
      setError(error.message);
      setIsInitializing(false);
      
      Alert.alert(
        'Connection Error',
        `Could not connect to voice service: ${error.message}\n\nMake sure your backend is running at localhost:8000`,
        [
          { text: 'Go Back', onPress: onExit },
          { text: 'Retry', onPress: initializeVoiceService }
        ]
      );
    }
  };

  /**
   * Handle voice messages from service
   */
  const handleVoiceMessage = (message) => {
    console.log('Received voice message:', message);

    if (message.type === 'ready') {
      // Backend is ready for recording
      setIsReady(true);
      setIsInitializing(false);
    } else if (message.type === 'audio_start') {
      // AI started sending - show thinking indicator, don't create bubble yet
      setIsThinking(true);
      setIsReceiving(true);
      setIsPlaying(false);
      activeMessageRef.current = message.messageId || `msg-${Date.now()}`;
    } else if (message.type === 'audio_chunk') {
      // Create/Update the bubble ONLY when we actually have data
      setIsThinking(false);
      
      // Safety check: Ignore messages that look like system prompts
      if (message.text && message.text.includes("You're starting a voice conversation")) {
        return;
      }
      
      setMessages(prev => {
        const msgId = message.messageId || activeMessageRef.current;
        const existingMsg = prev.find(m => m.id === msgId);
        
        if (!existingMsg) {
          // First chunk: Create the bubble
          const newMsg = {
            id: msgId,
            sender: 'navi',
            timestamp: new Date().toISOString(),
            isPlaying: false,
            isReplaying: false,
            isReceiving: false,
            isStreaming: true,
            isPlayable: !!message.playable, // NEW: only play if engine says okay
            duration: 0,
            chunkCount: 1,
            waveformHeights: Array.from({ length: 20 }, (_, i) => i === 0 ? Math.floor(Math.random() * 60) + 30 : 10),
          };
          
          return [...prev, newMsg];
        } else {
          // Update waveform
          const newHeights = [...existingMsg.waveformHeights];
          const indexToUpdate = existingMsg.chunkCount % 20;
          newHeights[indexToUpdate] = Math.floor(Math.random() * 60) + 30;
          
          return prev.map(m => m.id === msgId ? {
            ...m,
            chunkCount: m.chunkCount + 1,
            waveformHeights: newHeights,
            isStreaming: true,
            isPlayable: m.isPlayable || !!message.playable
          } : m);
        }
      });
      
      // Auto-play the first chunk if this is the first AI message
      const msgId = message.messageId || activeMessageRef.current;
      if (message.playable && !autoPlayStartedRef.current.has(msgId)) {
        setMessages(prev => {
          const isFirstAiMessage = !prev.some(m => m.sender === 'navi' && m.id !== msgId && m.duration > 0);
          if (isFirstAiMessage && !isPlaying) {
            autoPlayStartedRef.current.add(msgId);
            setTimeout(() => handleReplayAudio(msgId), 100);
          }
          return prev;
        });
      }
    } else if (message.type === 'audio_complete') {
      // AI finished sending data - ONLY update duration, don't stop playback animation
      setIsReceiving(false);
      
      const msgId = message.messageId || activeMessageRef.current;
      
      setMessages(prev => {
        const updated = [...prev];
        const msgIndex = updated.findIndex(m => m.id === msgId);
        
        if (msgIndex !== -1) {
          updated[msgIndex].duration = message.duration || 0;
          updated[msgIndex].isReceiving = false;
          updated[msgIndex].isStreaming = false;
          updated[msgIndex].audioUrl = message.audioUrl; // STORE THE URL
          // Note: We EXPLICITLY do not set isPlaying=false here 
          // because the user might be listening to the stream
        }
        return updated;
      });
      activeMessageRef.current = null;
    } else if (message.type === 'playback_stopped') {
      setIsPlaying(false);
      setMessages(prev => prev.map(m => ({ ...m, isPlaying: false, isReplaying: false })));
    } else if (message.type === 'replay_start') {
      // Message replay started
      setIsPlaying(true);
      setMessages(prev => {
        const updated = [...prev];
        const msgIndex = updated.findIndex(m => m.id === message.messageId);
        if (msgIndex !== -1) {
          updated[msgIndex].isPlaying = true;
          updated[msgIndex].isReplaying = true;
        }
        return updated;
      });
    } else if (message.type === 'replay_complete') {
      // Message replay finished
      setIsPlaying(false);
      setMessages(prev => {
        const updated = [...prev];
        const msgIndex = updated.findIndex(m => m.id === message.messageId);
        if (msgIndex !== -1) {
          updated[msgIndex].isPlaying = false;
          updated[msgIndex].isReplaying = false;
        }
        return updated;
      });
    } else if (message.type === 'user_audio_complete') {
      // User recording uploaded to Supabase
      setMessages(prev => prev.map(m => 
        m.sender === 'user' && !m.audioUrl ? { ...m, audioUrl: message.audioUrl } : m
      ));
    } else if (message.type === 'turn_complete') {
      console.log('AI turn complete');
    }
  };

  /**
   * Handle record button press
   */
  const handleRecordStart = async () => {
    if (!serviceRef.current || !isReady || isPlaying) {
      if (!isReady) {
        Alert.alert('Please Wait', 'Voice service is still initializing...');
      }
      return;
    }

    try {
      setIsRecording(true);
      Animated.spring(scaleAnim, {
        toValue: 1.1,
        useNativeDriver: true,
      }).start();

      await serviceRef.current.startRecording();
    } catch (error) {
      console.error('Failed to start recording:', error);
      setIsRecording(false);
      Alert.alert('Recording Error', error.message);
    }
  };

  /**
   * Handle record button release
   */
  const handleRecordStop = async () => {
    if (!serviceRef.current || !isRecording) {
      return;
    }

    try {
      setIsRecording(false);
      setIsThinking(true); // Show thinking indicator immediately
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
      }).start();

      await serviceRef.current.stopRecording();

      // Add user message to UI
      if (recordingDuration > 0) {
        const waveformHeights = Array.from({ length: 20 }, () => Math.floor(Math.random() * 60) + 30);
        const userMsg = {
          id: `msg-${messageIdCounter.current++}`,
          sender: 'user',
          duration: recordingDuration,
          timestamp: new Date().toISOString(),
          isPlaying: false,
          waveformHeights: waveformHeights,
        };
        setMessages(prev => [...prev, userMsg]);
      }
    } catch (error) {
      console.error('Failed to stop recording:', error);
      Alert.alert('Recording Error', error.message);
    }
  };

  /**
   * Handle audio replay / stop
   */
  const handleReplayAudio = async (messageId) => {
    if (!serviceRef.current) return;

    // 1. Find message data
    const msg = messages.find(m => m.id === messageId);
    if (!msg) return;

    // 2. If already playing this message, stop it
    if (msg.isPlaying) {
      serviceRef.current.stopPlayback();
      return;
    }

    // 3. If playing something else, stop it first
    if (isPlaying) {
      serviceRef.current.stopPlayback();
    }

    try {
      // 4. Prefer playing from cloud URL if available
      if (msg.audioUrl) {
        console.log('[VoiceConversation] Replaying from Cloud URL:', msg.audioUrl);
        await serviceRef.current.playFromUrl(msg.audioUrl, messageId);
      } else {
        // Fallback to local memory (web streaming)
        await serviceRef.current.replayMessage(messageId);
      }
    } catch (error) {
      console.error('Failed to replay audio:', error);
      Alert.alert('Playback Error', error.message);
    }
  };

  const formatDuration = (seconds) => {
    const totalSeconds = Math.round(seconds);
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => {
              const leave = () => onExit();
              if (Platform.OS === 'web') {
                if (window.confirm('Are you sure you want to leave? Your progress will be saved.')) leave();
              } else {
                Alert.alert(
                  'Leave Conversation',
                  'Are you sure you want to leave? Your progress will be saved.',
                  [
                    { text: 'Stay', style: 'cancel' },
                    { text: 'Leave', onPress: leave }
                  ]
                );
              }
            }}
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
              {isInitializing && (
                <Text style={styles.statusText}>Connecting...</Text>
              )}
              {!isInitializing && !isReady && (
                <Text style={styles.statusText}>Initializing...</Text>
              )}
              {isReady && !isPlaying && !isInitializing && !isThinking && !isReceiving && (
                <Text style={styles.statusText}>Ready</Text>
              )}
              {(isThinking || isReceiving) && !isPlaying && (
                <Text style={styles.statusText}>Navi is thinking...</Text>
              )}
              {isPlaying && (
                <Text style={styles.statusText}>Playing...</Text>
              )}
            </View>
          </View>

          {/* Error Display */}
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>⚠️ {error}</Text>
              <TouchableOpacity
                onPress={initializeVoiceService}
                style={styles.retryButton}
              >
                <Text style={styles.retryButtonText}>Retry Connection</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Messages Thread */}
          <ScrollView 
            ref={scrollRef}
            style={styles.messagesContainer}
            contentContainerStyle={styles.messagesContent}
            showsVerticalScrollIndicator={false}
          >
            {messages.map((message) => {
              const isNavi = message.sender === 'navi';
              
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
                    isNavi ? styles.messageBubbleNavi : styles.messageBubbleUser,
                    message.isPlaying && styles.messageBubbleActive
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
                    
                    {/* Audio indicator */}
                    <TouchableOpacity 
                      style={styles.audioPlayer}
                      onPress={() => isNavi && message.id && handleReplayAudio(message.id)}
                      disabled={!isNavi || isRecording || (message.isStreaming && !message.isPlayable)}
                      activeOpacity={isNavi ? 0.7 : 1}
                    >
                      <View style={[
                        styles.playButton,
                        isNavi ? styles.playButtonNavi : styles.playButtonUser,
                        (message.isStreaming && !message.isPlayable) && styles.playButtonLoading
                      ]}>
                        {(message.isStreaming && !message.isPlayable) ? (
                          <View style={styles.loadingDots}>
                            <View style={styles.dot} />
                            <View style={[styles.dot, { opacity: 0.6 }]} />
                            <View style={[styles.dot, { opacity: 0.3 }]} />
                          </View>
                        ) : message.isPlaying ? (
                          <View style={styles.stopIcon}>
                            <View style={[styles.stopSquare, isNavi ? styles.stopSquareNavi : styles.stopSquareUser]} />
                          </View>
                        ) : (
                          <View style={[styles.playIcon, isNavi ? styles.playIconNavi : styles.playIconUser]} />
                        )}
                      </View>
                      
                      {/* Waveform visualization */}
                      <View style={styles.waveform}>
                        {(message.waveformHeights || Array(20).fill(10)).map((height, i) => {
                          return (
                            <Animated.View
                              key={i}
                              style={[
                                styles.waveformBar,
                                isNavi ? styles.waveformBarNavi : styles.waveformBarUser,
                                (message.isPlaying || message.isStreaming || message.isReceiving) && styles.waveformBarActive,
                                { 
                                  height: `${height}%`,
                                  transform: [{
                                    scaleY: message.isPlaying ? waveformAnim.interpolate({
                                      inputRange: [0, 1],
                                      outputRange: [1, 1.2 + (i % 3) * 0.2]
                                    }) : 1
                                  }]
                                }
                              ]}
                            />
                          );
                        })}
                      </View>
                      
                      <Text style={[
                        styles.duration,
                        isNavi ? styles.durationNavi : styles.durationUser
                      ]}>
                        {message.duration > 0 ? formatDuration(message.duration) : 'Voice Message'}
                      </Text>
                    </TouchableOpacity>

                    {/* Text preview if available */}
                    {message.text && (
                      <Text style={styles.messageText} numberOfLines={3}>
                        {message.text}
                      </Text>
                    )}
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
                  disabled={!isReady || isPlaying}
                  style={[
                    styles.recordButton,
                    isRecording && styles.recordButtonActive,
                    (!isReady || isPlaying) && styles.recordButtonDisabled,
                    { alignSelf: 'center' }
                  ]}
                  activeOpacity={0.9}
                >
                  <MicIcon 
                    color={isRecording ? colors.primaryLight : colors.textPrimary} 
                    boxSize={28} 
                  />
                </TouchableOpacity>
              </Animated.View>
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
  statusText: {
    fontSize: fontSize.sm,
    color: colors.primary,
    marginTop: spacing.xs,
    fontWeight: '600',
  },
  errorContainer: {
    padding: spacing.md,
    backgroundColor: colors.errorBackground,
    borderRadius: borderRadius.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.error,
  },
  errorText: {
    fontSize: fontSize.sm,
    color: colors.error,
    marginBottom: spacing.sm,
  },
  retryButton: {
    padding: spacing.sm,
    backgroundColor: colors.error,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
  },
  retryButtonText: {
    color: colors.primaryLight,
    fontSize: fontSize.sm,
    fontWeight: '600',
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
  messageBubbleActive: {
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  receivingBubble: {
    display: 'none',
  },
  thinkingBubble: {
    width: 60,
    paddingVertical: spacing.sm,
    backgroundColor: colors.cardBackgroundSecondary,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    marginLeft: spacing.sm,
    marginBottom: spacing.md,
  },
  thinkingContent: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 4,
  },
  receivingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  miniWaveform: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    height: 16,
  },
  miniWaveformBar: {
    width: 2,
    backgroundColor: colors.primary,
    borderRadius: 1,
  },
  receivingText: {
    fontSize: fontSize.xs,
    color: colors.primary,
    fontWeight: '600',
    fontStyle: 'italic',
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
  messageText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: fontSize.sm * 1.4,
    marginTop: spacing.xs,
    fontStyle: 'italic',
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
  playButtonLoading: {
    backgroundColor: colors.border,
    opacity: 0.8,
  },
  loadingDots: {
    flexDirection: 'row',
    gap: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.primaryLight,
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
  stopIcon: {
    width: 14,
    height: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stopSquare: {
    width: 12,
    height: 12,
    borderRadius: 2,
  },
  stopSquareNavi: {
    backgroundColor: colors.primaryLight,
  },
  stopSquareUser: {
    backgroundColor: colors.primaryDark,
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
    justifyContent: 'center',
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
  recordButtonDisabled: {
    opacity: 0.5,
  },
});
