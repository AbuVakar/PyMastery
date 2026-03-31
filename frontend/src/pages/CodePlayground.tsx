import React from 'react';
import { Code2, PlayCircle, TerminalSquare } from 'lucide-react';
import LegacyFeaturePage from '../components/LegacyFeaturePage';

const CodePlayground: React.FC = () => (
  <LegacyFeaturePage
    eyebrow="Practice Workspace"
    title="Code Playground"
    description="A fast sandbox for experimenting with snippets, debugging ideas, and practicing outside the structured problem flow."
    primaryAction={{ label: 'Solve a Problem', to: '/problems' }}
    secondaryAction={{ label: 'Open AI Chat', to: '/ai-chat' }}
    highlights={[
      { title: 'Quick Experiments', description: 'Try short code samples without leaving the learning flow.', icon: Code2 },
      { title: 'Instant Runs', description: 'Move from writing to testing with minimal friction.', icon: PlayCircle },
      { title: 'Console Feedback', description: 'See outputs, errors, and iteration history clearly.', icon: TerminalSquare }
    ]}
  />
);

export default CodePlayground;
