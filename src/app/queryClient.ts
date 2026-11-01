import { QueryClient } from '@tanstack/react-query';
import { isApiError } from '@/api/errors';

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        refetchOnWindowFocus: false,
        // Do not retry client errors (4xx); they will not succeed on retry.
        retry: (count, error) =>
          !(isApiError(error) && error.status >= 400 && error.status < 500) && count < 2,
      },
      mutations: { retry: false },
    },
  });
}
