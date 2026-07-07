import { QueryClient } from '@tanstack/react-query';

/**
 * App-wide React Query defaults tuned for low-bandwidth (3G/4G Lusaka).
 * - retry 2 with exponential backoff so a single dropped packet doesn't fail a screen
 * - staleTime 30s so quick tab switches don't refetch on the way back
 * - refetchOnWindowFocus off — most admins keep the tab open all day
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      retryDelay: attempt => Math.min(1000 * 2 ** attempt, 8000),
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
});
