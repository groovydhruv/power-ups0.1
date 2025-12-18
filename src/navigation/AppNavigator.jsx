import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import TopicSelection from '../components/TopicSelection';
import ResourceList from '../components/ResourceList';
import VoiceConversation from '../components/VoiceConversation';
import { colors } from '../styles/theme';

const Stack = createStackNavigator();

/**
 * Main App Navigator
 * 
 * Defines the navigation structure for the app:
 * - TopicSelection: Main screen showing all topics
 * - ResourceList: Shows resources for a selected topic
 * - VoiceConversation: Mock voice conversation screen
 */
export default function AppNavigator({ 
  topics, 
  resources, 
  username, 
  onLogout 
}) {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: colors.background },
        gestureEnabled: true,
        gestureDirection: 'horizontal',
      }}
    >
      <Stack.Screen name="Topics">
        {(props) => (
          <TopicSelection
            {...props}
            topics={topics}
            resources={resources}
            username={username}
            onLogout={onLogout}
            onSelectTopic={(topic) => {
              props.navigation.navigate('Resources', { topic });
            }}
          />
        )}
      </Stack.Screen>

      <Stack.Screen name="Resources">
        {(props) => (
          <ResourceList
            {...props}
            topic={props.route.params.topic}
            resources={resources}
            onBack={() => props.navigation.goBack()}
            onStartConversation={(resource) => {
              props.navigation.navigate('Conversation', { resource });
            }}
          />
        )}
      </Stack.Screen>

      <Stack.Screen name="Conversation">
        {(props) => (
          <VoiceConversation
            {...props}
            resource={props.route.params.resource}
            onExit={() => props.navigation.goBack()}
          />
        )}
      </Stack.Screen>
    </Stack.Navigator>
  );
}

