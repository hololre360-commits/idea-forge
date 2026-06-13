export type AppRole = 'admin' | 'user';

export type JobStatus = 'queued' | 'processing' | 'completed' | 'failed';

export type ValidationMode = 'quick' | 'forge';

export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: number;
  user_id: string;
  role: AppRole;
  created_at: string;
}

export interface ReportJob {
  id: string;
  user_id: string;
  idea_text: string;
  mode: ValidationMode;
  status: JobStatus;
  current_step: number;
  total_steps: number;
  partial_result: Record<string, any>;
  result: Report | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export interface Report {
  summary: string;
  score: number;
  pros: string[];
  cons: string[];
  targetAudience: string;
  monetization: string;
  risks: string[];
  nextSteps: string[];
}

export interface Subscription {
  id: string;
  user_id: string;
  paddle_subscription_id: string | null;
  status: string;
  plan_id: string | null;
  current_period_end: string | null;
  created_at: string;
  updated_at: string;
}

export interface ForgeStep {
  step: number;
  name: string;
  description: string;
}