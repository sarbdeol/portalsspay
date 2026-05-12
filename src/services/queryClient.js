import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      refetchOnWindowFocus: false,
    },
  },
});

// Wipe every cached query result. Call on login / logout / 401 so a
// new session never sees the previous user's cached data.
export const resetQueryCache = () => {
  queryClient.cancelQueries();
  queryClient.clear();
};
