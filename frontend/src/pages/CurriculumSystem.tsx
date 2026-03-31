import React from 'react';
import { BookMarked, Layers3, Route } from 'lucide-react';
import LegacyFeaturePage from '../components/LegacyFeaturePage';

const CurriculumSystem: React.FC = () => (
  <LegacyFeaturePage
    eyebrow="Learning Architecture"
    title="Curriculum System"
    description="A structured overview for sequencing concepts, projects, and assessments across beginner to advanced Python tracks."
    primaryAction={{ label: 'Browse Courses', to: '/courses' }}
    secondaryAction={{ label: 'View Achievements', to: '/achievements' }}
    highlights={[
      { title: 'Track Mapping', description: 'Keep every lesson connected to a larger learning goal.', icon: Route },
      { title: 'Module Layers', description: 'Organize fundamentals, practice, and applied work cleanly.', icon: Layers3 },
      { title: 'Reusable Content', description: 'Build curriculum pieces that can be shared across paths.', icon: BookMarked }
    ]}
  />
);

export default CurriculumSystem;
