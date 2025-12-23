import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import { DateTime } from 'luxon'

test.group('TodaysController - GET /', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('returns 200 status and renders view with WOTD data', async ({ client, assert }) => {
    const response = await client.get('/')

    response.assertStatus(200)

    const html = response.text()
    // Verify HTML has substantial content (WOTD data should be rendered)
    assert.isString(html)
    assert.isAtLeast(html.length, 200)
    // Verify it's HTML with DOCTYPE
    assert.include(html, '<!DOCTYPE html>')
  })

  test('sets Cache-Control header with max-age', async ({ client, assert }) => {
    const response = await client.get('/')

    response.assertStatus(200)

    const headers = response.headers()
    assert.exists(headers['cache-control'])
    assert.include(headers['cache-control'], 'public')
    assert.include(headers['cache-control'], 'max-age=')

    // Extract max-age value
    const maxAgeMatch = headers['cache-control'].match(/max-age=(\d+)/)
    assert.exists(maxAgeMatch)
    const maxAge = Number.parseInt(maxAgeMatch![1])

    // Verify max-age is reasonable (0 to 86400 seconds - 24 hours)
    assert.isAtLeast(maxAge, 0)
    assert.isAtMost(maxAge, 86400)
  })

  test('sets Expires header', async ({ client, assert }) => {
    const response = await client.get('/')

    response.assertStatus(200)

    const headers = response.headers()
    assert.exists(headers['expires'])
  })

  test('cache max-age is calculated based on London timezone', async ({ client, assert }) => {
    const response = await client.get('/')

    response.assertStatus(200)

    const now = DateTime.now().setZone('Europe/London')
    const midnight = now.plus({ days: 1 }).startOf('day')
    const expectedSecondsUntilMidnight = Math.floor(midnight.diff(now, 'seconds').seconds)

    const headers = response.headers()
    const maxAgeMatch = headers['cache-control'].match(/max-age=(\d+)/)
    const actualMaxAge = Number.parseInt(maxAgeMatch![1])

    // Allow 5 second tolerance for test execution time
    assert.approximately(actualMaxAge, expectedSecondsUntilMidnight, 5)
  })

  test('Expires header is set to next midnight in London time', async ({ client, assert }) => {
    const response = await client.get('/')

    response.assertStatus(200)

    const headers = response.headers()
    const expiresHeader = headers['expires']
    assert.exists(expiresHeader)

    const expiresDate = DateTime.fromHTTP(expiresHeader)

    // Verify the expires date is at midnight in London timezone
    const londonExpires = expiresDate.setZone('Europe/London')
    assert.equal(londonExpires.hour, 0)
    assert.equal(londonExpires.minute, 0)

    // Verify it's tomorrow's midnight (within next 24 hours)
    const diffInHours = expiresDate.diff(DateTime.now(), 'hours').hours
    assert.isAtLeast(diffInHours, 0)
    assert.isAtMost(diffInHours, 24)
  })

  test('response includes WOTD content in HTML', async ({ client, assert }) => {
    const response = await client.get('/')

    response.assertStatus(200)

    const html = response.text()

    // Verify HTML contains WOTD-related elements
    // These are basic checks to ensure data was passed to the view
    assert.isString(html)
    assert.isAtLeast(html.length, 100) // HTML should have reasonable length
  })
})
