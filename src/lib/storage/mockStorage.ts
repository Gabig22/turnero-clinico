import { createMockSeed } from '@/data/seed/mockSeed'
import type { MockDatabase } from '@/types'

export const MOCK_STORAGE_KEY = 'turnero_mock_v1'

function isBrowser() {
  return typeof window !== 'undefined'
}

export function writeMockStorage(database: MockDatabase) {
  if (!isBrowser()) {
    return database
  }

  window.localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(database))
  return database
}

export function readMockStorage() {
  if (!isBrowser()) {
    return createMockSeed()
  }

  const storedDatabase = window.localStorage.getItem(MOCK_STORAGE_KEY)

  if (!storedDatabase) {
    return writeMockStorage(createMockSeed())
  }

  try {
    return JSON.parse(storedDatabase) as MockDatabase
  } catch {
    return writeMockStorage(createMockSeed())
  }
}

export function resetMockStorage(referenceDate = new Date()) {
  return writeMockStorage(createMockSeed(referenceDate))
}
