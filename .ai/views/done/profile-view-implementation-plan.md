# Plan implementacji widoku Profil – Preferencje

## 1. Przegląd

Widok profilu umożliwia użytkownikowi zarządzanie kluczowymi ustawieniami wpływającymi na algorytm rekomendacji: subskrybowanymi platformami VOD oraz listą ulubionych twórców. Dodatkowo widok oferuje funkcje systemowe, takie jak przełącznik motywu (Dark Mode). Zgodnie z wymaganiami, zmiany w preferencjach są zapisywane natychmiastowo („instant save”), aby zapewnić płynność działania aplikacji.

## 2. Routing widoku

* **Ścieżka:** `/profile`
* **Dostępność:** Tylko dla zalogowanych użytkowników (wymagany middleware autentykacji).

## 3. Struktura komponentów

Widok zostanie zaimplementowany jako strona Astro zawierająca główny komponent Reactowy (`ProfileContainer`), który zarządza stanem i komunikacją z API.

* `ProfilePage` (Astro Page)
* `ProfileHeader` (Komponent nawigacyjny/tytułowy)
* `ProfileContainer` (React - Main Wrapper)
* `ThemeSection`
* `ThemeToggle` (Przełącznik trybu jasny/ciemny)

* `PlatformSection`
* `PlatformGrid` (Siatka dostępnych platform)
* `PlatformCard` (Karta pojedynczej platformy z checkboxem/stanem zaznaczenia)

* `CreatorSection`
* `CreatorSearch` (Input z podpowiedziami dynamicznymi)
* `CreatorList` (Lista aktualnie śledzonych twórców)
* `CreatorChip` (Avatar + Imię + Przycisk usuwania)

* `Toast` (Powiadomienia o błędach/sukcesach zapisu)

---

## 4. Szczegóły komponentów

### ProfileContainer

* **Opis:** Główny komponent zarządzający danymi (fetching) i koordynujący zapisy.
* **Główne elementy:** Kontener `max-w-4xl`, sekcje podzielone separatorami.
* **Obsługiwane interakcje:** Inicjalne pobranie danych użytkownika (platformy, twórcy).
* **Typy:** `PlatformDTO[]`, `CreatorDTO[]`.

### PlatformCard

* **Opis:** Interaktywna karta reprezentująca platformę VOD.
* **Główne elementy:** Logo platformy (`img`), nazwa, wizualny wskaźnik zaznaczenia (border/shadow).
* **Obsługiwane interakcje:** Click (toggle zaznaczenia).
* **Warunki walidacji:** System musi uniemożliwić odznaczenie wszystkich platform (wymagana min. 1).
* **Propsy:** `platform: PlatformDTO`, `isSelected: boolean`, `onToggle: (id: string) => void`, `isDisabled: boolean`.

### CreatorSearch

* **Opis:** Wyszukiwarka twórców z wynikami "na żywo".
* **Główne elementy:** Input tekstowy, lista wyników (popover lub dropdown).
* **Obsługiwane interakcje:** `onChange` (z debouncem 300ms), `onSelect` (wybór twórcy z listy).
* **Warunki walidacji:** Min. 2 znaki przed wysłaniem zapytania do `/creators?q=`.
* **Typy:** `CreatorDTO[]` (wyniki wyszukiwania).

### CreatorChip

* **Opis:** Reprezentacja wybranego twórcy.
* **Główne elementy:** `Avatar` (shadcn/ui), imię i nazwisko, rola (aktor/reżyser), ikona "X".
* **Obsługiwane interakcje:** `onRemove` (kliknięcie w ikonę usuwania).
* **Propsy:** `creator: CreatorDTO`, `onRemove: (id: string) => void`.

---

## 5. Typy

Większość typów pochodzi z `src/types.ts`. Poniżej typy rozszerzone na potrzeby widoku:

```typescript
/** ViewModel dla stanu platform w UI */
export interface PlatformSelectionViewModel extends PlatformDTO {
  isSelected: boolean;
  isPending: boolean; // Stan ładowania dla konkretnej karty podczas PUT
}

/** Rozszerzenie stanu wyszukiwania */
export interface CreatorSearchState {
  results: CreatorDTO[];
  isLoading: boolean;
  query: string;
}

```

---

## 6. Zarządzanie stanem

Zastosowany zostanie niestandardowy hook `useProfilePreferences`, oparty na **TanStack Query (React Query)**:

* **State:**
* `userPlatforms`: Pobierane z `GET /me/platforms`.
* `userCreators`: Pobierane z `GET /me/creators`.

* **Mutations:**
* `updatePlatforms`: Wywołuje `PUT /me/platforms` przy każdej zmianie zaznaczenia. Wykorzystuje **Optimistic Updates** dla natychmiastowej reakcji UI.
* `addCreator`: Wywołuje `POST /me/creators`.
* `removeCreator`: Wywołuje `DELETE /me/creators/:id`.

* **Theme State:** Zarządzany lokalnie (localStorage + klasa w `document.documentElement`).

---

## 7. Integracja API

| Akcja | Endpoint | Metoda | Payload |
| --- | --- | --- | --- |
| Pobranie wszystkich platform | `/api/platforms` | GET | - |
| Pobranie platform użytkownika | `/api/me/platforms` | GET | - |
| Aktualizacja platform | `/api/me/platforms` | PUT | `{ platform_ids: UUID[] }` |
| Pobranie twórców użytkownika | `/api/me/creators` | GET | - |
| Wyszukiwanie twórców | `/api/creators?q={query}` | GET | - |
| Dodanie twórcy | `/api/me/creators` | POST | `{ creator_id: UUID }` |
| Usunięcie twórcy | `/api/me/creators/{id}` | DELETE | - |

---

## 8. Interakcje użytkownika

1. **Zmiana platformy:** Użytkownik klika w kartę Netflix. UI natychmiast zaznacza kartę (Optimistic UI), w tle leci `PUT`. Jeśli API zwróci błąd, zaznaczenie jest cofane i wyświetlany jest `Toast`.
2. **Szukanie twórcy:** Użytkownik wpisuje "Nolan". Po 300ms pojawia się lista podpowiedzi. Wybór elementu dodaje go do listy i czyści pole wyszukiwania.
3. **Usuwanie twórcy:** Kliknięcie w "X" na chipie twórcy. Element znika natychmiast, w tle leci `DELETE`.
4. **Przełącznik motywu:** Zmiana `ThemeToggle` natychmiast aplikuje klasę `.dark` do tagu `<html>`.

---

## 9. Warunki i walidacja

* **Minimum platform:** Komponent `PlatformGrid` sprawdza, czy `selectedPlatforms.length > 1`. Jeśli nie, ostatnia zaznaczona karta ma zablokowaną możliwość odznaczenia (`disabled`).
* **Duplikaty twórców:** Wyszukiwarka `CreatorSearch` filtruje wyniki, nie pokazując osób, które są już na liście `userCreators`.
* **Wymagana liczba twórców:** Chociaż PRD wymaga 3 twórców przy onboardingu, profil pozwala na ich swobodną edycję. Jednak w przypadku posiadania < 3 twórców, system wyświetli ostrzeżenie (Yellow Toast/Alert), że rekomendacje mogą być niekompletne.

---

## 10. Obsługa błędów

* **Błąd 409 (Conflict):** Przy próbie dodania twórcy, który już jest w ulubionych (np. z innej karty przeglądarki) – ciche zignorowanie lub Toast informacyjny.
* **Błąd 5xx / Offline:** Użycie `onError` w React Query do wycofania zmian w UI (Rollback) i pokazania komunikatu: "Nie udało się zapisać zmian. Spróbuj ponownie później."
* **Pusta lista wyszukiwania:** Jeśli `/creators?q=...` nie zwróci wyników, wyświetlamy komunikat "Nie znaleziono twórcy o tym nazwisku".

---

## 11. Kroki implementacji

1. **Setup Typów:** Dodanie brakujących interfejsów ViewModel do `src/types.ts`.
2. **Komponenty Atomowe:** Implementacja `PlatformCard` i `CreatorChip` przy użyciu Tailwind 4 i Shadcn/ui.
3. **Hook `useProfilePreferences`:** Stworzenie hooka zarządzającego zapytaniami i mutacjami z użyciem `@tanstack/react-query`.
4. **Sekcja Platform:** Budowa `PlatformGrid` z logiką blokowania odznaczenia ostatniego elementu.
5. **Sekcja Twórców:** Implementacja wyszukiwarki z debouncem oraz listy chipów.
6. **Zapis automatyczny:** Integracja mutacji pod zdarzenia `onClick` (platformy) i `onSelect/onRemove` (twórcy).
7. **Theme Switcher:** Dodanie `ThemeToggle` działającego z Tailwind 4 (klasa `.dark`).
8. **Testy Integracyjne:** Weryfikacja, czy zmiany w profilu poprawnie odświeżają dane po powrocie na stronę główną (mechanizm unieważniania cache'u rekomendacji w React Query).
