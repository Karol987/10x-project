# Plan Implementacji Usługi Integracji VOD (TMDb + MOTN) - Wersja 2

Ten dokument zawiera szczegółowy plan techniczny wdrożenia serwisu integrującego dane o filmach (TMDb) z informacjami o dostępności na platformach streamingowych (Movie of the Night via RapidAPI) dla aplikacji Streamly.

**Status:** Tabela cache w bazie danych została już utworzona (migracja `20260118120000_create_vod_availability_cache.sql`).

## 1. Architektura Hybrydowa i Przepływ Danych

Ze względu na limit 100 zapytań/dzień w API Movie of the Night (MOTN), usługa musi działać w modelu **Cache-First** z wykorzystaniem bazy danych (Supabase) jako bufora współdzielonego przez wszystkich użytkowników.

### Schemat Przepływu (Sequence Flow)

1. **Wyszukiwanie Twórcy**: Aplikacja pyta bezpośrednio TMDb (tani zasób).
2. **Pobieranie Filmografii**: Aplikacja pobiera listę filmów z TMDb.
3. **Sprawdzanie Dostępności (Critical Path)**:
   * Dla każdego filmu system sprawdza tabelę `vod_availability_cache` w Supabase.
   * **HIT**: Jeśli dane istnieją i są młodsze niż 24h → Zwróć z bazy.
   * **MISS**: Wykonaj zapytanie do API MOTN → Zapisz wynik w bazie → Zwróć wynik.
   * **FAILSAFE**: Jeśli API MOTN zwróci błąd 429 (Limit), zwróć informację o braku danych bez blokowania aplikacji.

## 2. Konfiguracja i Zmienne Środowiskowe

Dodaj następujące zmienne do pliku `.env`:

```bash
# TMDb (The Movie Database)
TMDB_API_KEY="twój_klucz_tmdb"
TMDB_API_URL="https://api.themoviedb.org/3"

# Movie of the Night (RapidAPI)
MOTN_API_KEY="twój_klucz_rapidapi"
MOTN_API_HOST="streaming-availability.p.rapidapi.com"
MOTN_API_URL="https://streaming-availability.p.rapidapi.com"

# Supabase (już skonfigurowane w projekcie)
# SUPABASE_URL=...
# SUPABASE_ANON_KEY=...
# SUPABASE_SERVICE_KEY=... (potrzebny dla operacji zapisu w cache)
```

## 3. Definicje Typów i DTO (`src/types.ts`)

Zdefiniuj interfejsy, aby oddzielić warstwę API od logiki aplikacji.

```typescript
// src/types.ts

// Reprezentacja twórcy (z TMDb)
export interface Creator {
  id: number;
  name: string;
  profilePath: string | null;
  knownFor: Movie[];
}

// Reprezentacja filmu (Wewnętrzny model aplikacji)
export interface Movie {
  id: number; // TMDb ID
  title: string;
  posterPath: string | null;
  releaseDate: string;
  voteAverage: number;
  // Pola wypełniane asynchronicznie/później
  streamingAvailability?: StreamingPlatform[];
}

// Reprezentacja platformy VOD
export interface StreamingPlatform {
  serviceId: string; // np. 'netflix', 'hbo'
  name: string;      // np. 'Netflix', 'HBO Max'
  link: string;      // Deep link do filmu
  type: 'subscription' | 'rent' | 'buy';
}

// DTO dla odpowiedzi z TMDb
export interface TmdbPersonSearchResponse {
  results: {
    id: number;
    name: string;
    profile_path: string | null;
    known_for: any[];
  }[];
}

// DTO dla odpowiedzi z MOTN
export interface MotnShowResponse {
  result: {
    tmdbId: number;
    streamingInfo: {
      [countryCode: string]: {
        [serviceId: string]: {
            subscription?: { link: string };
            rent?: { link: string };
            buy?: { link: string };
        }[]
      }
    }
  }
}

// DTO dla cache entry (zgodny ze schematem bazy)
export interface VodCacheEntry {
  tmdb_id: number;
  country_code: string;
  availability_data: StreamingPlatform[];
  last_updated_at: string;
}
```

## 4. Implementacja Klientów API (`src/lib/services/`)

Utwórz katalog `src/lib/services` i zaimplementuj poszczególne serwisy.

### A. TMDb Client (`src/lib/services/tmdb.ts`)

```typescript
import type { Creator, Movie } from '../../types';

// Pobierz zmienne środowiskowe zgodnie z konfiguracją Astro
const TMDB_API_KEY = import.meta.env.TMDB_API_KEY || process.env.TMDB_API_KEY;
const TMDB_API_URL = import.meta.env.TMDB_API_URL || process.env.TMDB_API_URL || 'https://api.themoviedb.org/3';

export class TmdbClient {
  private async fetch(endpoint: string, params: Record<string, string> = {}) {
    const searchParams = new URLSearchParams({
      api_key: TMDB_API_KEY!,
      language: 'pl-PL',
      ...params,
    });
    
    const res = await fetch(`${TMDB_API_URL}${endpoint}?${searchParams}`);
    if (!res.ok) {
      throw new Error(`TMDb Error: ${res.status} ${res.statusText}`);
    }
    return res.json();
  }

  async searchPerson(query: string): Promise<Creator[]> {
    const data = await this.fetch('/search/person', { query });
    return data.results.slice(0, 5).map((p: any) => ({
      id: p.id,
      name: p.name,
      profilePath: p.profile_path,
      knownFor: [] // Będzie uzupełnione później
    }));
  }

  async getDirectorCredits(personId: number): Promise<Movie[]> {
    const data = await this.fetch(`/person/${personId}/movie_credits`);
    // Filtrujemy tylko reżyserię (crew -> job: Director)
    const directorWorks = data.crew
      .filter((c: any) => c.job === 'Director')
      // Sortujemy po popularności malejąco
      .sort((a: any, b: any) => (b.vote_count || 0) - (a.vote_count || 0)); 

    return directorWorks.map((m: any) => ({
      id: m.id,
      title: m.title,
      posterPath: m.poster_path,
      releaseDate: m.release_date || '',
      voteAverage: m.vote_average || 0
    }));
  }

  /**
   * Pobiera szczegóły filmu (opcjonalnie, do rozszerzenia)
   */
  async getMovieDetails(movieId: number): Promise<Movie> {
    const data = await this.fetch(`/movie/${movieId}`);
    return {
      id: data.id,
      title: data.title,
      posterPath: data.poster_path,
      releaseDate: data.release_date || '',
      voteAverage: data.vote_average || 0
    };
  }
}
```

### B. MOTN Client z Cache (`src/lib/services/vod.ts`)

To jest najważniejszy komponent. Obsługuje logikę "Sprawdź DB -> Jak nie ma, Sprawdź API".

```typescript
import { createClient } from '@supabase/supabase-js';
import type { StreamingPlatform, VodCacheEntry } from '../../types';

// Inicjalizacja Supabase z kluczem service_role dla operacji zapisu
// W środowisku produkcyjnym użyj SUPABASE_SERVICE_KEY
const SUPABASE_URL = import.meta.env.SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = import.meta.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_KEY;

const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_KEY!);

const MOTN_API_KEY = import.meta.env.MOTN_API_KEY || process.env.MOTN_API_KEY;
const MOTN_API_HOST = import.meta.env.MOTN_API_HOST || process.env.MOTN_API_HOST;
const MOTN_API_URL = import.meta.env.MOTN_API_URL || process.env.MOTN_API_URL || 'https://streaming-availability.p.rapidapi.com';

const MOTN_HEADERS = {
  'X-RapidAPI-Key': MOTN_API_KEY!,
  'X-RapidAPI-Host': MOTN_API_HOST!,
};

// Czas życia cache w milisekundach (24 godziny)
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

export class VodService {
  /**
   * Sprawdza dostępność dla pojedynczego filmu.
   * Najpierw cache, potem API.
   */
  async getAvailability(tmdbId: number, country = 'pl'): Promise<StreamingPlatform[]> {
    // 1. Sprawdź Cache w Supabase
    const { data: cached, error: cacheError } = await supabase
      .from('vod_availability_cache')
      .select('availability_data, last_updated_at')
      .eq('tmdb_id', tmdbId)
      .eq('country_code', country)
      .maybeSingle();

    if (cacheError) {
      console.error('[Cache Error]', cacheError);
    }

    // Sprawdź czy dane są świeże (< 24h)
    const isFresh = cached && (new Date().getTime() - new Date(cached.last_updated_at).getTime() < CACHE_TTL_MS);

    if (isFresh && cached) {
      console.log(`[Cache HIT] TMDb ID: ${tmdbId}, Country: ${country}`);
      return cached.availability_data as StreamingPlatform[];
    }

    // 2. Jeśli brak w Cache lub przestarzałe -> Zapytaj API
    console.log(`[Cache MISS] Fetching MOTN for TMDb ID: ${tmdbId}, Country: ${country}`);
    try {
      // MOTN endpoint: /shows/{type}/{id} gdzie type to 'movie' lub 'series'
      // Dla uproszczenia MVP zakładamy, że wszystko to filmy
      const response = await fetch(
        `${MOTN_API_URL}/shows/movie/${tmdbId}?country=${country}&output_language=pl`,
        { headers: MOTN_HEADERS }
      );

      if (response.status === 429) {
        console.error('[MOTN] Rate Limit Exceeded (429)');
        // Nie zapisuj do cache, żeby spróbować ponownie później
        return [];
      }
      
      if (response.status === 404) {
        // Film nieznany w MOTN - zapisz pustą tablicę do cache
        console.log(`[MOTN] Movie not found (404) for TMDb ID: ${tmdbId}`);
        await this.saveToCache(tmdbId, country, []);
        return [];
      }

      if (!response.ok) {
        console.error(`[MOTN] Error ${response.status}: ${response.statusText}`);
        return [];
      }

      const data = await response.json();
      const platforms = this.mapMotnResponse(data, country);

      // 3. Zapisz do Cache
      await this.saveToCache(tmdbId, country, platforms);

      return platforms;

    } catch (error) {
      console.error('[MOTN] Error fetching VOD data:', error);
      return [];
    }
  }

  /**
   * Mapuje odpowiedź z MOTN API na wewnętrzny format StreamingPlatform[]
   */
  private mapMotnResponse(data: any, country: string): StreamingPlatform[] {
    const streamingInfo = data.result?.streamingInfo?.[country] || {};
    const platforms: StreamingPlatform[] = [];

    // Mapowanie serwisów (Netflix, HBO, Disney, Prime)
    for (const [serviceId, options] of Object.entries(streamingInfo)) {
      const typedOptions = options as any[]; // Array of { type: 'subscription', link: string, ... }
      
      // Priorytet: subscription > rent > buy
      const subOption = typedOptions.find(o => o.type === 'subscription');
      const rentOption = typedOptions.find(o => o.type === 'rent');
      const buyOption = typedOptions.find(o => o.type === 'buy');
      
      const preferredOption = subOption || rentOption || buyOption;
      
      if (preferredOption) {
        platforms.push({
          serviceId: serviceId,
          name: this.formatServiceName(serviceId),
          link: preferredOption.link,
          type: preferredOption.type as 'subscription' | 'rent' | 'buy'
        });
      }
    }
    return platforms;
  }

  /**
   * Mapuje ID serwisu na czytelną nazwę
   */
  private formatServiceName(id: string): string {
    const names: Record<string, string> = {
      'netflix': 'Netflix',
      'hbo': 'HBO Max',
      'disney': 'Disney+',
      'prime': 'Prime Video',
      'apple': 'Apple TV+',
      'paramount': 'Paramount+',
      'canal': 'Canal+',
      'skyshowtime': 'SkyShowtime'
    };
    return names[id] || id.charAt(0).toUpperCase() + id.slice(1);
  }

  /**
   * Zapisuje lub aktualizuje wpis w cache
   */
  private async saveToCache(tmdbId: number, country: string, data: StreamingPlatform[]) {
    const { error } = await supabase.from('vod_availability_cache').upsert({
      tmdb_id: tmdbId,
      country_code: country,
      availability_data: data,
      last_updated_at: new Date().toISOString()
    }, {
      onConflict: 'tmdb_id,country_code' // Composite primary key
    });

    if (error) {
      console.error('[Cache] Error saving to cache:', error);
    } else {
      console.log(`[Cache] Saved TMDb ID: ${tmdbId}, Country: ${country}`);
    }
  }

  /**
   * Pobiera dostępność dla wielu filmów (batch processing)
   * Optymalizacja: najpierw sprawdza cache dla wszystkich, potem API tylko dla brakujących
   */
  async getAvailabilityBatch(tmdbIds: number[], country = 'pl'): Promise<Map<number, StreamingPlatform[]>> {
    const results = new Map<number, StreamingPlatform[]>();

    // 1. Sprawdź cache dla wszystkich filmów naraz
    const { data: cachedEntries } = await supabase
      .from('vod_availability_cache')
      .select('tmdb_id, availability_data, last_updated_at')
      .in('tmdb_id', tmdbIds)
      .eq('country_code', country);

    const now = new Date().getTime();
    const missingIds: number[] = [];

    // Przetwórz wyniki z cache
    for (const tmdbId of tmdbIds) {
      const cached = cachedEntries?.find(e => e.tmdb_id === tmdbId);
      const isFresh = cached && (now - new Date(cached.last_updated_at).getTime() < CACHE_TTL_MS);

      if (isFresh && cached) {
        results.set(tmdbId, cached.availability_data as StreamingPlatform[]);
      } else {
        missingIds.push(tmdbId);
      }
    }

    console.log(`[Batch] Cache hits: ${results.size}, misses: ${missingIds.length}`);

    // 2. Dla brakujących pobierz z API (sekwencyjnie, żeby nie przekroczyć rate limit)
    for (const tmdbId of missingIds) {
      const availability = await this.getAvailability(tmdbId, country);
      results.set(tmdbId, availability);
      
      // Opcjonalne: dodaj opóźnienie między zapytaniami do API
      // await new Promise(resolve => setTimeout(resolve, 100));
    }

    return results;
  }
}
```

## 5. Integracja w Astro (`src/pages/api/`)

Stwórz endpoint API w Astro, który będzie wywoływany przez frontend. To ukrywa klucze API przed klientem.

### A. Endpoint wyszukiwania reżysera (`src/pages/api/search-director.ts`)

```typescript
import type { APIRoute } from 'astro';
import { TmdbClient } from '../../lib/services/tmdb';
import { VodService } from '../../lib/services/vod';

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const query = url.searchParams.get('q');
  const country = url.searchParams.get('country') || 'pl';
  
  if (!query) {
    return new Response(JSON.stringify({ error: 'Missing query parameter' }), { 
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const tmdb = new TmdbClient();
    const vod = new VodService();

    // 1. Szukaj twórcy
    const creators = await tmdb.searchPerson(query);
    if (!creators.length) {
      return new Response(JSON.stringify({ director: null, movies: [] }), { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const director = creators[0]; // Bierzemy pierwszego trafionego

    // 2. Pobierz jego filmy
    const movies = await tmdb.getDirectorCredits(director.id);
    const topMovies = movies.slice(0, 20); // Top 20 filmów

    // 3. Sprawdź VOD dla top 5 filmów (oszczędzanie API quota)
    // Reszta będzie pobierana "on-demand" przez osobny endpoint
    const top5Ids = topMovies.slice(0, 5).map(m => m.id);
    const vodData = await vod.getAvailabilityBatch(top5Ids, country);

    // 4. Połącz dane
    const moviesWithVod = topMovies.map(movie => ({
      ...movie,
      streamingAvailability: vodData.get(movie.id) || []
    }));

    return new Response(JSON.stringify({
      director,
      movies: moviesWithVod
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[API] Error in search-director:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
```

### B. Endpoint pobierania dostępności dla pojedynczego filmu (`src/pages/api/vod-availability.ts`)

Ten endpoint będzie używany do "lazy loading" dostępności dla filmów poza top 5.

```typescript
import type { APIRoute } from 'astro';
import { VodService } from '../../lib/services/vod';

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const tmdbId = url.searchParams.get('tmdbId');
  const country = url.searchParams.get('country') || 'pl';
  
  if (!tmdbId) {
    return new Response(JSON.stringify({ error: 'Missing tmdbId parameter' }), { 
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const vod = new VodService();
    const availability = await vod.getAvailability(parseInt(tmdbId), country);

    return new Response(JSON.stringify({
      tmdbId: parseInt(tmdbId),
      country,
      platforms: availability
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[API] Error in vod-availability:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
```

## 6. Obsługa Błędów i Bezpieczeństwo

1. **Rate Limiting (Failover)**:
   * W `VodService` obsłużono kod `429`. W takim przypadku usługa zwraca pustą tablicę dostępności zamiast rzucać błędem. Użytkownik zobaczy film, ale bez ikon platform.
   * Nie zapisujemy do cache przy błędzie 429, żeby móc spróbować ponownie później.

2. **Oszczędzanie Limitu**:
   * **Lazy Loading**: Endpoint `/api/search-director` pobiera VOD tylko dla top 5 filmów. Reszta jest pobierana przez `/api/vod-availability` na żądanie użytkownika.
   * **Batch Processing**: Metoda `getAvailabilityBatch` optymalizuje zapytania do bazy, pobierając wiele wpisów cache naraz.
   * **Cache Duration**: Czas życia cache to 24h. Można rozważyć wydłużenie do 48-72h dla dalszej oszczędności.

3. **Bezpieczeństwo**:
   * Wszystkie klucze API są po stronie serwera (Astro API routes).
   * Używamy `SUPABASE_SERVICE_KEY` dla operacji zapisu do cache.
   * RLS policies w bazie są już skonfigurowane (migracja).

4. **Error Handling**:
   * Wszystkie endpointy zwracają strukturalne błędy JSON.
   * Błędy są logowane do konsoli serwera.
   * Aplikacja nie crashuje przy błędach API - zwraca puste tablice.

## 7. Plan Wdrożenia Krok po Kroku

### Faza 1: Konfiguracja (DONE ✓)

* [x] **Supabase**: Tabela `vod_availability_cache` utworzona (migracja `20260118120000`)

* [ ] **Environment**: Dodaj klucze API MOTN i TMDb do `.env` oraz do panelu hostingu (Vercel/DigitalOcean)

### Faza 2: Backend Services

* [ ] **Typy**: Dodaj interfejsy do `src/types.ts`

* [ ] **TMDb Client**: Utwórz `src/lib/services/tmdb.ts`
* [ ] **VOD Service**: Utwórz `src/lib/services/vod.ts`

### Faza 3: API Endpoints

* [ ] **Search Endpoint**: Utwórz `src/pages/api/search-director.ts`

* [ ] **VOD Endpoint**: Utwórz `src/pages/api/vod-availability.ts`

### Faza 4: Frontend (poza zakresem tego dokumentu)

* [ ] **Search Component**: Komponent wyszukiwarki reżyserów

* [ ] **Movie List**: Komponent listy filmów z ikonami VOD
* [ ] **Lazy Loading**: Implementacja pobierania dostępności "on-demand"

### Faza 5: Testy i Monitoring

* [ ] **Testy Lokalne**: Sprawdź działanie endpointów lokalnie

* [ ] **Cache Verification**: Zweryfikuj w Supabase Dashboard, czy cache się zapełnia
* [ ] **API Quota**: Monitoruj zużycie limitu w RapidAPI Dashboard
* [ ] **Error Handling**: Przetestuj scenariusze błędów (404, 429, timeout)

## 8. Możliwe Rozszerzenia (Przyszłość)

1. **Seriale**: Dodaj obsługę seriali TV (obecnie tylko filmy)
2. **Więcej Krajów**: Rozszerz poza Polskę (wymaga testów z MOTN API)
3. **Cache Cleanup**: Automatyczne usuwanie starych wpisów (>30 dni)
4. **Admin Dashboard**: Panel do monitorowania cache i API usage
5. **Webhooks**: Automatyczne odświeżanie cache dla popularnych filmów
6. **User Preferences**: Personalizacja platform VOD według subskrypcji użytkownika

---

**Uwaga**: Ten plan zakłada, że migracja bazy danych została już wykonana. Kolejnym krokiem jest implementacja serwisów backendowych i endpointów API.
