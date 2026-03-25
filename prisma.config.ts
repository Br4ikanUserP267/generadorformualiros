import { Config } from '@prisma/internals'

const config: Config = {
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
}

export default config
