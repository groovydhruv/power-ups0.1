import React from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  StyleSheet,
  Dimensions,
  ImageBackground,
  SafeAreaView 
} from 'react-native';
import { useProgress } from '../context/ProgressContext';
import { LockIcon, LogoutIcon, CheckIcon } from './Icons';
import { colors, spacing, borderRadius, fontSize } from '../styles/theme';

const { width } = Dimensions.get('window');
const isMobile = width < 600;
const isTablet = width >= 600 && width < 1024;

// Max width for centered content
const maxContentWidth = 600;
const contentWidth = Math.min(width - (isMobile ? spacing.xxl * 2 : spacing.xxxl * 2), maxContentWidth);
const cardWidth = contentWidth;

export default function TopicSelection({ onSelectTopic, topics = [], resources = {}, username, onLogout }) {
  const { getTopicProgress, getResourceStatus, xp, level, streak } = useProgress();

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView 
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          {/* Title Row with Logout */}
          <View style={styles.titleRow}>
            <Text style={styles.title}>Power-Ups</Text>
            {username && (
              <TouchableOpacity
                onPress={onLogout}
                style={styles.logoutButton}
                activeOpacity={0.7}
                accessible
                accessibilityLabel="Log out"
                accessibilityRole="button"
              >
                <LogoutIcon color={colors.textPrimary} />
              </TouchableOpacity>
            )}
          </View>

          {/* Signed In Text */}
          {username && (
            <Text style={styles.signedInText}>
              Signed in as <Text style={styles.username}>{username}</Text>
            </Text>
          )}

          {/* Stats Cards - Prominent */}
          <View style={styles.statsContainer}>
            {/* Level Card */}
            <View style={styles.statCard}>
              <Text style={styles.statCardEmoji}>🏆</Text>
              <Text style={styles.statCardValue}>{level}</Text>
              <Text style={styles.statCardLabel}>Level</Text>
            </View>

            {/* Streak Card */}
            <View style={styles.statCard}>
              <Text style={styles.statCardEmoji}>🔥</Text>
              <Text style={styles.statCardValue}>{streak}</Text>
              <Text style={styles.statCardLabel}>Day Streak</Text>
            </View>

            {/* XP Card */}
            <View style={styles.statCard}>
              <Text style={styles.statCardEmoji}>⭐</Text>
              <Text style={styles.statCardValue}>{xp}</Text>
              <Text style={styles.statCardLabel}>XP</Text>
            </View>
          </View>
        </View>

        {/* Topics Grid */}
        <View style={styles.grid}>
          {topics.map((topic, index) => {
            const topicResources = resources[topic.id] || [];
            const progress = getTopicProgress(topic.id, topicResources);
            let isLocked = false;

            if (index === 0) {
              isLocked = false;
            } else {
              const prevTopic = topics[index - 1];
              const prevResources = resources[prevTopic.id] || [];
              const prevProgress = getTopicProgress(prevTopic.id, prevResources);
              isLocked = prevProgress < 100;
            }

            // Calculate status
            const completedCount = topicResources.filter((r) => {
              const status = getResourceStatus(r.id);
              return status.completed && status.conversationCompleted;
            }).length;
            const inProgressCount = topicResources.filter((r) => {
              const status = getResourceStatus(r.id);
              return (status.started || status.conversationInProgress) && !status.conversationCompleted;
            }).length;
            
            const isCompleted = progress === 100;
            const isInProgress = !isCompleted && (inProgressCount > 0 || completedCount > 0);

            return (
              <TouchableOpacity
                key={topic.id}
                style={[
                  styles.card,
                  isLocked && styles.cardLocked,
                  isInProgress && styles.cardInProgress,
                  isCompleted && styles.cardCompleted,
                  { width: cardWidth }
                ]}
                onPress={() => !isLocked && onSelectTopic(topic)}
                disabled={isLocked}
                activeOpacity={0.7}
              >
                <ImageBackground
                  source={{ uri: topic.image }}
                  style={styles.cardImage}
                  resizeMode="cover"
                >
                  {isLocked && (
                    <View style={styles.lockIcon}>
                      <LockIcon color="#999999" />
                    </View>
                  )}
                  {isCompleted && (
                    <View style={styles.completedCheckmark}>
                      <CheckIcon color={colors.success} boxSize={isMobile ? 48 : 56} />
                    </View>
                  )}
                </ImageBackground>

                <View style={styles.cardContent}>
                  <View style={styles.cardInfo}>
                    <Text style={styles.cardTitle}>{topic.title}</Text>
                    <Text style={styles.cardDescription}>{topic.description}</Text>
                  </View>

                  {!isLocked && (
                    <View style={styles.progressContainer}>
                      <Text style={styles.progressLabel}>
                        {completedCount}/{topicResources.length}
                      </Text>
                      <View style={styles.progressBar}>
                        <View style={[styles.progressFill, { width: `${progress}%` }]} />
                      </View>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
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
  scrollContent: {
    padding: isMobile ? spacing.lg : spacing.xxl,
    paddingTop: isMobile ? spacing.md : spacing.lg,
    paddingBottom: spacing.xxxl,
    alignItems: 'center',
  },
  header: {
    marginBottom: isMobile ? spacing.xxl : spacing.xxxl,
    width: '100%',
    maxWidth: maxContentWidth,
    alignSelf: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  title: {
    fontSize: isMobile ? fontSize.xxl : fontSize.xxxl,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.8,
    lineHeight: isMobile ? fontSize.xxl * 1.2 : fontSize.xxxl * 1.2,
  },
  signedInText: {
    fontSize: isMobile ? fontSize.xs : fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    lineHeight: isMobile ? fontSize.xs * 1.4 : fontSize.sm * 1.4,
  },
  username: {
    color: colors.textPrimary,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: isMobile ? spacing.md : spacing.lg,
    marginTop: spacing.xl,
    width: '100%',
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.cardBackground,
    borderRadius: isMobile ? borderRadius.lg : borderRadius.xl,
    borderWidth: 2,
    borderColor: colors.border,
    padding: isMobile ? spacing.lg : spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    minHeight: isMobile ? 110 : 130,
  },
  statCardEmoji: {
    fontSize: isMobile ? 32 : 40,
    marginBottom: spacing.xs,
  },
  statCardValue: {
    fontSize: isMobile ? fontSize.xxxl : 36,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: spacing.xxs,
    letterSpacing: -0.5,
  },
  statCardLabel: {
    fontSize: isMobile ? fontSize.xs : fontSize.sm,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  logoutButton: {
    padding: spacing.md,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.buttonBorder,
    backgroundColor: colors.buttonBackground,
    minWidth: 48,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  grid: {
    flexDirection: 'column',
    gap: isMobile ? spacing.lg : spacing.xl,
    width: '100%',
    maxWidth: maxContentWidth,
    alignSelf: 'center',
    alignItems: 'center',
  },
  card: {
    height: isMobile ? 380 : 440,
    borderRadius: isMobile ? borderRadius.lg : borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.cardBackground,
    overflow: 'hidden',
    marginBottom: isMobile ? spacing.lg : spacing.xl,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  cardLocked: {
    backgroundColor: colors.cardBackgroundLocked,
    opacity: 0.6,
    shadowOpacity: 0.03,
  },
  cardInProgress: {
    borderColor: '#3b82f6',
    borderWidth: 2,
    shadowColor: '#3b82f6',
    shadowOpacity: 0.15,
  },
  cardCompleted: {
    backgroundColor: '#f9fafb',
    borderColor: '#10b981',
    borderWidth: 2,
    shadowColor: '#10b981',
    shadowOpacity: 0.12,
  },
  cardImage: {
    height: '55%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  lockIcon: {
    position: 'absolute',
    top: spacing.lg,
    right: spacing.lg,
  },
  completedCheckmark: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: borderRadius.full,
    padding: isMobile ? spacing.md : spacing.lg,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  cardContent: {
    flex: 1,
    padding: isMobile ? spacing.lg : spacing.xxl,
    justifyContent: 'space-between',
  },
  cardInfo: {
    flex: 1,
  },
  cardTitle: {
    fontSize: isMobile ? fontSize.lg : fontSize.xl,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.5,
    marginBottom: spacing.sm,
    lineHeight: isMobile ? fontSize.lg * 1.3 : fontSize.xl * 1.3,
  },
  cardDescription: {
    fontSize: isMobile ? fontSize.sm : fontSize.md,
    color: colors.textSecondary,
    lineHeight: isMobile ? fontSize.sm * 1.6 : fontSize.md * 1.5,
  },
  progressContainer: {
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  progressLabel: {
    fontSize: isMobile ? fontSize.xs : fontSize.sm,
    color: colors.textSecondary,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
    letterSpacing: 0.2,
  },
  progressBar: {
    height: 6,
    backgroundColor: colors.progressBar,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.progressFill,
    borderRadius: borderRadius.full,
  },
});
