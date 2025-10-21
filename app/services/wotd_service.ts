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

  constructor() {
    this.client = new OpenAI({ apiKey: env.get('OPENAI_API_KEY') })
    this.model = 'gpt-5-nano'
  }

  /** Get YYYY-MM-DD in Europe/London */
  private todayISO(): string {
    return DateTime.now().setZone('Europe/London').toISODate()!
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

  async recentWordsToAvoid(days = 60) {
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

    const avoidancePrompt = `## Avoidance List
Do not use any of the following words.
${avoidList.join(', ')}
`

    const resp = await this.client.responses.parse({
      model: this.model,
      input: [
        {
          role: 'developer',
          content: [
            {
              type: 'input_text',
              text: `# Role and Objective
Create an engaging "Word of the Day" feature that educates a broad audience, presenting all elements in a structured JSON format.

# Instructions
- Select an interesting, moderately uncommon English word that would appeal to and educate a broad audience.
- Avoid using any words included in the provided avoidance list to prevent duplicates (if such a list is supplied).
- Identify its part of speech (e.g., noun, verb, adjective).
- Write a clear, modern definition (15-120 characters) that avoids outdated phrases and ambiguous terms.
- Provide an original, contextual example sentence (20-200 characters).
- Add a succinct etymology (one sentence, under 150 characters, ending with a period).
- Use standard UK-neutral spelling conventions.
- Avoid neologisms unless historically established.
- Do not include profanity or slurs.
- Strictly follow the provided JSON schema for output.

# Approach Checklist
Begin with a concise checklist (3-7 bullets) of what you will do; keep items conceptual, not implementation-level.
- Choose a word that is moderately uncommon and interesting.
- Verify part of speech and ensure accuracy; use complete, standard grammatical terms without truncation.
- Write a precise, modern definition within specified length constraints, avoiding jargon.
- Draft an original, contextually appropriate example sentence.
- Summarise etymology succinctly in a single sentence.
- Format output precisely as defined in the JSON schema.

${avoidancePrompt}

# Output Format
Produce a single JSON object with the following fields, in order:
- "word"
- "part_of_speech"
- "definition"
- "example_sentence"
- "etymology"

Ensure all string values comply with specified length and content constraints.
Include an # Output Format section specifying exact fields and types:
# Output Format
{
  "word": string,
  "part_of_speech": string,
  "definition": string,
  "example_sentence": string,
  "etymology": string
}

# Stop Conditions
- Generation is complete when a valid JSON object matching the schema and all content guidelines is produced.

(Mandate: Output only the "Word of the Day" entry in the required JSON format.)`,
            },
          ],
        },
      ],
      text: {
        format: {
          type: 'json_schema',
          name: 'word_of_the_day',
          strict: true,
          schema: {
            type: 'object',
            properties: {
              word: {
                type: 'string',
                description: 'A single vocabulary word.',
                minLength: 3,
                maxLength: 15,
              },
              part_of_speech: {
                type: 'string',
                description: "The word's grammatical role.",
                minLength: 3,
                maxLength: 12,
              },
              definition: {
                type: 'string',
                description: 'Concise dictionary-style definition.',
                minLength: 15,
                maxLength: 120,
              },
              example_sentence: {
                type: 'string',
                description: 'Natural example of correct word usage.',
                minLength: 20,
                maxLength: 200,
              },
              etymology: {
                type: 'string',
                description: 'Short origin/history of the word.',
                minLength: 15,
                maxLength: 150,
              },
            },
            required: ['word', 'part_of_speech', 'definition', 'example_sentence', 'etymology'],
            additionalProperties: false,
          },
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
