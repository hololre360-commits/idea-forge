import { createFileRoute, Link } from '@tanstack/react-router';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { validateIdea } from '@/server/validateIdea';
import { pollReportJob } from '@/server/pollReportJob';
import type { Report, ReportJob, ValidationMode } from '@/types';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

export const Route = createFileRoute('/_authenticated/app/')({ component: DashboardPage });

function DashboardPage() {
  const { user } = useAuth();
  const { data: subscription } = useSubscription(user?.id);
  const { t } = useTranslation();
  const [idea, setIdea] = useState('');
  const [mode, setMode] = useState<ValidationMode>('quick');
  const [isValidating, setIsValidating] = useState(false);
  const [currentJob, setCurrentJob] = useState<ReportJob | null>(null);
  const [report, setReport] = useState<Report | null>(null);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);
  const hasPro = subscription?.hasActiveSubscription ?? false;

  const startValidation = async () => {
    if (!idea.trim() || !user) return;
    if (mode === 'forge' && !hasPro) {
      toast.error(t('common.upgrade'), { description: 'Forge mode requires an active Pro subscription.', action: { label: 'See Pricing', onClick: () => window.location.href = '/pricing' } });
      return;
    }
    setIsValidating(true);
    setReport(null);
    setCurrentJob(null);
    try {
      const result = await validateIdea({ idea: idea.trim(), mode, userId: user.id });
      if (result.immediateResult) {
        setReport(result.immediateResult);
        setIsValidating(false);
        toast.success('Quick analysis complete!');
        return;
      }
      if (result.error) throw new Error(result.error);
      const jobId = result.jobId;
      const initialJob: ReportJob = { id: jobId, user_id: user.id, idea_text: idea.trim(), mode, status: 'queued', current_step: 0, total_steps: 5, partial_result: {}, result: null, error_message: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
      setCurrentJob(initialJob);
      const interval = setInterval(async () => {
        try {
          const pollResult = await pollReportJob(jobId);
          setCurrentJob(pollResult.job);
          if (pollResult.job.result) setReport(pollResult.job.result);
          if (!pollResult.shouldContinuePolling) {
            clearInterval(interval);
            setPollingInterval(null);
            setIsValidating(false);
            if (pollResult.job.status === 'failed') toast.error(t('jobs.error.generic'), { description: pollResult.job.error_message || t('jobs.error.timeout') });
            else if (pollResult.job.result) toast.success('Forge research complete!');
          }
        } catch (err: any) {
          clearInterval(interval);
          setIsValidating(false);
          toast.error(err.message || t('jobs.error.generic'));
        }
      }, 1200);
      setPollingInterval(interval);
      setTimeout(() => { if (interval) { clearInterval(interval); setIsValidating(false); setPollingInterval(null); toast.warning(t('jobs.timeoutWarning')); } }, 45000);
    } catch (err: any) {
      setIsValidating(false);
      toast.error(err.message || t('jobs.error.generic'));
    }
  };

  return (
    <div className="container px-4 py-8 max-w-5xl">
      <div className="mb-8"><h1 className="text-4xl font-semibold tracking-tight">{t('dashboard.title')}</h1><p className="text-muted-foreground mt-2">{t('dashboard.subtitle')}</p></div>
      <Card className="mb-8 glass"><CardHeader><CardTitle>Describe your startup idea</CardTitle><CardDescription>The more specific and detailed, the better the analysis.</CardDescription></CardHeader><CardContent className="space-y-6"><div><label className="section-title mb-2 block">{t('dashboard.ideaLabel')}</label><Textarea value={idea} onChange={(e) => setIdea(e.target.value)} placeholder={t('dashboard.ideaPlaceholder')} className="min-h-[140px] text-base" disabled={isValidating} /><div className="text-xs text-muted-foreground mt-1.5 text-right">{idea.length} / 2000</div></div><div><label className="section-title mb-3 block">{t('dashboard.modeLabel')}</label><div className="flex flex-col sm:flex-row gap-3"><button onClick={() => setMode('quick')} disabled={isValidating} className={`flex-1 rounded-lg border p-4 text-left transition-all ${mode === 'quick' ? 'border-primary bg-primary/5' : 'hover:border-border'}`}><div className="font-medium flex items-center gap-2">{t('dashboard.quickMode')} <Badge variant="secondary">Free</Badge></div><div className="text-sm text-muted-foreground mt-1">~5-8s • Single model</div></button><button onClick={() => setMode('forge')} disabled={isValidating} className={`flex-1 rounded-lg border p-4 text-left transition-all ${mode === 'forge' ? 'border-primary bg-primary/5' : 'hover:border-border'}`}><div className="font-medium flex items-center gap-2">{t('dashboard.forgeMode')} <Badge>Pro</Badge></div><div className="text-sm text-muted-foreground mt-1">30-60s • Multi-model cross-validation</div></button></div>{mode === 'forge' && <p className="text-xs text-amber-500 mt-2">{t('dashboard.forgeNote')}</p>}</div><div className="flex gap-3"><Button onClick={startValidation} disabled={!idea.trim() || isValidating || idea.length < 20} className="flex-1 h-12 text-base">{isValidating ? t('dashboard.validating') : t('dashboard.validateButton')}</Button>{isValidating && <Button variant="outline" onClick={() => { if (pollingInterval) clearInterval(pollingInterval); setIsValidating(false); }}>Cancel</Button>}</div></CardContent></Card>
      {currentJob && isValidating && <Card className="mb-8 border-primary/20"><CardHeader className="pb-3"><div className="flex items-center justify-between"><div><CardTitle className="text-lg">Forge Research in Progress</CardTitle><CardDescription>{t('jobs.polling')}</CardDescription></div><Badge variant={currentJob.status === 'failed' ? 'destructive' : 'default'}>{t(`jobs.status.${currentJob.status}`)}</Badge></div></CardHeader><CardContent><div className="flex items-center gap-4 mb-2"><Progress value={(currentJob.current_step / currentJob.total_steps) * 100} className="flex-1" /><span className="text-sm tabular-nums text-muted-foreground min-w-[70px] text-right">{t('jobs.step', { current: currentJob.current_step, total: currentJob.total_steps })}</span></div><p className="text-xs text-muted-foreground">Each step runs a specialized LLM analysis (max 14s per call)</p></CardContent></Card>}
      {report && <Card className="mb-8 report-card"><CardHeader className="border-b"><div className="flex items-start justify-between"><div><CardTitle className="text-2xl flex items-center gap-3">{t('report.title')} <Badge variant={report.score > 75 ? 'success' : report.score > 55 ? 'default' : 'warning'}>{report.score}/100</Badge></CardTitle><CardDescription className="mt-1">Generated with {mode === 'forge' ? 'Forge 0.1 Multi-Model' : 'Quick Mode'}</CardDescription></div><div className="flex gap-2"><Button variant="outline" size="sm" onClick={() => { const dataStr = JSON.stringify(report, null, 2); const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr); const link = document.createElement('a'); link.href = dataUri; link.download = 'idea-validation-report.json'; link.click(); }}>{t('report.downloadJson')}</Button><Link to="/pricing"><Button variant="outline" size="sm">Upgrade for PDF</Button></Link></div></div></CardHeader><CardContent className="pt-6 space-y-8"><div className="flex items-center gap-6"><div className="text-7xl font-semibold tabular-nums tracking-tighter text-primary">{report.score}</div><div><div className="section-title">{t('report.scoreLabel')}</div><div className="text-sm text-muted-foreground max-w-[260px]">Overall viability score based on market, execution, and defensibility signals.</div></div></div><div><div className="section-title mb-3">{t('report.summary')}</div><p className="text-[15px] leading-relaxed text-foreground/90">{report.summary}</p></div><div className="grid md:grid-cols-2 gap-x-8 gap-y-8"><div><div className="section-title mb-3 text-emerald-500">{t('report.pros')}</div><ul className="pros-list space-y-2 text-sm">{report.pros.map((pro, i) => <li key={i}>{pro}</li>)}</ul></div><div><div className="section-title mb-3 text-red-500">{t('report.cons')}</div><ul className="cons-list space-y-2 text-sm">{report.cons.map((con, i) => <li key={i}>{con}</li>)}</ul></div></div><div className="grid md:grid-cols-2 gap-x-8 gap-y-8"><div><div className="section-title mb-3">{t('report.targetAudience')}</div><p className="text-sm leading-relaxed">{report.targetAudience}</p></div><div><div className="section-title mb-3">{t('report.monetization')}</div><p className="text-sm leading-relaxed">{report.monetization}</p></div></div><div><div className="section-title mb-3">{t('report.risks')}</div><ul className="space-y-1.5 text-sm">{report.risks.map((risk, i) => <li key={i} className="flex gap-2"><span className="text-red-500 mt-0.5">•</span> {risk}</li>)}</ul></div><div><div className="section-title mb-3">{t('report.nextSteps')}</div><ol className="space-y-2 text-sm list-decimal list-inside marker:text-muted-foreground">{report.nextSteps.map((step, i) => <li key={i}>{step}</li>)}</ol></div></CardContent></Card>}
      <div className="mt-12"><div className="flex items-center justify-between mb-4"><h3 className="font-semibold tracking-tight">{t('dashboard.recentReports')}</h3><Link to="/app/reports" className="text-sm text-primary hover:underline">{t('dashboard.viewAll')}</Link></div><Card className="glass"><CardContent className="py-12 text-center text-muted-foreground text-sm">{t('dashboard.noReports')}</CardContent></Card></div>
    </div>
  );
}