import React, { useState } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  StyleSheet,
  Image,
  SafeAreaView,
  Linking,
  Dimensions 
} from 'react-native';
import { useProgress } from '../context/ProgressContext';
import { ChevronDownIcon, ChevronUpIcon, CheckIcon, LockIcon } from './Icons';
import { colors, spacing, borderRadius, fontSize } from '../styles/theme';

const { width } = Dimensions.get('window');
const isMobile = width < 600;

export default function ResourceList({ topic, resources = {}, onBack, onStartConversation }) {
  const { getResourceStatus, isResourceUnlocked, markResourceStarted, markResourceComplete } = useProgress();
  const [expanded, setExpanded] = useState({});
  const topicResources = resources[topic.id] || [];
  const sortedResources = [...topicResources].sort((a, b) => a.order - b.order);

  // Find the first incomplete resource (the "next" one to consume)
  const nextResourceId = sortedResources.find((resource) => {
    const status = getResourceStatus(resource.id);
    const unlocked = isResourceUnlocked(topic.id, resource.order, sortedResources);
    return unlocked && !(status.completed && status.conversationCompleted);
  })?.id;

  const toggleExpand = (resourceId) => {
    setExpanded((prev) => ({ ...prev, [resourceId]: !prev[resourceId] }));
  };

  const handleAction = (resource) => {
    const status = getResourceStatus(resource.id);
    if (!status.started) {
      setExpanded((prev) => ({ ...prev, [resource.id]: true }));
      markResourceStarted(resource.id);
    } else if (status.started && !status.completed) {
      markResourceComplete(resource.id);
    } else if (status.conversationInProgress || (status.completed && !status.conversationCompleted)) {
      onStartConversation(resource);
    }
  };

  const getButtonText = (resource) => {
    const status = getResourceStatus(resource.id);
    if (!status.started) return 'Start';
    if (status.started && !status.completed) return 'Mark as Complete';
    if (status.conversationInProgress) return 'Continue Conversation';
    if (status.completed && !status.conversationCompleted) return 'Start Conversation';
    return 'Completed';
  };

  const openResourceLink = (link) => {
    if (link) {
      Linking.openURL(link).catch((err) => 
        console.warn('Failed to open URL:', err)
      );
    }
  };

  const renderResource = ({ item: resource, index }) => {
            const status = getResourceStatus(resource.id);
            const unlocked = isResourceUnlocked(topic.id, resource.order, sortedResources);
            const isExpanded = expanded[resource.id];
    const isCompleted = status.completed && status.conversationCompleted;
    const isInProgress = status.conversationInProgress;
    const isNextResource = resource.id === nextResourceId;

            return (
      <View style={[
        styles.resourceCard, 
        !unlocked && styles.resourceCardLocked,
        isInProgress && styles.resourceCardInProgress,
        isNextResource && styles.resourceCardNext
      ]}>
        <TouchableOpacity
          style={styles.resourceHeader}
          onPress={() => unlocked && toggleExpand(resource.id)}
          disabled={!unlocked}
          activeOpacity={0.7}
        >
          <View style={styles.resourceInfo}>
            <View style={styles.resourceTitleRow}>
              <Text style={styles.resourceIndex}>{index + 1}</Text>
              <Text style={styles.resourceTitle} numberOfLines={isMobile ? 2 : 1}>
                          {resource.title}
              </Text>
              {!unlocked && <LockIcon color={colors.textTertiary} />}
            </View>
            <Text style={styles.resourceMeta}>
                        {resource.type} · {resource.duration}
              {isInProgress && <Text style={styles.inProgressBadge}> · In Progress</Text>}
            </Text>
          </View>

                  {unlocked && !isCompleted && (
            <View style={styles.resourceActions}>
              <TouchableOpacity
                onPress={(e) => {
                          e.stopPropagation();
                          handleAction(resource);
                        }}
                style={[
                  styles.actionButton,
                  isInProgress && styles.actionButtonInProgress
                ]}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.actionButtonText,
                  isInProgress && styles.actionButtonTextInProgress
                ]} numberOfLines={1}>
                        {getButtonText(resource)}
                </Text>
              </TouchableOpacity>
              {!isMobile && (isExpanded ? (
                <ChevronUpIcon boxSize={20} color={colors.textTertiary} />
              ) : (
                <ChevronDownIcon boxSize={20} color={colors.textTertiary} />
              ))}
            </View>
          )}

          {unlocked && isCompleted && (
            <View style={styles.completedIconContainer}>
              <CheckIcon color={colors.success} boxSize={isMobile ? 32 : 40} />
            </View>
          )}
        </TouchableOpacity>

                {isExpanded && unlocked && (
          <View style={styles.resourceDetails}>
            <Text style={styles.resourceDescription}>{resource.description}</Text>
                    {resource.thumbnail && (
              <TouchableOpacity
                style={styles.thumbnailContainer}
                onPress={() => openResourceLink(resource.link)}
                activeOpacity={0.8}
              >
                <Image
                  source={{ uri: resource.thumbnail }}
                  style={styles.thumbnail}
                  resizeMode="cover"
                />
                <View style={styles.thumbnailOverlay}>
                  <Text style={styles.thumbnailText}>Open Resource</Text>
                </View>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={onBack}
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>

          <View style={styles.titleContainer}>
            <Text style={styles.title}>{topic.title}</Text>
            <Text style={styles.subtitle}>{topic.description}</Text>
          </View>
        </View>

        {/* Resources List */}
        <FlatList
          data={sortedResources}
          renderItem={renderResource}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={true}
        />
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
    padding: isMobile ? spacing.lg : spacing.xxl,
    paddingBottom: isMobile ? spacing.md : spacing.lg,
    backgroundColor: colors.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    marginBottom: isMobile ? spacing.lg : spacing.xl,
    minHeight: 48,
    justifyContent: 'center',
    backgroundColor: colors.buttonBackground,
  },
  backButtonText: {
    fontSize: isMobile ? fontSize.md : fontSize.lg,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  titleContainer: {
    marginBottom: spacing.xs,
  },
  title: {
    fontSize: isMobile ? fontSize.xl : fontSize.xxl,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.6,
    marginBottom: spacing.sm,
    lineHeight: isMobile ? fontSize.xl * 1.3 : fontSize.xxl * 1.2,
  },
  subtitle: {
    fontSize: isMobile ? fontSize.sm : fontSize.md,
    color: colors.textSecondary,
    lineHeight: isMobile ? fontSize.sm * 1.6 : fontSize.md * 1.6,
  },
  listContent: {
    padding: isMobile ? spacing.lg : spacing.xxl,
    paddingTop: isMobile ? spacing.lg : spacing.xl,
    paddingBottom: spacing.xxxl,
  },
  resourceCard: {
    borderRadius: isMobile ? borderRadius.lg : borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.cardBackground,
    overflow: 'hidden',
    marginBottom: isMobile ? spacing.lg : spacing.xl,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  resourceCardLocked: {
    backgroundColor: colors.cardBackgroundLocked,
    opacity: 0.7,
  },
  resourceCardInProgress: {
    borderColor: colors.primary,
    borderWidth: 2,
    backgroundColor: colors.cardBackground,
  },
  resourceCardNext: {
    borderColor: colors.textPrimary,
    borderWidth: 3,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  resourceHeader: {
    padding: isMobile ? spacing.lg : spacing.xl,
    flexDirection: isMobile ? 'column' : 'row',
    justifyContent: 'space-between',
    alignItems: isMobile ? 'stretch' : 'center',
    gap: isMobile ? spacing.lg : 0,
    minHeight: 80,
  },
  resourceInfo: {
    flex: 1,
  },
  resourceTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  resourceIndex: {
    fontSize: isMobile ? fontSize.md : fontSize.lg,
    color: colors.textSecondary,
    fontWeight: '700',
    marginTop: 2,
    minWidth: 24,
  },
  resourceTitle: {
    fontSize: isMobile ? fontSize.md : fontSize.lg,
    fontWeight: '600',
    color: colors.textPrimary,
    letterSpacing: -0.3,
    flex: 1,
    lineHeight: isMobile ? fontSize.md * 1.4 : fontSize.lg * 1.4,
  },
  resourceMeta: {
    fontSize: isMobile ? fontSize.sm : fontSize.md,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    marginLeft: isMobile ? 36 : 40,
    lineHeight: isMobile ? fontSize.sm * 1.4 : fontSize.md * 1.4,
  },
  inProgressBadge: {
    color: colors.primary,
    fontWeight: '700',
  },
  resourceActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: isMobile ? 'flex-start' : 'flex-end',
    gap: spacing.md,
  },
  completedIconContainer: {
    padding: spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButton: {
    paddingHorizontal: isMobile ? spacing.lg : spacing.xl,
    paddingVertical: isMobile ? spacing.md : spacing.md + 2,
    borderRadius: borderRadius.full,
    borderWidth: 2,
    borderColor: colors.buttonBorder,
    backgroundColor: 'transparent',
    minHeight: 48,
    justifyContent: 'center',
    flex: isMobile ? 1 : 0,
    minWidth: isMobile ? undefined : 140,
  },
  actionButtonDisabled: {
    backgroundColor: colors.buttonBackground,
    borderWidth: 1,
    opacity: 0.6,
  },
  actionButtonInProgress: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  actionButtonText: {
    fontSize: isMobile ? fontSize.sm : fontSize.md,
    color: colors.textPrimary,
    textAlign: 'center',
    fontWeight: '600',
  },
  actionButtonTextDisabled: {
    color: colors.textTertiary,
    fontWeight: '500',
  },
  actionButtonTextInProgress: {
    color: colors.primaryLight,
    fontWeight: '700',
  },
  resourceDetails: {
    paddingHorizontal: isMobile ? spacing.lg : spacing.xl,
    paddingBottom: isMobile ? spacing.xl : spacing.xxl,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  resourceDescription: {
    fontSize: isMobile ? fontSize.sm : fontSize.md,
    color: colors.textSecondary,
    lineHeight: isMobile ? fontSize.sm * 1.6 : fontSize.md * 1.6,
    marginBottom: isMobile ? spacing.lg : spacing.xl,
  },
  thumbnailContainer: {
    height: isMobile ? 200 : 240,
    borderRadius: isMobile ? borderRadius.md : borderRadius.lg,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: colors.border,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  thumbnailOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbnailText: {
    color: colors.primaryLight,
    fontSize: isMobile ? fontSize.md : fontSize.lg,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});
