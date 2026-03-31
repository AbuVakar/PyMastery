import React, { useState } from 'react';

type ProjectTab = 'all' | 'bookmarked' | 'in-progress' | 'completed';

interface CapstoneProject {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  duration: string;
  technologies: string[];
  skills: string[];
  prerequisites: string[];
  outcomes: string[];
  progress: number;
  isStarted: boolean;
  isCompleted: boolean;
  isBookmarked: boolean;
  mentorAvailable: boolean;
  teamSize: 'Individual' | 'Pair' | 'Team';
  estimatedHours: number;
}

interface Milestone {
  id: string;
  projectId: string;
  title: string;
  description: string;
  duration: string;
  isCompleted: boolean;
  tasks: string[];
}

const EnhancedCapstone: React.FC = () => {
  const [selectedProject, setSelectedProject] = useState<CapstoneProject | null>(null);
  const [activeTab, setActiveTab] = useState<ProjectTab>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const capstoneProjects: CapstoneProject[] = [
    {
      id: '1',
      title: 'E-Commerce Platform',
      description: 'Build a full-featured e-commerce platform with user authentication, product catalog, shopping cart, and payment integration',
      category: 'Full Stack Development',
      difficulty: 'Intermediate',
      duration: '6-8 weeks',
      technologies: ['React', 'Node.js', 'MongoDB', 'Stripe API', 'JWT', 'Redux'],
      skills: ['Frontend Development', 'Backend Development', 'Database Design', 'API Integration', 'Authentication'],
      prerequisites: ['React Basics', 'Node.js Fundamentals', 'Database Knowledge', 'REST APIs'],
      outcomes: ['Full-stack application', 'Payment integration', 'User authentication', 'Product management'],
      progress: 60,
      isStarted: true,
      isCompleted: false,
      isBookmarked: true,
      mentorAvailable: true,
      teamSize: 'Team',
      estimatedHours: 120
    },
    {
      id: '2',
      title: 'Task Management System',
      description: 'Create a comprehensive task management application with drag-and-drop functionality, real-time updates, and team collaboration features',
      category: 'Frontend Development',
      difficulty: 'Intermediate',
      duration: '4-6 weeks',
      technologies: ['React', 'TypeScript', 'WebSocket', 'Drag & Drop API', 'CSS Grid', 'Context API'],
      skills: ['Advanced React', 'State Management', 'Real-time Communication', 'UI/UX Design', 'TypeScript'],
      prerequisites: ['React Hooks', 'State Management', 'CSS Advanced', 'TypeScript Basics'],
      outcomes: ['Real-time application', 'Drag-and-drop interface', 'Team collaboration', 'Advanced state management'],
      progress: 0,
      isStarted: false,
      isCompleted: false,
      isBookmarked: false,
      mentorAvailable: true,
      teamSize: 'Pair',
      estimatedHours: 80
    },
    {
      id: '3',
      title: 'Data Analytics Dashboard',
      description: 'Develop a comprehensive analytics dashboard with data visualization, real-time metrics, and interactive charts',
      category: 'Data Science',
      difficulty: 'Advanced',
      duration: '8-10 weeks',
      technologies: ['Python', 'React', 'D3.js', 'PostgreSQL', 'FastAPI', 'Docker'],
      skills: ['Data Visualization', 'Backend Development', 'Database Design', 'API Development', 'Containerization'],
      prerequisites: ['Python Advanced', 'Statistics', 'React Advanced', 'Database Design', 'API Design'],
      outcomes: ['Data visualization', 'Real-time analytics', 'API development', 'Containerized deployment'],
      progress: 0,
      isStarted: false,
      isCompleted: false,
      isBookmarked: true,
      mentorAvailable: true,
      teamSize: 'Individual',
      estimatedHours: 160
    },
    {
      id: '4',
      title: 'Social Media App',
      description: 'Build a social media application with posting, commenting, liking, user profiles, and real-time messaging',
      category: 'Mobile Development',
      difficulty: 'Advanced',
      duration: '10-12 weeks',
      technologies: ['React Native', 'Firebase', 'Redux', 'Socket.io', 'Expo', 'Node.js'],
      skills: ['Mobile Development', 'Real-time Communication', 'Authentication', 'Database Design', 'API Development'],
      prerequisites: ['React Native', 'Firebase', 'Redux', 'Node.js', 'Socket.io'],
      outcomes: ['Mobile application', 'Real-time messaging', 'Social features', 'Cloud deployment'],
      progress: 30,
      isStarted: true,
      isCompleted: false,
      isBookmarked: false,
      mentorAvailable: false,
      teamSize: 'Team',
      estimatedHours: 200
    },
    {
      id: '5',
      title: 'Blog Platform',
      description: 'Create a feature-rich blogging platform with markdown editor, user authentication, and content management',
      category: 'Full Stack Development',
      difficulty: 'Beginner',
      duration: '3-4 weeks',
      technologies: ['React', 'Express.js', 'MongoDB', 'Markdown', 'JWT', 'Tailwind CSS'],
      skills: ['Frontend Development', 'Backend Development', 'Database Design', 'Authentication', 'Markdown'],
      prerequisites: ['React Basics', 'Node.js Basics', 'Database Basics', 'HTML/CSS'],
      outcomes: ['Content management', 'User authentication', 'Markdown editing', 'Blog deployment'],
      progress: 100,
      isStarted: true,
      isCompleted: true,
      isBookmarked: false,
      mentorAvailable: true,
      teamSize: 'Individual',
      estimatedHours: 60
    },
    {
      id: '6',
      title: 'Weather Forecast App',
      description: 'Build a weather application with location-based forecasts, interactive maps, and weather data visualization',
      category: 'Frontend Development',
      difficulty: 'Beginner',
      duration: '2-3 weeks',
      technologies: ['React', 'Weather API', 'Google Maps API', 'Chart.js', 'CSS Animations', 'Geolocation API'],
      skills: ['API Integration', 'Data Visualization', 'Maps Integration', 'Responsive Design', 'Animations'],
      prerequisites: ['React Basics', 'API Integration', 'CSS Advanced', 'JavaScript Async'],
      outcomes: ['API integration', 'Data visualization', 'Maps implementation', 'Responsive design'],
      progress: 0,
      isStarted: false,
      isCompleted: false,
      isBookmarked: false,
      mentorAvailable: true,
      teamSize: 'Individual',
      estimatedHours: 40
    }
  ];

  const milestones: Milestone[] = [
    {
      id: '1-1',
      projectId: '1',
      title: 'Project Setup & Planning',
      description: 'Set up development environment and create project plan',
      duration: '1 week',
      isCompleted: true,
      tasks: ['Initialize repository', 'Set up React app', 'Configure database', 'Create project structure']
    },
    {
      id: '1-2',
      projectId: '1',
      title: 'User Authentication System',
      description: 'Implement user registration, login, and profile management',
      duration: '2 weeks',
      isCompleted: true,
      tasks: ['Design authentication flow', 'Implement JWT', 'Create user models', 'Build auth components']
    },
    {
      id: '1-3',
      projectId: '1',
      title: 'Product Catalog',
      description: 'Create product listing, search, and filtering functionality',
      duration: '2 weeks',
      isCompleted: true,
      tasks: ['Design database schema', 'Build product API', 'Create catalog UI', 'Implement search']
    },
    {
      id: '1-4',
      projectId: '1',
      title: 'Shopping Cart & Checkout',
      description: 'Implement shopping cart functionality and payment integration',
      duration: '2 weeks',
      isCompleted: false,
      tasks: ['Build cart system', 'Integrate Stripe', 'Create checkout flow', 'Add order management']
    }
  ];

  const categories = [
    'all',
    'Full Stack Development',
    'Frontend Development',
    'Backend Development',
    'Mobile Development',
    'Data Science',
    'DevOps',
    'AI/ML'
  ];

  const difficulties = ['all', 'Beginner', 'Intermediate', 'Advanced'];

  const userStats = {
    totalProjects: capstoneProjects.length,
    completedProjects: capstoneProjects.filter((project) => project.isCompleted).length,
    inProgressProjects: capstoneProjects.filter((project) => project.isStarted && !project.isCompleted).length,
    totalHours: capstoneProjects.reduce((hours, project) => hours + project.estimatedHours, 0),
  };

  const handleProjectSelect = (project: CapstoneProject) => {
    setSelectedProject(project);
  };

  const handleBookmarkToggle = (projectId: string) => {
    console.log('Toggle bookmark:', projectId);
  };

  const handleStartProject = (projectId: string) => {
    console.log('Starting project:', projectId);
    alert(`Starting capstone project: ${projectId}. This would navigate to the project workspace.`);
  };

  const filteredProjects = capstoneProjects.filter(project => {
    const matchesTab = 
      activeTab === 'all' ||
      (activeTab === 'bookmarked' && project.isBookmarked) ||
      (activeTab === 'completed' && project.isCompleted) ||
      (activeTab === 'in-progress' && project.isStarted && !project.isCompleted);
    
    const matchesCategory = selectedCategory === 'all' || project.category === selectedCategory;
    const matchesDifficulty = selectedDifficulty === 'all' || project.difficulty === selectedDifficulty;
    const matchesSearch = project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesTab && matchesCategory && matchesDifficulty && matchesSearch;
  });

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'Intermediate': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'Advanced': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getTeamSizeIcon = (teamSize: string) => {
    switch (teamSize) {
      case 'Individual': return '👤';
      case 'Pair': return '👥';
      case 'Team': return '👨‍👩‍👧‍👦';
      default: return '👥';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            <span className="bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
              Capstone Projects
            </span>
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Apply your skills to real-world projects and build an impressive portfolio
          </p>
        </div>

        {/* User Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Total Projects</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{userStats.totalProjects}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-xl flex items-center justify-center text-2xl">
                🚀
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Completed</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{userStats.completedProjects}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-xl flex items-center justify-center text-2xl">
                ✅
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-sm">In Progress</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{userStats.inProgressProjects}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-xl flex items-center justify-center text-2xl">
                ⏳
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Total Hours</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{userStats.totalHours}h</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-xl flex items-center justify-center text-2xl">
                ⏰
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-slate-700 mb-8">
          <div className="flex flex-col lg:flex-row gap-4 mb-4">
            {/* Search */}
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-orange-400 dark:bg-slate-700 dark:text-white"
              />
            </div>
            
            {/* Category Filter */}
            <div className="lg:w-64">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-orange-400 dark:bg-slate-700 dark:text-white"
              >
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category === 'all' ? 'All Categories' : category}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Difficulty Filter */}
            <div className="lg:w-48">
              <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-orange-400 dark:bg-slate-700 dark:text-white"
              >
                {difficulties.map(difficulty => (
                  <option key={difficulty} value={difficulty}>
                    {difficulty === 'all' ? 'All Levels' : difficulty}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          {/* Tab Navigation */}
          <div className="flex space-x-2">
            {[
              { id: 'all', label: 'All Projects', icon: '🚀' },
              { id: 'bookmarked', label: 'Bookmarked', icon: '🔖' },
              { id: 'in-progress', label: 'In Progress', icon: '⏳' },
              { id: 'completed', label: 'Completed', icon: '✅' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as ProjectTab)}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-orange-400 to-red-400 text-white shadow-lg'
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white bg-gray-100 dark:bg-slate-700'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Projects List */}
          <div className="lg:col-span-2 space-y-6">
            {filteredProjects.map((project) => (
              <div
                key={project.id}
                onClick={() => handleProjectSelect(project)}
                className={`bg-white dark:bg-slate-800 rounded-xl p-6 cursor-pointer transition-all duration-200 border ${
                  selectedProject?.id === project.id
                    ? 'border-orange-400 shadow-xl ring-2 ring-orange-400'
                    : 'border-gray-200 dark:border-slate-700 hover:border-orange-300 hover:shadow-lg'
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{project.title}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(project.difficulty)}`}>
                        {project.difficulty}
                      </span>
                    </div>
                    <p className="text-gray-600 dark:text-gray-300 text-sm mb-3">{project.description}</p>
                    <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400 mb-3">
                      <span>📁 {project.category}</span>
                      <span>⏱️ {project.duration}</span>
                      <span>{getTeamSizeIcon(project.teamSize)} {project.teamSize}</span>
                      {project.mentorAvailable && <span>👨‍🏫 Mentor Available</span>}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {project.technologies.slice(0, 4).map((tech, index) => (
                        <span key={index} className="px-2 py-1 bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 rounded text-xs">
                          {tech}
                        </span>
                      ))}
                      {project.technologies.length > 4 && (
                        <span className="px-2 py-1 bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 rounded text-xs">
                          +{project.technologies.length - 4} more
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleBookmarkToggle(project.id);
                    }}
                    className="ml-4 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                  >
                    <span className={project.isBookmarked ? 'text-yellow-500' : 'text-gray-400'}>
                      {project.isBookmarked ? '🔖' : '🔖'}
                    </span>
                  </button>
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
                    <span>Progress</span>
                    <span>{project.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        project.progress === 100 ? 'bg-green-500' : 'bg-orange-500'
                      }`}
                      style={{ width: `${project.progress}%` }}
                    />
                  </div>
                </div>

                {/* Status Badge */}
                {project.isCompleted && (
                  <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                    <span className="mr-1">✅</span>
                    Completed
                  </div>
                )}
                {project.isStarted && !project.isCompleted && (
                  <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                    <span className="mr-1">⏳</span>
                    In Progress
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Project Details Sidebar */}
          {selectedProject ? (
            <div className="lg:col-span-1">
              <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-slate-700 sticky top-24">
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{selectedProject.title}</h2>
                  <div className="flex items-center space-x-2 mb-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(selectedProject.difficulty)}`}>
                      {selectedProject.difficulty}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">⏱️ {selectedProject.duration}</span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">{getTeamSizeIcon(selectedProject.teamSize)} {selectedProject.teamSize}</span>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">{selectedProject.description}</p>
                </div>

                {/* Technologies */}
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Technologies</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedProject.technologies.map((tech, index) => (
                      <span key={index} className="px-3 py-1 bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 rounded-lg text-sm">
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Skills You'll Learn */}
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Skills You'll Learn</h3>
                  <div className="space-y-1">
                    {selectedProject.skills.map((skill, index) => (
                      <div key={index} className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
                        <span className="text-orange-500">→</span>
                        <span>{skill}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Prerequisites */}
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Prerequisites</h3>
                  <div className="space-y-1">
                    {selectedProject.prerequisites.map((prereq, index) => (
                      <div key={index} className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
                        <span className="text-blue-500">✓</span>
                        <span>{prereq}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Project Outcomes */}
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Project Outcomes</h3>
                  <div className="space-y-1">
                    {selectedProject.outcomes.map((outcome, index) => (
                      <div key={index} className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
                        <span className="text-green-500">🎯</span>
                        <span>{outcome}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Milestones */}
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Project Milestones</h3>
                  <div className="space-y-2">
                    {milestones
                      .filter(milestone => milestone.projectId === selectedProject.id)
                      .map((milestone) => (
                        <div key={milestone.id} className="p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">{milestone.title}</p>
                            {milestone.isCompleted && (
                              <span className="text-green-500 text-sm">✓</span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{milestone.duration}</p>
                          <p className="text-xs text-gray-600 dark:text-gray-300">{milestone.description}</p>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                  <button
                    onClick={() => handleStartProject(selectedProject.id)}
                    className="w-full px-4 py-3 bg-gradient-to-r from-orange-400 to-red-400 text-white rounded-xl font-semibold hover:shadow-lg transition-all duration-200 transform hover:scale-105"
                  >
                    {selectedProject.isStarted ? 'Continue Project' : 'Start Project'} 🚀
                  </button>
                  <button
                    onClick={() => handleBookmarkToggle(selectedProject.id)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                  >
                    {selectedProject.isBookmarked ? 'Remove Bookmark' : 'Add Bookmark'} 🔖
                  </button>
                  {selectedProject.mentorAvailable && (
                    <div className="text-center text-sm text-green-600 dark:text-green-400">
                      👨‍🏫 Mentor guidance available
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="lg:col-span-1">
              <div className="bg-white dark:bg-slate-800 rounded-xl p-8 shadow-lg border border-gray-200 dark:border-slate-700 text-center">
                <div className="w-16 h-16 bg-gray-100 dark:bg-slate-700 rounded-full flex items-center justify-center text-2xl mx-auto mb-4">
                  🚀
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Select a Project</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  Choose a capstone project to view details and start building your portfolio
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EnhancedCapstone;
