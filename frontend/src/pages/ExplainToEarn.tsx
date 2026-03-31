import React, { useState } from 'react';

interface Explanation {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  points: number;
  completed: boolean;
  submittedAt?: string;
  feedback?: string;
  earnings?: number;
}

interface ExplanationRequest {
  topic: string;
  explanation: string;
  targetAudience: string;
  complexity: 'Simple' | 'Moderate' | 'Complex';
  examples: string[];
}

const ExplainToEarn: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'explore' | 'create' | 'my-explanations'>('explore');
  const [selectedExplanation, setSelectedExplanation] = useState<Explanation | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userStats, setUserStats] = useState({
    totalEarnings: 0,
    explanationsCompleted: 0,
    averageRating: 0,
    streak: 0
  });

  const [explanationRequest, setExplanationRequest] = useState<ExplanationRequest>({
    topic: '',
    explanation: '',
    targetAudience: 'Beginner',
    complexity: 'Simple',
    examples: ['', '', '']
  });

  const availableExplanations: Explanation[] = [
    {
      id: '1',
      title: 'Explain React Hooks',
      description: 'Explain React Hooks in simple terms for beginners',
      category: 'Frontend Development',
      difficulty: 'Intermediate',
      points: 50,
      completed: false
    },
    {
      id: '2',
      title: 'What is API?',
      description: 'Explain what an API is using a simple analogy',
      category: 'Backend Development',
      difficulty: 'Beginner',
      points: 30,
      completed: false
    },
    {
      id: '3',
      title: 'Database Indexing',
      description: 'Explain database indexing with real-world examples',
      category: 'Database',
      difficulty: 'Advanced',
      points: 80,
      completed: false
    },
    {
      id: '4',
      title: 'CSS Grid vs Flexbox',
      description: 'Compare CSS Grid and Flexbox with practical examples',
      category: 'Frontend Development',
      difficulty: 'Intermediate',
      points: 45,
      completed: false
    },
    {
      id: '5',
      title: 'Async/Await in JavaScript',
      description: 'Explain async/await with cooking analogy',
      category: 'JavaScript',
      difficulty: 'Intermediate',
      points: 40,
      completed: false
    },
    {
      id: '6',
      title: 'REST vs GraphQL',
      description: 'Explain the differences between REST and GraphQL',
      category: 'Backend Development',
      difficulty: 'Advanced',
      points: 70,
      completed: false
    }
  ];

  const targetAudiences = [
    'Complete Beginner',
    'Some Programming Knowledge',
    'Experienced Developer',
    'Technical Manager',
    'Student'
  ];

  const handleExampleChange = (index: number, value: string) => {
    setExplanationRequest(prev => ({
      ...prev,
      examples: prev.examples.map((example, i) => i === index ? value : example)
    }));
  };

  const addExample = () => {
    setExplanationRequest(prev => ({
      ...prev,
      examples: [...prev.examples, '']
    }));
  };

  const removeExample = (index: number) => {
    setExplanationRequest(prev => ({
      ...prev,
      examples: prev.examples.filter((_, i) => i !== index)
    }));
  };

  const handleSubmitExplanation = async () => {
    if (!explanationRequest.topic || !explanationRequest.explanation) {
      alert('Please fill in the topic and explanation');
      return;
    }

    if (explanationRequest.explanation.length < 100) {
      alert('Explanation must be at least 100 characters long');
      return;
    }

    const validExamples = explanationRequest.examples.filter(ex => ex.trim().length > 0);
    if (validExamples.length < 3) {
      alert('Please provide at least 3 examples');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const earnedPoints = Math.floor(Math.random() * 50) + 20;
      
      setUserStats(prev => ({
        ...prev,
        totalEarnings: prev.totalEarnings + earnedPoints,
        explanationsCompleted: prev.explanationsCompleted + 1
      }));

      alert(`Explanation submitted successfully! You earned ${earnedPoints} points.`);
      
      // Reset form
      setExplanationRequest({
        topic: '',
        explanation: '',
        targetAudience: 'Beginner',
        complexity: 'Simple',
        examples: ['', '', '']
      });
      
      setActiveTab('my-explanations');
    } catch (error) {
      console.error('Error submitting explanation:', error);
      alert('Failed to submit explanation. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExplanationSelect = (explanation: Explanation) => {
    setSelectedExplanation(explanation);
  };

  const handleStartExplanation = () => {
    if (selectedExplanation) {
      setExplanationRequest(prev => ({
        ...prev,
        topic: selectedExplanation.title
      }));
      setActiveTab('create');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            <span className="bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
              Explain to Earn
            </span>
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Share your knowledge, explain complex concepts simply, and earn rewards for helping others learn
          </p>
        </div>

        {/* User Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Total Earnings</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{userStats.totalEarnings} pts</p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-xl flex items-center justify-center text-2xl">
                💰
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Explanations</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{userStats.explanationsCompleted}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-xl flex items-center justify-center text-2xl">
                📝
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Average Rating</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{userStats.averageRating.toFixed(1)}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900 rounded-xl flex items-center justify-center text-2xl">
                ⭐
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Streak</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{userStats.streak} days</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-xl flex items-center justify-center text-2xl">
                🔥
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-8">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-1 shadow-lg">
            <button
              onClick={() => setActiveTab('explore')}
              className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                activeTab === 'explore'
                  ? 'bg-gradient-to-r from-green-400 to-blue-400 text-white shadow-lg'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              🔍 Explore Topics
            </button>
            <button
              onClick={() => setActiveTab('create')}
              className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                activeTab === 'create'
                  ? 'bg-gradient-to-r from-green-400 to-blue-400 text-white shadow-lg'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              ✍️ Create Explanation
            </button>
            <button
              onClick={() => setActiveTab('my-explanations')}
              className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                activeTab === 'my-explanations'
                  ? 'bg-gradient-to-r from-green-400 to-blue-400 text-white shadow-lg'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              📚 My Explanations
            </button>
          </div>
        </div>

        {/* Explore Topics Tab */}
        {activeTab === 'explore' && (
          <div className="space-y-8">
            {/* Selected Topic Detail */}
            {selectedExplanation && (
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-slate-700">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{selectedExplanation.title}</h2>
                    <p className="text-gray-600 dark:text-gray-300">{selectedExplanation.description}</p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        selectedExplanation.difficulty === 'Beginner' ? 'bg-green-100 text-green-800' :
                        selectedExplanation.difficulty === 'Intermediate' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {selectedExplanation.difficulty}
                      </span>
                      <span className="text-gray-500 dark:text-gray-400">🏆 {selectedExplanation.points} pts</span>
                    </div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">{selectedExplanation.category}</span>
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-slate-700 rounded-xl p-6 mb-6">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3">What makes a great explanation:</h3>
                  <ul className="space-y-2 text-gray-600 dark:text-gray-300">
                    <li className="flex items-center space-x-2">
                      <span className="text-green-500">✓</span>
                      <span>Use simple, clear language</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <span className="text-green-500">✓</span>
                      <span>Include relatable analogies</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <span className="text-green-500">✓</span>
                      <span>Provide concrete examples</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <span className="text-green-500">✓</span>
                      <span>Structure logically</span>
                    </li>
                  </ul>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={handleStartExplanation}
                    className="px-8 py-3 bg-gradient-to-r from-green-400 to-blue-400 text-white rounded-xl font-semibold hover:shadow-lg transition-all duration-200 transform hover:scale-105"
                  >
                    Start Explaining ✍️
                  </button>
                </div>
              </div>
            )}

            {/* Topics Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {availableExplanations.map((explanation) => (
                <div
                  key={explanation.id}
                  onClick={() => handleExplanationSelect(explanation)}
                  className={`bg-white dark:bg-slate-800 rounded-xl p-6 cursor-pointer transition-all duration-200 border ${
                    selectedExplanation?.id === explanation.id
                      ? 'border-green-400 shadow-xl ring-2 ring-green-400'
                      : 'border-gray-200 dark:border-slate-700 hover:border-green-300 hover:shadow-lg'
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-gray-500 dark:text-gray-400">{explanation.category}</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      explanation.difficulty === 'Beginner' ? 'bg-green-100 text-green-700' :
                      explanation.difficulty === 'Intermediate' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {explanation.difficulty}
                    </span>
                  </div>
                  
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{explanation.title}</h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">{explanation.description}</p>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-green-600 dark:text-green-400">🏆 {explanation.points} pts</span>
                    {explanation.completed && (
                      <span className="text-green-500 text-sm">✓ Completed</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Create Explanation Tab */}
        {activeTab === 'create' && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-slate-700">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Create Your Explanation</h2>
            
            <div className="space-y-6">
              {/* Topic */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Topic *
                </label>
                <input
                  type="text"
                  value={explanationRequest.topic}
                  onChange={(e) => setExplanationRequest(prev => ({ ...prev, topic: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-green-400 focus:border-green-400 dark:bg-slate-700 dark:text-white"
                  placeholder="What are you explaining?"
                />
              </div>

              {/* Target Audience */}
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Target Audience
                  </label>
                  <select
                    value={explanationRequest.targetAudience}
                    onChange={(e) => setExplanationRequest(prev => ({ ...prev, targetAudience: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-green-400 focus:border-green-400 dark:bg-slate-700 dark:text-white"
                  >
                    {targetAudiences.map(audience => (
                      <option key={audience} value={audience}>{audience}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Complexity
                  </label>
                  <select
                    value={explanationRequest.complexity}
                    onChange={(e) => setExplanationRequest(prev => ({
                      ...prev,
                      complexity: e.target.value as ExplanationRequest['complexity']
                    }))}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-green-400 focus:border-green-400 dark:bg-slate-700 dark:text-white"
                  >
                    <option value="Simple">Simple</option>
                    <option value="Moderate">Moderate</option>
                    <option value="Complex">Complex</option>
                  </select>
                </div>
              </div>

              {/* Explanation */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Your Explanation *
                </label>
                <textarea
                  value={explanationRequest.explanation}
                  onChange={(e) => setExplanationRequest(prev => ({ ...prev, explanation: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-green-400 focus:border-green-400 dark:bg-slate-700 dark:text-white"
                  rows={8}
                  placeholder="Explain the concept in simple terms. Use analogies, examples, and clear language..."
                />
                <div className="mt-2 flex justify-between text-sm text-gray-500 dark:text-gray-400">
                  <span>{explanationRequest.explanation.length} characters</span>
                  <span className={explanationRequest.explanation.length < 100 ? 'text-red-400' : 'text-green-400'}>
                    {explanationRequest.explanation.length < 100 ? 'Minimum 100 characters required' : '✓ Minimum met'}
                  </span>
                </div>
              </div>

              {/* Examples */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Examples (at least 3)
                </label>
                {explanationRequest.examples.map((example, index) => (
                  <div key={index} className="flex space-x-2 mb-2">
                    <input
                      type="text"
                      value={example}
                      onChange={(e) => handleExampleChange(index, e.target.value)}
                      className="flex-1 px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-green-400 focus:border-green-400 dark:bg-slate-700 dark:text-white"
                      placeholder={`Example ${index + 1}`}
                    />
                    {explanationRequest.examples.length > 3 && (
                      <button
                        onClick={() => removeExample(index)}
                        className="px-3 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
                <button
                  onClick={addExample}
                  className="px-4 py-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200"
                >
                  + Add Example
                </button>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end">
                <button
                  onClick={handleSubmitExplanation}
                  disabled={isSubmitting || !explanationRequest.topic || !explanationRequest.explanation || explanationRequest.explanation.length < 100}
                  className="px-8 py-3 bg-gradient-to-r from-green-400 to-blue-400 text-white rounded-xl font-semibold hover:shadow-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Explanation 🚀'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* My Explanations Tab */}
        {activeTab === 'my-explanations' && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-slate-700">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">My Explanations</h2>
            
            {userStats.explanationsCompleted === 0 ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-gray-100 dark:bg-slate-700 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">
                  📝
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No explanations yet</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-6">Start explaining concepts to earn points and help others learn!</p>
                <button
                  onClick={() => setActiveTab('explore')}
                  className="px-6 py-3 bg-gradient-to-r from-green-400 to-blue-400 text-white rounded-xl font-semibold hover:shadow-lg transition-all duration-200"
                >
                  Explore Topics 🔍
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Placeholder for user's explanations */}
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  Your completed explanations will appear here...
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ExplainToEarn;
