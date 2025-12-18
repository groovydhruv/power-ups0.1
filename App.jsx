import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ProgressProvider } from './src/context/ProgressContext';
import AppNavigator from './src/navigation/AppNavigator';
import UsernameScreen from './src/components/UsernameScreen';
import { fetchTopics, fetchResourcesByTopic } from './src/lib/dataApi';
import { colors, fontSize, fonts } from './src/styles/theme';

// Set default font for all Text components
if (Text.defaultProps == null) {
  Text.defaultProps = {};
}
Text.defaultProps.style = { fontFamily: fonts.primary };

export default function App() {
  const [username, setUsername] = useState('');
  const [isUsernameLoading, setIsUsernameLoading] = useState(true);
  const [topics, setTopics] = useState([]);
  const [resourcesByTopic, setResourcesByTopic] = useState({});
  const [loadingData, setLoadingData] = useState(true);

  // Load username from AsyncStorage on mount
  useEffect(() => {
    const loadUsername = async () => {
      try {
        const saved = await AsyncStorage.getItem('navi_username');
        if (saved) {
          setUsername(saved);
        }
      } catch (error) {
        console.warn('Failed to load username:', error);
      } finally {
        setIsUsernameLoading(false);
      }
    };
    loadUsername();
  }, []);

  // Load topics and resources data
  useEffect(() => {
    const loadData = async () => {
      setLoadingData(true);
      try {
        const [topicsData, resourcesData] = await Promise.all([
          fetchTopics(),
          fetchResourcesByTopic(),
        ]);
        setTopics(topicsData);
        setResourcesByTopic(resourcesData);
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setLoadingData(false);
      }
    };
    loadData();
  }, []);

  const handleUsernameComplete = async (name) => {
    try {
      await AsyncStorage.setItem('navi_username', name);
      setUsername(name);
    } catch (error) {
      console.warn('Failed to save username:', error);
      // Still set username in state even if save fails
      setUsername(name);
    }
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('navi_username');
      setUsername('');
    } catch (error) {
      console.warn('Failed to remove username:', error);
      // Still logout in app state
      setUsername('');
    }
  };

  // Show loading screen while checking username
  if (isUsernameLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // Show username screen if no username
  if (!username) {
    return <UsernameScreen onComplete={handleUsernameComplete} />;
  }

  // Show loading screen while fetching data
  if (loadingData) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  // Main app with navigation
  return (
    <ProgressProvider
      storageKey={`learning-platform-progress-${username}`}
      username={username}
      key={username}
    >
      <NavigationContainer>
        <AppNavigator
          topics={topics}
          resources={resourcesByTopic}
          username={username}
          onLogout={handleLogout}
        />
      </NavigationContainer>
    </ProgressProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: fontSize.md,
    color: colors.textPrimary,
  },
});

