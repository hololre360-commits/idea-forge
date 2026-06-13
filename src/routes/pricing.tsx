import { createFileRoute } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { usePaddleCheckout } from '@/hooks/usePaddleCheckout';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

export const Route = createFileRoute('/pricing')({ component: PricingPage });

function PricingPage() {
  const { openCheckout, isSandbox } = usePaddleCheckout();
  const { user } = useAuth();
  const { data: sub } = useSubscription(user?.id);
  const { t } = useTranslation();
  const handleUpgrade = () => {
    if (!user) { window.location.href = '/signup'; return; }
    const PRO_PRICE_ID = 'pri_01exampleproplan';
    openCheckout(PRO_PRICE_ID, user.email || undefined);
    toast.info('Opening secure checkout...');
  };
  return (
    <div className="container max-w-5xl px-4 py-16"><div className="text-center mb-12"><h1 className="text-4xl font-semibold tracking-tight">{t('pricing.title')}</h1><p className="mt-3 text-xl text-muted-foreground max-w-md mx-auto">{t('pricing.subtitle')}</p>{isSandbox && <Badge variant="warning" className="mt-4">{t('pricing.testMode')}</Badge>}</div><div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto"><Card className="glass"><CardHeader><div className="flex justify-between items-baseline"><CardTitle>{t('pricing.freePlan')}</CardTitle><div><span className="text-4xl font-semibold tabular-nums">{t('pricing.freePrice')}</span></div></div></CardHeader><CardContent className="space-y-6"><ul className="space-y-3 text-sm">{(t('pricing.freeFeatures', { returnObjects: true }) as string[]).map((f, i) => <li key={i} className="flex gap-2">✓ {f}</li>)}</ul><Button variant="outline" className="w-full" disabled>Current plan</Button></CardContent></Card><Card className="glass border-primary relative"><div className="absolute -top-3 right-6"><Badge>Recommended</Badge></div><CardHeader><div className="flex justify-between items-baseline"><CardTitle>{t('pricing.proPlan')}</CardTitle><div><span className="text-4xl font-semibold tabular-nums">{t('pricing.proPrice')}</span><span className="text-muted-foreground">{t('pricing.proPeriod')}</span></div></div></CardHeader><CardContent className="space-y-6"><ul className="space-y-3 text-sm">{(t('pricing.proFeatures', { returnObjects: true }) as string[]).map((f, i) => <li key={i} className="flex gap-2">✓ {f}</li>)}</ul>{sub?.hasActiveSubscription ? <Button variant="secondary" className="w-full" disabled>{t('pricing.currentPlan')}</Button> : <Button onClick={handleUpgrade} className="w-full">{t('pricing.ctaPro')}</Button>}<p className="text-[10px] text-center text-muted-foreground">Billed monthly • Cancel anytime</p></CardContent></Card></div><div className="mt-12 text-center text-xs text-muted-foreground max-w-md mx-auto">Payments powered by Paddle. All plans include access to the core Idea Forge validation engine.</div></div>
  );
}