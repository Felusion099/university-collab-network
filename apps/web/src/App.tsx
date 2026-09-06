import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "react-router-dom";
import { useState } from "react";
import { router } from "@/routes";
import { useRestoreSession } from "@/hooks/useAuth";

function SessionBoot(): JSX.Element {
  useRestoreSession();
  return <RouterProvider router={router} />;
}

export default function App(): JSX.Element {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { retry: 1, refetchOnWindowFocus: false },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <SessionBoot />
    </QueryClientProvider>
  );
}
