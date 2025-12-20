/**
 * Voice Walkie-Talkie Service - Web Version (Simple Mode)
 * 
 * Uses Gemini Simple Mode with Smart Binary Stitching
 */

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
    this.isReady = false;
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.messageCallbacks = [];
    this.errorCallbacks = [];
    this.currentMessageId = null;
    
    // Data Storage for Streaming
    this.messageAudioData = new Map(); // Base64 chunks
    this.messageStatus = new Map(); // 'receiving' | 'complete'
    this.messageMasterBuffer = new Map(); // Concatenated binary data
    this.messagePlayable = new Map(); // true if first decode succeeded
    
    // Playback State
    this.currentReplayingMessageId = null;
    this.audioContext = null;
    this.currentSource = null;
    this.lastPlayedOffset = 0;
    
    console.log('[WalkieTalkie] Web Service initialized (Smart Streaming Mode)');
  }

  async initializeSession(userId, powerupId, aiSpeaksFirst = true) {
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (VOICE_CONFIG.jwtToken) headers['Authorization'] = `Bearer ${VOICE_CONFIG.jwtToken}`;
      
      const response = await fetch(getEndpointUrl('startSession'), {
        method: 'POST',
        headers,
        body: JSON.stringify({
          user_id: userId,
          powerup_id: powerupId,
          ai_speaks_first: aiSpeaksFirst,
          voice_name: VOICE_CONFIG.voiceName,
        }),
      });

      if (!response.ok) throw new Error(`Session start failed: ${response.status}`);
      const data = await response.json();
      
      this.sessionId = data.session_id;
      this.userId = userId;
      this.powerupId = powerupId;
      this.wsEndpoint = data.ws_endpoint.replace('/ws/', '/simple/ws/');

      await this._connectWebSocket();

      return {
        sessionId: this.sessionId,
        firstMessage: data.first_message,
        powerupContext: data.powerup_context,
      };
    } catch (error) {
      this._notifyError(error);
      throw error;
    }
  }

  async _connectWebSocket() {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.wsEndpoint);
      this.ws.onopen = () => resolve();
      this.ws.onmessage = (event) => this._handleWebSocketMessage(event);
      this.ws.onerror = (error) => {
        this._notifyError(error);
        reject(error);
      };
      this.ws.onclose = () => this._notifyError(new Error('WebSocket closed'));
      setTimeout(() => { if (this.ws.readyState !== WebSocket.OPEN) reject(new Error('WS timeout')); }, 10000);
    });
  }

  async startRecording() {
    if (this.isRecording || !this.isReady) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      this.audioChunks = [];
      this.mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) this.audioChunks.push(e.data); };
      this.mediaRecorder.onstop = async () => {
        const blob = new Blob(this.audioChunks, { type: 'audio/webm' });
        const userMsgId = `user-${Date.now()}`;
        
        // 1. Upload to Supabase Bucket
        const audioUrl = await this._uploadToSupabase(blob, userMsgId);
        
        this._notifyMessage({
          type: 'user_audio_complete',
          messageId: userMsgId,
          audioUrl: audioUrl
        });

        // 2. Send to backend
        await this._sendCompleteAudio(blob);
        
        stream.getTracks().forEach(t => t.stop());
      };
      this.mediaRecorder.start();
      this.isRecording = true;
    } catch (e) { this._notifyError(e); }
  }

  async playFromUrl(url, messageId) {
    try {
      this._notifyMessage({ type: 'replay_start', messageId });
      
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      
      if (!this.audioContext) this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      
      const source = this.audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.audioContext.destination);
      this.currentSource = source;
      
      return new Promise((resolve) => {
        source.onended = () => {
          this._notifyMessage({ type: 'replay_complete', messageId });
          if (this.currentSource === source) this.currentSource = null;
          resolve();
        };
        source.start(0);
      });
    } catch (error) {
      console.error('[WalkieTalkieWeb] Play from URL failed:', error);
      this._notifyMessage({ type: 'replay_complete', messageId });
    }
  }

  async stopRecording() {
    this.isRecording = false;
    if (this.mediaRecorder?.state !== 'inactive') this.mediaRecorder.stop();
  }

  async _uploadToSupabase(blob, messageId) {
    try {
      if (!this.userId || !this.powerupId) return null;
      
      const filePath = `audio/${this.userId}/${this.powerupId}/${messageId}.webm`;
      
      const { data, error } = await supabase.storage
        .from('powerups')
        .upload(filePath, blob, {
          contentType: 'audio/webm',
          upsert: true
        });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('powerups')
        .getPublicUrl(filePath);

      console.log('[WalkieTalkieWeb] Audio uploaded:', publicUrl);
      return publicUrl;
    } catch (error) {
      console.error('[WalkieTalkieWeb] Supabase upload failed:', error);
      return null;
    }
  }

  async _sendCompleteAudio(blob) {
    const reader = new FileReader();
    const base64 = await new Promise((r) => {
      reader.onloadend = () => r(reader.result.split(',')[1]);
      reader.readAsDataURL(blob);
    });
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'audio', data: base64, mime_type: 'audio/webm' }));
    }
  }

  async _handleWebSocketMessage(event) {
    try {
      const msg = JSON.parse(event.data);
      switch (msg.type) {
        case 'setup_complete':
          this.isReady = true;
          this._notifyMessage({ type: 'ready' });
          break;

        case 'audio_start':
          this.isPlaying = true;
          this.currentMessageId = msg.messageId || `msg-${Date.now()}`;
          this.messageAudioData.set(this.currentMessageId, []);
          this.messageStatus.set(this.currentMessageId, 'receiving');
          this.messageMasterBuffer.set(this.currentMessageId, new Uint8Array(0));
          this.messagePlayable.set(this.currentMessageId, false);
          this._notifyMessage({ type: 'audio_start', messageId: this.currentMessageId });
          break;

        case 'audio_response':
          if (msg.data && this.currentMessageId) {
            const chunks = this.messageAudioData.get(this.currentMessageId);
            chunks.push(msg.data);

            const binary = atob(msg.data);
            const bytes = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

            const current = this.messageMasterBuffer.get(this.currentMessageId);
            const next = new Uint8Array(current.length + bytes.length);
            next.set(current);
            next.set(bytes, current.length);
            this.messageMasterBuffer.set(this.currentMessageId, next);
            
            // Try pre-decoding to check playability
            this._checkPlayability(this.currentMessageId, chunks.length);
          }
          break;

        case 'audio_end':
          this.isPlaying = false;
          const finishedId = this.currentMessageId;
          if (finishedId) {
            this.messageStatus.set(finishedId, 'complete');
            
            // Upload AI response to Supabase
            const buffer = this.messageMasterBuffer.get(finishedId);
            if (buffer) {
              const blob = new Blob([buffer], { type: 'audio/wav' });
              this._uploadToSupabase(blob, finishedId).then(url => {
                this._notifyMessage({
                  type: 'audio_complete',
                  messageId: finishedId,
                  audioUrl: url,
                  duration: Math.round(msg.duration || (this.messageAudioData.get(finishedId)?.length || 0) * 0.5)
                });
              });
            }
          }
          this.currentMessageId = null;
          break;
      }
    } catch (e) { console.error('[WalkieTalkieWeb] WS error:', e); }
  }

  async _checkPlayability(messageId, count) {
    try {
      if (!this.audioContext) this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const buffer = this.messageMasterBuffer.get(messageId);
      if (!buffer) return;
      
      // Attempt decode
      await this.audioContext.decodeAudioData(buffer.buffer.slice(0));
      
      if (!this.messagePlayable.get(messageId)) {
        this.messagePlayable.set(messageId, true);
        this._notifyMessage({ type: 'audio_chunk', messageId, chunkCount: count, playable: true });
      } else {
        this._notifyMessage({ type: 'audio_chunk', messageId, chunkCount: count });
      }
    } catch (e) {
      // Still missing headers/metadata, wait for more chunks
    }
  }

  async replayMessage(messageId) {
    if (this.isRecording) throw new Error('Busy recording');
    try {
      this.currentReplayingMessageId = messageId;
      this.lastPlayedOffset = 0;
      this._notifyMessage({ type: 'replay_start', messageId });

      while (this.currentReplayingMessageId === messageId) {
        const buffer = this.messageMasterBuffer.get(messageId);
        if (!buffer || buffer.length === 0) {
          if (this.messageStatus.get(messageId) === 'complete') break;
          await new Promise(r => setTimeout(r, 100));
          continue;
        }

        try {
          if (!this.audioContext) this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
          const audioBuffer = await this.audioContext.decodeAudioData(buffer.buffer.slice(0));
          
          if (this.lastPlayedOffset < audioBuffer.duration) {
            const startAt = this.lastPlayedOffset;
            this.lastPlayedOffset = audioBuffer.duration;
            await this._playFromOffset(audioBuffer, startAt);
          }
        } catch (e) { }

        if (this.messageStatus.get(messageId) === 'complete') break;
        await new Promise(r => setTimeout(r, 200)); 
      }
      this._notifyMessage({ type: 'replay_complete', messageId });
      this.currentReplayingMessageId = null;
    } catch (e) { this.currentReplayingMessageId = null; }
  }

  async _playFromOffset(buffer, start) {
    return new Promise((resolve) => {
      const source = this.audioContext.createBufferSource();
      source.buffer = buffer;
      source.connect(this.audioContext.destination);
      this.currentSource = source;
      source.onended = () => { if (this.currentSource === source) this.currentSource = null; resolve(); };
      source.start(0, start);
    });
  }

  stopPlayback() {
    this.currentReplayingMessageId = null; 
    if (this.currentSource) { try { this.currentSource.stop(); } catch (e) {} this.currentSource = null; }
    this._notifyMessage({ type: 'playback_stopped' });
  }

  async endSession() {
    if (this.isRecording) await this.stopRecording();
    if (this.audioContext) await this.audioContext.close();
    if (this.ws) this.ws.close();
  }

  onMessage(cb) { this.messageCallbacks.push(cb); return () => { this.messageCallbacks = this.messageCallbacks.filter(c => c !== cb); }; }
  onError(cb) { this.errorCallbacks.push(cb); return () => { this.errorCallbacks = this.errorCallbacks.filter(c => c !== cb); }; }
  _notifyMessage(m) { this.messageCallbacks.forEach(c => { try { c(m); } catch (e) {} }); }
  _notifyError(e) { this.errorCallbacks.forEach(c => { try { c(e); } catch (e) {} }); }
  get ready() { return this.isReady; }
}

export default WalkieTalkieService;
