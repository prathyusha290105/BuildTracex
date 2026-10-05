import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, NavLink } from 'react-router-dom';
import { projectService } from '@/services/projectService';
import { defectService } from '@/services/defectService';
import { inspectionService } from '@/services/inspectionService';
import { Project, Defect, Inspection } from '@/types';
import { DetailSkeleton } from '@/components/common/LoadingSkeleton';
import { StatusBadge } from '@/components/common/StatusBadge';
import { DefectTable } from '@/components/defects/DefectTable';
import { formatDate } from '@/lib/utils';
import {
  Building2,
  MapPin,
  Calendar,
  Layers,
  ClipboardCheck,
  AlertTriangle,
  ArrowLeft,
  ChevronRight,
  Plus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export const ProjectDetailPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();

  const [project, setProject] = useState<Project | null>(null);
  const [defects, setDefects] = useState<Defect[]>([]);
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [activeTab, setActiveTab] = useState<'defects' | 'inspections'>('defects');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (!projectId) return;
      setIsLoading(true);
      try {
        const [proj, defsResult, insps] = await Promise.all([
          projectService.getProjectById(projectId),
          defectService.getDefects({ projectId }),
          inspectionService.getInspections(projectId),
        ]);
        setProject(proj);
        setDefects(defsResult.defects);
        setInspections(insps);
      } catch (err) {
        console.warn('Error loading project detail:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [projectId]);

  if (isLoading) return <DetailSkeleton />;

  if (!project) {
    return (
      <div className="p-8 text-center bg-white rounded-lg border border-slate-200">
        <p className="text-slate-500 mb-4">Project not found or you lack permission to view it.</p>
        <Button variant="outline" onClick={() => navigate('/projects')}>
          Back to Projects
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back button & Breadcrumbs */}
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <NavLink to="/projects" className="hover:text-blue-600 flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Projects</span>
        </NavLink>
        <ChevronRight className="w-3 h-3 text-slate-300" />
        <span className="font-semibold text-slate-800">{project.name}</span>
      </div>

      {/* Project Overview Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  {project.code}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider bg-emerald-100 text-emerald-800">
                  {project.status}
                </span>
              </div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{project.name}</h1>
              {project.site_address && (
                <p className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>{project.site_address}</span>
                </p>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="default"
                size="sm"
                onClick={() => navigate(`/projects/${project.id}/locations`)}
                className="gap-1.5 font-semibold"
              >
                <Layers className="w-4 h-4" />
                Explore Site Hierarchy
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/inspections/new?projectId=${project.id}`)}
                className="gap-1.5"
              >
                <ClipboardCheck className="w-4 h-4" />
                New Inspection
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 text-xs">
            <div>
              <span className="text-slate-400 block uppercase tracking-wider font-semibold">Start Date</span>
              <span className="font-medium text-slate-800 mt-0.5 block">{formatDate(project.start_date)}</span>
            </div>
            <div>
              <span className="text-slate-400 block uppercase tracking-wider font-semibold">Project Manager</span>
              <span className="font-medium text-slate-800 mt-0.5 block">{project.project_manager?.full_name || 'Senior PM'}</span>
            </div>
            <div>
              <span className="text-slate-400 block uppercase tracking-wider font-semibold">Total Defects</span>
              <span className="font-bold text-slate-900 mt-0.5 block text-sm">{defects.length}</span>
            </div>
            <div>
              <span className="text-slate-400 block uppercase tracking-wider font-semibold">Inspections Conducted</span>
              <span className="font-bold text-slate-900 mt-0.5 block text-sm">{inspections.length}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs: Defects vs Inspections */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-200">
          <button
            onClick={() => setActiveTab('defects')}
            className={`pb-2.5 px-4 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'defects'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            <span>Project Defects ({defects.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('inspections')}
            className={`pb-2.5 px-4 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'inspections'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ClipboardCheck className="w-4 h-4" />
            <span>Inspection Audits ({inspections.length})</span>
          </button>
        </div>

        {activeTab === 'defects' ? (
          <DefectTable defects={defects} />
        ) : (
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Inspection Ref</th>
                  <th className="py-3 px-4">Template Checklist</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">Inspector</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {inspections.map((insp) => (
                  <tr
                    key={insp.id}
                    onClick={() => navigate(`/inspections/${insp.id}`)}
                    className="hover:bg-slate-50 cursor-pointer"
                  >
                    <td className="py-3 px-4 font-mono font-bold text-xs text-blue-600">
                      {insp.reference}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {insp.template_name_snapshot}
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-500">
                      {[insp.building?.name, insp.floor?.name, insp.zone?.name].filter(Boolean).join(' > ') || '—'}
                    </td>
                    <td className="py-3 px-4 text-xs">{insp.inspector?.full_name || 'QA Team'}</td>
                    <td className="py-3 px-4 text-xs">{formatDate(insp.inspection_date)}</td>
                    <td className="py-3 px-4">
                      <StatusBadge status={insp.status} />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="text-blue-600 font-semibold hover:underline text-xs">
                        View Audit
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
