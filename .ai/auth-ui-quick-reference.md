# Authentication UI - Quick Reference

## 📁 Created Files

### Layouts
- ✅ `src/layouts/AuthLayout.astro` - Centered layout for auth pages

### UI Components (shadcn/ui)
- ✅ `src/components/ui/input.tsx` - Text input component
- ✅ `src/components/ui/label.tsx` - Form label component  
- ✅ `src/components/ui/dialog.tsx` - Modal dialog component

### Authentication Components
- ✅ `src/components/auth/LoginForm.tsx` - Login form
- ✅ `src/components/auth/RegisterForm.tsx` - Registration form
- ✅ `src/components/auth/ForgotPasswordForm.tsx` - Password reset request
- ✅ `src/components/auth/UpdatePasswordForm.tsx` - Password reset completion
- ✅ `src/components/auth/DeleteAccountDialog.tsx` - Account deletion dialog
- ✅ `src/components/auth/SignOutButton.tsx` - Logout button
- ✅ `src/components/auth/index.ts` - Barrel export
- ✅ `src/components/auth/README.md` - Full documentation

### Pages
- ✅ `src/pages/login.astro` - Login page (`/login`)
- ✅ `src/pages/register.astro` - Registration page (`/register`)
- ✅ `src/pages/forgot-password.astro` - Forgot password page (`/forgot-password`)
- ✅ `src/pages/update-password.astro` - Update password page (`/update-password`)

### Integration Examples
- ✅ `src/components/profile/AccountSettings.tsx` - Example integration for profile page

### Documentation
- ✅ `.ai/auth-ui-implementation-summary.md` - Complete implementation summary
- ✅ `.ai/auth-ui-quick-reference.md` - This file

## 🚀 Quick Start

### View the Pages

Start the dev server and visit:
```bash
npm run dev
```

- http://localhost:4321/login
- http://localhost:4321/register
- http://localhost:4321/forgot-password
- http://localhost:4321/update-password

### Use Components

```tsx
// Import individual components
import { LoginForm } from "@/components/auth/LoginForm";
import { SignOutButton } from "@/components/auth/SignOutButton";

// Or use barrel export
import { LoginForm, SignOutButton } from "@/components/auth";

// In Astro pages
<LoginForm client:load />

// In React components
<SignOutButton variant="outline" size="sm" />
```

### Integrate with Backend

```tsx
// Example: Connect LoginForm to API
async function handleLogin(email: string, password: string) {
  const response = await fetch("/api/auth/signin", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  
  if (!response.ok) throw new Error("Login failed");
  window.location.href = "/";
}

<LoginForm onSubmit={handleLogin} client:load />
```

## 📋 Validation Rules

### Email
- Required
- Must match: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`

### Password (Registration & Update)
- Required
- Minimum 8 characters
- At least 1 digit
- At least 1 special character: `!@#$%^&*()_+-=[]{}|;:'",.<>/?`

### Delete Account Confirmation
- Must type exactly: `USUŃ`
- Or enter password (if `usePasswordConfirmation={true}`)

## 🎨 Component Props

### LoginForm
```tsx
interface LoginFormProps {
  onSubmit?: (email: string, password: string) => Promise<void>;
}
```

### RegisterForm
```tsx
interface RegisterFormProps {
  onSubmit?: (email: string, password: string) => Promise<void>;
}
```

### ForgotPasswordForm
```tsx
interface ForgotPasswordFormProps {
  onSubmit?: (email: string) => Promise<void>;
}
```

### UpdatePasswordForm
```tsx
interface UpdatePasswordFormProps {
  onSubmit?: (password: string) => Promise<void>;
}
```

### DeleteAccountDialog
```tsx
interface DeleteAccountDialogProps {
  onDelete?: (confirmationText: string) => Promise<void>;
  usePasswordConfirmation?: boolean; // default: false
}
```

### SignOutButton
```tsx
interface SignOutButtonProps {
  onSignOut?: () => Promise<void>;
  showIcon?: boolean; // default: true
  children?: React.ReactNode; // default: "Wyloguj się"
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
}
```

## 🔗 Next Steps

1. **Backend API** - Implement `/api/auth/*` endpoints
2. **Middleware** - Add route protection and session management
3. **Supabase** - Connect to Supabase Auth
4. **Testing** - Add unit and integration tests
5. **Profile Integration** - Add AccountSettings to profile page

## 📚 Documentation

- Full docs: `src/components/auth/README.md`
- Specification: `.ai/auth-spec.md`
- Summary: `.ai/auth-ui-implementation-summary.md`

## ✅ Status

- **UI Components**: ✅ Complete
- **Pages**: ✅ Complete
- **Documentation**: ✅ Complete
- **Linter Errors**: ✅ None
- **Backend**: ⏳ Pending
- **Middleware**: ⏳ Pending
- **Testing**: ⏳ Pending
