import { createFileRoute, Link } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from 'react-i18next';

export const Route = createFileRoute('/')({ component: LandingPage });

function LandingPage() {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col">
      <section className="container px-4 pt-20 pb-16 text-center">
        <Badge variant="secondary" className="mb-4">AI-Powered Validation</Badge>
        <h1 className="text-5xl md:text-6xl font-semibold tracking-tighter mb-6 max-w-4xl mx-auto">{t('landing.heroTitle')}</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10">{t('landing.heroSubtitle')}</p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/signup"><Button size="lg" className="px-8">{t('landing.ctaPrimary')}</Button></Link>
          <Link to="/pricing"><Button size="lg" variant="outline" className="px-8">{t('landing.ctaSecondary')}</Button></Link>
        </div>
        <p className="text-xs text-muted-foreground mt-4">No credit card required • 5 free Quick validations</p>
      </section>
      <section className="border-y bg-card/50 py-16"><div className="container px-4"><h2 className="text-center text-3xl font-semibold tracking-tight mb-12">{t('landing.howItWorks')}</h2><div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">{[1,2,3].map((step) => (<div key={step} className="text-center"><div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary font-mono text-xl font-semibold">{step}</div><h3 className="font-semibold mb-2">{t(`landing.step${step}Title`)}</h3><p className="text-muted-foreground text-sm">{t(`landing.step${step}Desc`)}</p></div>))}</div></div></section>
      <section className="container px-4 py-16"><h2 className="text-center text-3xl font-semibold tracking-tight mb-4">Two powerful analysis modes</h2><p className="text-center text-muted-foreground mb-10 max-w-md mx-auto">Choose speed or depth depending on how serious you are about the idea.</p><div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto"><Card className="glass"><CardHeader><div className="flex items-center justify-between"><CardTitle>{t('landing.modes.quick')}</CardTitle><Badge variant="secondary">Free</Badge></div><CardDescription>{t('landing.modes.quickDesc')}</CardDescription></CardHeader><CardContent><ul className="space-y-2 text-sm text-muted-foreground"><li>→ Single high-quality LLM (DeepSeek / Gemini Flash)</li><li>→ Results in &lt; 8 seconds</li><li>→ Perfect for quick validation &amp; iteration</li></ul></CardContent></Card><Card className="glass border-primary/30"><CardHeader><div className="flex items-center justify-between"><CardTitle>{t('landing.modes.forge')}</CardTitle><Badge>Pro</Badge></div><CardDescription>{t('landing.modes.forgeDesc')}</CardDescription></CardHeader><CardContent><ul className="space-y-2 text-sm text-muted-foreground"><li>→ 5-step cross-validation pipeline (DeepSeek + Gemini)</li><li>→ 30-60 seconds • Highest accuracy</li><li>→ Synthesis of multiple expert perspectives</li><li>→ Best for fundraising &amp; serious pivots</li></ul></CardContent></Card></div></section>
      <section className="border-t py-16 bg-card/30"><div className="container px-4 text-center"><h3 className="text-xl font-medium mb-8 tracking-tight">{t('landing.testimonialsTitle')}</h3><div className="flex flex-wrap justify-center gap-x-12 gap-y-4 text-sm text-muted-foreground"><div>Y Combinator Founders</div><div>Indie Hackers</div><div>European Startup Studio</div><div>LatAm Accelerator</div></div></div></section>
      <footer className="border-t py-8 text-center text-xs text-muted-foreground">{t('landing.footer')}</footer>
    </div>
  );
}