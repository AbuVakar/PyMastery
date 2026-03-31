import React from 'react'
import PremiumHeader from './PremiumHeader'
import InteractiveCodingArena from './InteractiveCodingArena'
import CareerTracks from './CareerTracks'
import AIMentorship from './AIMentorship'
import AdvancedProgressTracker from './AdvancedProgressTracker'
import SmartLearningEngine from './SmartLearningEngine'
import CollaborativePlayground from './CollaborativePlayground'
import GamifiedChallenges from './GamifiedChallenges'

const PremiumHome: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      {/* Premium Header */}
      <PremiumHeader />

      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-50 via-purple-50 to-gray-50 dark:from-slate-800 dark:via-purple-900/20 dark:to-slate-900 py-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-6">
            Master Python with
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {" "}Industry-Standard Learning
            </span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
            Learn Python through interactive coding, real-time visualization, and personalized AI mentorship. 
            Prepare for your dream job with our comprehensive career tracks.
          </p>
          <div className="flex justify-center gap-4">
            <button className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-bold hover:shadow-lg hover:shadow-purple-500/50 transform hover:scale-105 transition-all duration-300">
              Start Learning Free
            </button>
            <button className="px-8 py-4 bg-white dark:bg-slate-800 text-gray-900 dark:text-white rounded-xl font-bold border border-gray-300 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-slate-700 transition-all duration-300">
              View Curriculum
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-12 space-y-12">
        {/* Advanced Progress Tracker */}
        <section>
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              📊 Advanced Progress Tracking
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              Monitor your learning journey with detailed analytics
            </p>
          </div>
          <AdvancedProgressTracker />
        </section>

        {/* Smart Learning Engine */}
        <section>
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              🧠 AI-Powered Learning Engine
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              Get personalized recommendations based on your learning patterns
            </p>
          </div>
          <SmartLearningEngine />
        </section>

        {/* Interactive Coding Arena */}
        <section>
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              💻 Interactive Coding Arena
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              Write code and see it come to life with real-time visualization
            </p>
          </div>
          <InteractiveCodingArena />
        </section>

        {/* Collaborative Playground */}
        <section>
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              👥 Collaborative Playground
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              Code together with friends in real-time
            </p>
          </div>
          <CollaborativePlayground />
        </section>

        {/* Career Tracks */}
        <section>
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              🎯 Career-Focused Learning Tracks
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              Pathways designed for your specific career goals
            </p>
          </div>
          <CareerTracks />
        </section>

        {/* AIMentorship */}
        <section>
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              🤖 AI Mentorship
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              Get 24/7 support from our intelligent coding assistant
            </p>
          </div>
          <AIMentorship />
        </section>

        {/* Gamified Challenges */}
        <section>
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              🎮 Gamified Challenges
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              Learn while having fun with competitive challenges
            </p>
          </div>
          <GamifiedChallenges />
        </section>
      </div>
    </div>
  )
}

export default PremiumHome
