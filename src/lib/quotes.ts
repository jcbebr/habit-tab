import { todayKey } from './date'
import type { DailyQuote } from './types'

const ZEN_QUOTES_URL = 'https://zenquotes.io/api/today'

const fallbackQuotes = [
  { author: 'Serena Williams', text: 'Luck has nothing to do with it.' },
  { author: 'Muhammad Ali', text: 'Don’t count the days; make the days count.' },
  { author: 'Venus Williams', text: 'Set realistic goals, keep re-evaluating, and be consistent.' },
  { author: 'Maya Angelou', text: 'Nothing will work unless you do.' },
  { author: 'Babe Didrikson Zaharias', text: 'The formula for success is simple: practice and concentration.' },
  { author: 'Ayn Rand', text: 'The question isn’t who is going to let me; it’s who is going to stop me.' },
  { author: 'Amelia Earhart', text: 'The most difficult thing is the decision to act.' },
]

function getFallbackQuoteForDate(dateKey: string): DailyQuote {
  const hash = dateKey.split('').reduce((sum, character) => sum + character.charCodeAt(0), 0)
  const selected = fallbackQuotes[hash % fallbackQuotes.length]

  return {
    dateKey,
    text: selected.text,
    author: selected.author,
    source: 'fallback',
  }
}

function isValidZenQuotesResponse(payload: unknown): payload is Array<{ q: string; a: string }> {
  return (
    Array.isArray(payload) &&
    payload.length > 0 &&
    typeof payload[0]?.q === 'string' &&
    typeof payload[0]?.a === 'string'
  )
}

export async function getDailyQuote(existingQuote: DailyQuote | null) {
  const dateKey = todayKey()

  if (existingQuote?.dateKey === dateKey) {
    return existingQuote
  }

  try {
    const response = await fetch(ZEN_QUOTES_URL, {
      headers: {
        Accept: 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`ZenQuotes request failed with ${response.status}`)
    }

    const payload = (await response.json()) as unknown

    if (!isValidZenQuotesResponse(payload)) {
      throw new Error('ZenQuotes returned an unexpected payload')
    }

    const [quote] = payload

    return {
      dateKey,
      text: quote.q,
      author: quote.a,
      source: 'zenquotes' as const,
    }
  } catch (error) {
    console.warn('Falling back to local quote', error)
    return getFallbackQuoteForDate(dateKey)
  }
}
