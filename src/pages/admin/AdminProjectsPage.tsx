import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { projectService } from '@/services/projectService';
import { supabase } from '@/lib/supabase';
import { Project, Profile, ProjectStatus } from '@/types';
import { TableSkeleton } from '@/components/common/LoadingSkeleton';
import { formatDate, formatRoleLabel } from '@/lib/utils';
import {
  Building2,
  Plus,
  Search,
  Layers,
  Edit2,
  MapPin,
  Calendar,
  X,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

export const AdminProjectsPage: React.FC = () => {
  const navigate = useNavigate();

  const [projects, setProjects] = useState<Project[]>([]);
  const [managers, setManagers] = useState<Profile[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Edit / Create Project Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    site_address: '',
    status: 'active' as ProjectStatus,
    project_manager_id: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [projList, { data: pms }] = await Promise.all([
        projectService.getProjects(),
        supabase.from('profiles').select('*').in('role', ['project_manager', 'quality_manager', 'system_admin']),
      ]);
      setProjects(projList);
      setManagers((pms as Profile[]) || []);
    } catch (err) {
      console.warn('Error loading projects:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenCreate = () => {
    setEditingProjectId(null);
    setFormData({
      name: '',
      code: '',
      description: '',
      site_address: '',
      status: 'active',
      project_manager_id: managers.length > 0 ? managers[0].id : '',
      start_date: new Date().toISOString().split('T')[0],
      end_date: '',
    });
    setError('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (project: Project) => {
    setEditingProjectId(project.id);
    setFormData({
      name: project.name,
      code: project.code,
      description: project.description || '',
      site_address: project.site_address || '',
      status: project.status,
      project_manager_id: project.project_manager_id || '',
      start_date: project.start_date || '',
      end_date: project.end_date || '',
    });
    setError('');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.code.trim()) {
      setError('Project name and code are required.');
      return;
    }

    setIsSubmitting(true);
    setError('');
    try {
      if (editingProjectId) {
        await projectService.updateProject(editingProjectId, {
          name: formData.name,
          code: formData.code,
          description: formData.description || null,
          site_address: formData.site_address || null,
          status: formData.status,
          project_manager_id: formData.project_manager_id || null,
          start_date: formData.start_date || null,
          end_date: formData.end_date || null,
        });
      } else {
        await projectService.createProject({
          name: formData.name,
          code: formData.code,
          description: formData.description || null,
          site_address: formData.site_address || null,
          status: formData.status,
          project_manager_id: formData.project_manager_id || null,
          start_date: formData.start_date || null,
          end_date: formData.end_date || null,
        });
      }

      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to save project.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filtered = projects.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.code.toLowerCase().includes(search.toLowerCase()) ||
      (p.site_address && p.site_address.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Projects Administration
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure construction sites, project codes, assigned project managers, and hierarchies
          </p>
        </div>

        <Button size="sm" onClick={handleOpenCreate} className="gap-1.5 font-semibold bg-blue-600 hover:bg-blue-700 text-white">
          <Plus className="w-4 h-4" />
          Create New Project
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search projects by title, code, or address..."
            className="w-full pl-9 pr-4 py-2 text-sm rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          />
        </div>
      </div>

      {/* Projects Table */}
      {isLoading ? (
        <TableSkeleton rows={5} />
      ) : (
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Code</th>
                  <th className="py-3 px-4">Project Name & Address</th>
                  <th className="py-3 px-4">Project Manager</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Hierarchy Blocks</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-mono font-bold text-xs text-blue-600">
                      {p.code}
                    </td>
                    <td className="py-3 px-4 max-w-xs">
                      <p className="font-bold text-slate-900 truncate">{p.name}</p>
                      <p className="text-xs text-slate-400 truncate">{p.site_address || 'No address'}</p>
                    </td>
                    <td className="py-3 px-4 text-xs">
                      {p.project_manager?.full_name || 'Senior PM'}
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider bg-emerald-100 text-emerald-800">
                        {p.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs font-semibold text-slate-700">
                      {p.buildings_count || 0} Blocks
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/projects/${p.id}/locations`)}
                        className="text-xs h-7 gap-1"
                      >
                        <Layers className="w-3.5 h-3.5" />
                        Hierarchy
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenEdit(p)}
                        className="text-xs h-7 text-blue-600 hover:text-blue-700"
                      >
                        <Edit2 className="w-3.5 h-3.5 mr-1" />
                        Edit
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit / Create Project Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full border border-slate-200 overflow-hidden">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-400" />
                <h3 className="font-semibold text-sm">
                  {editingProjectId ? 'Edit Construction Project' : 'Create New Construction Project'}
                </h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-4">
              {error && (
                <div className="p-2.5 bg-red-50 text-red-600 text-xs rounded border border-red-200">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                    Project Name <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                    Code <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Site Address / Street
                </label>
                <Input
                  value={formData.site_address}
                  onChange={(e) => setFormData({ ...formData, site_address: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Project Manager
                </label>
                <select
                  value={formData.project_manager_id}
                  onChange={(e) => setFormData({ ...formData, project_manager_id: e.target.value })}
                  className="w-full text-sm rounded border border-slate-300 p-2 bg-white"
                >
                  <option value="">Unassigned</option>
                  {managers.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.full_name} ({formatRoleLabel(m.role)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Description
                </label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value as ProjectStatus })
                    }
                    className="w-full text-sm rounded border border-slate-300 p-2 bg-white"
                  >
                    <option value="active">Active</option>
                    <option value="planning">Planning</option>
                    <option value="on_hold">On Hold</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                    Start Date
                  </label>
                  <Input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
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
