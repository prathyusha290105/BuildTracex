import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useProject } from '@/context/ProjectContext';
import { reportService } from '@/services/reportService';
import { defectService } from '@/services/defectService';
import { activityService } from '@/services/activityService';
import {
  DashboardMetrics,
  ContractorPerformanceMetric,
  Defect,
  ActivityLog,
} from '@/types';
import { MetricCard } from '@/components/common/MetricCard';
import { StatusBadge } from '@/components/common/StatusBadge';
import { SeverityBadge } from '@/components/common/SeverityBadge';
import { CardSkeleton } from '@/components/common/LoadingSkeleton';
import { formatDate, formatDateTime, formatSeverityLabel, formatStatusLabel, isDefectOverdue } from '@/lib/utils';
import {
  ClipboardCheck,
  AlertTriangle,
  Clock,
  CheckCircle2,
  HardHat,
  PlusCircle,
  FileText,
  AlertOctagon,
  ArrowRight,
  TrendingUp,
  Activity,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

export const DashboardPage: React.FC = () => {
  const { role, canConductInspection, canApproveClosure, isAdmin } = useAuth();
  const { selectedProjectId, selectedProject } = useProject();
  const navigate = useNavigate();

  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [contractorMetrics, setContractorMetrics] = useState<ContractorPerformanceMetric[]>([]);
  const [priorityDefects, setPriorityDefects] = useState<Defect[]>([]);
  const [recentActivities, setRecentActivities] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadDashboardData() {
      setIsLoading(true);
      try {
        const [dashMetrics, cMetrics, defsResult, activities] = await Promise.all([
          reportService.getDashboardMetrics(selectedProjectId),
          reportService.getContractorPerformanceMetrics(selectedProjectId),
          defectService.getDefects({
            projectId: selectedProjectId,
            limit: 6,
          }),
          activityService.getActivityLogs(8),
        ]);

        setMetrics(dashMetrics);
        setContractorMetrics(cMetrics);
        // Priority defects: sort by overdue, critical, high
        const sorted = [...defsResult.defects].sort((a, b) => {
          const aOverdue = isDefectOverdue(a.status, a.due_date);
          const bOverdue = isDefectOverdue(b.status, b.due_date);
          if (aOverdue && !bOverdue) return -1;
          if (!aOverdue && bOverdue) return 1;
          if (a.severity === 'critical') return -1;
          if (b.severity === 'critical') return 1;
          return 0;
        });
        setPriorityDefects(sorted.slice(0, 5));
        setRecentActivities(activities);
      } catch (err) {
        console.warn('Dashboard loading error:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadDashboardData();
  }, [selectedProjectId]);

  // Chart data preparation
  const statusChartData = metrics
    ? [
        { name: 'Open', count: metrics.byStatus.open, fill: '#3b82f6' },
        { name: 'Assigned', count: metrics.byStatus.assigned, fill: '#8b5cf6' },
        { name: 'In Progress', count: metrics.byStatus.rectification_in_progress, fill: '#f59e0b' },
        { name: 'Submitted', count: metrics.byStatus.rectification_submitted, fill: '#06b6d4' },
        { name: 'Reinspection', count: metrics.byStatus.awaiting_reinspection, fill: '#ec4899' },
        { name: 'Closed', count: metrics.byStatus.closed, fill: '#10b981' },
        { name: 'Reopened', count: metrics.byStatus.reopened, fill: '#f97316' },
      ]
    : [];

  const severityChartData = metrics
    ? [
        { name: 'Critical', value: metrics.bySeverity.critical, color: '#dc2626' },
        { name: 'High', value: metrics.bySeverity.high, color: '#ea580c' },
        { name: 'Medium', value: metrics.bySeverity.medium, color: '#f59e0b' },
        { name: 'Low', value: metrics.bySeverity.low, color: '#64748b' },
      ].filter((d) => d.value > 0)
    : [];

  const ageingChartData = metrics
    ? [
        { bracket: '0-3 days', count: metrics.ageing['0-3'], fill: '#10b981' },
        { bracket: '4-7 days', count: metrics.ageing['4-7'], fill: '#3b82f6' },
        { bracket: '8-14 days', count: metrics.ageing['8-14'], fill: '#f59e0b' },
        { bracket: '15-30 days', count: metrics.ageing['15-30'], fill: '#f97316' },
        { bracket: '30+ days', count: metrics.ageing['30+'], fill: '#dc2626' },
      ]
    : [];

  return (
    <div className="space-y-6">
      {/* Top Banner / Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Quality Operations Dashboard
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Scope:{' '}
            <span className="font-semibold text-slate-800">
              {selectedProject ? `${selectedProject.name} (${selectedProject.code})` : 'All Active Projects'}
            </span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {canConductInspection() && (
            <Button
              size="sm"
              onClick={() => navigate('/inspections/new')}
              className="gap-1.5 font-semibold"
            >
              <PlusCircle className="w-4 h-4" />
              Start Inspection
            </Button>
          )}

          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate('/defects/new')}
            className="gap-1.5 font-medium"
          >
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            Report Defect
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate('/reports')}
            className="gap-1.5 font-medium"
          >
            <FileText className="w-4 h-4 text-slate-500" />
            Generate Report
          </Button>
        </div>
      </div>

      {/* KPI Cards Row (Section 6) */}
      {isLoading ? (
        <CardSkeleton count={6} />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <MetricCard
            title="Total Inspections"
            value={metrics?.totalInspections || 0}
            icon={ClipboardCheck}
            variant="info"
            onClick={() => navigate('/inspections')}
          />
          <MetricCard
            title="Total Defects"
            value={metrics?.totalDefects || 0}
            icon={AlertTriangle}
            variant="default"
            onClick={() => navigate('/defects')}
          />
          <MetricCard
            title="Open Defects"
            value={metrics?.openDefects || 0}
            icon={Clock}
            variant="warning"
            onClick={() => navigate('/defects')}
          />
          <MetricCard
            title="Overdue Items"
            value={metrics?.overdueDefects || 0}
            icon={AlertOctagon}
            variant="critical"
            onClick={() => navigate('/defects?overdue=true')}
          />
          <MetricCard
            title="Reinspection"
            value={metrics?.awaitingReinspection || 0}
            icon={TrendingUp}
            variant="info"
            onClick={() => navigate('/defects')}
          />
          <MetricCard
            title="Closed Defects"
            value={metrics?.closedDefects || 0}
            icon={CheckCircle2}
            variant="success"
            onClick={() => navigate('/defects')}
          />
        </div>
      )}

      {/* Charts Grid: Status, Severity & Ageing */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart 1: Defects by Status */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center justify-between">
              <span>Defects by Status</span>
              <span className="text-xs font-normal text-slate-400">Lifecycle stage</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statusChartData} margin={{ top: 10, right: 10, left: -25, bottom: 20 }}>
                  <XAxis dataKey="name" angle={-30} textAnchor="end" interval={0} tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {statusChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Chart 2: Defects by Severity */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center justify-between">
              <span>Defects by Severity</span>
              <span className="text-xs font-normal text-slate-400">Risk classification</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-60 w-full flex items-center justify-center">
              {severityChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={severityChartData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={75}
                      paddingAngle={3}
                    >
                      {severityChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-xs text-slate-400">No active defects</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Chart 3: Defect Ageing Breakdown */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center justify-between">
              <span>Defect Ageing Breakdown</span>
              <span className="text-xs font-normal text-slate-400">Days since logging</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ageingChartData} margin={{ top: 10, right: 10, left: -25, bottom: 20 }}>
                  <XAxis dataKey="bracket" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {ageingChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Priority Defects & Recent Activity Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Priority Defects Table */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-sm font-bold text-slate-900">
                  Priority Action Queue
                </CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">
                  Overdue items and critical severity defects requiring immediate attention
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/defects')}
                className="text-xs text-blue-600 hover:text-blue-700 h-8"
              >
                View all &rarr;
              </Button>
            </CardHeader>
            <CardContent>
              {priorityDefects.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  No critical or overdue defects detected in this scope.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-y border-slate-100">
                      <tr>
                        <th className="py-2.5 px-3">Defect ID</th>
                        <th className="py-2.5 px-3">Title</th>
                        <th className="py-2.5 px-3">Severity</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3">Due Date</th>
                        <th className="py-2.5 px-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {priorityDefects.map((d) => {
                        const overdue = isDefectOverdue(d.status, d.due_date);

                        return (
                          <tr
                            key={d.id}
                            onClick={() => navigate(`/defects/${d.id}`)}
                            className="hover:bg-slate-50 cursor-pointer"
                          >
                            <td className="py-2.5 px-3 font-mono font-bold text-blue-600">
                              {d.reference}
                            </td>
                            <td className="py-2.5 px-3 font-medium text-slate-900 max-w-xs truncate">
                              {d.title}
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
                                Inspect
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

        {/* Recent Activity Timeline */}
        <div>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Activity className="w-4 h-4 text-slate-500" />
                <span>Recent System Activity</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentActivities.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">No recent activity</p>
              ) : (
                <div className="space-y-3">
                  {recentActivities.map((act) => (
                    <div key={act.id} className="text-xs border-l-2 border-blue-500 pl-3 py-0.5">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-800 capitalize">
                          {act.action.replace('_', ' ')}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {formatDateTime(act.created_at)}
                        </span>
                      </div>
                      <p className="text-slate-600 truncate mt-0.5">
                        {act.entity_reference ? (
                          <span className="font-mono text-blue-600 mr-1">{act.entity_reference}:</span>
                        ) : null}
                        {act.user?.full_name || 'System'}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Contractor Performance Summary Table (Section 6 & 18) */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <HardHat className="w-4 h-4 text-amber-500" />
                <span>Contractor Performance & SLA Compliance</span>
              </CardTitle>
              <p className="text-xs text-slate-500 mt-0.5">
                Calculated rectification rates, overdue count, and average turnaround time
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/reports')}
              className="text-xs h-8"
            >
              Full Analytics &rarr;
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-y border-slate-100">
                <tr>
                  <th className="py-2.5 px-3">Contractor Organization</th>
                  <th className="py-2.5 px-3">Total Assigned</th>
                  <th className="py-2.5 px-3">Verified Closed</th>
                  <th className="py-2.5 px-3">Overdue</th>
                  <th className="py-2.5 px-3">Rejected Repairs</th>
                  <th className="py-2.5 px-3">Closure Rate (%)</th>
                  <th className="py-2.5 px-3">Avg Turnaround</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {contractorMetrics.map((c) => (
                  <tr key={c.contractorId} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-semibold text-slate-900">
                      {c.contractorName}
                    </td>
                    <td className="py-2.5 px-3">{c.totalAssigned}</td>
                    <td className="py-2.5 px-3 font-semibold text-emerald-600">{c.closed}</td>
                    <td className="py-2.5 px-3">
                      <span className={c.overdue > 0 ? 'text-red-600 font-bold' : 'text-slate-500'}>
                        {c.overdue}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={c.rejectedRectifications > 0 ? 'text-amber-600 font-bold' : 'text-slate-500'}>
                        {c.rejectedRectifications}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{c.closureRate}%</span>
                        <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              c.closureRate >= 75 ? 'bg-emerald-500' : c.closureRate >= 40 ? 'bg-amber-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${c.closureRate}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">{c.avgClosureDays} days</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
