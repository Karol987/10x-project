# Architektura UI dla Streamly

## 1. Przegląd struktury UI

Aplikacja Streamly składa się z pięciu głównych obszarów routingu zabezpieczonych statusem logowania oraz stanem onboardingu:

1. **Auth** – publiczne ekrany logowania/rejestracji/resetu hasła.
2. **Onboarding** – dwustopniowy kreator (platformy ➜ twórcy) widoczny wyłącznie dla nowo zarejestrowanych użytkowników.
3. **Home** – ekran rekomendacji dostępny po zakończeniu onboardingu.
4. **Profile** – zarządzanie preferencjami i ustawieniami konta.
5. **History** – lista obejrzanych pozycji.

Hierarchia tras (Astro + React Router):
```
/
 ├─ /auth                (AuthLayout)
 │   ├─ /auth/login
 │   ├─ /auth/register
 │   ├─ /auth/forgot-password
 │   └─ /auth/reset-password
 ├─ /onboarding          (WizardLayout – guard: !completed)
 │   ├─ /onboarding/platforms  (step 1)
 │   └─ /onboarding/creators   (step 2)
 ├─ /home                (AppLayout – guard: completed)
 ├─ /profile             (AppLayout)
 └─ /history             (AppLayout)
```
Warstwy `AuthLayout`, `WizardLayout` i `AppLayout` udostępniają odpowiednie paski nawigacji, kontekst tematu (light/dark) i obsługę błędów.

## 2. Lista widoków

| Widok | Ścieżka | Główny cel | Kluczowe informacje | Kluczowe komponenty | UX / A11y / Security |
|-------|---------|------------|---------------------|---------------------|-----------------------|
| **Login** | `/auth/login` | Autoryzacja istniejących użytkowników | Formularz e-mail + hasło, link „Zapomniałem hasła”, komunikaty błędów | `AuthForm`, `PasswordInput`, `Button`, `Alert` | Autouzupełnianie off, aria-invalid, komunikaty w polu, zabezpieczenie CSRF |
| **Register** | `/auth/register` | Rejestracja konta | Formularz e-mail + hasło, walidacja siły hasła | `AuthForm`, `PasswordStrengthBar` | Pola required, feedback w czasie rzeczywistym |
| **Forgot Password** | `/auth/forgot-password` | Inicjacja resetu hasła | Pole e-mail + potwierdzenie wysyłki linku | `AuthForm`, `Alert` | Brak ujawniania czy e-mail istnieje |
| **Reset Password** | `/auth/reset-password` | Ustawienie nowego hasła | Pola hasło + powtórzenie | `AuthForm` | Token z URL, walidacja hasła |
| **Onboarding – Platformy** | `/onboarding/platforms` | Wybór min. 1 platformy | Lista kart platform z checkboxami | `PlatformCard`, `ProgressBar`, `Button` | Disabled „Dalej” dopóki <1, aria-pressed |
| **Onboarding – Twórcy** | `/onboarding/creators` | Dodanie ≥3 ulubionych twórców | Pole wyszukiwarki, lista wybranych | `SearchInput`, `CreatorChip`, `ProgressBar`, `Button` | Autocomplete live-region, disabled „Zakończ” dopóki <3 |
| **Home (Rekomendacje)** | `/home` | Lista spersonalizowanych tytułów | Karty filmu/serialu (plakat, meta, przycisk „Watched”) | `RecommendationCard`, `InfiniteList`, `Skeleton`, `Toast`, `UndoSnackbar` | Lazy load obrazów, aria-busy na liście, optymistyczne mutacje |
| **Profile – Preferencje** | `/profile` | Edycja platform i twórców + dark mode | Sekcje „Platformy”, „Twórcy”, przełącznik motywu | `PlatformCard`, `CreatorChip`, `ThemeToggle`, `Toast` | Automatyczny zapis, focus management |
| **History** | `/history` | Przegląd obejrzanych pozycji | Paginated list z datą i tytułem | `WatchedItemRow`, `InfiniteList`, `Skeleton` | Forward-cursor hook, aria-labelledby list |
| **Session Expired** | (overlay) | Informacja o wygaśnięciu sesji | Modal z przyciskiem „Zaloguj ponownie” | `Modal`, `Button` | Trapping focus, role="alertdialog" |
| **Global Error** | (fallback) | Wyświetlenie błędu krytycznego | Komunikat + przycisk „Odśwież” | `ErrorFallback` | Odseparowany od reszty UI |

## 3. Mapa podróży użytkownika

1. **Nowy użytkownik**
   1.1. Otwiera `/auth/register` → tworzy konto → sukces → redirect `/onboarding/platforms`.
   1.2. Wybiera ≥1 platformę → „Dalej” → `/onboarding/creators`.
   1.3. Dodaje ≥3 twórców → „Zakończ” → zapis, prefetch `/recommendations?limit=20`, redirect `/home`.
   1.4. Przegląda listę, oznacza tytuły jako obejrzane (optimizm + toast Undo).
   1.5. W dowolnym momencie nawigacja do `/profile` (edycja) lub `/history`.

2. **Powracający użytkownik**
   2.1. Otwiera aplikację → middleware sprawdza cookie.
   2.2. Jeśli token wygasł → overlay „Sesja wygasła” → login i powrót do żądanej trasy.
   2.3. Jeśli onboarding incomplete → redirect do odpowiedniego kroku.

## 4. Układ i struktura nawigacji

• **AuthLayout** – brak głównej nawigacji, logo + karta formularza centrowana.
• **WizardLayout** – progres bar (2 kroki), przycisk „Dalej/Zakończ”, brak linków na skróty.
• **AppLayout** – nagłówek z logo i ikonami: Home, Profile, History, Logout; persistent `ThemeToggle`.
• Nawigacja klienta chroniona przez `<RequireAuth>` oraz `<RequireOnboardingCompleted>` wrappers.
• Forward-cursor hook w Home i History automatycznie pobiera kolejne strony przy 80 % scrollu.

## 5. Kluczowe komponenty wielokrotnego użytku

| Komponent | Rola |
|-----------|------|
| `AuthForm` | Uniwersalny formularz do logowania/rejestracji/resetu hasła z obsługą błędów 400/401/422 |
| `PlatformCard` | Karta platformy z checkboxem, wykorzystywana w Onboardingu i Profilu |
| `CreatorChip` | Odznaczalny chip z nazwą twórcy; tryb readonly (Home) i selectable (Onboarding/Profile) |
| `RecommendationCard` | Karta rekomendacji z plakatem, metadanymi i przyciskiem „Watched” |
| `WatchedItemRow` | Wiersz pozycji w historii |
| `InfiniteList` | Kontener obsługujący skeletony, końcowy spinner i hook paginacji |
| `Toast` / `UndoSnackbar` | Globalne powiadomienia sukces/undo |
| `ThemeToggle` | Przełącznik light/dark zapisujący preferencję w localStorage |
| `ProgressBar` | Pasek postępu 2-krokowego kreatora |
| `ErrorFallback` | Komponent błędu z przyciskiem „Retry/Refresh” |
| `Modal` | Dostępny modal (sesja wygasła, potwierdzenie usunięcia konta) z focus trap |

---
Dokument mapuje wszystkie historyjki użytkownika (US-001 → US-013) na odpowiadające widoki i komponenty, zapewniając zgodność z API oraz spełnienie wymagań UX, A11y i bezpieczeństwa.
