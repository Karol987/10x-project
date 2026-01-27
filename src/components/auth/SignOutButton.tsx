import { useState } from "react";
import { Button } from "@/components/ui/button";
import { LogOut, Loader2 } from "lucide-react";
import type { VariantProps } from "class-variance-authority";
import type { buttonVariants } from "@/components/ui/button";

interface SignOutButtonProps extends VariantProps<typeof buttonVariants> {
  /**
   * Optional callback for handling sign out
   * In production, this would call the API endpoint
   */
  onSignOut?: () => Promise<void>;
  /**
   * Whether to show the icon
   */
  showIcon?: boolean;
  /**
   * Custom button text
   */
  children?: React.ReactNode;
}

/**
 * Sign out button component that handles user logout.
 * Calls the sign out API and redirects to login page.
 */
export function SignOutButton({
  onSignOut,
  showIcon = true,
  children = "Wyloguj się",
  variant = "ghost",
  size = "default",
  ...props
}: SignOutButtonProps) {
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    setIsSigningOut(true);

    try {
      if (onSignOut) {
        await onSignOut();
      } else {
        // Mock API call for demonstration
        await new Promise((resolve) => setTimeout(resolve, 500));
        console.log("Sign out successful");
      }
      // Redirect to login page
      window.location.href = "/login";
    } catch (error) {
      console.error("Sign out failed:", error);
      // Still redirect even if API call fails
      window.location.href = "/login";
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <Button variant={variant} size={size} onClick={handleSignOut} disabled={isSigningOut} {...props}>
      {isSigningOut ? (
        <>
          <Loader2 className="animate-spin" />
          Wylogowywanie...
        </>
      ) : (
        <>
          {showIcon && <LogOut />}
          {children}
        </>
      )}
    </Button>
  );
}
