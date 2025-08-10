import WotdEntries from '#models/wotd_entries'
import { DateTime } from 'luxon'
import OpenAI from 'openai'

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
    this.client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
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

  async store(date: string, wotd: Wotd) {
    return await WotdEntries.create({ date, ...wotd })
  }

  async storeToday() {
    const wotd = await this.generate()
    return await this.store(this.todayISO(), wotd)
  }

  async generate(): Promise<Wotd> {
    const resp = await this.client.responses.parse({
      model: this.model,
      input: [
        {
          role: 'developer',
          content: [
            {
              type: 'input_text',
              text: `# Role and Objective
Generate an engaging and educational "Word of the Day" entry that includes the word, its part of speech, a clear and concise definition, an original example sentence, and a brief etymology. The entry should be suitable for a general audience and output as structured JSON.

# Instructions
- Select an interesting, moderately uncommon English word that would appeal to and educate a broad audience.
- Identify the word's part of speech (such as noun, verb, adjective).
- Write a clear, concise, and accurate definition.
- Create an original example sentence that uses the word naturally and contextually.
- Write a brief etymology or origin of the word, informed by credible sources.

## Constraints
- Use standard UK-neutral spelling.
- Avoid neologisms unless they are historically attested.
- Do not include profanity or slurs.
- Ensure the output strictly adheres to the specified JSON schema.

# Procedure
Begin with a concise checklist (3-7 bullets) outlining your approach before generating the entry; keep items conceptual, not implementation-level.

# Output Format
Return the result as JSON using these keys:
{
  "word": [string],
  "part_of_speech": [string],
  "definition": [string],
  "example_sentence": [string],
  "etymology": [string]
}

After generating the entry, validate in 1-2 lines that all JSON fields are present and conform to the requested output format; do not produce any output except the final JSON object.

# Additional Details
- No user input is required; simply generate the word of the day.

# Stop Conditions
- End output after producing a single, fully-formed JSON object as described in the schema.

(Mandate: Generate an appealing and educational "Word of the Day" entry, comprising the word, part of speech, definition, example sentence, and etymology in the specified JSON format only.)`,
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
                description: 'A single vocabulary word. Recommended length: 3-15 characters.',
                minLength: 3,
                maxLength: 15,
              },
              part_of_speech: {
                type: 'string',
                description: "The word's grammatical role (e.g., noun, verb, adjective).",
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
                maxLength: 180,
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
