import { useState, useEffect } from 'react'
import { buildApiUrl } from '../utils/apiBase'

const DB_NAME = 'PyMasteryDB'
const DB_VERSION = 1
const STORE_NAME = 'traces'

function useLocalStorage() {
  const [db, setDb] = useState(null)
  const [isSupported, setIsSupported] = useState(false)
  const [uploadConsent, setUploadConsent] = useState(false)

  useEffect(() => {
    // Check if IndexedDB is supported
    if (typeof window !== 'undefined' && 'indexedDB' in window) {
      setIsSupported(true)
      initDB()
    } else {
      setIsSupported(false)
    }
  }, [])

  const initDB = () => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = (event) => {
      console.error('IndexedDB error:', event.target.error)
    }

    request.onsuccess = (event) => {
      setDb(event.target.result)
    }

    request.onupgradeneeded = (event) => {
      const db = event.target.result
      
      // Create object store for traces
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true })
        store.createIndex('problemId', 'problemId', { unique: false })
        store.createIndex('timestamp', 'timestamp', { unique: false })
        store.createIndex('userId', 'userId', { unique: false })
      }
      
      // Create object store for user preferences
      if (!db.objectStoreNames.contains('preferences')) {
        db.createObjectStore('preferences', { keyPath: 'key' })
      }
    }
  }

  const saveTrace = async (traceData) => {
    if (!db) return false

    try {
      const transaction = db.transaction([STORE_NAME], 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      
      const traceRecord = {
        problemId: traceData.problemId,
        userId: traceData.userId || 'anonymous',
        traceFrames: traceData.traceFrames,
        timestamp: new Date().toISOString(),
        metadata: {
          totalFrames: traceData.traceFrames.length,
          duration: traceData.duration || 0,
          completed: traceData.completed || false
        }
      }

      const request = store.add(traceRecord)
      
      return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(true)
        request.onerror = () => reject(request.error)
      })
    } catch (error) {
      console.error('Error saving trace:', error)
      return false
    }
  }

  const getTraces = async (problemId = null, userId = null) => {
    if (!db) return []

    try {
      const transaction = db.transaction([STORE_NAME], 'readonly')
      const store = transaction.objectStore(STORE_NAME)
      
      let request
      if (problemId) {
        request = store.index('problemId').getAll(problemId)
      } else if (userId) {
        request = store.index('userId').getAll(userId)
      } else {
        request = store.getAll()
      }

      return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error)
      })
    } catch (error) {
      console.error('Error getting traces:', error)
      return []
    }
  }

  const deleteTrace = async (traceId) => {
    if (!db) return false

    try {
      const transaction = db.transaction([STORE_NAME], 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      
      const request = store.delete(traceId)
      
      return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(true)
        request.onerror = () => reject(request.error)
      })
    } catch (error) {
      console.error('Error deleting trace:', error)
      return false
    }
  }

  const clearAllTraces = async () => {
    if (!db) return false

    try {
      const transaction = db.transaction([STORE_NAME], 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      
      const request = store.clear()
      
      return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(true)
        request.onerror = () => reject(request.error)
      })
    } catch (error) {
      console.error('Error clearing traces:', error)
      return false
    }
  }

  const savePreference = async (key, value) => {
    if (!db) return false

    try {
      const transaction = db.transaction(['preferences'], 'readwrite')
      const store = transaction.objectStore('preferences')
      
      const request = store.put({ key, value, timestamp: new Date().toISOString() })
      
      return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(true)
        request.onerror = () => reject(request.error)
      })
    } catch (error) {
      console.error('Error saving preference:', error)
      return false
    }
  }

  const getPreference = async (key) => {
    if (!db) return null

    try {
      const transaction = db.transaction(['preferences'], 'readonly')
      const store = transaction.objectStore('preferences')
      
      const request = store.get(key)
      
      return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result?.value || null)
        request.onerror = () => reject(request.error)
      })
    } catch (error) {
      console.error('Error getting preference:', error)
      return null
    }
  }

  const getStorageStats = async () => {
    if (!db) return null

    try {
      const transaction = db.transaction([STORE_NAME], 'readonly')
      const store = transaction.objectStore(STORE_NAME)
      
      const request = store.getAll()
      
      return new Promise((resolve, reject) => {
        request.onsuccess = () => {
          const traces = request.result
          const stats = {
            totalTraces: traces.length,
            totalFrames: traces.reduce((sum, trace) => sum + (trace.metadata?.totalFrames || 0), 0),
            oldestTrace: traces.length > 0 ? new Date(Math.min(...traces.map(t => new Date(t.timestamp)))) : null,
            newestTrace: traces.length > 0 ? new Date(Math.max(...traces.map(t => new Date(t.timestamp)))) : null,
            storageSize: JSON.stringify(traces).length // Rough estimate
          }
          resolve(stats)
        }
        request.onerror = () => reject(request.error)
      })
    } catch (error) {
      console.error('Error getting storage stats:', error)
      return null
    }
  }

  const exportTraces = async () => {
    const traces = await getTraces()
    return {
      traces,
      exportedAt: new Date().toISOString(),
      version: '1.0'
    }
  }

  const importTraces = async (traceData) => {
    if (!db || !traceData.traces) return false

    try {
      const transaction = db.transaction([STORE_NAME], 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      
      for (const trace of traceData.traces) {
        await store.add(trace)
      }
      
      return true
    } catch (error) {
      console.error('Error importing traces:', error)
      return false
    }
  }

  const uploadToCloud = async (traceData) => {
    if (!uploadConsent) {
      throw new Error('Upload consent not granted')
    }

    try {
      const response = await fetch(buildApiUrl('/upload-trace'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          traceData,
          consent: true,
          timestamp: new Date().toISOString()
        })
      })

      if (!response.ok) {
        throw new Error('Upload failed')
      }

      return await response.json()
    } catch (error) {
      console.error('Error uploading to cloud:', error)
      throw error
    }
  }

  const syncWithCloud = async () => {
    if (!uploadConsent) return

    try {
      // Get local traces
      const localTraces = await getTraces()
      
      // Upload to cloud
      for (const trace of localTraces) {
        await uploadToCloud(trace)
      }
      
      return true
    } catch (error) {
      console.error('Error syncing with cloud:', error)
      return false
    }
  }

  return {
    // Database status
    isSupported,
    uploadConsent,
    setUploadConsent,
    
    // Trace operations
    saveTrace,
    getTraces,
    deleteTrace,
    clearAllTraces,
    
    // Preference operations
    savePreference,
    getPreference,
    
    // Analytics
    getStorageStats,
    
    // Import/Export
    exportTraces,
    importTraces,
    
    // Cloud operations
    uploadToCloud,
    syncWithCloud
  }
}

export default useLocalStorage
