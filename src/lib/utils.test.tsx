import { describe, it, expect } from "vitest";
import { cn, jsonResponse, errorResponse, type ErrorResponse } from "./utils";

/* ------------------------------------------------------------------ */
/* cn() - Tailwind CSS class utility                                */
/* ------------------------------------------------------------------ */

describe("utils - cn()", () => {
  describe("Valid inputs", () => {
    it("should merge single class string", () => {
      const result = cn("text-red-500");
      expect(result).toBe("text-red-500");
    });

    it("should merge multiple class strings", () => {
      const result = cn("text-red-500", "bg-blue-200");
      expect(result).toBe("text-red-500 bg-blue-200");
    });

    it("should handle conditional classes", () => {
      const result = cn("base-class", true && "conditional-class");
      expect(result).toBe("base-class conditional-class");
    });

    it("should filter out falsy values", () => {
      const result = cn("base-class", false && "should-not-appear", null, undefined);
      expect(result).toBe("base-class");
    });

    it("should merge conflicting Tailwind classes correctly", () => {
      // twMerge should keep the last conflicting class
      const result = cn("px-2", "px-4");
      expect(result).toBe("px-4");
    });

    it("should handle array of classes", () => {
      const result = cn(["text-red-500", "bg-blue-200"]);
      expect(result).toBe("text-red-500 bg-blue-200");
    });

    it("should handle object with boolean values", () => {
      const result = cn({
        "text-red-500": true,
        "bg-blue-200": false,
        "font-bold": true,
      });
      expect(result).toBe("text-red-500 font-bold");
    });

    it("should handle mixed input types", () => {
      const result = cn("base", ["array-class"], { "object-class": true }, "end");
      expect(result).toBe("base array-class object-class end");
    });
  });

  describe("Edge cases", () => {
    it("should handle empty input", () => {
      const result = cn();
      expect(result).toBe("");
    });

    it("should handle only falsy values", () => {
      const result = cn(false, null, undefined, "");
      expect(result).toBe("");
    });

    it("should handle empty strings", () => {
      const result = cn("", "valid-class", "");
      expect(result).toBe("valid-class");
    });

    it("should handle whitespace in class names", () => {
      const result = cn("  text-red-500  ", "  bg-blue-200  ");
      expect(result).toBe("text-red-500 bg-blue-200");
    });

    it("should handle duplicate classes", () => {
      const result = cn("text-red-500", "text-red-500");
      expect(result).toBe("text-red-500");
    });

    it("should handle very long class strings", () => {
      const longClass =
        "class1 class2 class3 class4 class5 class6 class7 class8 class9 class10";
      const result = cn(longClass);
      expect(result).toBe(longClass);
    });

    it("should handle special characters in class names", () => {
      const result = cn("hover:text-red-500", "sm:px-4", "md:py-2");
      expect(result).toBe("hover:text-red-500 sm:px-4 md:py-2");
    });

    it("should handle numeric values (coerced to strings)", () => {
      const result = cn("class-1", 2, "class-3");
      expect(result).toBe("class-1 2 class-3");
    });
  });

  describe("Business rules", () => {
    it("should prioritize later classes in conflicts (twMerge behavior)", () => {
      const result = cn("p-4", "p-8");
      expect(result).toBe("p-8");
    });

    it("should not affect non-conflicting classes", () => {
      const result = cn("text-red-500 p-4", "bg-blue-200 p-8");
      expect(result).toBe("text-red-500 bg-blue-200 p-8");
    });

    it("should handle responsive variants correctly", () => {
      const result = cn("px-2", "sm:px-4", "md:px-6");
      expect(result).toBe("px-2 sm:px-4 md:px-6");
    });
  });

  describe("Return value types", () => {
    it("should always return a string", () => {
      const result = cn("test-class");
      expect(typeof result).toBe("string");
    });

    it("should return empty string for no input", () => {
      const result = cn();
      expect(result).toBe("");
      expect(typeof result).toBe("string");
    });
  });

  describe("Consistency checks", () => {
    it("should return consistent results for same input", () => {
      const input = ["text-red-500", "bg-blue-200"];
      const result1 = cn(...input);
      const result2 = cn(...input);
      expect(result1).toBe(result2);
    });

    it("should be deterministic with complex inputs", () => {
      const input = [
        "base",
        { active: true, disabled: false },
        ["array-class"],
        "end",
      ];
      const result1 = cn(...input);
      const result2 = cn(...input);
      expect(result1).toBe(result2);
    });
  });
});

/* ------------------------------------------------------------------ */
/* jsonResponse() - JSON Response Helper                            */
/* ------------------------------------------------------------------ */

describe("utils - jsonResponse()", () => {
  describe("Valid inputs", () => {
    it("should create response with simple object data", () => {
      const data = { message: "success" };
      const response = jsonResponse(data, 200);

      expect(response).toBeInstanceOf(Response);
      expect(response.status).toBe(200);
      expect(response.headers.get("Content-Type")).toBe("application/json");
    });

    it("should create response with array data", () => {
      const data = [1, 2, 3];
      const response = jsonResponse(data, 200);

      expect(response).toBeInstanceOf(Response);
      expect(response.status).toBe(200);
    });

    it("should create response with nested object data", () => {
      const data = {
        user: { name: "John", email: "john@example.com" },
        settings: { theme: "dark" },
      };
      const response = jsonResponse(data, 200);

      expect(response).toBeInstanceOf(Response);
      expect(response.status).toBe(200);
    });

    it("should include Cache-Control header by default", () => {
      const data = { test: "data" };
      const response = jsonResponse(data, 200);

      expect(response.headers.get("Cache-Control")).toBe("no-store, private");
    });

    it("should accept additional headers", () => {
      const data = { test: "data" };
      const response = jsonResponse(data, 200, {
        "X-Custom-Header": "custom-value",
      });

      expect(response.headers.get("X-Custom-Header")).toBe("custom-value");
    });

    it("should override default headers with additional headers", () => {
      const data = { test: "data" };
      const response = jsonResponse(data, 200, {
        "Cache-Control": "public, max-age=3600",
      });

      expect(response.headers.get("Cache-Control")).toBe("public, max-age=3600");
    });

    it("should handle different status codes", () => {
      const testCases = [200, 201, 400, 401, 403, 404, 500, 503];

      testCases.forEach((status) => {
        const response = jsonResponse({ test: "data" }, status);
        expect(response.status).toBe(status);
      });
    });
  });

  describe("Edge cases", () => {
    it("should handle null data", () => {
      const response = jsonResponse(null, 200);

      expect(response).toBeInstanceOf(Response);
      expect(response.status).toBe(200);
    });

    it("should handle undefined data", () => {
      const response = jsonResponse(undefined, 200);

      expect(response).toBeInstanceOf(Response);
      expect(response.status).toBe(200);
    });

    it("should handle empty object", () => {
      const response = jsonResponse({}, 200);

      expect(response).toBeInstanceOf(Response);
      expect(response.status).toBe(200);
    });

    it("should handle empty array", () => {
      const response = jsonResponse([], 200);

      expect(response).toBeInstanceOf(Response);
      expect(response.status).toBe(200);
    });

    it("should handle string data", () => {
      const response = jsonResponse("test string", 200);

      expect(response).toBeInstanceOf(Response);
      expect(response.status).toBe(200);
    });

    it("should handle number data", () => {
      const response = jsonResponse(42, 200);

      expect(response).toBeInstanceOf(Response);
      expect(response.status).toBe(200);
    });

    it("should handle boolean data", () => {
      const response = jsonResponse(true, 200);

      expect(response).toBeInstanceOf(Response);
      expect(response.status).toBe(200);
    });

    it("should handle very large objects", () => {
      const largeData = {
        items: Array.from({ length: 1000 }, (_, i) => ({
          id: i,
          name: `Item ${i}`,
          description: `Description for item ${i}`,
        })),
      };
      const response = jsonResponse(largeData, 200);

      expect(response).toBeInstanceOf(Response);
      expect(response.status).toBe(200);
    });

    it("should handle special characters in data", () => {
      const data = {
        message: "Special chars: áéíóú ñ 中文 🎉",
        code: "<script>alert('test')</script>",
      };
      const response = jsonResponse(data, 200);

      expect(response).toBeInstanceOf(Response);
    });

    it("should handle empty additional headers", () => {
      const data = { test: "data" };
      const response = jsonResponse(data, 200, {});

      expect(response.headers.get("Content-Type")).toBe("application/json");
      expect(response.headers.get("Cache-Control")).toBe("no-store, private");
    });
  });

  describe("Business rules", () => {
    it("should always set Content-Type to application/json", () => {
      const response = jsonResponse({ test: "data" }, 200);
      expect(response.headers.get("Content-Type")).toBe("application/json");
    });

    it("should always set Cache-Control by default", () => {
      const response = jsonResponse({ test: "data" }, 200);
      expect(response.headers.get("Cache-Control")).toBe("no-store, private");
    });

    it("should allow overriding Content-Type with additional headers", () => {
      const response = jsonResponse({ test: "data" }, 200, {
        "Content-Type": "application/custom+json",
      });
      expect(response.headers.get("Content-Type")).toBe("application/custom+json");
    });

    it("should preserve multiple additional headers", () => {
      const response = jsonResponse({ test: "data" }, 200, {
        "X-Custom-1": "value1",
        "X-Custom-2": "value2",
        "X-Custom-3": "value3",
      });

      expect(response.headers.get("X-Custom-1")).toBe("value1");
      expect(response.headers.get("X-Custom-2")).toBe("value2");
      expect(response.headers.get("X-Custom-3")).toBe("value3");
    });
  });

  describe("Return value types", () => {
    it("should return Response instance", () => {
      const response = jsonResponse({ test: "data" }, 200);
      expect(response).toBeInstanceOf(Response);
    });

    it("should have correct body type", async () => {
      const data = { message: "test" };
      const response = jsonResponse(data, 200);
      const body = await response.json();

      expect(body).toEqual(data);
    });
  });

  describe("Consistency checks", () => {
    it("should create identical responses for same inputs", () => {
      const data = { test: "data" };
      const response1 = jsonResponse(data, 200);
      const response2 = jsonResponse(data, 200);

      expect(response1.status).toBe(response2.status);
      expect(response1.headers.get("Content-Type")).toBe(
        response2.headers.get("Content-Type")
      );
    });

    it("should serialize data consistently", async () => {
      const data = { a: 1, b: 2, c: 3 };
      const response1 = jsonResponse(data, 200);
      const response2 = jsonResponse(data, 200);

      const body1 = await response1.json();
      const body2 = await response2.json();

      expect(body1).toEqual(body2);
    });
  });
});

/* ------------------------------------------------------------------ */
/* errorResponse() - Error Response Helper                          */
/* ------------------------------------------------------------------ */

describe("utils - errorResponse()", () => {
  describe("Valid inputs", () => {
    it("should create error response with error only", () => {
      const response = errorResponse("INVALID_REQUEST", 400);

      expect(response).toBeInstanceOf(Response);
      expect(response.status).toBe(400);
      expect(response.headers.get("Content-Type")).toBe("application/json");
    });

    it("should create error response with error and message", () => {
      const response = errorResponse(
        "INVALID_REQUEST",
        400,
        "The request is invalid"
      );

      expect(response).toBeInstanceOf(Response);
      expect(response.status).toBe(400);
    });

    it("should create error response with all parameters", () => {
      const details = { field: "email", reason: "invalid format" };
      const response = errorResponse(
        "VALIDATION_ERROR",
        400,
        "Validation failed",
        details
      );

      expect(response).toBeInstanceOf(Response);
      expect(response.status).toBe(400);
    });

    it("should handle different HTTP error status codes", () => {
      const errorCodes = [
        { code: 400, error: "BAD_REQUEST" },
        { code: 401, error: "UNAUTHORIZED" },
        { code: 403, error: "FORBIDDEN" },
        { code: 404, error: "NOT_FOUND" },
        { code: 500, error: "INTERNAL_ERROR" },
      ];

      errorCodes.forEach(({ code, error }) => {
        const response = errorResponse(error, code);
        expect(response.status).toBe(code);
      });
    });

    it("should handle complex details object", () => {
      const details = {
        errors: [
          { field: "email", message: "Invalid email" },
          { field: "password", message: "Too short" },
        ],
        timestamp: Date.now(),
      };
      const response = errorResponse("VALIDATION_ERROR", 400, undefined, details);

      expect(response).toBeInstanceOf(Response);
    });

    it("should handle array as details", () => {
      const details = ["error1", "error2", "error3"];
      const response = errorResponse("MULTIPLE_ERRORS", 400, undefined, details);

      expect(response).toBeInstanceOf(Response);
    });
  });

  describe("Edge cases", () => {
    it("should handle empty error string", () => {
      const response = errorResponse("", 400);

      expect(response).toBeInstanceOf(Response);
      expect(response.status).toBe(400);
    });

    it("should handle empty message string", () => {
      const response = errorResponse("ERROR", 400, "");

      expect(response).toBeInstanceOf(Response);
    });

    it("should handle null details", () => {
      const response = errorResponse("ERROR", 400, undefined, null);

      expect(response).toBeInstanceOf(Response);
    });

    it("should handle undefined message and details", () => {
      const response = errorResponse("ERROR", 400, undefined, undefined);

      expect(response).toBeInstanceOf(Response);
    });

    it("should handle very long error message", () => {
      const longMessage = "A".repeat(1000);
      const response = errorResponse("ERROR", 400, longMessage);

      expect(response).toBeInstanceOf(Response);
    });

    it("should handle special characters in error", () => {
      const error = "ERROR_WITH_SPECIAL_CHARS_🎉_中文";
      const response = errorResponse(error, 400);

      expect(response).toBeInstanceOf(Response);
    });

    it("should handle numeric details", () => {
      const response = errorResponse("ERROR", 400, undefined, 42);

      expect(response).toBeInstanceOf(Response);
    });

    it("should handle boolean details", () => {
      const response = errorResponse("ERROR", 400, undefined, false);

      expect(response).toBeInstanceOf(Response);
    });

    it("should handle nested error details", () => {
      const details = {
        level1: {
          level2: {
            level3: "deep error",
          },
        },
      };
      const response = errorResponse("NESTED_ERROR", 400, undefined, details);

      expect(response).toBeInstanceOf(Response);
    });
  });

  describe("Business rules", () => {
    it("should only include message field when provided", async () => {
      const response = errorResponse("ERROR", 400, "Error message");
      const body: ErrorResponse = await response.json();

      expect(body).toHaveProperty("error");
      expect(body).toHaveProperty("message");
      expect(body.message).toBe("Error message");
    });

    it("should omit message field when not provided", async () => {
      const response = errorResponse("ERROR", 400);
      const body: ErrorResponse = await response.json();

      expect(body).toHaveProperty("error");
      expect(body).not.toHaveProperty("message");
    });

    it("should only include details field when provided", async () => {
      const details = { field: "email" };
      const response = errorResponse("ERROR", 400, undefined, details);
      const body: ErrorResponse = await response.json();

      expect(body).toHaveProperty("error");
      expect(body).toHaveProperty("details");
      expect(body.details).toEqual(details);
    });

    it("should omit details field when not provided", async () => {
      const response = errorResponse("ERROR", 400);
      const body: ErrorResponse = await response.json();

      expect(body).toHaveProperty("error");
      expect(body).not.toHaveProperty("details");
    });

    it("should not include message when empty string", async () => {
      const response = errorResponse("ERROR", 400, "");
      const body: ErrorResponse = await response.json();

      expect(body).not.toHaveProperty("message");
    });

    it("should use jsonResponse internally", () => {
      const response = errorResponse("ERROR", 400);

      // Should have the same headers as jsonResponse
      expect(response.headers.get("Content-Type")).toBe("application/json");
      expect(response.headers.get("Cache-Control")).toBe("no-store, private");
    });

    it("should handle common validation error pattern", async () => {
      const details = {
        validationErrors: [
          { field: "email", code: "INVALID_FORMAT" },
          { field: "password", code: "TOO_SHORT" },
        ],
      };
      const response = errorResponse(
        "VALIDATION_ERROR",
        422,
        "Validation failed",
        details
      );
      const body: ErrorResponse = await response.json();

      expect(body.error).toBe("VALIDATION_ERROR");
      expect(body.message).toBe("Validation failed");
      expect(body.details).toEqual(details);
    });

    it("should handle authentication error pattern", async () => {
      const response = errorResponse(
        "UNAUTHORIZED",
        401,
        "Invalid credentials"
      );
      const body: ErrorResponse = await response.json();

      expect(body.error).toBe("UNAUTHORIZED");
      expect(body.message).toBe("Invalid credentials");
      expect(body.details).toBeUndefined();
    });

    it("should handle not found error pattern", async () => {
      const details = { resource: "user", id: "123" };
      const response = errorResponse("NOT_FOUND", 404, "User not found", details);
      const body: ErrorResponse = await response.json();

      expect(body.error).toBe("NOT_FOUND");
      expect(body.message).toBe("User not found");
      expect(body.details).toEqual(details);
    });
  });

  describe("Return value types", () => {
    it("should return Response instance", () => {
      const response = errorResponse("ERROR", 400);
      expect(response).toBeInstanceOf(Response);
    });

    it("should have correct body structure with error only", async () => {
      const response = errorResponse("TEST_ERROR", 400);
      const body: ErrorResponse = await response.json();

      expect(body).toHaveProperty("error");
      expect(body.error).toBe("TEST_ERROR");
      expect(typeof body.error).toBe("string");
    });

    it("should have correct body structure with all fields", async () => {
      const details = { test: "data" };
      const response = errorResponse(
        "TEST_ERROR",
        400,
        "Test message",
        details
      );
      const body: ErrorResponse = await response.json();

      expect(body).toHaveProperty("error");
      expect(body).toHaveProperty("message");
      expect(body).toHaveProperty("details");
      expect(typeof body.error).toBe("string");
      expect(typeof body.message).toBe("string");
    });
  });

  describe("Consistency checks", () => {
    it("should create identical responses for same inputs", async () => {
      const error = "TEST_ERROR";
      const message = "Test message";
      const details = { field: "test" };

      const response1 = errorResponse(error, 400, message, details);
      const response2 = errorResponse(error, 400, message, details);

      expect(response1.status).toBe(response2.status);

      const body1: ErrorResponse = await response1.json();
      const body2: ErrorResponse = await response2.json();

      expect(body1).toEqual(body2);
    });

    it("should be deterministic with complex details", async () => {
      const details = {
        errors: [{ a: 1 }, { b: 2 }],
        timestamp: 12345,
      };

      const response1 = errorResponse("ERROR", 400, "Message", details);
      const response2 = errorResponse("ERROR", 400, "Message", details);

      const body1: ErrorResponse = await response1.json();
      const body2: ErrorResponse = await response2.json();

      expect(body1).toEqual(body2);
    });
  });
});
