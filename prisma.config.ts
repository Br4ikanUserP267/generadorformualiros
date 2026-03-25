import { defineConfig } from '@prisma/internals'

export default defineConfig({
  migrate: {
    seed: undefined,
  },
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
})
