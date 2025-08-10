import type { HttpContext } from '@adonisjs/core/http'

import { WotdService } from '#services/wotd_service'

export default class TodaysController {
  async handle({ response }: HttpContext) {
    const wotdService = new WotdService()
    const wotd = await wotdService.getToday()
    return response.ok(wotd)
  }
}
