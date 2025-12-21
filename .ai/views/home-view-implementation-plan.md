# Plan implementacji widoku Home (Rekomendacje)

## 1. Przegląd

Widok "Home" jest głównym ekranem aplikacji Streamly dla zalogowanego użytkownika. Jego celem jest wyświetlenie spersonalizowanej listy rekomendacji filmów i seriali ("feed"), opartych na subskrybowanych platformach i ulubionych twórcach. Widok obsługuje „infinite scroll” oraz pozwala na szybkie oznaczanie tytułów jako „obejrzane”, co usuwa je z listy.

## 2. Routing widoku

- **Ścieżka:** `/home`
- **Plik Astro:** `src/pages/home.astro`
- **Dostęp:** Wymaga autentykacji (chroniony przez middleware).

## 3. Struktura komponentów

Widok będzie zbudowany w oparciu o architekturę Astro (kontener strony) + React (interaktywna lista).

```text
src/pages/home.astro (Layout: MainLayout)
└── RecommendationsFeed (React Component - client:load)
    ├── LoadingSkeleton (Podczas inicjalnego ładowania)
    ├── ErrorState (W przypadku błędu API 5xx)
    ├── EmptyState (W przypadku braku wyników)
    └── InfiniteScrollList
        ├── RecommendationCard (x N)
        │   ├── CardImage (Plakat)
        │   ├── CardContent (Tytuł, Rok, Gatunek)
        │   ├── PlatformBadges (Logotypy/Nazwy platform)
        │   ├── CreatorBadges (Powiązani twórcy)
        │   └── WatchedButton (Akcja "Oznacz jako obejrzane")
        └── LoadingSpinner (Loader dla kolejnych stron)
```

## 4. Szczegóły komponentów

### 1. `RecommendationsFeed` (Container)

- **Opis:** Główny komponent zarządzający stanem listy, pobieraniem danych i logiką biznesową.
- **Główne elementy:** Wrapper dla stanów logicznych (Error, Empty, Loading, List).
- **Obsługiwane zdarzenia:**
  - `onLoadMore`: Wywołanie API po kolejną stronę wyników.
  - `onMarkWatched`: Obsługa kliknięcia w przycisk "Obejrzane".
  - `onRetry`: Ponowienie pobierania w przypadku błędu.
- **Typy:** `RecommendationDTO[]` (stan wewnętrzny).
- **Propsy:** Brak (pobiera dane samodzielnie wewnątrz).

### 2. `RecommendationCard`

- **Opis:** Karta prezentująca pojedynczy film/serial.
- **Główne elementy:** `Card` (Shadcn), `img` (poster), `Badge` (platformy/twórcy).
- **Propsy:**
  - `item`: `RecommendationViewModel`
  - `onWatched`: `(id: UUID) => void`
  - `isMarking`: `boolean` (czy trwa request oznaczania)

### 3. `WatchedButton`

- **Opis:** Przycisk akcji z ikoną (np. oko lub "check").
- **Interakcja:** Kliknięcie uruchamia optymistyczną aktualizację interfejsu.
- **Propsy:** `onClick`, `isLoading`.

### 4. `EmptyState`

- **Opis:** Wyświetlany, gdy API zwróci pustą listę (0 rekomendacji).
- **Treść:** Komunikat z PRD: "Nie znaleziono rekomendacji. Spróbuj dodać więcej twórców lub platform."
- **Akcja:** Link (`<a>` lub `Link`) do `/profile`.

### 5. `ErrorState`

- **Opis:** Wyświetlany przy błędzie krytycznym API.
- **Treść:** "Wystąpił problem z pobraniem danych. Spróbuj ponownie później."
- **Akcja:** Przycisk "Odśwież".

## 5. Typy

Wymagane rozszerzenie typów z `src/types.ts` na potrzeby widoku.

### ViewModel

```typescript
// Rozszerzenie DTO o stan lokalny interfejsu (jeśli potrzebny, np. do animacji usuwania)
export interface RecommendationViewModel extends RecommendationDTO {
  isOptimisticallyHidden?: boolean; // Flaga do ukrywania elementu przed potwierdzeniem z API
}
```

### API Types

```typescript
import type { WatchedItemCreateCommand } from "@/types";

// Struktura odpowiedzi z endpointu GET /recommendations
export type RecommendationsResponse = RecommendationDTO[];

// Typ wykorzystywany przy żądaniu POST /me/watched
// Zdefiniowany w src/types.ts:
// export type WatchedItemCreateCommand = Pick<
//   WatchedInsert,
//   "external_movie_id" | "media_type" | "title" | "year" | "meta_data"
// >;
```

## 6. Zarządzanie stanem

Zastosowany zostanie **Custom Hook `useRecommendations`**, który zamknie w sobie logikę:

1. **Stan listy:** `items` (tablica `RecommendationDTO`).
2. **Stan paginacji:** `cursor` (UUID ostatniego elementu), `hasMore` (boolean), `isLoadingMore` (boolean).
3. **Stan początkowy:** `isInitialLoading` (boolean), `error` (Error | null).
4. **Logika "Optimistic UI":**
    - Funkcja `markAsWatched(item)`:
        1. Natychmiast usuwa (lub ukrywa) element z lokalnego stanu `items`.
        2. Wysyła żądanie `POST /api/me/watched`.
        3. W przypadku błędu (catch): przywraca element do listy i wyświetla `Toast` z błędem.

## 7. Integracja API

### Pobieranie rekomendacji (GET)

- **URL:** `/api/recommendations`
- **Parametry:** `?limit=50` oraz `?cursor={last_item_id}` (dla kolejnych stron).
- **Typ odpowiedzi:** `RecommendationDTO[]`
- **Parsowanie:** Odpowiedź JSON (tablica) mapowana do stanu. Kursor dla następnego zapytania to `id` ostatniego elementu.

### Oznaczanie jako obejrzane (POST)

- **URL:** `/api/me/watched`
- **Body:** Musi być zgodne z typem `WatchedItemCreateCommand` z `src/types.ts`.

  ```typescript
  // Przykładowe body (WatchedItemCreateCommand)
  {
    external_movie_id: "tt1234567",
    media_type: "movie", // lub "series"
    title: "Incepcja",
    year: 2010,
    meta_data: {
      poster_path: "/path/to/poster.jpg"
    }
  }
  ```

- **Wymagania:** Dane do body muszą pochodzić bezpośrednio z obiektu `RecommendationDTO`.
  - `external_movie_id` -> z `item.external_movie_id`
  - `media_type` -> z `item.media_type`
  - `title` -> z `item.title`
  - `year` -> z `item.year` (uwaga: `year` w DTO może być nullem, w Command `number | undefined` - należy obsłużyć)
  - `meta_data.poster_path` -> nie ma bezpośrednio w `RecommendationDTO` w tym momencie.
    - **UWAGA:** Należy sprawdzić, czy `RecommendationDTO` posiada `poster_path`.
    - *Analiza:* `RecommendationDTO` w `src/types.ts` nie ma pola `poster_path` ani `meta_data`. Ma tylko `id, external_movie_id, media_type, title, year, creators, platforms`.
    - *Rozwiązanie:* `RecommendationDTO` powinno zostać rozszerzone o `poster_path` (lub `meta_data`) po stronie backendu, LUB frontend musi sobie radzić bez tego (ale POST wymaga `poster_path` w `meta_data`).
    - *Założenie:* Przyjmujemy, że `RecommendationDTO` zostanie zaktualizowane lub frontend przekaże pusty string/placeholder jeśli backend tego nie zwraca, aby spełnić kontrakt POST. *Alternatywnie: plakat jest pobierany osobno, ale to mało wydajne.*
    - *Decyzja do planu:* Zakładamy, że `RecommendationDTO` posiada potrzebne dane lub zostaną one dodane.

## 8. Interakcje użytkownika

1. **Wejście na stronę:** Automatyczne pobranie pierwszej partii (50) wyników. Wyświetlenie szkieletów (Skeleton) podczas ładowania.
2. **Przewijanie (Infinite Scroll):** Gdy użytkownik zbliży się do dołu listy (np. element obserwujący `IntersectionObserver`), automatycznie pobierane są kolejne wyniki i doklejane do listy.
3. **Kliknięcie "Oznacz jako obejrzane":**
    - Karta znika natychmiast.
    - Pojawia się "Toast".
    - Jeśli wystąpi błąd sieci, karta wraca na swoje miejsce, a użytkownik widzi komunikat błędu.
4. **Brak wyników:** Użytkownik widzi informację i klika w link do edycji profilu.

## 9. Warunki i walidacja

Walidacja odbywa się głównie po stronie backendu, frontend musi jedynie zapewnić poprawność struktury danych wysyłanych w `POST`.

- **Spójność danych:** Upewnić się, że `external_movie_id` i `media_type` są zawsze obecne w obiekcie `RecommendationDTO` przed wysłaniem żądania.
- **Unikalność kluczy:** Przy renderowaniu listy upewnić się, że `key={item.id}` jest unikalne (zabezpieczenie przed duplikatami z paginacji).

## 10. Obsługa błędów

- **Błąd 401 (Unauthorized):** Przekierowanie do `/login` (obsługiwane globalnie lub przez middleware, ale warto obsłużyć w `fetch`).
- **Błąd 500 (Server Error):** Wyświetlenie komponentu `ErrorState` z możliwością ponowienia (Retry).
- **Błąd 409 (Conflict - już obejrzane):** Traktować jako sukces (element i tak ma zniknąć z listy rekomendacji).
- **Błąd sieci przy oznaczaniu:** Toast z wiadomością "Nie udało się zapisać zmian. Sprawdź połączenie." i przywrócenie elementu.

## 11. Kroki implementacji

1. **Przygotowanie środowiska:**
    - Utworzenie pliku `src/pages/home.astro`.
    - Utworzenie katalogu `src/components/recommendations`.
2. **Implementacja serwisu API (Frontend):**
    - Stworzenie funkcji pomocniczych `fetchRecommendations` i `markMovieAsWatched` w `src/lib/api.ts` (lub podobnym).
    - Funkcja `markMovieAsWatched` musi przyjmować `WatchedItemCreateCommand`.
3. **Implementacja Hooka (`useRecommendations`):**
    - Obsługa `fetching`, `infinite scroll`, `optimistic updates`.
4. **Budowa komponentów UI (Statyczne):**
    - `RecommendationCard` (z wykorzystaniem komponentów Shadcn).
    - `EmptyState` i `ErrorState`.
5. **Integracja "RecommendationsFeed":**
    - Połączenie hooka z komponentami UI.
    - Dodanie obsługi `IntersectionObserver` dla paginacji.
6. **Osadzenie w Astro:**
    - Dodanie `<RecommendationsFeed client:load />` do `src/pages/home.astro`.
7. **Testy manualne:**
    - Weryfikacja scenariuszy: Happy Path, Pusta lista, Błąd API, Scroll, Oznaczanie.
