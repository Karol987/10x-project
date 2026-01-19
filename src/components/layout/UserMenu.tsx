import { useState, useCallback, useRef, useEffect } from "react";
import { User, LogOut, Settings, ChevronDown, History } from "lucide-react";

import { Button } from "../ui/button";

interface UserMenuProps {
  userEmail?: string;
}

export const UserMenu = ({ userEmail }: UserMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleLogout = useCallback(async () => {
    setIsLoggingOut(true);
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        window.location.href = "/auth/login";
      } else {
        const data = await response.json();
        console.error("Logout failed:", data.error);
        alert("Wystąpił błąd podczas wylogowywania. Spróbuj ponownie.");
      }
    } catch (error) {
      console.error("Logout error:", error);
      alert("Wystąpił błąd podczas wylogowywania. Spróbuj ponownie.");
    } finally {
      setIsLoggingOut(false);
    }
  }, []);

  const toggleMenu = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const handleProfileClick = useCallback(() => {
    window.location.href = "/profile";
    setIsOpen(false);
  }, []);

  const handleHistoryClick = useCallback(() => {
    window.location.href = "/history";
    setIsOpen(false);
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative" ref={menuRef}>
      <Button
        variant="ghost"
        onClick={toggleMenu}
        className="flex items-center gap-2"
        aria-label="Menu użytkownika"
        aria-expanded={isOpen}
      >
        <User className="h-5 w-5" />
        {userEmail && <span className="hidden sm:inline">{userEmail}</span>}
        <ChevronDown
          className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </Button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 rounded-md border bg-popover shadow-lg z-50">
          <div className="p-2">
            {userEmail && (
              <div className="px-3 py-2 text-sm text-muted-foreground border-b mb-2">
                {userEmail}
              </div>
            )}

            <button
              onClick={handleProfileClick}
              className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              <Settings className="h-4 w-4" />
              <span>Ustawienia profilu</span>
            </button>

            <button
              onClick={handleHistoryClick}
              className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              <History className="h-4 w-4" />
              <span>Historia obejrzanych</span>
            </button>

            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <LogOut className="h-4 w-4" />
              <span>{isLoggingOut ? "Wylogowywanie..." : "Wyloguj się"}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
