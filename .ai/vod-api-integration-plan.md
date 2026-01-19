# Plan implementacji integracji z zewnętrznym API VOD

## Kontekst

Dokument opisuje plan implementacji integracji z zewnętrznym serwisem udostępniającym dane o filmach i ich twórcach dla aplikacji Streamly. Plan oparty jest na wymaganiach z PRD (`.ai/prd.md`) oraz koncepcji MVP (`koncepcjaMVP.md`).

## Założenia architektoniczne

- **Wzorzec:** Adapter/Gateway - warstwa abstrakcji w `src/lib/services` uniezależniająca aplikację od konkretnego dostawcy API
- **Technologia:** Fetch API w Node.js (Astro SSR)
- **Typy:** Wykorzystanie istniejących DTO z `src/types.ts` jako format wyjściowy
- **Nowe typy:** Potrzebne będą typy dla surowych odpowiedzi z zewnętrznego API

## Etapy implementacji

### Etap 1: Konfiguracja i Kontrakt Danych

**Cel:** Przygotowanie fundamentów pod komunikację z zewnętrznym API, bez implementacji logiki biznesowej.

**Zadania:**

1. **Zmienne środowiskowe**
   - Dodanie kluczy API do `.env` (np. `VOD_API_KEY`, `VOD_API_URL`)
   - Dokumentacja wymaganych zmiennych w `.env.example`

2. **Definicja Typów Zewnętrznych**
   - Utworzenie pliku `src/types/external-api.ts` (lub wewnątrz `src/lib/services`)
   - Definicja surowych odpowiedzi z API:
     - `ExternalMovie` - struktura filmu/serialu z API
     - `ExternalPerson` - struktura osoby (twórcy) z API
     - `ExternalAvailability` - struktura dostępności na platformach
     - `ExternalApiResponse<T>` - wrapper dla odpowiedzi API

3. **Szkielet Serwisu**
   - Utworzenie klasy `VodService` w `src/lib/services/vod.service.ts`
   - Metody (na razie puste lub zwracające mocki):
     - `searchCreators(query: string): Promise<CreatorDTO[]>`
     - `getRecommendations(userId: UUID, platformIds: UUID[], creatorIds: UUID[]): Promise<RecommendationDTO[]>`

4. **Klient HTTP**
   - Utworzenie prywatnej metody pomocniczej `fetchFromApi<T>(endpoint: string, options?: RequestInit): Promise<T>`
   - Funkcjonalność:
     - Doklejanie API Key do nagłówków
     - Obsługa podstawowych błędów HTTP (rzucanie wyjątków)
     - Logowanie błędów dla debugowania

**Kryterium sukcesu (Test):**

- Możliwość wywołania metody `fetchFromApi` (np. w prostym skrypcie testowym lub endpoincie `/api/test`)
- Poprawne połączenie z zewnętrznym API (np. endpoint `status` lub `genres`)
- Zwracanie statusu `200 OK` z prawidłowymi danymi

**Pliki do utworzenia/modyfikacji:**

- `.env.example` - dodanie zmiennych API
- `src/types/external-api.ts` - nowe typy
- `src/lib/services/vod.service.ts` - nowy serwis

---

### Etap 2: Wyszukiwanie Twórców (US-004)

**Cel:** Implementacja funkcjonalności potrzebnej do onboardingu i edycji profilu.

**Zadania:**

1. **Metoda `searchCreators(query: string)`**
   - Implementacja zapytania do zewnętrznego API wyszukującego osoby (People Search)
   - Obsługa parametrów wyszukiwania (query string, opcjonalnie role)
   - Filtrowanie wyników (tylko znane osoby, ze zdjęciem - opcjonalnie)

2. **Mapowanie Danych**
   - Transformacja surowego JSON-a na `CreatorDTO` (zgodnie z `src/types.ts`)
   - Wyciągnięcie roku urodzenia z metadanych (jeśli dostępne) do pola `meta_data` lub dedykowanego pola DTO
   - Mapowanie ról (Actor/Director) na enum `CreatorRole`

3. **Endpoint API**
   - Podpięcie serwisu pod istniejący endpoint `src/pages/api/creators/index.ts`
   - Walidacja parametrów zapytania (query string)
   - Obsługa błędów i zwracanie odpowiednich kodów HTTP

**Kryterium sukcesu (Test):**
- Wywołanie `GET /api/creators?q=Nolan` zwraca listę JSON z Christopherem Nolanem
- Odpowiedź zawiera poprawne ID, zdjęcie i rolę
- Format zgodny z interfejsem `CreatorDTO`
- Obsługa przypadku braku wyników (pusta tablica)

**Pliki do utworzenia/modyfikacji:**
- `src/lib/services/vod.service.ts` - implementacja `searchCreators`
- `src/pages/api/creators/index.ts` - integracja z serwisem

---

### Etap 3: Silnik Rekomendacji i Dostępności (US-005)

**Cel:** Najbardziej złożony etap - "serce" aplikacji. Łączenie filmów twórców z dostępnością na platformach.

**Zadania:**

1. **Pobieranie Filmografii**
   - Metoda pomocnicza pobierająca filmy dla listy ID twórców: `getMoviesByCreators(creatorIds: UUID[])`
   - **Uwaga:** API często limitują ilość zapytań
   - W MVP można pobierać twórców iteracyjnie lub użyć endpointu "discover" z filtrem `with_people`, jeśli API na to pozwala
   - Obsługa paginacji wyników z API

2. **Filtrowanie po Platformach (VOD)**
   - Logika sprawdzająca, czy dany film jest dostępny w modelu "flatrate" (SVOD) na liście `platformIds` użytkownika
   - Mapowanie slugów platform z bazy danych na identyfikatory platform w zewnętrznym API
   - Odrzucenie tytułów dostępnych tylko do wypożyczenia/kupna (Rent/Buy)
   - Filtrowanie tylko treści SVOD zgodnie z PRD (punkt 3.3)

3. **Sortowanie i Paginacja**
   - Sortowanie wyników po dacie premiery (malejąco - najnowsze pierwsze)
   - Implementacja prostego stronicowania (limit 50 zgodnie z PRD)
   - Obsługa cursor-based pagination dla infinite scroll

4. **Mapowanie na `RecommendationDTO`**
   - Złożenie obiektu wynikowego zawierającego:
     - Tytuł, Rok produkcji
     - Plakat (poster_path)
     - Lista Platform (slugi zgodne z `PlatformSlug`)
     - Lista Twórców (tylko tych, których użytkownik śledzi) z flagą `is_favorite`
     - Gatunek (jeśli dostępny w API)
     - Krótki opis (2-3 linie)

5. **Optymalizacja**
   - Cache'owanie odpowiedzi API (opcjonalnie, jeśli API nie zmienia się często)
   - Batchowanie zapytań do API (jeśli możliwe)

**Kryterium sukcesu (Test):**
- Użytkownik subskrybujący "Netflix" i śledzący "DiCaprio" otrzymuje listę filmów z DiCaprio dostępnych **tylko** na Netflixie
- Filmy z DiCaprio dostępne tylko na HBO są wykluczone
- Lista posortowana od najnowszych produkcji
- Każdy element zawiera wszystkie wymagane pola zgodnie z `RecommendationDTO`
- Limit 50 pozycji jest respektowany

**Pliki do utworzenia/modyfikacji:**
- `src/lib/services/vod.service.ts` - implementacja `getRecommendations` i metod pomocniczych
- `src/pages/api/recommendations/index.ts` - integracja z serwisem
- Ewentualnie `src/lib/services/platform-mapper.service.ts` - mapowanie slugów platform

---

### Etap 4: Obsługa Błędów i Odporność (US-013)

**Cel:** Zabezpieczenie aplikacji przed awarią zewnętrznego dostawcy danych.

**Zadania:**

1. **Obsługa kodów błędów**
   - Mapowanie kodów błędów z zewnętrznego API:
     - `404` - brak wyników → zwróć pustą tablicę `[]`
     - `429` - Rate Limit → zwróć `503 Service Unavailable` z komunikatem
     - `5xx` - błąd serwera → zwróć `502 Bad Gateway` z komunikatem
     - `401/403` - nieprawidłowy klucz API → zwróć `500 Internal Server Error` (loguj szczegóły)
   - Tworzenie czytelnych komunikatów błędów dla użytkownika

2. **Stany Puste**
   - Implementacja zwracania pustej tablicy `[]` zamiast błędu, gdy brak wyników spełniających kryteria
   - Rozróżnienie między "brak wyników" a "błąd API"

3. **Timeout i Retry**
   - Ustawienie timeout dla zapytań do zewnętrznego API (np. 10 sekund)
   - Opcjonalnie: implementacja prostego mechanizmu retry (max 2 próby) dla błędów 5xx

4. **Logowanie**
   - Logowanie wszystkich błędów z kontekstem (userId, endpoint, error message)
   - Logowanie tylko na poziomie serwera (nie eksponować szczegółów w odpowiedzi API)

5. **UI Feedback**
   - Upewnienie się, że frontend poprawnie wyświetla komunikat z US-013:
     - "Wystąpił problem z pobraniem danych. Spróbuj ponownie później."
   - Obsługa stanu loading podczas pobierania danych

**Kryterium sukcesu (Test):**
- Odłączenie internetu lub podanie błędnego klucza API w `.env` nie powoduje "crashu" strony (biały ekran)
- Endpoint zwraca JSON z błędem (status 5xx) zamiast rzucać nieobsłużony wyjątek
- UI obsługuje błąd i wyświetla stosowny komunikat użytkownikowi
- W przypadku braku wyników (pusta lista), wyświetlany jest komunikat z US-010 z linkiem do profilu

**Pliki do utworzenia/modyfikacji:**
- `src/lib/services/vod.service.ts` - rozszerzenie obsługi błędów
- `src/lib/utils/error-handler.ts` - pomocnicze funkcje do obsługi błędów (opcjonalnie)
- Komponenty UI - upewnienie się o obsłudze stanów błędów

---

## Sugerowana kolejność działań

1. **Etap 1** - Fundamenty (konfiguracja, typy, szkielet)
2. **Etap 2** - Wyszukiwanie twórców (potrzebne do onboardingu)
3. **Etap 3** - Rekomendacje (core funkcjonalność)
4. **Etap 4** - Hardening (obsługa błędów)

## Uwagi techniczne

### Wybór dostawcy API

Zgodnie z PRD i koncepcją MVP, sugerowane API:
- **MovieOfTheNight** (`https://docs.movieofthenight.com/`) - wspomniane w koncepcji MVP
- **TMDB** (`https://www.themoviedb.org/documentation/api`) - popularne, darmowe API
- **JustWatch** - jeśli dostępne publiczne API

**Ważne:** Przed rozpoczęciem implementacji należy:
1. Zarejestrować się w wybranym API i uzyskać klucz
2. Przeanalizować dokumentację API pod kątem:
   - Endpointów do wyszukiwania osób
   - Endpointów do pobierania filmografii
   - Endpointów do sprawdzania dostępności VOD
   - Limitów rate limiting
   - Formatów odpowiedzi

### Mapowanie platform

Wymagane będzie mapowanie między:
- Slugami platform w bazie danych (`netflix`, `hbo-max`, `disney-plus`)
- Identyfikatorami platform w zewnętrznym API (mogą być numeryczne lub stringowe)

Sugerowane rozwiązanie: tabela mapująca lub plik konfiguracyjny `src/lib/config/platform-mapping.ts`

### Wydajność

- Rozważyć cache'owanie odpowiedzi API (np. Redis lub Supabase Cache)
- Batchowanie zapytań, jeśli API to wspiera
- Optymalizacja liczby zapytań do API (np. pobieranie filmografii dla wielu twórców jednocześnie)

## Zależności między etapami

```
Etap 1 (Fundamenty)
    ↓
Etap 2 (Wyszukiwanie) ──┐
    ↓                    │
Etap 3 (Rekomendacje) ←──┘
    ↓
Etap 4 (Obsługa błędów)
```

## Metryki sukcesu (z PRD)

Implementacja powinna wspierać osiągnięcie następujących metryk:
- **Aktywacja użytkownika:** 70% użytkowników kończy onboarding (wymaga Etap 2)
- **Walidacja wartości:** 25% WAU oznacza tytuły jako obejrzane (wymaga Etap 3)
- **Retencja D7:** 15% użytkowników wraca po 7 dniach (wymaga wszystkich etapów)

## Notatki do przyszłych iteracji

Po MVP można rozważyć:
- Cache'owanie odpowiedzi API w bazie danych
- Background jobs do okresowego odświeżania dostępności VOD
- Webhooks z API (jeśli dostępne) do natychmiastowego aktualizowania dostępności
- Wsparcie dla wielu dostawców API (fallback)
