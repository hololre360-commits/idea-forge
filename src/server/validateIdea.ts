import { createServerFn } from '@tanstack/start';
import { supabase, createSupabaseAdmin } from '@/lib/supabase';
import { advanceForgeJob } from './advanceForgeJob';
import type { ValidationMode, ReportJob } from '@/types';
import { z } from 'zod';

const validateSchema = z.object({
  idea: z.string().min(20, "Idea description must be at least 20 characters"),
  mode: z.enum(['quick', 'forge']),
  userId: z.string().uuid(),
});

export const validateIdea = createServerFn({ method: 'POST' })
  .validator((input: { idea: string; mode: ValidationMode; userId: string }) => validateSchema.parse(input))
  .handler(async ({ data }) => {
    const supabaseAdmin = createSupabaseAdmin();
    const { idea, mode, userId } = data;

    if (mode === 'forge') {
      const { data: sub } = await supabaseAdmin.from('subscriptions').select('status, current_period_end').eq('user_id', userId).eq('status', 'active').maybeSingle();
      const hasActive = sub && (!sub.current_period_end || new Date(sub.current_period_end) > new Date());
      if (!hasActive) throw new Error('Forge mode requires an active Pro subscription');
    }

    const { data: newJob, error } = await supabaseAdmin.from('report_jobs').insert({ user_id: userId, idea_text: idea, mode, status: 'queued', current_step: 0, total_steps: mode === 'forge' ? 5 : 1, partial_result: {} }).select().single();
    if (error || !newJob) throw new Error('Failed to create validation job: ' + (error?.message || 'Unknown'));

    const job = newJob as ReportJob;

    if (mode === 'quick') {
      try {
        const result = await advanceForgeJob(job.id);
        return { jobId: job.id, immediateResult: result.job.result };
      } catch (err: any) {
        return { jobId: job.id, error: err.message };
      }
    }
    return { jobId: job.id };
  });