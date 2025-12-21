# API Endpoint Implementation Plan: User Creators (favourites)

Ten dokument opisuje plan implementacji grupy endpointów REST API do zarządzania ulubionymi twórcami użytkownika w aplikacji Streamly.

## 1. Przegląd punktu końcowego

Endpointy umożliwiają użytkownikom personalizację ich profilu poprzez śledzenie ulubionych aktorów i reżyserów. Dane te są kluczowe dla silnika rekomendacji oraz wyświetlania spersonalizowanego feedu.

## 2. Szczegóły żądania

### GET `/api/me/creators`

* **Metoda HTTP**: `GET`
* **Struktura URL**: `/api/me/creators`
* **Parametry Query**:
* `limit` (opcjonalne, default: 50): liczba rekordów.
* `cursor` (opcjonalne): UUID ostatniego elementu dla paginacji.

### POST `/api/me/creators`

* **Metoda HTTP**: `POST`
* **Request Body**:

```json
{ "creator_id": "uuid" }

```

### DELETE `/api/me/creators/:id`

* **Metoda HTTP**: `DELETE`
* **Parametry URL**:
* `id`: UUID twórcy (`creators.id`) do usunięcia z listy ulubionych.

---

## 3. Wykorzystywane typy

* **`UserCreatorListItemDTO`**: Zwracany w liście GET.
* **`CreatorDTO`**: Zwracany po pomyślnym utworzeniu (POST).
* **`AddUserCreatorCommand`**: Walidacja wejścia dla POST.
* **`UUID`**: Alias typu string dla identyfikatorów.

---

## 4. Szczegóły odpowiedzi

* **200 OK**: Dla `GET`, zwraca tablicę `Creator[]`.
* **201 Created**: Dla `POST`, zwraca utworzony obiekt `Creator`.
* **204 No Content**: Dla `DELETE`, pomyślne usunięcie.
* **400 Bad Request**: Nieprawidłowe dane wejściowe (Zod validation error).
* **401 Unauthorized**: Brak autoryzacji użytkownika.
* **404 Not Found**: Zasób nie istnieje.

---

## 5. Przepływ danych

1. **Uwierzytelnianie**: Middleware weryfikuje sesję użytkownika i wstrzykuje `supabase` do `context.locals`.
2. **Walidacja**: Route API waliduje dane wejściowe (body lub params) za pomocą Zod.
3. **Logika biznesowa**: Route wywołuje odpowiednią metodę w `CreatorsService`.
4. **Warstwa danych**: Serwis wykonuje zapytanie do tabeli `user_creators` (z JOIN do `creators` w przypadku GET/POST).
5. **Transformacja**: Dane z bazy są mapowane na odpowiednie DTO.
6. **Odpowiedź**: Endpoint zwraca sformatowaną odpowiedź JSON.

---

## 6. Względy bezpieczeństwa

* **Weryfikacja tożsamości**: `user_id` jest zawsze pobierany z `supabase.auth.getUser()`. Nigdy nie ufamy `user_id` przesyłanemu w body.
* **Row Level Security (RLS)**: Tabele `user_creators` powinny mieć włączone RLS ograniczające dostęp tylko dla właściciela rekordu (`auth.uid() = user_id`).
* **Walidacja schematu**: Zastosowanie Zod eliminuje ryzyko przesłania złośliwych danych w polach JSON.

---

## 7. Obsługa błędów

* **Błąd 409 (Conflict)**: Jeśli użytkownik próbuje dodać tego samego twórcę dwukrotnie, serwis przechwytuje błąd Postgres `23505` i zwraca czytelny komunikat.
* **Błąd 404 (Not Found)**: Przy usuwaniu, jeśli `row_count` wynosi 0, zwracamy 404.
* **Fail-safe**: Wszystkie operacje są otoczone blokiem `try-catch`, który w przypadku nieznanego błędu loguje szczegóły i zwraca 500.

---

## 8. Rozważania dotyczące wydajności

* **Indeksowanie**: Upewnić się, że tabela `user_creators` posiada indeks na `user_id` dla szybkich list oraz unikalny indeks złożony na `(user_id, creator_id)`.
* **Paginacja**: GET implementuje paginację opartą na kursorze (`created_at` lub `id`), aby uniknąć problemów z wydajnością przy dużej liczbie ulubionych.

---

## 9. Etapy wdrożenia

### Krok 1: Definicja Schematów Zod

Utworzenie `src/lib/validations/creators.schema.ts` dla walidacji parametrów wejściowych.

### Krok 2: Serwis Twórców

Implementacja `src/lib/services/creators.service.ts`:

* `getFavorites(userId: string, pagination: PaginationQuery)`
* `addFavorite(userId: string, creatorId: string)`
* `removeFavorite(userId: string, creatorId: string)`

### Krok 3: Endpointy API

Utworzenie plików w `src/pages/api/me/creators/`:

* `index.ts` (Obsługa GET i POST)
* `[id].ts` (Obsługa DELETE)

### Krok 4: Integracja z Middleware

Upewnienie się, że ścieżka `/api/me/*` jest chroniona przez middleware sprawdzający sesję.

### Krok 5: Testy i Dokumentacja

* Testy manualne (Postman/Insomnia).
* Weryfikacja poprawności mapowania typów TypeScript.

---

**Następny krok:** Czy chcesz, abym wygenerował kod źródłowy dla `creators.service.ts` w oparciu o ten plan?
