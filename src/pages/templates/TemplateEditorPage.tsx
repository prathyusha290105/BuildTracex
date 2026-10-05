import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, NavLink } from 'react-router-dom';
import { templateService } from '@/services/templateService';
import { InspectionTemplate, TemplateItem, DefectSeverity } from '@/types';
import { DetailSkeleton } from '@/components/common/LoadingSkeleton';
import {
  FileSpreadsheet,
  Plus,
  Trash2,
  ArrowLeft,
  ChevronRight,
  Eye,
  Edit3,
  Check,
  Save,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export const TemplateEditorPage: React.FC = () => {
  const { templateId } = useParams<{ templateId: string }>();
  const isEditing = Boolean(templateId);
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [instructions, setInstructions] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [items, setItems] = useState<Array<Partial<TemplateItem>>>([
    {
      id: crypto.randomUUID(),
      title: 'Surface finish smoothness and uniformity',
      description: 'Check for even texture and lack of tooling ripples.',
      requires_remarks: false,
      requires_photo: true,
      default_severity: 'medium',
      sort_order: 1,
    },
  ]);

  const [isLoading, setIsLoading] = useState(isEditing);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isEditing && templateId) {
      setIsLoading(true);
      templateService
        .getTemplateById(templateId)
        .then((tmpl) => {
          setName(tmpl.name);
          setCategory(tmpl.category || '');
          setDescription(tmpl.description || '');
          setInstructions(tmpl.instructions || '');
          setIsActive(tmpl.is_active);
          setItems(
            (tmpl.items || []).map((it) => ({
              ...it,
            }))
          );
        })
        .catch((err) => {
          setError('Failed to load template.');
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [isEditing, templateId]);

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        title: '',
        description: '',
        requires_remarks: false,
        requires_photo: false,
        default_severity: 'medium',
        sort_order: prev.length + 1,
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateItem = (index: number, updates: Partial<TemplateItem>) => {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, ...updates } : item))
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Template name is mandatory.');
      return;
    }

    if (items.length === 0) {
      setError('Please add at least one checklist item.');
      return;
    }

    for (let i = 0; i < items.length; i++) {
      if (!items[i].title?.trim()) {
        setError(`Checklist item #${i + 1} requires a title.`);
        return;
      }
    }

    setIsSaving(true);
    setError('');

    try {
      const templatePayload = {
        name,
        category: category || null,
        description: description || null,
        instructions: instructions || null,
        is_active: isActive,
      };

      const itemsPayload = items.map((it, idx) => ({
        title: it.title!,
        description: it.description || null,
        sort_order: idx + 1,
        requires_remarks: Boolean(it.requires_remarks),
        requires_photo: Boolean(it.requires_photo),
        default_severity: (it.default_severity as DefectSeverity) || 'medium',
      }));

      if (isEditing && templateId) {
        await templateService.updateTemplate(templateId, templatePayload, itemsPayload);
      } else {
        await templateService.createTemplate(templatePayload, itemsPayload);
      }

      navigate('/inspection-templates');
    } catch (err: any) {
      setError(err.message || 'Failed to save inspection template');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <DetailSkeleton />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <NavLink to="/inspection-templates" className="hover:text-blue-600 flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Inspection Templates</span>
          </NavLink>
          <ChevronRight className="w-3 h-3 text-slate-300" />
          <span className="font-semibold text-slate-800">
            {isEditing ? `Edit: ${name}` : 'New Template Protocol'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            <button
              type="button"
              onClick={() => setActiveTab('editor')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                activeTab === 'editor' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              Editor
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('preview')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                activeTab === 'preview' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              Live Preview
            </button>
          </div>

          <Button
            onClick={handleSave}
            size="sm"
            variant="default"
            className="gap-1.5 font-semibold"
            isLoading={isSaving}
          >
            <Save className="w-4 h-4" />
            Save Template
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {activeTab === 'editor' ? (
        <form onSubmit={handleSave} className="space-y-6">
          {/* Metadata Section */}
          <Card>
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-sm font-bold text-slate-900">
                Template Details & Categorization
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                    Template Name <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Wall Finish Inspection"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                    Discipline / Category
                  </label>
                  <Input
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="e.g. Architectural & Finishes"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Scope & Description
                </label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe when and where this inspection protocol applies..."
                  rows={2}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Inspector Field Instructions
                </label>
                <Textarea
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder="Provide step-by-step guidance on tools, tolerances, and testing methods..."
                  rows={2}
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="template-active"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300"
                />
                <label htmlFor="template-active" className="text-xs font-medium text-slate-700">
                  Active (available for site inspectors to execute)
                </label>
              </div>
            </CardContent>
          </Card>

          {/* Checklist Items Editor */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <CardTitle className="text-sm font-bold text-slate-900">
                  Checklist Items ({items.length})
                </CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">
                  Questions are evaluated as Pass, Fail, or Not Applicable on-site
                </p>
              </div>
              <Button type="button" size="sm" variant="outline" onClick={handleAddItem} className="h-8 text-xs">
                <Plus className="w-3.5 h-3.5 mr-1" />
                Add Question
              </Button>
            </CardHeader>

            <CardContent className="p-5 space-y-4">
              {items.map((item, index) => (
                <div
                  key={item.id || index}
                  className="p-4 rounded-lg border border-slate-200 bg-slate-50/50 space-y-3 relative group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center">
                        {index + 1}
                      </span>
                      <span className="text-xs font-semibold text-slate-600">
                        Checklist Item #{index + 1}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveItem(index)}
                      className="text-slate-400 hover:text-red-600 p-1 rounded"
                      title="Remove question"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <Input
                        value={item.title || ''}
                        onChange={(e) => handleUpdateItem(index, { title: e.target.value })}
                        placeholder="Evaluation question / check title..."
                        required
                      />
                    </div>
                    <div>
                      <select
                        value={item.default_severity || 'medium'}
                        onChange={(e) =>
                          handleUpdateItem(index, {
                            default_severity: e.target.value as DefectSeverity,
                          })
                        }
                        className="w-full text-xs h-9 px-2 rounded border border-slate-300 bg-white"
                      >
                        <option value="low">Default: Low Severity</option>
                        <option value="medium">Default: Medium Severity</option>
                        <option value="high">Default: High Severity</option>
                        <option value="critical">Default: Critical Severity</option>
                      </select>
                    </div>
                  </div>

                  <Input
                    value={item.description || ''}
                    onChange={(e) => handleUpdateItem(index, { description: e.target.value })}
                    placeholder="Tolerance parameters, inspection criteria, or reference spec..."
                  />

                  <div className="flex items-center gap-4 text-xs text-slate-600 pt-1">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={Boolean(item.requires_remarks)}
                        onChange={(e) =>
                          handleUpdateItem(index, { requires_remarks: e.target.checked })
                        }
                        className="rounded border-slate-300 text-blue-600"
                      />
                      <span>Mandatory remarks if failed</span>
                    </label>

                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={Boolean(item.requires_photo)}
                        onChange={(e) =>
                          handleUpdateItem(index, { requires_photo: e.target.checked })
                        }
                        className="rounded border-slate-300 text-blue-600"
                      />
                      <span>Mandatory photo if failed</span>
                    </label>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </form>
      ) : (
        /* Live Preview Mode */
        <Card>
          <CardHeader className="pb-3 border-b border-slate-100 bg-slate-900 text-white rounded-t-lg">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">{name || 'Untitled Inspection Template'}</h3>
                <p className="text-xs text-slate-300">{category || 'General Discipline'}</p>
              </div>
              <span className="text-xs bg-blue-600 px-2.5 py-1 rounded font-bold uppercase tracking-wider">
                Preview Mode
              </span>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            {instructions && (
              <div className="p-3 bg-blue-50 text-blue-900 text-xs rounded border border-blue-200">
                <span className="font-bold block mb-1">FIELD INSTRUCTIONS:</span>
                {instructions}
              </div>
            )}

            <div className="divide-y divide-slate-100">
              {items.map((item, i) => (
                <div key={i} className="py-4 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center flex-shrink-0">
                      {i + 1}
                    </span>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{item.title || 'Untitled question'}</h4>
                      {item.description && (
                        <p className="text-xs text-slate-500 mt-0.5">{item.description}</p>
                      )}
                      <div className="flex items-center gap-2 mt-2 text-[10px] text-slate-400">
                        {item.requires_remarks && <span className="bg-slate-100 px-1.5 py-0.5 rounded">Remarks required if fail</span>}
                        {item.requires_photo && <span className="bg-slate-100 px-1.5 py-0.5 rounded">Photo required if fail</span>}
                        <span className="bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded font-semibold uppercase">
                          {item.default_severity} severity
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 self-start">
                    <button type="button" className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-xs font-semibold">
                      Pass
                    </button>
                    <button type="button" className="px-3 py-1 bg-red-50 text-red-700 border border-red-200 rounded text-xs font-semibold">
                      Fail
                    </button>
                    <button type="button" className="px-2.5 py-1 bg-slate-50 text-slate-600 border border-slate-200 rounded text-xs font-semibold">
                      N/A
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
