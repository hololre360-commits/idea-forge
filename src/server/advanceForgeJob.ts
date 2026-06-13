import { createServerFn } from '@tanstack/start';
import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { supabase, createSupabaseAdmin } from '@/lib/supabase';
import { parseAIResponse, createSystemPrompt } from './reportParser';
import type { ReportJob, Report, ValidationMode } from '@/types';

const TIMEOUT_MS = 14000; // 14 seconds per AI call
const MAX_TOKENS = 1200;

interface AdvanceResult {
  job: ReportJob;
  completed: boolean;
}

const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY || process.env.DEEPSEEK_API_KEY,
  baseURL: process.env.DEEPSEEK_API_KEY ? 'https://api.deepseek.com/v1' : undefined,
});

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY!,
});

function getModelForStep(step: number, mode: ValidationMode) {
  if (mode === 'quick') {
    return openai('deepseek-chat');
  }
  switch (step) {
    case 0: return openai('deepseek-chat');
    case 1: return google('gemini-1.5-flash-latest');
    case 2: return openai('deepseek-chat');
    case 3: return google('gemini-1.5-pro-latest');
    case 4:
    default: return openai('deepseek-chat');
  }
}

async function callLLMWithTimeout(model: any, prompt: string, system: string): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const { text } = await generateText({
      model,
      system,
      prompt,
      maxTokens: MAX_TOKENS,
      temperature: 0.3,
      abortSignal: controller.signal,
    });
    return text;
  } finally {
    clearTimeout(timeout);
  }
}

export const advanceForgeJob = createServerFn({ method: 'POST' })
  .validator((jobId: string) => jobId)
  .handler(async ({ data: jobId }): Promise<AdvanceResult> => {
    const supabaseAdmin = createSupabaseAdmin();
    const { data: job, error } = await supabaseAdmin
      .from('report_jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (error || !job) throw new Error('Job not found');
    if (job.status === 'completed' || job.status === 'failed') {
      return { job: job as ReportJob, completed: true };
    }

    const currentStep = job.current_step || 0;
    const mode = job.mode as ValidationMode;
    const idea = job.idea_text;

    await supabaseAdmin.from('report_jobs').update({ status: 'processing', updated_at: new Date().toISOString() }).eq('id', jobId);

    try {
      const model = getModelForStep(currentStep, mode);
      const systemPrompt = createSystemPrompt(mode, idea);
      let userPrompt = `Current step: ${currentStep + 1}. Provide your analysis for this step.`;
      if (mode === 'forge' && job.partial_result && Object.keys(job.partial_result).length > 0) {
        userPrompt += `\n\nPrevious analysis insights:\n${JSON.stringify(job.partial_result, null, 2).slice(0, 1500)}`;
      }

      const rawResponse = await callLLMWithTimeout(model, userPrompt, systemPrompt);
      const parsedReport = parseAIResponse(rawResponse);

      let newPartial = { ...(job.partial_result as any) };
      let newResult: Report | null = null;
      let newStatus: 'processing' | 'completed' = 'processing';
      let newStep = currentStep + 1;
      const totalSteps = mode === 'forge' ? 5 : 1;

      if (mode === 'quick' || currentStep >= totalSteps - 1) {
        if (mode === 'forge' && parsedReport) {
          const prevScore = (newPartial as any).score || 50;
          newResult = {
            ...parsedReport,
            score: Math.round((prevScore + parsedReport.score) / 2),
            pros: [...new Set([...((newPartial as any).pros || []), ...parsedReport.pros])].slice(0, 7),
            cons: [...new Set([...((newPartial as any).cons || []), ...parsedReport.cons])].slice(0, 7),
            risks: [...new Set([...((newPartial as any).risks || []), ...parsedReport.risks])].slice(0, 6),
            nextSteps: [...new Set([...((newPartial as any).nextSteps || []), ...parsedReport.nextSteps])].slice(0, 6),
          };
        } else {
          newResult = parsedReport || { summary: rawResponse.slice(0, 400) + '...', score: 55, pros: ['Innovative approach'], cons: ['Needs more validation'], targetAudience: 'Early adopters', monetization: 'Subscription model', risks: ['Market competition'], nextSteps: ['Build MVP', 'Talk to 10 potential customers'] };
        }
        newStatus = 'completed';
      } else {
        newPartial[`step_${currentStep}`] = { raw: rawResponse.slice(0, 800), parsed: parsedReport, model: model.toString?.() || 'llm' };
        if (parsedReport) {
          newPartial.score = parsedReport.score;
          newPartial.pros = parsedReport.pros;
          newPartial.cons = parsedReport.cons;
        }
      }

      const updateData: any = { current_step: newStep, total_steps: totalSteps, partial_result: newPartial, status: newStatus, updated_at: new Date().toISOString() };
      if (newResult) updateData.result = newResult;
      if (newStatus === 'completed') updateData.error_message = null;

      const { data: updatedJob } = await supabaseAdmin.from('report_jobs').update(updateData).eq('id', jobId).select().single();
      return { job: updatedJob as ReportJob, completed: newStatus === 'completed' };
    } catch (err: any) {
      console.error('Forge step error:', err);
      const isTimeout = err.name === 'AbortError' || err.message?.includes('timeout');
      await supabaseAdmin.from('report_jobs').update({ status: 'failed', error_message: isTimeout ? 'AI analysis timed out (14s limit per step)' : (err.message || 'Unknown error during AI processing'), updated_at: new Date().toISOString() }).eq('id', jobId);
      throw err;
    }
  });