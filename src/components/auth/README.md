# Authentication UI Components

This directory contains all authentication-related UI components for the Streamly application. These components handle the frontend presentation layer only and do not include backend logic or state management.

## 📋 Table of Contents

- [Components Overview](#components-overview)
- [Pages](#pages)
- [Usage Examples](#usage-examples)
- [Features](#features)
- [Integration Notes](#integration-notes)

## 🧩 Components Overview

### LoginForm

Login form with email and password fields.

**Features:**
- Email format validation
- Required field validation
- Error handling with user-friendly messages
- Loading states
- Links to registration and password reset
- Accessibility support (ARIA labels, error announcements)

**Props:**
```typescript
interface LoginFormProps {
  onSubmit?: (email: string, password: string) => Promise<void>;
}
```

### RegisterForm

Registration form with email, password, and password confirmation fields.

**Features:**
- Email format validation
- Password strength requirements (min 8 chars, digit, special character)
- Real-time password strength indicators
- Password confirmation matching
- Error handling
- Loading states
- Link to login page
- Accessibility support

**Props:**
```typescript
interface RegisterFormProps {
  onSubmit?: (email: string, password: string) => Promise<void>;
}
```

### ForgotPasswordForm

Password reset initiation form.

**Features:**
- Email validation
- Success state with confirmation message
- Error handling
- Loading states
- Back to login navigation
- Accessibility support

**Props:**
```typescript
interface ForgotPasswordFormProps {
  onSubmit?: (email: string) => Promise<void>;
}
```

### UpdatePasswordForm

Password update form for completing password reset (accessed via email link).

**Features:**
- Password strength validation
- Real-time password strength indicators
- Password confirmation matching
- Success state with redirect to login
- Error handling (including expired token scenarios)
- Loading states
- Accessibility support

**Props:**
```typescript
interface UpdatePasswordFormProps {
  onSubmit?: (password: string) => Promise<void>;
}
```

### DeleteAccountDialog

Modal dialog for account deletion with confirmation requirement.

**Features:**
- Confirmation via text input ("USUŃ") or password
- Detailed warning about data loss
- List of data that will be deleted
- Error handling
- Loading states
- Destructive action styling
- Accessibility support

**Props:**
```typescript
interface DeleteAccountDialogProps {
  onDelete?: (confirmationText: string) => Promise<void>;
  usePasswordConfirmation?: boolean; // Default: false
}
```

### SignOutButton

Button component for user logout.

**Features:**
- Customizable appearance (variant, size)
- Optional icon display
- Loading states
- Automatic redirect to login page
- Error handling with fallback redirect

**Props:**
```typescript
interface SignOutButtonProps extends VariantProps<typeof buttonVariants> {
  onSignOut?: () => Promise<void>;
  showIcon?: boolean; // Default: true
  children?: React.ReactNode; // Default: "Wyloguj się"
}
```

## 📄 Pages

All authentication pages use the `AuthLayout` which provides:
- Centered card layout
- Minimal design focused on the form
- Responsive design
- Consistent styling

### Available Pages

- `/login` - Login page
- `/register` - Registration page
- `/forgot-password` - Password reset initiation
- `/update-password` - Password reset completion (from email link)

## 💡 Usage Examples

### Basic Usage (Mock Mode)

All components work in "mock mode" by default (without `onSubmit` prop):

```tsx
import { LoginForm } from "@/components/auth";

// Component will log to console and simulate API call
<LoginForm client:load />
```

### With API Integration

```tsx
import { LoginForm } from "@/components/auth";

async function handleLogin(email: string, password: string) {
  const response = await fetch("/api/auth/signin", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  
  if (!response.ok) {
    throw new Error("Login failed");
  }
  
  // Redirect on success
  window.location.href = "/";
}

<LoginForm onSubmit={handleLogin} client:load />
```

### Integrating DeleteAccountDialog in Profile

```tsx
import { AccountSettings } from "@/components/profile/AccountSettings";

// In ProfileContainer.tsx, add after other sections:
<div className="border-t border-border" />
<AccountSettings userEmail={user.email} />
```

### Using SignOutButton in Header

```tsx
import { SignOutButton } from "@/components/auth";

// In navigation/header component:
<SignOutButton variant="ghost" size="sm" />
```

## ✨ Features

### Validation

All forms include comprehensive client-side validation:

- **Email**: Format validation using regex
- **Password**: 
  - Minimum 8 characters
  - At least one digit
  - At least one special character
- **Confirmation**: Matching validation for password fields

### User Feedback

- **Inline errors**: Field-level error messages
- **General errors**: Top-level error alerts for API failures
- **Success states**: Confirmation screens for completed actions
- **Loading states**: Visual feedback during async operations

### Accessibility

- Semantic HTML structure
- ARIA labels and descriptions
- Error announcements with `role="alert"` and `aria-live="assertive"`
- Keyboard navigation support
- Focus management
- Proper input autocomplete attributes

### Security

- Password fields use `type="password"`
- Proper autocomplete attributes (`current-password`, `new-password`)
- No password values logged or exposed
- Confirmation required for destructive actions

### Responsive Design

- Mobile-first approach
- Adapts to all screen sizes
- Touch-friendly interactive elements
- Optimized for both desktop and mobile experiences

## 🔗 Integration Notes

### Backend Integration

When integrating with backend APIs, implement the `onSubmit` / `onDelete` / `onSignOut` callbacks:

1. **Login/Register**: Call `/api/auth/signin` or `/api/auth/register`
2. **Password Reset**: Call `/api/auth/reset-password` (forgot) and `/api/auth/update-password` (update)
3. **Delete Account**: Call `/api/auth/delete` with proper authentication
4. **Sign Out**: Call `/api/auth/signout` and clear session

### Middleware Requirements

The specification expects middleware to:

- Redirect authenticated users away from auth pages (`/login`, `/register`)
- Redirect unauthenticated users to `/login` from protected pages
- Validate password reset tokens on `/update-password`
- Enforce onboarding flow completion

### State Management

These components are stateless and don't manage application state. They:

- Accept callbacks for actions
- Handle their own form state
- Display loading/error states based on async operations
- Don't persist data or manage sessions

### Styling

Components use:

- Tailwind CSS for styling
- shadcn/ui components (`Button`, `Card`, `Input`, `Label`, `Dialog`)
- Lucide React for icons
- `class-variance-authority` for variant management
- Dark mode support via Tailwind's `dark:` prefix

## 🎨 Customization

### Changing Text

All user-facing text is in Polish. To change language or text:

1. Modify strings directly in component files
2. Or create a translation system using i18n

### Styling Adjustments

Components use Tailwind classes. To customize:

1. Modify classes in component files
2. Update theme in `tailwind.config.js`
3. Customize shadcn/ui components in `src/components/ui/`

### Validation Rules

To change validation rules:

1. Modify validation functions in each component
2. Update error messages accordingly
3. Update password requirements display

## 📚 Related Documentation

- [Authentication Specification](/.ai/auth-spec.md)
- [Astro Guidelines](/.cursor/rules/astro.mdc)
- [React Guidelines](/.cursor/rules/react.mdc)
- [shadcn/ui Documentation](https://ui.shadcn.com)

## 🚀 Next Steps

After implementing these UI components, the next steps are:

1. Implement backend API endpoints (`/api/auth/*`)
2. Set up Supabase authentication
3. Implement middleware for route protection
4. Connect forms to real API endpoints
5. Add session management
6. Implement onboarding flow enforcement
7. Add comprehensive testing
