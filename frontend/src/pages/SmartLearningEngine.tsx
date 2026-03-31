import React from 'react'

const SmartLearningEngine: React.FC = () => {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-xl border border-gray-200 dark:border-white/5">
      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Next Recommended Steps</h3>
      <div className="space-y-4">
        {[
          { title: 'Mastering List Comprehensions', difficulty: 'Intermediate', points: '+50 XP' },
          { title: 'Introduction to Asyncio', difficulty: 'Advanced', points: '+100 XP' },
          { title: 'Python Decorators Deep Dive', difficulty: 'Advanced', points: '+80 XP' }
        ].map(task => (
          <div key={task.title} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-900/50 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors cursor-pointer">
            <div>
              <div className="font-bold text-gray-900 dark:text-white">{task.title}</div>
              <div className="text-xs text-gray-500">{task.difficulty}</div>
            </div>
            <div className="text-cyan-500 font-bold">{task.points}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default SmartLearningEngine
