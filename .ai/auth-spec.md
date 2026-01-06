# Specyfikacja Techniczna Modułu Autentykacji i Zarządzania Kontem

**Data:** 2026-01-06
**Status:** Draft
**Autor:** AI Assistant (Full-Stack Developer Role)
**Powiązane wymagania:** US-001, US-002, US-009, US-011, US-012, US-014

## 1. Wstęp

Niniejszy dokument definiuje architekturę techniczną modułu tożsamości użytkownika dla aplikacji Streamly. System oparty jest o framework Astro 5 w trybie SSR, bibliotekę React 19 dla interaktywnych formularzy oraz Supabase jako dostawcę tożsamości i bazy danych. Celem jest zapewnienie bezpiecznego, szybkiego i zgodnego z RODO mechanizmu zarządzania cyklem życia konta użytkownika.

## 2. Architektura Interfejsu Użytkownika (Frontend)

Interfejs użytkownika zostanie podzielony na dwie strefy: publiczną (Auth) i prywatną (App).

### 2.1. Layouty

1. **`src/layouts/AuthLayout.astro`** (Nowy)
    * **Przeznaczenie:** Obsługa stron: Logowanie, Rejestracja, Odzyskiwanie hasła.
    * **Struktura:** Minimalistyczny design, wycentrowany kontener (Card), brak bocznego paska nawigacji i stopki aplikacji. Tło neutralne, skupiające uwagę na formularzu.
    * **Sloty:** Główny kontener na treść formularza.

2. **`src/layouts/Layout.astro`** (Istniejący - modyfikacja)
    * **Przeznaczenie:** Strony dostępne po zalogowaniu (Home, Profile, Onboarding).
    * **Rozszerzenie:** Dodanie logiki warunkowego wyświetlania przycisku "Wyloguj" lub awatara użytkownika w nagłówku (zgodnie z US-012).

### 2.2. Struktura Stron (Astro Pages)

Wszystkie strony autentykacji będą renderowane po stronie serwera (SSR), co pozwala na wstępną weryfikację sesji przed wyrenderowaniem treści.

* `src/pages/login.astro` (US-002) - Strona logowania. Zawiera komponent `LoginForm`.
* `src/pages/register.astro` (US-001) - Strona rejestracji. Zawiera komponent `RegisterForm`.
* `src/pages/forgot-password.astro` (US-011) - Formularz inicjujący reset hasła. Zawiera komponent `ForgotPasswordForm`.
* `src/pages/update-password.astro` (US-011) - Strona docelowa z linku w emailu. Zawiera `UpdatePasswordForm`.
* `src/pages/api/auth/[...action].ts` - Endpointy API (szczegóły w sekcji Backend).

### 2.3. Komponenty React (Client-Side)

Interaktywne formularze zostaną zaimplementowane jako komponenty React ("Islands") z wykorzystaniem `react-hook-form` do obsługi stanu i `zod` do walidacji. Stylowanie oparte o `shadcn/ui` i `tailwind`.

1. **`LoginForm.tsx`**
    * **Pola:** Email, Hasło.
    * **Akcje:** "Zaloguj się", link "Zapomniałeś hasła?", link "Nie masz konta? Zarejestruj się".
    * **Walidacja:** Email (format), Hasło (wymagane).
    * **Obsługa błędu:** Wyświetlenie komunikatu "Nieprawidłowy login lub hasło" (US-002).

2. **`RegisterForm.tsx`**
    * **Pola:** Email, Hasło, Powtórz hasło.
    * **Akcje:** "Zarejestruj się", link "Masz już konto? Zaloguj się".
    * **Walidacja:**
        * Hasło min. 8 znaków (US-001).
        * Hasło musi zawierać przynajmniej jedną cyfrę i jeden znak specjalny (zgodnie z PRD 3.1).
        * Zgodność haseł.
    * **Logika:** Po sukcesie przekierowanie do `/onboarding` (US-001).

3. **`DeleteAccountDialog.tsx`** (US-009)
    * **Lokalizacja:** Osadzony w widoku profilu (`src/components/profile/`).
    * **Typ:** Modal (Dialog) z "Danger Zone".
    * **Wymaganie:** Musi wymagać wpisania słowa "USUŃ" lub ponownego podania hasła dla potwierdzenia.

4. **`SignOutButton.tsx`** (US-012)
    * **Działanie:** Wywołanie akcji wylogowania i przekierowanie (client-side redirect) do `/login`.

### 2.4. Feedback dla użytkownika

* **Toasts/Alerts:** Wykorzystanie komponentu `Toaster` (np. z biblioteki `sonner` lub `shadcn`) do wyświetlania komunikatów o sukcesie ("Link wysłany") lub błędach krytycznych.
* **Walidacja Inline:** Błędy formularzy (np. "Hasło jest za krótkie") wyświetlane bezpośrednio pod polami input.

---

## 3. Logika Backendowa (Astro & Supabase)

Ze względu na konfigurację `output: 'server'`, logika autentykacji będzie ściśle zintegrowana z backendem Astro.

### 3.1. Middleware (`src/middleware/index.ts`)

Kluczowy element bezpieczeństwa (US-014).

* **Zadania:**
    1. Inicjalizacja klienta Supabase z kontekstem żądania (przekazywanie ciasteczek).
    2. Weryfikacja tokena sesji (`access_token`) w ciasteczkach.
    3. Odświeżanie tokena (refresh token) jeśli wygasł.
    4. **Route Guard:**
        * Blokowanie dostępu do tras chronionych (`/`, `/profile`, `/onboarding`) dla niezalogowanych -> Przekierowanie do `/login`.
        * Blokowanie dostępu do tras auth (`/login`, `/register`) dla zalogowanych -> Przekierowanie do `/` (Home) lub odpowiedniego kroku onboardingu.

### 3.2. Endpointy API (`src/pages/api/auth/*`)

Zamiast bezpośrednich wywołań SDK Supabase z poziomu klienta (co jest możliwe, ale w architekturze SSR/Cookie lepiej kontrolować to serwerowo), formularze React będą wysyłać żądania `POST` do wewnętrznych endpointów Astro.

1. `POST /api/auth/register`
    * Tworzy użytkownika w Supabase Auth.
    * Automatycznie loguje po rejestracji (signIn).
    * Zwraca status 200 lub błąd (np. "User already registered").

2. `POST /api/auth/signin`
    * Przyjmuje email/hasło.
    * Weryfikuje dane w Supabase.
    * Ustawia ciasteczka sesyjne (Set-Cookie).
    * Zwraca przekierowanie lub JSON success.

3. `POST /api/auth/signout`
    * Unieważnia sesję w Supabase.
    * Czyści ciasteczka przeglądarki.
    * Przekierowuje do `/login`.

4. `POST /api/auth/delete` (US-009)
    * Endpoint chroniony (wymaga sesji).
    * Wywołuje `supabase.auth.admin.deleteUser` (wymaga klucza service_role) LUB wywołuje RPC `delete_user_account` (jeśli zaimplementowane). Alternatywnie, wykorzystanie kaskadowego usuwania (ON DELETE CASCADE) w bazie danych po usunięciu konta przez użytkownika.

### 3.3. Modele Danych

Należy upewnić się, że tabela `public.profiles` jest zsynchronizowana z `auth.users`.

* **Trigger (Database):** Istniejący trigger PostgreSQL `on_auth_user_created`, który automatycznie tworzy wpis w tabeli `public.profiles` w momencie rejestracji użytkownika.
* **Onboarding Status:** Tabela `profiles` wykorzystuje kolumnę `onboarding_status` (enum: `not_started`, `platforms_selected`, `completed`), aby Middleware mógł wymusić flow onboardingu (US-001 -> US-009).

---

## 4. System Autentykacji (Supabase Integration)

Konfiguracja klienta Supabase w projekcie musi wspierać Flow PKCE z obsługą ciasteczek (Cookie Auth) dla Astro.

### 4.1. Klient Supabase

* Lokalizacja: `src/lib/supabase.ts` (lub podobne).
* Wykorzystanie pakietu `@supabase/ssr` zamiast czystego `@supabase/supabase-js` dla lepszej obsługi ciasteczek w środowisku serwerowym Astro.
* Konfiguracja `createServerClient` w Middleware i endpointach API.
* Konfiguracja `createBrowserClient` dla komponentów React (jeśli potrzebne do np. realtime, choć tutaj głównie REST).

### 4.2. Scenariusze (Flow)

1. **Rejestracja (US-001):**
    * Frontend: Formularz -> `POST /api/auth/register`.
    * Backend: `supabase.auth.signUp()`.
    * Baza: Trigger tworzy profil z `onboarding_status = 'not_started'`.
    * Wynik: Ciasteczka ustawione, przekierowanie do `/onboarding`.

2. **Logowanie (US-002):**
    * Frontend: Formularz -> `POST /api/auth/signin`.
    * Backend: `supabase.auth.signInWithPassword()`.
    * Middleware: Sprawdza `onboarding_status`. Jeśli `not_started` lub `platforms_selected` -> przekierowanie do onboardingu.
    * Wynik: Ciasteczka ustawione, przekierowanie do `/` (jeśli status `completed`).

3. **Reset Hasła (US-011):**
    * Krok 1: `supabase.auth.resetPasswordForEmail(email, { redirectTo: '.../update-password' })`.
    * Krok 2: Użytkownik klika w link w emailu, trafia na stronę z tokenem w URL (PKCE).
    * Krok 3: `supabase.auth.updateUser({ password: newPassword })`.

4. **Usuwanie Konta (US-009):**
    * Procedura opiera się na relacji `ON DELETE CASCADE` w bazie danych (tabela `profiles` references `auth.users`).
    * Usunięcie użytkownika z `auth.users` (np. przez `supabase.rpc` lub admin api) automatycznie usuwa profil i powiązane dane.

### 4.3. Bezpieczeństwo

* **Brak zewnętrznych dostawców:** Wyłączenie providerów Google/GitHub w dashboardzie Supabase (zgodnie z US-014).
* **Walidacja haseł:** Wymuszona po stronie klienta (Zod) - minimum 8 znaków, cyfra, znak specjalny.
* **Ochrona tras:** Realizowana wyłącznie po stronie serwera (Middleware), nie tylko przez ukrywanie elementów w UI.

## 5. Podsumowanie Wdrożenia

1. **Krok 1:** Konfiguracja `@supabase/ssr` i helperów w `src/lib`.
2. **Krok 2:** Implementacja `src/middleware/index.ts` (Guard + Onboarding Check).
3. **Krok 3:** Stworzenie `AuthLayout` i stron Astro (`login`, `register`, etc.).
4. **Krok 4:** Implementacja endpointów API (`/api/auth/*`) do obsługi formularzy.
5. **Krok 5:** Budowa komponentów React z formularzami i podpięcie ich pod API.
6. **Krok 6:** Testowanie scenariuszy (Happy path & Error cases).
