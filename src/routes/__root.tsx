import { createRootRoute, Outlet } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/router-devtools';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { Navbar } from '@/components/Navbar';
import '@/styles.css';
import '@/i18n/config';

const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: 1000 * 60, retry: 1 } } });

export const Route = createRootRoute({ component: RootComponent });

function RootComponent() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-background text-foreground">
        <Navbar />
        <Outlet />
        <Toaster />
      </div>
      {import.meta.env.DEV && <TanStackRouterDevtools />}
    </QueryClientProvider>
  );
}