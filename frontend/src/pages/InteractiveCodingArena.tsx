import React from 'react'

const InteractiveCodingArena: React.FC = () => {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-xl border border-gray-200 dark:border-white/5">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Interactive Coding Arena</h3>
          <p className="text-gray-500 dark:text-gray-400">Write, execute, and visualize Python code in real-time.</p>
        </div>
        <div className="flex space-x-2">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
        </div>
      </div>
      <div className="h-64 bg-slate-900 rounded-xl flex items-center justify-center border border-white/10">
        <code className="text-cyan-400">print("Welcome to PyMastery!")</code>
      </div>
    </div>
  )
}

export default InteractiveCodingArena
