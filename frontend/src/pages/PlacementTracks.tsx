import React from 'react';
import { BriefcaseBusiness, Goal, TrendingUp } from 'lucide-react';
import LegacyFeaturePage from '../components/LegacyFeaturePage';

const PlacementTracks: React.FC = () => (
  <LegacyFeaturePage
    eyebrow="Career Prep"
    title="Placement Tracks"
    description="Focused preparation paths for interviews, problem solving, and job-ready projects across different career goals."
    primaryAction={{ label: 'Open Problems', to: '/problems' }}
    secondaryAction={{ label: 'Visit Dashboard', to: '/dashboard' }}
    highlights={[
      { title: 'Role-Based Paths', description: 'Group practice by backend, data, or full-stack ambitions.', icon: BriefcaseBusiness },
      { title: 'Interview Targets', description: 'Set milestones for coding rounds and mock sessions.', icon: Goal },
      { title: 'Progress Signals', description: 'Measure readiness with visible trend tracking.', icon: TrendingUp }
    ]}
  />
);

export default PlacementTracks;
