import { test } from '@japa/runner'
import { WotdService } from '#services/wotd_service'
import { DateTime } from 'luxon'
import testUtils from '@adonisjs/core/services/test_utils'

test.group('Services wotd service', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('todayISO returns correct date format in London timezone', async ({ assert }) => {
    const service = new WotdService()

    // Access private method using type assertion
    const result = (service as any).todayISO()

    assert.match(result, /^\d{4}-\d{2}-\d{2}$/)
    assert.lengthOf(result, 10)
  })

  test('todayISO uses London timezone', async ({ assert }) => {
    const service = new WotdService()
    const result = (service as any).todayISO()

    // Should match London date, not local system date
    const expectedLondonDate = DateTime.now().setZone('Europe/London').toISODate()

    assert.equal(result, expectedLondonDate)
  })
})
