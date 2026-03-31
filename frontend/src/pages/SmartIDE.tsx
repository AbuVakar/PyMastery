import React from 'react';
import { Bot, CodeXml, Lightbulb } from 'lucide-react';
import LegacyFeaturePage from '../components/LegacyFeaturePage';

const SmartIDE: React.FC = () => (
  <LegacyFeaturePage
    eyebrow="Developer Workspace"
    title="Smart IDE"
    description="A richer coding environment for longer exercises, guided hints, and structured debugging support."
    primaryAction={{ label: 'Open Problems', to: '/problems' }}
    secondaryAction={{ label: 'Chat with AI Tutor', to: '/ai-chat' }}
    highlights={[
      { title: 'Guided Editing', description: 'Write code with enough structure to stay focused on the task.', icon: CodeXml },
      { title: 'Contextual Hints', description: 'Surface helpful nudges without interrupting the coding flow.', icon: Lightbulb },
      { title: 'AI Assistance', description: 'Blend tutoring and debugging support where it is most useful.', icon: Bot }
    ]}
  />
);

export default SmartIDE;
