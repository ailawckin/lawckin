# Repository Guidelines

## Project Structure & Module Organization
Application code lives in `src`, with route-level screens in `src/pages`, reusable UI in `src/components`, and shared hooks and helpers in `src/hooks` and `src/lib`. Supabase integration lives under `src/integrations/supabase`, backed by SQL definitions in `supabase/functions` and migrations in `supabase/migrations`. Static assets reside in `public`, while Vite, Tailwind, and TypeScript configs sit at the repo root. Keep new domain-specific modules close to their consumers to reduce import depth.

## Build, Test, and Development Commands
Use `npm install` once to sync dependencies. Run `npm run dev` for the Vite development server, and `npm run build` to produce an optimized bundle under `dist`. Verify the production bundle locally with `npm run preview`. Lint the TypeScript and JSX surface with `npm run lint`; address warnings before committing.

## Coding Style & Naming Conventions
We write modern TypeScript with React 18 and shadcn-ui components. Follow the default ESLint and TypeScript rules (see `eslint.config.js`), adhere to 2-space indentation, and prefer explicit return types for exported functions. Name React components with PascalCase, hooks with a `use` prefix, and shared utilities in camelCase. Tailwind classes should stay in JSX; extract repeated styling into shadcn component variants rather than custom CSS.

## Testing Guidelines
Automated tests are not yet in place. When adding coverage, prefer Vitest with React Testing Library and colocate specs beside the component as `<ComponentName>.test.tsx`. Name test suites after the component behavior under test and ensure critical flows (auth, dashboards, booking) have coverage. Until the suite exists, perform smoke checks against `npm run lint` and key user journeys in the browser before opening a PR.

## Environment & Configuration Tips
Supabase requires `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` in your `.env` (see `src/integrations/supabase/client.ts`). Never commit real credentials; rely on `.env.example` if you create one. Tailwind tokens live in `tailwind.config.ts`; add design primitives there before consuming them in components.

## Commit & Pull Request Guidelines
The history follows Conventional Commits (`feat`, `fix`, `style`, etc.). Write clear, present-tense subjects and include scope when helpful (e.g., `feat(admin): add revenue graph`). For pull requests, link the relevant issue, summarize the change, list screenshots or recordings for UI updates, and call out any Supabase migration or config steps needed during deployment.
