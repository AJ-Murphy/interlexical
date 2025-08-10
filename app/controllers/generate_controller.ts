import { WotdService } from '#services/wotd_service'
import type { HttpContext } from '@adonisjs/core/http'

export default class GenerateController {
  async handle({ response }: HttpContext) {
    const wotdService = new WotdService()
    const data = await wotdService.storeToday()
    return response.created(data)
  }
}
