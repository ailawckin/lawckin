# Lawckin - Legal Marketplace Platform

A modern platform connecting clients with verified lawyers, built with React, TypeScript, and Supabase.

## Features

- Multi-country support (New York and Switzerland)
- Client search by practice area, location, and specific legal needs
- Lawyer profiles with expertise, availability, and pricing
- Booking system for consultations
- Admin panel for platform management

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account and project
- Google Maps API key (for address autocomplete)

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd lawckin-main
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

```bash
cp .env.example .env
```

Edit `.env` and add:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_GOOGLE_MAPS_API_KEY` (optional, for address autocomplete)
- `VITE_COUNTRY` (see Country Configuration below)

4. Run the development server:

```bash
npm run dev
```

## Country Configuration

Lawckin supports multiple countries via the `VITE_COUNTRY` environment variable.

### Supported Countries

- `nyc` (default): New York, USA
  - Currency: USD ($)
  - Locale: en-US
  - Service areas: Manhattan, Brooklyn, Queens, Bronx, Staten Island, etc.

- `ch`: Switzerland
  - Currency: CHF
  - Locale: de-CH (German), fr-CH (French), en-US (fallback)
  - Service areas: Zurich, Geneva, Basel, Bern, Lausanne, etc.

### Switching Countries

Default (NYC):

```bash
npm run dev
# or explicitly:
VITE_COUNTRY=nyc npm run dev
```

Switzerland:

```bash
VITE_COUNTRY=ch npm run dev
```

Build for specific country:

```bash
VITE_COUNTRY=ch npm run build
```

### Country-Specific Configuration

Country configuration lives in `src/config/country.ts`. Each country includes:
- Display name and locale
- Currency and timezone
- Map center and bounds
- Service areas
- Contact information
- Legal text and copy
- Feature flags

To add a new country:
1. Add a new country code type in `src/config/country.ts`
2. Create a new config object following the `CountryConfig` interface
3. Update the `getCountryCode()` function to recognize the new code
4. Add the country to this README

## Project Structure

```
src/
├── config/
│   └── country.ts
├── components/
│   ├── admin/
│   ├── client/
│   ├── lawyer/
│   └── ui/
├── pages/
├── hooks/
├── lib/
└── integrations/
    └── supabase/
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run seed:test` - Seed test data
- `npm run cleanup:test` - Clean up test data

## Docs

- `docs/setup-deploy.md` — setup, migrations, deployment
- `docs/admin-ops.md` — admin access and troubleshooting
- `docs/testing.md` — test data and QA checklist
- `docs/archive/` — legacy notes and historical docs

## Environment Variables

See `.env.example` for all required environment variables.

### Required
- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_PUBLISHABLE_KEY` - Your Supabase anon/public key

### Optional
- `VITE_COUNTRY` - Country code (`nyc` or `ch`), defaults to `nyc`
- `VITE_GOOGLE_MAPS_API_KEY` - For address autocomplete functionality

## Database Migrations

Migrations are in `supabase/migrations/`. Apply them using:

```bash
supabase db push
```

Or via the Supabase Dashboard SQL editor.

## Contributing

1. Create a feature branch from `main`
2. Make your changes
3. Run `npm run lint`
4. Submit a pull request

## License

See LICENSE for details.
