import { WotdService } from '#services/wotd_service'
import { BaseCommand } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'

export default class GenerateWotd extends BaseCommand {
  static commandName = 'generate:wotd'
  static description = 'Generate a new word of the day'

  static options: CommandOptions = {
    startApp: true,
  }

  async run() {
    this.logger.info('Generating Word of the Day')
    const animation = this.logger.await('')
    animation.start()

    const wotdService = new WotdService()
    const data = await wotdService.storeToday()

    animation.stop()
    this.logger.success(`Generated new Word of the Day, ${data.word}`)
  }
}
