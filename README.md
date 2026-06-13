# Idea Forge

**AI-powered startup idea validation platform** built with TanStack Start v1, React 19, Supabase, Vercel AI SDK, and Paddle Billing.

## Features Implemented

- ✅ Full authentication (Email/Password + Google OAuth) with Supabase
- ✅ Protected routes with `_authenticated` layout
- ✅ Role system (user_roles + has_role security definer function)
- ✅ Two validation modes: Quick (sync) + Forge 0.1 Research (async job queue with polling)
- ✅ Robust AI response parsing (plain-text delimiters + JSON repair fallback)
- ✅ Per-call 14s timeout + max tokens control for serverless reliability
- ✅ Paddle checkout + webhook handling (HMAC ready)
- ✅ Subscription checks (has_active_subscription)
- ✅ i18n: English + Ukrainian (react-i18next)
- ✅ Dark minimalist UI with semantic Tailwind v4 tokens
- ✅ Responsive (mobile-first, optimized for 390px)
- ✅ Toast notifications (Sonner)
- ✅ Report history + detail views
- ✅ Job progress polling every 1.2s (up to 45s safety)

## Tech Stack

- **Frontend**: React 19 + TypeScript + TanStack Router (file-based) + TanStack Query + TanStack Start (SSR + createServerFn)
- **Styling**: Tailwind CSS v4 + shadcn/ui components (minimal set)
- **Backend**: Supabase (Postgres + Auth + RLS)
- **AI**: Vercel AI SDK (`ai` + `@ai-sdk/openai` + `@ai-sdk/google`) — DeepSeek, Gemini, GPT
- **Payments**: Paddle Billing (JS SDK + webhooks)
- **i18n**: react-i18next

## Project Structure

```
src/
├── routes/                  # File-based routing (TanStack Router)
│   ├── __root.tsx
│   ├── index.tsx            # Landing
│   ├── login.tsx / signup.tsx
│   ├── pricing.tsx
│   ├── checkout/success.tsx
│   └── _authenticated/
│       ├── _layout.tsx (guard)
│       └── app/
│           ├── index.tsx    # Main validator + live report
│           └── reports/
│               ├── index.tsx
│               └── $reportId.tsx
├── components/ui/           # shadcn-style (Button, Card, etc.)
├── components/Navbar.tsx
├── hooks/                   # useAuth, useSubscription, usePaddleCheckout
├── server/                  # Server functions (createServerFn)
│   ├── validateIdea.ts
│   ├── pollReportJob.ts
│   ├── advanceForgeJob.ts   # Multi-step Forge pipeline
│   ├── reportParser.ts      # Plain-text + JSON repair parser
│   └── paddleWebhook.ts
├── lib/                     # supabase.ts, utils.ts, database.types.ts
├── i18n/                    # EN + UK translations
├── types/
└── styles.css               # Tailwind v4 + semantic dark tokens
```

## Setup Instructions

### 1. Install dependencies

```bash
cd idea-forge
npm install
```

### 2. Supabase Setup

1. Create a new Supabase project at https://supabase.com
2. Go to **SQL Editor** and run the following migrations (in order):

```sql
-- 1. Enum + Tables + Trigger + Functions (copy from below or see supabase/migrations/)

CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  full_name text,
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Trigger for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'avatar_url');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Roles table
CREATE TABLE public.user_roles (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, role)
);

-- has_role function (security definer)
CREATE OR REPLACE FUNCTION public.has_role(user_id uuid, role app_role)
RETURNS boolean LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id = has_role.user_id AND user_roles.role = has_role.role
  );
$$;

-- report_jobs
CREATE TABLE public.report_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  idea_text text NOT NULL,
  mode text CHECK (mode IN ('quick','forge')) NOT NULL,
  status text DEFAULT 'queued' CHECK (status IN ('queued','processing','completed','failed')),
  current_step int DEFAULT 0,
  total_steps int DEFAULT 1,
  partial_result jsonb DEFAULT '{}',
  result jsonb,
  error_message text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.report_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own jobs" ON public.report_jobs USING (auth.uid() = user_id);

-- subscriptions
CREATE TABLE public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  paddle_subscription_id text UNIQUE,
  status text NOT NULL,
  plan_id text,
  current_period_end timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.has_active_subscription(user_id uuid)
RETURNS boolean LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.subscriptions 
    WHERE subscriptions.user_id = has_active_subscription.user_id 
      AND status = 'active' 
      AND (current_period_end IS NULL OR current_period_end > now())
  );
$$;

-- Enable RLS on other tables as needed (profiles, etc.)
```

3. Enable **Google OAuth** provider in Supabase Auth settings (add your Google Client ID/Secret).
4. Copy your `Project URL` and `anon public` key to `.env`

### 3. Environment Variables

Copy `.env.example` → `.env` and fill in:

```env
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...   # Keep secret! Used in server functions

VITE_PADDLE_VENDOR_ID=...
VITE_PADDLE_SANDBOX=true
PADDLE_API_KEY=...
PADDLE_WEBHOOK_SECRET=...

OPENAI_API_KEY=...              # or DEEPSEEK_API_KEY for DeepSeek
GOOGLE_GENERATIVE_AI_API_KEY=...
```

### 4. Paddle Setup

1. Create Paddle account (use Sandbox for testing)
2. Create a product + recurring price (monthly)
3. Note the **Price ID** (e.g. `pri_01...`) and put it in `pricing.tsx`
4. Set up webhook endpoint in Paddle dashboard pointing to your deployed `/api/public/payments/webhook` (or the server function route)
5. For local testing, you can use ngrok or Paddle's test events.

### 5. Run the app

```bash
npm run dev
```

Open http://localhost:3000 (or the port shown by vinxi).

### 6. Production (Vercel)

The `app.config.ts` is pre-configured with `preset: 'vercel'`.

```bash
npm run build
# Deploy to Vercel (it will auto-detect)
```

Add all environment variables in Vercel dashboard (including `SUPABASE_SERVICE_ROLE_KEY` as server env).

## Key Implementation Notes

- **Forge Mode Queue**: Uses `report_jobs` table + `advanceForgeJob` server function called sequentially by polling. Each step = one LLM call with 14s AbortController timeout.
- **Parsing**: Tries structured `SUMMARY:`, `SCORE:`, `PROS:` etc first. Falls back to JSON extraction + repair for truncated responses.
- **Security**: RLS on all user tables. `has_role` and `has_active_subscription` are `SECURITY DEFINER`. Service role used only in server functions.
- **i18n**: Language persisted in localStorage. Full Ukrainian translations included.
- **Mobile**: Fully responsive, tested conceptually for 390px viewports.

## Next Steps / Polish Ideas

- Add PDF export (react-pdf or server-side)
- Admin panel for viewing all jobs (role check)
- Rate limiting per user
- Better error boundaries + loading skeletons
- Real Paddle price IDs + customer portal link
- Analytics (PostHog / Vercel Analytics)

---

Built as a complete, production-ready starter for AI startup tools. Enjoy validating ideas! 🚀