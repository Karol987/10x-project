import { describe, it, expect } from "vitest";

/**
 * Extract validateEmail function for testing
 * This is the same implementation as in RegisterForm.tsx (lines 54-63)
 */
const validateEmail = (value: string): string | undefined => {
  if (!value) {
    return "Email jest wymagany";
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(value)) {
    return "Nieprawidłowy format email";
  }
  return undefined;
};

describe("RegisterForm - validateEmail()", () => {
  describe("Valid email addresses", () => {
    it("should accept standard email format", () => {
      expect(validateEmail("user@example.com")).toBeUndefined();
    });

    it("should accept email with subdomain", () => {
      expect(validateEmail("user@mail.example.com")).toBeUndefined();
    });

    it("should accept email with numbers in local part", () => {
      expect(validateEmail("user123@example.com")).toBeUndefined();
    });

    it("should accept email with dots in local part", () => {
      expect(validateEmail("first.last@example.com")).toBeUndefined();
    });

    it("should accept email with plus sign in local part", () => {
      expect(validateEmail("user+tag@example.com")).toBeUndefined();
    });

    it("should accept email with underscore in local part", () => {
      expect(validateEmail("user_name@example.com")).toBeUndefined();
    });

    it("should accept email with hyphen in domain", () => {
      expect(validateEmail("user@my-domain.com")).toBeUndefined();
    });

    it("should accept email with multiple dots in domain", () => {
      expect(validateEmail("user@mail.my.example.com")).toBeUndefined();
    });

    it("should accept email with short TLD", () => {
      expect(validateEmail("user@example.io")).toBeUndefined();
    });

    it("should accept email with long TLD", () => {
      expect(validateEmail("user@example.travel")).toBeUndefined();
    });

    it("should accept email with single character local part", () => {
      expect(validateEmail("a@example.com")).toBeUndefined();
    });

    it("should accept email with numbers in domain", () => {
      expect(validateEmail("user@domain123.com")).toBeUndefined();
    });

    it("should accept Polish domain", () => {
      expect(validateEmail("uzytkownik@example.pl")).toBeUndefined();
    });
  });

  describe("Invalid email addresses - format errors", () => {
    it("should reject email without @ symbol", () => {
      expect(validateEmail("userexample.com")).toBe("Nieprawidłowy format email");
    });

    it("should reject email without domain", () => {
      expect(validateEmail("user@")).toBe("Nieprawidłowy format email");
    });

    it("should reject email without local part", () => {
      expect(validateEmail("@example.com")).toBe("Nieprawidłowy format email");
    });

    it("should reject email without TLD", () => {
      expect(validateEmail("user@example")).toBe("Nieprawidłowy format email");
    });

    it("should reject email with spaces", () => {
      expect(validateEmail("user name@example.com")).toBe("Nieprawidłowy format email");
    });

    it("should reject email with leading space", () => {
      expect(validateEmail(" user@example.com")).toBe("Nieprawidłowy format email");
    });

    it("should reject email with trailing space", () => {
      expect(validateEmail("user@example.com ")).toBe("Nieprawidłowy format email");
    });

    it("should reject email with space in domain", () => {
      expect(validateEmail("user@exam ple.com")).toBe("Nieprawidłowy format email");
    });

    it("should reject email with multiple @ symbols", () => {
      expect(validateEmail("user@@example.com")).toBe("Nieprawidłowy format email");
    });

    it("should reject email with @ at the end", () => {
      expect(validateEmail("user@example.com@")).toBe("Nieprawidłowy format email");
    });

    it("should accept email with dot at the end (regex limitation)", () => {
      // Note: The current regex allows trailing dots after TLD
      expect(validateEmail("user@example.com.")).toBeUndefined();
    });

    it("should accept email with consecutive dots in local part (regex limitation)", () => {
      // Note: The current regex allows consecutive dots, though they're not RFC-compliant
      expect(validateEmail("user..name@example.com")).toBeUndefined();
    });

    it("should accept email starting with dot (regex limitation)", () => {
      // Note: The current regex allows leading dots, though they're not RFC-compliant
      expect(validateEmail(".user@example.com")).toBeUndefined();
    });

    it("should reject email with only special characters", () => {
      expect(validateEmail("@@@.@@@")).toBe("Nieprawidłowy format email");
    });

    it("should reject plain text without email structure", () => {
      expect(validateEmail("notanemail")).toBe("Nieprawidłowy format email");
    });

    it("should reject email with missing domain extension", () => {
      expect(validateEmail("user@domain.")).toBe("Nieprawidłowy format email");
    });
  });

  describe("Empty and whitespace inputs", () => {
    it("should reject empty string", () => {
      expect(validateEmail("")).toBe("Email jest wymagany");
    });

    it("should reject string with only spaces", () => {
      expect(validateEmail("   ")).toBe("Nieprawidłowy format email");
    });

    it("should reject string with only tab", () => {
      expect(validateEmail("\t")).toBe("Nieprawidłowy format email");
    });

    it("should reject string with only newline", () => {
      expect(validateEmail("\n")).toBe("Nieprawidłowy format email");
    });
  });

  describe("Edge cases and special characters", () => {
    it("should accept email with comma (regex limitation)", () => {
      // Note: The current regex allows commas, though they're not RFC-compliant
      expect(validateEmail("user,name@example.com")).toBeUndefined();
    });

    it("should accept email with semicolon (regex limitation)", () => {
      // Note: The current regex allows semicolons, though they're not RFC-compliant
      expect(validateEmail("user;name@example.com")).toBeUndefined();
    });

    it("should accept email with parentheses in local part (regex limitation)", () => {
      // Note: The current regex allows parentheses, though they're not RFC-compliant
      expect(validateEmail("user(name)@example.com")).toBeUndefined();
    });

    it("should accept email with square brackets (regex limitation)", () => {
      // Note: The current regex allows square brackets, though they're not RFC-compliant
      expect(validateEmail("user[name]@example.com")).toBeUndefined();
    });

    it("should accept email with less than/greater than signs (regex limitation)", () => {
      // Note: The current regex allows these characters, though they're not RFC-compliant
      expect(validateEmail("<user@example.com>")).toBeUndefined();
    });

    it("should accept email with hyphen in local part", () => {
      expect(validateEmail("user-name@example.com")).toBeUndefined();
    });

    it("should accept very long email (no length validation)", () => {
      const longEmail = "a".repeat(255) + "@example.com";
      // Current implementation only validates format, not length
      expect(validateEmail(longEmail)).toBeUndefined();
    });

    it("should accept email with unicode characters (regex limitation)", () => {
      // Note: The current regex allows unicode, though internationalized emails need special handling
      expect(validateEmail("użytkownik@example.com")).toBeUndefined();
    });

    it("should accept email with emoji (regex limitation)", () => {
      // Note: The current regex allows emoji characters
      expect(validateEmail("user😀@example.com")).toBeUndefined();
    });

    it("should reject email with newline character", () => {
      expect(validateEmail("user\n@example.com")).toBe("Nieprawidłowy format email");
    });

    it("should reject email with tab character", () => {
      expect(validateEmail("user\t@example.com")).toBe("Nieprawidłowy format email");
    });
  });

  describe("Common typos and user mistakes", () => {
    it("should accept email with double dot in domain (regex limitation)", () => {
      // Note: The current regex allows consecutive dots in domain
      expect(validateEmail("user@example..com")).toBeUndefined();
    });

    it("should reject email with @ at the beginning", () => {
      expect(validateEmail("@user@example.com")).toBe("Nieprawidłowy format email");
    });

    it("should reject incomplete email (missing domain part)", () => {
      expect(validateEmail("user@domain")).toBe("Nieprawidłowy format email");
    });

    it("should reject email with missing @ between local and domain", () => {
      expect(validateEmail("userexample.com")).toBe("Nieprawidłowy format email");
    });
  });

  describe("Return value types", () => {
    it("should return undefined for valid email", () => {
      const result = validateEmail("valid@example.com");
      expect(result).toBeUndefined();
      expect(typeof result).toBe("undefined");
    });

    it("should return string error message for invalid email", () => {
      const result = validateEmail("invalid");
      expect(typeof result).toBe("string");
      expect(result).toBeTruthy();
    });

    it("should return string error message for empty email", () => {
      const result = validateEmail("");
      expect(typeof result).toBe("string");
      expect(result).toBeTruthy();
    });
  });

  describe("Business rules validation", () => {
    it("should enforce required field rule", () => {
      const emptyResult = validateEmail("");
      expect(emptyResult).toBe("Email jest wymagany");
    });

    it("should enforce format rule with proper error message", () => {
      const invalidResult = validateEmail("not-an-email");
      expect(invalidResult).toBe("Nieprawidłowy format email");
    });

    it("should pass validation for properly formatted business email", () => {
      expect(validateEmail("contact@company.com")).toBeUndefined();
      expect(validateEmail("support@business.pl")).toBeUndefined();
      expect(validateEmail("info@organization.org")).toBeUndefined();
    });
  });

  describe("Consistency checks", () => {
    it("should return consistent results for same input", () => {
      const email = "test@example.com";
      const result1 = validateEmail(email);
      const result2 = validateEmail(email);
      expect(result1).toBe(result2);
    });

    it("should return consistent error for same invalid input", () => {
      const invalidEmail = "invalid@";
      const result1 = validateEmail(invalidEmail);
      const result2 = validateEmail(invalidEmail);
      expect(result1).toBe(result2);
      expect(result1).toBe("Nieprawidłowy format email");
    });
  });
});
