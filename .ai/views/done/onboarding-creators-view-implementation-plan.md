# Plan implementacji widoku Onboarding – Twórcy

## 1. Przegląd

Widok `/onboarding/creators` jest drugim i ostatnim krokiem procesu wprowadzania nowego użytkownika (onboarding) do aplikacji Streamly. Jego celem jest zebranie informacji o ulubionych twórcach (aktorach i reżyserach), co stanowi fundament algorytmu rekomendacji. Użytkownik musi wybrać co najmniej 3 twórców, aby móc przejść do ekranu głównego.

## 2. Routing widoku

* **Ścieżka:** `/onboarding/creators`
* **Typ:** Strona Astro z wyspą interaktywności React (Client Side Rendering dla formularza).

## 3. Struktura komponentów

Głównym kontenerem będzie komponent Reactowy zarządzający stanem wyboru.

* `OnboardingCreatorsContainer` (Główny komponent stanu)
* `ProgressBar` (Wskaźnik postępu 2/2)
* `CreatorSearch` (Sekcja wyszukiwania)
* `SearchInput` (Pole tekstowe z obsługą debouncing)
* `SearchResultsList` (Lista wyników wyszukiwania - live region dla accessibility)
* `SearchResultItem` (Pojedynczy wynik z przyciskiem dodawania)

* `SelectedCreatorsList` (Sekcja wybranych twórców)
* `CreatorChip` (Usuwalny element wizualny dla każdego wybranego twórcy)

* `NavigationActions` (Stopka akcji)
* `Button` (Przycisk "Zakończ")

## 4. Szczegóły komponentów

### OnboardingCreatorsContainer

* **Opis:** Główny kontener zarządzający listą wybranych twórców oraz komunikacją z API.
* **Główne elementy:** Układ typu Flex/Grid, zawiera nagłówek "Wybierz ulubionych twórców", opis oraz pozostałe subkomponenty.
* **Obsługiwane interakcje:** Dodawanie twórcy do listy, usuwanie z listy, wysyłka formularza.
* **Typy:** `CreatorDTO[]`, `OnboardingCreatorsCommand`.

### CreatorSearch

* **Opis:** Interfejs wyszukiwania twórców w czasie rzeczywistym.
* **Główne elementy:** `SearchInput`, lista wyników pozycjonowana absolutnie lub pod inputem.
* **Obsługiwane interakcje:** Wpisywanie frazy (min. 2 znaki), czyszczenie pola.
* **Obsługiwana walidacja:** Wyświetlanie stanu "Nie znaleziono" przy braku pasujących wyników.
* **Propsy:** `onSelect: (creator: CreatorDTO) => void`, `alreadySelectedIds: UUID[]`.

### SearchResultItem

* **Opis:** Pojedynczy wiersz na liście podpowiedzi.
* **Główne elementy:** Awatar (jeśli dostępny), Imię i Nazwisko, Rola, Rok urodzenia (wyciągnięty z `meta_data`).
* **Typy:** `CreatorDTO`.

### CreatorChip

* **Opis:** Wizualna reprezentacja wybranego twórcy w formie "pigułki".
* **Główne elementy:** Nazwa twórcy, przycisk "X" do usunięcia.
* **Obsługiwane interakcje:** Kliknięcie "X" usuwa twórcę ze stanu nadrzędnego.
* **Propsy:** `creator: CreatorDTO`, `onRemove: (id: UUID) => void`.

### NavigationActions

* **Opis:** Dolny panel z przyciskiem finalizującym.
* **Obsługiwana walidacja:** Przycisk "Zakończ" jest `disabled`, dopóki `selectedCreators.length < 3`.
* **Propsy:** `isValid: boolean`, `onFinish: () => void`, `isSubmitting: boolean`.

## 5. Typy

W oparciu o dostarczone definicje, wykorzystamy:

### CreatorViewModel

Rozszerzenie `CreatorDTO` o dane potrzebne bezpośrednio w UI wyszukiwania.

```typescript
export interface CreatorViewModel extends CreatorDTO {
  // Rok urodzenia wyciągany z meta_data podczas mapowania odpowiedzi z API
  birthYear?: string | number;
}

```

### OnboardingState

```typescript
export interface OnboardingUIState {
  selectedCreators: CreatorDTO[];
  searchQuery: string;
  searchResults: CreatorDTO[];
  status: 'idle' | 'searching' | 'submitting' | 'error';
  errorMessage?: string;
}

```

## 6. Zarządzanie stanem

Zastosujemy customowy hook `useCreatorSelection`, aby odseparować logikę od UI:

* **Zmienne stanu:** `selectedCreators` (lista obiektów), `results` (wyniki z API).
* **Funkcje:** `addCreator`, `removeCreator`, `search(query)`.
* **Debouncing:** Użycie `use-debounce` lub `useEffect` z opóźnieniem 300ms dla wywołań API wyszukiwarki.

## 7. Integracja API

1. **Pobieranie twórców:** `GET /api/creators?q={query}`

* Wywoływane przy zmianie `searchQuery`.
* Mapowanie pola `meta_data` na rok urodzenia do wyświetlenia.

2. **Zapisywanie stanu:** `PUT /api/onboarding/creators`

* **Body:** `{ creator_ids: UUID[] }`
* **Walidacja frontendu:** Blokada wysyłki jeśli `ids.length < 3`.
* **Success (204):** Przekierowanie użytkownika na `/` (ekran główny) za pomocą `window.location.assign`.

## 8. Interakcje użytkownika

1. **Wyszukiwanie:** Użytkownik wpisuje np. "Keanu". Po 300ms pojawia się lista: "Keanu Reeves, aktor, 1964".
2. **Wybór:** Kliknięcie w wynik dodaje twórcę do listy poniżej/powyżej wyszukiwarki. Wynik znika z listy podpowiedzi lub staje się nieaktywny.
3. **Usuwanie:** Kliknięcie w "X" na chipie usuwa twórcę i aktualizuje licznik.
4. **Finalizacja:** Gdy licznik osiągnie 3, przycisk "Zakończ" staje się aktywny (np. zmienia kolor z szarego na główny akcent aplikacji).

## 9. Warunki i walidacja

* **Minimum 3 twórców:** Warunek krytyczny. Przycisk zapisu musi być zablokowany, dopóki `selectedCreators.length >= 3`.
* **Duplikaty:** System nie pozwala dodać tego samego twórcy dwa razy (walidacja po `id` w stanie `selectedCreators`).
* **Długość zapytania:** Wyszukiwanie startuje dopiero od 2-3 znaków, aby uniknąć zbyt szerokich wyników i obciążenia API.
* **Limit API:** Zgodnie z dokumentacją endpointu, walidacja `422` wystąpi przy próbie zapisu mniej niż 3 twórców.

## 10. Obsługa błędów

* **Błąd wyszukiwania:** Jeśli `GET /creators` zwróci błąd, wyświetlamy `toast` z komunikatem "Nie udało się pobrać listy twórców".
* **Błąd zapisu:** W przypadku błędu 422 lub 500 przy `PUT`, wyświetlamy komunikat pod przyciskiem "Zakończ" (np. "Wystąpił problem z zapisem Twoich preferencji. Spróbuj ponownie.").
* **Brak wyników:** Wyświetlamy "Nie znaleźliśmy twórcy o takim nazwisku" wewnątrz dropdownu wyników.

## 11. Kroki implementacji

1. **Definicja typów i schematów:** Utworzenie interfejsów TypeScript na podstawie dokumentacji API.
2. **Stworzenie hooka `useCreatorSelection`:** Logika dodawania, usuwania i walidacji liczby elementów.
3. **Implementacja `SearchInput`:** Integracja z API `GET /creators` z obsługą debouncingu.
4. **Budowa interfejsu `SearchResultsList`:** Wyświetlanie wyników z uwzględnieniem accessibility (aria-live).
5. **Budowa `SelectedCreatorsList`:** Wyświetlanie chipów i obsługa usuwania.
6. **Logika przycisku "Zakończ":** Integracja z endpointem `PUT /api/onboarding/creators`.
7. **Obsługa przekierowania:** Po sukcesie API, przeniesienie użytkownika na dashboard.
8. **Stylizacja Tailwind/Shadcn:** Dopracowanie responsywności i stanów focus/hover.
