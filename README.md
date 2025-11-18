# Streamly

## Overview

Streamly is a responsive web application (RWD) designed to solve decision paralysis for users subscribed to multiple streaming platforms (SVOD). The application aggregates movies and TV series available across your subscribed services in one place, filtered by your favorite creators (actors, directors). The main goal is to significantly reduce the time needed to find an interesting title to watch and eliminate the frustration of manually searching through each platform individually.

## Problem Statement

Users with access to multiple streaming services such as Netflix, Disney+, or HBO Max often face a difficult choice when selecting what to watch. To find content featuring their favorite actor or director, they are forced to manually search through each platform's library. This process is time-consuming, inefficient, and frustrating, often resulting in users abandoning their original intent and choosing a random title from one platform's home screen, leading to wasted time and dissatisfaction.

## Table of Contents

- [Tech Stack](#tech-stack)
- [Features](#features)
- [Getting Started](#getting-started)
- [Available Scripts](#available-scripts)
- [Project Scope](#project-scope)
- [Project Status](#project-status)
- [License](#license)

## Tech Stack

### Frontend
- **Astro 5** - Fast, lightweight static site generator with minimal JavaScript
- **React 19** - Interactive components and dynamic UI elements
- **TypeScript 5** - Static type checking for code quality and IDE support
- **Tailwind CSS 4** - Utility-first CSS framework for styling
- **Shadcn/ui** - Accessible component library built on Radix UI

### Backend
- **Supabase** - Backend-as-a-Service solution providing:
  - PostgreSQL database
  - User authentication and authorization
  - Edge Functions for secure server-side operations
  - API integration with external services

### External Services
- **Movie of the Night API** - External API for movies and TV series data
- **TMDB API** - Additional movie database integration (via Supabase Edge Functions)

### DevOps & Deployment
- **GitHub Actions** - CI/CD pipeline automation
- **Docker** - Containerization
- **DigitalOcean** - Hosting and deployment

### Development Tools
- **ESLint** - Code linting and quality
- **Prettier** - Code formatting
- **Husky** - Git hooks
- **lint-staged** - Pre-commit linting

## Features

### MVP Features Included
- **User Accounts**: Registration, login, password reset, and account deletion (GDPR compliant)
- **Onboarding**: Mandatory two-step setup for selecting streaming platforms and favorite creators
- **Recommendations**: Aggregated, sorted list of movies and TV series matching your criteria
- **Infinite Scroll**: Load up to 50 recommendations dynamically
- **Mark as Watched**: Remove titles from recommendations and track viewing history
- **Profile Management**: Edit streaming platforms, manage favorite creators, view watched history
- **Responsive Design**: Fully responsive web application optimized for all devices

### Features Excluded from MVP
- Advanced filtering and sorting (by genre, ratings, etc.)
- Detailed movie/series pages
- Rating and review system
- Social features
- Push notifications
- Movie posters on recommendation lists
- Direct links to streaming platforms
- Content outside subscriptions (TVOD/EST)

## Getting Started

### Prerequisites

- **Node.js**: 22.14.0 (specified in `.nvmrc`)
- **npm**: Comes with Node.js

### Local Development Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd 10x-project
   ```

2. **Install Node.js version**
   If using NVM (Node Version Manager):
   ```bash
   nvm use
   ```

3. **Install dependencies**
   ```bash
   npm install
   ```

4. **Configure environment variables**
   Create a `.env.local` file in the project root with:
   ```env
   PUBLIC_SUPABASE_URL=your_supabase_url
   PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   MOVIE_API_KEY=your_movie_api_key
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```
   The application will be available at `http://localhost:3000`

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start the development server with hot reload |
| `npm run build` | Build the project for production |
| `npm run preview` | Preview the production build locally |
| `npm run astro` | Run Astro CLI commands directly |
| `npm run lint` | Check code quality with ESLint |
| `npm run lint:fix` | Fix linting issues automatically |
| `npm run format` | Format code with Prettier |

## Project Scope

### Included in MVP
- Complete user authentication system (registration, login, password reset, account deletion)
- Two-step onboarding process with platform and creator selection
- Responsive main feed with aggregated recommendations
- Infinite scroll pagination for recommendations
- Profile management interface
- Watch history tracking
- Full GDPR compliance for data deletion

### Excluded from MVP
- Social features and user interactions
- Advanced analytics and recommendations engine
- Mobile-specific native features
- API integrations beyond Movie of the Night and TMDB
- Real-time notifications
- Third-party service integrations
- Premium features or monetization

## Project Status

**Version**: 0.0.1 (Early Development)

This project is in active development. The MVP features are currently being implemented. The application structure follows Astro best practices with a clear separation between static content and interactive React components.

### Project Structure
```
src/
├── layouts/           # Astro layout components
├── pages/             # Astro page routes
├── pages/api/         # API endpoints
├── middleware/        # Astro middleware
├── components/        # React and Astro components
├── components/ui/     # Shadcn/ui components
├── db/                # Supabase clients and types
├── lib/               # Services and helper functions
├── types.ts           # Shared types and DTOs
└── assets/            # Static internal assets
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.

---

**For more information:**
- Visit our [Project Documentation](#) (if available)
- Check out the [Product Requirements Document](.ai/prd.md) for detailed feature specifications
- Review [Technical Stack Details](.ai/tech-stack.md)
