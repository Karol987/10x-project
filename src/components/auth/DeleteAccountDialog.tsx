import { useState, useId } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, Loader2, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface DeleteAccountDialogProps {
  /**
   * Optional callback for handling account deletion
   * In production, this would call the API endpoint
   */
  onDelete?: (confirmationText: string) => Promise<void>;
  /**
   * Whether to use password confirmation instead of text confirmation
   */
  usePasswordConfirmation?: boolean;
}

/**
 * Delete account dialog component with confirmation requirement.
 * User must type "USUŃ" or enter their password to confirm deletion.
 * This is a destructive action that should be placed in a "Danger Zone" section.
 */
export function DeleteAccountDialog({ onDelete, usePasswordConfirmation = false }: DeleteAccountDialogProps) {
  const [open, setOpen] = useState(false);
  const [confirmationText, setConfirmationText] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [isDeleting, setIsDeleting] = useState(false);

  const confirmationId = useId();
  const expectedText = "USUŃ";

  const handleDelete = async () => {
    setError(undefined);

    // Validate confirmation
    if (usePasswordConfirmation) {
      if (!confirmationText) {
        setError("Hasło jest wymagane");
        return;
      }
    } else {
      if (confirmationText !== expectedText) {
        setError(`Wpisz "${expectedText}" aby potwierdzić`);
        return;
      }
    }

    setIsDeleting(true);

    try {
      if (onDelete) {
        await onDelete(confirmationText);
      } else {
        // Mock API call for demonstration
        await new Promise((resolve) => setTimeout(resolve, 1000));
        console.log("Account deletion confirmed");
      }
      // On success, close dialog and potentially redirect
      setOpen(false);
      setConfirmationText("");
    } catch {
      setError(usePasswordConfirmation ? "Nieprawidłowe hasło" : "Nie udało się usunąć konta. Spróbuj ponownie.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!isDeleting) {
      setOpen(newOpen);
      if (!newOpen) {
        // Reset state when closing
        setConfirmationText("");
        setError(undefined);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="destructive" size="sm">
          <Trash2 />
          Usuń konto
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertCircle className="size-5" />
            Usuń konto
          </DialogTitle>
          <DialogDescription className="space-y-3 pt-2">
            <p className="font-semibold">To działanie jest nieodwracalne!</p>
            <p>Usunięcie konta spowoduje trwałe usunięcie wszystkich Twoich danych, w tym:</p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Profilu użytkownika</li>
              <li>Wybranych platform streamingowych</li>
              <li>Obserwowanych twórców</li>
              <li>Historii oglądania</li>
              <li>Wszystkich preferencji i ustawień</li>
            </ul>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Error message */}
          {error && (
            <div
              className={cn("p-3 rounded-lg bg-destructive/10 border border-destructive/20", "dark:bg-destructive/20")}
              role="alert"
              aria-live="assertive"
            >
              <div className="flex items-start gap-2">
                <AlertCircle className="size-4 text-destructive shrink-0 mt-0.5" aria-hidden="true" />
                <p className="text-sm text-destructive">{error}</p>
              </div>
            </div>
          )}

          {/* Confirmation input */}
          <div className="space-y-2">
            <Label htmlFor={confirmationId}>
              {usePasswordConfirmation
                ? "Wprowadź swoje hasło aby potwierdzić"
                : `Wpisz "${expectedText}" aby potwierdzić`}
            </Label>
            <Input
              id={confirmationId}
              type={usePasswordConfirmation ? "password" : "text"}
              placeholder={usePasswordConfirmation ? "Twoje hasło" : expectedText}
              value={confirmationText}
              onChange={(e) => setConfirmationText(e.target.value)}
              aria-invalid={!!error}
              aria-describedby={error ? `${confirmationId}-error` : undefined}
              disabled={isDeleting}
              autoComplete={usePasswordConfirmation ? "current-password" : "off"}
            />
            {error && (
              <p id={`${confirmationId}-error`} className="text-sm text-destructive" role="alert">
                {error}
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isDeleting}>
            Anuluj
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
            {isDeleting ? (
              <>
                <Loader2 className="animate-spin" />
                Usuwanie...
              </>
            ) : (
              <>
                <Trash2 />
                Usuń konto
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
