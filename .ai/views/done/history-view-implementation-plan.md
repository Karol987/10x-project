# Plan implementacji widoku Historii Obejrzanych

## 1. Przegląd

Widok Historii (`/history`) umożliwia użytkownikowi przeglądanie listy filmów i seriali, które zostały oznaczone jako "obejrzane". Kluczowym celem jest dostarczenie przejrzystego interfejsu do zarządzania historią, w tym usuwania pozycji z listy (cofnięcia oznaczenia), co bezpośrednio wpływa na algorytm rekomendacji na ekranie głównym. Widok wykorzystuje stronicowanie oparte na kursorze (cursor-based pagination) oraz mechanizm "infinite scroll".

## 2. Routing widoku

* **Ścieżka:** `/history`
* **Typ:** Strona renderowana po stronie klienta (React) wewnątrz kontenera Astro.
* **Dostęp:** Tylko dla zalogowanych użytkowników (wymagany JWT).

## 3. Struktura komponentów

* `HistoryPage` (Główny kontener)
* `HistoryHeader` (Nagłówek sekcji)
* `HistoryList` (Kontener listy z obsługą infinite scroll)
* `WatchedItemRow` (Pojedynczy wiersz produkcji)
* `HistorySkeleton` (Stan ładowania)

* `EmptyHistoryState` (Widok w przypadku braku danych)

---

## 4. Szczegóły komponentów

### `HistoryList`

* **Opis:** Główny silnik listy. Odpowiada za pobieranie danych z API, zarządzanie stanem paginacji i wykrywanie momentu, w którym należy doładować więcej elementów.
* **Główne elementy:** `div` z atrybutem `role="list"`, `IntersectionObserver` (do wykrywania końca listy).
* **Obsługiwane interakcje:** Przewijanie strony, wyzwalanie kolejnych żądań API.
* **Typy:** `WatchedItemDTO[]`, `UUID`.
* **Propsy:** Brak (zarządza własnym stanem przez hook).

### `WatchedItemRow`

* **Opis:** Reprezentuje pojedynczy film lub serial w historii.
* **Główne elementy:** Tytuł (h3), rok produkcji (span), ikona typu mediów, przycisk "Usuń" (button z Shadcn/ui).
* **Obsługiwane interakcje:** Kliknięcie przycisku usuwania (wywołanie `DELETE /me/watched/:id`).
* **Obsługiwana walidacja:** Identyfikator `id` musi być poprawnym formatem UUID.
* **Typy:** `WatchedItemDTO`.
* **Propsy:** - `item: WatchedItemDTO`
* `onDelete: (id: string) => Promise<void>`

### `HistorySkeleton`

* **Opis:** Stan wizualny podczas ładowania pierwszej strony danych lub kolejnych paczek.
* **Główne elementy:** `Skeleton` z Shadcn/ui imitujący kształt wiersza `WatchedItemRow`.

---

## 5. Typy

Wykorzystujemy typy zdefiniowane w `src/types.ts` oraz rozszerzamy je o potrzeby UI.

```typescript
// Re-użycie z types.ts
export type WatchedItemDTO = {
  id: string; // UUID
  external_movie_id: string;
  media_type: "movie" | "series";
  title: string;
  year: number | null;
  created_at: string;
};

// Struktura odpowiedzi z API
export interface PaginatedWatchedResponse {
  data: WatchedItemDTO[];
  next_cursor: string | null;
}

// Model widoku dla płynnego UI
export interface WatchedItemViewModel extends WatchedItemDTO {
  isDeleting?: boolean; // Stan ładowania podczas usuwania
}

```

---

## 6. Zarządzanie stanem

Zarządzanie stanem będzie oparte na niestandardowym hooku **`useInfiniteHistory`**.

* **Zmienne stanu:**
* `items`: Tablica `WatchedItemViewModel[]`.
* `cursor`: String przechowujący ID ostatniego elementu dla paginacji.
* `isLoading`: Boolean dla pierwszego ładowania.
* `isFetchingNextPage`: Boolean dla doładowywania danych.
* `error`: Przechowywanie komunikatów o błędach API.

* **Logika:** Hook będzie używał `useEffect` do inicjalnego pobrania danych oraz funkcję `fetchNextPage`, która będzie doklejać dane do stanu `items`.

---

## 7. Integracja API

Integracja odbywa się poprzez standardowy `fetch` lub dedykowanego klienta API.

* **Pobieranie listy (GET `/api/me/watched`):**
* **Query:** `?cursor={uuid}&limit=20`
* **Success:** Zwraca `PaginatedResponse<WatchedItemDTO>`.

* **Usuwanie (DELETE `/api/me/watched/:id`):**
* **Path Param:** `id` (UUID elementu w tabeli `watched_items`, nie zewnętrzny ID filmu).
* **Success:** Status 204 No Content.

---

## 8. Interakcje użytkownika

1. **Wejście na stronę:** Automatyczne wywołanie GET. Wyświetlenie szkieletów (Skeletons).
2. **Infinite Scroll:** Gdy użytkownik dotrze do 80% wysokości listy, wyzwalane jest pobranie kolejnej paczki przy użyciu `next_cursor`.
3. **Usuwanie pozycji:**

* Użytkownik klika "Usuń".
* Stan `isDeleting` dla tego wiersza zmienia się na `true` (przycisk staje się nieaktywny/pokazuje spinner).
* Po sukcesie API: Element jest usuwany z lokalnej tablicy `items` (Optimistic Update/UI Sync).
* Po błędzie: Wyświetlenie Toastu z informacją o błędzie i przywrócenie interaktywności.

---

## 9. Warunki i walidacja

* **Pusta lista:** Jeśli pierwszy GET zwróci `data: []`, wyświetlamy komponent `EmptyHistoryState` z linkiem do ekranu rekomendacji.
* **Koniec danych:** Jeśli `next_cursor` w odpowiedzi jest `null`, `IntersectionObserver` zostaje odpięty, aby nie wysyłać zbędnych zapytań.
* **Wymagania API:** Każde żądanie musi zawierać nagłówek `Authorization: Bearer <token>`.

---

## 10. Obsługa błędów

* **Błąd sieci/API (500):** Wyświetlenie komunikatu "Wystąpił problem z pobraniem historii" z przyciskiem "Spróbuj ponownie".
* **Błąd autoryzacji (401):** Przekierowanie użytkownika do strony logowania.
* **Błąd usuwania (404/400):** Wyświetlenie powiadomienia Toast: "Nie udało się usunąć elementu. Spróbuj ponownie później".

---

## 11. Kroki implementacji

1. **Przygotowanie typów:** Upewnij się, że `WatchedItemDTO` jest poprawnie zaimportowany z `src/types.ts`.
2. **Komponent `WatchedItemRow`:** Stworzenie statycznego widoku wiersza z Tailwind 4.
3. **Custom Hook `useInfiniteHistory`:**

* Implementacja `fetch` z obsługą kursora.
* Obsługa stanu `items` i `nextCursor`.

4. **Komponent `HistoryList`:**

* Implementacja `Intersection Observer` (można użyć biblioteki lub natywnego API).
* Mapowanie `items` na `WatchedItemRow`.

5. **Obsługa usuwania:**

* Dodanie funkcji `handleDelete` w hooku lub komponencie nadrzędnym.
* Implementacja poprawnego zarządzania stanem podczas usuwania (disable button).

6. **Obsługa stanów brzegowych:**

* Dodanie `HistorySkeleton`.
* Implementacja `EmptyHistoryState`.

7. **Testy manualne:**

* Sprawdzenie zachowania przy wolnym połączeniu (ładowanie kolejnych stron).
* Weryfikacja, czy usunięcie elementu poprawnie czyści listę bez przeładowania strony.
