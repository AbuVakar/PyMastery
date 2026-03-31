import React, { useState } from 'react';

type ConceptTab = 'all' | 'bookmarked' | 'completed' | 'in-progress';

interface Concept {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  duration: string;
  prerequisites: string[];
  topics: string[];
  progress: number;
  isCompleted: boolean;
  isBookmarked: boolean;
}

interface LearningModule {
  id: string;
  conceptId: string;
  title: string;
  type: 'video' | 'article' | 'quiz' | 'exercise' | 'project';
  duration: string;
  isCompleted: boolean;
  content: string;
}

const EnhancedConcepts: React.FC = () => {
  const [selectedConcept, setSelectedConcept] = useState<Concept | null>(null);
  const [activeTab, setActiveTab] = useState<ConceptTab>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const concepts: Concept[] = [
    {
      id: '1',
      title: 'React Fundamentals',
      description: 'Master the core concepts of React including components, state, and props',
      category: 'Frontend Development',
      difficulty: 'Beginner',
      duration: '4 hours',
      prerequisites: ['HTML', 'CSS', 'JavaScript Basics'],
      topics: ['Components', 'Props', 'State', 'Hooks', 'Events', 'Lifecycle'],
      progress: 75,
      isCompleted: false,
      isBookmarked: true
    },
    {
      id: '2',
      title: 'Data Structures & Algorithms',
      description: 'Learn essential data structures and algorithms for programming interviews',
      category: 'Computer Science',
      difficulty: 'Intermediate',
      duration: '8 hours',
      prerequisites: ['Programming Basics', 'Mathematics'],
      topics: ['Arrays', 'Linked Lists', 'Trees', 'Sorting', 'Searching', 'Big O Notation'],
      progress: 30,
      isCompleted: false,
      isBookmarked: false
    },
    {
      id: '3',
      title: 'RESTful API Design',
      description: 'Design and build robust RESTful APIs with best practices',
      category: 'Backend Development',
      difficulty: 'Intermediate',
      duration: '6 hours',
      prerequisites: ['HTTP Basics', 'JSON', 'Backend Programming'],
      topics: ['REST Principles', 'HTTP Methods', 'Status Codes', 'Authentication', 'Documentation'],
      progress: 0,
      isCompleted: false,
      isBookmarked: false
    },
    {
      id: '4',
      title: 'Machine Learning Basics',
      description: 'Introduction to machine learning concepts and algorithms',
      category: 'AI/ML',
      difficulty: 'Advanced',
      duration: '12 hours',
      prerequisites: ['Python', 'Statistics', 'Linear Algebra'],
      topics: ['Supervised Learning', 'Unsupervised Learning', 'Neural Networks', 'Model Evaluation'],
      progress: 0,
      isCompleted: false,
      isBookmarked: true
    },
    {
      id: '5',
      title: 'CSS Grid & Flexbox',
      description: 'Master modern CSS layout techniques with Grid and Flexbox',
      category: 'Frontend Development',
      difficulty: 'Beginner',
      duration: '3 hours',
      prerequisites: ['CSS Basics', 'HTML'],
      topics: ['Flexbox Container', 'Grid Container', 'Responsive Design', 'Layout Patterns'],
      progress: 100,
      isCompleted: true,
      isBookmarked: false
    },
    {
      id: '6',
      title: 'Database Design Principles',
      description: 'Learn how to design efficient and scalable databases',
      category: 'Database',
      difficulty: 'Intermediate',
      duration: '5 hours',
      prerequisites: ['SQL Basics', 'Data Modeling'],
      topics: ['Normalization', 'Indexing', 'Relationships', 'Query Optimization'],
      progress: 50,
      isCompleted: false,
      isBookmarked: false
    },
    {
      id: '7',
      title: 'Git Version Control',
      description: 'Master Git for version control and collaboration',
      category: 'DevOps',
      difficulty: 'Beginner',
      duration: '2 hours',
      prerequisites: ['Command Line Basics'],
      topics: ['Git Basics', 'Branching', 'Merging', 'Remote Repositories', 'Collaboration'],
      progress: 100,
      isCompleted: true,
      isBookmarked: false
    },
    {
      id: '8',
      title: 'TypeScript Advanced',
      description: 'Advanced TypeScript concepts for large-scale applications',
      category: 'Frontend Development',
      difficulty: 'Advanced',
      duration: '7 hours',
      prerequisites: ['JavaScript', 'TypeScript Basics'],
      topics: ['Generics', 'Decorators', 'Advanced Types', 'Modules', 'Performance'],
      progress: 0,
      isCompleted: false,
      isBookmarked: true
    }
  ];

  const categories = [
    'all',
    'Frontend Development',
    'Backend Development',
    'Computer Science',
    'Database',
    'DevOps',
    'AI/ML',
    'Mobile Development'
  ];

  const learningModules: LearningModule[] = [
    {
      id: '1-1',
      conceptId: '1',
      title: 'Introduction to React',
      type: 'video',
      duration: '15 min',
      isCompleted: true,
      content: 'Learn what React is and why it\'s popular'
    },
    {
      id: '1-2',
      conceptId: '1',
      title: 'Creating Your First Component',
      type: 'article',
      duration: '10 min',
      isCompleted: true,
      content: 'Build your first React component'
    },
    {
      id: '1-3',
      conceptId: '1',
      title: 'Understanding Props',
      type: 'exercise',
      duration: '20 min',
      isCompleted: true,
      content: 'Practice passing props to components'
    },
    {
      id: '1-4',
      conceptId: '1',
      title: 'State Management Quiz',
      type: 'quiz',
      duration: '10 min',
      isCompleted: false,
      content: 'Test your understanding of React state'
    }
  ];

  const userStats = {
    totalConcepts: concepts.length,
    completedConcepts: concepts.filter((concept) => concept.isCompleted).length,
    bookmarkedConcepts: concepts.filter((concept) => concept.isBookmarked).length,
    totalLearningHours: concepts.reduce((hours, concept) => hours + parseInt(concept.duration, 10), 0),
  };

  const handleConceptSelect = (concept: Concept) => {
    setSelectedConcept(concept);
  };

  const handleBookmarkToggle = (conceptId: string) => {
    // In a real app, this would update the backend
    console.log('Toggle bookmark:', conceptId);
  };

  const handleStartLearning = (conceptId: string) => {
    console.log('Starting learning for concept:', conceptId);
    alert(`Starting learning journey for concept ID: ${conceptId}. This would navigate to the learning module.`);
    // navigate(`/learn/concept/${conceptId}`);
  };

  const filteredConcepts = concepts.filter(concept => {
    const matchesTab = 
      activeTab === 'all' ||
      (activeTab === 'bookmarked' && concept.isBookmarked) ||
      (activeTab === 'completed' && concept.isCompleted) ||
      (activeTab === 'in-progress' && !concept.isCompleted && concept.progress > 0);
    
    const matchesCategory = selectedCategory === 'all' || concept.category === selectedCategory;
    const matchesSearch = concept.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         concept.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesTab && matchesCategory && matchesSearch;
  });

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'Intermediate': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'Advanced': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video': return '🎥';
      case 'article': return '📄';
      case 'quiz': return '🧪';
      case 'exercise': return '💪';
      case 'project': return '🚀';
      default: return '📚';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              Learning Concepts
            </span>
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Master programming concepts through structured learning paths with interactive content
          </p>
        </div>

        {/* User Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Total Concepts</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{userStats.totalConcepts}</p>
              </div>
              <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900 rounded-xl flex items-center justify-center text-2xl">
                📚
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Completed</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{userStats.completedConcepts}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-xl flex items-center justify-center text-2xl">
                ✅
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Bookmarked</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{userStats.bookmarkedConcepts}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900 rounded-xl flex items-center justify-center text-2xl">
                🔖
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Learning Hours</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{userStats.totalLearningHours}h</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-xl flex items-center justify-center text-2xl">
                ⏰
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-slate-700 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search concepts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 dark:bg-slate-700 dark:text-white"
              />
            </div>
            
            {/* Category Filter */}
            <div className="lg:w-64">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 dark:bg-slate-700 dark:text-white"
              >
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category === 'all' ? 'All Categories' : category}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          {/* Tab Navigation */}
          <div className="flex space-x-2 mt-4">
            {[
              { id: 'all', label: 'All Concepts', icon: '📚' },
              { id: 'bookmarked', label: 'Bookmarked', icon: '🔖' },
              { id: 'completed', label: 'Completed', icon: '✅' },
              { id: 'in-progress', label: 'In Progress', icon: '⏳' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as ConceptTab)}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-indigo-400 to-purple-400 text-white shadow-lg'
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
          {/* Concepts List */}
          <div className="lg:col-span-2 space-y-6">
            {filteredConcepts.map((concept) => (
              <div
                key={concept.id}
                onClick={() => handleConceptSelect(concept)}
                className={`bg-white dark:bg-slate-800 rounded-xl p-6 cursor-pointer transition-all duration-200 border ${
                  selectedConcept?.id === concept.id
                    ? 'border-indigo-400 shadow-xl ring-2 ring-indigo-400'
                    : 'border-gray-200 dark:border-slate-700 hover:border-indigo-300 hover:shadow-lg'
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{concept.title}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(concept.difficulty)}`}>
                        {concept.difficulty}
                      </span>
                    </div>
                    <p className="text-gray-600 dark:text-gray-300 text-sm mb-2">{concept.description}</p>
                    <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                      <span>📁 {concept.category}</span>
                      <span>⏱️ {concept.duration}</span>
                      <span>📊 {concept.topics.length} topics</span>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleBookmarkToggle(concept.id);
                    }}
                    className="ml-4 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                  >
                    <span className={concept.isBookmarked ? 'text-yellow-500' : 'text-gray-400'}>
                      {concept.isBookmarked ? '🔖' : '🔖'}
                    </span>
                  </button>
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
                    <span>Progress</span>
                    <span>{concept.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        concept.progress === 100 ? 'bg-green-500' : 'bg-indigo-500'
                      }`}
                      style={{ width: `${concept.progress}%` }}
                    />
                  </div>
                </div>

                {/* Topics Preview */}
                <div className="flex flex-wrap gap-1">
                  {concept.topics.slice(0, 3).map((topic, index) => (
                    <span key={index} className="px-2 py-1 bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 rounded text-xs">
                      {topic}
                    </span>
                  ))}
                  {concept.topics.length > 3 && (
                    <span className="px-2 py-1 bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 rounded text-xs">
                      +{concept.topics.length - 3} more
                    </span>
                  )}
                </div>

                {/* Status Badge */}
                {concept.isCompleted && (
                  <div className="mt-3 inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                    <span className="mr-1">✅</span>
                    Completed
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Concept Details Sidebar */}
          {selectedConcept ? (
            <div className="lg:col-span-1">
              <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-slate-700 sticky top-24">
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{selectedConcept.title}</h2>
                  <div className="flex items-center space-x-2 mb-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(selectedConcept.difficulty)}`}>
                      {selectedConcept.difficulty}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">⏱️ {selectedConcept.duration}</span>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">{selectedConcept.description}</p>
                </div>

                {/* Prerequisites */}
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Prerequisites</h3>
                  <div className="space-y-1">
                    {selectedConcept.prerequisites.map((prereq, index) => (
                      <div key={index} className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
                        <span className="text-green-500">✓</span>
                        <span>{prereq}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Topics */}
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Topics Covered</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedConcept.topics.map((topic, index) => (
                      <span key={index} className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 rounded-lg text-sm">
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Learning Modules */}
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Learning Modules</h3>
                  <div className="space-y-2">
                    {learningModules
                      .filter(module => module.conceptId === selectedConcept.id)
                      .map((module) => (
                        <div key={module.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <span className="text-lg">{getTypeIcon(module.type)}</span>
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">{module.title}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">{module.duration}</p>
                            </div>
                          </div>
                          {module.isCompleted && (
                            <span className="text-green-500 text-sm">✓</span>
                          )}
                        </div>
                      ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                  <button
                    onClick={() => handleStartLearning(selectedConcept.id)}
                    className="w-full px-4 py-3 bg-gradient-to-r from-indigo-400 to-purple-400 text-white rounded-xl font-semibold hover:shadow-lg transition-all duration-200 transform hover:scale-105"
                  >
                    {selectedConcept.progress > 0 ? 'Continue Learning' : 'Start Learning'} 🚀
                  </button>
                  <button
                    onClick={() => handleBookmarkToggle(selectedConcept.id)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                  >
                    {selectedConcept.isBookmarked ? 'Remove Bookmark' : 'Add Bookmark'} 🔖
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="lg:col-span-1">
              <div className="bg-white dark:bg-slate-800 rounded-xl p-8 shadow-lg border border-gray-200 dark:border-slate-700 text-center">
                <div className="w-16 h-16 bg-gray-100 dark:bg-slate-700 rounded-full flex items-center justify-center text-2xl mx-auto mb-4">
                  📚
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Select a Concept</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  Choose a concept from the list to view details and start learning
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EnhancedConcepts;
