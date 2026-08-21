import { isSupabaseConfigured, isSupabaseLocale } from '@/lib/env';
import { LoginForm } from './login-form';

export default function LoginPage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-8 px-5">
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="font-display font-extrabold text-[34px] tracking-[-0.02em]">Noteaker</h1>
        <p className="max-w-[42ch] text-[13px] text-fg-muted">
          Un posto solo per quello che leggi, guardi e devi fare.
        </p>
      </div>
      <LoginForm configured={isSupabaseConfigured} locale={isSupabaseLocale} />
    </main>
  );
}
