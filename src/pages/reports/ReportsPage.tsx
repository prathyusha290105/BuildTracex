import React, { useEffect, useState } from 'react';
import { useProject } from '@/context/ProjectContext';
import { reportService } from '@/services/reportService';
import { defectService } from '@/services/defectService';
import { contractorService } from '@/services/contractorService';
import {
  DashboardMetrics,
  ContractorPerformanceMetric,
  Defect,
  Contractor,
} from '@/types';
import { TableSkeleton } from '@/components/common/LoadingSkeleton';
import {
  BarChart3,
  FileDown,
  Calendar,
  Filter,
  HardHat,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Layers,
  TrendingUp,
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

export const ReportsPage: React.FC = () => {
  const { selectedProjectId, selectedProject } = useProject();

  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [contractorMetrics, setContractorMetrics] = useState<ContractorPerformanceMetric[]>([]);
  const [defects, setDefects] = useState<Defect[]>([]);
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');

  useEffect(() => {
    async function loadReportData() {
      setIsLoading(true);
      try {
        const [dashMetrics, cMetrics, defsResult, cList] = await Promise.all([
          reportService.getDashboardMetrics(selectedProjectId),
          reportService.getContractorPerformanceMetrics(selectedProjectId),
          defectService.getDefects({ projectId: selectedProjectId }),
          contractorService.getContractors(),
        ]);
        setMetrics(dashMetrics);
        setContractorMetrics(cMetrics);
        setDefects(defsResult.defects);
        setContractors(cList.filter((c) => c.is_active));
      } catch (err) {
        console.warn('Error loading reports:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadReportData();
  }, [selectedProjectId]);

  const handleExportDefectRegister = () => {
    const scopeDesc = selectedProject ? selectedProject.name : 'All Active Projects';
    reportService.generateDefectRegisterPDF(defects, scopeDesc);
  };

  // Ageing bracket chart data
  const ageingData = metrics
    ? [
        { bracket: '0–3 days', count: metrics.ageing['0-3'], fill: '#10b981' },
        { bracket: '4–7 days', count: metrics.ageing['4-7'], fill: '#3b82f6' },
        { bracket: '8–14 days', count: metrics.ageing['8-14'], fill: '#f59e0b' },
        { bracket: '15–30 days', count: metrics.ageing['15-30'], fill: '#f97316' },
        { bracket: '30+ days (Overdue)', count: metrics.ageing['30+'], fill: '#dc2626' },
      ]
    : [];

  // Group defects by category for Quality Trends
  const categoryCounts: Record<string, number> = {};
  defects.forEach((d) => {
    const cat = d.category || 'General';
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
  });

  const categoryChartData = Object.entries(categoryCounts).map(([cat, count], i) => {
    const colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#64748b'];
    return {
      name: cat,
      count,
      fill: colors[i % colors.length],
    };
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Quality Analytics & Performance Reports
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit trailing, defect ageing breakdowns, contractor SLA turnaround, and official PDF exports
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={handleExportDefectRegister}
            className="gap-1.5 font-semibold bg-blue-600 hover:bg-blue-700 text-white"
          >
            <FileDown className="w-4 h-4" />
            Download Complete Defect Register (PDF)
          </Button>
        </div>
      </div>

      {/* Scope banner */}
      <div className="p-4 bg-white rounded-lg border border-slate-200 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs">
          <span className="font-semibold text-slate-500 uppercase tracking-wider">Report Scope:</span>
          <span className="font-bold text-slate-900 bg-slate-100 px-2.5 py-1 rounded">
            {selectedProject ? `${selectedProject.name} (${selectedProject.code})` : 'All Active Projects'}
          </span>
        </div>
        <span className="text-xs text-slate-400">
          Generated on {new Date().toLocaleDateString()}
        </span>
      </div>

      {/* SECTION 1: DEFECT AGEING BREAKDOWN (Section 18 requirement) */}
      <Card>
        <CardHeader className="pb-3 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-500" />
                <span>Defect Ageing Breakdown (Days from Creation)</span>
              </CardTitle>
              <p className="text-xs text-slate-500 mt-0.5">
                Standardized 5-tier ageing classification for operational escalation
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          {/* Ageing 5-tier summary metric cards */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
            <div className="p-3.5 rounded-lg border border-emerald-200 bg-emerald-50/50 text-center">
              <span className="text-[11px] font-bold uppercase text-emerald-800 tracking-wider">0–3 Days</span>
              <span className="block text-2xl font-bold text-emerald-700 mt-1">
                {metrics?.ageing['0-3'] || 0}
              </span>
              <span className="text-[10px] text-emerald-600">Fresh snags</span>
            </div>

            <div className="p-3.5 rounded-lg border border-blue-200 bg-blue-50/50 text-center">
              <span className="text-[11px] font-bold uppercase text-blue-800 tracking-wider">4–7 Days</span>
              <span className="block text-2xl font-bold text-blue-700 mt-1">
                {metrics?.ageing['4-7'] || 0}
              </span>
              <span className="text-[10px] text-blue-600">Active window</span>
            </div>

            <div className="p-3.5 rounded-lg border border-amber-200 bg-amber-50/50 text-center">
              <span className="text-[11px] font-bold uppercase text-amber-800 tracking-wider">8–14 Days</span>
              <span className="block text-2xl font-bold text-amber-700 mt-1">
                {metrics?.ageing['8-14'] || 0}
              </span>
              <span className="text-[10px] text-amber-600">Nearing SLA</span>
            </div>

            <div className="p-3.5 rounded-lg border border-orange-200 bg-orange-50/50 text-center">
              <span className="text-[11px] font-bold uppercase text-orange-800 tracking-wider">15–30 Days</span>
              <span className="block text-2xl font-bold text-orange-700 mt-1">
                {metrics?.ageing['15-30'] || 0}
              </span>
              <span className="text-[10px] text-orange-600">Escalated</span>
            </div>

            <div className="p-3.5 rounded-lg border border-red-200 bg-red-50/50 text-center">
              <span className="text-[11px] font-bold uppercase text-red-800 tracking-wider">30+ Days</span>
              <span className="block text-2xl font-bold text-red-700 mt-1">
                {metrics?.ageing['30+'] || 0}
              </span>
              <span className="text-[10px] text-red-600 font-bold">Critical Overdue</span>
            </div>
          </div>

          {/* Ageing Chart */}
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ageingData} margin={{ top: 10, right: 10, left: -20, bottom: 10 }}>
                <XAxis dataKey="bracket" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {ageingData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* SECTION 2: CONTRACTOR PERFORMANCE MATRIX (Section 18 requirement) */}
      <Card>
        <CardHeader className="pb-3 border-b border-slate-100">
          <div>
            <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <HardHat className="w-4 h-4 text-blue-600" />
              <span>Contractor Performance & Quality Compliance Matrix</span>
            </CardTitle>
            <p className="text-xs text-slate-500 mt-0.5">
              Formulas: Closure Rate = (Closed / Total Assigned) * 100 &bull; Turnaround = Average days from creation to verified closure
            </p>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Contractor Company</th>
                  <th className="py-3 px-4">Total Assigned</th>
                  <th className="py-3 px-4">Verified Closed</th>
                  <th className="py-3 px-4">Overdue Snags</th>
                  <th className="py-3 px-4">Rejected Repairs</th>
                  <th className="py-3 px-4">Closure Rate (%)</th>
                  <th className="py-3 px-4">Avg Turnaround</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {contractorMetrics.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-6 text-center text-slate-400">
                      No contractor records available
                    </td>
                  </tr>
                ) : (
                  contractorMetrics.map((c) => (
                    <tr key={c.contractorId} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-bold text-slate-900">{c.contractorName}</td>
                      <td className="py-3 px-4">{c.totalAssigned}</td>
                      <td className="py-3 px-4 font-semibold text-emerald-600">{c.closed}</td>
                      <td className="py-3 px-4">
                        <span className={c.overdue > 0 ? 'text-red-600 font-bold' : 'text-slate-500'}>
                          {c.overdue}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={c.rejectedRectifications > 0 ? 'text-amber-600 font-bold' : 'text-slate-500'}>
                          {c.rejectedRectifications}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-bold">{c.closureRate}%</span>
                          <div className="w-20 h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                c.closureRate >= 75 ? 'bg-emerald-500' : c.closureRate >= 40 ? 'bg-amber-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${c.closureRate}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-700">{c.avgClosureDays} days</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* SECTION 3: QUALITY TRENDS BY TRADE / CATEGORY */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-sm font-bold text-slate-900">
              Defects Grouped by Construction Category / Trade
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-64 w-full">
              {categoryChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryChartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                    <XAxis dataKey="name" angle={-25} textAnchor="end" interval={0} tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {categoryChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-xs text-slate-400 text-center py-10">No categories to display</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Trade breakdown list */}
        <Card>
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-sm font-bold text-slate-900">
              Category Recurrence Frequency
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5">
            <div className="space-y-3">
              {categoryChartData.map((cat) => {
                const percent = defects.length > 0 ? Math.round((cat.count / defects.length) * 100) : 0;

                return (
                  <div key={cat.name} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-800">{cat.name}</span>
                      <span className="text-slate-500 font-mono">
                        {cat.count} snags ({percent}%)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${percent}%`, backgroundColor: cat.fill }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
