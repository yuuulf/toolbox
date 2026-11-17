import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// globals: false のため、Testing Library の自動クリーンアップが効かない。各テスト後に明示的に行う
afterEach(() => {
  cleanup()
})
