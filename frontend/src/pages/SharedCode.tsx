import React from 'react';
import { GitBranch, MessagesSquare, Share2 } from 'lucide-react';
import LegacyFeaturePage from '../components/LegacyFeaturePage';

const SharedCode: React.FC = () => (
  <LegacyFeaturePage
    eyebrow="Collaboration"
    title="Shared Code"
    description="A collaborative view for reviewing snippets, exchanging solutions, and discussing implementation choices with peers or mentors."
    primaryAction={{ label: 'Open AI Chat', to: '/ai-chat' }}
    secondaryAction={{ label: 'Visit Profile', to: '/profile' }}
    highlights={[
      { title: 'Snippet Sharing', description: 'Exchange focused examples without losing formatting or context.', icon: Share2 },
      { title: 'Review Threads', description: 'Discuss tradeoffs and feedback directly beside shared code.', icon: MessagesSquare },
      { title: 'Version Awareness', description: 'Keep revisions and forks understandable for learners.', icon: GitBranch }
    ]}
  />
);

export default SharedCode;
