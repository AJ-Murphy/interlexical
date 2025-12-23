import env from '#start/env'
import { defineConfig } from '@adonisjs/lucid'

const dbConfig = defineConfig({
  connection: 'pg',
  prettyPrintDebugQueries: true,
  connections: {
    pg: {
      client: 'postgres',
      connection: {
        host: env.get('PG_HOST'),
        user: env.get('PG_USER'),
        port: env.get('PG_PORT'),
        password: env.get('PG_PASSWORD'),
        database: env.get('PG_NAME'),
        // ssl: true,
      },
      migrations: {
        naturalSort: true,
        paths: ['database/migrations'],
      },
    },
  },
})

export default dbConfig
