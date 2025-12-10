# Streamly – Plan schematu bazy danych (PostgreSQL / Supabase)

## 1. Tabele i kolumny

### 1.1. `profiles`
| Kolumna            | Typ danych          | Ograniczenia                                    |
|--------------------|---------------------|-------------------------------------------------|
| `user_id`          | `uuid`              | PK, FK → `auth.users(id)` ON DELETE CASCADE     |
| `onboarding_step`  | `smallint`          | `NOT NULL` DEFAULT `0`                          |
| `created_at`       | `timestamptz`       | `NOT NULL` DEFAULT `now()`                      |
| `updated_at`       | `timestamptz`       | `NOT NULL` DEFAULT `now()`                      |

### 1.2. `platforms`
| Kolumna       | Typ danych    | Ograniczenia                                       |
|---------------|---------------|----------------------------------------------------|
| `id`          | `uuid`        | PK DEFAULT `gen_random_uuid()`                     |
| `name`        | `text`        | `NOT NULL`                                         |
| `slug`        | `text`        | `NOT NULL`, `UNIQUE`                               |
| `logo_url`    | `text`        |                                                    |
| `created_at`  | `timestamptz` | `NOT NULL` DEFAULT `now()`                         |
| `updated_at`  | `timestamptz` | `NOT NULL` DEFAULT `now()`                         |

### 1.3. `user_platforms` (łącznik M:N)
| Kolumna       | Typ danych | Ograniczenia                                                   |
|---------------|-----------|----------------------------------------------------------------|
| `id`          | `uuid`    | PK DEFAULT `gen_random_uuid()`                                 |
| `user_id`     | `uuid`    | FK → `auth.users(id)` ON DELETE CASCADE, `NOT NULL`             |
| `platform_id` | `uuid`    | FK → `platforms(id)` ON DELETE CASCADE, `NOT NULL`             |
| `created_at`  | `timestamptz` | `NOT NULL` DEFAULT `now()`                                 |
| `UNIQUE`      | `(user_id, platform_id)` | Zapobiega duplikatom                              |

### 1.4. Typ ENUM `creator_role`
`'actor' | 'director'`

### 1.5. `creators`
| Kolumna           | Typ danych    | Ograniczenia                                                   |
|-------------------|--------------|----------------------------------------------------------------|
| `id`              | `uuid`       | PK DEFAULT `gen_random_uuid()`                                 |
| `external_api_id` | `text`       | `NOT NULL`                                                     |
| `name`            | `text`       | `NOT NULL`                                                     |
| `creator_role`    | `creator_role` | `NOT NULL`                                                   |
| `avatar_url`      | `text`       |                                                                |
| `created_at`      | `timestamptz` | `NOT NULL` DEFAULT `now()`                                    |
| `updated_at`      | `timestamptz` | `NOT NULL` DEFAULT `now()`                                    |
| `UNIQUE`          | `(external_api_id, creator_role)` |                                         |

### 1.6. `user_creators` (łącznik M:N)
| Kolumna       | Typ danych | Ograniczenia                                                   |
|---------------|-----------|----------------------------------------------------------------|
| `id`          | `uuid`    | PK DEFAULT `gen_random_uuid()`                                 |
| `user_id`     | `uuid`    | FK → `auth.users(id)` ON DELETE CASCADE, `NOT NULL`             |
| `creator_id`  | `uuid`    | FK → `creators(id)` ON DELETE CASCADE, `NOT NULL`               |
| `created_at`  | `timestamptz` | `NOT NULL` DEFAULT `now()`                                 |
| `UNIQUE`      | `(user_id, creator_id)` |                                                     |

### 1.7. Typ ENUM `media_type`
`'movie' | 'series'`

### 1.8. `watched_items`
| Kolumna            | Typ danych      | Ograniczenia                                                   |
|--------------------|-----------------|----------------------------------------------------------------|
| `id`               | `uuid`          | PK DEFAULT `gen_random_uuid()`                                 |
| `user_id`          | `uuid`          | FK → `auth.users(id)` ON DELETE CASCADE, `NOT NULL`            |
| `external_movie_id`| `text`          | `NOT NULL`                                                     |
| `media_type`       | `media_type`    | `NOT NULL`                                                     |
| `title`            | `text`          | `NOT NULL`                                                     |
| `year`             | `integer`       |                                                                |
| `created_at`       | `timestamptz`   | `NOT NULL` DEFAULT `now()`                                     |
| `UNIQUE`           | `(user_id, external_movie_id, media_type)` | Unikalność pozycji           |

## 2. Relacje między tabelami
* `auth.users 1 ── 1 profiles` (klucz wspólny `user_id`).
* `auth.users 1 ── N user_platforms` → `platforms` (M:N przez `user_platforms`).
* `auth.users 1 ── N user_creators` → `creators` (M:N przez `user_creators`).
* `auth.users 1 ── N watched_items`.

## 3. Indeksy
| Tabela          | Indeks                                    | Cel                                                         |
|-----------------|--------------------------------------------|-------------------------------------------------------------|
| `creators`      | `btree(name)` / `gin (name gin_trgm_ops)`  | Szybkie wyszukiwanie po nazwie                              |
| `watched_items` | `btree(user_id, media_type)`              | Filtrowanie listy rekomendacji                              |
| `user_platforms`| `btree(user_id)`                          | Pobieranie platform użytkownika                             |
| `user_creators` | `btree(user_id)`                          | Pobieranie twórców użytkownika                              |

Unikalne indeksy zostały zdefiniowane w sekcjach tabel.

## 4. Zasady PostgreSQL (RLS, funkcje, triggery)

### 4.1. Funkcje pomocnicze
```sql
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### 4.2. Triggery `updated_at`
```sql
CREATE TRIGGER trg_profiles_updated
BEFORE UPDATE ON profiles
FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER trg_platforms_updated
BEFORE UPDATE ON platforms
FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER trg_creators_updated
BEFORE UPDATE ON creators
FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
```

### 4.3. Automatyczne tworzenie profilu po rejestracji
```sql
CREATE OR REPLACE FUNCTION create_profile_for_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles(user_id) VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION create_profile_for_new_user();
```

### 4.4. RLS
```sql
-- Włącz RLS na tabelach z danymi użytkownika
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_platforms ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_creators ENABLE ROW LEVEL SECURITY;
ALTER TABLE watched_items ENABLE ROW LEVEL SECURITY;

-- profiles: tylko właściciel
CREATE POLICY profile_is_owner ON profiles
FOR ALL USING (user_id = auth.uid());

-- user_platforms
CREATE POLICY up_is_owner ON user_platforms
FOR ALL USING (user_id = auth.uid());

-- user_creators
CREATE POLICY uc_is_owner ON user_creators
FOR ALL USING (user_id = auth.uid());

-- watched_items
CREATE POLICY wi_is_owner ON watched_items
FOR ALL USING (user_id = auth.uid());

-- Tabele słownikowe: publiczny odczyt
-- (RLS nie włączone dla platforms i creators)
```

## 5. Dodatkowe uwagi
1. Wszystkie klucze główne korzystają z `uuid` generowanego przez `gen_random_uuid()` (rozszerzenie `pgcrypto`).
2. Typy `creator_role` i `media_type` zdefiniowane jako ENUM upraszczają walidację i zapobiegają błędom literowym.
3. Kolumny `created_at`/`updated_at` pozwalają na audyt zmian; aktualizacja `updated_at` jest automatyzowana.
4. Fizyczne usuwanie danych (`DELETE`) oraz `ON DELETE CASCADE` zapewniają spójność przy usuwaniu konta użytkownika.
5. Indeksy zostały zaprojektowane pod konkretne scenariusze zapytań (ekran rekomendacji, infinite scroll, wyszukiwanie twórców).
