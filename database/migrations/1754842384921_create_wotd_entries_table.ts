import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'wotd_entries'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.date('date').notNullable().unique()
      table.string('word', 64).notNullable()
      table.string('part_of_speech', 32).notNullable()
      table.text('definition').notNullable()
      table.text('example_sentence').notNullable()
      table.text('etymology').notNullable()
      table.timestamp('created_at', { useTz: false }).notNullable().defaultTo(this.now())
      table.timestamp('updated_at', { useTz: false }).notNullable().defaultTo(this.now())
      // Better indexing
      table.index(['word'], 'wotd_entries_word_idx')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
