/**
 * Voice Walkie-Talkie Service - React Native Version (Expo Compatible)
 * 
 * Handles real-time voice communication for PowerUp conversations.
 * Uses expo-av for recording and playback to ensure compatibility with Expo Go.
 */

import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { VOICE_CONFIG, getEndpointUrl } from '../config/voiceConfig';
import { supabase } from '../lib/supabaseClient';

class WalkieTalkieService {
  constructor() {
    this.backendUrl = VOICE_CONFIG.backendUrl;
    this.ws = null;
    this.sessionId = null;
    this.userId = null;
    this.powerupId = null;
    this.isRecording = false;
    this.isPlaying = false;
    this.recording = null;
    this.sound = null;
    this.messageCallbacks = [];
    this.errorCallbacks = [];
    this.audioQueue = [];
    this.isProcessingQueue = false;
    
    // Configure Audio session
    this._setupAudio();
  }

  async _setupAudio() {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
        staysActiveInBackground: false,
      });
    } catch (error) {
      console.error('[WalkieTalkie] Error setting up audio mode:', error);
    }
  }

  /**
   * Initialize session with PowerUp context
   */
  async initializeSession(userId, powerupId, aiSpeaksFirst = true) {
    try {
      console.log('[WalkieTalkie] Initializing session:', { userId, powerupId, aiSpeaksFirst });
      
      const headers = {
        'Content-Type': 'application/json',
      };
      
      if (VOICE_CONFIG.jwtToken) {
        headers['Authorization'] = `Bearer ${VOICE_CONFIG.jwtToken}`;
      }
      
      const response = await fetch(getEndpointUrl('startSession'), {
        method: 'POST',
        headers,
        body: JSON.stringify({
          user_id: userId,
          powerup_id: powerupId,
          ai_speaks_first: aiSpeaksFirst,
          voice_name: VOICE_CONFIG.voiceName,
          enable_barge_in: VOICE_CONFIG.enableBargeIn,
        }),
      });

      if (!response.ok) {
        throw new Error(`Session start failed: ${response.status}`);
      }

      const data = await response.json();
      
      this.sessionId = data.session_id;
      this.userId = userId;
      this.powerupId = powerupId;
      this.wsEndpoint = data.ws_endpoint.replace('/ws/', '/simple/ws/'); // Ensure simple mode path

      console.log('[WalkieTalkie] Session initialized:', this.sessionId);

      await this._connectWebSocket();

      return {
        sessionId: this.sessionId,
        firstMessage: data.first_message,
        powerupContext: data.powerup_context,
      };
    } catch (error) {
      console.error('[WalkieTalkie] Failed to initialize session:', error);
      this._notifyError(error);
      throw error;
    }
  }

  async _connectWebSocket() {
    return new Promise((resolve, reject) => {
      try {
        console.log('[WalkieTalkie] Connecting to backend WebSocket:', this.wsEndpoint);
        this.ws = new WebSocket(this.wsEndpoint);

        this.ws.onopen = () => {
          console.log('[WalkieTalkie] Connected to backend WebSocket');
          resolve();
        };

        this.ws.onmessage = (event) => this._handleWebSocketMessage(event);

        this.ws.onerror = (error) => {
          this._notifyError(error);
          reject(error);
        };

        this.ws.onclose = () => {
          this._notifyError(new Error('WebSocket connection lost'));
        };

        setTimeout(() => {
          if (this.ws && this.ws.readyState !== WebSocket.OPEN) {
            reject(new Error('WebSocket connection timeout'));
          }
        }, 10000);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Start recording audio using expo-av
   */
  async startRecording() {
    if (this.isRecording) return;

    try {
      console.log('[WalkieTalkie] Starting recording');
      
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Permission to access microphone was denied');
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await recording.startAsync();
      
      this.recording = recording;
      this.isRecording = true;
    } catch (error) {
      console.error('[WalkieTalkie] Failed to start recording:', error);
      this._notifyError(error);
      throw error;
    }
  }

  /**
   * Stop recording and send audio
   */
  async playFromUrl(url, messageId) {
    try {
      this._notifyMessage({ type: 'replay_start', messageId });
      
      const { sound } = await Audio.Sound.createAsync(
        { uri: url },
        { shouldPlay: true }
      );
      
      this.sound = sound;
      this.isPlaying = true;

      return new Promise((resolve) => {
        sound.setOnPlaybackStatusUpdate((status) => {
          if (status.didJustFinish) {
            this.isPlaying = false;
            this._notifyMessage({ type: 'replay_complete', messageId });
            sound.unloadAsync();
            resolve();
          }
        });
      });
    } catch (error) {
      console.error('[WalkieTalkie] Play from URL failed:', error);
      this._notifyMessage({ type: 'replay_complete', messageId });
    }
  }

  async stopRecording() {
    if (!this.isRecording || !this.recording) return;

    try {
      console.log('[WalkieTalkie] Stopping recording');
      this.isRecording = false;

      await this.recording.stopAndUnloadAsync();
      const uri = this.recording.getURI();
      const userMsgId = `user-${Date.now()}`;

      // 1. Upload to Supabase Bucket
      const audioUrl = await this._uploadToSupabase(uri, userMsgId);
      
      this._notifyMessage({
        type: 'user_audio_complete',
        messageId: userMsgId,
        audioUrl: audioUrl
      });

      // Read file as base64
      const base64Audio = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Send via WebSocket
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({
          type: 'audio',
          data: base64Audio,
          mime_type: 'audio/m4a' // expo-av default for HIGH_QUALITY on iOS
        }));
      }

      this.recording = null;
    } catch (error) {
      console.error('[WalkieTalkie] Failed to stop recording:', error);
      this._notifyError(error);
    }
  }

  async _uploadToSupabase(fileUri, messageId) {
    try {
      if (!this.userId || !this.powerupId) return null;
      
      const extension = fileUri.split('.').pop();
      const filePath = `audio/${this.userId}/${this.powerupId}/${messageId}.${extension}`;
      
      // Fetch the file as a blob
      const response = await fetch(fileUri);
      const blob = await response.blob();

      const { data, error } = await supabase.storage
        .from('powerups')
        .upload(filePath, blob, {
          contentType: `audio/${extension}`,
          upsert: true
        });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('powerups')
        .getPublicUrl(filePath);

      console.log('[WalkieTalkie] Audio uploaded:', publicUrl);
      return publicUrl;
    } catch (error) {
      console.error('[WalkieTalkie] Supabase upload failed:', error);
      return null;
    }
  }

  _handleWebSocketMessage(event) {
    try {
      const message = JSON.parse(event.data);
      console.log('[WalkieTalkie] Received message:', message.type);

      switch (message.type) {
        case 'setup_complete':
          this._notifyMessage({ type: 'ready' });
          break;
        case 'audio_start':
          this._notifyMessage({ type: 'audio_start', messageId: message.messageId });
          break;
        case 'audio_response':
          if (message.data) this._queueAudioResponse(message.data, message.messageId);
          break;
        case 'audio_end':
          this._notifyMessage({
            type: 'audio_complete',
            messageId: message.messageId,
            duration: Math.round(message.duration || 0)
          });
          break;
        case 'error':
          this._notifyError(new Error(message.error || 'Backend error'));
          break;
      }
    } catch (error) {
      console.error('[WalkieTalkie] Error handling message:', error);
    }
  }

  _queueAudioResponse(base64Audio, messageId) {
    this.audioQueue.push({ data: base64Audio, messageId });
    if (!this.isProcessingQueue) this._processAudioQueue();
  }

  async _processAudioQueue() {
    this.isProcessingQueue = true;
    while (this.audioQueue.length > 0) {
      const { data, messageId } = this.audioQueue.shift();
      await this._playAudioResponse(data, messageId);
    }
    this.isProcessingQueue = false;
  }

  async _playAudioResponse(base64Audio, messageId) {
    try {
      const filename = `${FileSystem.cacheDirectory}response_${Date.now()}.wav`;
      await FileSystem.writeAsStringAsync(filename, base64Audio, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Upload AI response to Supabase
      this._uploadToSupabase(filename, messageId || `ai-${Date.now()}`);

      const { sound } = await Audio.Sound.createAsync(
        { uri: filename },
        { shouldPlay: true }
      );
      
      this.sound = sound;
      this.isPlaying = true;

      return new Promise((resolve) => {
        sound.setOnPlaybackStatusUpdate((status) => {
          if (status.didJustFinish) {
            this.isPlaying = false;
            sound.unloadAsync();
            FileSystem.deleteAsync(filename).catch(() => {});
            resolve();
          }
        });
      });
    } catch (error) {
      console.error('[WalkieTalkie] Error playing audio:', error);
      this.isPlaying = false;
    }
  }

  async replayMessage(messageId) {
    // Note: Replay would require storing the audio buffers locally
    // For now, this is a placeholder to match the web interface
    console.log('[WalkieTalkie] Replay not yet implemented for mobile');
  }

  stopPlayback() {
    if (this.sound) {
      this.sound.stopAsync().then(() => this.sound.unloadAsync());
      this.isPlaying = false;
    }
  }

  async endSession() {
    if (this.recording) await this.recording.stopAndUnloadAsync();
    if (this.sound) await this.sound.unloadAsync();
    if (this.ws) this.ws.close();
  }

  onMessage(callback) {
    this.messageCallbacks.push(callback);
    return () => this.messageCallbacks = this.messageCallbacks.filter(cb => cb !== callback);
  }

  onError(callback) {
    this.errorCallbacks.push(callback);
    return () => this.errorCallbacks = this.errorCallbacks.filter(cb => cb !== callback);
  }

  _notifyMessage(m) { this.messageCallbacks.forEach(cb => cb(m)); }
  _notifyError(e) { this.errorCallbacks.forEach(cb => cb(e)); }
}

export default WalkieTalkieService;
