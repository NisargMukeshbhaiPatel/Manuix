import { QueryClient, QueryCache, isServer } from "@tanstack/react-query";

function createQueryClient() {
  return new QueryClient({
    queryCache: new QueryCache({
      onError: (error) => {
        throw error;
      },
    }),
    defaultOptions: {
      queries: {
        staleTime: 2 * 60 * 1000,
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        retry: 3,
      },
    },
  });
}

let browserQueryClient;

export default function getQueryClient() {
  switch (isServer) {
    case true:
      return createQueryClient();
      break;
    default:
      if (!browserQueryClient) {
        browserQueryClient = createQueryClient();
      }
      return browserQueryClient;
      break;
  }
}
