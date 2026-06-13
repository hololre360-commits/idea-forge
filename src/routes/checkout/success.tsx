import { createFileRoute, Link } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const Route = createFileRoute('/checkout/success')({ component: SuccessPage });

function SuccessPage() {
  return (
    <div className="container flex min-h-[70vh] items-center justify-center px-4"><Card className="max-w-md w-full text-center glass"><CardHeader><div className="mx-auto mb-4 h-16 w-16 rounded-full bg-emerald-500/10 flex items-center justify-center"><span className="text-4xl">🎉</span></div><CardTitle className="text-2xl">Payment successful!</CardTitle></CardHeader><CardContent className="space-y-4"><p className="text-muted-foreground">Thank you! Your Pro subscription is now active. You can now use Forge 0.1 Research mode.</p><Link to="/app"><Button className="w-full">Go to Dashboard →</Button></Link><p className="text-xs text-muted-foreground">A receipt has been sent to your email.</p></CardContent></Card></div>
  );
}