import React, { useState } from 'react';
import { 
  View, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  KeyboardAvoidingView,
  Platform,
  Alert 
} from 'react-native';
import { colors, spacing, borderRadius, fontSize } from '../styles/theme';

export default function UsernameScreen({ onComplete }) {
  const [username, setUsername] = useState('');

  const handleSubmit = () => {
    const trimmed = username.trim();
    
    if (!trimmed || trimmed.length < 3) {
      Alert.alert('Invalid Username', 'Please choose a name with at least 3 characters.');
      return;
    }

    onComplete(trimmed);
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={username}
            onChangeText={setUsername}
            placeholder="username"
            placeholderTextColor={colors.textSecondary}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="done"
            onSubmitEditing={handleSubmit}
          />
        </View>

        <TouchableOpacity 
          style={styles.button}
          onPress={handleSubmit}
          activeOpacity={0.8}
          accessible
          accessibilityLabel="Continue"
          accessibilityRole="button"
        >
          <View style={styles.buttonGradient} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xxxl,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  inputContainer: {
    backgroundColor: colors.buttonBackground,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md + 2,
    minWidth: 220,
  },
  input: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    padding: 0, // Remove default padding
  },
  button: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8, // Android shadow
  },
  buttonGradient: {
    flex: 1,
    backgroundColor: '#10b981', // Fallback for gradient
    // Note: For true gradients in React Native, use react-native-linear-gradient
    // For prototype, solid color is sufficient
  },
});
