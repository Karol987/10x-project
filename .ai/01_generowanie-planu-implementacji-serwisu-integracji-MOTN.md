# Generowanie planu implementacji integracji z serwisem Movie of the Night

Jesteś doświadczonym architektem oprogramowania, którego zadaniem jest stworzenie planu wdrożenia usługi integracji z API VOD (Movie of the Night oraz TMDb) dla aplikacji Streamly. Usługa ta będzie współdziałać z zewnętrznymi interfejsami API w celu wyszukiwania twórców, pobierania ich filmografii i sprawdzania dostępności na platformach streamingowych. Twoim celem jest stworzenie kompleksowego i przejrzystego planu wdrożenia, który developer może wykorzystać do prawidłowego i sprawnego wdrożenia usługi.

Najpierw przejrzyj dostarczony stack technologiczny i zasady implementacji:

<tech_stack>
{{tech-stack}}
</tech_stack>

<service_rules>
{{service-rules}}
</service_rules>

Teraz przeanalizuj dostarczone informacje (PRD, Koncepcja MVP, Dokumentacja API) i rozbij szczegóły implementacji. Użyj znaczników <implementation_breakdown> wewnątrz bloku myślenia, aby pokazać swój proces myślowy. Rozważ następujące kwestie:

1. Wymień każdy kluczowy komponent usługi integracji i jego cel, numerując je. Zwróć uwagę na hybrydową architekturę (TMDb do danych o twórcach, Movie of the Night do dostępności VOD).
2. Dla każdego komponentu:
   a. Szczegółowo opisz jego funkcjonalność.
   b. Wymień potencjalne wyzwania związane z wdrożeniem (w szczególności restrykcyjne limity API Movie of the Night - 100 req/day), numerując je.
   c. Zaproponuj niezależne od technologii rozwiązania tych wyzwań, numerując je tak, aby odpowiadały wyzwaniom (np. strategie cache'owania).
3. Wyraźne rozważenie sposobu włączenia każdego z poniższych elementów, wymieniając potencjalne metody lub podejścia w celu spełnienia oczekiwań API:
   - Uwierzytelnianie (Headers dla RapidAPI, Bearer Token dla TMDb)
   - Wyszukiwanie twórców (endpointy TMDb /search/person)
   - Pobieranie filmografii i filtrowanie (TMDb /person/{id}/movie_credits -> IMDb ID)
   - Sprawdzanie dostępności VOD (endpointy MOTN /shows/{id} lub /search/filters)
   - Mapowanie platform (slugi wewnętrzne na ID serwisów API)
   - Struktury danych (DTO) i mapowanie odpowiedzi API na format aplikacji
   
   Podaj konkretne przykłady dla każdego elementu, numerując je. Upewnij się, że przykłady te są jasne i pokazują, w jaki sposób należy je zaimplementować w usłudze.

4. Zajmij się obsługą błędów dla całej usługi, wymieniając potencjalne scenariusze błędów (rate limits, timeouts, braki danych) i numerując je.

Na podstawie przeprowadzonej analizy utwórz kompleksowy przewodnik implementacji. Przewodnik powinien być napisany w formacie Markdown i mieć następującą strukturę:

1. Opis usługi i architektury hybrydowej
2. Konfiguracja i zmienne środowiskowe
3. Definicje Typów i DTO
4. Publiczne metody i pola
5. Prywatne metody i pola (w tym logika cache i klient HTTP)
6. Strategia Cache'owania (krytyczne dla MVP)
7. Obsługa błędów i limity API
8. Plan wdrożenia krok po kroku

Upewnij się, że plan wdrożenia:

1. Jest dostosowany do określonego stacku technologicznego (Astro, TypeScript, Fetch API).
2. Obejmuje wszystkie istotne komponenty integracji (TMDb + MOTN).
3. Obejmuje obsługę błędów i najlepsze praktyki bezpieczeństwa.
4. Zawiera jasne instrukcje dotyczące wdrażania kluczowych metod i funkcji, ze szczególnym uwzględnieniem mechanizmów oszczędzania zapytań (cache).
5. Wyjaśnia, jak skonfigurować mapowanie danych między API a domeną aplikacji.

Używa odpowiedniego formatowania Markdown dla lepszej czytelności. Końcowy wynik powinien składać się wyłącznie z przewodnika implementacji w formacie Markdown i nie powinien powielać ani powtarzać żadnej pracy wykonanej w sekcji podziału implementacji.

Zapisz przewodnik implementacji w .ai/vod-service-implementation-plan.md
