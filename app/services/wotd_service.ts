import WotdEntries from '#models/wotd_entries'
import { DateTime } from 'luxon'
import OpenAI from 'openai'
import env from '#start/env'

export type Wotd = {
  word: string
  part_of_speech: string
  definition: string
  example_sentence: string
  etymology: string
}

export class WotdService {
  private client: OpenAI
  private model: string
  private static readonly DEFAULT_AVOIDANCE_DAYS = 60
  private static readonly TIMEZONE = 'Europe/London'

  constructor() {
    this.client = new OpenAI({ apiKey: env.get('OPENAI_API_KEY') })
    this.model = 'gpt-5-nano'
  }

  /** Get YYYY-MM-DD in Europe/London */
  private todayISO(): string {
    return DateTime.now().setZone(WotdService.TIMEZONE).toISODate()!
  }

  private getWotdSchema() {
    return {
      type: 'object',
      properties: {
        word: {
          type: 'string',
          description: 'A single English vocabulary word, 3-15 characters.',
        },
        part_of_speech: {
          type: 'string',
          description: "The word's grammatical role (e.g. noun, verb, adjective).",
        },
        definition: {
          type: 'string',
          description: 'Modern definition, ideally 15-120 characters.',
        },
        example_sentence: {
          type: 'string',
          description: 'Natural example sentence, ideally 2-200 characters.',
        },
        etymology: {
          type: 'string',
          description: 'Short one-sentence origin under 150 characters, ending with a period.',
        },
      },
      required: ['word', 'part_of_speech', 'definition', 'example_sentence', 'etymology'],
      additionalProperties: false,
    }
  }

  private buildPrompt(avoidList: string[]): string {
    const avoidancePrompt = avoidList.length
      ? `Avoid using any of these words: ${avoidList.join(', ')}.`
      : 'There is no avoidance list for this request.'

    return `
You are generating a single "Word of the Day" entry for educated adult learners seeking to expand their vocabulary.

Tone: Informative, accessible, and engaging without being condescending.

Requirements:
- Choose an uncommon but recognizable English word (not in the 3000 most common words, but findable in standard dictionaries).
- Prioritize words that are useful in everyday discourse, have interesting origins, or are commonly misused.
- The word must be a real English word in current use.
- Avoid overly technical, archaic, or domain-specific jargon.
- Do not use neologisms (unless historically established), profanity, or slurs.
- ${avoidancePrompt}
- Identify its full part of speech (for example: noun, verb, adjective).
- Definition: 15-120 characters (strict), clear, modern, and unambiguous. Should distinguish this word from similar terms.
- Example sentence: 20-200 characters (strict), clearly demonstrating the word's meaning in a relatable, contemporary context.
- Etymology: Concise origin story mentioning source language and approximate time period, under 150 characters (strict), ending with a period.
- Use British English spelling (colour, organise, etc.).

Fill the provided JSON schema fields accordingly.
`
  }

  async find(date: string) {
    return await WotdEntries.findByOrFail('date', date)
  }

  async getToday() {
    return await this.find(this.todayISO())
  }

  async entriesInDateRange(start: DateTime, end: DateTime) {
    return await WotdEntries.query().whereBetween('date', [start.toISODate()!, end.toISODate()!])
  }

  async recentWordsToAvoid(days = WotdService.DEFAULT_AVOIDANCE_DAYS) {
    const end = DateTime.now()
    const start = end.minus({ days })
    const entries = await this.entriesInDateRange(start, end)
    return entries.map(({ word }) => word)
  }

  async store(date: string, wotd: Wotd) {
    return await WotdEntries.create({ date, ...wotd })
  }

  async storeToday() {
    const wotd = await this.generate()
    return await this.store(this.todayISO(), wotd)
  }

  async generate(): Promise<Wotd> {
    const avoidList = await this.recentWordsToAvoid()
    const instructions = this.buildPrompt(avoidList)

    const resp = await this.client.responses.parse({
      model: this.model,
      input: [
        {
          role: 'developer',
          content: [
            {
              type: 'input_text',
              text: instructions,
            },
          ],
        },
      ],
      text: {
        format: {
          type: 'json_schema',
          name: 'word_of_the_day',
          strict: true,
          schema: this.getWotdSchema(),
        },
        verbosity: 'medium',
      },
      reasoning: {
        effort: 'medium',
      },
      tools: [],
      store: true,
    })

    return resp.output_parsed! as Wotd
  }
}
