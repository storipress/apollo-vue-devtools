import { FetchResult, Observer } from '@apollo/client/core'
import { vi } from 'vitest'

export const observer: Required<Omit<Observer<FetchResult>, 'start'>> = {
  next: vi.fn(),
  error: vi.fn(),
  complete: vi.fn(),
}

export const trackStart = vi.fn(() => observer)

vi.mock('../devtools.ts', () => {
  return {
    devtools: {
      trackStart,
    },
  }
})
