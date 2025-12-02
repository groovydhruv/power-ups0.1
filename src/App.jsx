import { useState } from 'react';
import { ProgressProvider } from './context/ProgressContext';
import TopicSelection from './components/TopicSelection';
import ResourceList from './components/ResourceList';
import VoiceConversation from './components/VoiceConversation';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('topics');
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [selectedResource, setSelectedResource] = useState(null);

  const handleSelectTopic = (topic) => {
    setSelectedTopic(topic);
    setCurrentScreen('resources');
  };

  const handleBackToTopics = () => {
    setCurrentScreen('topics');
    setSelectedTopic(null);
  };

  const handleStartConversation = (resource) => {
    setSelectedResource(resource);
    setCurrentScreen('conversation');
  };

  const handleExitConversation = () => {
    setCurrentScreen('resources');
    setSelectedResource(null);
  };

  return (
    <ProgressProvider>
      {currentScreen === 'topics' && <TopicSelection onSelectTopic={handleSelectTopic} />}
      {currentScreen === 'resources' && selectedTopic && (
        <ResourceList
          topic={selectedTopic}
          onBack={handleBackToTopics}
          onStartConversation={handleStartConversation}
        />
      )}
      {currentScreen === 'conversation' && selectedResource && (
        <VoiceConversation
          resource={selectedResource}
          onExit={handleExitConversation}
        />
      )}
    </ProgressProvider>
  );
}
