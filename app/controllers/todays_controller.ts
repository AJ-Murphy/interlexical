import type { HttpContext } from '@adonisjs/core/http'

import { WotdService } from '#services/wotd_service'

export default class TodaysController {
  async find({ response }: HttpContext) {
    const wotdService = new WotdService()
    const wotd = await wotdService.getToday()
    return response.ok(wotd)
  }

  async show({ view }: HttpContext) {
    const service = new WotdService()
    const wotd = await service.getToday()
    return view.render('today', { wotd })
  }
}
