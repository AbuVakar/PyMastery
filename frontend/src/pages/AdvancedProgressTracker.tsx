import React from 'react';

const AdvancedProgressTracker: React.FC = () => {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-xl border border-gray-200 dark:border-white/5">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {[
          { label: 'Courses Completed', value: '12', icon: '🎓' },
          { label: 'Problems Solved', value: '156', icon: '✅' },
          { label: 'Current Streak', value: '15 Days', icon: '🔥' },
          { label: 'Global Rank', value: '#42', icon: '🌍' }
        ].map(stat => (
          <div key={stat.label} className="text-center">
            <div className="text-3xl mb-2">{stat.icon}</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default AdvancedProgressTracker
