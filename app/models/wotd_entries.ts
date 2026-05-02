import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class WotdEntries extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column({
    consume: (value: Date | string) =>
      value instanceof Date ? value.toISOString().split('T')[0] : value,
  })
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
