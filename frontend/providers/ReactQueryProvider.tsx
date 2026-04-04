"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, ReactNode } from "react";

export function ReactQueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Global cache time (5 minutes)
            staleTime: 1000 * 60 * 5,
            // Retry failed requests 3 times
            retry: 3,
            // Don't refetch on window focus by default
            refetchOnWindowFocus: false,
            // Refetch when component mounts
            refetchOnMount: true,
          },
          mutations: {
            // Retry failed mutations 2 times
            retry: 2,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
