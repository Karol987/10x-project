import { http, HttpResponse } from 'msw';

/**
 * MSW Handlers for mocking API requests during tests
 * Add your API mocking handlers here
 */
export const handlers = [
  // Example: Mock MOTN API
  // http.get('https://api.movieofthenight.com/*', () => {
  //   return HttpResponse.json({ data: 'mocked response' });
  // }),
];
