import { createServerFn } from '@tanstack/start';
import { supabase, createSupabaseAdmin } from '@/lib/supabase';
import { advanceForgeJob } from './advanceForgeJob';
import type { ReportJob } from '@/types';

export const pollReportJob = createServerFn({ method: 'POST' })
  .validator((jobId: string) => jobId)
  .handler(async ({ data: jobId }): Promise<{ job: ReportJob; shouldContinuePolling: boolean }> => {
    const supabaseAdmin = createSupabaseAdmin();
    const { data: currentJob } = await supabaseAdmin.from('report_jobs').select('*').eq('id', jobId).single();
    if (!currentJob) throw new Error('Job not found');
    if (currentJob.status === 'completed' || currentJob.status === 'failed') {
      return { job: currentJob as ReportJob, shouldContinuePolling: false };
    }
    try {
      const { job: advancedJob, completed } = await advanceForgeJob(jobId);
      return { job: advancedJob, shouldContinuePolling: !completed && advancedJob.status !== 'failed' };
    } catch (err) {
      const { data: failedJob } = await supabaseAdmin.from('report_jobs').select('*').eq('id', jobId).single();
      return { job: (failedJob || currentJob) as ReportJob, shouldContinuePolling: false };
    }
  });