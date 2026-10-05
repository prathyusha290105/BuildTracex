import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { defectService } from '@/services/defectService';
import { Defect } from '@/types';
import { MetricCard } from '@/components/common/MetricCard';
import { SeverityBadge } from '@/components/common/SeverityBadge';
import { StatusBadge } from '@/components/common/StatusBadge';
import { formatDate, isDefectOverdue } from '@/lib/utils';
import {
  HardHat,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Camera,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CardSkeleton } from '@/components/common/LoadingSkeleton';

export const ContractorDashboardPage: React.FC = () => {
  const { contractor, profile } = useAuth();
  const navigate = useNavigate();

  const [defects, setDefects] = useState<Defect[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadContractorData() {
      setIsLoading(true);
      try {
        const result = await defectService.getDefects({
          contractorId: contractor?.id || undefined,
        });
        setDefects(result.defects);
      } catch (err) {
        console.warn('Error loading contractor dashboard:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadContractorData();
  }, [contractor]);

  const assignedCount = defects.filter((d) => d.status === 'assigned').length;
  const inProgressCount = defects.filter((d) => d.status === 'rectification_in_progress' || d.status === 'reopened').length;
  const submittedCount = defects.filter((d) => d.status === 'rectification_submitted' || d.status === 'awaiting_reinspection').length;
  const closedCount = defects.filter((d) => d.status === 'closed').length;
  const overdueCount = defects.filter((d) => isDefectOverdue(d.status, d.due_date)).length;

  const urgentDefects = [...defects]
    .filter((d) => d.status !== 'closed')
    .sort((a, b) => {
      const aO = isDefectOverdue(a.status, a.due_date);
      const bO = isDefectOverdue(b.status, b.due_date);
      if (aO && !bO) return -1;
      if (!aO && bO) return 1;
      return (a.due_date || '').localeCompare(b.due_date || '');
    })
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-xs uppercase bg-amber-100 text-amber-800 px-2 py-0.5 rounded">
              Contractor Portal
            </span>
            <span className="text-xs text-slate-400">&bull;</span>
            <span className="text-xs font-semibold text-slate-700">
              {contractor?.company_name || 'Apex Finishes Ltd'}
            </span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight mt-1">
            Assigned Rectification Tasks
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Logged in as <span className="font-semibold text-slate-800">{profile?.full_name}</span>. Review assigned snags and submit completion evidence.
          </p>
        </div>

        <Button
          size="sm"
          onClick={() => navigate('/contractor/defects')}
          className="gap-1.5 font-semibold"
        >
          <HardHat className="w-4 h-4" />
          View All Assignments ({defects.length})
        </Button>
      </div>

      {/* KPI Cards Row */}
      {isLoading ? (
        <CardSkeleton count={5} />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <MetricCard
            title="New Assigned"
            value={assignedCount}
            icon={HardHat}
            variant="warning"
            onClick={() => navigate('/contractor/defects?status=assigned')}
          />
          <MetricCard
            title="In Progress"
            value={inProgressCount}
            icon={Clock}
            variant="info"
            onClick={() => navigate('/contractor/defects?status=rectification_in_progress')}
          />
          <MetricCard
            title="Under Review"
            value={submittedCount}
            icon={TrendingUp}
            variant="default"
            onClick={() => navigate('/contractor/defects?status=rectification_submitted')}
          />
          <MetricCard
            title="Overdue"
            value={overdueCount}
            icon={AlertTriangle}
            variant="critical"
            onClick={() => navigate('/contractor/defects?overdue=true')}
          />
          <MetricCard
            title="Verified Closed"
            value={closedCount}
            icon={CheckCircle2}
            variant="success"
            onClick={() => navigate('/contractor/defects?status=closed')}
          />
        </div>
      )}

      {/* Urgent Rectifications Queue */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-sm font-bold text-slate-900">
              Urgent Rectifications Queue
            </CardTitle>
            <p className="text-xs text-slate-500 mt-0.5">
              Tasks approaching deadline or flagged overdue
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/contractor/defects')}
            className="text-xs text-blue-600 hover:text-blue-700 h-8"
          >
            View all &rarr;
          </Button>
        </CardHeader>
        <CardContent>
          {urgentDefects.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              No pending rectifications assigned to your organization.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-y border-slate-100">
                  <tr>
                    <th className="py-2.5 px-3">Defect ID</th>
                    <th className="py-2.5 px-3">Title & Location</th>
                    <th className="py-2.5 px-3">Severity</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Due Date</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {urgentDefects.map((d) => {
                    const overdue = isDefectOverdue(d.status, d.due_date);

                    return (
                      <tr
                        key={d.id}
                        onClick={() => navigate(`/contractor/defects/${d.id}`)}
                        className="hover:bg-slate-50 cursor-pointer"
                      >
                        <td className="py-2.5 px-3 font-mono font-bold text-blue-600">
                          {d.reference}
                        </td>
                        <td className="py-2.5 px-3 max-w-xs">
                          <p className="font-semibold text-slate-900 truncate">{d.title}</p>
                          <p className="text-slate-400 truncate text-[11px]">
                            {[d.building?.name, d.floor?.name, d.zone?.name].filter(Boolean).join(' > ')}
                          </p>
                        </td>
                        <td className="py-2.5 px-3">
                          <SeverityBadge severity={d.severity} />
                        </td>
                        <td className="py-2.5 px-3">
                          <StatusBadge status={d.status} />
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <span className={overdue ? 'text-red-600 font-bold' : 'text-slate-600'}>
                            {formatDate(d.due_date)}
                          </span>
                          {overdue && (
                            <span className="ml-1 text-[9px] font-bold text-red-600 bg-red-100 px-1 py-0.5 rounded">
                              OVERDUE
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <span className="text-blue-600 font-semibold hover:underline">
                            Rectify &rarr;
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
