import { useState, useId } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Loader2, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface RegisterFormProps {
  /**
   * Optional callback for handling form submission
   * In production, this would call the API endpoint
   */
  onSubmit?: (email: string, password: string) => Promise<void>;
}

/**
 * Registration form component with email, password, and password confirmation fields.
 * Includes comprehensive client-side validation according to security requirements.
 */
export function RegisterForm({ onSubmit }: RegisterFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    confirmPassword?: string;
    general?: string;
  }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const emailId = useId();
  const passwordId = useId();
  const confirmPasswordId = useId();

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

  const validateConfirmPassword = (value: string, passwordValue: string): string | undefined => {
    if (!value) {
      return "Potwierdzenie hasła jest wymagane";
    }
    if (value !== passwordValue) {
      return "Hasła nie są zgodne";
    }
    return undefined;
  };

  // Password strength indicators
  const passwordChecks = {
    length: password.length >= 8,
    digit: /\d/.test(password),
    special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Clear previous errors
    setErrors({});

    // Validate all fields
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);
    const confirmPasswordError = validateConfirmPassword(confirmPassword, password);

    if (emailError || passwordError || confirmPasswordError) {
      setErrors({
        email: emailError,
        password: passwordError,
        confirmPassword: confirmPasswordError,
      });
      return;
    }

    setIsSubmitting(true);

    try {
      if (onSubmit) {
        await onSubmit(email, password);
      } else {
        // Mock API call for demonstration
        await new Promise((resolve) => setTimeout(resolve, 1000));
        console.log("Registration attempt:", { email, password });
      }
    } catch (error) {
      setErrors({
        general: "Użytkownik o tym adresie email już istnieje",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Utwórz konto</CardTitle>
        <CardDescription>Wypełnij formularz, aby założyć nowe konto</CardDescription>
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
            <Label htmlFor={passwordId}>Hasło</Label>
            <Input
              id={passwordId}
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? `${passwordId}-error ${passwordId}-requirements` : `${passwordId}-requirements`}
              disabled={isSubmitting}
              autoComplete="new-password"
            />
            {errors.password && (
              <p id={`${passwordId}-error`} className="text-sm text-destructive" role="alert">
                {errors.password}
              </p>
            )}
            
            {/* Password requirements */}
            <div id={`${passwordId}-requirements`} className="space-y-1.5 text-sm">
              <p className="text-muted-foreground">Hasło musi zawierać:</p>
              <ul className="space-y-1">
                <li className={cn("flex items-center gap-2", passwordChecks.length ? "text-green-600 dark:text-green-500" : "text-muted-foreground")}>
                  <Check className={cn("size-3", passwordChecks.length ? "opacity-100" : "opacity-30")} />
                  <span>Minimum 8 znaków</span>
                </li>
                <li className={cn("flex items-center gap-2", passwordChecks.digit ? "text-green-600 dark:text-green-500" : "text-muted-foreground")}>
                  <Check className={cn("size-3", passwordChecks.digit ? "opacity-100" : "opacity-30")} />
                  <span>Przynajmniej jedną cyfrę</span>
                </li>
                <li className={cn("flex items-center gap-2", passwordChecks.special ? "text-green-600 dark:text-green-500" : "text-muted-foreground")}>
                  <Check className={cn("size-3", passwordChecks.special ? "opacity-100" : "opacity-30")} />
                  <span>Przynajmniej jeden znak specjalny</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Confirm Password field */}
          <div className="space-y-2">
            <Label htmlFor={confirmPasswordId}>Powtórz hasło</Label>
            <Input
              id={confirmPasswordId}
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              aria-invalid={!!errors.confirmPassword}
              aria-describedby={errors.confirmPassword ? `${confirmPasswordId}-error` : undefined}
              disabled={isSubmitting}
              autoComplete="new-password"
            />
            {errors.confirmPassword && (
              <p id={`${confirmPasswordId}-error`} className="text-sm text-destructive" role="alert">
                {errors.confirmPassword}
              </p>
            )}
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-4">
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="animate-spin" />
                Rejestracja...
              </>
            ) : (
              "Zarejestruj się"
            )}
          </Button>

          <p className="text-sm text-muted-foreground text-center">
            Masz już konto?{" "}
            <a
              href="/login"
              className="text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-sm"
            >
              Zaloguj się
            </a>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
