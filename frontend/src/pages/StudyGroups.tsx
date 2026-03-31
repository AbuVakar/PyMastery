import React from 'react';
import { CalendarClock, Goal, Users } from 'lucide-react';
import LegacyFeaturePage from '../components/LegacyFeaturePage';

const StudyGroups: React.FC = () => (
  <LegacyFeaturePage
    eyebrow="Peer Learning"
    title="Study Groups"
    description="A coordinated space for accountability, shared learning goals, and small-group momentum across courses and coding practice."
    primaryAction={{ label: 'View Activity', to: '/activity' }}
    secondaryAction={{ label: 'Browse Courses', to: '/courses' }}
    highlights={[
      { title: 'Group Sessions', description: 'Coordinate small focused study blocks around the same goals.', icon: Users },
      { title: 'Shared Milestones', description: 'Track commitments and progress without losing visibility.', icon: Goal },
      { title: 'Scheduling Support', description: 'Keep upcoming sessions and deadlines easy to review.', icon: CalendarClock }
    ]}
  />
);

export default StudyGroups;
