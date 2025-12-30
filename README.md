# Interlexical

Your daily word exploration app. A Progressive Web Application that delivers a new vocabulary word every day, complete with pronunciation, definition, etymology, and example usage.

**Live site**: [interlexical.app](https://interlexical.app)

## Getting Started

Interlexical is built with AdonisJS v6 and uses PostgreSQL for data storage. Words are generated using OpenAI's GPT-5-nano model with British English pronunciation support.

### Prerequisites

- Node.js 18+ (LTS recommended)
- PostgreSQL 14+
- pnpm package manager
- OpenAI API key

### Installation

1. Clone the repository

   ```bash
   git clone https://github.com/AJ-Murphy/interlexical.git
   cd interlexical
   ```

2. Install dependencies

   ```bash
   pnpm install
   ```

3. Set up environment variables

   ```bash
   cp .env.example .env
   ```

4. Edit `.env` and configure the following:

   ```env
   APP_KEY=<generate with: node ace generate:key>
   NODE_ENV=development

   # OpenAI API
   OPENAI_API_KEY=<your-openai-api-key>

   # PostgreSQL Database
   PG_HOST=localhost
   PG_NAME=<your-db-name>
   PG_USER=<your-user>
   PG_PASSWORD=<your-password>
   PG_PORT=5432
   ```

5. Set up PostgreSQL database with Docker

   ```bash
   # Pull PostgreSQL image
   docker pull postgres

   # Start PostgreSQL container
   docker run --name interlexical -p 5432:5432 \
     -e POSTGRES_USER=<your-user> \
     -e POSTGRES_PASSWORD=<your-password> \
     -d postgres

   # Create the database
   docker exec -i interlexical psql -U <your-user> -c "CREATE DATABASE <your-db-name>;"
   ```

6. Run migrations

   ```bash
   node ace migration:fresh
   ```

7. (Optional) Seed the database with 15 days of sample data
   ```bash
   node ace db:seed
   ```

## Usage

### Development Server

Start the development server with hot module reloading:

```bash
pnpm dev
```

Visit http://localhost:3333

### Generate Today's Word

Manually generate a word for today:

```bash
node ace generate:wotd
```

This command generates a new word using OpenAI, stores it in the database for today's date (Europe/London timezone), and avoids repeating words from the last 60 days.

### Testing

Run the full test suite with coverage:

```bash
pnpm test
```

### Production Build

Build the application for production:

```bash
pnpm build
pnpm start
```

### Docker

Build and run with Docker:

```bash
docker build -t interlexical .
docker run -p 8080:8080 --env-file .env interlexical
```

## Deployment

### Server

- **Production**: Set `NODE_ENV=production` and configure PostgreSQL connection
- **Cron Job**: Schedule `node ace generate:wotd` to run daily at midnight London time

## Additional Documentation and Acknowledgments

### Tech Stack

- Backend: AdonisJS v6 (Node.js/TypeScript)
- Database: PostgreSQL
- Frontend: Edge.js templates, Vite, Open Props CSS
- AI: OpenAI API (GPT-5-nano)
- PWA: VitePWA with service worker
- Testing: Japa test runner

### Acknowledgments

- Built with [AdonisJS](https://adonisjs.com)
- Word generation powered by [OpenAI](https://openai.com)
- Styled with [Open Props](https://open-props.style)
- Icons from [Mono Icons](https://github.com/mono-company/mono-icons)
- Color scheme from [Baldur Neon Darkness](https://lospec.com/palette-list/baldur-neon-darkness)

### License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
