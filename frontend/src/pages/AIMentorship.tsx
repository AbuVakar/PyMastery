import React from 'react';

const AIMentorship: React.FC = () => {
  return (
    <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-8 text-white shadow-xl">
      <div className="flex items-center space-x-4 mb-6">
        <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-2xl">🤖</div>
        <h3 className="text-2xl font-bold">Personal AI Mentor</h3>
      </div>
      <p className="text-purple-100 text-lg mb-6">Get instant help with your code, explanation of complex concepts, and personalized feedback 24/7.</p>
      <button className="px-6 py-2 bg-white text-purple-600 rounded-lg font-bold hover:bg-purple-50 transition-colors">Chat with Mentor</button>
    </div>
  )
}

export default AIMentorship
