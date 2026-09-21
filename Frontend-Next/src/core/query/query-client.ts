import { QueryClient } from '@tanstack/react-query';
import { AppError } from '../api/api-error';

const NON_RETRYABLE = new Set([
  'unauthorized',
  'forbidden',
  'not-found',
  'validation',
  'business',
  'conflict',
]);

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        refetchOnWindowFocus: true,
        retry: (failureCount, error) =>
          !(error instanceof AppError && NON_RETRYABLE.has(error.kind)) && failureCount < 2,
      },
      mutations: { retry: false },
    },
  });
}
