import React from 'react'

const CourseStructure: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 text-center">Course Structure</h2>
      <div className="space-y-6">
        {[
          { title: 'Python Fundamentals', modules: 8, status: 'Completed' },
          { title: 'Data Structures & Algorithms', modules: 12, status: 'In Progress' },
          { title: 'Web Development with FastAPI', modules: 10, status: 'Locked' },
          { title: 'System Design Patterns', modules: 6, status: 'Locked' }
        ].map((level, index) => (
          <div key={level.title} className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-gray-200 dark:border-white/5 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">{index + 1}</div>
              <div>
                <h4 className="font-bold text-gray-900 dark:text-white">{level.title}</h4>
                <p className="text-sm text-gray-500">{level.modules} Modules</p>
              </div>
            </div>
            <div className={`px-4 py-1 rounded-full text-xs font-bold ${
              level.status === 'Completed' ? 'bg-green-100 text-green-600' :
              level.status === 'In Progress' ? 'bg-blue-100 text-blue-600' :
              'bg-gray-100 text-gray-400'
            }`}>
              {level.status}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default CourseStructure
