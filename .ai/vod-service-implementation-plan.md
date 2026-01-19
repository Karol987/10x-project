# Plan Implementacji Usługi Integracji VOD (TMDb + MOTN)

Ten dokument zawiera szczegółowy plan techniczny wdrożenia serwisu integrującego dane o filmach (TMDb) z informacjami o dostępności na platformach streamingowych (Movie of the Night via RapidAPI) dla aplikacji Streamly.

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
```

## 3. Baza Danych (Supabase) - Strategia Cache

Należy utworzyć tabelę w Supabase do przechowywania wyników zapytań. Pozwoli to na to, że jeśli Użytkownik A sprawdzi dostępność "Incepcji", Użytkownik B otrzyma te dane z bazy bez zużywania limitu API.

### Schema SQL

Uruchom ten skrypt w SQL Editor w dashboardzie Supabase:

```sql
create table public.vod_availability_cache (
  tmdb_id integer not null,
  country_code text not null,
  availability_data jsonb not null, -- surowa odpowiedź lub zmapowane platformy
  last_updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (tmdb_id, country_code)
);

-- Indeks dla szybkiego wyszukiwania
create index vod_availability_cache_lookup_idx on public.vod_availability_cache (tmdb_id, country_code);

-- Polityki RLS (Row Level Security)
alter table public.vod_availability_cache enable row level security;

-- Odczyt publiczny (lub tylko dla uwierzytelnionych)
create policy "Allow read access for all users"
on public.vod_availability_cache for select
using (true);

-- Zapis tylko przez service_role (backend) - w Astro użyjemy klucza service role lub funkcji RPC, 
-- ale dla uproszczenia w MVP można pozwolić na insert uwierzytelnionym użytkownikom, 
-- jeśli logika jest w API Route. Bezpieczniej: tylko backend.
```

## 4. Definicje Typów i DTO (`src/types.ts`)

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
```

## 5. Implementacja Klientów API (`src/lib/services/`)

Utwórz katalog `src/lib/services` i zaimplementuj poszczególne serwisy.

### A. TMDb Client (`src/lib/services/tmdb.ts`)

```typescript
import { TMDB_API_KEY, TMDB_API_URL } from 'astro:env/server'; // Lub process.env
import type { Creator, Movie } from '../../types';

export class TmdbClient {
  private async fetch(endpoint: string, params: Record<string, string> = {}) {
    const searchParams = new URLSearchParams({
      api_key: TMDB_API_KEY,
      language: 'pl-PL',
      ...params,
    });
    
    const res = await fetch(`${TMDB_API_URL}${endpoint}?${searchParams}`);
    if (!res.ok) throw new Error(`TMDb Error: ${res.statusText}`);
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
      .sort((a: any, b: any) => b.vote_count - a.vote_count); 

    return directorWorks.map((m: any) => ({
      id: m.id,
      title: m.title,
      posterPath: m.poster_path,
      releaseDate: m.release_date,
      voteAverage: m.vote_average
    }));
  }
}
```

### B. MOTN Client z Cache (`src/lib/services/vod.ts`)

To jest najważniejszy komponent. Obsługuje logikę "Sprawdź DB -> Jak nie ma, Sprawdź API".

```typescript
import { createClient } from '@supabase/supabase-js';
import type { StreamingPlatform } from '../../types';

// Inicjalizacja Supabase (użyj zmiennych serwerowych)
const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);

const MOTN_HEADERS = {
  'X-RapidAPI-Key': process.env.MOTN_API_KEY!,
  'X-RapidAPI-Host': process.env.MOTN_API_HOST!,
};

export class VodService {
  /**
   * Sprawdza dostępność dla pojedynczego filmu.
   * Najpierw cache, potem API.
   */
  async getAvailability(tmdbId: number, country = 'pl'): Promise<StreamingPlatform[]> {
    // 1. Sprawdź Cache w Supabase
    const { data: cached } = await supabase
      .from('vod_availability_cache')
      .select('availability_data, last_updated_at')
      .eq('tmdb_id', tmdbId)
      .eq('country_code', country)
      .single();

    const ONE_DAY = 24 * 60 * 60 * 1000;
    const isFresh = cached && (new Date().getTime() - new Date(cached.last_updated_at).getTime() < ONE_DAY);

    if (isFresh) {
      console.log(`[Cache HIT] TMDb ID: ${tmdbId}`);
      return cached.availability_data as StreamingPlatform[];
    }

    // 2. Jeśli brak w Cache lub przestarzałe -> Zapytaj API
    console.log(`[Cache MISS] Fetching MOTN for TMDb ID: ${tmdbId}`);
    try {
      // MOTN endpoint: /shows/{id} gdzie id może być TMDb ID
      const response = await fetch(`${process.env.MOTN_API_URL}/shows/${tmdbId}?country=${country}&output_language=pl`, {
        headers: MOTN_HEADERS
      });

      if (response.status === 429) {
        console.error('MOTN Rate Limit Exceeded');
        return []; // Fail gracefully
      }
      
      if (!response.ok) {
        // Jeśli 404 - film nieznany w MOTN, zapisz pustą tablicę do cache, żeby nie pytać ponownie
        if (response.status === 404) {
             await this.saveToCache(tmdbId, country, []);
        }
        return [];
      }

      const data = await response.json();
      const platforms = this.mapMotnResponse(data, country);

      // 3. Zapisz do Cache
      await this.saveToCache(tmdbId, country, platforms);

      return platforms;

    } catch (error) {
      console.error('Error fetching VOD data:', error);
      return [];
    }
  }

  private mapMotnResponse(data: any, country: string): StreamingPlatform[] {
    const streamingInfo = data.result?.streamingInfo?.[country] || {};
    const platforms: StreamingPlatform[] = [];

    // Mapowanie serwisów (Netflix, HBO, Disney, Prime)
    for (const [serviceId, options] of Object.entries(streamingInfo)) {
       const typedOptions = options as any[]; // Array of { type: 'subscription', ... }
       
       // Interesuje nas głównie subskrypcja w MVP
       const subOption = typedOptions.find(o => o.type === 'subscription');
       
       if (subOption) {
         platforms.push({
           serviceId: serviceId,
           name: this.formatServiceName(serviceId),
           link: subOption.link,
           type: 'subscription'
         });
       }
    }
    return platforms;
  }

  private formatServiceName(id: string): string {
    const names: Record<string, string> = {
      'netflix': 'Netflix',
      'hbo': 'HBO Max',
      'disney': 'Disney+',
      'prime': 'Prime Video',
      'apple': 'Apple TV+'
    };
    return names[id] || id;
  }

  private async saveToCache(tmdbId: number, country: string, data: StreamingPlatform[]) {
    await supabase.from('vod_availability_cache').upsert({
      tmdb_id: tmdbId,
      country_code: country,
      availability_data: data,
      last_updated_at: new Date().toISOString()
    });
  }
}
```

## 6. Integracja w Astro (`src/pages/api/`)

Stwórz endpoint API w Astro, który będzie wywoływany przez frontend. To ukrywa klucze API przed klientem.

**Plik: `src/pages/api/search-director.ts`**
(Przykład endpointu łączącego wszystko - w praktyce można to rozbić)

```typescript
import type { APIRoute } from 'astro';
import { TmdbClient } from '../../lib/services/tmdb';
import { VodService } from '../../lib/services/vod';

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const query = url.searchParams.get('q');
  
  if (!query) return new Response('Missing query', { status: 400 });

  const tmdb = new TmdbClient();
  const vod = new VodService();

  // 1. Szukaj twórcy
  const creators = await tmdb.searchPerson(query);
  if (!creators.length) return new Response(JSON.stringify([]), { status: 200 });

  const director = creators[0]; // Bierzemy pierwszego trafionego dla uproszczenia MVP

  // 2. Pobierz jego filmy
  const movies = await tmdb.getDirectorCredits(director.id);
  const topMovies = movies.slice(0, 10); // Limitujemy do top 10, żeby oszczędzać API

  // 3. Sprawdź VOD dla filmów (Równolegle!)
  // UWAGA: Przy limicie 100/dzień, to jest ryzykowne dla nowego użytkownika.
  // Strategia MVP: Pobierz VOD tylko dla top 3 filmów automatycznie, reszta "na żądanie" UI.
  
  const moviesWithVod = await Promise.all(
    topMovies.map(async (movie) => {
      // Dla MVP sprawdzamy VOD od razu dla top listy
      const availability = await vod.getAvailability(movie.id);
      return { ...movie, streamingAvailability: availability };
    })
  );

  return new Response(JSON.stringify({
    director,
    movies: moviesWithVod
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
};
```

## 7. Obsługa Błędów i Bezpieczeństwo

1. **Rate Limiting (Failover)**:
    * W `VodService` obsłużono kod `429`. W takim przypadku usługa zwraca pustą tablicę dostępności zamiast rzucać błędem. Użytkownik zobaczy film, ale bez ikon platform.
2. **Oszczędzanie Limitu**:
    * **Lazy Loading**: W UI nie ładuj dostępności dla wszystkich 50 filmów reżysera. Załaduj listę tytułów, a dostępność pobieraj w paczkach (np. top 5) lub po kliknięciu "Pokaż gdzie obejrzeć".
    * **Cache Duration**: Ustaw czas życia cache na minimum 24h, a najlepiej 48h-72h. Dostępność filmów nie zmienia się tak dynamicznie.
3. **Mapowanie**:
    * Upewnij się, że mapujesz `serviceId` na nazwy wyświetlane (np. `net` -> `Netflix` w zależności od tego co zwraca MOTN).

## 8. Plan Wdrożenia Krok po Kroku

1. [ ] **Supabase**: Utwórz tabelę `vod_availability_cache` w bazie danych.
2. [ ] **Environment**: Dodaj klucze API MOTN i TMDb do `.env` oraz do panelu hostingu (Vercel/DigitalOcean).
3. [ ] **Backend Services**:
    * Utwórz `src/lib/services/tmdb.ts` (logika TMDb).
    * Utwórz `src/lib/services/vod.ts` (logika MOTN + Cache).
4. [ ] **API Endpoint**: Stwórz endpoint `/api/search` w Astro, który orkiestruje zapytania.
5. [ ] **Frontend**:
    * Stwórz komponent wyszukiwarki.
    * Stwórz komponent listy filmów z ikonami VOD.
    * Podepnij pobieranie danych z endpointu API.
6. [ ] **Testy**: Uruchom aplikację lokalnie i sprawdź w Supabase, czy tabela cache się zapełnia po wyszukiwaniach. Zweryfikuj w dashboardzie RapidAPI zużycie limitu.

To podejście zapewnia działającą aplikację MVP nawet przy bardzo małym limicie API, przesuwając ciężar zapytań na bazę danych po pierwszym "odkryciu" dostępności danego filmu.
