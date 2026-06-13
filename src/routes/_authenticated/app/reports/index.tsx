import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { ReportJob } from '@/types';
import { useTranslation } from 'react-i18next';

export const Route = createFileRoute('/_authenticated/app/reports/')({ component: ReportsPage });

function ReportsPage() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const { data: jobs = [], isLoading } = useQuery({ queryKey: ['report_jobs', user?.id], queryFn: async () => { if (!user) return []; const { data, error } = await supabase.from('report_jobs').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20); if (error) throw error; return data as ReportJob[]; }, enabled: !!user });
  return (
    <div className="container px-4 py-8 max-w-4xl"><h1 className="text-3xl font-semibold tracking-tight mb-8">{t('nav.reports')}</h1>{isLoading ? <div className="text-muted-foreground">Loading reports...</div> : jobs.length === 0 ? <Card className="glass py-16 text-center"><p className="text-muted-foreground">You haven't validated any ideas yet.</p><Link to="/app" className="text-primary underline mt-2 inline-block">Start your first validation →</Link></Card> : <div className="space-y-4">{jobs.map((job) => (<Card key={job.id} className="glass hover:border-primary/40 transition-colors"><CardHeader className="flex flex-row items-start justify-between pb-3"><div className="flex-1 min-w-0"><div className="font-medium line-clamp-2 pr-4">{job.idea_text}</div><div className="text-xs text-muted-foreground mt-1.5">{new Date(job.created_at).toLocaleDateString()} • {job.mode.toUpperCase()} • {job.status}</div></div>{job.result && <Badge variant={job.result.score > 70 ? 'success' : 'default'} className="shrink-0">{job.result.score}/100</Badge>}</CardHeader>{job.result && <CardContent className="pt-0"><p className="text-sm text-muted-foreground line-clamp-2 mb-3">{job.result.summary}</p><Link to={`/app/reports/${job.id}`} className="text-sm text-primary hover:underline">View full report →</Link></CardContent>}{job.status === 'failed' && <CardContent className="pt-0 text-sm text-destructive">{job.error_message}</CardContent>}</Card>))}</div>}</div>
  );
}