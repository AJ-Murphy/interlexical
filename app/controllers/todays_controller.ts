import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'

import { WotdService } from '#services/wotd_service'

export default class TodaysController {
  /**
   * Set cache headers that expire at midnight London time
   */
  private setCacheHeaders(response: HttpContext['response']) {
    const now = DateTime.now().setZone('Europe/London')
    const midnight = now.plus({ days: 1 }).startOf('day')
    const secondsUntilMidnight = Math.floor(midnight.diff(now, 'seconds').seconds)

    // Cache in browser and CDN until midnight
    response.header('Cache-Control', `public, max-age=${secondsUntilMidnight}`)
    response.header('Expires', midnight.toHTTP()!)
  }

  async show({ response, view }: HttpContext) {
    const service = new WotdService()
    const wotd = await service.getToday()

    this.setCacheHeaders(response)
    return view.render('pages/today', { wotd })
  }
}
