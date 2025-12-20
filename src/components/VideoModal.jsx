import React from 'react';
import { 
  View, 
  Text, 
  Modal, 
  TouchableOpacity, 
  StyleSheet, 
  Dimensions, 
  Platform 
} from 'react-native';
import { colors, spacing, borderRadius, fontSize } from '../styles/theme';

const { width, height } = Dimensions.get('window');
const isMobile = width < 600;

export default function VideoModal({ visible, videoUrl, title, onClose }) {
  if (!visible) return null;

  // Extract video ID from common URL formats (YouTube, Vimeo, etc.)
  const getEmbedUrl = (url) => {
    if (!url) return '';
    
    // YouTube
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
      const match = url.match(regExp);
      const videoId = (match && match[2].length === 11) ? match[2] : null;
      return videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=1` : url;
    }
    
    // Vimeo
    if (url.includes('vimeo.com')) {
      const videoId = url.split('/').pop();
      return `https://player.vimeo.com/video/${videoId}?autoplay=1`;
    }

    return url;
  };

  const embedUrl = getEmbedUrl(videoUrl);

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title} numberOfLines={1}>{title}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Video Player */}
          <View style={styles.videoContainer}>
            {Platform.OS === 'web' ? (
              <iframe
                src={embedUrl}
                style={styles.iframe}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <View style={styles.placeholderContainer}>
                <Text style={styles.placeholderText}>
                  Video playback is currently supported in the web preview.
                </Text>
              </View>
            )}
          </View>

          {/* Footer Info */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Watching this video will help you earn more XP!
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: isMobile ? 0 : spacing.xl,
  },
  modalContent: {
    width: isMobile ? '100%' : Math.min(width * 0.9, 1000),
    height: isMobile ? '100%' : 'auto',
    maxHeight: isMobile ? '100%' : height * 0.85,
    backgroundColor: colors.cardBackground,
    borderRadius: isMobile ? 0 : borderRadius.xl,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.textPrimary,
    flex: 1,
    marginRight: spacing.md,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.buttonBackground,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  videoContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#000',
  },
  iframe: {
    width: '100%',
    height: '100%',
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  placeholderText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: fontSize.md,
  },
  footer: {
    padding: spacing.lg,
    backgroundColor: colors.cardBackgroundSecondary,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  footerText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});

