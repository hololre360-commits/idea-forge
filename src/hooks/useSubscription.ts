import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { createServerFn } from '@tanstack/start';

interface SubscriptionStatus {
  hasActiveSubscription: boolean;
  plan: string | null;
}

export const checkSubscriptionServerFn = createServerFn({ method: 'GET' })
  .validator((userId: string) => userId)
  .handler(async ({ data: userId }) => {
    // In real implementation, call has_active_subscription via service role or direct query
    const { data, error } = await supabase
      .from('subscriptions')
      .select('status, plan_id, current_period_end')
      .eq('user_id', userId)
      .eq('status', 'active')
      .maybeSingle();

    if (error) {
      console.error('Subscription check error:', error);
      return { hasActiveSubscription: false, plan: null };
    }

    const isActive = !!data && 
      (!data.current_period_end || new Date(data.current_period_end) > new Date());

    return {
      hasActiveSubscription: isActive,
      plan: data?.plan_id || null,
    } as SubscriptionStatus;
  });

export function useSubscription(userId?: string) {
  return useQuery({
    queryKey: ['subscription', userId],
    queryFn: async () => {
      if (!userId) return { hasActiveSubscription: false, plan: null };
      // For client, we can call the server function or direct RLS query
      // Here we use direct for demo; in prod prefer serverFn with service role for security
      const { data } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .maybeSingle();
      
      const isActive = !!data && 
        (!data.current_period_end || new Date(data.current_period_end) > new Date());
      
      return { hasActiveSubscription: isActive, plan: data?.plan_id || null };
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 2,
  });
}