import { readMockStorage, resetMockStorage } from '@/lib/storage/mockStorage'

export const mockApi = {
  getSnapshot: async () => readMockStorage(),
  reset: async () => resetMockStorage(),
}
