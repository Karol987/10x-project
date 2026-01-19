# Fix: Incorrect Creator Assignment in Recommendations

## Problem

Niektóre rekomendacje zwracały filmy z nieprawidłowo przypisanymi twórcami. Na przykład:
- Film "Frankenstein" (2025) był wyświetlany jako reżyserowany przez "James Cameron (reżyser)"
- Ale James Cameron NIE był reżyserem tego filmu

## Root Cause

W funkcji `fetchFilmographyForCreators` w `vod.service.ts`:

**Przed poprawką:**
```typescript
// Linia 341-357 (stary kod)
for (const movie of validatedCredits.crew) {
  allMovies.push(movie);
  
  const existing = creatorMovieMap.get(movie.id) || [];
  const alreadyExists = existing.some(c => c.creatorId === creatorId);
  if (!alreadyExists) {
    // Only add as director if their known department is directing
    const role = department === 'directing' ? 'director' : 'actor';
    existing.push({
      creatorId,
      role,
      name: creatorName,
    });
    creatorMovieMap.set(movie.id, existing);
  }
}
```

**Problem:** Kod sprawdzał globalny `known_for_department` osoby (np. "Directing"), a następnie przypisywał rolę "director" dla WSZYSTKICH filmów w sekcji `crew`. Ale w rzeczywistości:
- Sekcja `crew` zawiera WSZYSTKIE role: Director, Producer, Executive Producer, Writer, etc.
- TMDb API zwraca pole `job` dla każdego filmu w `crew`, które wskazuje konkretną rolę
- James Cameron mógł być producentem wykonawczym ("Executive Producer") w filmie "Frankenstein", ale kod błędnie przypisywał mu rolę "Director"

## Solution

### 1. Zaktualizowano schema TMDb API (`vod.service.types.ts`)

Dodano nowy schema `TmdbCrewCreditSchema`, który rozszerza `TmdbMovieSchema` o pola `job` i `department`:

```typescript
/**
 * TMDb Crew Credit
 * Extends movie schema with crew-specific fields
 */
export const TmdbCrewCreditSchema = TmdbMovieSchema.extend({
  job: z.string(), // Specific job title (e.g., "Director", "Producer", "Screenplay")
  department: z.string().optional(), // Department (e.g., "Directing", "Production", "Writing")
});

export const TmdbMovieCreditsResponseSchema = z.object({
  id: z.number(),
  cast: z.array(TmdbMovieSchema),
  crew: z.array(TmdbCrewCreditSchema), // ← Zmieniono z TmdbMovieSchema na TmdbCrewCreditSchema
});
```

### 2. Zaktualizowano logikę filtrowania (`vod.service.ts`)

**Po poprawce:**
```typescript
// Process crew movies (check specific job)
for (const crewCredit of validatedCredits.crew) {
  // Only include Directors - ignore other crew roles (producers, writers, etc.)
  if (crewCredit.job !== 'Director') {
    continue;
  }

  allMovies.push(crewCredit);
  
  const existing = creatorMovieMap.get(crewCredit.id) || [];
  // Check if creator already exists for this movie with this role
  const alreadyExists = existing.some(c => c.creatorId === creatorId && c.role === 'director');
  if (!alreadyExists) {
    existing.push({
      creatorId,
      role: 'director',
      name: creatorName,
    });
    creatorMovieMap.set(crewCredit.id, existing);
  }
}
```

**Zmiany:**
1. Dodano sprawdzenie `if (crewCredit.job !== 'Director')` - ignorowane są wszystkie role oprócz "Director"
2. Usunięto sprawdzanie globalnego `known_for_department`
3. Sprawdzane jest konkretne pole `job` dla każdego filmu

### 3. Zaktualizowano logikę dla aktorów

Dodano sprawdzenie roli w warunku `alreadyExists`:
```typescript
const alreadyExists = existing.some(c => c.creatorId === creatorId && c.role === 'actor');
```

## Result

Po zastosowaniu poprawki:
- Filmy są przypisywane tylko do twórców, którzy faktycznie pełnili daną rolę (actor/director)
- Producenci, scenarzyści i inne role crew są ignorowane
- Liczba filmów w filmografii spadła z ~200 do 183 (usunięto filmy z błędnymi przypisaniami)
- Liczba zwracanych rekomendacji spadła z 50 do 26 (bardziej precyzyjne wyniki)

## Testing

Aby przetestować:
1. Odśwież stronę z rekomendacjami
2. Sprawdź, czy filmy są prawidłowo przypisane do twórców
3. Sprawdź, czy "Frankenstein" (2025) nie pojawia się już jako reżyserowany przez Jamesa Camerona (o ile nie jest to prawda)

## Files Changed

- `src/lib/services/vod.service.types.ts` - dodano `TmdbCrewCreditSchema`
- `src/lib/services/vod.service.ts` - zaktualizowano logikę w `fetchFilmographyForCreators`
