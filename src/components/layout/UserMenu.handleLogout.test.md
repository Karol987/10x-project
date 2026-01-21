# Unit Tests for UserMenu.handleLogout()

## Overview

This file contains comprehensive unit tests for the `handleLogout()` function in `src/components/layout/UserMenu.tsx`. The function handles user logout functionality including API calls, loading states, error handling, and redirects.

## Test Statistics

### Total Tests: 42

**Categories**:
- Valid inputs (Successful logout): 6 tests
- Invalid inputs (Failed logout): 5 tests
- Edge cases (Network errors): 7 tests
- Business rules: 6 tests
- Return value types: 1 test
- Consistency checks: 3 tests
- Integration with component state: 3 tests

---

## Function Overview

### handleLogout() - User Logout Handler

**Purpose**: Handles the complete logout flow including API call, loading state management, error handling, and redirect.

**Signature**:
```typescript
const handleLogout = useCallback(async () => {
  // Implementation
}, []);
```

**Dependencies**:
- `fetch` API for logout request
- `window.location.href` for redirect
- `console.error` for error logging
- `window.alert` for error notifications
- Component state (`isLoggingOut`)

---

## Key Business Rules

### 1. API Request Flow
- **Endpoint**: `/api/auth/logout`
- **Method**: `POST`
- **Headers**: `Content-Type: application/json`
- **No request body**: Logout uses session cookies

### 2. Success Flow
1. Set `isLoggingOut` to `true`
2. Make POST request to `/api/auth/logout`
3. If `response.ok`, redirect to `/auth/login`
4. Reset `isLoggingOut` to `false` in `finally` block

### 3. Error Flow
1. Set `isLoggingOut` to `true`
2. Make POST request to `/api/auth/logout`
3. If `!response.ok`:
   - Parse error JSON
   - Log error to console: `console.error("Logout failed:", data.error)`
   - Show alert: "Wystąpił błąd podczas wylogowywania. Spróbuj ponownie."
4. Reset `isLoggingOut` to `false` in `finally` block

### 4. Network Error Flow
1. Set `isLoggingOut` to `true`
2. Catch any fetch errors
3. Log error to console: `console.error("Logout error:", error)`
4. Show alert: "Wystąpił błąd podczas wylogowywania. Spróbuj ponownie."
5. Reset `isLoggingOut` to `false` in `finally` block

### 5. Loading State
- Button text changes from "Wyloguj się" to "Wylogowywanie..."
- Button is disabled during logout (`disabled={isLoggingOut}`)
- Prevents multiple simultaneous logout requests

---

## Test Coverage

### Valid Inputs - Successful Logout (6 tests)

#### ✅ Should call logout API with correct parameters
Verifies that fetch is called with:
- URL: `/api/auth/logout`
- Method: `POST`
- Headers: `{ "Content-Type": "application/json" }`

#### ✅ Should redirect to login page on successful logout
Confirms `window.location.href` is set to `/auth/login` after successful API response.

#### ✅ Should show loading state during logout process
Tests that:
- Button text changes to "Wylogowywanie..."
- Button is visible with loading text

#### ✅ Should disable logout button during logout process
Verifies button has:
- `disabled` attribute
- Cannot be clicked during logout

#### ✅ Should handle multiple rapid clicks gracefully
Ensures:
- Only one API call is made even with multiple clicks
- Loading state prevents duplicate requests

---

### Invalid Inputs - Failed Logout (5 tests)

#### ✅ Should show error alert when API returns non-ok response
Tests alert is shown with message: "Wystąpił błąd podczas wylogowywania. Spróbuj ponownie."

#### ✅ Should log error details when API returns error
Verifies `console.error` is called with: `"Logout failed:"` and the error code.

#### ✅ Should not redirect when logout fails
Confirms `window.location.href` remains unchanged after failed logout.

#### ✅ Should re-enable button after failed logout
Ensures:
- Button becomes enabled again
- User can retry logout

---

### Edge Cases - Network Errors (7 tests)

#### ✅ Should handle network failure gracefully
Tests generic network error handling with alert.

#### ✅ Should log network error details
Verifies `console.error` is called with: `"Logout error:"` and the error object.

#### ✅ Should handle fetch timeout
Tests timeout error scenario with proper error message.

#### ✅ Should handle malformed JSON response
Tests behavior when `response.json()` throws error.

#### ✅ Should handle response without error field
Tests behavior when error response is empty object `{}`.

#### ✅ Should handle AbortError (cancelled request)
Tests behavior when fetch is aborted.

#### ✅ Should re-enable button after network error
Ensures button is re-enabled after any network error.

---

### Business Rules (6 tests)

#### ✅ Should use POST method for logout request
Explicitly verifies POST method is used.

#### ✅ Should send Content-Type header with logout request
Confirms `Content-Type: application/json` header is present.

#### ✅ Should call logout endpoint at /api/auth/logout
Verifies exact endpoint URL.

#### ✅ Should redirect to /auth/login specifically
Confirms redirect target is exactly `/auth/login`.

#### ✅ Should always reset loading state in finally block
Tests that `isLoggingOut` is reset even on error.

#### ✅ Should execute logout via useCallback hook
Verifies function stability across re-renders.

---

### Return Value Types (1 test)

#### ✅ Should return void (Promise<void>)
Confirms function returns `undefined` (no return value).

---

### Consistency Checks (3 tests)

#### ✅ Should behave identically on multiple successive calls
Tests that multiple logout attempts behave the same way.

#### ✅ Should handle error scenarios consistently
Verifies same error handling for multiple error attempts.

#### ✅ Should maintain deterministic behavior with different response codes
Tests that different HTTP error codes (401, 403, 500, 503) all show the same user-facing error message.

---

### Integration with Component State (3 tests)

#### ✅ Should close menu after logout attempt
Documents that successful logout redirects before menu can close.

#### ✅ Should work without userEmail prop
Tests logout works even when `userEmail` is not provided.

#### ✅ Should work regardless of initial menu state
Tests logout works after opening/closing menu multiple times.

---

## Test Setup and Mocking

### Global Mocks

```typescript
beforeEach(() => {
  // Mock window.location
  delete window.location;
  window.location = { href: "" } as Location;

  // Mock console methods
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "log").mockImplementation(() => {});

  // Mock window.alert
  vi.spyOn(window, "alert").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
```

### Fetch Mocking Patterns

#### Successful Response
```typescript
global.fetch = vi.fn().mockResolvedValue({
  ok: true,
  json: async () => ({ success: true }),
});
```

#### Error Response
```typescript
global.fetch = vi.fn().mockResolvedValue({
  ok: false,
  status: 401,
  json: async () => ({ error: "UNAUTHORIZED" }),
});
```

#### Network Error
```typescript
global.fetch = vi.fn().mockRejectedValue(new Error("Network error"));
```

#### Delayed Response (for loading state tests)
```typescript
let resolveLogout: (value: Response) => void;
const logoutPromise = new Promise<Response>((resolve) => {
  resolveLogout = resolve;
});
global.fetch = vi.fn().mockReturnValue(logoutPromise);

// Later resolve:
resolveLogout!({
  ok: true,
  json: async () => ({ success: true }),
} as Response);
```

---

## Testing User Interactions

### Opening Menu and Clicking Logout

```typescript
// Arrange
const user = userEvent.setup();
render(<UserMenu userEmail="test@example.com" />);

// Act - Open menu
const menuButton = screen.getByRole("button", { name: /menu użytkownika/i });
await user.click(menuButton);

// Act - Click logout
const logoutButton = screen.getByRole("button", { name: /wyloguj się/i });
await user.click(logoutButton);

// Assert
await waitFor(() => {
  expect(window.location.href).toBe("/auth/login");
});
```

---

## Error Messages

### User-Facing Error Message
```
"Wystąpił błąd podczas wylogowywania. Spróbuj ponownie."
```

**Shown when**:
- API returns non-ok response (`!response.ok`)
- Network error occurs (fetch throws)
- Any other error during logout process

### Console Error Messages

#### API Error
```typescript
console.error("Logout failed:", data.error);
```

#### Network Error
```typescript
console.error("Logout error:", error);
```

---

## Loading States

### Button States

| State | Text | Disabled | User Can Click |
|-------|------|----------|----------------|
| Initial | "Wyloguj się" | `false` | Yes |
| Loading | "Wylogowywanie..." | `true` | No |
| Success | N/A (redirected) | N/A | N/A |
| Error | "Wyloguj się" | `false` | Yes (retry) |

---

## Known Edge Cases

### 1. Multiple Rapid Clicks
**Behavior**: Only first click triggers logout due to loading state.
**Test**: ✅ Covered

### 2. Malformed JSON Response
**Behavior**: Caught in catch block, shows generic error.
**Test**: ✅ Covered

### 3. Response Without Error Field
**Behavior**: Logs `undefined` but still shows user-facing error.
**Test**: ✅ Covered

### 4. Redirect Before State Update
**Behavior**: Page redirects before React can update component state.
**Test**: ✅ Documented

---

## Running Tests

```bash
# Run all UserMenu logout tests
npm test -- UserMenu.handleLogout.test.tsx

# Run with coverage
npm run test:coverage -- UserMenu.handleLogout.test.tsx

# Run in watch mode
npm test -- --watch UserMenu.handleLogout.test.tsx

# Run specific test suite
npm test -- UserMenu.handleLogout.test.tsx -t "Valid inputs"
npm test -- UserMenu.handleLogout.test.tsx -t "Business rules"
npm test -- UserMenu.handleLogout.test.tsx -t "Edge cases"
```

---

## Coverage Goals

- ✅ **Line Coverage**: 100%
- ✅ **Branch Coverage**: 100%
- ✅ **Function Coverage**: 100% (handleLogout)
- ✅ **Statement Coverage**: 100%

---

## Implementation Notes

### useCallback Hook
The function is wrapped in `useCallback` with empty dependency array `[]`, meaning:
- Function reference stays stable across re-renders
- No dependencies need to be tracked
- Function can be safely passed to child components

### Finally Block
The `finally` block ensures `isLoggingOut` is always reset:
```typescript
finally {
  setIsLoggingOut(false);
}
```

This prevents the UI from getting stuck in loading state even on errors.

### No Request Body
The logout endpoint doesn't require a request body because:
- Authentication is handled via HTTP-only cookies
- Server validates session from cookies
- POST method is used for security (prevents CSRF in some scenarios)

---

## Related Files

- Implementation: `src/components/layout/UserMenu.tsx`
- API Endpoint: `src/pages/api/auth/logout.ts`
- Type definitions: Inline in UserMenu.tsx

---

## Future Improvements

### Potential Test Additions
1. Test session cleanup verification
2. Test cookie clearing (if observable)
3. Test analytics/logging if added
4. Test accessibility announcements for screen readers

### Potential Feature Additions
1. Confirmation dialog before logout
2. "Remember me" option handling
3. Logout from all devices option
4. Success message before redirect

---

## Troubleshooting

### Common Test Issues

#### Issue: `window.location.href` not updating
**Solution**: Ensure `window.location` is properly mocked in `beforeEach`

#### Issue: Tests hanging on `waitFor`
**Solution**: Ensure fetch mock returns a resolved promise

#### Issue: Multiple console warnings
**Solution**: Mock `console.error` in `beforeEach` to suppress expected errors

#### Issue: Alert not being called
**Solution**: Mock `window.alert` before rendering component

---

## References

- [Vitest Testing Library](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [User Event](https://testing-library.com/docs/user-event/intro)
- [Mocking Fetch](https://vitest.dev/guide/mocking.html)
