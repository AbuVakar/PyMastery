import { useState, useEffect } from 'react'
import { buildApiUrl } from '../utils/apiBase'

function useAIHints() {
  const [isAIEnabled, setIsAIEnabled] = useState(false)
  const [aiModel, setAiModel] = useState('gpt-3.5-turbo')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState(null)
  const [aiHints, setAiHints] = useState({})
  const [hintHistory, setHintHistory] = useState([])
  const [usageStats, setUsageStats] = useState({
    totalHints: 0,
    todayHints: 0,
    remainingQuota: 10
  })

  useEffect(() => {
    // Load AI preferences and usage stats
    loadAIPreferences()
    loadUsageStats()
  }, [])

  const loadAIPreferences = async () => {
    try {
      const response = await fetch(buildApiUrl('/ai/preferences'), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      if (response.ok) {
        const prefs = await response.json()
        setIsAIEnabled(prefs.enabled || false)
        setAiModel(prefs.model || 'gpt-3.5-turbo')
      }
    } catch (error) {
      console.error('Error loading AI preferences:', error)
    }
  }

  const loadUsageStats = async () => {
    try {
      const response = await fetch(buildApiUrl('/ai/usage-stats'), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      if (response.ok) {
        const stats = await response.json()
        setUsageStats(stats)
      }
    } catch (error) {
      console.error('Error loading usage stats:', error)
    }
  }

  const generateAIHint = async (problemId, code, currentLine, hintLevel = 1, userContext = {}) => {
    if (!isAIEnabled) {
      throw new Error('AI hints are not enabled')
    }

    if (usageStats.remainingQuota <= 0) {
      throw new Error('Daily AI hint quota exceeded')
    }

    setAiLoading(true)
    setAiError(null)

    try {
      // Check if we have a cached hint for this context
      const cacheKey = `${problemId}_${currentLine}_${hintLevel}`
      if (aiHints[cacheKey]) {
        return aiHints[cacheKey]
      }

      const response = await fetch(buildApiUrl('/ai/generate-hint'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          problemId,
          code,
          currentLine,
          hintLevel,
          userContext: {
            ...userContext,
            previousHints: hintHistory.filter(h => h.problemId === problemId),
            skillLevel: userContext.skillLevel || 'intermediate',
            learningGoals: userContext.learningGoals || []
          },
          model: aiModel,
          guardrails: {
            preventFullSolution: true,
            encourageThinking: true,
            adaptToSkill: true,
            maxHintLength: 300
          }
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to generate AI hint')
      }

      const hintData = await response.json()
      
      // Cache the hint
      setAiHints(prev => ({
        ...prev,
        [cacheKey]: hintData
      }))

      // Update hint history
      const historyEntry = {
        id: Date.now(),
        problemId,
        currentLine,
        hintLevel,
        hint: hintData.hint,
        reasoning: hintData.reasoning,
        confidence: hintData.confidence,
        timestamp: new Date().toISOString(),
        model: aiModel
      }
      setHintHistory(prev => [...prev, historyEntry])

      // Update usage stats
      setUsageStats(prev => ({
        ...prev,
        totalHints: prev.totalHints + 1,
        todayHints: prev.todayHints + 1,
        remainingQuota: prev.remainingQuota - 1
      }))

      return hintData

    } catch (error) {
      setAiError(error.message)
      throw error
    } finally {
      setAiLoading(false)
    }
  }

  const generateCodeExplanation = async (code, selectedLines = []) => {
    if (!isAIEnabled) {
      throw new Error('AI explanations are not enabled')
    }

    setAiLoading(true)
    setAiError(null)

    try {
      const response = await fetch(buildApiUrl('/ai/explain-code'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          code,
          selectedLines,
          explanationType: 'step-by-step',
          detailLevel: 'intermediate',
          includeExamples: true,
          model: aiModel
        })
      })

      if (!response.ok) {
        throw new Error('Failed to generate code explanation')
      }

      return await response.json()

    } catch (error) {
      setAiError(error.message)
      throw error
    } finally {
      setAiLoading(false)
    }
  }

  const generateNextStepHint = async (problemId, code, currentProgress, stuckPoint) => {
    if (!isAIEnabled) {
      throw new Error('AI hints are not enabled')
    }

    setAiLoading(true)
    setAiError(null)

    try {
      const response = await fetch(buildApiUrl('/ai/next-step'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          problemId,
          code,
          currentProgress,
          stuckPoint,
          learningStyle: 'visual',
          model: aiModel
        })
      })

      if (!response.ok) {
        throw new Error('Failed to generate next step hint')
      }

      return await response.json()

    } catch (error) {
      setAiError(error.message)
      throw error
    } finally {
      setAiLoading(false)
    }
  }

  const evaluateCode = async (code, problemId) => {
    if (!isAIEnabled) {
      throw new Error('AI evaluation is not enabled')
    }

    setAiLoading(true)
    setAiError(null)

    try {
      const response = await fetch(buildApiUrl('/ai/evaluate-code'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          code,
          problemId,
          evaluationCriteria: [
            'correctness',
            'efficiency',
            'readability',
            'best_practices'
          ],
          model: aiModel
        })
      })

      if (!response.ok) {
        throw new Error('Failed to evaluate code')
      }

      return await response.json()

    } catch (error) {
      setAiError(error.message)
      throw error
    } finally {
      setAiLoading(false)
    }
  }

  const updateAIPreferences = async (preferences) => {
    try {
      const response = await fetch(buildApiUrl('/ai/preferences'), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(preferences)
      })

      if (!response.ok) {
        throw new Error('Failed to update AI preferences')
      }

      const updatedPrefs = await response.json()
      setIsAIEnabled(updatedPrefs.enabled)
      setAiModel(updatedPrefs.model)

      return updatedPrefs

    } catch (error) {
      setAiError(error.message)
      throw error
    }
  }

  const clearCache = () => {
    setAiHints({})
    setHintHistory([])
  }

  const getHintQuality = (hintId) => {
    const hint = hintHistory.find(h => h.id === hintId)
    if (!hint) return null

    // In a real implementation, this would track user feedback
    return {
      helpful: true, // This would come from user feedback
      confidence: hint.confidence,
      reasoning: hint.reasoning
    }
  }

  const getAIGuardrails = () => {
    return {
      preventFullSolution: true,
      encourageThinking: true,
      adaptToSkill: true,
      maxHintLength: 300,
      safeContent: true,
      educationalFocus: true
    }
  }

  const getModelCapabilities = (model) => {
    const capabilities = {
      'gpt-3.5-turbo': {
        maxTokens: 4096,
        costPerToken: 0.000002,
        speed: 'fast',
        reasoning: 'good',
        codeGeneration: 'excellent'
      },
      'gpt-4': {
        maxTokens: 8192,
        costPerToken: 0.00003,
        speed: 'medium',
        reasoning: 'excellent',
        codeGeneration: 'excellent'
      },
      'claude-3': {
        maxTokens: 100000,
        costPerToken: 0.000015,
        speed: 'medium',
        reasoning: 'excellent',
        codeGeneration: 'excellent'
      }
    }

    return capabilities[model] || capabilities['gpt-3.5-turbo']
  }

  return {
    // AI Status
    isAIEnabled,
    setIsAIEnabled,
    aiModel,
    setAiModel,
    aiLoading,
    aiError,
    
    // Hint Generation
    generateAIHint,
    generateCodeExplanation,
    generateNextStepHint,
    
    // Code Evaluation
    evaluateCode,
    
    // Preferences
    updateAIPreferences,
    
    // Analytics
    usageStats,
    hintHistory,
    getHintQuality,
    
    // Cache Management
    clearCache,
    
    // Guardrails
    getAIGuardrails,
    getModelCapabilities
  }
}

export default useAIHints
