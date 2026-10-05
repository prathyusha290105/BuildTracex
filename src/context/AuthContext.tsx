import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { Profile, UserRole, Contractor } from '@/types';
import { authService } from '@/services/authService';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  role: UserRole;
  contractor: Contractor | null;
  loading: boolean;
  isConfigured: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string, role: UserRole) => Promise<void>;
  signOut: () => Promise<void>;
  switchDemoRole: (newRole: UserRole) => void;
  hasRole: (allowedRoles: UserRole[]) => boolean;
  canManageProject: (projectId?: string) => boolean;
  canConductInspection: () => boolean;
  canApproveClosure: () => boolean;
  isContractor: () => boolean;
  isAdmin: () => boolean;
}

const DEMO_PROFILES: Record<UserRole, Profile> = {
  system_admin: {
    id: '11111111-0000-0000-0000-000000000001',
    email: 'admin@buildtracex.com',
    full_name: 'Arthur Vance (System Admin)',
    role: 'system_admin',
    phone: '+1 (555) 010-1001',
    is_active: true,
    created_at: '2026-01-15T08:00:00Z',
    updated_at: '2026-01-15T08:00:00Z',
  },
  quality_manager: {
    id: '11111111-0000-0000-0000-000000000002',
    email: 'quality.mgr@buildtracex.com',
    full_name: 'Eleanor Bennett (Quality Manager)',
    role: 'quality_manager',
    phone: '+1 (555) 010-1002',
    is_active: true,
    created_at: '2026-01-16T08:00:00Z',
    updated_at: '2026-01-16T08:00:00Z',
  },
  qaqc_engineer: {
    id: '11111111-0000-0000-0000-000000000003',
    email: 'qaqc.eng@buildtracex.com',
    full_name: 'Marcus Chen (QA/QC Engineer)',
    role: 'qaqc_engineer',
    phone: '+1 (555) 010-1003',
    is_active: true,
    created_at: '2026-01-17T08:00:00Z',
    updated_at: '2026-01-17T08:00:00Z',
  },
  site_engineer: {
    id: '11111111-0000-0000-0000-000000000004',
    email: 'site.eng@buildtracex.com',
    full_name: 'Rohan Sharma (Site Engineer)',
    role: 'site_engineer',
    phone: '+1 (555) 010-1004',
    is_active: true,
    created_at: '2026-01-18T08:00:00Z',
    updated_at: '2026-01-18T08:00:00Z',
  },
  project_manager: {
    id: '11111111-0000-0000-0000-000000000005',
    email: 'pm@buildtracex.com',
    full_name: 'Samantha Wright (Project Manager)',
    role: 'project_manager',
    phone: '+1 (555) 010-1005',
    is_active: true,
    created_at: '2026-01-19T08:00:00Z',
    updated_at: '2026-01-19T08:00:00Z',
  },
  contractor: {
    id: '11111111-0000-0000-0000-000000000006',
    email: 'contractor@apexfinishes.com',
    full_name: 'David Miller (Apex Finishes)',
    role: 'contractor',
    phone: '+1 (555) 234-5678',
    is_active: true,
    created_at: '2026-01-20T08:00:00Z',
    updated_at: '2026-01-20T08:00:00Z',
  },
};

const DEMO_CONTRACTOR: Contractor = {
  id: '55555555-5555-5555-5555-555555555501',
  company_name: 'Apex Finishes Ltd',
  contact_person: 'David Miller',
  email: 'david.miller@apexfinishes.com',
  phone: '+1 (555) 234-5678',
  address: '45 Industrial Way, Suite 200',
  specialization: 'Wall finishes, plastering & painting',
  is_active: true,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isConfigured = isSupabaseConfigured();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(DEMO_PROFILES.system_admin);
  const [contractor, setContractor] = useState<Contractor | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let mounted = true;

    async function initializeAuth() {
      if (!isConfigured) {
        // Fallback demo profile loaded for rapid evaluation without crashing
        setProfile(DEMO_PROFILES.system_admin);
        setLoading(false);
        return;
      }

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user && mounted) {
          setUser(session.user);
          const userProfile = await authService.getCurrentProfile();
          setProfile(userProfile);
          if (userProfile?.role === 'contractor') {
            const userContractor = await authService.getUserContractor(session.user.id);
            setContractor(userContractor);
          }
        }
      } catch (err) {
        console.warn('Session verification notice:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    initializeAuth();

    // Listen for auth state changes if configured
    if (isConfigured) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
        if (session?.user) {
          setUser(session.user);
          const p = await authService.getCurrentProfile();
          setProfile(p);
          if (p?.role === 'contractor') {
            const c = await authService.getUserContractor(session.user.id);
            setContractor(c);
          }
        } else {
          setUser(null);
          setProfile(null);
          setContractor(null);
        }
      });

      return () => {
        mounted = false;
        subscription.unsubscribe();
      };
    }

    return () => {
      mounted = false;
    };
  }, [isConfigured]);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      if (isConfigured) {
        await authService.signIn(email, password);
        const p = await authService.getCurrentProfile();
        setProfile(p);
      } else {
        // Find matching demo profile
        const matched = Object.values(DEMO_PROFILES).find((p) => p.email.toLowerCase() === email.toLowerCase());
        if (matched) {
          setProfile(matched);
          if (matched.role === 'contractor') {
            setContractor(DEMO_CONTRACTOR);
          }
        } else {
          setProfile(DEMO_PROFILES.system_admin);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, fullName: string, role: UserRole) => {
    setLoading(true);
    try {
      if (isConfigured) {
        await authService.signUp(email, password, fullName, role);
      }
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      if (isConfigured) {
        await authService.signOut();
      }
      setUser(null);
      setProfile(null);
      setContractor(null);
    } finally {
      setLoading(false);
    }
  };

  const switchDemoRole = (newRole: UserRole) => {
    const demo = DEMO_PROFILES[newRole];
    setProfile(demo);
    if (newRole === 'contractor') {
      setContractor(DEMO_CONTRACTOR);
    } else {
      setContractor(null);
    }
  };

  const role: UserRole = profile?.role || 'site_engineer';

  const hasRole = (allowedRoles: UserRole[]): boolean => {
    if (!profile) return false;
    if (profile.role === 'system_admin') return true;
    return allowedRoles.includes(profile.role);
  };

  const canManageProject = (): boolean => {
    return hasRole(['system_admin', 'quality_manager', 'project_manager']);
  };

  const canConductInspection = (): boolean => {
    return hasRole(['system_admin', 'quality_manager', 'qaqc_engineer']);
  };

  const canApproveClosure = (): boolean => {
    return hasRole(['system_admin', 'quality_manager', 'qaqc_engineer']);
  };

  const isContractor = (): boolean => {
    return profile?.role === 'contractor';
  };

  const isAdmin = (): boolean => {
    return profile?.role === 'system_admin';
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        role,
        contractor,
        loading,
        isConfigured,
        signIn,
        signUp,
        signOut,
        switchDemoRole,
        hasRole,
        canManageProject,
        canConductInspection,
        canApproveClosure,
        isContractor,
        isAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
