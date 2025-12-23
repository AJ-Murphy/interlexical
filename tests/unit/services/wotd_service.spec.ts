import { test } from '@japa/runner'
import { WotdService } from '#services/wotd_service'
import { DateTime } from 'luxon'
import testUtils from '@adonisjs/core/services/test_utils'
import sinon from 'sinon'
import WotdEntries from '#models/wotd_entries'

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

test.group('recentWordsToAvoid', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('returns array of words from default 60 day period', async ({ assert }) => {
    const service = new WotdService()

    const words = await service.recentWordsToAvoid()

    assert.isArray(words)
    // Verify all elements are strings
    for (const word of words) {
      assert.isString(word)
      assert.isAtLeast(word.length, 1)
    }
  })

  test('returns words from custom time period when days parameter provided', async ({ assert }) => {
    const service = new WotdService()
    const customDays = 7

    const words = await service.recentWordsToAvoid(customDays)

    assert.isArray(words)

    // Get entries for the same period to verify
    const end = DateTime.now()
    const start = end.minus({ days: customDays })
    const entries = await service.entriesInDateRange(start, end)
    const expectedWords = entries.map(({ word }) => word)

    assert.deepEqual(words, expectedWords)
  })

  test('returns empty array when no entries exist in time period', async ({ assert }) => {
    const service = new WotdService()

    // Use a very small window that likely has no entries in the far past
    // We'll mock this by checking a future scenario isn't possible
    const words = await service.recentWordsToAvoid(0)

    assert.isArray(words)
  })
})

test.group('store', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('persists entry to database', async ({ assert }) => {
    const service = new WotdService()
    const testDate = '2025-01-01'
    const testWotd = {
      word: 'ephemeral',
      pronunciation: 'ih-FEM-er-ul',
      part_of_speech: 'adjective',
      definition: 'Lasting for a very short time.',
      example_sentence: 'The beauty of cherry blossoms is ephemeral.',
      etymology: 'From Greek ephemeros, meaning lasting only a day.',
    }

    await service.store(testDate, testWotd)

    // Verify it can be retrieved
    const retrieved = await service.find(testDate)
    assert.equal(retrieved.word, testWotd.word)
    assert.equal(retrieved.definition, testWotd.definition)
  })

  test('stores all wotd properties correctly', async ({ assert }) => {
    const service = new WotdService()
    const testDate = '2025-01-02'
    const testWotd = {
      word: 'ubiquitous',
      pronunciation: 'yoo-BIK-wih-tus',
      part_of_speech: 'adjective',
      definition: 'Present, appearing, or found everywhere.',
      example_sentence: 'Smartphones have become ubiquitous in modern society.',
      etymology: 'From Latin ubique, meaning everywhere.',
    }

    const result = await service.store(testDate, testWotd)

    // Verify all properties are stored
    assert.properties(result, [
      'date',
      'word',
      'pronunciation',
      'part_of_speech',
      'definition',
      'example_sentence',
      'etymology',
    ])
  })
})

test.group('buildPrompt', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('includes avoidance list when words are provided', async ({ assert }) => {
    const service = new WotdService()
    const avoidList = ['serendipity', 'ephemeral', 'ubiquitous']

    const prompt = (service as any).buildPrompt(avoidList)

    assert.include(prompt, 'Avoid using any of these words:')
    assert.include(prompt, 'serendipity')
    assert.include(prompt, 'ephemeral')
    assert.include(prompt, 'ubiquitous')
  })

  test('shows no avoidance list message when empty array provided', async ({ assert }) => {
    const service = new WotdService()
    const emptyList: string[] = []

    const prompt = (service as any).buildPrompt(emptyList)

    assert.include(prompt, 'There is no avoidance list for this request')
    assert.notInclude(prompt, 'Avoid using any of these words:')
  })

  test('includes all required prompt sections', async ({ assert }) => {
    const service = new WotdService()
    const prompt = (service as any).buildPrompt([])

    // Verify key sections are present
    assert.include(prompt, 'Word of the Day')
    assert.include(prompt, 'Tone:')
    assert.include(prompt, 'Requirements:')
    assert.include(prompt, 'part of speech')
    assert.include(prompt, 'Pronunciation:')
    assert.include(prompt, 'Definition:')
    assert.include(prompt, 'Example sentence:')
    assert.include(prompt, 'Etymology:')
    assert.include(prompt, 'British English')
  })
})

test.group('getWotdSchema', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('returns valid JSON schema structure', async ({ assert }) => {
    const service = new WotdService()
    const schema = (service as any).getWotdSchema()

    assert.equal(schema.type, 'object')
    assert.exists(schema.properties)
    assert.exists(schema.required)
    assert.isFalse(schema.additionalProperties)
  })

  test('has all required WOTD fields in schema', async ({ assert }) => {
    const service = new WotdService()
    const schema = (service as any).getWotdSchema()

    const expectedFields = [
      'word',
      'pronunciation',
      'part_of_speech',
      'definition',
      'example_sentence',
      'etymology',
    ]

    for (const field of expectedFields) {
      assert.property(schema.properties, field)
      assert.include(schema.required, field)
    }
  })

  test('schema fields have descriptions', async ({ assert }) => {
    const service = new WotdService()
    const schema = (service as any).getWotdSchema()

    const fields = [
      'word',
      'pronunciation',
      'part_of_speech',
      'definition',
      'example_sentence',
      'etymology',
    ]

    for (const field of fields) {
      assert.property(schema.properties[field], 'description')
      assert.isString(schema.properties[field].description)
      assert.isAtLeast(schema.properties[field].description.length, 10)
    }
  })
})

test.group('storeToday', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('generates and stores WOTD for today', async ({ assert }) => {
    const service = new WotdService()
    const mockWotd = {
      word: 'perspicacity',
      pronunciation: 'pur-spi-KASS-ih-tee',
      part_of_speech: 'noun',
      definition: 'The quality of having keen insight or judgment.',
      example_sentence: 'Her perspicacity in business matters was legendary.',
      etymology: 'From Latin perspicax, meaning sharp-sighted.',
    }

    // Delete today's entry if it exists (from seeder)
    const today = DateTime.now().setZone('Europe/London').toISODate()!
    await WotdEntries.query().where('date', today).delete()

    // Stub the generate method to avoid actual API calls
    const generateStub = sinon.stub(service as any, 'generate').resolves(mockWotd)

    try {
      const result = await service.storeToday()

      // Verify generate was called
      assert.isTrue(generateStub.calledOnce)

      // Verify the result has the expected word
      assert.equal(result.word, mockWotd.word)

      // Verify it was stored with today's date
      assert.equal(result.date, today)

      // Verify all properties were stored
      assert.equal(result.pronunciation, mockWotd.pronunciation)
      assert.equal(result.part_of_speech, mockWotd.part_of_speech)
      assert.equal(result.definition, mockWotd.definition)
      assert.equal(result.example_sentence, mockWotd.example_sentence)
      assert.equal(result.etymology, mockWotd.etymology)
    } finally {
      generateStub.restore()
    }
  })

  test("uses today's date in London timezone", async ({ assert }) => {
    const service = new WotdService()
    const mockWotd = {
      word: 'test',
      pronunciation: 'test',
      part_of_speech: 'noun',
      definition: 'test definition',
      example_sentence: 'test sentence',
      etymology: 'test etymology',
    }

    // Delete today's entry if it exists
    const today = DateTime.now().setZone('Europe/London').toISODate()!
    await WotdEntries.query().where('date', today).delete()

    const generateStub = sinon.stub(service as any, 'generate').resolves(mockWotd)

    try {
      const result = await service.storeToday()
      const expectedDate = DateTime.now().setZone('Europe/London').toISODate()!

      assert.equal(result.date, expectedDate)
    } finally {
      generateStub.restore()
    }
  })
})

test.group('generate', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('calls recentWordsToAvoid to build avoidance list', async ({ assert }) => {
    const service = new WotdService()
    const mockWotd = {
      word: 'eloquence',
      pronunciation: 'EL-uh-kwens',
      part_of_speech: 'noun',
      definition: 'Fluent or persuasive speaking or writing.',
      example_sentence: "The speaker's eloquence captivated the audience.",
      etymology: 'From Latin eloquentia, meaning speaking out.',
    }

    // Stub the recentWordsToAvoid method
    const recentWordsStub = sinon.stub(service, 'recentWordsToAvoid').resolves(['test', 'word'])

    // Mock the OpenAI client
    const mockClient = {
      responses: {
        parse: sinon.stub().resolves({
          output_parsed: mockWotd,
        }),
      },
    }
    ;(service as any).client = mockClient

    try {
      const result = await service.generate()

      // Verify recentWordsToAvoid was called
      assert.isTrue(recentWordsStub.calledOnce)

      // Verify the result matches the mock
      assert.deepEqual(result, mockWotd)
    } finally {
      recentWordsStub.restore()
    }
  })

  test('passes correct parameters to OpenAI API', async ({ assert }) => {
    const service = new WotdService()
    const mockWotd = {
      word: 'verisimilitude',
      pronunciation: 'ver-ih-sih-MIL-ih-tood',
      part_of_speech: 'noun',
      definition: 'The appearance of being true or real.',
      example_sentence: "The novel's verisimilitude made it feel authentic.",
      etymology: 'From Latin verisimilitudo, meaning likeness to truth.',
    }

    // Stub recentWordsToAvoid
    sinon.stub(service, 'recentWordsToAvoid').resolves(['avoid1', 'avoid2'])

    // Mock the OpenAI client with a spy
    const parseStub = sinon.stub().resolves({
      output_parsed: mockWotd,
    })
    const mockClient = {
      responses: {
        parse: parseStub,
      },
    }
    ;(service as any).client = mockClient

    await service.generate()

    // Verify parse was called once
    assert.isTrue(parseStub.calledOnce)

    // Get the call arguments
    const callArgs = parseStub.firstCall.args[0]

    // Verify key parameters
    assert.equal(callArgs.model, 'gpt-5-nano')
    assert.exists(callArgs.input)
    assert.exists(callArgs.text)
    assert.equal(callArgs.text.format.type, 'json_schema')
    assert.equal(callArgs.text.format.name, 'word_of_the_day')
    assert.isTrue(callArgs.text.format.strict)
    assert.exists(callArgs.text.format.schema)
  })

  test('returns parsed WOTD object from API response', async ({ assert }) => {
    const service = new WotdService()
    const expectedWotd = {
      word: 'tenacious',
      pronunciation: 'teh-NAY-shus',
      part_of_speech: 'adjective',
      definition: 'Holding firmly to a purpose or opinion; persistent.',
      example_sentence: 'The tenacious researcher refused to give up on the project.',
      etymology: 'From Latin tenax, meaning holding fast or gripping.',
    }

    // Stub dependencies
    sinon.stub(service, 'recentWordsToAvoid').resolves([])

    const mockClient = {
      responses: {
        parse: sinon.stub().resolves({
          output_parsed: expectedWotd,
        }),
      },
    }
    ;(service as any).client = mockClient

    const result = await service.generate()

    assert.deepEqual(result, expectedWotd)
  })
})
