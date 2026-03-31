import React, { useState } from 'react';

interface RoadmapNode {
  id: string;
  title: string;
  description: string;
  type: 'skill' | 'project' | 'milestone';
  status: 'completed' | 'in-progress' | 'locked' | 'available';
  duration: string;
  prerequisites: string[];
  resources: string[];
  icon: string;
}

interface LearningPath {
  id: string;
  name: string;
  description: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  estimatedTime: string;
  nodes: RoadmapNode[];
  progress: number;
}

const Roadmap: React.FC = () => {
  const [selectedPath, setSelectedPath] = useState<string>('frontend');
  const [selectedNode, setSelectedNode] = useState<RoadmapNode | null>(null);

  const learningPaths: LearningPath[] = [
    {
      id: 'frontend',
      name: 'Frontend Developer',
      description: 'Master modern frontend development from basics to advanced',
      difficulty: 'Beginner',
      estimatedTime: '6-8 months',
      progress: 65,
      nodes: [
        {
          id: 'html-css',
          title: 'HTML & CSS Fundamentals',
          description: 'Learn the building blocks of web development',
          type: 'skill',
          status: 'completed',
          duration: '2-3 weeks',
          prerequisites: [],
          resources: ['MDN Web Docs', 'CSS Tricks', 'FreeCodeCamp'],
          icon: '🌐'
        },
        {
          id: 'javascript-basics',
          title: 'JavaScript Essentials',
          description: 'Master JavaScript programming fundamentals',
          type: 'skill',
          status: 'completed',
          duration: '3-4 weeks',
          prerequisites: ['html-css'],
          resources: ['JavaScript.info', 'Eloquent JavaScript', 'Codecademy'],
          icon: '⚡'
        },
        {
          id: 'react-basics',
          title: 'React Fundamentals',
          description: 'Learn React components, state, and props',
          type: 'skill',
          status: 'in-progress',
          duration: '4-5 weeks',
          prerequisites: ['javascript-basics'],
          resources: ['React Docs', 'React Tutorial', 'Scrimba'],
          icon: '⚛️'
        },
        {
          id: 'first-project',
          title: 'Build Your First React App',
          description: 'Create a complete React application',
          type: 'project',
          status: 'available',
          duration: '2-3 weeks',
          prerequisites: ['react-basics'],
          resources: ['Project Templates', 'GitHub Guides', 'Deploy Tutorials'],
          icon: '🚀'
        },
        {
          id: 'advanced-react',
          title: 'Advanced React Patterns',
          description: 'Learn hooks, context, and performance optimization',
          type: 'skill',
          status: 'locked',
          duration: '4-5 weeks',
          prerequisites: ['first-project'],
          resources: ['Advanced React Patterns', 'React Performance', 'React Testing'],
          icon: '🔥'
        },
        {
          id: 'portfolio-project',
          title: 'Portfolio Project',
          description: 'Build an impressive portfolio website',
          type: 'milestone',
          status: 'locked',
          duration: '4-6 weeks',
          prerequisites: ['advanced-react'],
          resources: ['Portfolio Templates', 'Design Guidelines', 'Deployment Guides'],
          icon: '🏆'
        }
      ]
    },
    {
      id: 'backend',
      name: 'Backend Developer',
      description: 'Become a proficient backend developer',
      difficulty: 'Intermediate',
      estimatedTime: '8-10 months',
      progress: 30,
      nodes: [
        {
          id: 'node-basics',
          title: 'Node.js Fundamentals',
          description: 'Learn server-side JavaScript with Node.js',
          type: 'skill',
          status: 'completed',
          duration: '3-4 weeks',
          prerequisites: [],
          resources: ['Node.js Docs', 'Node.js Best Practices', 'Mosh Hamedani'],
          icon: '🟢'
        },
        {
          id: 'databases',
          title: 'Database Design & SQL',
          description: 'Master database concepts and SQL',
          type: 'skill',
          status: 'in-progress',
          duration: '4-5 weeks',
          prerequisites: ['node-basics'],
          resources: ['SQLBolt', 'Database Design', 'PostgreSQL Tutorial'],
          icon: '🗄️'
        },
        {
          id: 'api-design',
          title: 'RESTful API Design',
          description: 'Design and build REST APIs',
          type: 'skill',
          status: 'available',
          duration: '3-4 weeks',
          prerequisites: ['databases'],
          resources: ['REST API Guide', 'API Design Best Practices', 'Postman'],
          icon: '🔌'
        }
      ]
    },
    {
      id: 'fullstack',
      name: 'Full Stack Developer',
      description: 'Master both frontend and backend development',
      difficulty: 'Advanced',
      estimatedTime: '12-15 months',
      progress: 15,
      nodes: [
        {
          id: 'fullstack-fundamentals',
          title: 'Full Stack Foundations',
          description: 'Understand full stack architecture',
          type: 'skill',
          status: 'in-progress',
          duration: '4-5 weeks',
          prerequisites: [],
          resources: ['Full Stack Guide', 'Architecture Patterns', 'System Design'],
          icon: '🏗️'
        },
        {
          id: 'mern-stack',
          title: 'MERN Stack Project',
          description: 'Build a complete MERN application',
          type: 'project',
          status: 'locked',
          duration: '6-8 weeks',
          prerequisites: ['fullstack-fundamentals'],
          resources: ['MERN Tutorial', 'MongoDB Guide', 'Express.js Docs'],
          icon: '🔥'
        }
      ]
    }
  ];

  const currentPath = learningPaths.find(path => path.id === selectedPath);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'in-progress': return 'bg-blue-500';
      case 'available': return 'bg-yellow-500';
      case 'locked': return 'bg-gray-400';
      default: return 'bg-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return '✅';
      case 'in-progress': return '⏳';
      case 'available': return '🔓';
      case 'locked': return '🔒';
      default: return '🔒';
    }
  };

  const getNodeColor = (type: string) => {
    switch (type) {
      case 'skill': return 'from-blue-400 to-blue-600';
      case 'project': return 'from-purple-400 to-purple-600';
      case 'milestone': return 'from-orange-400 to-orange-600';
      default: return 'from-gray-400 to-gray-600';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Learning Roadmap
            </span>
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Follow structured learning paths to achieve your career goals
          </p>
        </div>

        {/* Path Selection */}
        <div className="flex justify-center mb-8">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-1 shadow-lg">
            {learningPaths.map((path) => (
              <button
                key={path.id}
                onClick={() => setSelectedPath(path.id)}
                className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                  selectedPath === path.id
                    ? 'bg-gradient-to-r from-blue-400 to-purple-400 text-white shadow-lg'
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {path.name}
              </button>
            ))}
          </div>
        </div>

        {/* Path Overview */}
        {currentPath && (
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-slate-700 mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{currentPath.name}</h2>
                <p className="text-gray-600 dark:text-gray-300">{currentPath.description}</p>
              </div>
              <div className="text-right">
                <div className="flex items-center space-x-2 mb-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    currentPath.difficulty === 'Beginner' ? 'bg-green-100 text-green-800' :
                    currentPath.difficulty === 'Intermediate' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {currentPath.difficulty}
                  </span>
                  <span className="text-gray-500 dark:text-gray-400">⏱️ {currentPath.estimatedTime}</span>
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {currentPath.nodes.filter(n => n.status === 'completed').length} / {currentPath.nodes.length} completed
                </div>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="mb-4">
              <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
                <span>Overall Progress</span>
                <span>{currentPath.progress}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-3">
                <div
                  className="h-3 rounded-full transition-all duration-300 bg-gradient-to-r from-blue-400 to-purple-400"
                  style={{ width: `${currentPath.progress}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Roadmap Visualization */}
        {currentPath && (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Roadmap Nodes */}
            <div className="lg:col-span-2">
              <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-slate-700">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Learning Journey</h3>
                
                <div className="space-y-8">
                  {currentPath.nodes.map((node, index) => (
                    <div key={node.id} className="relative">
                      {/* Connection Line */}
                      {index < currentPath.nodes.length - 1 && (
                        <div className="absolute left-6 top-12 w-0.5 h-16 bg-gray-300 dark:bg-slate-600"></div>
                      )}
                      
                      {/* Node */}
                      <div className="flex items-start space-x-4">
                        <div
                          onClick={() => setSelectedNode(node)}
                          className={`relative w-12 h-12 rounded-full bg-gradient-to-r ${getNodeColor(node.type)} flex items-center justify-center text-white cursor-pointer transform transition-all duration-200 hover:scale-110 shadow-lg`}
                        >
                          <span className="text-xl">{node.icon}</span>
                          <div className={`absolute -bottom-1 -right-1 w-4 h-4 ${getStatusColor(node.status)} rounded-full border-2 border-white dark:border-slate-800`}></div>
                        </div>
                        
                        <div className="flex-1">
                          <div
                            onClick={() => setSelectedNode(node)}
                            className={`p-4 rounded-lg border cursor-pointer transition-all duration-200 ${
                              selectedNode?.id === node.id
                                ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20'
                                : 'border-gray-200 dark:border-slate-600 hover:border-gray-300 dark:hover:border-slate-500'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-semibold text-gray-900 dark:text-white">{node.title}</h4>
                              <div className="flex items-center space-x-2">
                                <span className="text-sm text-gray-500 dark:text-gray-400">{node.duration}</span>
                                <span className="text-lg">{getStatusIcon(node.status)}</span>
                              </div>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">{node.description}</p>
                            <div className="flex items-center space-x-2">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                node.type === 'skill' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                                node.type === 'project' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' :
                                'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
                              }`}>
                                {node.type}
                              </span>
                              {node.prerequisites.length > 0 && (
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  Requires: {node.prerequisites.length} prerequisite(s)
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Node Details */}
            <div className="lg:col-span-1">
              {selectedNode ? (
                <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-slate-700 sticky top-24">
                  <div className="mb-6">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className={`w-12 h-12 rounded-full bg-gradient-to-r ${getNodeColor(selectedNode.type)} flex items-center justify-center text-white shadow-lg`}>
                        <span className="text-xl">{selectedNode.icon}</span>
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">{selectedNode.title}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          selectedNode.type === 'skill' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                          selectedNode.type === 'project' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' :
                          'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
                        }`}>
                          {selectedNode.type}
                        </span>
                      </div>
                    </div>
                    <p className="text-gray-600 dark:text-gray-300">{selectedNode.description}</p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Duration</h4>
                      <p className="text-gray-600 dark:text-gray-300">{selectedNode.duration}</p>
                    </div>

                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Status</h4>
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">{getStatusIcon(selectedNode.status)}</span>
                        <span className="text-gray-600 dark:text-gray-300 capitalize">{selectedNode.status.replace('-', ' ')}</span>
                      </div>
                    </div>

                    {selectedNode.prerequisites.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Prerequisites</h4>
                        <div className="space-y-1">
                          {selectedNode.prerequisites.map((prereq, index) => (
                            <div key={index} className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
                              <span className="text-blue-500">→</span>
                              <span>{prereq}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {selectedNode.resources.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Learning Resources</h4>
                        <div className="space-y-2">
                          {selectedNode.resources.map((resource, index) => (
                            <div key={index} className="p-2 bg-gray-50 dark:bg-slate-700 rounded text-sm text-gray-600 dark:text-gray-300">
                              📚 {resource}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="pt-4">
                      <button
                        className={`w-full px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                          selectedNode.status === 'completed'
                            ? 'bg-gray-200 text-gray-600 cursor-not-allowed'
                            : selectedNode.status === 'available'
                            ? 'bg-gradient-to-r from-blue-400 to-purple-400 text-white hover:shadow-lg'
                            : 'bg-gray-200 text-gray-600 cursor-not-allowed'
                        }`}
                        disabled={selectedNode.status !== 'available'}
                      >
                        {selectedNode.status === 'completed' ? '✅ Completed' :
                         selectedNode.status === 'in-progress' ? '⏳ In Progress' :
                         selectedNode.status === 'available' ? '🚀 Start Learning' :
                         '🔒 Locked'}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white dark:bg-slate-800 rounded-xl p-8 shadow-lg border border-gray-200 dark:border-slate-700 text-center">
                  <div className="w-16 h-16 bg-gray-100 dark:bg-slate-700 rounded-full flex items-center justify-center text-2xl mx-auto mb-4">
                    🗺️
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Select a Learning Node</h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">
                    Click on any node in the roadmap to view detailed information
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Roadmap;
