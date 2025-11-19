import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'wotd_entries'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('pronunciation', 128).nullable()
    })
  }

}
