import type { SupabaseClient } from '@supabase/supabase-js';

export type ProfileRole = 'admin' | 'shop';

export type Profile = {
  id: string;
  role: ProfileRole;
  shop_id: string | null;
};

export async function fetchProfile(
  supabase: SupabaseClient,
  userId: string
): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, role, shop_id')
    .eq('id', userId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  if (data.role !== 'admin' && data.role !== 'shop') {
    return null;
  }

  return data as Profile;
}
