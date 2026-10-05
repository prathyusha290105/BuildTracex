import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useProject } from '@/context/ProjectContext';
import { inspectionService } from '@/services/inspectionService';
import { Inspection } from '@/types';
import { TableSkeleton } from '@/components/common/LoadingSkeleton';
import { EmptyState } from '@/components/common/EmptyState';
import { StatusBadge } from '@/components/common/StatusBadge';
import { formatDate } from '@/lib/utils';
import {
  ClipboardCheck,
  Plus,
  Search,
  Eye,
  Calendar,
  MapPin,
  FileSpreadsheet,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export const InspectionsListPage: React.FC = () => {
  const { canConductInspection } = useAuth();
  const { selectedProjectId } = useProject();
  const navigate = useNavigate();

  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadInspections() {
      setIsLoading(true);
      try {
        const list = await inspectionService.getInspections(selectedProjectId);
        setInspections(list);
      } catch (err) {
        console.warn('Error loading inspections:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadInspections();
  }, [selectedProjectId]);

  const filtered = inspections.filter((insp) => {
    const term = search.toLowerCase();
    return (
      (insp.reference && insp.reference.toLowerCase().includes(term)) ||
      insp.template_name_snapshot.toLowerCase().includes(term) ||
      (insp.inspector?.full_name && insp.inspector.full_name.toLowerCase().includes(term)) ||
      (insp.project?.name && insp.project.name.toLowerCase().includes(term))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Site Quality Inspections
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Log and review quality checklist audits conducted across blocks, floors, and zones
          </p>
        </div>

        {canConductInspection() && (
          <Button
            size="sm"
            onClick={() => navigate('/inspections/new')}
            className="gap-1.5 font-semibold"
          >
            <Plus className="w-4 h-4" />
            Start Site Inspection
          </Button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search inspections by reference (e.g. INS-0001), template, or inspector..."
            className="w-full pl-9 pr-4 py-2 text-sm rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          />
        </div>
      </div>

      {/* Inspections Table */}
      {isLoading ? (
        <TableSkeleton rows={5} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={ClipboardCheck}
          title="No site inspections found"
          description="Execute your first quality checklist audit for this project."
          actionLabel={canConductInspection() ? 'Start Inspection' : undefined}
          onAction={() => navigate('/inspections/new')}
        />
      ) : (
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Inspection Ref</th>
                  <th className="py-3 px-4">Checklist Protocol</th>
                  <th className="py-3 px-4">Project & Location</th>
                  <th className="py-3 px-4">Inspector</th>
                  <th className="py-3 px-4">Audit Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((insp) => (
                  <tr
                    key={insp.id}
                    onClick={() => navigate(`/inspections/${insp.id}`)}
                    className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4 font-mono font-bold text-xs text-blue-600">
                      {insp.reference}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {insp.template_name_snapshot}
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-500 max-w-xs">
                      <p className="font-medium text-slate-800 truncate">
                        {insp.project?.name || '—'}
                      </p>
                      <p className="text-slate-400 truncate">
                        {[insp.building?.name, insp.floor?.name, insp.zone?.name]
                          .filter(Boolean)
                          .join(' > ') || 'Entire Site'}
                      </p>
                    </td>
                    <td className="py-3 px-4 text-xs">{insp.inspector?.full_name || 'QA Team'}</td>
                    <td className="py-3 px-4 text-xs whitespace-nowrap">
                      {formatDate(insp.inspection_date)}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={insp.status} />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/inspections/${insp.id}`);
                        }}
                        className="text-slate-500 hover:text-blue-600 h-8 px-2"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Dossier
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
