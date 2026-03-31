import React from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const PremiumHeader: React.FC = () => {
  const { isAuthenticated, user } = useAuth()

  return (
    <div className="bg-slate-900 py-4 px-4 border-b border-white/5">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2 bg-white/5 px-3 py-1 rounded-full border border-white/10">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
            <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">Live System Status: Stable</span>
          </div>
          <div className="hidden md:flex items-center space-x-4 text-xs text-gray-500 font-medium">
            <span>2.4k+ Students Active</span>
            <span className="w-1 h-1 bg-gray-700 rounded-full"></span>
            <span>150+ New Problems Today</span>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {!isAuthenticated ? (
            <>
              <Link to="/login" className="text-sm text-gray-400 hover:text-white transition-colors">Sign In</Link>
              <Link to="/login" className="px-4 py-1.5 bg-white text-slate-900 rounded-lg text-sm font-bold hover:bg-gray-100 transition-colors">Join Premium</Link>
            </>
          ) : (
            <div className="flex items-center space-x-3">
              <span className="text-sm text-gray-400">Welcome back, <span className="text-white font-bold">{user?.name}</span></span>
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center text-white text-xs font-bold shadow-lg shadow-blue-500/20">
                PRO
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default PremiumHeader
