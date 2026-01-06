# Dokumentacja Procesu Autentykacji

## Analiza Wymagań

1. **Przepływy autentykacji:**
    * **Rejestracja (Sign Up):** Użytkownik podaje email/hasło -> Utworzenie konta w Supabase -> Automatyczne logowanie -> Przekierowanie do Onboardingu.
    * **Logowanie (Sign In):** Użytkownik podaje dane -> Weryfikacja w Supabase -> Ustawienie sesji (ciasteczka) -> Sprawdzenie statusu onboardingu -> Przekierowanie.
    * **Wylogowanie (Sign Out):** Żądanie wylogowania -> Usunięcie sesji w Supabase -> Wyczyszczenie ciasteczek -> Przekierowanie do logowania.
    * **Reset hasła:** Żądanie resetu -> Email z linkiem -> Kliknięcie w link (PKCE) -> Formularz nowego hasła -> Aktualizacja hasła.
    * **Weryfikacja sesji (Middleware):** Każde żądanie -> Sprawdzenie ciasteczka -> (Opcjonalnie) Odświeżenie tokenu -> Decyzja o dostępie (Guard).
    * **Usuwanie konta:** Żądanie usunięcia -> Usunięcie użytkownika w Supabase -> Kaskadowe usunięcie danych -> Wylogowanie.

2. **Główni aktorzy:**
    * **Przeglądarka (Użytkownik):** Inicjuje akcje, przechowuje ciasteczka.
    * **Middleware (Astro):** Strażnik tras, zarządza sesją i ciasteczkami po stronie serwera.
    * **Astro API (`/api/auth/*`):** Pośrednik między frontendem a Supabase, ukrywa logikę biznesową.
    * **Supabase Auth:** Dostawca tożsamości (IdP), zarządza tokenami (JWT).
    * **Supabase DB:** Przechowuje profile użytkowników, reaguje triggerami na nowe konta.

3. **Weryfikacja i odświeżanie tokenów:**
    * **Weryfikacja:** Middleware pobiera token z ciasteczek przy każdym chronionym żądaniu.
    * **Odświeżanie:** Jeśli Access Token wygasł, Middleware (przy użyciu `@supabase/ssr`) automatycznie próbuje go odświeżyć za pomocą Refresh Tokena. Jeśli się uda, aktualizuje ciasteczka. Jeśli nie, przekierowuje do logowania.

4. **Opis kroków:**
    * Proces zaczyna się od interakcji użytkownika (formularz).
    * Dane trafiają do Astro API (POST).
    * Astro API komunikuje się z Supabase Auth.
    * Supabase zwraca sesję lub błąd.
    * W przypadku sukcesu, Astro API ustawia ciasteczka `httpOnly`.
    * Middleware przy kolejnych żądaniach weryfikuje te ciasteczka i sprawdza status onboardingu w bazie danych (tabela `profiles`).

## Diagram Sekwencji

```mermaid
sequenceDiagram
    autonumber
    participant Browser as Przeglądarka
    participant Middleware as Astro Middleware
    participant API as Astro API (/api/auth)
    participant SB_Auth as Supabase Auth
    participant SB_DB as Supabase DB

    Note over Browser, SB_DB: SCENARIUSZ 1: REJESTRACJA I ONBOARDING

    activate Browser
    Browser->>API: POST /register (email, password)
    activate API
    API->>SB_Auth: signUp(email, password)
    activate SB_Auth
    
    par Utworzenie konta
        SB_Auth->>SB_DB: Insert into auth.users
        activate SB_DB
        SB_DB->>SB_DB: Trigger: Create Profile
        deactivate SB_DB
    and Zwrócenie sesji
        SB_Auth-->>API: Session (Access + Refresh Token)
    end
    deactivate SB_Auth

    API->>API: Set-Cookie (sb-access-token, sb-refresh-token)
    API-->>Browser: 200 OK (Redirect /onboarding)
    deactivate API
    
    Browser->>Middleware: GET /onboarding
    activate Middleware
    Middleware->>Middleware: Verify Cookies
    Middleware->>SB_DB: Select onboarding_status from profiles
    activate SB_DB
    SB_DB-->>Middleware: status: 'not_started'
    deactivate SB_DB
    Middleware-->>Browser: Render Onboarding Page
    deactivate Middleware
    deactivate Browser

    Note over Browser, SB_DB: SCENARIUSZ 2: LOGOWANIE I WERYFIKACJA

    activate Browser
    Browser->>API: POST /signin (email, password)
    activate API
    API->>SB_Auth: signInWithPassword(email, password)
    activate SB_Auth
    
    alt Dane poprawne
        SB_Auth-->>API: Session object
        API->>API: Set-Cookie (Tokens)
        API-->>Browser: 200 OK
        
        Browser->>Middleware: GET / (Home)
        activate Middleware
        Middleware->>Middleware: Verify & Refresh Token if needed
        
        alt Token Valid
            Middleware->>SB_DB: Check Profile Status
            activate SB_DB
            SB_DB-->>Middleware: status: 'completed'
            deactivate SB_DB
            Middleware-->>Browser: Render Home Page
        else Token Invalid/Expired
            Middleware-->>Browser: Redirect /login
        end
        deactivate Middleware

    else Błędne dane
        SB_Auth-->>API: Error (Invalid login)
        deactivate SB_Auth
        API-->>Browser: 401 Unauthorized
    end
    deactivate API
    deactivate Browser

    Note over Browser, SB_DB: SCENARIUSZ 3: OCHRONA SESJI (Middleware Guard)

    activate Browser
    Browser->>Middleware: GET /protected-route
    activate Middleware
    Middleware->>Middleware: Get Session from Cookie
    
    alt Brak sesji
        Middleware-->>Browser: Redirect /login
    else Sesja istnieje ale wygasła
        Middleware->>SB_Auth: Refresh Session (using Refresh Token)
        activate SB_Auth
        
        alt Refresh Success
            SB_Auth-->>Middleware: New Session
            Middleware->>Middleware: Update Cookies
            Middleware-->>Browser: Allow Access
        else Refresh Failed
            SB_Auth-->>Middleware: Error
            deactivate SB_Auth
            Middleware->>Middleware: Clear Cookies
            Middleware-->>Browser: Redirect /login
        end
    end
    deactivate Middleware
    deactivate Browser

    Note over Browser, SB_DB: SCENARIUSZ 4: WYLOGOWANIE

    activate Browser
    Browser->>API: POST /signout
    activate API
    API->>SB_Auth: signOut(scope: global)
    activate SB_Auth
    SB_Auth-->>API: Success
    deactivate SB_Auth
    API->>API: Clear Cookies
    API-->>Browser: Redirect /login
    deactivate API
    deactivate Browser
```
