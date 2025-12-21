# Przykłady użycia API Creators

## Endpointy

### 1. GET /api/creators - Lista twórców z paginacją

#### Podstawowe zapytanie (domyślne parametry)

```http
GET /api/creators
```

**Odpowiedź 200 OK:**

```json
{
  "data": [
    {
      "id": "uuid-1",
      "name": "Tom Hanks",
      "creator_role": "actor",
      "avatar_url": "https://..."
    },
    {
      "id": "uuid-2",
      "name": "Steven Spielberg",
      "creator_role": "director",
      "avatar_url": "https://..."
    }
  ],
  "next_cursor": "uuid-20"
}
```

---

#### Wyszukiwanie po nazwie

```http
GET /api/creators?q=Tom
```

**Walidacja:**

- Minimum 2 znaki
- Case-insensitive (ILIKE)
- Wyszukuje w całej nazwie (wildcard: `%Tom%`)

**Odpowiedź 200 OK:**

```json
{
  "data": [
    {
      "id": "uuid-1",
      "name": "Tom Hanks",
      "creator_role": "actor",
      "avatar_url": "https://..."
    },
    {
      "id": "uuid-3",
      "name": "Tom Cruise",
      "creator_role": "actor",
      "avatar_url": "https://..."
    }
  ],
  "next_cursor": null
}
```

---

#### Filtrowanie po roli

```http
GET /api/creators?role=director
```

**Dozwolone wartości:** `actor`, `director`

**Odpowiedź 200 OK:**

```json
{
  "data": [
    {
      "id": "uuid-2",
      "name": "Steven Spielberg",
      "creator_role": "director",
      "avatar_url": "https://..."
    },
    {
      "id": "uuid-4",
      "name": "Christopher Nolan",
      "creator_role": "director",
      "avatar_url": "https://..."
    }
  ],
  "next_cursor": "uuid-20"
}
```

---

#### Paginacja z cursorem

```http
GET /api/creators?limit=10&cursor=uuid-10
```

**Parametry:**

- `limit`: 1-100 (domyślnie 20)
- `cursor`: UUID ostatniego elementu z poprzedniej strony

**Odpowiedź 200 OK:**

```json
{
  "data": [
    {
      "id": "uuid-11",
      "name": "...",
      "creator_role": "actor",
      "avatar_url": "https://..."
    }
    // ... 9 więcej elementów
  ],
  "next_cursor": "uuid-20"
}
```

**Uwaga:** Gdy `next_cursor` jest `null`, oznacza to ostatnią stronę.

---

#### Kombinacja filtrów

```http
GET /api/creators?q=Chris&role=director&limit=5
```

**Odpowiedź 200 OK:**

```json
{
  "data": [
    {
      "id": "uuid-4",
      "name": "Christopher Nolan",
      "creator_role": "director",
      "avatar_url": "https://..."
    }
  ],
  "next_cursor": null
}
```

---

### Błędy walidacji

#### Zbyt krótkie zapytanie

```http
GET /api/creators?q=T
```

**Odpowiedź 400 Bad Request:**

```json
{
  "error": "ValidationError",
  "message": "Invalid query parameters",
  "details": {
    "q": {
      "_errors": ["Search query must be at least 2 characters"]
    }
  }
}
```

---

#### Nieprawidłowa rola

```http
GET /api/creators?role=producer
```

**Odpowiedź 400 Bad Request:**

```json
{
  "error": "ValidationError",
  "message": "Invalid query parameters",
  "details": {
    "role": {
      "_errors": ["Role must be 'actor' or 'director'"]
    }
  }
}
```

---

#### Nieprawidłowy cursor (nie UUID)

```http
GET /api/creators?cursor=invalid-uuid
```

**Odpowiedź 400 Bad Request:**

```json
{
  "error": "ValidationError",
  "message": "Invalid query parameters",
  "details": {
    "cursor": {
      "_errors": ["Cursor must be a valid UUID"]
    }
  }
}
```

---

#### Limit przekroczony

```http
GET /api/creators?limit=150
```

**Odpowiedź 400 Bad Request:**

```json
{
  "error": "ValidationError",
  "message": "Invalid query parameters",
  "details": {
    "limit": {
      "_errors": ["Limit cannot exceed 100"]
    }
  }
}
```

---

## 2. GET /api/creators/:id - Pojedynczy twórca

#### Poprawne zapytanie

```http
GET /api/creators/550e8400-e29b-41d4-a716-446655440000
```

**Odpowiedź 200 OK:**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Tom Hanks",
  "creator_role": "actor",
  "avatar_url": "https://image.tmdb.org/t/p/w200/..."
}
```

---

#### Nieprawidłowy UUID

```http
GET /api/creators/not-a-uuid
```

**Odpowiedź 400 Bad Request:**

```json
{
  "error": "ValidationError",
  "message": "Invalid creator ID",
  "details": {
    "id": {
      "_errors": ["Creator ID must be a valid UUID"]
    }
  }
}
```

---

#### Twórca nie istnieje

```http
GET /api/creators/550e8400-e29b-41d4-a716-446655440099
```

**Odpowiedź 404 Not Found:**

```json
{
  "error": "NotFound",
  "message": "Creator not found"
}
```

---

## Przykład implementacji paginacji w kliencie

```typescript
// Funkcja do pobierania wszystkich stron
async function fetchAllCreators(role?: 'actor' | 'director') {
  const allCreators = [];
  let cursor: string | null = null;
  
  do {
    const params = new URLSearchParams({
      limit: '50',
      ...(role && { role }),
      ...(cursor && { cursor }),
    });
    
    const response = await fetch(`/api/creators?${params}`);
    const data = await response.json();
    
    allCreators.push(...data.data);
    cursor = data.next_cursor;
  } while (cursor !== null);
  
  return allCreators;
}

// Użycie
const allDirectors = await fetchAllCreators('director');
console.log(`Znaleziono ${allDirectors.length} reżyserów`);
```

---

## Uwagi techniczne

### Keyset Pagination

- Używa UUID jako cursor (ID ostatniego elementu)
- Sortowanie: `ORDER BY id ASC`
- Następna strona: `WHERE id > cursor`
- Wydajność: O(1) niezależnie od głębokości paginacji

### Optymalizacja

- Pobiera `limit + 1` rekordów aby sprawdzić czy jest następna strona
- Zwraca tylko `limit` rekordów w odpowiedzi
- Select tylko wymaganych kolumn (bez `meta_data`, `external_api_id`, etc.)

### Bezpieczeństwo

- Publiczny dostęp (nie wymaga autentykacji)
- Walidacja wszystkich parametrów przez Zod
- RLS (Row Level Security) na poziomie Supabase dla roli `anon`
- Brak możliwości SQL injection (parametryzowane zapytania)
