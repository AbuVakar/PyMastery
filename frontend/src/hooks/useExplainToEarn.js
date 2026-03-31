import { useState, useEffect } from 'react'
import { buildApiUrl } from '../utils/apiBase'

function useExplainToEarn() {
  const [explanations, setExplanations] = useState([])
  const [currentExplanation, setCurrentExplanation] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [feedback, setFeedback] = useState(null)
  const [credits, setCredits] = useState(0)
  const [leaderboard, setLeaderboard] = useState([])
  const [badges, setBadges] = useState([])
  const [streak, setStreak] = useState(0)
  const [level, setLevel] = useState(1)
  const [xp, setXp] = useState(0)

  useEffect(() => {
    loadUserProgress()
    loadLeaderboard()
    loadBadges()
  }, [])

  const loadUserProgress = async () => {
    try {
      const response = await fetch(buildApiUrl('/explain-to-earn/progress'), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (response.ok) {
        const progress = await response.json()
        setCredits(progress.credits || 0)
        setStreak(progress.streak || 0)
        setLevel(progress.level || 1)
        setXp(progress.xp || 0)
        setExplanations(progress.explanations || [])
      }
    } catch (error) {
      console.error('Error loading progress:', error)
    }
  }

  const loadLeaderboard = async () => {
    try {
      const response = await fetch(buildApiUrl('/explain-to-earn/leaderboard'))
      
      if (response.ok) {
        const data = await response.json()
        setLeaderboard(data.leaderboard || [])
      }
    } catch (error) {
      console.error('Error loading leaderboard:', error)
    }
  }

  const loadBadges = async () => {
    try {
      const response = await fetch(buildApiUrl('/explain-to-earn/badges'), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setBadges(data.badges || [])
      }
    } catch (error) {
      console.error('Error loading badges:', error)
    }
  }

  const submitExplanation = async (problemId, code, explanation, context = {}) => {
    if (!explanation.trim()) {
      throw new Error('Explanation cannot be empty')
    }

    if (explanation.length < 50) {
      throw new Error('Explanation must be at least 50 characters')
    }

    setIsSubmitting(true)
    setFeedback(null)

    try {
      const response = await fetch(buildApiUrl('/explain-to-earn/submit'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          problemId,
          code,
          explanation,
          context: {
            ...context,
            timestamp: new Date().toISOString(),
            language: 'python',
            difficulty: context.difficulty || 'medium'
          }
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to submit explanation')
      }

      const result = await response.json()
      
      // Update user progress
      setCredits(prev => prev + result.creditsEarned)
      setXp(prev => prev + result.xpEarned)
      setLevel(result.newLevel || level)
      setStreak(result.newStreak || streak)

      // Add to explanations history
      const newExplanation = {
        id: result.explanationId,
        problemId,
        explanation,
        creditsEarned: result.creditsEarned,
        xpEarned: result.xpEarned,
        feedback: result.feedback,
        timestamp: new Date().toISOString(),
        status: 'approved'
      }
      setExplanations(prev => [newExplanation, ...prev])

      // Check for new badges
      if (result.newBadges) {
        setBadges(prev => [...prev, ...result.newBadges])
      }

      setFeedback({
        type: 'success',
        message: `Great explanation! You earned ${result.creditsEarned} credits and ${result.xpEarned} XP!`,
        details: result.feedback
      })

      return result

    } catch (error) {
      setFeedback({
        type: 'error',
        message: error.message
      })
      throw error
    } finally {
      setIsSubmitting(false)
    }
  }

  const evaluateExplanation = async (explanation) => {
    try {
      const response = await fetch(buildApiUrl('/explain-to-earn/evaluate'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          explanation,
          evaluationCriteria: [
            'clarity',
            'accuracy',
            'completeness',
            'educational_value',
            'technical_depth'
          ]
        })
      })

      if (!response.ok) {
        throw new Error('Failed to evaluate explanation')
      }

      return await response.json()

    } catch (error) {
      console.error('Error evaluating explanation:', error)
      return null
    }
  }

  const getExplanationPrompt = async (problemId, code, difficulty = 'medium') => {
    try {
      const response = await fetch(buildApiUrl('/explain-to-earn/prompt'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          problemId,
          code,
          difficulty,
          promptType: 'guided'
        })
      })

      if (!response.ok) {
        throw new Error('Failed to get explanation prompt')
      }

      return await response.json()

    } catch (error) {
      console.error('Error getting prompt:', error)
      return null
    }
  }

  const reviewExplanation = async (explanationId, review) => {
    try {
      const response = await fetch(buildApiUrl(`/explain-to-earn/review/${explanationId}`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          review,
          timestamp: new Date().toISOString()
        })
      })

      if (!response.ok) {
        throw new Error('Failed to submit review')
      }

      return await response.json()

    } catch (error) {
      console.error('Error submitting review:', error)
      throw error
    }
  }

  const getCreditsValue = () => {
    return {
      credits,
      valueInUSD: credits * 0.01, // 1 credit = $0.01
      canRedeem: credits >= 100
    }
  }

  const redeemCredits = async (rewardType) => {
    if (credits < 100) {
      throw new Error('Minimum 100 credits required for redemption')
    }

    try {
      const response = await fetch(buildApiUrl('/explain-to-earn/redeem'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          rewardType,
          creditsToRedeem: 100
        })
      })

      if (!response.ok) {
        throw new Error('Failed to redeem credits')
      }

      const result = await response.json()
      setCredits(prev => prev - 100)

      return result

    } catch (error) {
      console.error('Error redeeming credits:', error)
      throw error
    }
  }

  const getLevelProgress = () => {
    const xpForNextLevel = level * 100
    const progress = (xp / xpForNextLevel) * 100
    return {
      currentLevel: level,
      currentXp: xp,
      xpForNextLevel,
      progress: Math.min(progress, 100),
      xpToNext: xpForNextLevel - xp
    }
  }

  const getStreakBonus = () => {
    if (streak === 0) return 0
    if (streak >= 30) return 3 // 30+ days = 3x bonus
    if (streak >= 14) return 2 // 14+ days = 2x bonus
    if (streak >= 7) return 1.5 // 7+ days = 1.5x bonus
    return 1 // Less than 7 days = 1x bonus
  }

  const getAchievements = () => {
    const achievements = []

    if (explanations.length >= 1) {
      achievements.push({ id: 'first_explanation', name: 'First Explanation', description: 'Submitted your first explanation' })
    }
    if (explanations.length >= 10) {
      achievements.push({ id: 'ten_explanations', name: 'Explainer', description: 'Submitted 10 explanations' })
    }
    if (explanations.length >= 50) {
      achievements.push({ id: 'fifty_explanations', name: 'Master Explainer', description: 'Submitted 50 explanations' })
    }
    if (streak >= 7) {
      achievements.push({ id: 'week_streak', name: 'Week Warrior', description: '7 day streak' })
    }
    if (streak >= 30) {
      achievements.push({ id: 'month_streak', name: 'Month Master', description: '30 day streak' })
    }
    if (level >= 5) {
      achievements.push({ id: 'level_five', name: 'Level 5', description: 'Reached level 5' })
    }
    if (credits >= 1000) {
      achievements.push({ id: 'credit_collector', name: 'Credit Collector', description: 'Earned 1000 credits' })
    }

    return achievements
  }

  const getExplanationStats = () => {
    const stats = {
      total: explanations.length,
      approved: explanations.filter(e => e.status === 'approved').length,
      pending: explanations.filter(e => e.status === 'pending').length,
      rejected: explanations.filter(e => e.status === 'rejected').length,
      averageCredits: explanations.length > 0 
        ? explanations.reduce((sum, e) => sum + (e.creditsEarned || 0), 0) / explanations.length 
        : 0,
      totalCredits: explanations.reduce((sum, e) => sum + (e.creditsEarned || 0), 0),
      thisWeek: explanations.filter(e => {
        const explanationDate = new Date(e.timestamp)
        const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        return explanationDate > oneWeekAgo
      }).length
    }

    return stats
  }

  return {
    // State
    explanations,
    currentExplanation,
    setCurrentExplanation,
    isSubmitting,
    feedback,
    credits,
    leaderboard,
    badges,
    streak,
    level,
    xp,

    // Actions
    submitExplanation,
    evaluateExplanation,
    getExplanationPrompt,
    reviewExplanation,
    redeemCredits,

    // Analytics
    getCreditsValue,
    getLevelProgress,
    getStreakBonus,
    getAchievements,
    getExplanationStats,

    // Refresh data
    loadUserProgress,
    loadLeaderboard,
    loadBadges
  }
}

export default useExplainToEarn
