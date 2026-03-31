import React from 'react';

const CareerTracks: React.FC = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {['Web Development', 'Data Science', 'Machine Learning'].map(track => (
        <div key={track} className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-white/5 hover:scale-105 transition-transform cursor-pointer">
          <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center text-2xl mb-4">🎯</div>
          <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{track}</h4>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Comprehensive path to master Python for {track.toLowerCase()}.</p>
        </div>
      ))}
    </div>
  )
}

export default CareerTracks
