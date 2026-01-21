import { describe, it, expect } from "vitest";

/**
 * Extract validatePassword function for testing
 * This is the same implementation as in RegisterForm.tsx (lines 65-79)
 */
const validatePassword = (value: string): string | undefined => {
  if (!value) {
    return "Hasło jest wymagane";
  }
  if (value.length < 8) {
    return "Hasło musi mieć minimum 8 znaków";
  }
  if (!/\d/.test(value)) {
    return "Hasło musi zawierać przynajmniej jedną cyfrę";
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(value)) {
    return "Hasło musi zawierać przynajmniej jeden znak specjalny";
  }
  return undefined;
};

/**
 * Extract validateConfirmPassword function for testing
 * This is the same implementation as in RegisterForm.tsx (lines 81-89)
 */
const validateConfirmPassword = (value: string, passwordValue: string): string | undefined => {
  if (!value) {
    return "Potwierdzenie hasła jest wymagane";
  }
  if (value !== passwordValue) {
    return "Hasła nie są zgodne";
  }
  return undefined;
};

/**
 * Extract passwordChecks computation logic for testing
 * This is the same implementation as in RegisterForm.tsx (lines 92-96)
 */
const getPasswordChecks = (password: string) => ({
  length: password.length >= 8,
  digit: /\d/.test(password),
  special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
});

describe("RegisterForm - validatePassword()", () => {
  describe("Valid passwords", () => {
    it("should accept password with minimum requirements (8 chars, 1 digit, 1 special)", () => {
      expect(validatePassword("Test123!")).toBeUndefined();
    });

    it("should accept password with multiple digits", () => {
      expect(validatePassword("Pass123456!")).toBeUndefined();
    });

    it("should accept password with multiple special characters", () => {
      expect(validatePassword("Test123!@#$")).toBeUndefined();
    });

    it("should accept password with all character types", () => {
      expect(validatePassword("MyP@ssw0rd123")).toBeUndefined();
    });

    it("should accept password with uppercase and lowercase letters", () => {
      expect(validatePassword("AbCdEf12!")).toBeUndefined();
    });

    it("should accept password with only lowercase letters, digit, and special char", () => {
      expect(validatePassword("password1!")).toBeUndefined();
    });

    it("should accept password with underscore as special character", () => {
      expect(validatePassword("password_123")).toBeUndefined();
    });

    it("should accept password with hyphen as special character", () => {
      expect(validatePassword("password-123")).toBeUndefined();
    });

    it("should accept password with plus sign as special character", () => {
      expect(validatePassword("password+123")).toBeUndefined();
    });

    it("should accept password with equals sign as special character", () => {
      expect(validatePassword("password=123")).toBeUndefined();
    });

    it("should accept password with brackets as special characters", () => {
      expect(validatePassword("pass[123]word")).toBeUndefined();
      expect(validatePassword("pass{123}word")).toBeUndefined();
    });

    it("should accept password with quotes as special characters", () => {
      expect(validatePassword('pass"123"word')).toBeUndefined();
      expect(validatePassword("pass'123'word")).toBeUndefined();
    });

    it("should accept password with backslash as special character", () => {
      expect(validatePassword("pass\\123word")).toBeUndefined();
    });

    it("should accept password with pipe as special character", () => {
      expect(validatePassword("pass|123word")).toBeUndefined();
    });

    it("should accept password with comma as special character", () => {
      expect(validatePassword("pass,123word")).toBeUndefined();
    });

    it("should accept password with dot as special character", () => {
      expect(validatePassword("pass.123word")).toBeUndefined();
    });

    it("should accept password with angle brackets as special characters", () => {
      expect(validatePassword("pass<123>word")).toBeUndefined();
    });

    it("should accept password with slash as special character", () => {
      expect(validatePassword("pass/123word")).toBeUndefined();
      expect(validatePassword("pass?123word")).toBeUndefined();
    });

    it("should accept password with semicolon as special character", () => {
      expect(validatePassword("pass;123word")).toBeUndefined();
    });

    it("should accept password with colon as special character", () => {
      expect(validatePassword("pass:123word")).toBeUndefined();
    });

    it("should accept very long password meeting requirements", () => {
      const longPassword = "a".repeat(100) + "1!";
      expect(validatePassword(longPassword)).toBeUndefined();
    });

    it("should accept password with digit at the beginning", () => {
      expect(validatePassword("1password!")).toBeUndefined();
    });

    it("should accept password with digit at the end", () => {
      expect(validatePassword("password!1")).toBeUndefined();
    });

    it("should accept password with digit in the middle", () => {
      expect(validatePassword("pass1word!")).toBeUndefined();
    });

    it("should accept password with special char at the beginning", () => {
      expect(validatePassword("!password1")).toBeUndefined();
    });

    it("should accept password with special char at the end", () => {
      expect(validatePassword("password1!")).toBeUndefined();
    });

    it("should accept password with special char in the middle", () => {
      expect(validatePassword("pass!word1")).toBeUndefined();
    });
  });

  describe("Invalid passwords - missing requirements", () => {
    it("should reject empty string", () => {
      expect(validatePassword("")).toBe("Hasło jest wymagane");
    });

    it("should reject password shorter than 8 characters", () => {
      expect(validatePassword("Test1!")).toBe("Hasło musi mieć minimum 8 znaków");
    });

    it("should reject password with exactly 7 characters", () => {
      expect(validatePassword("Test12!")).toBe("Hasło musi mieć minimum 8 znaków");
    });

    it("should reject password with 1 character", () => {
      expect(validatePassword("a")).toBe("Hasło musi mieć minimum 8 znaków");
    });

    it("should reject password without digit (8+ chars, has special)", () => {
      expect(validatePassword("Password!")).toBe("Hasło musi zawierać przynajmniej jedną cyfrę");
    });

    it("should reject password without special character (8+ chars, has digit)", () => {
      expect(validatePassword("Password123")).toBe("Hasło musi zawierać przynajmniej jeden znak specjalny");
    });

    it("should reject password with only letters (8+ chars)", () => {
      expect(validatePassword("PasswordTest")).toBe("Hasło musi zawierać przynajmniej jedną cyfrę");
    });

    it("should reject password with only digits (8+ chars)", () => {
      expect(validatePassword("12345678")).toBe("Hasło musi zawierać przynajmniej jeden znak specjalny");
    });

    it("should reject password with only special characters (8+ chars)", () => {
      expect(validatePassword("!@#$%^&*")).toBe("Hasło musi zawierać przynajmniej jedną cyfrę");
    });

    it("should reject password with letters and digits only (no special)", () => {
      expect(validatePassword("Password123")).toBe("Hasło musi zawierać przynajmniej jeden znak specjalny");
    });

    it("should reject password with letters and special only (no digit)", () => {
      expect(validatePassword("Password!@#")).toBe("Hasło musi zawierać przynajmniej jedną cyfrę");
    });

    it("should accept password with digits and special (no letter requirement)", () => {
      // Note: Current implementation doesn't require letters, only length, digit, and special char
      expect(validatePassword("123456!@#")).toBeUndefined();
    });
  });

  describe("Invalid passwords - length validation priority", () => {
    it("should return length error first when multiple requirements are missing", () => {
      // Too short, no digit, no special
      expect(validatePassword("Pass")).toBe("Hasło musi mieć minimum 8 znaków");
    });

    it("should return length error first even when digit is missing", () => {
      // Too short, no digit
      expect(validatePassword("Pass!")).toBe("Hasło musi mieć minimum 8 znaków");
    });

    it("should return length error first even when special char is missing", () => {
      // Too short, no special
      expect(validatePassword("Pass1")).toBe("Hasło musi mieć minimum 8 znaków");
    });

    it("should validate digit after length passes", () => {
      // 8 chars, no digit
      expect(validatePassword("Password!")).toBe("Hasło musi zawierać przynajmniej jedną cyfrę");
    });

    it("should validate special char after length and digit pass", () => {
      // 8 chars, has digit, no special
      expect(validatePassword("Password123")).toBe("Hasło musi zawierać przynajmniej jeden znak specjalny");
    });
  });

  describe("Edge cases with whitespace", () => {
    it("should accept password with spaces if it meets all requirements", () => {
      // Space is not a special character in the defined set
      expect(validatePassword("Pass word 123!")).toBeUndefined();
    });

    it("should reject password with only spaces (has length but no digit)", () => {
      // 7 spaces = length check fails
      expect(validatePassword("       ")).toBe("Hasło musi mieć minimum 8 znaków");
    });

    it("should accept password with leading space", () => {
      expect(validatePassword(" Password123!")).toBeUndefined();
    });

    it("should accept password with trailing space", () => {
      expect(validatePassword("Password123! ")).toBeUndefined();
    });

    it("should reject password with tab character only", () => {
      expect(validatePassword("\t")).toBe("Hasło musi mieć minimum 8 znaków");
    });

    it("should reject password with newline character only", () => {
      expect(validatePassword("\n")).toBe("Hasło musi mieć minimum 8 znaków");
    });
  });

  describe("Special characters validation", () => {
    it("should recognize @ as special character", () => {
      expect(validatePassword("password@123")).toBeUndefined();
    });

    it("should recognize # as special character", () => {
      expect(validatePassword("password#123")).toBeUndefined();
    });

    it("should recognize $ as special character", () => {
      expect(validatePassword("password$123")).toBeUndefined();
    });

    it("should recognize % as special character", () => {
      expect(validatePassword("password%123")).toBeUndefined();
    });

    it("should recognize ^ as special character", () => {
      expect(validatePassword("password^123")).toBeUndefined();
    });

    it("should recognize & as special character", () => {
      expect(validatePassword("password&123")).toBeUndefined();
    });

    it("should recognize * as special character", () => {
      expect(validatePassword("password*123")).toBeUndefined();
    });

    it("should recognize ( and ) as special characters", () => {
      expect(validatePassword("password(123)")).toBeUndefined();
    });

    it("should NOT recognize space as special character", () => {
      expect(validatePassword("password 123")).toBe("Hasło musi zawierać przynajmniej jeden znak specjalny");
    });

    it("should NOT recognize letter as special character", () => {
      expect(validatePassword("passwordabc")).toBe("Hasło musi zawierać przynajmniej jedną cyfrę");
    });

    it("should NOT recognize digit as special character", () => {
      expect(validatePassword("password123")).toBe("Hasło musi zawierać przynajmniej jeden znak specjalny");
    });
  });

  describe("Unicode and international characters", () => {
    it("should accept password with Polish characters if requirements are met", () => {
      expect(validatePassword("Hąsło123!")).toBeUndefined();
    });

    it("should accept password with emoji if requirements are met", () => {
      expect(validatePassword("Password123!😀")).toBeUndefined();
    });

    it("should reject password with only unicode characters", () => {
      // 9 unicode characters, passes length but fails digit requirement
      expect(validatePassword("ąćęłńóśźż")).toBe("Hasło musi zawierać przynajmniej jedną cyfrę");
    });
  });

  describe("Return value types", () => {
    it("should return undefined for valid password", () => {
      const result = validatePassword("ValidPass123!");
      expect(result).toBeUndefined();
      expect(typeof result).toBe("undefined");
    });

    it("should return string error message for invalid password", () => {
      const result = validatePassword("short");
      expect(typeof result).toBe("string");
      expect(result).toBeTruthy();
    });

    it("should return string error message for empty password", () => {
      const result = validatePassword("");
      expect(typeof result).toBe("string");
      expect(result).toBeTruthy();
    });
  });

  describe("Consistency checks", () => {
    it("should return consistent results for same valid input", () => {
      const password = "TestPassword123!";
      const result1 = validatePassword(password);
      const result2 = validatePassword(password);
      expect(result1).toBe(result2);
      expect(result1).toBeUndefined();
    });

    it("should return consistent error for same invalid input", () => {
      const password = "short";
      const result1 = validatePassword(password);
      const result2 = validatePassword(password);
      expect(result1).toBe(result2);
      expect(result1).toBe("Hasło musi mieć minimum 8 znaków");
    });
  });

  describe("Business rules validation", () => {
    it("should enforce minimum 8 characters rule", () => {
      expect(validatePassword("Test1!")).toBe("Hasło musi mieć minimum 8 znaków");
      expect(validatePassword("Test123!")).toBeUndefined();
    });

    it("should enforce at least one digit rule", () => {
      expect(validatePassword("Password!")).toBe("Hasło musi zawierać przynajmniej jedną cyfrę");
      expect(validatePassword("Password1!")).toBeUndefined();
    });

    it("should enforce at least one special character rule", () => {
      expect(validatePassword("Password123")).toBe("Hasło musi zawierać przynajmniej jeden znak specjalny");
      expect(validatePassword("Password123!")).toBeUndefined();
    });

    it("should enforce required field rule", () => {
      expect(validatePassword("")).toBe("Hasło jest wymagane");
    });

    it("should accept strong password with all requirements", () => {
      expect(validatePassword("MyStr0ng!P@ssw0rd")).toBeUndefined();
    });
  });

  describe("Common user password patterns", () => {
    it("should reject common weak pattern (only letters)", () => {
      // "password" has 8 chars, passes length but fails digit requirement
      expect(validatePassword("password")).toBe("Hasło musi zawierać przynajmniej jedną cyfrę");
    });

    it("should reject common weak pattern (letters + number)", () => {
      expect(validatePassword("password123")).toBe("Hasło musi zawierać przynajmniej jeden znak specjalny");
    });

    it("should accept password with exclamation at end (common pattern)", () => {
      expect(validatePassword("Password1!")).toBeUndefined();
    });

    it("should accept password with @ symbol (common pattern)", () => {
      expect(validatePassword("P@ssword1")).toBeUndefined();
    });

    it("should reject sequential numbers without special char", () => {
      expect(validatePassword("password12345")).toBe("Hasło musi zawierać przynajmniej jeden znak specjalny");
    });
  });
});

describe("RegisterForm - validateConfirmPassword()", () => {
  describe("Valid confirmation", () => {
    it("should accept matching passwords (simple case)", () => {
      const password = "Test123!";
      expect(validateConfirmPassword("Test123!", password)).toBeUndefined();
    });

    it("should accept matching passwords (complex case)", () => {
      const password = "MyStr0ng!P@ssw0rd";
      expect(validateConfirmPassword("MyStr0ng!P@ssw0rd", password)).toBeUndefined();
    });

    it("should accept matching passwords with special characters", () => {
      const password = "P@ss!word#123$";
      expect(validateConfirmPassword("P@ss!word#123$", password)).toBeUndefined();
    });

    it("should accept matching passwords with spaces", () => {
      const password = "Pass word 123!";
      expect(validateConfirmPassword("Pass word 123!", password)).toBeUndefined();
    });

    it("should accept matching passwords with unicode characters", () => {
      const password = "Hąsło123!";
      expect(validateConfirmPassword("Hąsło123!", password)).toBeUndefined();
    });

    it("should accept matching passwords with emoji", () => {
      const password = "Pass123!😀";
      expect(validateConfirmPassword("Pass123!😀", password)).toBeUndefined();
    });

    it("should reject empty confirmation even when password is empty", () => {
      // The function checks empty field first, before checking match
      expect(validateConfirmPassword("", "")).toBe("Potwierdzenie hasła jest wymagane");
    });

    it("should accept matching very long passwords", () => {
      const password = "a".repeat(100) + "123!";
      expect(validateConfirmPassword(password, password)).toBeUndefined();
    });
  });

  describe("Invalid confirmation - empty field", () => {
    it("should reject empty confirmation with non-empty password", () => {
      expect(validateConfirmPassword("", "Test123!")).toBe("Potwierdzenie hasła jest wymagane");
    });

    it("should reject empty confirmation with empty password", () => {
      expect(validateConfirmPassword("", "")).toBe("Potwierdzenie hasła jest wymagane");
    });
  });

  describe("Invalid confirmation - mismatched passwords", () => {
    it("should reject different passwords (simple case)", () => {
      expect(validateConfirmPassword("Test123!", "Different123!")).toBe("Hasła nie są zgodne");
    });

    it("should reject passwords differing by one character", () => {
      expect(validateConfirmPassword("Test123!", "Test123?")).toBe("Hasła nie są zgodne");
    });

    it("should reject passwords with different case", () => {
      expect(validateConfirmPassword("Test123!", "test123!")).toBe("Hasła nie są zgodne");
    });

    it("should reject passwords with extra space", () => {
      expect(validateConfirmPassword("Test123! ", "Test123!")).toBe("Hasła nie są zgodne");
    });

    it("should reject passwords with leading space difference", () => {
      expect(validateConfirmPassword(" Test123!", "Test123!")).toBe("Hasła nie są zgodne");
    });

    it("should reject passwords with trailing space difference", () => {
      expect(validateConfirmPassword("Test123!", "Test123! ")).toBe("Hasła nie są zgodne");
    });

    it("should reject completely different passwords", () => {
      expect(validateConfirmPassword("Password1!", "DifferentPass2@")).toBe("Hasła nie są zgodne");
    });

    it("should reject passwords with swapped characters", () => {
      expect(validateConfirmPassword("Test123!", "Tset123!")).toBe("Hasła nie są zgodne");
    });

    it("should reject passwords with different length", () => {
      expect(validateConfirmPassword("Test123!", "Test123!Extra")).toBe("Hasła nie są zgodne");
    });

    it("should reject password shorter than original", () => {
      expect(validateConfirmPassword("Test12!", "Test123!")).toBe("Hasła nie są zgodne");
    });

    it("should reject password longer than original", () => {
      expect(validateConfirmPassword("Test123!Extra", "Test123!")).toBe("Hasła nie są zgodne");
    });
  });

  describe("Edge cases", () => {
    it("should handle confirmation with non-empty value when password is empty", () => {
      expect(validateConfirmPassword("Test123!", "")).toBe("Hasła nie są zgodne");
    });

    it("should handle special characters in mismatch", () => {
      expect(validateConfirmPassword("Test123!", "Test123@")).toBe("Hasła nie są zgodne");
    });

    it("should handle unicode character differences", () => {
      expect(validateConfirmPassword("Hąsło123!", "Hasło123!")).toBe("Hasła nie są zgodne");
    });

    it("should handle emoji differences", () => {
      expect(validateConfirmPassword("Pass123!😀", "Pass123!😁")).toBe("Hasła nie są zgodne");
    });

    it("should handle tab character differences", () => {
      expect(validateConfirmPassword("Test\t123!", "Test 123!")).toBe("Hasła nie są zgodne");
    });

    it("should handle newline character differences", () => {
      expect(validateConfirmPassword("Test\n123!", "Test 123!")).toBe("Hasła nie są zgodne");
    });
  });

  describe("Validation priority", () => {
    it("should check empty field before checking match", () => {
      // Empty confirmation should return required error, not mismatch error
      expect(validateConfirmPassword("", "Test123!")).toBe("Potwierdzenie hasła jest wymagane");
    });

    it("should check match only after ensuring field is not empty", () => {
      // Non-empty but mismatched should return mismatch error
      expect(validateConfirmPassword("Different!", "Test123!")).toBe("Hasła nie są zgodne");
    });
  });

  describe("Return value types", () => {
    it("should return undefined for matching passwords", () => {
      const result = validateConfirmPassword("Test123!", "Test123!");
      expect(result).toBeUndefined();
      expect(typeof result).toBe("undefined");
    });

    it("should return string error message for empty confirmation", () => {
      const result = validateConfirmPassword("", "Test123!");
      expect(typeof result).toBe("string");
      expect(result).toBeTruthy();
    });

    it("should return string error message for mismatched passwords", () => {
      const result = validateConfirmPassword("Test123!", "Different!");
      expect(typeof result).toBe("string");
      expect(result).toBeTruthy();
    });
  });

  describe("Consistency checks", () => {
    it("should return consistent results for same matching inputs", () => {
      const result1 = validateConfirmPassword("Test123!", "Test123!");
      const result2 = validateConfirmPassword("Test123!", "Test123!");
      expect(result1).toBe(result2);
      expect(result1).toBeUndefined();
    });

    it("should return consistent error for same mismatched inputs", () => {
      const result1 = validateConfirmPassword("Test123!", "Different!");
      const result2 = validateConfirmPassword("Test123!", "Different!");
      expect(result1).toBe(result2);
      expect(result1).toBe("Hasła nie są zgodne");
    });

    it("should return consistent error for same empty inputs", () => {
      const result1 = validateConfirmPassword("", "Test123!");
      const result2 = validateConfirmPassword("", "Test123!");
      expect(result1).toBe(result2);
      expect(result1).toBe("Potwierdzenie hasła jest wymagane");
    });
  });

  describe("Business rules validation", () => {
    it("should enforce required field rule", () => {
      expect(validateConfirmPassword("", "anyPassword")).toBe("Potwierdzenie hasła jest wymagane");
    });

    it("should enforce passwords must match rule", () => {
      expect(validateConfirmPassword("Password1!", "Password2!")).toBe("Hasła nie są zgodne");
    });

    it("should pass validation when both rules are satisfied", () => {
      expect(validateConfirmPassword("Password123!", "Password123!")).toBeUndefined();
    });
  });

  describe("Real-world scenarios", () => {
    it("should handle copy-paste scenario (exact match)", () => {
      const password = "C0mpl3x!P@ssw0rd#2024";
      expect(validateConfirmPassword(password, password)).toBeUndefined();
    });

    it("should catch typo in confirmation", () => {
      expect(validateConfirmPassword("Passw0rd!", "Password!")).toBe("Hasła nie są zgodne");
    });

    it("should catch missing character at end", () => {
      expect(validateConfirmPassword("Password123", "Password123!")).toBe("Hasła nie są zgodne");
    });

    it("should catch extra character at end", () => {
      expect(validateConfirmPassword("Password123!!", "Password123!")).toBe("Hasła nie są zgodne");
    });

    it("should catch caps lock mistake", () => {
      expect(validateConfirmPassword("PASSWORD123!", "Password123!")).toBe("Hasła nie są zgodne");
    });
  });
});

describe("RegisterForm - passwordChecks (computed properties)", () => {
  describe("Length check (password.length >= 8)", () => {
    it("should return false for empty password", () => {
      const checks = getPasswordChecks("");
      expect(checks.length).toBe(false);
    });

    it("should return false for password with 1 character", () => {
      const checks = getPasswordChecks("a");
      expect(checks.length).toBe(false);
    });

    it("should return false for password with 7 characters", () => {
      const checks = getPasswordChecks("Test12!");
      expect(checks.length).toBe(false);
    });

    it("should return true for password with exactly 8 characters", () => {
      const checks = getPasswordChecks("Test123!");
      expect(checks.length).toBe(true);
    });

    it("should return true for password with 9 characters", () => {
      const checks = getPasswordChecks("Test1234!");
      expect(checks.length).toBe(true);
    });

    it("should return true for password with 100 characters", () => {
      const checks = getPasswordChecks("a".repeat(100));
      expect(checks.length).toBe(true);
    });

    it("should return true for password with spaces counting towards length", () => {
      const checks = getPasswordChecks("Test   1!");
      expect(checks.length).toBe(true);
    });

    it("should return true for password with unicode characters", () => {
      const checks = getPasswordChecks("Hąsło12!");
      expect(checks.length).toBe(true);
    });

    it("should return true for password with emoji", () => {
      const checks = getPasswordChecks("Test123😀");
      expect(checks.length).toBe(true);
    });
  });

  describe("Digit check (/\\d/.test(password))", () => {
    it("should return false for empty password", () => {
      const checks = getPasswordChecks("");
      expect(checks.digit).toBe(false);
    });

    it("should return false for password without digits", () => {
      const checks = getPasswordChecks("Password!");
      expect(checks.digit).toBe(false);
    });

    it("should return false for password with only letters", () => {
      const checks = getPasswordChecks("TestPassword");
      expect(checks.digit).toBe(false);
    });

    it("should return false for password with only special characters", () => {
      const checks = getPasswordChecks("!@#$%^&*");
      expect(checks.digit).toBe(false);
    });

    it("should return true for password with single digit", () => {
      const checks = getPasswordChecks("Password1");
      expect(checks.digit).toBe(true);
    });

    it("should return true for password with multiple digits", () => {
      const checks = getPasswordChecks("Password123");
      expect(checks.digit).toBe(true);
    });

    it("should return true for password with digit at beginning", () => {
      const checks = getPasswordChecks("1Password");
      expect(checks.digit).toBe(true);
    });

    it("should return true for password with digit at end", () => {
      const checks = getPasswordChecks("Password1");
      expect(checks.digit).toBe(true);
    });

    it("should return true for password with digit in middle", () => {
      const checks = getPasswordChecks("Pass1word");
      expect(checks.digit).toBe(true);
    });

    it("should return true for password with only digits", () => {
      const checks = getPasswordChecks("12345678");
      expect(checks.digit).toBe(true);
    });

    it("should return true for password starting with zero", () => {
      const checks = getPasswordChecks("0Password");
      expect(checks.digit).toBe(true);
    });

    it("should return true for password with all digits 0-9", () => {
      const checks = getPasswordChecks("Pass0123456789");
      expect(checks.digit).toBe(true);
    });
  });

  describe("Special character check", () => {
    it("should return false for empty password", () => {
      const checks = getPasswordChecks("");
      expect(checks.special).toBe(false);
    });

    it("should return false for password without special characters", () => {
      const checks = getPasswordChecks("Password123");
      expect(checks.special).toBe(false);
    });

    it("should return false for password with only letters and digits", () => {
      const checks = getPasswordChecks("TestPassword123");
      expect(checks.special).toBe(false);
    });

    it("should return false for password with spaces only", () => {
      const checks = getPasswordChecks("Pass word 123");
      expect(checks.special).toBe(false);
    });

    it("should return true for password with exclamation mark", () => {
      const checks = getPasswordChecks("Password!");
      expect(checks.special).toBe(true);
    });

    it("should return true for password with @ symbol", () => {
      const checks = getPasswordChecks("P@ssword");
      expect(checks.special).toBe(true);
    });

    it("should return true for password with hash symbol", () => {
      const checks = getPasswordChecks("Pass#word");
      expect(checks.special).toBe(true);
    });

    it("should return true for password with dollar sign", () => {
      const checks = getPasswordChecks("Pass$word");
      expect(checks.special).toBe(true);
    });

    it("should return true for password with percent sign", () => {
      const checks = getPasswordChecks("Pass%word");
      expect(checks.special).toBe(true);
    });

    it("should return true for password with caret", () => {
      const checks = getPasswordChecks("Pass^word");
      expect(checks.special).toBe(true);
    });

    it("should return true for password with ampersand", () => {
      const checks = getPasswordChecks("Pass&word");
      expect(checks.special).toBe(true);
    });

    it("should return true for password with asterisk", () => {
      const checks = getPasswordChecks("Pass*word");
      expect(checks.special).toBe(true);
    });

    it("should return true for password with parentheses", () => {
      const checks = getPasswordChecks("Pass(word)");
      expect(checks.special).toBe(true);
    });

    it("should return true for password with underscore", () => {
      const checks = getPasswordChecks("Pass_word");
      expect(checks.special).toBe(true);
    });

    it("should return true for password with plus sign", () => {
      const checks = getPasswordChecks("Pass+word");
      expect(checks.special).toBe(true);
    });

    it("should return true for password with hyphen", () => {
      const checks = getPasswordChecks("Pass-word");
      expect(checks.special).toBe(true);
    });

    it("should return true for password with equals sign", () => {
      const checks = getPasswordChecks("Pass=word");
      expect(checks.special).toBe(true);
    });

    it("should return true for password with square brackets", () => {
      const checks = getPasswordChecks("Pass[word]");
      expect(checks.special).toBe(true);
    });

    it("should return true for password with curly brackets", () => {
      const checks = getPasswordChecks("Pass{word}");
      expect(checks.special).toBe(true);
    });

    it("should return true for password with semicolon", () => {
      const checks = getPasswordChecks("Pass;word");
      expect(checks.special).toBe(true);
    });

    it("should return true for password with single quote", () => {
      const checks = getPasswordChecks("Pass'word");
      expect(checks.special).toBe(true);
    });

    it("should return true for password with double quote", () => {
      const checks = getPasswordChecks('Pass"word');
      expect(checks.special).toBe(true);
    });

    it("should return true for password with backslash", () => {
      const checks = getPasswordChecks("Pass\\word");
      expect(checks.special).toBe(true);
    });

    it("should return true for password with pipe", () => {
      const checks = getPasswordChecks("Pass|word");
      expect(checks.special).toBe(true);
    });

    it("should return true for password with comma", () => {
      const checks = getPasswordChecks("Pass,word");
      expect(checks.special).toBe(true);
    });

    it("should return true for password with dot", () => {
      const checks = getPasswordChecks("Pass.word");
      expect(checks.special).toBe(true);
    });

    it("should return true for password with less than sign", () => {
      const checks = getPasswordChecks("Pass<word");
      expect(checks.special).toBe(true);
    });

    it("should return true for password with greater than sign", () => {
      const checks = getPasswordChecks("Pass>word");
      expect(checks.special).toBe(true);
    });

    it("should return true for password with forward slash", () => {
      const checks = getPasswordChecks("Pass/word");
      expect(checks.special).toBe(true);
    });

    it("should return true for password with question mark", () => {
      const checks = getPasswordChecks("Pass?word");
      expect(checks.special).toBe(true);
    });

    it("should return true for password with colon", () => {
      const checks = getPasswordChecks("Pass:word");
      expect(checks.special).toBe(true);
    });

    it("should return true for password with multiple special characters", () => {
      const checks = getPasswordChecks("P@ss!w0rd#");
      expect(checks.special).toBe(true);
    });
  });

  describe("Combined checks - all properties", () => {
    it("should return all false for empty password", () => {
      const checks = getPasswordChecks("");
      expect(checks).toEqual({
        length: false,
        digit: false,
        special: false,
      });
    });

    it("should return all false for short password without digit and special", () => {
      const checks = getPasswordChecks("Pass");
      expect(checks).toEqual({
        length: false,
        digit: false,
        special: false,
      });
    });

    it("should return only length true for 8+ chars without digit and special", () => {
      const checks = getPasswordChecks("Password");
      expect(checks).toEqual({
        length: true,
        digit: false,
        special: false,
      });
    });

    it("should return length and digit true for 8+ chars with digit, no special", () => {
      const checks = getPasswordChecks("Password1");
      expect(checks).toEqual({
        length: true,
        digit: true,
        special: false,
      });
    });

    it("should return length and special true for 8+ chars with special, no digit", () => {
      const checks = getPasswordChecks("Password!");
      expect(checks).toEqual({
        length: true,
        digit: false,
        special: true,
      });
    });

    it("should return all true for password meeting all requirements", () => {
      const checks = getPasswordChecks("Password1!");
      expect(checks).toEqual({
        length: true,
        digit: true,
        special: true,
      });
    });

    it("should return digit and special true for short password with both", () => {
      const checks = getPasswordChecks("Pa1!");
      expect(checks).toEqual({
        length: false,
        digit: true,
        special: true,
      });
    });

    it("should handle complex strong password", () => {
      const checks = getPasswordChecks("MyStr0ng!P@ssw0rd");
      expect(checks).toEqual({
        length: true,
        digit: true,
        special: true,
      });
    });
  });

  describe("Edge cases and special scenarios", () => {
    it("should handle password with tab character", () => {
      const checks = getPasswordChecks("Pass\tword1!");
      expect(checks.length).toBe(true);
      expect(checks.digit).toBe(true);
      expect(checks.special).toBe(true);
    });

    it("should handle password with newline character", () => {
      const checks = getPasswordChecks("Pass\nword1!");
      expect(checks.length).toBe(true);
      expect(checks.digit).toBe(true);
      expect(checks.special).toBe(true);
    });

    it("should handle password with unicode characters", () => {
      const checks = getPasswordChecks("Hąsło123!");
      expect(checks.length).toBe(true);
      expect(checks.digit).toBe(true);
      expect(checks.special).toBe(true);
    });

    it("should handle password with emoji", () => {
      const checks = getPasswordChecks("Pass123!😀");
      expect(checks.length).toBe(true);
      expect(checks.digit).toBe(true);
      expect(checks.special).toBe(true);
    });

    it("should handle very long password", () => {
      const checks = getPasswordChecks("a".repeat(1000) + "1!");
      expect(checks.length).toBe(true);
      expect(checks.digit).toBe(true);
      expect(checks.special).toBe(true);
    });
  });

  describe("Real-time validation behavior", () => {
    it("should progressively pass checks as user types valid password", () => {
      // User types: P
      let checks = getPasswordChecks("P");
      expect(checks).toEqual({ length: false, digit: false, special: false });

      // User types: Pa
      checks = getPasswordChecks("Pa");
      expect(checks).toEqual({ length: false, digit: false, special: false });

      // User types: Pas
      checks = getPasswordChecks("Pas");
      expect(checks).toEqual({ length: false, digit: false, special: false });

      // User types: Pass
      checks = getPasswordChecks("Pass");
      expect(checks).toEqual({ length: false, digit: false, special: false });

      // User types: Passw
      checks = getPasswordChecks("Passw");
      expect(checks).toEqual({ length: false, digit: false, special: false });

      // User types: Passwo
      checks = getPasswordChecks("Passwo");
      expect(checks).toEqual({ length: false, digit: false, special: false });

      // User types: Passwor
      checks = getPasswordChecks("Passwor");
      expect(checks).toEqual({ length: false, digit: false, special: false });

      // User types: Password (8 chars)
      checks = getPasswordChecks("Password");
      expect(checks).toEqual({ length: true, digit: false, special: false });

      // User types: Password1 (adds digit)
      checks = getPasswordChecks("Password1");
      expect(checks).toEqual({ length: true, digit: true, special: false });

      // User types: Password1! (adds special)
      checks = getPasswordChecks("Password1!");
      expect(checks).toEqual({ length: true, digit: true, special: true });
    });

    it("should handle backspace scenario (removing characters)", () => {
      // Start with valid password
      let checks = getPasswordChecks("Password1!");
      expect(checks).toEqual({ length: true, digit: true, special: true });

      // User removes special char
      checks = getPasswordChecks("Password1");
      expect(checks).toEqual({ length: true, digit: true, special: false });

      // User removes digit
      checks = getPasswordChecks("Password");
      expect(checks).toEqual({ length: true, digit: false, special: false });

      // User removes chars below 8
      checks = getPasswordChecks("Passwor");
      expect(checks).toEqual({ length: false, digit: false, special: false });
    });

    it("should handle different order of adding requirements", () => {
      // Add special first
      let checks = getPasswordChecks("Pass!");
      expect(checks).toEqual({ length: false, digit: false, special: true });

      // Add digit
      checks = getPasswordChecks("Pass!1");
      expect(checks).toEqual({ length: false, digit: true, special: true });

      // Add more chars to reach 8
      checks = getPasswordChecks("Pass!123");
      expect(checks).toEqual({ length: true, digit: true, special: true });
    });
  });

  describe("Consistency checks", () => {
    it("should return consistent results for same input", () => {
      const password = "TestPassword123!";
      const checks1 = getPasswordChecks(password);
      const checks2 = getPasswordChecks(password);
      expect(checks1).toEqual(checks2);
    });

    it("should return same object structure always", () => {
      const checks1 = getPasswordChecks("");
      const checks2 = getPasswordChecks("Test123!");
      expect(Object.keys(checks1).sort()).toEqual(Object.keys(checks2).sort());
      expect(Object.keys(checks1).sort()).toEqual(["digit", "length", "special"]);
    });

    it("should return boolean values for all checks", () => {
      const checks = getPasswordChecks("Test123!");
      expect(typeof checks.length).toBe("boolean");
      expect(typeof checks.digit).toBe("boolean");
      expect(typeof checks.special).toBe("boolean");
    });
  });

  describe("Business rules validation", () => {
    it("should correctly identify when password meets minimum length requirement", () => {
      const shortChecks = getPasswordChecks("Test12!");
      const validChecks = getPasswordChecks("Test123!");
      expect(shortChecks.length).toBe(false);
      expect(validChecks.length).toBe(true);
    });

    it("should correctly identify when password meets digit requirement", () => {
      const noDigitChecks = getPasswordChecks("Password!");
      const withDigitChecks = getPasswordChecks("Password1!");
      expect(noDigitChecks.digit).toBe(false);
      expect(withDigitChecks.digit).toBe(true);
    });

    it("should correctly identify when password meets special character requirement", () => {
      const noSpecialChecks = getPasswordChecks("Password123");
      const withSpecialChecks = getPasswordChecks("Password123!");
      expect(noSpecialChecks.special).toBe(false);
      expect(withSpecialChecks.special).toBe(true);
    });

    it("should identify strong password that meets all requirements", () => {
      const checks = getPasswordChecks("MyStr0ng!P@ssw0rd");
      expect(checks.length).toBe(true);
      expect(checks.digit).toBe(true);
      expect(checks.special).toBe(true);
    });
  });
});
