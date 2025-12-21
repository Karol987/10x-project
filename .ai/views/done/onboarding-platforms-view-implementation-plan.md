# Plan implementacji widoku: Onboarding – Wybór platform

## 1. Przegląd

Widok ten stanowi pierwszy krok obligatoryjnego procesu onboardingowego dla nowo zarejestrowanych użytkowników aplikacji Streamly. Jego celem jest umożliwienie użytkownikowi wskazania platform streamingowych (SVOD), które subskrybuje. Dane te są kluczowe dla silnika rekomendacji, aby wyświetlać wyłącznie treści dostępne w posiadanych przez użytkownika abonamentach.

## 2. Routing widoku

- **Ścieżka:** `/onboarding/platforms`
- **Typ renderowania:** SSR (Astro z `prerender = false`) ze względu na konieczność sprawdzania sesji i stanu onboardingu.

## 3. Struktura komponentów

```text
OnboardingLayout (Astro)
└── OnboardingPlatformsView (React - Client Component)
    ├── ProgressBar (React)
    ├── PlatformGrid (React)
    │   └── PlatformCard (React)
    └── OnboardingFooter (React)
        └── Button (Shadcn/ui)

```

## 4. Szczegóły komponentów

### OnboardingPlatformsView

- **Opis:** Główny kontener stanowy dla kroku wyboru platform. Zarządza listą wybranych ID i komunikacją z API.
- **Główne elementy:** Nagłówek ("Wybierz swoje platformy"), `ProgressBar`, `PlatformGrid`, `OnboardingFooter`.
- **Obsługiwane interakcje:** Inicjalizacja danych, zarządzanie tablicą `selectedPlatformIds`.
- **Typy:** `PlatformDTO[]`, `UUID[]`.

### ProgressBar

- **Opis:** Wizualny wskaźnik postępu onboardingu.
- **Główne elementy:** Kontener postępu z wypełnieniem (np. 50% dla kroku 1).
- **Propsy:** `currentStep: number` (w tym przypadku 1), `totalSteps: number` (w tym przypadku 2).

### PlatformGrid

- **Opis:** Responsywna siatka wyświetlająca dostępne platformy.
- **Główne elementy:** `div` z klasą `grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4`.
- **Propsy:** `platforms: PlatformDTO[]`, `selectedIds: UUID[]`, `onToggle: (id: UUID) => void`.

### PlatformCard

- **Opis:** Interaktywna karta pojedynczej platformy.
- **Główne elementy:** Logo platformy (`logo_url`), nazwa, ukryty checkbox dla dostępności cyfrowej.
- **Obsługiwane interakcje:** Kliknięcie karty przełącza stan zaznaczenia.
- **Warunki walidacji:** Atrybut `aria-pressed` odzwierciedlający stan zaznaczenia.
- **Propsy:** `platform: PlatformDTO`, `isSelected: boolean`, `onToggle: () => void`.

### OnboardingFooter

- **Opis:** Dolny pasek akcji zawierający przycisk nawigacji.
- **Główne elementy:** Przycisk "Dalej".
- **Obsługiwana walidacja:** Przycisk jest `disabled`, jeśli liczba zaznaczonych platform wynosi 0.
- **Propsy:** `isSubmitDisabled: boolean`, `onSubmit: () => void`, `isLoading: boolean`.

## 5. Typy

### PlatformSelectionViewModel

Rozszerzenie DTO o stan lokalny UI (jeśli potrzebny poza głównym stanem).

```typescript
export interface PlatformSelectionViewModel extends PlatformDTO {
  isSelected: boolean;
}

```

### OnboardingPlatformsCommand

Zgodnie z definicją w `type_definitions`:

```typescript
export interface OnboardingPlatformsCommand {
  platform_ids: UUID[];
}

```

## 6. Zarządzanie stanem

Zastosowany zostanie customowy hook `useOnboardingPlatforms`:

- **Cel:** Enkapsulacja logiki pobierania platform, zarządzania selekcją (toggle) oraz wysyłania danych.
- **Zmienne stanu:**
- `platforms: PlatformDTO[]` – lista wszystkich platform z API.
- `selectedPlatformIds: Set<UUID>` – zbiór ID wybranych platform.
- `status: 'idle' | 'loading' | 'submitting' | 'error'`.
- `errorMessage: string | null`.

## 7. Integracja API

### Pobieranie danych (GET)

- **Endpoint:** `/api/platforms`
- **Akcja:** Wywoływane w `useEffect` wewnątrz hooka. Wynik jest keszowany lokalnie w stanie komponentu.

### Zapisywanie danych (PUT)

- **Endpoint:** `/api/onboarding/platforms`
- **Metoda:** `PUT`
- **Body:** `{ platform_ids: UUID[] }`
- **Sukces (204):** Przekierowanie użytkownika do `/onboarding/creators` (krok 2).

## 8. Interakcje użytkownika

1. **Wejście na stronę:** Aplikacja pobiera listę platform. Użytkownik widzi szkielet (skeleton) lub spinner.
2. **Kliknięcie karty platformy:**

- Jeśli ID nie ma w `selectedPlatformIds`, zostaje dodane.

- Jeśli ID jest w `selectedPlatformIds`, zostaje usunięte.

3. **Walidacja przycisku:** Przycisk "Dalej" staje się aktywny natychmiast po wybraniu pierwszej platformy.
4. **Kliknięcie "Dalej":** Wywołanie endpointu PUT. Wyświetlenie stanu ładowania na przycisku.

## 9. Warunki i walidacja

- **Minimum 1 platforma:** Walidacja po stronie klienta (blokada przycisku) oraz serwera (status 422 z API).
- **Maksimum 50 platform:** Limit określony w specyfikacji API endpointu.
- **Autentykacja:** Widok dostępny tylko dla zalogowanych użytkowników. W przypadku braku sesji – przekierowanie do `/login`.

## 10. Obsługa błędów

- **Błąd pobierania list platform:** Wyświetlenie komponentu `ErrorState` z przyciskiem "Spróbuj ponownie".
- **Błąd zapisu (np. 500 lub 422):** Wyświetlenie toasta (np. z biblioteki sonner/shadcn) z komunikatem: "Wystąpił problem podczas zapisywania Twoich wyborów. Spróbuj ponownie".
- **Błąd autentykacji (401):** Automatyczne przekierowanie do strony logowania.

## 11. Kroki implementacji

1. **Przygotowanie typów:** Upewnienie się, że `PlatformDTO` i `OnboardingPlatformsCommand` są dostępne w projekcie.
2. **Implementacja hooka `useOnboardingPlatforms`:** Logika fetchowania `/api/platforms` i operacje na `Set`.
3. **Budowa komponentów prezentacyjnych:** Stworzenie `PlatformCard` i `PlatformGrid` z wykorzystaniem Tailwind 4 i Shadcn.
4. **Złożenie widoku głównego:** Implementacja `OnboardingPlatformsView` i integracja z `OnboardingLayout`.
5. **Implementacja zapisu:** Dodanie obsługi metody `PUT` i logiki przekierowania po sukcesie (`router.push`).
6. **Obsługa stanów brzegowych:** Dodanie stanu ładowania (Skeletons) oraz komunikatów o błędach.
7. **Testy UI:** Weryfikacja responsywności (mobile/desktop) oraz dostępności (klawiatura, aria-labels).
