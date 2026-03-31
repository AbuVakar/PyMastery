import React, { useState } from 'react';

interface Role {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  skills: string[];
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  duration: string;
  prerequisites: string[];
  outcomes: string[];
}

interface CustomRole {
  name: string;
  description: string;
  selectedSkills: string[];
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  duration: string;
  prerequisites: string[];
  outcomes: string[];
}

const RoleComposer: React.FC = () => {
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [customRole, setCustomRole] = useState<CustomRole>({
    name: '',
    description: '',
    selectedSkills: [],
    difficulty: 'Beginner',
    duration: '',
    prerequisites: [],
    outcomes: []
  });
  const [activeTab, setActiveTab] = useState<'preset' | 'custom'>('preset');
  const [isComposing, setIsComposing] = useState(false);

  const predefinedRoles: Role[] = [
    {
      id: '1',
      name: 'Frontend Developer',
      description: 'Master modern web development with React, TypeScript, and cutting-edge frontend technologies',
      icon: '🎨',
      color: 'from-blue-400 to-cyan-400',
      skills: ['React', 'TypeScript', 'CSS', 'HTML', 'JavaScript', 'Vue.js', 'Angular', 'Tailwind CSS'],
      difficulty: 'Intermediate',
      duration: '6 months',
      prerequisites: ['Basic HTML/CSS', 'JavaScript Fundamentals'],
      outcomes: ['Build responsive web apps', 'Master modern frameworks', 'Create stunning UIs', 'Optimize performance']
    },
    {
      id: '2',
      name: 'Backend Developer',
      description: 'Become an expert in server-side development, databases, and API architecture',
      icon: '⚙️',
      color: 'from-green-400 to-emerald-400',
      skills: ['Node.js', 'Python', 'Databases', 'API Design', 'Authentication', 'Cloud Services', 'Microservices'],
      difficulty: 'Intermediate',
      duration: '8 months',
      prerequisites: ['Programming basics', 'Data structures'],
      outcomes: ['Design scalable APIs', 'Manage databases', 'Implement security', 'Deploy applications']
    },
    {
      id: '3',
      name: 'Full Stack Developer',
      description: 'Master both frontend and backend development to become a versatile software engineer',
      icon: '🚀',
      color: 'from-purple-400 to-pink-400',
      skills: ['React', 'Node.js', 'Databases', 'APIs', 'DevOps', 'Cloud', 'Testing', 'Security'],
      difficulty: 'Advanced',
      duration: '12 months',
      prerequisites: ['Web basics', 'Programming fundamentals'],
      outcomes: ['Build complete applications', 'Handle full development cycle', 'Deploy and maintain apps']
    },
    {
      id: '4',
      name: 'Data Scientist',
      description: 'Learn data analysis, machine learning, and AI to extract insights from data',
      icon: '📊',
      color: 'from-orange-400 to-red-400',
      skills: ['Python', 'Machine Learning', 'Statistics', 'Data Visualization', 'SQL', 'Deep Learning'],
      difficulty: 'Advanced',
      duration: '10 months',
      prerequisites: ['Python programming', 'Statistics basics', 'Linear algebra'],
      outcomes: ['Build ML models', 'Analyze complex datasets', 'Create data visualizations', 'Deploy ML solutions']
    },
    {
      id: '5',
      name: 'DevOps Engineer',
      description: 'Master deployment, automation, and infrastructure management for modern applications',
      icon: '🔧',
      color: 'from-indigo-400 to-purple-400',
      skills: ['Docker', 'Kubernetes', 'CI/CD', 'Cloud Platforms', 'Monitoring', 'Infrastructure as Code'],
      difficulty: 'Advanced',
      duration: '9 months',
      prerequisites: ['Linux basics', 'Networking fundamentals'],
      outcomes: ['Automate deployments', 'Manage infrastructure', 'Implement CI/CD', 'Monitor systems']
    },
    {
      id: '6',
      name: 'Mobile Developer',
      description: 'Create native and cross-platform mobile applications for iOS and Android',
      icon: '📱',
      color: 'from-pink-400 to-rose-400',
      skills: ['React Native', 'Flutter', 'Swift', 'Kotlin', 'Mobile UI/UX', 'App Deployment'],
      difficulty: 'Intermediate',
      duration: '7 months',
      prerequisites: ['Programming basics', 'Mobile app concepts'],
      outcomes: ['Build mobile apps', 'Deploy to app stores', 'Optimize performance', 'Handle mobile-specific features']
    }
  ];

  const allSkills = [
    'React', 'Vue.js', 'Angular', 'TypeScript', 'JavaScript', 'HTML', 'CSS', 'Tailwind CSS',
    'Node.js', 'Python', 'Java', 'C++', 'Go', 'Rust', 'PHP', 'Ruby',
    'MongoDB', 'PostgreSQL', 'MySQL', 'Redis', 'Elasticsearch', 'Firebase',
    'Docker', 'Kubernetes', 'AWS', 'Azure', 'Google Cloud', 'Heroku',
    'Machine Learning', 'Deep Learning', 'Data Science', 'AI', 'TensorFlow', 'PyTorch',
    'DevOps', 'CI/CD', 'Git', 'Linux', 'Networking', 'Security', 'Testing',
    'Mobile Development', 'React Native', 'Flutter', 'Swift', 'Kotlin',
    'UI/UX Design', 'Figma', 'Adobe XD', 'Prototyping', 'Wireframing'
  ];

  const handleSkillToggle = (skill: string) => {
    setCustomRole(prev => ({
      ...prev,
      selectedSkills: prev.selectedSkills.includes(skill)
        ? prev.selectedSkills.filter(s => s !== skill)
        : [...prev.selectedSkills, skill]
    }));
  };

  const handlePrerequisiteChange = (index: number, value: string) => {
    setCustomRole(prev => ({
      ...prev,
      prerequisites: prev.prerequisites.map((prereq, i) => i === index ? value : prereq)
    }));
  };

  const addPrerequisite = () => {
    setCustomRole(prev => ({
      ...prev,
      prerequisites: [...prev.prerequisites, '']
    }));
  };

  const removePrerequisite = (index: number) => {
    setCustomRole(prev => ({
      ...prev,
      prerequisites: prev.prerequisites.filter((_, i) => i !== index)
    }));
  };

  const handleOutcomeChange = (index: number, value: string) => {
    setCustomRole(prev => ({
      ...prev,
      outcomes: prev.outcomes.map((outcome, i) => i === index ? value : outcome)
    }));
  };

  const addOutcome = () => {
    setCustomRole(prev => ({
      ...prev,
      outcomes: [...prev.outcomes, '']
    }));
  };

  const removeOutcome = (index: number) => {
    setCustomRole(prev => ({
      ...prev,
      outcomes: prev.outcomes.filter((_, i) => i !== index)
    }));
  };

  const handleRoleSelect = (role: Role) => {
    setSelectedRole(role);
  };

  const handleStartRole = () => {
    if (selectedRole) {
      console.log('Starting role:', selectedRole.name);
      // For now, just show an alert since we don't have the learning path page yet
      alert(`Starting learning path for ${selectedRole.name}! This will navigate to the learning dashboard.`);
      // Navigate to the role learning path when implemented
      // navigate(`/learn/${selectedRole.id}`);
    }
  };

  const handleCreateCustomRole = async () => {
    if (!customRole.name || !customRole.description) {
      alert('Please fill in the role name and description');
      return;
    }
    
    setIsComposing(true);
    
    try {
      // Simulate API call to create custom role
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      console.log('Creating custom role:', customRole);
      alert(`Custom role "${customRole.name}" created successfully! This will navigate to your custom learning path.`);
      
      // Navigate to the custom role learning path when implemented
      // navigate('/learn/custom');
    } catch (error) {
      console.error('Error creating custom role:', error);
      alert('Failed to create custom role. Please try again.');
    } finally {
      setIsComposing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Role Composer
            </span>
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Choose from predefined learning paths or create your own custom role tailored to your career goals
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-8">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-1 shadow-lg">
            <button
              onClick={() => setActiveTab('preset')}
              className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                activeTab === 'preset'
                  ? 'bg-gradient-to-r from-purple-400 to-pink-400 text-white shadow-lg'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              📋 Preset Roles
            </button>
            <button
              onClick={() => setActiveTab('custom')}
              className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                activeTab === 'custom'
                  ? 'bg-gradient-to-r from-purple-400 to-pink-400 text-white shadow-lg'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              🎨 Custom Role
            </button>
          </div>
        </div>

        {/* Preset Roles Tab */}
        {activeTab === 'preset' && (
          <div className="space-y-8">
            {/* Selected Role Detail */}
            {selectedRole && (
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-slate-700">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-4">
                    <div className={`w-16 h-16 bg-gradient-to-r ${selectedRole.color} rounded-2xl flex items-center justify-center text-3xl shadow-lg`}>
                      {selectedRole.icon}
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{selectedRole.name}</h2>
                      <p className="text-gray-600 dark:text-gray-300">{selectedRole.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      selectedRole.difficulty === 'Beginner' ? 'bg-green-100 text-green-800' :
                      selectedRole.difficulty === 'Intermediate' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {selectedRole.difficulty}
                    </span>
                    <span className="text-gray-500 dark:text-gray-400">⏱️ {selectedRole.duration}</span>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Skills You'll Learn</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedRole.skills.map((skill, index) => (
                        <span key={index} className="px-3 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded-lg text-sm">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Prerequisites</h3>
                    <ul className="space-y-1">
                      {selectedRole.prerequisites.map((prereq, index) => (
                        <li key={index} className="text-gray-600 dark:text-gray-300">• {prereq}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="mb-6">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Learning Outcomes</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {selectedRole.outcomes.map((outcome, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <span className="text-green-500">✓</span>
                        <span className="text-gray-600 dark:text-gray-300">{outcome}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={handleStartRole}
                    className="px-8 py-3 bg-gradient-to-r from-purple-400 to-pink-400 text-white rounded-xl font-semibold hover:shadow-lg transition-all duration-200 transform hover:scale-105"
                  >
                    Start Learning Path 🚀
                  </button>
                </div>
              </div>
            )}

            {/* Role Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {predefinedRoles.map((role) => (
                <div
                  key={role.id}
                  onClick={() => handleRoleSelect(role)}
                  className={`bg-white dark:bg-slate-800 rounded-xl p-6 cursor-pointer transition-all duration-200 border ${
                    selectedRole?.id === role.id
                      ? 'border-purple-400 shadow-xl ring-2 ring-purple-400'
                      : 'border-gray-200 dark:border-slate-700 hover:border-purple-300 hover:shadow-lg'
                  }`}
                >
                  <div className="flex items-center space-x-3 mb-4">
                    <div className={`w-12 h-12 bg-gradient-to-r ${role.color} rounded-xl flex items-center justify-center text-2xl`}>
                      {role.icon}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">{role.name}</h3>
                      <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                        <span className={`px-2 py-0.5 rounded-full text-xs ${
                          role.difficulty === 'Beginner' ? 'bg-green-100 text-green-700' :
                          role.difficulty === 'Intermediate' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {role.difficulty}
                        </span>
                        <span>⏱️ {role.duration}</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-3">
                    {role.description}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {role.skills.slice(0, 3).map((skill, index) => (
                      <span key={index} className="text-xs px-2 py-1 bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 rounded">
                        {skill}
                      </span>
                    ))}
                    {role.skills.length > 3 && (
                      <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 rounded">
                        +{role.skills.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Custom Role Tab */}
        {activeTab === 'custom' && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-slate-700">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Create Your Custom Role</h2>
            
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Role Name
                  </label>
                  <input
                    type="text"
                    value={customRole.name}
                    onChange={(e) => setCustomRole(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-purple-400 dark:bg-slate-700 dark:text-white"
                    placeholder="e.g., AI Ethics Specialist"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Duration
                  </label>
                  <input
                    type="text"
                    value={customRole.duration}
                    onChange={(e) => setCustomRole(prev => ({ ...prev, duration: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-purple-400 dark:bg-slate-700 dark:text-white"
                    placeholder="e.g., 6 months"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={customRole.description}
                  onChange={(e) => setCustomRole(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-purple-400 dark:bg-slate-700 dark:text-white"
                  rows={3}
                  placeholder="Describe your custom role and what makes it unique..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Difficulty Level
                </label>
                <select
                  value={customRole.difficulty}
                  onChange={(e) => setCustomRole(prev => ({
                    ...prev,
                    difficulty: e.target.value as CustomRole['difficulty']
                  }))}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-purple-400 dark:bg-slate-700 dark:text-white"
                >
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
              </div>

              {/* Skills Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Skills ({customRole.selectedSkills.length} selected)
                </label>
                <div className="border border-gray-300 dark:border-slate-600 rounded-lg p-4 max-h-48 overflow-y-auto dark:bg-slate-700">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {allSkills.map((skill, index) => (
                      <label
                        key={index}
                        className="flex items-center space-x-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-600 p-2 rounded"
                      >
                        <input
                          type="checkbox"
                          checked={customRole.selectedSkills.includes(skill)}
                          onChange={() => handleSkillToggle(skill)}
                          className="text-purple-400 focus:ring-purple-400"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">{skill}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* Prerequisites */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Prerequisites
                </label>
                {customRole.prerequisites.map((prereq, index) => (
                  <div key={index} className="flex space-x-2 mb-2">
                    <input
                      type="text"
                      value={prereq}
                      onChange={(e) => handlePrerequisiteChange(index, e.target.value)}
                      className="flex-1 px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-purple-400 dark:bg-slate-700 dark:text-white"
                      placeholder="Enter prerequisite..."
                    />
                    <button
                      onClick={() => removePrerequisite(index)}
                      className="px-3 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  onClick={addPrerequisite}
                  className="px-4 py-2 bg-purple-100 text-purple-600 rounded-lg hover:bg-purple-200"
                >
                  + Add Prerequisite
                </button>
              </div>

              {/* Learning Outcomes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Learning Outcomes
                </label>
                {customRole.outcomes.map((outcome, index) => (
                  <div key={index} className="flex space-x-2 mb-2">
                    <input
                      type="text"
                      value={outcome}
                      onChange={(e) => handleOutcomeChange(index, e.target.value)}
                      className="flex-1 px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-purple-400 dark:bg-slate-700 dark:text-white"
                      placeholder="What will you learn..."
                    />
                    <button
                      onClick={() => removeOutcome(index)}
                      className="px-3 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  onClick={addOutcome}
                  className="px-4 py-2 bg-purple-100 text-purple-600 rounded-lg hover:bg-purple-200"
                >
                  + Add Outcome
                </button>
              </div>

              {/* Create Button */}
              <div className="flex justify-end">
                <button
                  onClick={handleCreateCustomRole}
                  disabled={isComposing || !customRole.name || !customRole.description}
                  className="px-8 py-3 bg-gradient-to-r from-purple-400 to-pink-400 text-white rounded-xl font-semibold hover:shadow-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isComposing ? 'Creating...' : 'Create Custom Role 🎨'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RoleComposer;
