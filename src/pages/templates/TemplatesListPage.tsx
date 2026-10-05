import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { templateService } from '@/services/templateService';
import { InspectionTemplate } from '@/types';
import { TableSkeleton } from '@/components/common/LoadingSkeleton';
import { EmptyState } from '@/components/common/EmptyState';
import { formatDate } from '@/lib/utils';
import {
  FileSpreadsheet,
  Plus,
  Search,
  Eye,
  Edit2,
  CheckCircle2,
  XCircle,
  FileText,
  X,
  Layers,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export const TemplatesListPage: React.FC = () => {
  const { hasRole } = useAuth();
  const navigate = useNavigate();

  const [templates, setTemplates] = useState<InspectionTemplate[]>([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  // Preview modal state
  const [previewTemplate, setPreviewTemplate] = useState<InspectionTemplate | null>(null);

  const canEdit = hasRole(['system_admin', 'quality_manager']);

  const loadTemplates = async () => {
    setIsLoading(true);
    try {
      const data = await templateService.getTemplates();
      setTemplates(data);
    } catch (err) {
      console.warn('Error loading templates:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  const handleOpenPreview = async (templateId: string) => {
    try {
      const full = await templateService.getTemplateById(templateId);
      setPreviewTemplate(full);
    } catch (err) {
      console.warn('Could not fetch template for preview:', err);
    }
  };

  const handleToggleActive = async (id: string, current: boolean) => {
    await templateService.toggleActive(id, !current);
    loadTemplates();
  };

  const filtered = templates.filter((t) => {
    const matchesSearch =
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      (t.category && t.category.toLowerCase().includes(search.toLowerCase())) ||
      (t.description && t.description.toLowerCase().includes(search.toLowerCase()));

    const matchesCat = categoryFilter === 'all' || t.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  const categories = Array.from(new Set(templates.map((t) => t.category).filter(Boolean)));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Inspection Templates & Checklists
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Standardized QA/QC checklist protocols for structural, finishing, and MEP inspections
          </p>
        </div>

        {canEdit && (
          <Button
            size="sm"
            onClick={() => navigate('/inspection-templates/new')}
            className="gap-1.5 font-semibold"
          >
            <Plus className="w-4 h-4" />
            Create New Template
          </Button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search templates by title, discipline, or scope..."
            className="w-full pl-9 pr-4 py-2 text-sm rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          />
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="text-xs h-9 px-3 rounded-md border border-slate-300 bg-white text-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
        >
          <option value="all">All Disciplines</option>
          {categories.map((c) => (
            <option key={c} value={c as string}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {/* Templates Grid */}
      {isLoading ? (
        <TableSkeleton rows={4} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={FileSpreadsheet}
          title="No inspection templates found"
          description="Create standard inspection checklists for your QA team to execute on-site."
          actionLabel={canEdit ? 'Create Template' : undefined}
          onAction={() => navigate('/inspection-templates/new')}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((tmpl) => (
            <Card
              key={tmpl.id}
              className="hover:shadow-md transition-shadow border-slate-200 flex flex-col justify-between"
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    {tmpl.category || 'General Quality'}
                  </span>
                  <button
                    onClick={() => handleToggleActive(tmpl.id, tmpl.is_active)}
                    title="Toggle active status"
                    className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                      tmpl.is_active
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {tmpl.is_active ? 'Active' : 'Inactive'}
                  </button>
                </div>

                <h3 className="font-bold text-base text-slate-900 mt-1">{tmpl.name}</h3>

                {tmpl.description && (
                  <p className="text-xs text-slate-500 line-clamp-2 mt-2">{tmpl.description}</p>
                )}

                <div className="flex items-center justify-between text-xs text-slate-400 pt-4 mt-3 border-t border-slate-100">
                  <span className="font-semibold text-slate-700">
                    {tmpl.items_count || 0} Checklist Items
                  </span>
                  <span>Updated {formatDate(tmpl.updated_at)}</span>
                </div>
              </CardContent>

              <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2 px-5">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleOpenPreview(tmpl.id)}
                  className="h-8 text-xs text-slate-600 hover:text-slate-900"
                >
                  <Eye className="w-3.5 h-3.5 mr-1" />
                  Preview
                </Button>

                {canEdit && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/inspection-templates/${tmpl.id}`)}
                    className="h-8 text-xs text-blue-600 border-blue-200 hover:bg-blue-50"
                  >
                    <Edit2 className="w-3.5 h-3.5 mr-1" />
                    Edit
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Preview Modal */}
      {previewTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-in fade-in">
          <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-900 text-white">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-blue-400" />
                <div>
                  <h3 className="font-bold text-sm">{previewTemplate.name}</h3>
                  <span className="text-[10px] text-slate-300">
                    {previewTemplate.category || 'General'} &bull; {previewTemplate.items?.length || 0} questions
                  </span>
                </div>
              </div>
              <button
                onClick={() => setPreviewTemplate(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              {previewTemplate.instructions && (
                <div className="p-3 bg-blue-50 text-blue-900 text-xs rounded border border-blue-200">
                  <span className="font-bold uppercase tracking-wider block mb-0.5">
                    Field Instructions:
                  </span>
                  {previewTemplate.instructions}
                </div>
              )}

              <div className="divide-y divide-slate-100">
                {(previewTemplate.items || []).map((item, idx) => (
                  <div key={item.id} className="py-3 flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                      {item.description && (
                        <p className="text-xs text-slate-500 mt-0.5">{item.description}</p>
                      )}
                      <div className="flex items-center gap-2 mt-1.5 text-[10px] text-slate-400">
                        {item.requires_remarks && <span className="bg-slate-100 px-1.5 py-0.5 rounded">Remarks mandatory if fail</span>}
                        {item.requires_photo && <span className="bg-slate-100 px-1.5 py-0.5 rounded">Photo mandatory if fail</span>}
                        {item.default_severity && (
                          <span className="bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded uppercase font-semibold">
                            Default Severity: {item.default_severity}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-end">
              <Button size="sm" variant="outline" onClick={() => setPreviewTemplate(null)}>
                Close Preview
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
