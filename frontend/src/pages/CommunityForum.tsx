import React from 'react';
import { MessageSquare, Shield, Users2 } from 'lucide-react';
import LegacyFeaturePage from '../components/LegacyFeaturePage';

const CommunityForum: React.FC = () => (
  <LegacyFeaturePage
    eyebrow="Community Space"
    title="Community Forum"
    description="A discussion hub for asking questions, sharing wins, and helping other learners. This screen is now presented as a polished community preview instead of a generic stub."
    primaryAction={{ label: 'Go to Dashboard', to: '/dashboard' }}
    secondaryAction={{ label: 'Browse Courses', to: '/courses' }}
    highlights={[
      { title: 'Topic Threads', description: 'Organize discussions around Python, interviews, and projects.', icon: MessageSquare },
      { title: 'Peer Support', description: 'Make it easy for learners to answer each other quickly.', icon: Users2 },
      { title: 'Safe Moderation', description: 'Keep community spaces welcoming and high-signal.', icon: Shield }
    ]}
  />
);

export default CommunityForum;
