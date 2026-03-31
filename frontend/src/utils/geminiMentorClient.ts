/**
 * Shared Gemini calls for AI Mentor (floating widget + /ai-mentor page).
 * Keys: VITE_GEMINI_API_KEY in .env or localStorage gemini_api_key
 */

const GEMINI_MODELS = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-2.5-flash'] as const

const SYSTEM_PREFIX = 'As an expert Python programming mentor, help with: '

export function getGeminiApiKey(): string | null {
  if (typeof window === 'undefined') return null
  const fromEnv =
    (import.meta.env.VITE_GEMINI_API_KEY as string | undefined)?.trim() ||
    (import.meta.env.REACT_APP_GEMINI_API_KEY as string | undefined)?.trim()
  const fromStorage = localStorage.getItem('gemini_api_key')?.trim()
  const key = (fromEnv || fromStorage || '').trim()
  return key.length > 0 ? key : null
}

function parseGeminiContent(data: Record<string, unknown>): string | null {
  const feedback = data.promptFeedback as { blockReason?: string } | undefined
  if (feedback?.blockReason) {
    throw new Error(`Gemini blocked the prompt (${feedback.blockReason}). Try rephrasing.`)
  }
  const candidates = data.candidates as Array<{
    finishReason?: string
    content?: { parts?: Array<{ text?: string }> }
  }> | undefined
  const first = candidates?.[0]
  if (!first) {
    throw new Error('No response from Gemini (empty candidates).')
  }
  if (first.finishReason && first.finishReason !== 'STOP') {
    throw new Error(`Gemini stopped: ${first.finishReason}`)
  }
  const text = first.content?.parts?.[0]?.text
  return text?.trim() ? text : null
}

export async function callGeminiMentor(userMessage: string, apiKey: string): Promise<string> {
  let lastModelError: Error | null = null

  for (const model of GEMINI_MODELS) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: `${SYSTEM_PREFIX}${userMessage}` }],
          },
        ],
      }),
    })

    const raw = await response.text()
    let data: Record<string, unknown> = {}
    try {
      data = raw ? (JSON.parse(raw) as Record<string, unknown>) : {}
    } catch {
      throw new Error(`Gemini: invalid response (${response.status})`)
    }

    if (!response.ok) {
      const err = data.error as { message?: string } | undefined
      const msg = err?.message || `HTTP ${response.status}`
      if (response.status === 404 || /not found|is not found|not supported/i.test(msg)) {
        lastModelError = new Error(msg)
        continue
      }
      throw new Error(msg)
    }

    const content = parseGeminiContent(data)
    if (content) return content
    lastModelError = new Error('No text in Gemini response.')
  }

  throw lastModelError || new Error('Gemini: no working model for this API key/project.')
}
