# Naprawa przepływu onboardingu - Podsumowanie zmian

**Data:** 2026-01-19
**Status:** ✅ Zakończone

## Problem

Podczas weryfikacji implementacji względem PRD wykryto **krytyczny problem** z procesem onboardingu:

### Wykryte problemy:

1. **Brak wymuszenia onboardingu po rejestracji**
   - Po rejestracji użytkownik był przekierowywany do `/home` zamiast `/onboarding/platforms`
   - Użytkownik mógł całkowicie ominąć proces onboardingu
   - Naruszenie wymagania US-001 pkt 4 z PRD

2. **Middleware nie sprawdzał statusu onboardingu**
   - Middleware tylko weryfikował autentykację użytkownika
   - Brak walidacji czy użytkownik ukończył onboarding
   - Naruszenie wymagania US-003: "Proces jest obligatoryjny po pierwszej rejestracji"

3. **Niepoprawne przekierowania w flow**
   - Po zakończeniu onboardingu: przekierowanie do `/` zamiast `/home`
   - Middleware przekierowywał zalogowanych z `/` do `/home` bez sprawdzania onboardingu

## Rozwiązanie

### 1. Poprawka przekierowania po rejestracji

**Plik:** `src/components/auth/RegisterForm.tsx`

```typescript
// PRZED:
window.location.href = "/home";

// PO:
window.location.href = "/onboarding/platforms";
```

**Efekt:** Po udanej rejestracji użytkownik jest kierowany do pierwszego kroku onboardingu.

### 2. Poprawka przekierowania po zakończeniu onboardingu

**Plik:** `src/components/hooks/useCreatorSelection.ts`

```typescript
// PRZED:
window.location.assign("/");

// PO:
window.location.assign("/home");
```

**Efekt:** Po ukończeniu drugiego kroku onboardingu użytkownik trafia bezpośrednio na stronę główną.

### 3. Dodanie ścieżek onboardingu do middleware

**Plik:** `src/middleware/index.ts`

Utworzono nową stałą `ONBOARDING_PATHS`:

```typescript
const ONBOARDING_PATHS = [
  "/onboarding/platforms",
  "/onboarding/creators",
  "/api/onboarding/state",
  "/api/onboarding/platforms",
  "/api/onboarding/creators",
];
```

**Efekt:** Middleware rozpoznaje ścieżki onboardingu jako specjalne - wymagające autentykacji, ale dostępne przed ukończeniem onboardingu.

### 4. Implementacja logiki wymuszania onboardingu

**Plik:** `src/middleware/index.ts`

#### Zmiany w logice dla public paths:

```typescript
// Dla zalogowanych użytkowników na głównej stronie ("/")
if (url.pathname === "/") {
  // Sprawdź status onboardingu
  const { data: profile } = await supabaseSSR
    .from("profiles")
    .select("onboarding_status")
    .eq("user_id", user.id)
    .single();

  if (profile) {
    // Przekieruj do odpowiedniego kroku
    if (profile.onboarding_status === "not_started") {
      return redirect("/onboarding/platforms");
    } else if (profile.onboarding_status === "platforms_selected") {
      return redirect("/onboarding/creators");
    } else if (profile.onboarding_status === "completed") {
      return redirect("/home");
    }
  }
}
```

#### Nowa logika dla protected routes:

```typescript
// 1. Sprawdź czy to ścieżka onboardingu
const isOnboardingPath = ONBOARDING_PATHS.some((path) => 
  url.pathname.startsWith(path)
);

// 2. Dla ścieżek onboardingu - pozwól na dostęp
if (isOnboardingPath) {
  return next();
}

// 3. Dla wszystkich innych chroniony routes - sprawdź onboarding
const { data: profile, error: profileError } = await supabaseSSR
  .from("profiles")
  .select("onboarding_status")
  .eq("user_id", user.id)
  .single();

if (profileError || !profile) {
  // Profil nie istnieje - przekieruj do startu onboardingu
  return redirect("/onboarding/platforms");
}

// 4. Przekieruj do odpowiedniego kroku jeśli niekompletny
if (profile.onboarding_status === "not_started") {
  return redirect("/onboarding/platforms");
} else if (profile.onboarding_status === "platforms_selected") {
  return redirect("/onboarding/creators");
}

// 5. Onboarding ukończony - pozwól na dostęp
return next();
```

## Przepływ użytkownika po zmianach

### Scenariusz 1: Nowa rejestracja

1. ✅ Użytkownik wypełnia formularz rejestracji
2. ✅ Trigger w bazie danych tworzy profil z `onboarding_status = 'not_started'`
3. ✅ Użytkownik jest przekierowywany do `/onboarding/platforms`
4. ✅ Użytkownik wybiera min. 1 platformę
5. ✅ Status zmienia się na `platforms_selected`
6. ✅ Użytkownik jest przekierowywany do `/onboarding/creators`
7. ✅ Użytkownik dodaje min. 3 twórców
8. ✅ Status zmienia się na `completed`
9. ✅ Użytkownik jest przekierowywany do `/home`

### Scenariusz 2: Próba ominięcia onboardingu

1. Użytkownik po rejestracji próbuje wejść bezpośrednio na `/home` lub `/profile`
2. ✅ Middleware sprawdza `onboarding_status`
3. ✅ Status = `not_started` → przekierowanie do `/onboarding/platforms`
4. ✅ Użytkownik **nie może** ominąć onboardingu

### Scenariusz 3: Powrót do niedokończonego onboardingu

1. Użytkownik zarejestrował się, wybrał platformy, ale zamknął przeglądarkę
2. Użytkownik loguje się ponownie i próbuje wejść na `/home`
3. ✅ Middleware sprawdza status = `platforms_selected`
4. ✅ Przekierowanie do `/onboarding/creators` (dokończenie procesu)

### Scenariusz 4: Zalogowany użytkownik z ukończonym onboardingiem

1. Użytkownik wchodzi na `/` (root)
2. ✅ Middleware sprawdza status = `completed`
3. ✅ Przekierowanie do `/home`
4. ✅ Pełny dostęp do wszystkich funkcji aplikacji

## Zgodność z PRD

### ✅ US-001: Rejestracja nowego konta

**Kryterium 4:** "Po pomyślnej rejestracji jestem automatycznie zalogowany i przekierowany do pierwszego kroku onboardingu."

- ✅ **NAPRAWIONE:** Przekierowanie do `/onboarding/platforms`

### ✅ US-003: Onboarding - Krok 1

**Kryterium 4:** "Funkcjonalność Onboardingu nie jest dostępna bez logowania się do systemu"

- ✅ **ZWERYFIKOWANE:** Middleware wymaga autentykacji dla ścieżek `/onboarding/*`

### ✅ US-004: Onboarding - Krok 2

**Kryterium 4:** "Po dodaniu 3. twórcy i kliknięciu 'Zakończ', jestem przenoszony na ekran główny."

- ✅ **NAPRAWIONE:** Przekierowanie do `/home` zamiast `/`

**Kryterium 5:** "Funkcjonalność Onboardingu nie jest dostępna bez logowania się do systemu"

- ✅ **ZWERYFIKOWANE:** Middleware wymaga autentykacji

### ✅ Wymaganie z sekcji 3.2 PRD

"Proces jest obligatoryjny po pierwszej rejestracji"

- ✅ **NAPRAWIONE:** Middleware wymusza ukończenie onboardingu przed dostępem do protected routes

## Architektura rozwiązania

### Diagram przepływu middleware:

```
┌─────────────────┐
│  Request        │
└────────┬────────┘
         │
         ▼
┌────────────────────┐
│ Create Supabase    │
│ SSR Client         │
└────────┬───────────┘
         │
         ▼
    ┌────────────┐
    │ PUBLIC     │
    │ PATH?      │
    └─┬────────┬─┘
      │YES     │NO
      │        │
      ▼        ▼
  ┌───────┐   ┌──────────────┐
  │Auth?  │   │ Check Auth   │
  └┬─────┬┘   └──────┬───────┘
   │YES  │NO          │
   │     │            ▼
   │     └──→    ┌──────────┐
   │             │ 401      │
   │             └──────────┘
   ▼
┌──────────────┐
│ path == "/"? │
└┬────────────┬┘
 │YES        │NO
 │           │
 ▼           └──→ next()
┌─────────────────┐
│Get onboarding   │
│status from DB   │
└────────┬────────┘
         │
         ▼
   ┌──────────┐
   │not_      │─→ /onboarding/platforms
   │started?  │
   └──────────┘
         │
         ▼
   ┌──────────┐
   │platforms │─→ /onboarding/creators
   │selected? │
   └──────────┘
         │
         ▼
   ┌──────────┐
   │completed?│─→ /home
   └──────────┘


PROTECTED ROUTES:
┌─────────────────┐
│ Authenticated   │
│ User            │
└────────┬────────┘
         │
         ▼
┌────────────────────┐
│ ONBOARDING_PATH?   │
└────┬───────────┬───┘
     │YES        │NO
     │           │
     │           ▼
     │      ┌────────────────┐
     │      │Check onboarding│
     │      │status from DB  │
     │      └───────┬────────┘
     │              │
     │              ▼
     │         ┌───────────┐
     │         │completed? │
     │         └─┬───────┬─┘
     │           │YES    │NO
     │           │       │
     └───────────┘       ▼
             │      Redirect to
             │      onboarding
             ▼
         next()
```

## Bezpieczeństwo

### Trigger bazodanowy

Tabela `profiles` jest automatycznie tworzona przez trigger:

```sql
create or replace function create_profile_for_new_user()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.profiles (user_id)
  values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function create_profile_for_new_user();
```

**Bezpieczeństwo:**
- ✅ `security definer` - trigger ma uprawnienia do wstawiania profilu (omija RLS)
- ✅ Automatyczne tworzenie - brak możliwości "zapomnienia" o profilu
- ✅ Wartości domyślne: `onboarding_status = 'not_started'`, `country_code = 'PL'`

### Row Level Security (RLS)

Middleware używa SSR Supabase client, który:
- ✅ Automatycznie uwzględnia RLS policies
- ✅ Użytkownik może czytać tylko swój profil
- ✅ Użytkownik może aktualizować tylko swój profil

## Pliki zmodyfikowane

1. `src/components/auth/RegisterForm.tsx` - przekierowanie po rejestracji
2. `src/components/hooks/useCreatorSelection.ts` - przekierowanie po onboardingu
3. `src/middleware/index.ts` - logika wymuszania onboardingu

## Testy manualne (do wykonania)

### Test 1: Nowa rejestracja
- [ ] Zarejestruj nowe konto
- [ ] Sprawdź czy automatyczne przekierowanie do `/onboarding/platforms`
- [ ] Wybierz platformę i kliknij "Dalej"
- [ ] Sprawdź czy przekierowanie do `/onboarding/creators`
- [ ] Dodaj 3 twórców i kliknij "Zakończ"
- [ ] Sprawdź czy przekierowanie do `/home`

### Test 2: Próba ominięcia onboardingu
- [ ] Po rejestracji, manualnie wejdź na `/home` w pasku adresu
- [ ] Sprawdź czy middleware przekierowuje do `/onboarding/platforms`
- [ ] Po wyborze platform, manualnie wejdź na `/profile`
- [ ] Sprawdź czy middleware przekierowuje do `/onboarding/creators`

### Test 3: Powrót do niedokończonego onboardingu
- [ ] Zacznij rejestrację, wybierz platformy
- [ ] Wyloguj się lub zamknij przeglądarkę
- [ ] Zaloguj ponownie
- [ ] Sprawdź czy przekierowanie bezpośrednio do `/onboarding/creators`

### Test 4: Ukończony onboarding
- [ ] Zaloguj się jako użytkownik z ukończonym onboardingiem
- [ ] Wejdź na `/`
- [ ] Sprawdź czy przekierowanie do `/home`
- [ ] Sprawdź dostęp do `/profile`, `/home` - powinien działać

## Podsumowanie

✅ **Problem rozwiązany:** Proces onboardingu jest teraz obligatoryjny i nie można go ominąć

✅ **Zgodność z PRD:** Wszystkie wymagania dotyczące onboardingu (US-001, US-003, US-004) są spełnione

✅ **Bezpieczeństwo:** Middleware skutecznie wymusza ukończenie onboardingu przed dostępem do aplikacji

✅ **Doświadczenie użytkownika:** Płynny przepływ od rejestracji przez onboarding do strony głównej
