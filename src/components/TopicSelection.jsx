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
import { LockIcon, LogoutIcon } from './Icons';
import { colors, spacing, borderRadius, fontSize } from '../styles/theme';

const { width } = Dimensions.get('window');
const isTablet = width > 600;
const cardWidth = isTablet ? (width - spacing.xxxl * 2 - spacing.xl) / 2 : width - spacing.xl * 2;

export default function TopicSelection({ onSelectTopic, topics = [], resources = {}, username, onLogout }) {
  const { getTopicProgress, points } = useProgress();

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView 
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.title}>Power-Ups</Text>
            <Text style={styles.subtitle}>
              Consume each resource thoroughly. Validate your insights and knowledge with a
              conversation. That's the only way to progress.
            </Text>
          </View>

          {username && (
            <View style={styles.userInfo}>
              <View style={styles.userInfoLeft}>
                <Text style={styles.userInfoText}>
                  Signed in as <Text style={styles.username}>{username}</Text>
                </Text>
                <View style={styles.pointsBadge}>
                  <Text style={styles.pointsEmoji}>⭐</Text>
                  <Text style={styles.pointsText}>{points}</Text>
                </View>
              </View>
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
            </View>
          )}
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

            return (
              <TouchableOpacity
                key={topic.id}
                style={[
                  styles.card,
                  isLocked && styles.cardLocked,
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
                </ImageBackground>

                <View style={styles.cardContent}>
                  <View style={styles.cardInfo}>
                    <Text style={styles.cardTitle}>{topic.title}</Text>
                    <Text style={styles.cardDescription}>{topic.description}</Text>
                  </View>

                  {!isLocked && (
                    <View style={styles.progressContainer}>
                      <View style={styles.progressBar}>
                        <View style={[styles.progressFill, { width: `${progress}%` }]} />
                      </View>
                      <Text style={styles.progressText}>{progress}%</Text>
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
    padding: spacing.xl,
    paddingTop: spacing.lg,
    flexGrow: 1,
  },
  header: {
    marginBottom: spacing.xl,
  },
  headerText: {
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: width > 600 ? fontSize.xxxl + 8 : fontSize.xxl + 4,
    fontWeight: '600',
    color: colors.textPrimary,
    letterSpacing: -0.5,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: fontSize.sm * 1.5,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  userInfoLeft: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: spacing.xs,
    flex: 1,
  },
  userInfoText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  username: {
    color: colors.textPrimary,
  },
  pointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.cardBackground,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  pointsEmoji: {
    fontSize: fontSize.md,
  },
  pointsText: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: colors.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  logoutButton: {
    padding: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.buttonBorder,
    backgroundColor: colors.buttonBackground,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  grid: {
    flexDirection: 'column',
    gap: spacing.lg,
  },
  card: {
    height: width > 600 ? 400 : 320,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.cardBackground,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  cardLocked: {
    backgroundColor: colors.cardBackgroundLocked,
    opacity: 0.7,
  },
  cardImage: {
    height: '40%',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
  },
  lockIcon: {
    margin: spacing.lg,
  },
  cardContent: {
    flex: 1,
    padding: width > 600 ? spacing.xl : spacing.lg,
    justifyContent: 'space-between',
  },
  cardInfo: {
    flex: 1,
  },
  cardTitle: {
    fontSize: width > 600 ? fontSize.xl : fontSize.lg,
    fontWeight: '600',
    color: colors.textPrimary,
    letterSpacing: -0.3,
    marginBottom: spacing.xs,
  },
  cardDescription: {
    fontSize: width > 600 ? fontSize.sm : fontSize.sm - 1,
    color: colors.textSecondary,
    lineHeight: fontSize.sm * 1.5,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  progressBar: {
    flex: 1,
    height: 2,
    backgroundColor: colors.progressBar,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.progressFill,
  },
  progressText: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    minWidth: 40,
    textAlign: 'right',
  },
});
