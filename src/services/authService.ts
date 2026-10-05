import { supabase } from '@/lib/supabase';
import { Profile, UserRole, Contractor } from '@/types';

export const authService = {
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  },

  async signUp(email: string, password: string, fullName: string, role: UserRole) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role,
        },
      },
    });
    if (error) throw error;
    return data;
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw error;
  },

  async getCurrentProfile(): Promise<Profile | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) {
      console.warn('Error fetching profile:', error.message);
      // Fallback profile if record does not yet exist
      return {
        id: user.id,
        email: user.email || '',
        full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
        role: (user.user_metadata?.role as UserRole) || 'site_engineer',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    }

    return data as Profile;
  },

  async updateProfile(profileData: Partial<Profile>): Promise<Profile> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('profiles')
      .update(profileData)
      .eq('id', user.id)
      .select()
      .single();

    if (error) throw error;
    return data as Profile;
  },

  async getUserContractor(userId: string): Promise<Contractor | null> {
    const { data, error } = await supabase
      .from('contractor_users')
      .select('contractor_id, contractors(*)')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.warn('Error fetching contractor association:', error.message);
      return null;
    }
    const contr = data?.contractors as unknown;
    if (Array.isArray(contr)) {
      return (contr[0] as Contractor) || null;
    }
    return (contr as Contractor) || null;
  },

  async getUserProjectScopes(userId: string) {
    const { data, error } = await supabase
      .from('user_project_scopes')
      .select('project_id, projects(*)')
      .eq('user_id', userId);

    if (error) {
      console.warn('Error fetching user project scopes:', error.message);
      return [];
    }
    return data || [];
  },
};
