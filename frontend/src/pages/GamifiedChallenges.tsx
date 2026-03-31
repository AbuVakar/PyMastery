import React from 'react'

const GamifiedChallenges: React.FC = () => {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-xl border border-gray-200 dark:border-white/5">
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Active Challenges</h3>
        <div className="px-4 py-1 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 text-sm font-bold rounded-full border border-yellow-500/20">
          Ends in 04:22:15
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          { title: 'The Algorithmist', reward: '500 XP', icon: '⚡' },
          { title: 'Bug Hunter', reward: '300 XP', icon: '🔍' }
        ].map(challenge => (
          <div key={challenge.title} className="p-6 border border-gray-100 dark:border-white/5 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer">
            <div className="text-3xl mb-4">{challenge.icon}</div>
            <div className="font-bold text-gray-900 dark:text-white mb-1">{challenge.title}</div>
            <div className="text-sm text-green-500 font-bold">{challenge.reward}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default GamifiedChallenges
