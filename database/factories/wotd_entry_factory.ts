import factory from '@adonisjs/lucid/factories'
import Wotd from '#models/wotd'
import { DateTime } from 'luxon'

let dt = DateTime.now().minus({ days: 7 })
const PARTS_OF_SPEECH = ['verb', 'adverb', 'noun', 'adjective'] as const
type PartOfSpeech = (typeof PARTS_OF_SPEECH)[number]

export const WotdFactory = factory
  .define(Wotd, async ({ faker }) => {
    const date = dt.toISODate()
    dt = dt.plus({ days: 1 })

    const partOfSpeech = faker.helpers.arrayElement<PartOfSpeech>(PARTS_OF_SPEECH)

    return {
      word: faker.word[partOfSpeech](),
      part_of_speech: partOfSpeech,
      definition: faker.lorem.paragraph(2),
      example_sentence: faker.lorem.paragraph(2),
      etymology: faker.lorem.paragraph(2),
      date,
    }
  })
  .build()
