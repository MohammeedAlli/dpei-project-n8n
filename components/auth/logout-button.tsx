'use client';

import * as React from 'react';
import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createBrowserSupabaseClient } from '@/utils/supabase/client';

export function LogoutButton({ label = 'خروج' }: { label?: string }) {
  const [pending, setPending] = React.useState(false);

  const handleLogout = async () => {
    setPending(true);
    const supabase = createBrowserSupabaseClient();
    await supabase.auth.signOut();
    window.location.assign('/login');
  };

  return (
    <Button variant="ghost" size="sm" onClick={handleLogout} disabled={pending}>
      <LogOut className="h-4 w-4" />
      {pending ? 'جاري الخروج...' : label}
    </Button>
  );
}
