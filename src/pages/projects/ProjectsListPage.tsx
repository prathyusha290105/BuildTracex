import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { projectService } from '@/services/projectService';
import { Project, ProjectStatus } from '@/types';
import { TableSkeleton } from '@/components/common/LoadingSkeleton';
import { EmptyState } from '@/components/common/EmptyState';
import { formatDate } from '@/lib/utils';
import {
  Building2,
  Plus,
  Search,
  MapPin,
  Calendar,
  AlertTriangle,
  ClipboardCheck,
  ArrowRight,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';

export const ProjectsListPage: React.FC = () => {
  const { canManageProject, isAdmin } = useAuth();
  const navigate = useNavigate();

  const [projects, setProjects] = useState<Project[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);

  // New Project modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newProject, setNewProject] = useState({
    name: '',
    code: '',
    description: '',
    site_address: '',
    status: 'active' as ProjectStatus,
    start_date: new Date().toISOString().split('T')[0],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const loadProjects = async () => {
    setIsLoading(true);
    try {
      const data = await projectService.getProjects();
      setProjects(data);
    } catch (err) {
      console.warn('Error fetching projects:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProject.name || !newProject.code) {
      setFormError('Project name and unique code are required.');
      return;
    }

    setIsSubmitting(true);
    setFormError('');
    try {
      await projectService.createProject(newProject);
      setIsModalOpen(false);
      setNewProject({
        name: '',
        code: '',
        description: '',
        site_address: '',
        status: 'active',
        start_date: new Date().toISOString().split('T')[0],
      });
      loadProjects();
    } catch (err: any) {
      setFormError(err.message || 'Failed to create project.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredProjects = projects.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.code.toLowerCase().includes(search.toLowerCase()) ||
      (p.site_address && p.site_address.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Construction Projects & Sites
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage multi-tower construction sites, site hierarchies, and quality scopes
          </p>
        </div>

        {canManageProject() && (
          <Button onClick={() => setIsModalOpen(true)} size="sm" className="gap-1.5 font-semibold">
            <Plus className="w-4 h-4" />
            Add New Project
          </Button>
        )}
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search projects by name, code (e.g. PRJ-NRA-01) or location..."
            className="w-full pl-9 pr-4 py-2 text-sm rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="text-xs h-9 px-3 rounded-md border border-slate-300 bg-white text-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
        >
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="planning">Planning</option>
          <option value="on_hold">On Hold</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      {/* Projects Grid */}
      {isLoading ? (
        <TableSkeleton rows={4} />
      ) : filteredProjects.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No projects found"
          description="Try changing your search terms or create a new construction project."
          actionLabel={canManageProject() ? 'Add Project' : undefined}
          onAction={() => setIsModalOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProjects.map((p) => (
            <Card
              key={p.id}
              onClick={() => navigate(`/projects/${p.id}`)}
              className="hover:shadow-md transition-shadow cursor-pointer border-slate-200 flex flex-col justify-between"
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      {p.code}
                    </span>
                    <h3 className="font-bold text-base text-slate-900 mt-2 line-clamp-1">{p.name}</h3>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                      p.status === 'active'
                        ? 'bg-emerald-100 text-emerald-800'
                        : p.status === 'planning'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {p.status}
                  </span>
                </div>

                {p.description && (
                  <p className="text-xs text-slate-500 line-clamp-2 mb-3">{p.description}</p>
                )}

                {p.site_address && (
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-4">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <span className="truncate">{p.site_address}</span>
                  </div>
                )}

                {/* Counters row */}
                <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100 text-center">
                  <div className="bg-slate-50 p-2 rounded">
                    <span className="block text-sm font-bold text-slate-800">
                      {p.buildings_count || 0}
                    </span>
                    <span className="text-[10px] text-slate-500 uppercase">Blocks</span>
                  </div>
                  <div className="bg-amber-50 p-2 rounded">
                    <span className="block text-sm font-bold text-amber-700">
                      {p.open_defects_count || 0}
                    </span>
                    <span className="text-[10px] text-amber-600 uppercase">Open Snags</span>
                  </div>
                  <div className="bg-slate-50 p-2 rounded">
                    <span className="block text-sm font-bold text-slate-800">
                      {p.total_defects_count || 0}
                    </span>
                    <span className="text-[10px] text-slate-500 uppercase">Total Logged</span>
                  </div>
                </div>
              </CardContent>

              <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-blue-600 font-semibold px-5">
                <span>View Site Hierarchy & Details</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* New Project Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-900 text-white">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-400" />
                <h3 className="font-semibold text-sm">Add New Construction Project</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="p-5 space-y-4">
              {formError && (
                <div className="p-2.5 bg-red-50 text-red-600 text-xs rounded border border-red-200">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                    Project Name <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={newProject.name}
                    onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                    placeholder="e.g. Northstar Residential Block A"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                    Code <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={newProject.code}
                    onChange={(e) => setNewProject({ ...newProject, code: e.target.value.toUpperCase() })}
                    placeholder="PRJ-NRA-01"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Site Address / Location
                </label>
                <Input
                  value={newProject.site_address}
                  onChange={(e) => setNewProject({ ...newProject, site_address: e.target.value })}
                  placeholder="Plot 45, Sector 8, Metroville..."
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Project Description
                </label>
                <Textarea
                  value={newProject.description}
                  onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                  placeholder="Scope of towers, floors, and finishing specifications..."
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                    Status
                  </label>
                  <select
                    value={newProject.status}
                    onChange={(e) =>
                      setNewProject({ ...newProject, status: e.target.value as ProjectStatus })
                    }
                    className="w-full text-sm rounded-md border border-slate-300 bg-white p-2 text-slate-800"
                  >
                    <option value="active">Active</option>
                    <option value="planning">Planning</option>
                    <option value="on_hold">On Hold</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                    Start Date
                  </label>
                  <Input
                    type="date"
                    value={newProject.start_date}
                    onChange={(e) => setNewProject({ ...newProject, start_date: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="default" size="sm" isLoading={isSubmitting}>
                  Save Project
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
