
import { defineConfig } from 'vitest/config'

export default defineConfig({
  root: '.', // default

  test: {
    environment: 'happy-dom',
    includeSource: ['src/*.ts'],
    setupFiles: ['dotenv/config', 'test/setupTest.ts']
  },
})