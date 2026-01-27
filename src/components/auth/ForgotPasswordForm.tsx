/* eslint-disable no-console */
import { useState, useId } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Loader2, CheckCircle2, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface ForgotPasswordFormProps {
  /**
   * Optional callback for handling form submission
   * In production, this would call the API endpoint
   */
  onSubmit?: (email: string) => Promise<void>;
}

/**
 * Forgot password form component for initiating password reset.
 * Sends a reset link to the user's email address.
 */
export function ForgotPasswordForm({ onSubmit }: ForgotPasswordFormProps) {
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<{ email?: string; general?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const emailId = useId();

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Clear previous errors
    setErrors({});

    // Validate email
    const emailError = validateEmail(email);

    if (emailError) {
      setErrors({ email: emailError });
      return;
    }

    setIsSubmitting(true);

    try {
      if (onSubmit) {
        await onSubmit(email);
      } else {
        // Mock API call for demonstration
        await new Promise((resolve) => setTimeout(resolve, 1000));
        console.log("Password reset request for:", email);
      }
      setIsSuccess(true);
    } catch {
      setErrors({
        general: "Nie udało się wysłać linku resetującego. Spróbuj ponownie.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <Card>
        <CardHeader>
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-green-100 dark:bg-green-900/20 p-3">
              <CheckCircle2 className="size-6 text-green-600 dark:text-green-500" />
            </div>
          </div>
          <CardTitle className="text-2xl text-center">Link wysłany!</CardTitle>
          <CardDescription className="text-center">
            Sprawdź swoją skrzynkę pocztową. Wysłaliśmy link do resetowania hasła na adres:
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center font-medium">{email}</p>
          <div className="mt-6 p-4 rounded-lg bg-muted/50">
            <p className="text-sm text-muted-foreground">
              Nie otrzymałeś wiadomości? Sprawdź folder spam lub spróbuj ponownie za kilka minut.
            </p>
          </div>
        </CardContent>
        <CardFooter>
          <Button variant="outline" className="w-full" asChild>
            <a href="/auth/login">
              <ArrowLeft />
              Wróć do logowania
            </a>
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Resetuj hasło</CardTitle>
        <CardDescription>Wprowadź swój adres email, a wyślemy Ci link do zresetowania hasła</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {/* General error message */}
          {errors.general && (
            <div
              className={cn("p-3 rounded-lg bg-destructive/10 border border-destructive/20", "dark:bg-destructive/20")}
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
        </CardContent>

        <CardFooter className="flex flex-col gap-4">
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="animate-spin" />
                Wysyłanie...
              </>
            ) : (
              "Wyślij link resetujący"
            )}
          </Button>

          <Button variant="ghost" className="w-full" asChild>
            <a href="/auth/login">
              <ArrowLeft />
              Wróć do logowania
            </a>
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
