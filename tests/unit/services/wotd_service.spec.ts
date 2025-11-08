import { test } from '@japa/runner'
import { WotdService } from '#services/wotd_service'
import { DateTime } from 'luxon'
import testUtils from '@adonisjs/core/services/test_utils'

test.group('todayISO', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('returns correct date format in London timezone', async ({ assert }) => {
    const service = new WotdService()
    const result = (service as any).todayISO()

    assert.match(result, /^\d{4}-\d{2}-\d{2}$/)
    assert.lengthOf(result, 10)
  })

  test('uses London timezone', async ({ assert }) => {
    const service = new WotdService()
    const result = (service as any).todayISO()
    const expectedLondonDate = DateTime.now().setZone('Europe/London').toISODate()

    assert.equal(result, expectedLondonDate)
  })
})

test.group('find', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('returns entry when date exists', async ({ assert }) => {
    const service = new WotdService()
    const today = DateTime.now().setZone('Europe/London').startOf('day')

    const result = await service.find(today.toISODate()!)
    const resultDate = DateTime.fromJSDate(new Date(result.date)).setZone('Europe/London')

    assert.isTrue(resultDate.hasSame(today, 'day'))
  })

  test('throws error when date does not exist', async ({ assert }) => {
    const service = new WotdService()
    const nonExistentDate = '3000-01-01'

    await assert.rejects(async () => await service.find(nonExistentDate), 'Row not found')
  })
})

test.group('getToday', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test("returns today's wotd", async ({ assert }) => {
    const service = new WotdService()
    const today = DateTime.now().setZone('Europe/London').startOf('day')

    const result = await service.getToday()
    const resultDate = DateTime.fromJSDate(new Date(result.date)).setZone('Europe/London')

    assert.isTrue(resultDate.hasSame(today, 'day'))
  })
})

test.group('entriesInDateRange', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('returns entries within date range', async ({ assert }) => {
    const service = new WotdService()
    const today = DateTime.now().setZone('Europe/London').startOf('day')
    const start = today.minus({ days: 7 })
    const end = today

    const results = await service.entriesInDateRange(start, end)

    assert.isArray(results)
    assert.isAtLeast(results.length, 1)

    // Verify all returned entries are within the range
    for (const entry of results) {
      const entryDate = DateTime.fromJSDate(new Date(entry.date))
      assert.isTrue(
        entryDate >= start && entryDate <= end,
        `Entry date ${entryDate.toISODate()} should be between ${start.toISODate()} and ${end.toISODate()}`
      )
    }
  })

  test('returns empty array when no entries exist in range', async ({ assert }) => {
    const service = new WotdService()
    const start = DateTime.fromISO('3000-01-01')
    const end = DateTime.fromISO('3000-01-31')

    const results = await service.entriesInDateRange(start, end)

    assert.isArray(results)
    assert.lengthOf(results, 0)
  })

  test('correctly excludes entries outside the range', async ({ assert }) => {
    const service = new WotdService()
    const today = DateTime.now().setZone('Europe/London').startOf('day')
    const start = today.minus({ days: 2 })
    const end = today.minus({ days: 1 })

    const results = await service.entriesInDateRange(start, end)

    // Verify that today's entry is not included
    const todayIncluded = results.some((entry) => {
      const entryDate = DateTime.fromJSDate(new Date(entry.date))
      return entryDate.hasSame(today, 'day')
    })

    assert.isFalse(todayIncluded, "Today's entry should not be included in past date range")
  })
})
