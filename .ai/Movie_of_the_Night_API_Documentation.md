# Movie of the Night API — Dokumentacja Techniczna

## Informacje Ogólne

**Movie of the Night API** (oficjalnie: *Streaming Availability API*) to REST API do sprawdzania dostępności filmów i seriali na platformach VOD na całym świecie. API aggreguje dane z ponad 200 serwisów streamingowych i umożliwia wyszukiwanie treści wraz z informacją, gdzie aktualne można je obejrzeć.

---

## Dostęp do API

### Punkt Dostępowy (Base URL)

```
https://streaming-availability.p.rapidapi.com
```

### Dostęp przez Platformę

- **Platforma**: RapidAPI (<https://rapidapi.com>)
- **Rejestracja**: <https://rapidapi.com/movie-of-the-night-movie-of-the-night-default/api/streaming-availability>
- **Typ dostępu**: Freemium (darmowy + płatne plany)

### Dokumentacja

- **Główna dokumentacja**: <https://docs.movieofthenight.com>
- **Quickstart**: <https://docs.movieofthenight.com/guide/quickstart>
- **Referencja API**: <https://docs.movieofthenight.com/resource/shows>

---

## Plan Darmowy

| Parametr | Wartość |
|----------|---------|
| **Limit zapytań** | 100 / dzień |
| **Limit per sekundę** | 10 requests/sec |
| **Bez karty kredytowej** | ✅ Tak |
| **Wszystkie endpointy** | ✅ Tak |
| **Wszystkie kraje** | ✅ Tak |

### Plany Płatne (opcjonalnie)

- **Pro**: $19.90/miesiąc → 25,000 zapytań/miesiąc (15 req/sec)
- **Ultra**: $39.90/miesiąc → 100,000 zapytań/miesiąc (20 req/sec)
- **Mega**: $99.90/miesiąc → 1,000,000 zapytań/miesiąc (25 req/sec)

---

## Uwierzytelnienie

### Nagłówki Wymagane

```http
X-RapidAPI-Key: {YOUR_API_KEY}
X-RapidAPI-Host: streaming-availability.p.rapidapi.com
```

### Uzyskanie Klucza API

1. Przejdź na <https://rapidapi.com/movie-of-the-night-movie-of-the-night-default/api/streaming-availability>
2. Kliknij "Subscribe to Test"
3. Wybierz darmowy plan
4. Skopiuj klucz API z sekcji "Code Snippets"

---

## Obsługa Polski

### Kod Kraju

```
pl
```

### Wspierane Serwisy VOD w Polsce

| ID Serwisu | Nazwa Serwisu | Typ | Wspierane |
|-----------|---------------|-----|-----------|
| `netflix` | Netflix | Subskrypcja | ✅ |
| `prime` | Amazon Prime Video | Subskrypcja/Rent/Buy | ✅ |
| `hbo` | HBO Max | Subskrypcja | ✅ |
| `disney` | Disney+ | Subskrypcja | ✅ |
| `apple` | Apple TV+ | Subskrypcja | ✅ |
| `mubi` | Mubi | Subskrypcja | ✅ |
| `zee5` | Zee5 | Subskrypcja | ✅ |
| `paramount` | Paramount+ | Subskrypcja | ❌ (niedostępne w PL) |

---

## Główne Endpointy

### 1. **GET /shows/{id}** — Szczegóły Filmu/Serialu

Pobierz szczegółowe informacje o konkretnym filmie/serialu wraz z dostępnością VOD.

#### Parametry

- `id` (path) — IMDb ID lub TMDb ID (np. `tt0068646` dla "The Godfather")
- `country` (query) — Kod kraju (np. `pl`)
- `output_language` (query) — Język odpowiedzi (np. `en`, `pl`)

#### Przykład Zapytania

```bash
curl -G https://streaming-availability.p.rapidapi.com/shows/tt0068646 \
  -d "country=pl" \
  -H "X-RapidAPI-Key: YOUR_API_KEY" \
  -H "X-RapidAPI-Host: streaming-availability.p.rapidapi.com"
```

#### Struktura Odpowiedzi

```json
{
  "result": {
    "imdbId": "tt0068646",
    "tmdbId": 238,
    "title": "The Godfather",
    "type": "movie",
    "year": 1972,
    "imageSet": {
      "horizontalPoster": {
        "w720": "https://...",
        "w1080": "https://..."
      }
    },
    "cast": [
      {
        "id": "nm0000199",
        "name": "Marlon Brando"
      },
      {
        "id": "nm0001104",
        "name": "Al Pacino"
      }
    ],
    "directors": [
      {
        "id": "nm0001044",
        "name": "Francis Ford Coppola"
      }
    ],
    "streamingInfo": {
      "pl": {
        "netflix": {
          "subscription": {
            "available": true,
            "link": "https://www.netflix.com/title/..."
          }
        },
        "prime": {
          "subscription": {
            "available": true,
            "price": 0,
            "link": "https://www.primevideo.com/..."
          },
          "rent": {
            "available": true,
            "price": 5.99,
            "link": "https://www.primevideo.com/..."
          },
          "buy": {
            "available": true,
            "price": 9.99,
            "link": "https://www.primevideo.com/..."
          }
        }
      }
    }
  }
}
```

---

### 2. **GET /search/basic** — Wyszukiwanie Filmów/Seriali

Wyszukaj filmy/seriale po tytule.

#### Parametry

- `country` (query) — Kod kraju (np. `pl`)
- `title` (query) — Tytuł filmu/serialu
- `type` (query) — `movie` lub `show`
- `page` (query) — Numer strony (domyślnie 1)
- `language` (query) — Oryginalny język (np. `en`, `pl`)
- `output_language` (query) — Język odpowiedzi (domyślnie `en`)

#### Przykład Zapytania

```bash
curl -G https://streaming-availability.p.rapidapi.com/search/basic \
  -d "country=pl" \
  -d "title=The%20Godfather" \
  -d "type=movie" \
  -d "page=1" \
  -H "X-RapidAPI-Key: YOUR_API_KEY" \
  -H "X-RapidAPI-Host: streaming-availability.p.rapidapi.com"
```

#### Struktura Odpowiedzi

```json
{
  "results": [
    {
      "imdbId": "tt0068646",
      "title": "The Godfather",
      "year": 1972,
      "type": "movie",
      "streamingInfo": {
        "pl": {
          "netflix": {
            "subscription": {
              "available": true,
              "link": "https://..."
            }
          }
        }
      }
    }
  ],
  "hasMore": false
}
```

---

### 3. **GET /search/filters** — Wyszukiwanie z Filtrowaniem

Wyszukaj z zaawansowanymi filtrami (dostępność, typ monetyzacji, gatunek itd.).

#### Parametry

- `country` (query) — Kod kraju
- `catalogs` (query) — Filtr serwisu i typu monetyzacji (np. `netflix.subscription`, `prime.rent`)
- `genres` (query) — Gatunki (np. `action,drama`)
- `output_language` (query) — Język

#### Obsługiwane Katalogi (Catalogs)

```
netflix.subscription      → Netflix (subskrypcja)
prime.subscription       → Prime Video (subskrypcja)
prime.rent              → Prime Video (wypożyczenie)
prime.buy               → Prime Video (zakup)
hbo.subscription        → HBO Max (subskrypcja)
disney.subscription     → Disney+ (subskrypcja)
apple.subscription      → Apple TV+ (subskrypcja)
mubi.subscription       → Mubi (subskrypcja)
zee5.subscription       → Zee5 (subskrypcja)
```

#### Przykład Zapytania — Filmy dostępne na Netflixie (subskrypcja)

```bash
curl -G https://streaming-availability.p.rapidapi.com/search/filters \
  -d "country=pl" \
  -d "catalogs=netflix.subscription" \
  -d "genres=action" \
  -d "page=1" \
  -H "X-RapidAPI-Key: YOUR_API_KEY" \
  -H "X-RapidAPI-Host: streaming-availability.p.rapidapi.com"
```

---

### 4. **GET /countries/{country-code}** — Dostępne Serwisy w Kraju

Pobierz listę wspieranych serwisów w danym kraju.

#### Parametry

- `country-code` (path) — Kod kraju (np. `pl`)
- `output_language` (query) — Język

#### Przykład Zapytania

```bash
curl -G https://streaming-availability.p.rapidapi.com/countries/pl \
  -H "X-RapidAPI-Key: YOUR_API_KEY" \
  -H "X-RapidAPI-Host: streaming-availability.p.rapidapi.com"
```

#### Struktura Odpowiedzi

```json
{
  "countryCode": "pl",
  "name": "Poland",
  "services": [
    {
      "serviceId": "netflix",
      "name": "Netflix",
      "homepage": "https://www.netflix.com",
      "logoUrl": "https://...",
      "themeColor": "#E50914",
      "supportedMonetizationTypes": [
        "subscription"
      ]
    },
    {
      "serviceId": "prime",
      "name": "Amazon Prime Video",
      "homepage": "https://www.primevideo.com",
      "logoUrl": "https://...",
      "themeColor": "#146EB4",
      "supportedMonetizationTypes": [
        "subscription",
        "rent",
        "buy"
      ]
    }
  ]
}
```

---

### 5. **GET /genres** — Lista Gatunków

Pobierz listę wspieranych gatunków.

#### Parametry

- `output_language` (query) — Język

#### Przykład Zapytania

```bash
curl -G https://streaming-availability.p.rapidapi.com/genres \
  -H "X-RapidAPI-Key: YOUR_API_KEY" \
  -H "X-RapidAPI-Host: streaming-availability.p.rapidapi.com"
```

---

## Architektura Rozwiązania dla MVP

Aby zrealizować funkcjonalność "wyszukaj ulubionego twórcę i pokaż jego filmy na subskrypcji", potrzebne będzie **hybrydowe rozwiązanie** z dwoma API:

### Przepływ Danych

```
┌─────────────────────────────────────────────────────┐
│  Użytkownik: Szukam filmów "David Fincher"         │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│  TMDb API: Szukaj reżysera                          │
│  GET /search/person?query=David Fincher            │
│  → Otrzymaj TMDb ID                                │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│  TMDb API: Pobierz filmografię                      │
│  GET /person/{id}/movie_credits                    │
│  → Lista filmów: Zodiac, Mank, Seven...            │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│  Dla każdego filmu: Pobierz IMDb ID z TMDb         │
│  (lub konwertuj TMDb ID na IMDb)                    │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│  Movie of the Night API: Sprawdź dostępność        │
│  GET /shows/{imdbId}?country=pl                    │
│  + Filtruj: netflix.subscription, hbo.subscription │
│  → Zwróć tylko subskrypcję                         │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│  Wynik dla użytkownika:                             │
│  "Filmy Finchera dostępne na Netflix/HBO:          │
│   - Zodiac (Netflix)                                │
│   - Mank (Netflix)                                  │
│   - Seven (HBO Max)"                               │
└─────────────────────────────────────────────────────┘
```

---

## Koszty i Limitacje

### Movie of the Night API — Plan Darmowy

- **100 zapytań/dzień** = ~1000 zapytań/tydzień
- Wystarczy na ~50-100 sesji użytkownika dziennie (każda sesja = 1-2 wyszukiwań)
- Po przekroczeniu limitu: timeout do następnego dnia

### TMDb API — Plan Darmowy

- **40 zapytań/10 sekund** (efektywnie nieograniczony dla MVP)
- Wymagane umownie: **nie komercyjne użytko**
- Dla projektu komercyjnego: kontakt z TMDb w sprawie licencji

### Obliczenie Limitów

Jeśli użytkownik:

1. Szuka 1 twórcę: 1-2 zapytania TMDb (szukaj osób + filmografia) = ok. 2 req
2. Sprawdza dostępność dla ~10-20 filmów: 10-20 zapytań do Movie of the Night = ok. 20 req
3. **Total na użytkownika**: ~20-22 zapytań do Movie of the Night

**Dla 100 zapytań dziennie**: ~4-5 aktywnych użytkowników dziennie

---

## Warunki Użytkowania

### Obowiązkowa Atrybucja

Zgodnie z Terms & Conditions Movie of the Night API, jeśli dane są udostępniane publicznie, **wymagana jest atrybucja**:

```
Dane dostępności VOD pochodzą z Movie of the Night API
```

### Ograniczenia

- Nie komercyjna sprzedaż danych
- Atrybucja wymagana w UI aplikacji
- Używanie danych w zgodzie z Terms & Conditions obu API (TMDb + Movie of the Night)

---

## Biblioteki Klienckie

Movie of the Night API udostępnia oficjalne biblioteki dla:

### JavaScript/TypeScript

```bash
npm install @movieofthenight/streaming-availability
```

Dokumentacja: <https://github.com/movieofthenight/ts-streaming-availability>

### Go

```bash
go get github.com/movieofthenight/go-streaming-availability
```

Dokumentacja: <https://github.com/movieofthenight/go-streaming-availability>

### Python

Brak oficjalnej biblioteki — użyj `requests` lub `httpx`

```python
import requests

API_KEY = "YOUR_API_KEY"
BASE_URL = "https://streaming-availability.p.rapidapi.com"

headers = {
    "X-RapidAPI-Key": API_KEY,
    "X-RapidAPI-Host": "streaming-availability.p.rapidapi.com"
}

# Wyszukaj film
response = requests.get(
    f"{BASE_URL}/shows/tt0068646",
    params={"country": "pl"},
    headers=headers
)

data = response.json()
print(data)
```

---

## Przydatne Linki

| Zasób | Link |
|-------|------|
| **Dokumentacja API** | <https://docs.movieofthenight.com> |
| **Quickstart** | <https://docs.movieofthenight.com/guide/quickstart> |
| **Referencja Endpoint Shows** | <https://docs.movieofthenight.com/resource/shows> |
| **Referencja Endpoint Search** | <https://docs.movieofthenight.com/guide/shows> |
| **Referencja Countries** | <https://docs.movieofthenight.com/resource/countries> |
| **RapidAPI Subscription** | <https://rapidapi.com/movie-of-the-night-movie-of-the-night-default/api/streaming-availability> |
| **GitHub — TypeScript** | <https://github.com/movieofthenight/ts-streaming-availability> |
| **GitHub — Go** | <https://github.com/movieofthenight/go-streaming-availability> |
| **GitHub — OpenAPI** | <https://github.com/movieofthenight/streaming-availability-api> |

---

## Notatki Implementacyjne

### Dla Backend (PHP)

```php
$apiKey = getenv('MOVIE_OF_THE_NIGHT_API_KEY');
$imdbId = 'tt0068646'; // The Godfather
$country = 'pl';

$url = "https://streaming-availability.p.rapidapi.com/shows/{$imdbId}";

$ch = curl_init($url);
curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'GET');
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'X-RapidAPI-Key: ' . $apiKey,
    'X-RapidAPI-Host: streaming-availability.p.rapidapi.com'
]);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_URL, $url . "?country={$country}");

$response = curl_exec($ch);
$data = json_decode($response, true);

// Sprawdź dostępność na Netflixie w subskrypcji
if (isset($data['result']['streamingInfo']['pl']['netflix']['subscription']['available'])) {
    $available = $data['result']['streamingInfo']['pl']['netflix']['subscription']['available'];
    if ($available) {
        $link = $data['result']['streamingInfo']['pl']['netflix']['subscription']['link'];
        echo "Dostępne na Netflixie: {$link}";
    }
}
```

### Caching

Zachowaj dane w cache'u (Redis, memcached) na 24 godziny, aby:

- Zmniejszyć liczbę zapytań do API
- Przyspieszyć odpowiedzi dla użytkownika
- Optymalizować limit 100 zapytań/dzień

```php
$cacheKey = "show_{$imdbId}_pl";
$cached = $cache->get($cacheKey);

if (!$cached) {
    // Zapytaj API
    $data = callMovieOfTheNightAPI($imdbId, 'pl');
    // Zachowaj na 24h
    $cache->set($cacheKey, $data, 86400);
} else {
    $data = $cached;
}
```

---

## Wersja Dokumentu

- **Data**: 17 stycznia 2026
- **API Version**: v4 (streaming-availability.p.rapidapi.com)
- **Status**: Aktywny i wspierany

---

*Ta dokumentacja została przygotowana jako referencja techniczna dla MVP aplikacji "Ulubieni Twórcy".*
