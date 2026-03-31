import React from 'react';
import { BarChart3, ShieldCheck, Users } from 'lucide-react';
import LegacyFeaturePage from '../components/LegacyFeaturePage';

const AdminDashboard: React.FC = () => (
  <LegacyFeaturePage
    eyebrow="Admin Preview"
    title="Admin Dashboard"
    description="A clean control surface for moderation, learner analytics, and platform health. This legacy route now lands on a real preview page instead of a broken placeholder."
    primaryAction={{ label: 'Open Main Dashboard', to: '/dashboard' }}
    secondaryAction={{ label: 'View Activity', to: '/activity' }}
    highlights={[
      { title: 'Platform Metrics', description: 'Track usage, retention, and progress trends in one place.', icon: BarChart3 },
      { title: 'Access Controls', description: 'Review permissions, moderation tasks, and account status safely.', icon: ShieldCheck },
      { title: 'User Oversight', description: 'Spot cohorts that need support before they drop off.', icon: Users }
    ]}
  />
);

export default AdminDashboard;
