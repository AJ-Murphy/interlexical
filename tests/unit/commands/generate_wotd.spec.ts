import { test } from '@japa/runner'
import ace from '@adonisjs/core/services/ace'
import GenerateWotd from '../../../commands/generate_wotd.js'
import { WotdService } from '#services/wotd_service'
import testUtils from '@adonisjs/core/services/test_utils'
import sinon from 'sinon'

test.group('generate:wotd command', (group) => {
  // Switch to raw mode to capture logs
  group.each.setup(() => {
    ace.ui.switchMode('raw')
    return () => ace.ui.switchMode('normal')
  })

  // Setup database transaction for each test
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('successfully generates and stores word of the day', async ({ assert }) => {
    const mockWotd = {
      word: 'ephemeral',
      pronunciation: 'ih-FEM-er-ul',
      part_of_speech: 'adjective',
      definition: 'Lasting for a very short time.',
      example_sentence: 'The beauty of cherry blossoms is ephemeral.',
      etymology: 'From Greek ephemeros, meaning lasting only a day.',
      date: '2025-12-16',
    }

    // Stub the storeToday method to avoid API calls
    const storeTodayStub = sinon.stub(WotdService.prototype, 'storeToday').resolves(mockWotd)

    try {
      const command = await ace.create(GenerateWotd, [])
      await command.exec()

      // Verify command succeeded
      command.assertSucceeded()

      // Verify storeToday was called
      assert.isTrue(storeTodayStub.calledOnce)
    } finally {
      storeTodayStub.restore()
    }
  })

  test('logs info message when starting', async () => {
    const mockWotd = {
      word: 'ephemeral',
      pronunciation: 'ih-FEM-er-ul',
      part_of_speech: 'adjective',
      definition: 'Lasting for a very short time.',
      example_sentence: 'The beauty of cherry blossoms is ephemeral.',
      etymology: 'From Greek ephemeros, meaning lasting only a day.',
      date: '2025-12-16',
    }

    const storeTodayStub = sinon.stub(WotdService.prototype, 'storeToday').resolves(mockWotd)

    try {
      const command = await ace.create(GenerateWotd, [])
      await command.exec()

      // Verify initial info log
      command.assertLog('[ blue(info) ] Generating Word of the Day')
    } finally {
      storeTodayStub.restore()
    }
  })

  test('logs success message with generated word', async () => {
    const mockWotd = {
      word: 'serendipity',
      pronunciation: 'sair-un-DIP-ih-tee',
      part_of_speech: 'noun',
      definition: 'The occurrence of events by chance in a happy way.',
      example_sentence: 'Finding that book was pure serendipity.',
      etymology: 'Coined by Horace Walpole in 1754.',
      date: '2025-12-16',
    }

    const storeTodayStub = sinon.stub(WotdService.prototype, 'storeToday').resolves(mockWotd)

    try {
      const command = await ace.create(GenerateWotd, [])
      await command.exec()

      // Verify success log includes the word
      command.assertLog('[ green(success) ] Generated new Word of the Day, serendipity')
    } finally {
      storeTodayStub.restore()
    }
  })

  test('success message matches pattern', async () => {
    const mockWotd = {
      word: 'perspicacity',
      pronunciation: 'pur-spi-KASS-ih-tee',
      part_of_speech: 'noun',
      definition: 'The quality of having keen insight.',
      example_sentence: 'Her perspicacity was remarkable.',
      etymology: 'From Latin perspicax, meaning sharp-sighted.',
      date: '2025-12-16',
    }

    const storeTodayStub = sinon.stub(WotdService.prototype, 'storeToday').resolves(mockWotd)

    try {
      const command = await ace.create(GenerateWotd, [])
      await command.exec()

      // Use regex to verify log pattern
      command.assertLogMatches(/Generated new Word of the Day, \w+/)
    } finally {
      storeTodayStub.restore()
    }
  })
})
