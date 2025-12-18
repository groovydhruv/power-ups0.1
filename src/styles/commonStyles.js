import { StyleSheet } from 'react-native';
import { colors, spacing, borderRadius, fontSize, fonts } from './theme';

export const commonStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: spacing.xl,
  },
  card: {
    backgroundColor: colors.cardBackground,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  cardLocked: {
    backgroundColor: colors.cardBackgroundLocked,
    opacity: 0.7,
  },
  text: {
    color: colors.textPrimary,
    fontSize: fontSize.md,
    fontFamily: fonts.primary,
  },
  textSecondary: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    fontFamily: fonts.primary,
  },
  textTertiary: {
    color: colors.textTertiary,
    fontSize: fontSize.xs,
    fontFamily: fonts.primary,
  },
  heading1: {
    fontSize: fontSize.xxxl,
    fontWeight: '600',
    color: colors.textPrimary,
    letterSpacing: -0.5,
    fontFamily: fonts.primary,
  },
  heading2: {
    fontSize: fontSize.xxl,
    fontWeight: '600',
    color: colors.textPrimary,
    letterSpacing: -0.3,
    fontFamily: fonts.primary,
  },
  heading3: {
    fontSize: fontSize.xl,
    fontWeight: '500',
    color: colors.textPrimary,
    letterSpacing: -0.2,
    fontFamily: fonts.primary,
  },
  button: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.buttonBorder,
    backgroundColor: 'transparent',
    minHeight: 44, // Touch target
  },
  buttonPrimary: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  buttonText: {
    fontSize: fontSize.sm,
    color: colors.textPrimary,
    textAlign: 'center',
    fontWeight: '500',
    fontFamily: fonts.primary,
  },
  buttonTextPrimary: {
    color: colors.primaryLight,
  },
  progressBar: {
    height: 2,
    backgroundColor: colors.progressBar,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.progressFill,
  },
  shadow: {
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4, // Android shadow
  },
  shadowLarge: {
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 8, // Android shadow
  },
});

