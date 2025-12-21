# Checklist konfiguracji bazy danych dla Creators API

## ⚠️ Wymagane przed uruchomieniem w produkcji

### 1. Indeksy w tabeli `creators`

#### Indeks dla wyszukiwania po nazwie (ILIKE)

```sql
-- Indeks GIN dla wyszukiwania tekstowego (case-insensitive)
CREATE INDEX idx_creators_name_gin ON creators USING gin (name gin_trgm_ops);

-- Alternatywnie: indeks B-tree jeśli wyszukiwanie tylko od początku
CREATE INDEX idx_creators_name_btree ON creators (name);
```

**Wymagane rozszerzenie dla GIN:**

```sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;
```

#### Indeks dla filtrowania po roli

```sql
CREATE INDEX idx_creators_role ON creators (creator_role);
```

#### Indeks kompozytowy dla paginacji

```sql
-- Główny indeks dla keyset pagination
CREATE INDEX idx_creators_id ON creators (id);

-- Kompozytowy indeks dla filtrowania + paginacji
CREATE INDEX idx_creators_role_id ON creators (creator_role, id);
```

---

### 2. Row Level Security (RLS)

#### Włączenie RLS na tabeli

```sql
ALTER TABLE creators ENABLE ROW LEVEL SECURITY;
```

#### Policy dla publicznego odczytu

```sql
-- Pozwól anonimowym użytkownikom czytać wszystkich twórców
CREATE POLICY "Public creators are viewable by everyone"
  ON creators
  FOR SELECT
  TO anon
  USING (true);

-- Pozwól zalogowanym użytkownikom czytać wszystkich twórców
CREATE POLICY "Creators are viewable by authenticated users"
  ON creators
  FOR SELECT
  TO authenticated
  USING (true);
```

---

### 3. Weryfikacja struktury tabeli

Upewnij się, że tabela `creators` ma następującą strukturę:

```sql
CREATE TABLE creators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  creator_role creator_role NOT NULL,  -- ENUM: 'actor' | 'director'
  avatar_url TEXT,
  external_api_id TEXT NOT NULL,
  meta_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_synced_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Unique constraint dla external_api_id
  CONSTRAINT creators_external_api_id_key UNIQUE (external_api_id)
);
```

#### Weryfikacja ENUM typu

```sql
-- Sprawdź czy typ istnieje
SELECT typname, typtype 
FROM pg_type 
WHERE typname = 'creator_role';

-- Jeśli nie istnieje, utwórz:
CREATE TYPE creator_role AS ENUM ('actor', 'director');
```

---

### 4. Przykładowe dane testowe (opcjonalne)

```sql
-- Wstaw przykładowych twórców do testów
INSERT INTO creators (name, creator_role, avatar_url, external_api_id, meta_data)
VALUES
  ('Tom Hanks', 'actor', 'https://image.tmdb.org/t/p/w200/xndWFsBlClOJFRdhSt4NBwiPq2o.jpg', 'tmdb-31', '{"tmdb_id": 31}'),
  ('Steven Spielberg', 'director', 'https://image.tmdb.org/t/p/w200/tZxcg19YQ3e8fJ0pOs7hjlnmmr6.jpg', 'tmdb-488', '{"tmdb_id": 488}'),
  ('Tom Cruise', 'actor', 'https://image.tmdb.org/t/p/w200/eOh4ubpOm2Igdg0QH2ghj0mFtC.jpg', 'tmdb-500', '{"tmdb_id": 500}'),
  ('Christopher Nolan', 'director', 'https://image.tmdb.org/t/p/w200/xuAIuYSmsUzKlUMBFGVZaWsY3DZ.jpg', 'tmdb-525', '{"tmdb_id": 525}'),
  ('Meryl Streep', 'actor', 'https://image.tmdb.org/t/p/w200/emAAzyK1rJ6aiMi0wsWYp51EC3h.jpg', 'tmdb-5064', '{"tmdb_id": 5064}');
```

---

### 5. Weryfikacja wydajności

#### Test wydajności wyszukiwania

```sql
-- Sprawdź plan wykonania dla wyszukiwania po nazwie
EXPLAIN ANALYZE
SELECT id, name, creator_role, avatar_url
FROM creators
WHERE name ILIKE '%Tom%'
ORDER BY id
LIMIT 21;
```

**Oczekiwany wynik:** Użycie indeksu `idx_creators_name_gin` lub `idx_creators_name_btree`

#### Test wydajności paginacji

```sql
-- Sprawdź plan wykonania dla paginacji z cursorem
EXPLAIN ANALYZE
SELECT id, name, creator_role, avatar_url
FROM creators
WHERE id > '550e8400-e29b-41d4-a716-446655440000'
ORDER BY id
LIMIT 21;
```

**Oczekiwany wynik:** Użycie indeksu `idx_creators_id`

#### Test wydajności filtrowania po roli

```sql
-- Sprawdź plan wykonania dla filtrowania + paginacji
EXPLAIN ANALYZE
SELECT id, name, creator_role, avatar_url
FROM creators
WHERE creator_role = 'actor'
  AND id > '550e8400-e29b-41d4-a716-446655440000'
ORDER BY id
LIMIT 21;
```

**Oczekiwany wynik:** Użycie indeksu `idx_creators_role_id`

---

### 6. Monitoring i statystyki

#### Sprawdź użycie indeksów

```sql
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan as index_scans,
  idx_tup_read as tuples_read,
  idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
WHERE tablename = 'creators'
ORDER BY idx_scan DESC;
```

#### Sprawdź rozmiar tabeli i indeksów

```sql
SELECT
  pg_size_pretty(pg_total_relation_size('creators')) as total_size,
  pg_size_pretty(pg_relation_size('creators')) as table_size,
  pg_size_pretty(pg_total_relation_size('creators') - pg_relation_size('creators')) as indexes_size;
```

---

## Checklist przed wdrożeniem

- [ ] Utworzono indeksy dla `name`, `creator_role`, `id`
- [ ] Włączono RLS na tabeli `creators`
- [ ] Utworzono policy dla publicznego odczytu
- [ ] Zweryfikowano strukturę tabeli i typ ENUM
- [ ] Przetestowano wydajność zapytań (EXPLAIN ANALYZE)
- [ ] Dodano przykładowe dane testowe (opcjonalnie)
- [ ] Skonfigurowano monitoring użycia indeksów

---

## Uwagi dodatkowe

### Rate Limiting

Endpoint jest publiczny, więc warto rozważyć:

- Rate limiting na poziomie infrastruktury (DigitalOcean, Cloudflare)
- Supabase ma wbudowane rate limiting dla API
- Monitoring nietypowego ruchu (DDoS protection)

### Backup i synchronizacja

- Tabela `creators` jest synchronizowana z zewnętrznym API (TMDB)
- Pole `last_synced_at` śledzi ostatnią synchronizację
- Warto mieć proces cron do regularnej synchronizacji danych

### Rozszerzenia przyszłe

Jeśli w przyszłości będzie potrzeba:

- Full-text search: rozważ użycie `tsvector` i `tsquery`
- Fuzzy search: użyj `pg_trgm` z similarity score
- Autocomplete: dodaj indeks dla prefiksów (`text_pattern_ops`)
