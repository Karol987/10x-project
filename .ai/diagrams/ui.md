# Analiza Architektury UI

<architecture_analysis>

1. **Komponenty (na podstawie PRD i specyfikacji):**
    * **Layouty:**
        * `AuthLayout.astro`: Nowy layout dla stron autentykacji (Login, Rejestracja, Reset hasła). Minimalistyczny, brak nawigacji aplikacji.
        * `Layout.astro`: Główny layout aplikacji (istniejący). Zawiera nawigację, stopkę i logikę wylogowania (`SignOutButton`).
    * **Strony (Astro Pages):**
        * **Publiczne (Auth):** `login.astro`, `register.astro`, `forgot-password.astro`, `update-password.astro`.
        * **Prywatne (App):** `home.astro` (Dashboard), `profile.astro`, `history.astro`.
        * **Onboarding:** `onboarding/creators.astro`, `onboarding/platforms.astro`.
    * **Komponenty React (Interaktywne):**
        * **Auth:** `LoginForm`, `RegisterForm`, `ForgotPasswordForm`, `UpdatePasswordForm`, `SignOutButton`.
        * **Onboarding:** `OnboardingPlatformsContainer`, `OnboardingCreatorsContainer`, `CreatorSearch`, `PlatformGrid`.
        * **Core:** `RecommendationsFeed`, `HistoryList`, `ProfileContainer`, `ThemeToggle`.
    * **Backend/Logic:**
        * `Middleware`: Zarządzanie sesją, ochrona tras.
        * `API Endpoints`: `/api/auth/*` (proxy do Supabase), `/api/recommendations`, `/api/me/*`.

2. **Główne strony i komponenty:**
    * `/login` -> `AuthLayout` -> `LoginForm`
    * `/register` -> `AuthLayout` -> `RegisterForm`
    * `/` (Home) -> `Layout` -> `RecommendationsFeed`
    * `/profile` -> `Layout` -> `ProfileContainer` (zawiera `DeleteAccountDialog`)
    * `/onboarding` -> `Layout` -> `OnboardingSteps`

3. **Przepływ danych:**
    * **Autentykacja:** Użytkownik -> Formularz (React) -> `POST /api/auth` -> Supabase -> Cookie -> Middleware -> Przekierowanie.
    * **Aplikacja:** `Layout` weryfikuje sesję (SSR). Komponenty React (np. `RecommendationsFeed`) pobierają dane z API (`/api/recommendations`) używając ciasteczek sesyjnych.

4. **Opis funkcjonalności:**
    * **AuthLayout:** Zapewnia spójny wygląd dla stron logowania/rejestracji.
    * **Layout:** Obsługuje stan globalny UI (motyw) i nawigację.
    * **Middleware:** Strażnik dostępu, przekierowuje niezalogowanych do `/login` i zalogowanych z `/login` do `/`.
    * **Islands (React):** Obsługują interakcje (formularze, dynamiczne listy, filtrowanie) i komunikują się z API.
</architecture_analysis>

<mermaid_diagram>

```mermaid
flowchart TD
    %% Definicje klas stylów
    classDef layout fill:#e1f5fe,stroke:#01579b,stroke-width:2px;
    classDef page fill:#f3e5f5,stroke:#4a148c,stroke-width:2px;
    classDef component fill:#fff3e0,stroke:#e65100,stroke-width:2px;
    classDef logic fill:#e8f5e9,stroke:#1b5e20,stroke-width:2px;
    classDef database fill:#eceff1,stroke:#455a64,stroke-width:2px;

    %% Baza danych i Auth Provider
    Supabase[("Supabase Auth & DB")]:::database

    %% Warstwa Logiki Serwerowej
    subgraph "Server Side (Astro)"
        Middleware[("Middleware (Auth Guard)")]:::logic
        AuthAPI[["API: /api/auth/*"]]:::logic
        DataAPI[["API: /api/recommendations, /api/me"]]:::logic
    end

    %% Layouty
    subgraph "Layouts"
        AuthLayout["AuthLayout.astro"]:::layout
        AppLayout["Layout.astro"]:::layout
    end

    %% Strony i Komponenty
    subgraph "Pages & Components"
        %% Ścieżka Autentykacji
        subgraph "Auth Flow"
            LoginPage["login.astro"]:::page
            RegisterPage["register.astro"]:::page
            ForgotPage["forgot-password.astro"]:::page
            
            LoginForm["LoginForm.tsx"]:::component
            RegisterForm["RegisterForm.tsx"]:::component
            ForgotForm["ForgotPasswordForm.tsx"]:::component
        end

        %% Główna Aplikacja
        subgraph "App Flow"
            HomePage["home.astro"]:::page
            OnboardingPage["onboarding/*.astro"]:::page
            ProfilePage["profile.astro"]:::page
            HistoryPage["history.astro"]:::page

            RecFeed["RecommendationsFeed.tsx"]:::component
            OnboardingCont["OnboardingContainer.tsx"]:::component
            ProfileCont["ProfileContainer.tsx"]:::component
            HistoryList["HistoryList.tsx"]:::component
            SignOutBtn["SignOutButton.tsx"]:::component
        end
    end

    %% Połączenia - Przepływ Użytkownika i Danych
    
    %% Routing i Middleware
    Middleware ==>|Zezwól/Odrzuć| AuthLayout
    Middleware ==>|Zezwól/Odrzuć| AppLayout

    %% Struktura Stron Auth
    AuthLayout --- LoginPage
    AuthLayout --- RegisterPage
    AuthLayout --- ForgotPage

    LoginPage --> LoginForm
    RegisterPage --> RegisterForm
    ForgotPage --> ForgotForm

    %% Struktura Stron App
    AppLayout --- HomePage
    AppLayout --- OnboardingPage
    AppLayout --- ProfilePage
    AppLayout --- HistoryPage
    AppLayout --- SignOutBtn

    HomePage --> RecFeed
    OnboardingPage --> OnboardingCont
    ProfilePage --> ProfileCont
    HistoryPage --> HistoryList

    %% Interakcje Komponentów z API
    LoginForm -.->|"POST (login)"| AuthAPI
    RegisterForm -.->|"POST (register)"| AuthAPI
    SignOutBtn -.->|"POST (logout)"| AuthAPI
    
    RecFeed -.->|"GET (fetch)"| DataAPI
    OnboardingCont -.->|"GET/POST"| DataAPI
    ProfileCont -.->|"GET/PATCH"| DataAPI

    %% Backend do Supabase
    AuthAPI ==>|"Auth SDK"| Supabase
    DataAPI ==>|"DB Query"| Supabase

    %% Aktualizacje Stanu
    AuthAPI -.->|"Set-Cookie (Session)"| Middleware

    %% Legenda zmian
    linkStyle 10,11,12,13,22,23,24 stroke:#00C853,stroke-width:2px;
```

</mermaid_diagram>
