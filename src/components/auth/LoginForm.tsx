import { useState, useId } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoginFormProps {
  /**
   * Optional callback for handling form submission
   * By default, submits to /api/auth/login
   */
  onSubmit?: (email: string, password: string) => Promise<void>;
}

interface LoginResponse {
  success?: boolean;
  user?: {
    id: string;
    email: string;
  };
  error?: string;
  fields?: {
    email?: string[];
    password?: string[];
  };
}

/**
 * Login form component with email and password fields.
 * Includes client-side validation and error handling.
 */
export function LoginForm({ onSubmit }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const emailId = useId();
  const passwordId = useId();

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

  const validatePassword = (value: string): string | undefined => {
    if (!value) {
      return "Hasło jest wymagane";
    }
    return undefined;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Clear previous errors
    setErrors({});

    // Validate fields
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);

    if (emailError || passwordError) {
      setErrors({
        email: emailError,
        password: passwordError,
      });
      return;
    }

    setIsSubmitting(true);

    try {
      if (onSubmit) {
        await onSubmit(email, password);
      } else {
        // Call the login API endpoint
        const response = await fetch("/api/auth/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, password }),
        });

        const data: LoginResponse = await response.json();

        if (!response.ok) {
          // Handle validation errors (400)
          if (response.status === 400 && data.fields) {
            setErrors({
              email: data.fields.email?.[0],
              password: data.fields.password?.[0],
              general: data.error,
            });
            return;
          }

          // Handle authentication errors (401) or other errors
          setErrors({
            general: data.error || "Nieprawidłowy email lub hasło",
          });
          return;
        }

        // Success - redirect to home page
        window.location.href = "/home";
      }
    } catch (error) {
      console.error("Login error:", error);
      setErrors({
        general: "Wystąpił błąd podczas logowania. Sprawdź połączenie internetowe i spróbuj ponownie.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Zaloguj się</CardTitle>
        <CardDescription>Wprowadź swoje dane, aby uzyskać dostęp do konta</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {/* General error message */}
          {errors.general && (
            <div
              className={cn(
                "p-3 rounded-lg bg-destructive/10 border border-destructive/20",
                "dark:bg-destructive/20"
              )}
              role="alert"
              aria-live="assertive"
            >
              <div className="flex items-start gap-2">
                <AlertCircle className="size-4 text-destructive shrink-0 mt-0.5" aria-hidden="true" />
                <p className="text-sm text-destructive">{errors.general}</p>
              </div>
            </div>
          )}

          {/* Email field */}
          <div className="space-y-2">
            <Label htmlFor={emailId}>Email</Label>
            <Input
              id={emailId}
              type="email"
              placeholder="twoj@email.pl"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? `${emailId}-error` : undefined}
              disabled={isSubmitting}
              autoComplete="email"
            />
            {errors.email && (
              <p id={`${emailId}-error`} className="text-sm text-destructive" role="alert">
                {errors.email}
              </p>
            )}
          </div>

          {/* Password field */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor={passwordId}>Hasło</Label>
              <a
                href="/auth/forgot-password"
                className="text-sm text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-sm"
              >
                Zapomniałeś hasła?
              </a>
            </div>
            <Input
              id={passwordId}
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? `${passwordId}-error` : undefined}
              disabled={isSubmitting}
              autoComplete="current-password"
            />
            {errors.password && (
              <p id={`${passwordId}-error`} className="text-sm text-destructive" role="alert">
                {errors.password}
              </p>
            )}
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-4">
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="animate-spin" />
                Logowanie...
              </>
            ) : (
              "Zaloguj się"
            )}
          </Button>

          <p className="text-sm text-muted-foreground text-center">
            Nie masz konta?{" "}
            <a
              href="/auth/register"
              className="text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-sm"
            >
              Zarejestruj się
            </a>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
