# Streamly_

[![version](https://img.shields.io/badge/version-0.0.1-blue.svg)](../../releases)

Streamly is a responsive web application that eliminates decision paralysis for users subscribed to multiple SVOD platforms. It aggregates movies and series available across your paid subscriptions and filters them through your favourite creators (actors, directors) so that you can find something to watch in seconds instead of minutes.

---

## Table of Contents

1. [Tech Stack](#tech-stack)
2. [Getting Started Locally](#getting-started-locally)
3. [Available Scripts](#available-scripts)
4. [Project Scope](#project-scope)
5. [Project Status](#project-status)
6. [License](#license)

---

## Tech Stack

### Frontend

- **Astro 5** – lightning-fast static site generator
- **React 19** – interactive components when needed
- **TypeScript 5** – first-class static typing
- **Tailwind CSS 4** – utility-first styling
- **shadcn/ui** – accessible React component library

### Backend

- **Supabase** – PostgreSQL + Auth + Edge Functions
- **@supabase/supabase-js 2.x** SDK for client & server communication

### External Services

- **Movie of the Night API** – primary catalogue data
- **TMDB API** – supplementary metadata via Supabase Edge Function

### Dev & Ops

- **GitHub Actions** – CI/CD pipelines
- **Docker** – containerisation
- **DigitalOcean** – hosting
- **ESLint / Prettier / Husky / lint-staged** – DX & code quality

### Testing

- **Vitest** – unit & integration tests
- **React Testing Library** – component testing
- **Playwright** – end-to-end tests
- **MSW (Mock Service Worker)** – API mocking

---

## Getting Started Locally

### Prerequisites

- **Node.js 22.14.0** (see `.nvmrc`)
- **npm** built-in with Node 22

### Setup

1. **Clone the repository**

   ```bash
   git clone https://github.com/your-org/streamly.git
   cd 10x-project
   ```

2. **Install the correct Node version** (with [nvm](https://github.com/nvm-sh/nvm))

   ```bash
   nvm use
   ```

3. **Install dependencies**

   ```bash
   npm install
   ```

4. **Configure environment variables**
   Duplicate `.env.example` → `.env.local` and fill in the values:

   ```env
   PUBLIC_SUPABASE_URL=your_supabase_url
   PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   MOVIE_API_KEY=your_movie_api_key
   ```

5. **Run the development server**

   ```bash
   npm run dev
   ```

   Open `http://localhost:3000` in your browser.

---

## Available Scripts

| Script | Description |
|--------|-------------|
| `dev` | Start the development server with hot reload |
| `build` | Build the project for production |
| `preview` | Preview the production build locally |
| `astro` | Run Astro CLI commands directly |
| `lint` | Lint the codebase with ESLint |
| `lint:fix` | Auto-fix lint errors |
| `format` | Format the codebase with Prettier |

---

## Project Scope

### Included in MVP

- User authentication (register, login, reset password, delete account)
- Mandatory two-step onboarding (choose platforms, add favourite creators)
- Aggregated recommendation feed (SVOD only) sorted by release date
- Infinite scroll up to 50 items
- Mark title as watched & watch history
- Profile management for platforms & creators
- Responsive UI across devices

### Excluded from MVP

- Advanced filters (genre, ratings, etc.)
- Detailed movie/series pages
- User ratings, reviews, social interactions
- Push / email notifications
- Deep-links to external streaming apps
- Transactional content (TVOD / EST)

---

## Project Status

`0.0.1` • **Early Development** – core architecture in place, implementing MVP features. See the [Product Requirements Document](.ai/prd.md) for full details and the [Tech Stack](.ai/tech-stack.md) for rationale.

---

## License

This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for details.
