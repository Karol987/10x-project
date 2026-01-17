# Layout User Menu Implementation

## Overview

Extended `Layout.astro` with user state verification and logout functionality for authenticated users.

## Implementation Details

### 1. Logout API Endpoint

**File:** `src/pages/api/auth/logout.ts`

- Server-side endpoint using `POST` method (following Astro guidelines)
- Uses `createSupabaseServerInstance` for proper SSR cookie handling
- Calls `supabase.auth.signOut()` to invalidate the session
- Returns appropriate status codes and error messages

### 2. UserMenu React Component

**File:** `src/components/layout/UserMenu.tsx`

Features:
- Dropdown menu with user email display
- Profile settings navigation
- Logout functionality with loading state
- Click-outside-to-close behavior
- Accessible with ARIA attributes
- Optimized with `useCallback` hooks to prevent unnecessary re-renders
- Uses `lucide-react` icons for consistent UI

### 3. Updated Layout

**File:** `src/layouts/Layout.astro`

Changes:
- Added user state verification via `Astro.locals.user` (set by middleware)
- Conditional header rendering for authenticated users
- Integrated `UserMenu` component with `client:load` directive
- Added navigation links (Home, Profile)
- Optional `showHeader` prop to control header visibility

### Props

```typescript
interface Props {
  title?: string;
  showHeader?: boolean; // Default: true
}
```

## Usage

### In Astro Pages

```astro
---
import Layout from '../layouts/Layout.astro';
---

<Layout title="My Page">
  <main>
    <!-- Your content -->
  </main>
</Layout>
```

### Hide Header on Specific Pages

```astro
<Layout title="Login" showHeader={false}>
  <!-- Login form without header -->
</Layout>
```

## User Flow

1. **Authenticated User:**
   - Header is displayed with navigation and user menu
   - User can click on their email to open dropdown
   - Options: Profile Settings, Logout

2. **Logout Process:**
   - User clicks "Wyloguj się"
   - POST request to `/api/auth/logout`
   - Session is invalidated server-side
   - User is redirected to `/auth/login`

3. **Unauthenticated User:**
   - Header is not displayed
   - Middleware redirects to login page (except for public paths)

## Security

- Logout is handled server-side via API endpoint
- Uses SSR-aware Supabase client with proper cookie management
- Follows `@supabase/ssr` best practices
- All auth operations use `getAll` and `setAll` cookie methods

## Styling

- Uses Tailwind CSS classes
- Follows shadcn/ui design patterns
- Responsive design (mobile-friendly)
- Smooth transitions and animations

## Error Handling

- Network errors are caught and displayed to user
- Failed logout attempts show alert message
- Loading states prevent multiple simultaneous logout requests
