# Streamly – Plan schematu bazy danych (PostgreSQL / Supabase)

## 1. Konfiguracja wstępna i rozszerzenia

Dla zapewnienia unikalnych identyfikatorów oraz wydajnego wyszukiwania tekstowego.

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp"; -- Lub pgcrypto (standard w Supabase)
CREATE EXTENSION IF NOT EXISTS "pg_trgm";   -- Dla wyszukiwania fuzzy (trigramy)
```

## 2. Typy danych (ENUM)

Definicja typów wyliczeniowych w celu zapewnienia spójności danych i łatwiejszej walidacji.

```sql
CREATE TYPE creator_role AS ENUM ('actor', 'director');
CREATE TYPE media_type AS ENUM ('movie', 'series');
CREATE TYPE onboarding_status AS ENUM ('not_started', 'platforms_selected', 'completed');
```

## 3 Tabele i kolumny

### 3.1. `profiles`

Rozszerzenie tabeli `auth.users`. Przechowuje stan onboardingu i ustawienia regionalne.

| Kolumna             | Typ danych          | Ograniczenia                                    | Opis |
|---------------------|---------------------|-------------------------------------------------|------|
| `user_id`           | `uuid`              | PK, FK → `auth.users(id)` ON DELETE CASCADE     | Powiązanie 1:1 z użytkownikiem Supabase |
| `country_code`      | `char(2)`           | `NOT NULL` DEFAULT `'PL'`                       | Kod kraju dla API (np. dostępność VOD) |
| `onboarding_status` | `onboarding_status` | `NOT NULL` DEFAULT `'not_started'`              | Status procesu wdrożenia |
| `created_at`        | `timestamptz`       | `NOT NULL` DEFAULT `now()`                      | Data utworzenia |
| `updated_at`        | `timestamptz`       | `NOT NULL` DEFAULT `now()`                      | Data ostatniej aktualizacji |

### 3.2. `platforms`

Słownik statyczny platform VOD. Zarządzany przez administratorów/system.

| Kolumna                | Typ danych    | Ograniczenia                                       | Opis |
|------------------------|---------------|----------------------------------------------------|------|
| `id`                   | `uuid`        | PK DEFAULT `gen_random_uuid()`                     | Unikalne ID platformy |
| `name`                 | `text`        | `NOT NULL`                                         | Nazwa wyświetlana (np. Netflix) |
| `slug`                 | `text`        | `NOT NULL`, `UNIQUE`                               | URL-friendly ID |
| `external_provider_id` | `text`        | `NOT NULL`                                         | ID dostawcy w zewn. API (np. TMDB ID) |
| `logo_url`             | `text`        |                                                    | Ścieżka do logotypu |
| `created_at`           | `timestamptz` | `NOT NULL` DEFAULT `now()`                         | |
| `updated_at`           | `timestamptz` | `NOT NULL` DEFAULT `now()`                         | |

### 3.3. `user_platforms`

Tabela łącząca (M:N) użytkowników z ich subskrypcjami.

| Kolumna       | Typ danych    | Ograniczenia                                                   |
|---------------|---------------|----------------------------------------------------------------|
| `id`          | `uuid`        | PK DEFAULT `gen_random_uuid()`                                 |
| `user_id`     | `uuid`        | FK → `auth.users(id)` ON DELETE CASCADE, `NOT NULL`             |
| `platform_id` | `uuid`        | FK → `platforms(id)` ON DELETE CASCADE, `NOT NULL`             |
| `created_at`  | `timestamptz` | `NOT NULL` DEFAULT `now()`                                     |
| `UNIQUE`      | `(user_id, platform_id)` | Zapobiega duplikatom subskrypcji dla użytkownika |

### 3.4. `creators`

Globalny słownik twórców. Dane są współdzielone między użytkownikami i cache'owane z zewnętrznego API.

| Kolumna           | Typ danych     | Ograniczenia                                                   | Opis |
|-------------------|----------------|----------------------------------------------------------------|------|
| `id`              | `uuid`         | PK DEFAULT `gen_random_uuid()`                                 | Wewnętrzne ID |
| `external_api_id` | `text`         | `NOT NULL`                                                     | ID z zewnętrznego API (np. TMDB Person ID) |
| `name`            | `text`         | `NOT NULL`                                                     | Imię i nazwisko |
| `creator_role`    | `creator_role` | `NOT NULL`                                                     | Rola (aktor/reżyser) |
| `avatar_url`      | `text`         |                                                                | Zdjęcie profilowe |
| `meta_data`       | `jsonb`        | DEFAULT '{}'::jsonb                                            | Cache dodatkowych danych |
| `last_synced_at`  | `timestamptz`  | `NOT NULL` DEFAULT `now()`                                     | Data ostatniej synchronizacji z API |
| `created_at`      | `timestamptz`  | `NOT NULL` DEFAULT `now()`                                     | |
| `updated_at`      | `timestamptz`  | `NOT NULL` DEFAULT `now()`                                     | |
| `UNIQUE`          | `(external_api_id, creator_role)` || Unikalność pary ID + Rola |
| `CHECK`           | `jsonb_typeof(meta_data) = 'object'` || Walidacja typu JSON |

### 3.5. `user_creators`

Tabela łącząca (M:N) użytkowników z ulubionymi twórcami.

| Kolumna       | Typ danych    | Ograniczenia                                                   |
|---------------|---------------|----------------------------------------------------------------|
| `id`          | `uuid`        | PK DEFAULT `gen_random_uuid()`                                 |
| `user_id`     | `uuid`        | FK → `auth.users(id)` ON DELETE CASCADE, `NOT NULL`             |
| `creator_id`  | `uuid`        | FK → `creators(id)` ON DELETE CASCADE, `NOT NULL`               |
| `created_at`  | `timestamptz` | `NOT NULL` DEFAULT `now()`                                     |
| `UNIQUE`      | `(user_id, creator_id)` | Zapobiega duplikowaniu twórcy u użytkownika |

### 3.6. `watched_items`

Historia obejrzanych produkcji. Służy do wykluczania z rekomendacji i wyświetlania w profilu.

| Kolumna             | Typ danych    | Ograniczenia                                                   | Opis |
|---------------------|---------------|----------------------------------------------------------------|------|
| `id`                | `uuid`        | PK DEFAULT `gen_random_uuid()`                                 | |
| `user_id`           | `uuid`        | FK → `auth.users(id)` ON DELETE CASCADE, `NOT NULL`            | |
| `external_movie_id` | `text`        | `NOT NULL`                                                     | ID filmu/serialu z zewn. API |
| `media_type`        | `media_type`  | `NOT NULL`                                                     | Film lub Serial |
| `title`             | `text`        | `NOT NULL`                                                     | Tytuł (zdenormalizowany dla sortowania) |
| `year`              | `integer`     |                                                                | Rok produkcji |
| `meta_data`         | `jsonb`       | DEFAULT '{}'::jsonb                                            | Cache: `poster_path`, `overview` itp. |
| `created_at`        | `timestamptz` | `NOT NULL` DEFAULT `now()`                                     | Data oznaczenia jako obejrzane |
| `UNIQUE`            | `(user_id, external_movie_id, media_type)` || Unikalność w historii użytkownika |
| `CHECK`             | `meta_data ? 'poster_path'` || Wymagane klucze w JSON (przykład) |

## 4. Relacje między tabelami

1. **Użytkownicy (`auth.users`)**:

      * 1:1 z `profiles` (Klucz obcy `user_id`).
      * 1:N z `user_platforms`.
      * 1:N z `user_creators`.
      * 1:N z `watched_items`.

2. **Platformy (`platforms`)**:

      * 1:N z `user_platforms` (Relacja M:N z użytkownikami).

3. **Twórcy (`creators`)**:

      * 1:N z `user_creators` (Relacja M:N z użytkownikami).

## 5. Indeksy

| Tabela           | Kolumny / Typ indeksu                      | Cel optymalizacji                                   |
|------------------|--------------------------------------------|-----------------------------------------------------|
| `creators`       | `name gin_trgm_ops` (GIN)                  | Autocomplete i szybkie wyszukiwanie twórców po nazwie (LIKE/ILIKE) |
| `creators`       | `external_api_id`                          | Szybkie sprawdzanie istnienia twórcy przy imporcie  |
| `watched_items`  | `(user_id, created_at DESC)`               | Wydajne pobieranie posortowanej historii (US-008)   |
| `watched_items`  | `(user_id, external_movie_id)`             | Szybkie filtrowanie rekomendacji ("czy obejrzane?") |
| `user_platforms` | `user_id`                                  | Pobieranie subskrypcji użytkownika przy logowaniu   |
| `user_creators`  | `user_id`                                  | Pobieranie twórców użytkownika dla algorytmu rekomendacji |

## 6. Zasady PostgreSQL (RLS i Funkcje)

### 6.1. Row Level Security (RLS)

Włączamy RLS dla wszystkich tabel w schemacie `public`.

```sql
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE platforms ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_platforms ENABLE ROW LEVEL SECURITY;
ALTER TABLE creators ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_creators ENABLE ROW LEVEL SECURITY;
ALTER TABLE watched_items ENABLE ROW LEVEL SECURITY;
```

**Polityki (Policies):**

1. **`profiles`**:

      * `SELECT, UPDATE, DELETE`: `auth.uid() = user_id` (Właściciel).
      * `INSERT`: Wyzwalany przez trigger systemowy (Security Definer).

2. **`platforms`**:

      * `SELECT`: `true` (Publiczny dostęp dla zalogowanych).
      * `INSERT/UPDATE/DELETE`: Tylko rola `service_role` (Admin).

3. **`creators`**:

      * `SELECT`: `true` (Współdzielony słownik dla wszystkich).
      * `INSERT/UPDATE`: Tylko rola `service_role`. (Aplikacja/Edge Function pobiera dane z API i zapisuje je w trybie administracyjnym, użytkownik tylko linkuje ID w `user_creators`).

4. **`user_platforms`, `user_creators`, `watched_items`**:

      * `ALL (SELECT, INSERT, UPDATE, DELETE)`: `auth.uid() = user_id`.

### 6.2. Funkcje i Triggery

**Automatyczna aktualizacja `updated_at`**:

```sql
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER trg_platforms_updated BEFORE UPDATE ON platforms FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER trg_creators_updated BEFORE UPDATE ON creators FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
```

**Tworzenie profilu po rejestracji**:

```sql
CREATE OR REPLACE FUNCTION create_profile_for_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id) VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_profile_for_new_user();
```

## 7. Dodatkowe uwagi architektoniczne

1. **Cache'owanie JSON (`meta_data`)**: Kolumny `meta_data` w tabelach `creators` i `watched_items` służą do przechowywania danych, które rzadko się zmieniają (ścieżki do plakatów, opisy), aby odciążyć zewnętrzne API.
2. **Unikalność Twórców**: Klucz unikalny na `(external_api_id, creator_role)` pozwala na istnienie tej samej osoby jako "Aktor" i "Reżyser" jako dwa osobne byty logiczne, co upraszcza filtrowanie.
3. **Strategia zapytań**: Przy dodawaniu `watched_items` aplikacja powinna stosować strategię `ON CONFLICT DO NOTHING`, aby uniknąć błędów przy podwójnym kliknięciu przez użytkownika.
4. **Service Role**: Zapis do tabeli `creators` powinien odbywać się wyłącznie przez Edge Functions z uprawnieniami `service_role` po uprzedniej walidacji danych z zewnętrznym API (TMDB). Użytkownik nie ma prawa bezpośredniego zapisu w tej tabeli.

<!-- end list -->
