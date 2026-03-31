import React from 'react';
import { BookOpenText, Filter, LibraryBig } from 'lucide-react';
import LegacyFeaturePage from '../components/LegacyFeaturePage';

const ResourceLibrary: React.FC = () => (
  <LegacyFeaturePage
    eyebrow="Reference Hub"
    title="Resource Library"
    description="A structured place for curated notes, guides, and practice resources so learners can revisit key material quickly."
    primaryAction={{ label: 'Browse Courses', to: '/courses' }}
    secondaryAction={{ label: 'Open Quiz', to: '/quiz' }}
    highlights={[
      { title: 'Curated Notes', description: 'Keep explanations and references searchable and easy to revisit.', icon: BookOpenText },
      { title: 'Focused Collections', description: 'Group resources by topic, difficulty, and interview relevance.', icon: Filter },
      { title: 'Reusable Library', description: 'Turn scattered content into a stable knowledge base.', icon: LibraryBig }
    ]}
  />
);

export default ResourceLibrary;
