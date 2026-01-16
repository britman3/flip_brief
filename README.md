# Flip Brief Generator

AI-powered one-page property flip briefs for UK investors. Enter your criteria and receive a downloadable PDF with location recommendations, deal maths, risks, and actionable next steps.

## Features

- **4-step wizard** with 14 questions covering location, budget, strategy, and preferences
- **AI-generated briefs** using Claude for UK property market analysis
- **Top 3 recommended areas** with postcode sectors and confidence ratings
- **Quick deal maths** including purchase, refurb, costs, profit, and ROI estimates
- **Risk assessment** with severity ratings and checks to investigate
- **Search keywords** and agent call script for deal sourcing
- **One-page PDF export** designed for easy printing and sharing

## Tech Stack

- **Framework**: Next.js 16 with App Router
- **Styling**: Tailwind CSS v4
- **AI**: Anthropic Claude API
- **PDF**: pdf-lib
- **Validation**: Zod
- **Storage**: JSON file-based (development), can be swapped for database

## Getting Started

### Prerequisites

- Node.js 18+
- Anthropic API key

### Installation

1. Clone the repository:
```bash
git clone https://github.com/britman3/flip_brief.git
cd flip_brief
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.example .env
```

4. Add your Anthropic API key to `.env`:
```
ANTHROPIC_API_KEY=your-api-key-here
```

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
src/
├── app/
│   ├── api/brief/          # API routes for brief generation
│   ├── create/             # Wizard page
│   ├── result/[id]/        # Results page
│   ├── globals.css         # Tailwind styles
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Home page
├── lib/
│   ├── db.ts               # JSON file storage
│   ├── llm.ts              # Claude API integration
│   ├── pdf-generator.ts    # PDF generation with pdf-lib
│   └── schema.ts           # Zod schemas and types
data/                       # JSON storage (gitignored)
```

## API Endpoints

- `POST /api/brief` - Create new brief (triggers AI generation)
- `GET /api/brief/[id]` - Get brief by ID
- `GET /api/brief/[id]/pdf` - Download brief as PDF

## Deployment

### Build for production:
```bash
npm run build
npm start
```

### Environment variables for production:
- `ANTHROPIC_API_KEY` - Required for AI brief generation

## Disclaimer

This tool provides estimates based on AI analysis. Always verify with sold comps and professional advice before making offers on properties.

## License

Created by Property Know How.
