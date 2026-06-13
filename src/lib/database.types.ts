export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string | null;
          full_name: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      user_roles: {
        Row: {
          id: number;
          user_id: string;
          role: 'admin' | 'user';
          created_at: string;
        };
        Insert: {
          user_id: string;
          role?: 'admin' | 'user';
          created_at?: string;
        };
        Update: {
          user_id?: string;
          role?: 'admin' | 'user';
          created_at?: string;
        };
      };
      report_jobs: {
        Row: {
          id: string;
          user_id: string;
          idea_text: string;
          mode: 'quick' | 'forge';
          status: 'queued' | 'processing' | 'completed' | 'failed';
          current_step: number;
          total_steps: number;
          partial_result: Json;
          result: Json | null;
          error_message: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          idea_text: string;
          mode: 'quick' | 'forge';
          status?: 'queued' | 'processing' | 'completed' | 'failed';
          current_step?: number;
          total_steps?: number;
          partial_result?: Json;
          result?: Json | null;
          error_message?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          idea_text?: string;
          mode?: 'quick' | 'forge';
          status?: 'queued' | 'processing' | 'completed' | 'failed';
          current_step?: number;
          total_steps?: number;
          partial_result?: Json;
          result?: Json | null;
          error_message?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          paddle_subscription_id: string | null;
          status: string;
          plan_id: string | null;
          current_period_end: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          paddle_subscription_id?: string | null;
          status: string;
          plan_id?: string | null;
          current_period_end?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          paddle_subscription_id?: string | null;
          status?: string;
          plan_id?: string | null;
          current_period_end?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Functions: {
      has_role: {
        Args: { user_id: string; role: 'admin' | 'user' };
        Returns: boolean;
      };
      has_active_subscription: {
        Args: { user_id: string };
        Returns: boolean;
      };
    };
  };
}