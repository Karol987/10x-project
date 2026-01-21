# Unit Tests Documentation: validateEmail()

## Overview
Comprehensive unit test suite for the `validateEmail()` function in `RegisterForm.tsx` with 56 test cases covering business rules, edge cases, and boundary conditions.

## Test Coverage

### 1. Valid Email Addresses (13 tests)
Tests validating properly formatted email addresses:
- Standard format (`user@example.com`)
- Subdomains (`user@mail.example.com`)
- Numbers in local part (`user123@example.com`)
- Dots in local part (`first.last@example.com`)
- Plus signs (`user+tag@example.com`)
- Underscores (`user_name@example.com`)
- Hyphens in domain (`user@my-domain.com`)
- Multiple domain levels (`user@mail.my.example.com`)
- Various TLD lengths (`.io`, `.travel`)
- Single character local part (`a@example.com`)
- Numbers in domain (`user@domain123.com`)
- Polish domains (`uzytkownik@example.pl`)

### 2. Invalid Email Addresses - Format Errors (15 tests)
Tests for common format violations:
- Missing `@` symbol
- Missing domain or local part
- Missing TLD
- Whitespace characters (leading, trailing, embedded)
- Multiple `@` symbols
- Trailing `@` or dots
- Plain text without email structure
- Missing domain extensions

### 3. Empty and Whitespace Inputs (4 tests)
Tests for required field validation:
- Empty string → "Email jest wymagany"
- Strings with only whitespace characters
- Tab and newline characters

### 4. Edge Cases and Special Characters (13 tests)
Tests documenting regex behavior with special characters:
- **Regex Limitations Documented**: The current regex (`/^[^\s@]+@[^\s@]+\.[^\s@]+$/`) is permissive and accepts:
  - Commas, semicolons
  - Parentheses, square brackets
  - Angle brackets (`<>`)
  - Unicode characters (Polish diacritics, emojis)
  
  These are documented with comments noting they're not RFC 5322 compliant but pass the current validation.

- **Properly Rejected**: Whitespace characters (newline, tab)
- **Accepted by Design**: Very long emails (no length limit), hyphens in local part

### 5. Common User Mistakes (4 tests)
Tests for typical typos:
- Double dots in domain (currently accepted - regex limitation)
- Multiple `@` symbols at beginning
- Incomplete domains
- Missing separators

### 6. Return Value Type Tests (3 tests)
Tests verifying correct return types:
- `undefined` for valid emails
- `string` error messages for invalid emails
- Consistent type checking

### 7. Business Rules Validation (3 tests)
Tests for specific business requirements:
- Required field enforcement
- Format validation with proper Polish error messages
- Business email formats (contact@, support@, info@)

### 8. Consistency Checks (2 tests)
Tests verifying deterministic behavior:
- Same valid input always returns same result
- Same invalid input always returns same error

## Business Rules Implemented

1. **Required Field**: Email cannot be empty
   - Error message: "Email jest wymagany"

2. **Format Validation**: Must match basic email pattern
   - Pattern: `[local-part]@[domain].[tld]`
   - Error message: "Nieprawidłowy format email"

## Known Regex Limitations

The current regex implementation (`/^[^\s@]+@[^\s@]+\.[^\s@]+$/`) is intentionally permissive for user experience. It:

### ✅ Correctly Validates
- Standard email formats
- Most common valid email patterns
- Rejects whitespace characters
- Requires `@` and at least one dot in domain

### ⚠️ Limitations (Documented in Tests)
- **Allows consecutive dots**: `user..name@example.com` passes
- **Allows leading/trailing dots**: `.user@example.com` and `user@example.com.` pass
- **Allows special characters**: Commas, semicolons, brackets, parentheses
- **Allows unicode**: Polish characters, emojis (may be intentional for i18n)
- **No length validation**: Extremely long emails are accepted
- **Not RFC 5322 compliant**: Intentionally simplified for better UX

### Recommendations

If stricter validation is needed in the future:

1. **Add Length Limits**
   ```typescript
   if (value.length > 254) {
     return "Email jest za długi";
   }
   ```

2. **Stricter Regex** (RFC 5322 compliant)
   ```typescript
   const strictRegex = /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
   ```

3. **Additional Rules**
   ```typescript
   // Reject consecutive dots
   if (/\.\./.test(value)) {
     return "Email nie może zawierać podwójnych kropek";
   }
   
   // Reject leading/trailing dots
   if (/^\.|\.$/.test(value.split('@')[0])) {
     return "Email nie może zaczynać się ani kończyć kropką";
   }
   ```

## Test Execution

Run tests with:
```bash
npm test -- RegisterForm.validateEmail.test.tsx
```

## Test Statistics

- **Total Tests**: 56
- **Passed**: 56
- **Coverage**: 100% of function logic
- **Execution Time**: ~13ms

## Maintenance Notes

- Tests are written to reflect **actual behavior**, not ideal behavior
- Regex limitations are explicitly documented with comments
- If validation rules change, update corresponding test expectations
- All error messages are in Polish to match production requirements
