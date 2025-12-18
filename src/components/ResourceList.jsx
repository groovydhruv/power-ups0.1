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

            return (
      <View style={[
        styles.resourceCard, 
        !unlocked && styles.resourceCardLocked,
        isInProgress && styles.resourceCardInProgress
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
              {isCompleted && <CheckIcon color={colors.success} boxSize={12} />}
              {!unlocked && <LockIcon color={colors.textTertiary} />}
            </View>
            <Text style={styles.resourceMeta}>
              {resource.type} · {resource.duration}
              {isInProgress && <Text style={styles.inProgressBadge}> · In Progress</Text>}
            </Text>
          </View>

          {unlocked && (
            <View style={styles.resourceActions}>
              <TouchableOpacity
                onPress={(e) => {
                  e.stopPropagation();
                  handleAction(resource);
                }}
                disabled={isCompleted}
                style={[
                  styles.actionButton,
                  isCompleted && styles.actionButtonDisabled,
                  isInProgress && styles.actionButtonInProgress
                ]}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.actionButtonText,
                  isCompleted && styles.actionButtonTextDisabled,
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
    padding: isMobile ? spacing.xl : spacing.xxxl,
    paddingBottom: spacing.lg,
  },
  backButton: {
    alignSelf: 'flex-start',
    padding: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.sm,
    marginBottom: isMobile ? spacing.md : spacing.lg,
    minHeight: 44,
    justifyContent: 'center',
  },
  backButtonText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  titleContainer: {
    marginBottom: spacing.md,
  },
  title: {
    fontSize: isMobile ? fontSize.xxl : fontSize.xxxl,
    fontWeight: '600',
    color: colors.textPrimary,
    letterSpacing: -0.5,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: isMobile ? fontSize.sm : fontSize.md,
    color: colors.textSecondary,
    lineHeight: fontSize.sm * 1.5,
  },
  listContent: {
    padding: isMobile ? spacing.xl : spacing.xxxl,
    paddingTop: 0,
    gap: spacing.md,
  },
  resourceCard: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.cardBackground,
    overflow: 'hidden',
    marginBottom: spacing.md,
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
  resourceHeader: {
    padding: isMobile ? spacing.lg : spacing.xl,
    flexDirection: isMobile ? 'column' : 'row',
    justifyContent: 'space-between',
    alignItems: isMobile ? 'stretch' : 'center',
    gap: isMobile ? spacing.md : 0,
  },
  resourceInfo: {
    flex: 1,
  },
  resourceTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  resourceIndex: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: '500',
    marginTop: 2,
  },
  resourceTitle: {
    fontSize: isMobile ? fontSize.sm + 1 : fontSize.md,
    fontWeight: '500',
    color: colors.textPrimary,
    letterSpacing: -0.2,
    flex: 1,
    lineHeight: fontSize.md * 1.3,
  },
  resourceMeta: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
    marginTop: spacing.xs / 2,
  },
  inProgressBadge: {
    color: colors.primary,
    fontWeight: '600',
  },
  resourceActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: isMobile ? 'flex-start' : 'flex-end',
    gap: spacing.md,
  },
  actionButton: {
    paddingHorizontal: isMobile ? spacing.md : spacing.lg,
    paddingVertical: spacing.sm + 2,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.buttonBorder,
    backgroundColor: 'transparent',
    minHeight: 44,
    justifyContent: 'center',
    flex: isMobile ? 1 : 0,
  },
  actionButtonDisabled: {
    backgroundColor: colors.buttonBackground,
  },
  actionButtonInProgress: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  actionButtonText: {
    fontSize: isMobile ? fontSize.sm - 1 : fontSize.sm,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  actionButtonTextDisabled: {
    color: colors.textTertiary,
  },
  actionButtonTextInProgress: {
    color: colors.primaryLight,
    fontWeight: '600',
  },
  resourceDetails: {
    paddingHorizontal: isMobile ? spacing.lg : spacing.xl,
    paddingBottom: isMobile ? spacing.lg : spacing.xl,
  },
  resourceDescription: {
    fontSize: isMobile ? fontSize.sm - 1 : fontSize.sm,
    color: colors.textSecondary,
    lineHeight: fontSize.sm * 1.5,
    marginBottom: spacing.lg,
  },
  thumbnailContainer: {
    height: 240,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    position: 'relative',
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
    fontSize: fontSize.md,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
});
