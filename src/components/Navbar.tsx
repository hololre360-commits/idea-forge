import { Link } from '@tanstack/react-router';
import { Button } from './ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from 'react-i18next';
import { Badge } from './ui/badge';

interface NavbarProps {
  variant?: 'public' | 'authenticated';
}

export function Navbar({ variant = 'public' }: NavbarProps) {
  const { user, profile, signOut } = useAuth();
  const { t, i18n } = useTranslation();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    localStorage.setItem('language', lng);
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">IF</span>
            </div>
            <span className="font-semibold text-xl tracking-tight">{t('appName')}</span>
          </Link>

          {variant === 'authenticated' && (
            <div className="hidden md:flex items-center gap-6 text-sm">
              <Link to="/app" className="hover:text-primary transition-colors">{t('nav.dashboard')}</Link>
              <Link to="/app/reports" className="hover:text-primary transition-colors">{t('nav.reports')}</Link>
              <Link to="/pricing" className="hover:text-primary transition-colors">{t('nav.pricing')}</Link>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Language Switcher */}
          <div className="flex items-center rounded-md border p-1 text-xs">
            <button
              onClick={() => changeLanguage('en')}
              className={`px-2.5 py-1 rounded ${i18n.language === 'en' ? 'bg-secondary' : 'hover:bg-muted'}`}
            >
              EN
            </button>
            <button
              onClick={() => changeLanguage('uk')}
              className={`px-2.5 py-1 rounded ${i18n.language === 'uk' ? 'bg-secondary' : 'hover:bg-muted'}`}
            >
              UK
            </button>
          </div>

          {user ? (
            <div className="flex items-center gap-3">
              <div className="hidden sm:block text-right">
                <div className="text-sm font-medium">{profile?.full_name || user.email?.split('@')[0]}</div>
                <div className="text-[10px] text-muted-foreground -mt-0.5">{user.email}</div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => signOut.mutate()}>
                {t('nav.logout')}
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login">
                <Button variant="ghost" size="sm">{t('nav.login')}</Button>
              </Link>
              <Link to="/signup">
                <Button size="sm">{t('nav.signup')}</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}