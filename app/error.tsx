'use client';

import { RotateCcw } from 'lucide-react';
import { useLanguage } from '@/components/providers/language-provider';
import { Button } from '@/components/ui/button';

export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  const { lang } = useLanguage();
  return (
    <div className="container flex min-h-[60dvh] flex-col items-center justify-center gap-4 text-center">
      <h1 className="font-display text-3xl font-bold">{lang === 'ar' ? 'حصلت مشكلة' : 'Something went wrong'}</h1>
      <p className="max-w-md text-muted-foreground">
        {lang === 'ar' ? 'جرّب تحمّل الصفحة تاني. لو المشكلة فضلت، كلّمنا.' : 'Please try again. If it keeps happening, contact us.'}
      </p>
      <Button onClick={reset}>
        <RotateCcw className="h-4 w-4" />
        {lang === 'ar' ? 'حاول تاني' : 'Try again'}
      </Button>
    </div>
  );
}
