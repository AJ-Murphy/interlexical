import WotdEntries from '#models/wotd_entries'
import { WotdFactory } from '#database/factories/wotd_entry_factory'
import { BaseSeeder } from '@adonisjs/lucid/seeders'
import { DateTime } from 'luxon'

const DATES_RANGE = 7

export default class extends BaseSeeder {
  async run() {
    const today = DateTime.now().startOf('day')

    const pastDates = Array.from({ length: DATES_RANGE }, (_, i) =>
      today.minus({ days: DATES_RANGE - i }).toISODate()
    )
    const futureDates = Array.from({ length: DATES_RANGE }, (_, i) =>
      today.plus({ days: i + 1 }).toISODate()
    )

    const allDates = [...pastDates, today.toISODate(), ...futureDates] as string[]
    await WotdEntries.query().whereIn('date', allDates).delete()

    for (const date of pastDates) {
      await WotdFactory.merge({ date }).create()
    }

    await WotdFactory.create()

    for (const date of futureDates) {
      await WotdFactory.merge({ date }).create()
    }
  }
}
