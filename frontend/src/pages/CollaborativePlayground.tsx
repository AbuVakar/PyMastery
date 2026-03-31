import React from 'react'

const CollaborativePlayground: React.FC = () => {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-xl border border-gray-200 dark:border-white/5">
      <div className="flex items-center space-x-4 mb-6">
        <div className="flex -space-x-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className={`w-10 h-10 rounded-full border-2 border-white dark:border-slate-800 bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center text-xs text-white font-bold`}>U{i}</div>
          ))}
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400 font-medium">4 People Coding Now</div>
      </div>
      <div className="aspect-video bg-slate-900 rounded-xl flex items-center justify-center border border-white/10 relative overflow-hidden">
        <div className="absolute top-4 left-4 flex space-x-2">
          <div className="px-3 py-1 bg-green-500/20 text-green-400 text-xs rounded-full border border-green-500/30">main.py</div>
          <div className="px-3 py-1 bg-white/5 text-gray-400 text-xs rounded-full border border-white/10">utils.py</div>
        </div>
        <code className="text-cyan-400"># Start collaborating...</code>
      </div>
    </div>
  )
}

export default CollaborativePlayground
