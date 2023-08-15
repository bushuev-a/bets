import 'dotenv/config'
import { type Knex } from 'knex'

const {
  DB_HOST,
  DB_DATABASE,
  DB_PORT,
  DB_USERNAME,
  DB_PASSWORD
} = process.env

const knexFile: Knex.Config = {
  client: 'pg',
  connection: {
    host: DB_HOST,
    database: DB_DATABASE,
    port: Number(DB_PORT),
    user: DB_USERNAME,
    password: DB_PASSWORD
  },
  migrations: {
    tableName: 'migrations'
  }
}

export default knexFile
