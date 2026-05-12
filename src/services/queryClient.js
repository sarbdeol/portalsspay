import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Short stale window so admin-side changes (e.g. assigning a bank to a
      // merchant) show up quickly when the merchant tabs back or remounts.
      staleTime: 15_000,
      refetchOnWindowFocus: true,
      refetchOnMount: 'always',
    },
  },
});

// Wipe every cached query result. Call on login / logout / 401 so a
// new session never sees the previous user's cached data.
export const resetQueryCache = () => {
  queryClient.cancelQueries();
  queryClient.clear();
};
