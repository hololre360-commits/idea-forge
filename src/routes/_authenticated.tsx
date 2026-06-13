import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import { supabase } from '@/lib/supabase';

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw redirect({ to: '/login' });
    return { session };
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  return <div className="min-h-[calc(100vh-4rem)]"><Outlet /></div>;
}