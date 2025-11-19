import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class WotdEntries extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  // Store the ISO date (YYYY-MM-DD). Using string keeps it simple across SQLite/Postgres.
  @column()
  declare date: string

  @column()
  declare word: string

  @column()
  declare part_of_speech: string

  @column()
  declare definition: string

  @column()
  declare example_sentence: string

  @column()
  declare etymology: string

  @column()
  declare pronunciation: string

  @column.dateTime({ columnName: 'created_at', autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ columnName: 'updated_at', autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
