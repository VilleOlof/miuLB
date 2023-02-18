
import { defineConfig } from 'vitest/config'

export default defineConfig({
  root: '.', // default

  test: {
    setupFiles: ['dotenv/config', 'test/setupTest.ts']
  },
})