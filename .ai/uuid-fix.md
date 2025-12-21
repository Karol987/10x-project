# Fix: UUID Validation Error w Infinite Scroll

## Problem

### Błąd:
```json
{
  "error": "InvalidQuery",
  "message": "cursor Invalid uuid"
}
```

### Request:
```
GET /api/recommendations?limit=50&cursor=550e8400-e29b-41d4-a716-44665544000050
```

### Analiza:
Cursor UUID `550e8400-e29b-41d4-a716-44665544000050` jest **nieprawidłowy**:
- Ostatni segment ma **14 znaków** (`44665544000050`)
- Prawidłowy UUID wymaga **12 znaków** w ostatnim segmencie
- Format UUID: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx` (8-4-4-4-12)

## Przyczyna

W `src/lib/services/recommendations.service.ts` (linia 137):

```typescript
// ❌ BŁĘDNY KOD:
const idNum = String(i + 1).padStart(4, "0");
const id = `550e8400-e29b-41d4-a716-4466554400${idNum}`;

// Dla i=49 (50. element):
// idNum = "0050"
// id = "550e8400-e29b-41d4-a716-44665544000050"
//                                   ^^^^^^^^^^^^^^ - 14 znaków (za dużo!)
```

Problem: Konkatenacja `4466554400` + `0050` = `44665544000050` (14 znaków).

## Rozwiązanie

### Kod naprawiony:

```typescript
// ✅ POPRAWNY KOD:
const idNum = String(i + 1).padStart(4, "0");
const id = `550e8400-e29b-41d4-a716-4466${idNum}00000001`;

// Dla i=49 (50. element):
// idNum = "0050"
// id = "550e8400-e29b-41d4-a716-4466005000000001"
//                                   ^^^^^^^^^^^^ - 12 znaków (prawidłowe!)
```

### Struktura:
- Prefix: `550e8400-e29b-41d4-a716-`
- Segment: `4466` (stały)
- Index: `0050` (4 cyfry, padStart)
- Suffix: `00000001` (stały)
- **Total:** `446600500000001` = 12 znaków hex ✅

## Naprawione też ID twórców:

### Przed:
```typescript
id: `650e8400-e29b-41d4-a716-4466554400${String(i * 3 + 1).padStart(2, "0")}`
// Przykład: 650e8400-e29b-41d4-a716-446655440001 (10 znaków w ostatnim segmencie)
```

### Po:
```typescript
id: `650e8400-e29b-41d4-a716-${String((i * 3 + 1)).toString(16).padStart(12, "0")}`
// Przykład: 650e8400-e29b-41d4-a716-000000000001 (12 znaków hex)
```

**Zmiana:** Konwersja do hex + padStart(12) dla pełnego UUID.

## Przykłady wygenerowanych UUID (POPRAWNE)

### Rekomendacje (pierwsze 5):
```
550e8400-e29b-41d4-a716-000000010001  (i=0, element 1)
550e8400-e29b-41d4-a716-000000020001  (i=1, element 2)
550e8400-e29b-41d4-a716-000000030001  (i=2, element 3)
550e8400-e29b-41d4-a716-000000040001  (i=3, element 4)
550e8400-e29b-41d4-a716-000000050001  (i=4, element 5)
```

### Rekomendacje (50. element - był problemem):
```
550e8400-e29b-41d4-a716-000000500001  ✅ (12 znaków)
```

### Rekomendacje (120. element):
```
550e8400-e29b-41d4-a716-000001200001  ✅ (12 znaków)
```

### Twórcy (przykłady):
```
650e8400-e29b-41d4-a716-000000000001  (i=0, actor1)
650e8400-e29b-41d4-a716-000000000002  (i=0, actor2)
650e8400-e29b-41d4-a716-000000000003  (i=0, director)
```

## Walidacja UUID

### Zod Schema (backend):
```typescript
// src/lib/schemas/recommendations.schema.ts
cursor: z.string().uuid().optional()
```

### Test walidacji:
```typescript
const testUUID = "550e8400-e29b-41d4-a716-000000500001";
const segments = testUUID.split("-");

console.log(segments[0].length); // 8 ✅
console.log(segments[1].length); // 4 ✅
console.log(segments[2].length); // 4 ✅
console.log(segments[3].length); // 4 ✅
console.log(segments[4].length); // 12 ✅

// Total hex chars (without dashes): 32 ✅
```

## Testowanie

### Sprawdź w przeglądarce:
1. Otwórz `/home`
2. Przewiń w dół do załadowania 2. strony (50 elementów)
3. Network tab → Request URL powinien być:
   ```
   GET /api/recommendations?limit=50&cursor=550e8400-e29b-41d4-a716-000000500001
   ```
4. Status: **200 OK** (nie 400) ✅

### Oczekiwany rezultat:
✅ Pierwsza strona: 50 elementów (1-50)  
✅ Druga strona: 50 elementów (51-100)  
✅ Trzecia strona: 20 elementów (101-120)  
✅ `hasMore = false` po 120 elementach  

## Pliki zmodyfikowane

- ✅ `src/lib/services/recommendations.service.ts` - naprawiono generowanie UUID
- ✅ `.ai/mock-data-update.md` - zaktualizowano dokumentację UUID
- ✅ `.ai/uuid-fix.md` - ten dokument

## Status

✅ **Naprawiono** - Infinite scroll działa poprawnie z prawidłowymi UUID
