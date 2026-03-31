import React, { useState } from 'react';

type CompanyTab = 'available' | 'scheduled' | 'completed' | 'companies';

interface MockInterview {
  id: string;
  company: string;
  role: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  duration: string;
  questions: number;
  topics: string[];
  scheduledDate?: string;
  status: 'available' | 'scheduled' | 'completed' | 'locked';
  rating?: number;
  feedback?: string;
  score?: number;
}

interface CompanyInfo {
  name: string;
  logo: string;
  description: string;
  industry: string;
  headquarters: string;
  employees: string;
  founded: string;
}

const CompanyMocks: React.FC = () => {
  const [selectedCompany, setSelectedCompany] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [selectedMock, setSelectedMock] = useState<MockInterview | null>(null);
  const [activeTab, setActiveTab] = useState<CompanyTab>('available');

  const mockInterviews: MockInterview[] = [
    {
      id: '1',
      company: 'Google',
      role: 'Frontend Developer',
      difficulty: 'Hard',
      duration: '60 minutes',
      questions: 5,
      topics: ['React', 'Algorithms', 'System Design', 'CSS', 'JavaScript'],
      status: 'available',
      rating: 4.8,
      score: 85
    },
    {
      id: '2',
      company: 'Microsoft',
      role: 'Full Stack Developer',
      difficulty: 'Medium',
      duration: '45 minutes',
      questions: 4,
      topics: ['C#', 'ASP.NET', 'SQL', 'React', 'Azure'],
      status: 'scheduled',
      scheduledDate: '2024-03-25 14:00',
      rating: 4.6
    },
    {
      id: '3',
      company: 'Amazon',
      role: 'Backend Developer',
      difficulty: 'Hard',
      duration: '90 minutes',
      questions: 6,
      topics: ['Java', 'AWS', 'Microservices', 'Databases', 'System Design'],
      status: 'completed',
      rating: 4.7,
      feedback: 'Strong problem-solving skills, good system design understanding',
      score: 92
    },
    {
      id: '4',
      company: 'Meta',
      role: 'React Developer',
      difficulty: 'Hard',
      duration: '75 minutes',
      questions: 5,
      topics: ['React', 'Redux', 'GraphQL', 'Performance', 'Testing'],
      status: 'available',
      rating: 4.9
    },
    {
      id: '5',
      company: 'Apple',
      role: 'iOS Developer',
      difficulty: 'Hard',
      duration: '60 minutes',
      questions: 5,
      topics: ['Swift', 'iOS', 'UIKit', 'Core Data', 'Memory Management'],
      status: 'locked',
      rating: 4.5
    },
    {
      id: '6',
      company: 'Netflix',
      role: 'Frontend Developer',
      difficulty: 'Medium',
      duration: '45 minutes',
      questions: 4,
      topics: ['JavaScript', 'React', 'Performance', 'Streaming', 'CDN'],
      status: 'available',
      rating: 4.4
    },
    {
      id: '7',
      company: 'Tesla',
      role: 'Embedded Systems Engineer',
      difficulty: 'Hard',
      duration: '90 minutes',
      questions: 6,
      topics: ['C++', 'Embedded Systems', 'RTOS', 'Hardware', 'Automotive'],
      status: 'available',
      rating: 4.3
    },
    {
      id: '8',
      company: 'Spotify',
      role: 'Backend Developer',
      difficulty: 'Medium',
      duration: '60 minutes',
      questions: 5,
      topics: ['Node.js', 'Music Streaming', 'API Design', 'Databases', 'Scalability'],
      status: 'completed',
      rating: 4.5,
      feedback: 'Good API design skills, needs improvement in scalability concepts',
      score: 78
    }
  ];

  const companies: CompanyInfo[] = [
    {
      name: 'Google',
      logo: '🔍',
      description: 'Technology company specializing in Internet-related services and products',
      industry: 'Technology',
      headquarters: 'Mountain View, CA',
      employees: '150,000+',
      founded: '1998'
    },
    {
      name: 'Microsoft',
      logo: '🪟',
      description: 'Multinational technology company developing software, services, and devices',
      industry: 'Technology',
      headquarters: 'Redmond, WA',
      employees: '190,000+',
      founded: '1975'
    },
    {
      name: 'Amazon',
      logo: '📦',
      description: 'E-commerce and cloud computing company',
      industry: 'E-commerce/Cloud',
      headquarters: 'Seattle, WA',
      employees: '1,600,000+',
      founded: '1994'
    },
    {
      name: 'Meta',
      logo: '📘',
      description: 'Social media and technology company',
      industry: 'Social Media/Technology',
      headquarters: 'Menlo Park, CA',
      employees: '80,000+',
      founded: '2004'
    },
    {
      name: 'Apple',
      logo: '🍎',
      description: 'Technology company designing consumer electronics and software',
      industry: 'Technology',
      headquarters: 'Cupertino, CA',
      employees: '150,000+',
      founded: '1976'
    },
    {
      name: 'Netflix',
      logo: '📺',
      description: 'Streaming entertainment service company',
      industry: 'Entertainment',
      headquarters: 'Los Gatos, CA',
      employees: '12,000+',
      founded: '1997'
    },
    {
      name: 'Tesla',
      logo: '🚗',
      description: 'Electric vehicle and clean energy company',
      industry: 'Automotive/Energy',
      headquarters: 'Austin, TX',
      employees: '140,000+',
      founded: '2003'
    },
    {
      name: 'Spotify',
      logo: '🎵',
      description: 'Audio streaming and media services provider',
      industry: 'Music/Technology',
      headquarters: 'Stockholm, Sweden',
      employees: '9,000+',
      founded: '2006'
    }
  ];

  const filteredMocks = mockInterviews.filter(mock => {
    const matchesCompany = selectedCompany === 'all' || mock.company === selectedCompany;
    const matchesDifficulty = selectedDifficulty === 'all' || mock.difficulty === selectedDifficulty;
    const matchesTab = 
      activeTab === 'available' ? mock.status === 'available' :
      activeTab === 'scheduled' ? mock.status === 'scheduled' :
      activeTab === 'completed' ? mock.status === 'completed' :
      true;
    
    return matchesCompany && matchesDifficulty && matchesTab;
  });

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'Medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'Hard': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'text-blue-600';
      case 'scheduled': return 'text-orange-600';
      case 'completed': return 'text-green-600';
      case 'locked': return 'text-gray-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'available': return '🔓';
      case 'scheduled': return '📅';
      case 'completed': return '✅';
      case 'locked': return '🔒';
      default: return '🔒';
    }
  };

  const handleStartMock = (mockId: string) => {
    console.log('Starting mock:', mockId);
    alert(`Starting mock interview for ${mockId}. This would navigate to the interview interface.`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Company Mock Interviews
            </span>
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Practice with real interview questions from top tech companies
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-8">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-1 shadow-lg">
            {[
              { id: 'available', label: 'Available', icon: '🔓' },
              { id: 'scheduled', label: 'Scheduled', icon: '📅' },
              { id: 'completed', label: 'Completed', icon: '✅' },
              { id: 'companies', label: 'Companies', icon: '🏢' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as CompanyTab)}
                className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-purple-400 to-pink-400 text-white shadow-lg'
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Filters */}
        {activeTab !== 'companies' && (
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-slate-700 mb-8">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Company</label>
                <select
                  value={selectedCompany}
                  onChange={(e) => setSelectedCompany(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-purple-400 dark:bg-slate-700 dark:text-white"
                >
                  <option value="all">All Companies</option>
                  {companies.map(company => (
                    <option key={company.name} value={company.name}>{company.name}</option>
                  ))}
                </select>
              </div>
              
              <div className="lg:w-48">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Difficulty</label>
                <select
                  value={selectedDifficulty}
                  onChange={(e) => setSelectedDifficulty(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-purple-400 dark:bg-slate-700 dark:text-white"
                >
                  <option value="all">All Levels</option>
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Mock Interviews List */}
        {activeTab !== 'companies' && (
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              {filteredMocks.map((mock) => (
                <div
                  key={mock.id}
                  onClick={() => setSelectedMock(mock)}
                  className={`bg-white dark:bg-slate-800 rounded-xl p-6 cursor-pointer transition-all duration-200 border ${
                    selectedMock?.id === mock.id
                      ? 'border-purple-400 shadow-xl ring-2 ring-purple-400'
                      : 'border-gray-200 dark:border-slate-700 hover:border-purple-300 hover:shadow-lg'
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{mock.company}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(mock.difficulty)}`}>
                          {mock.difficulty}
                        </span>
                        <span className={`text-sm ${getStatusColor(mock.status)}`}>
                          {getStatusIcon(mock.status)}
                        </span>
                      </div>
                      <p className="text-gray-600 dark:text-gray-300 mb-2">{mock.role}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                        <span>⏱️ {mock.duration}</span>
                        <span>📝 {mock.questions} questions</span>
                        {mock.rating && <span>⭐ {mock.rating}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {mock.topics.slice(0, 3).map((topic, index) => (
                      <span key={index} className="px-3 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded-lg text-sm">
                        {topic}
                      </span>
                    ))}
                    {mock.topics.length > 3 && (
                      <span className="px-3 py-1 bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 rounded-lg text-sm">
                        +{mock.topics.length - 3} more
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      {mock.scheduledDate && (
                        <p className="text-sm text-orange-600 dark:text-orange-400">
                          📅 Scheduled: {mock.scheduledDate}
                        </p>
                      )}
                      {mock.score && (
                        <p className="text-sm text-green-600 dark:text-green-400">
                          🎯 Score: {mock.score}%
                        </p>
                      )}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (mock.status === 'available') {
                          handleStartMock(mock.id);
                        }
                      }}
                      className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                        mock.status === 'available'
                          ? 'bg-gradient-to-r from-purple-400 to-pink-400 text-white hover:shadow-lg'
                          : mock.status === 'scheduled'
                          ? 'bg-gray-200 text-gray-600 cursor-not-allowed'
                          : 'bg-gray-200 text-gray-600 cursor-not-allowed'
                      }`}
                      disabled={mock.status !== 'available'}
                    >
                      {mock.status === 'available' ? 'Start Interview' :
                       mock.status === 'scheduled' ? 'Scheduled' :
                       mock.status === 'completed' ? 'Completed' : 'Locked'}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Selected Mock Details */}
            <div className="lg:col-span-1">
              {selectedMock ? (
                <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-slate-700 sticky top-24">
                  <div className="mb-6">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{selectedMock.company}</h3>
                    <p className="text-gray-600 dark:text-gray-300 mb-4">{selectedMock.role}</p>
                    <div className="flex items-center space-x-2 mb-4">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getDifficultyColor(selectedMock.difficulty)}`}>
                        {selectedMock.difficulty}
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">⏱️ {selectedMock.duration}</span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">📝 {selectedMock.questions} questions</span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Topics Covered</h4>
                      <div className="space-y-1">
                        {selectedMock.topics.map((topic, index) => (
                          <div key={index} className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
                            <span className="text-purple-500">•</span>
                            <span>{topic}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {selectedMock.rating && (
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Average Rating</h4>
                        <div className="flex items-center space-x-2">
                          <span className="text-yellow-500">⭐⭐⭐⭐⭐</span>
                          <span className="text-gray-600 dark:text-gray-300">{selectedMock.rating}/5.0</span>
                        </div>
                      </div>
                    )}

                    {selectedMock.feedback && (
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Previous Feedback</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-300 italic">{selectedMock.feedback}</p>
                      </div>
                    )}

                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Status</h4>
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">{getStatusIcon(selectedMock.status)}</span>
                        <span className="text-gray-600 dark:text-gray-300 capitalize">{selectedMock.status}</span>
                      </div>
                    </div>

                    <div className="pt-4">
                      <button
                        onClick={() => {
                          if (selectedMock.status === 'available') {
                            handleStartMock(selectedMock.id);
                          }
                        }}
                        className={`w-full px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                          selectedMock.status === 'available'
                            ? 'bg-gradient-to-r from-purple-400 to-pink-400 text-white hover:shadow-lg'
                            : 'bg-gray-200 text-gray-600 cursor-not-allowed'
                        }`}
                        disabled={selectedMock.status !== 'available'}
                      >
                        {selectedMock.status === 'available' ? '🚀 Start Interview' :
                         selectedMock.status === 'scheduled' ? '📅 Interview Scheduled' :
                         selectedMock.status === 'completed' ? '✅ Interview Completed' : '🔒 Locked'}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white dark:bg-slate-800 rounded-xl p-8 shadow-lg border border-gray-200 dark:border-slate-700 text-center">
                  <div className="w-16 h-16 bg-gray-100 dark:bg-slate-700 rounded-full flex items-center justify-center text-2xl mx-auto mb-4">
                    🎯
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Select an Interview</h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">
                    Choose a mock interview to view detailed information
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Companies View */}
        {activeTab === 'companies' && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {companies.map((company) => (
              <div key={company.name} className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-slate-700">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-pink-400 rounded-xl flex items-center justify-center text-2xl">
                    {company.logo}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{company.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{company.industry}</p>
                  </div>
                </div>
                
                <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">{company.description}</p>
                
                <div className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
                  <div className="flex justify-between">
                    <span>📍 Headquarters:</span>
                    <span>{company.headquarters}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>👥 Employees:</span>
                    <span>{company.employees}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>📅 Founded:</span>
                    <span>{company.founded}</span>
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-slate-600">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-300">
                      {mockInterviews.filter(m => m.company === company.name).length} mock interviews
                    </span>
                    <button
                      onClick={() => {
                        setSelectedCompany(company.name);
                        setActiveTab('available');
                      }}
                      className="text-purple-600 hover:text-purple-700 text-sm font-medium"
                    >
                      View Interviews →
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CompanyMocks;
