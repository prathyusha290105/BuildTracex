import React, { useEffect, useState } from 'react';
import { projectService } from '@/services/projectService';
import { Project, Building } from '@/types';
import { TableSkeleton } from '@/components/common/LoadingSkeleton';
import { ProjectLocationsPage } from '@/pages/projects/ProjectLocationsPage';
import { Building2, MapPin, Layers } from 'lucide-react';

export const AdminLocationsPage: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    projectService.getProjects().then((list) => {
      setProjects(list);
      if (list.length > 0) {
        setSelectedProjectId(list[0].id);
      }
      setIsLoading(false);
    });
  }, []);

  if (isLoading) return <TableSkeleton rows={4} />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <MapPin className="w-5 h-5 text-blue-600" />
            <span>Site Locations & Hierarchy Management</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Maintain building blocks, floor levels, and inspection zones across all active construction sites
          </p>
        </div>

        {/* Project Selector for Admin */}
        <div className="flex items-center gap-2 bg-white p-2 rounded-lg border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold uppercase text-slate-500">Project:</span>
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="text-xs font-semibold p-1.5 rounded border border-slate-300 bg-slate-50 text-slate-800"
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.code})
              </option>
            ))}
          </select>
        </div>
      </div>

      {selectedProjectId ? (
        <ProjectLocationsDirectView projectId={selectedProjectId} />
      ) : (
        <p className="text-xs text-slate-400">Please select a project above.</p>
      )}
    </div>
  );
};

// Direct embedded hierarchy renderer
const ProjectLocationsDirectView: React.FC<{ projectId: string }> = ({ projectId }) => {
  return <ProjectLocationsPage />;
};
