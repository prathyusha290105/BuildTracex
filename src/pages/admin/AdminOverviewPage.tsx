import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { MetricCard } from '@/components/common/MetricCard';
import { CardSkeleton } from '@/components/common/LoadingSkeleton';
import {
  Shield,
  Users,
  Building2,
  HardHat,
  ClipboardCheck,
  AlertTriangle,
  History,
  Settings,
  Sliders,
  MapPin,
  ArrowRight,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export const AdminOverviewPage: React.FC = () => {
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    projectsCount: 0,
    usersCount: 0,
    contractorsCount: 0,
    inspectionsCount: 0,
    defectsCount: 0,
    overdueDefects: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadAdminStats() {
      setIsLoading(true);
      try {
        const [
          { count: pCount },
          { count: uCount },
          { count: cCount },
          { count: iCount },
          { count: dCount },
          { data: defects },
        ] = await Promise.all([
          supabase.from('projects').select('*', { count: 'exact', head: true }),
          supabase.from('profiles').select('*', { count: 'exact', head: true }),
          supabase.from('contractors').select('*', { count: 'exact', head: true }),
          supabase.from('inspections').select('*', { count: 'exact', head: true }),
          supabase.from('defects').select('*', { count: 'exact', head: true }),
          supabase.from('defects').select('status, due_date').neq('status', 'closed'),
        ]);

        const today = new Date().toISOString().split('T')[0];
        const overdue = (defects || []).filter((d) => d.due_date && d.due_date < today).length;

        setStats({
          projectsCount: pCount || 0,
          usersCount: uCount || 0,
          contractorsCount: cCount || 0,
          inspectionsCount: iCount || 0,
          defectsCount: dCount || 0,
          overdueDefects: overdue,
        });
      } catch (err) {
        console.warn('Error loading admin stats:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadAdminStats();
  }, []);

  const adminModules = [
    {
      title: 'User Management',
      description: 'Provision user accounts, assign roles (Admin, QA/QC, PM, Contractor), activate/deactivate accounts.',
      icon: Users,
      path: '/admin/users',
      color: 'text-blue-600 bg-blue-50',
    },
    {
      title: 'Construction Projects',
      description: 'Create and configure construction sites, assign project managers, set milestones and scopes.',
      icon: Building2,
      path: '/admin/projects',
      color: 'text-emerald-600 bg-emerald-50',
    },
    {
      title: 'Site Hierarchy & Locations',
      description: 'Organize buildings, blocks, levels, floors, and inspection zones across all active sites.',
      icon: MapPin,
      path: '/admin/locations',
      color: 'text-purple-600 bg-purple-50',
    },
    {
      title: 'Contractor Organizations',
      description: 'Register trade contractor firms, manage specializations, and link authorized login users.',
      icon: HardHat,
      path: '/admin/contractors',
      color: 'text-amber-600 bg-amber-50',
    },
    {
      title: 'Quality Templates Admin',
      description: 'Standardize inspection protocols, configure mandatory photographic proof and severity defaults.',
      icon: Sliders,
      path: '/admin/templates',
      color: 'text-cyan-600 bg-cyan-50',
    },
    {
      title: 'System Activity & Audit Logs',
      description: 'Searchable chronological trace of status transitions, user logins, and administrative actions.',
      icon: History,
      path: '/admin/activity',
      color: 'text-slate-600 bg-slate-100',
    },
    {
      title: 'Platform Settings & Database Test',
      description: 'Verify Supabase connection, storage bucket availability, and review environment variables.',
      icon: Settings,
      path: '/admin/settings',
      color: 'text-rose-600 bg-rose-50',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 text-white p-6 rounded-lg shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-blue-300">
              System Administration
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight mt-1">Platform Control Center</h1>
          <p className="text-xs text-slate-300 mt-1 max-w-xl">
            Centralized administration for user roles, projects, site hierarchies, contractors, and audit trails.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/admin/settings')}
          className="bg-slate-800 text-white border-slate-700 hover:bg-slate-700 text-xs self-start sm:self-auto gap-1.5"
        >
          <Settings className="w-3.5 h-3.5" />
          Test Supabase Connection
        </Button>
      </div>

      {/* KPI Stats */}
      {isLoading ? (
        <CardSkeleton count={6} />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <MetricCard
            title="Projects"
            value={stats.projectsCount}
            icon={Building2}
            variant="default"
            onClick={() => navigate('/admin/projects')}
          />
          <MetricCard
            title="Platform Users"
            value={stats.usersCount}
            icon={Users}
            variant="info"
            onClick={() => navigate('/admin/users')}
          />
          <MetricCard
            title="Contractors"
            value={stats.contractorsCount}
            icon={HardHat}
            variant="warning"
            onClick={() => navigate('/admin/contractors')}
          />
          <MetricCard
            title="Inspections"
            value={stats.inspectionsCount}
            icon={ClipboardCheck}
            variant="info"
            onClick={() => navigate('/inspections')}
          />
          <MetricCard
            title="Total Snags"
            value={stats.defectsCount}
            icon={AlertTriangle}
            variant="default"
            onClick={() => navigate('/defects')}
          />
          <MetricCard
            title="Overdue Items"
            value={stats.overdueDefects}
            icon={AlertTriangle}
            variant="critical"
            onClick={() => navigate('/defects?overdue=true')}
          />
        </div>
      )}

      {/* Administration Modules Grid */}
      <div>
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 mb-4">
          Administrative Modules
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {adminModules.map((mod) => (
            <Card
              key={mod.title}
              onClick={() => navigate(mod.path)}
              className="hover:shadow-md transition-all cursor-pointer border-slate-200 group flex flex-col justify-between"
            >
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`p-2.5 rounded-lg ${mod.color}`}>
                    <mod.icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-sm text-slate-900 group-hover:text-blue-600 transition-colors">
                    {mod.title}
                  </h3>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">{mod.description}</p>
              </CardContent>

              <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-blue-600 px-5">
                <span>Manage Module</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};
