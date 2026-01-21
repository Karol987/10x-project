import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';

/**
 * MSW Worker for browser environment (used in E2E tests)
 * To use in Playwright tests, you can initialize this in your test setup
 */
export const worker = setupWorker(...handlers);
