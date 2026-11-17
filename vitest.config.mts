import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  resolve: {
    // tsconfig.json の paths（`@/*`）を Vite 標準機能で解決する
    tsconfigPaths: true,
  },
  test: {
    // ロジックは node 環境。コンポーネントはファイル先頭の `// @vitest-environment jsdom` で切り替える
    environment: 'node',
    setupFiles: ['./vitest.setup.ts'],
  },
})
