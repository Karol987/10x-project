# API Endpoint Implementation Plan: Platforms (Public Dictionary)

## 1. Przegląd punktu końcowego

Celem tego wdrożenia jest udostępnienie publicznych informacji o platformach VOD (np. Netflix, HBO Max). Punkty końcowe będą wykorzystywane głównie w procesie onboardingu użytkowników oraz w filtrach wyszukiwania. Dane są relatywnie statyczne, co pozwala na agresywne cache'owanie w celu optymalizacji wydajności.

## 2. Szczegóły żądania

### List All Platforms

* **Metoda HTTP**: `GET`
* **Struktura URL**: `/api/platforms`
* **Parametry**: Brak

### Single Platform by Slug

* **Metoda HTTP**: `GET`
* **Struktura URL**: `/api/platforms/:slug`
* **Parametry**:
* **Wymagane**: `slug` (string) - unikalny identyfikator URL-friendly.

## 3. Wykorzystywane typy

Zgodnie z `src/types.ts`:

```typescript
// DTO wykorzystywany w odpowiedziach
export type PlatformDTO = Pick<TablesRow<"platforms">, "id" | "slug" | "name" | "logo_url">;

```

## 4. Szczegóły odpowiedzi

* **200 OK**: Zwraca `PlatformDTO[]` dla listy lub pojedynczy `PlatformDTO`.
* **404 Not Found**: Zwraca błąd, gdy platforma o podanym `slug` nie istnieje.
* **500 Internal Server Error**: Błąd serwera przy pobieraniu danych.

## 5. Przepływ danych

1. **Klient** wysyła żądanie `GET` do endpointu Astro.
2. **Astro Middleware** (jeśli dotyczy) weryfikuje żądanie.
3. **Handler Endpointu** wywołuje `PlatformService`.
4. **PlatformService** korzysta z `supabaseClient` (z `context.locals`) do wykonania zapytania `SELECT` na tabeli `platforms`.
5. **Database** zwraca surowe wiersze.
6. **Service** mapuje dane na `PlatformDTO`.
7. **Handler** ustawia nagłówki `Cache-Control` (dla listy) i zwraca JSON.

## 6. Względy bezpieczeństwa

* **Publiczny Dostęp**: Dane w tabeli `platforms` są słownikowe i publiczne. Należy upewnić się, że w Supabase włączone jest RLS z polityką `SELECT` dla roli `anon`.
* **Sanityzacja**: Parametr `:slug` musi być zwalidowany przy użyciu Zod, aby zapobiec próbom wstrzyknięcia nieoczekiwanych znaków.

## 7. Obsługa błędów

* **Brak zasobu**: Jeśli zapytanie o `slug` nie zwróci wyników, endpoint musi zwrócić kod 404 z czytelnym komunikatem JSON.
* **Błąd bazy danych**: Każde zapytanie do Supabase powinno być opakowane w blok `try-catch` lub sprawdzać obiekt `error` zwracany przez SDK, zwracając 500 w przypadku awarii.

## 8. Rozważania dotyczące wydajności

* **Caching**: Dla endpointu `/platforms` należy ustawić nagłówek odpowiedzi:
`Cache-Control: public, max-age=3600, s-maxage=3600` (1 godzina).
* **Selektory kolumn**: Zapytania SQL powinny pobierać tylko niezbędne kolumny (`id`, `name`, `slug`, `logo_url`), aby zmniejszyć rozmiar payloadu.

## 9. Etapy wdrożenia

1. **Definicja Schematu Walidacji**:
Utwórz plik `src/lib/validations/platforms.schema.ts` i zdefiniuj schemat Zod dla parametru `slug`.
2. **Implementacja Service Layer**:
W `src/lib/services/platform.service.ts` zaimplementuj klasę `PlatformService` z metodami `getAllPlatforms` oraz `getPlatformBySlug`.
3. **Endpoint Listy (`/api/platforms/index.ts`)**:

* Ustaw `export const prerender = false`.
* Zaimplementuj funkcję `GET`.
* Dodaj nagłówki cache'owania do obiektu `Response`.

4. **Endpoint Szczegółów (`/api/platforms/[slug].ts`)**:

* Ustaw `export const prerender = false`.
* Pobierz `slug` z `Astro.params`.
* Zwaliduj `slug` Zod-em.
* Wywołaj service i obsłuż ewentualny kod 404.

5. **Testy**:

* Zweryfikuj poprawność mapowania pól (np. czy `external_provider_id` jest pominięte zgodnie z DTO).
* Sprawdź działanie nagłówków cache w narzędziach deweloperskich przeglądarki.
