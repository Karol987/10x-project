import { DeleteAccountDialog } from "@/components/auth/DeleteAccountDialog";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, Shield, AlertTriangle } from "lucide-react";

interface AccountSettingsProps {
  /**
   * User email for display purposes
   */
  userEmail?: string;
}

/**
 * Account settings section for the profile page.
 * Includes sign out button and delete account dialog (danger zone).
 * 
 * Example usage in ProfileContainer:
 * ```tsx
 * <AccountSettings userEmail="user@example.com" />
 * ```
 */
export function AccountSettings({ userEmail = "user@example.com" }: AccountSettingsProps) {
  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold">Konto</h2>
        <p className="text-sm text-muted-foreground">Zarządzaj swoim kontem i bezpieczeństwem</p>
      </div>

      <div className="space-y-4">
        {/* Account Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <User className="size-4" />
              Informacje o koncie
            </CardTitle>
            <CardDescription>Twoje dane logowania</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Email</p>
              <p className="text-sm">{userEmail}</p>
            </div>
            <div className="pt-2">
              <Button variant="outline" size="sm" asChild>
                <a href="/auth/forgot-password">
                  <Shield />
                  Zmień hasło
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Session Management */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Sesja</CardTitle>
            <CardDescription>Zarządzaj swoją sesją logowania</CardDescription>
          </CardHeader>
          <CardContent>
            <SignOutButton variant="outline" size="sm" />
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 text-destructive">
              <AlertTriangle className="size-4" />
              Strefa niebezpieczna
            </CardTitle>
            <CardDescription>
              Nieodwracalne działania związane z Twoim kontem
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Usunięcie konta spowoduje trwałe usunięcie wszystkich Twoich danych. To działanie nie może być cofnięte.
            </p>
            <DeleteAccountDialog usePasswordConfirmation={false} />
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
