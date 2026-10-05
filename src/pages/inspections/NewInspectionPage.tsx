import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, NavLink } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { projectService } from '@/services/projectService';
import { templateService } from '@/services/templateService';
import { inspectionService } from '@/services/inspectionService';
import { defectService } from '@/services/defectService';
import { contractorService } from '@/services/contractorService';
import {
  Project,
  Building,
  Floor,
  Zone,
  InspectionTemplate,
  Contractor,
  DefectSeverity,
} from '@/types';
import { InspectionChecklist, ChecklistItemState } from '@/components/inspections/InspectionChecklist';
import { DetailSkeleton } from '@/components/common/LoadingSkeleton';
import {
  ClipboardCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Save,
  AlertCircle,
  Building2,
  Layers,
  HardHat,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export const NewInspectionPage: React.FC = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Workflow steps: 1 = Context, 2 = Checklist, 3 = Defect Creation from Failures
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Step 1: Context state
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>(
    searchParams.get('projectId') || ''
  );
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [selectedBuildingId, setSelectedBuildingId] = useState<string>('');
  const [floors, setFloors] = useState<Floor[]>([]);
  const [selectedFloorId, setSelectedFloorId] = useState<string>('');
  const [zones, setZones] = useState<Zone[]>([]);
  const [selectedZoneId, setSelectedZoneId] = useState<string>('');

  const [templates, setTemplates] = useState<InspectionTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [activeTemplate, setActiveTemplate] = useState<InspectionTemplate | null>(null);

  const [inspectionDate, setInspectionDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState<string>('');

  // Step 2: Checklist evaluation state
  const [checklistValues, setChecklistValues] = useState<Record<string, ChecklistItemState>>({});

  // Step 3: Submitted inspection & failed items defect creation
  const [submittedInspectionId, setSubmittedInspectionId] = useState<string>('');
  const [submittedReference, setSubmittedReference] = useState<string>('');
  const [failedItems, setFailedItems] = useState<ChecklistItemState[]>([]);
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [defectForms, setDefectForms] = useState<
    Record<
      string,
      {
        title: string;
        description: string;
        severity: DefectSeverity;
        contractor_id: string;
        due_date: string;
        created: boolean;
      }
    >
  >({});

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Initial load
  useEffect(() => {
    async function loadInitial() {
      setIsLoading(true);
      try {
        const [projs, tmpls, contrs] = await Promise.all([
          projectService.getProjects(),
          templateService.getTemplates(),
          contractorService.getContractors(),
        ]);
        setProjects(projs);
        setTemplates(tmpls.filter((t) => t.is_active));
        setContractors(contrs.filter((c) => c.is_active));

        if (projs.length > 0) {
          const initialProjId = searchParams.get('projectId') || projs[0].id;
          setSelectedProjectId(initialProjId);
        }
        if (tmpls.length > 0) {
          setSelectedTemplateId(tmpls[0].id);
        }
      } catch (err) {
        console.warn('Error loading initial inspection data:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadInitial();
  }, [searchParams]);

  // Load buildings when project changes
  useEffect(() => {
    if (selectedProjectId) {
      projectService.getBuildings(selectedProjectId).then((bldgs) => {
        setBuildings(bldgs);
        if (bldgs.length > 0) {
          setSelectedBuildingId(bldgs[0].id);
        } else {
          setSelectedBuildingId('');
          setFloors([]);
          setZones([]);
        }
      });
    }
  }, [selectedProjectId]);

  // Load floors when building changes
  useEffect(() => {
    if (selectedBuildingId) {
      projectService.getFloors(selectedBuildingId).then((flrs) => {
        setFloors(flrs);
        if (flrs.length > 0) {
          setSelectedFloorId(flrs[0].id);
        } else {
          setSelectedFloorId('');
          setZones([]);
        }
      });
    } else {
      setFloors([]);
      setSelectedFloorId('');
    }
  }, [selectedBuildingId]);

  // Load zones when floor changes
  useEffect(() => {
    if (selectedFloorId) {
      projectService.getZones(selectedFloorId).then((zns) => {
        setZones(zns);
        if (zns.length > 0) {
          setSelectedZoneId(zns[0].id);
        } else {
          setSelectedZoneId('');
        }
      });
    } else {
      setZones([]);
      setSelectedZoneId('');
    }
  }, [selectedFloorId]);

  // Load full template when selected
  useEffect(() => {
    if (selectedTemplateId) {
      templateService.getTemplateById(selectedTemplateId).then((tmpl) => {
        setActiveTemplate(tmpl);
        // Pre-initialize checklist answers
        const initialMap: Record<string, ChecklistItemState> = {};
        (tmpl.items || []).forEach((it) => {
          initialMap[it.id] = {
            template_item_id: it.id,
            item_title_snapshot: it.title,
            item_description_snapshot: it.description,
            response: undefined as any,
            remarks: '',
            photos: [],
            default_severity: it.default_severity || 'medium',
          };
        });
        setChecklistValues(initialMap);
      });
    }
  }, [selectedTemplateId]);

  const handleChecklistChange = (itemId: string, updates: Partial<ChecklistItemState>) => {
    setChecklistValues((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        ...updates,
      },
    }));
  };

  const handleProceedToChecklist = () => {
    if (!selectedProjectId) {
      setError('Please select a project.');
      return;
    }
    if (!selectedTemplateId || !activeTemplate) {
      setError('Please select an inspection template.');
      return;
    }
    setError('');
    setCurrentStep(2);
  };

  const handleSubmitChecklist = async () => {
    if (!activeTemplate || !activeTemplate.items) return;

    // Validate that all questions are answered
    for (const item of activeTemplate.items) {
      const val = checklistValues[item.id];
      if (!val || !val.response) {
        setError(`Item #${item.sort_order} ("${item.title}") requires an evaluation (Pass, Fail, or N/A).`);
        return;
      }
      if (val.response === 'fail' && item.requires_remarks && !val.remarks?.trim()) {
        setError(`Item #${item.sort_order} failed and requires mandatory remarks/observations.`);
        return;
      }
    }

    setIsSubmitting(true);
    setError('');

    try {
      const responsesPayload = activeTemplate.items.map((item) => {
        const val = checklistValues[item.id];
        return {
          template_item_id: item.id,
          item_title_snapshot: item.title,
          item_description_snapshot: item.description,
          response: val.response,
          remarks: val.remarks || null,
        };
      });

      const newInsp = await inspectionService.createInspection({
        project_id: selectedProjectId,
        building_id: selectedBuildingId || null,
        floor_id: selectedFloorId || null,
        zone_id: selectedZoneId || null,
        template_id: selectedTemplateId,
        template_name_snapshot: activeTemplate.name,
        inspection_date: inspectionDate,
        notes: notes || null,
        responses: responsesPayload,
      });

      setSubmittedInspectionId(newInsp.id);
      setSubmittedReference(newInsp.reference || 'INS-XXXX');

      // Check for failures
      const failed = Object.values(checklistValues).filter((v) => v.response === 'fail');
      if (failed.length > 0) {
        setFailedItems(failed);
        // Pre-fill defect forms for failed items
        const defaultDue = new Date();
        defaultDue.setDate(defaultDue.getDate() + 7);
        const forms: Record<string, any> = {};

        failed.forEach((f) => {
          forms[f.template_item_id] = {
            title: f.item_title_snapshot,
            description: f.remarks || `Failed inspection check: ${f.item_title_snapshot}`,
            severity: f.default_severity || 'medium',
            contractor_id: contractors.length > 0 ? contractors[0].id : '',
            due_date: defaultDue.toISOString().split('T')[0],
            created: false,
          };
        });
        setDefectForms(forms);
        setCurrentStep(3);
      } else {
        // No failures, navigate to inspection detail
        navigate(`/inspections/${newInsp.id}`);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to submit inspection checklist.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateLinkedDefect = async (itemId: string) => {
    const form = defectForms[itemId];
    if (!form) return;

    try {
      await defectService.createDefect({
        title: form.title,
        description: form.description,
        severity: form.severity,
        project_id: selectedProjectId,
        building_id: selectedBuildingId || null,
        floor_id: selectedFloorId || null,
        zone_id: selectedZoneId || null,
        inspection_id: submittedInspectionId,
        contractor_id: form.contractor_id || null,
        due_date: form.due_date || null,
      });

      setDefectForms((prev) => ({
        ...prev,
        [itemId]: { ...prev[itemId], created: true },
      }));
    } catch (err: any) {
      setError(err.message || 'Failed to log defect');
    }
  };

  if (isLoading) return <DetailSkeleton />;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top Breadcrumb & Step Tracker */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-200">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <NavLink to="/inspections" className="hover:text-blue-600 flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Inspections</span>
          </NavLink>
          <span>&gt;</span>
          <span className="font-semibold text-slate-800">Execute Site Inspection</span>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 text-xs font-semibold">
          <span className={`px-2 py-0.5 rounded ${currentStep === 1 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700'}`}>
            1. Context
          </span>
          <span className="text-slate-300">&rarr;</span>
          <span className={`px-2 py-0.5 rounded ${currentStep === 2 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700'}`}>
            2. Checklist
          </span>
          <span className="text-slate-300">&rarr;</span>
          <span className={`px-2 py-0.5 rounded ${currentStep === 3 ? 'bg-amber-600 text-white' : 'bg-slate-200 text-slate-700'}`}>
            3. Defects
          </span>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* STEP 1: CONTEXT SELECTION */}
      {currentStep === 1 && (
        <Card>
          <CardHeader className="pb-3 border-b border-slate-100 bg-slate-900 text-white rounded-t-lg">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <ClipboardCheck className="w-5 h-5 text-blue-400" />
              <span>Step 1: Inspection Location & Protocol Context</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Project <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className="w-full text-sm rounded border border-slate-300 p-2 bg-white"
                  required
                >
                  <option value="">Select Project...</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Quality Template Protocol <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedTemplateId}
                  onChange={(e) => setSelectedTemplateId(e.target.value)}
                  className="w-full text-sm rounded border border-slate-300 p-2 bg-white"
                  required
                >
                  <option value="">Select Template...</option>
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.category || 'General'})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Site Hierarchy Selectors */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-slate-50 rounded-lg border border-slate-200">
              <div>
                <label className="block text-[11px] font-semibold uppercase text-slate-600 mb-1">
                  Building / Block
                </label>
                <select
                  value={selectedBuildingId}
                  onChange={(e) => setSelectedBuildingId(e.target.value)}
                  className="w-full text-xs rounded border border-slate-300 p-2 bg-white"
                >
                  <option value="">Entire Project</option>
                  {buildings.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase text-slate-600 mb-1">
                  Floor
                </label>
                <select
                  value={selectedFloorId}
                  onChange={(e) => setSelectedFloorId(e.target.value)}
                  disabled={!selectedBuildingId || floors.length === 0}
                  className="w-full text-xs rounded border border-slate-300 p-2 bg-white disabled:bg-slate-100"
                >
                  <option value="">Entire Building</option>
                  {floors.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase text-slate-600 mb-1">
                  Zone / Apartment Unit
                </label>
                <select
                  value={selectedZoneId}
                  onChange={(e) => setSelectedZoneId(e.target.value)}
                  disabled={!selectedFloorId || zones.length === 0}
                  className="w-full text-xs rounded border border-slate-300 p-2 bg-white disabled:bg-slate-100"
                >
                  <option value="">Entire Floor</option>
                  {zones.map((z) => (
                    <option key={z.id} value={z.id}>
                      {z.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Inspection Date
                </label>
                <Input
                  type="date"
                  value={inspectionDate}
                  onChange={(e) => setInspectionDate(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Inspector
                </label>
                <Input
                  value={profile?.full_name || 'QA Inspector'}
                  disabled
                  className="bg-slate-50 text-slate-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Audit Notes / Weather Conditions
              </label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ambient lighting conditions, special snagging focus, or site constraints..."
                rows={2}
              />
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <Button onClick={handleProceedToChecklist} className="gap-1.5 font-semibold">
                <span>Proceed to Checklist ({activeTemplate?.items_count || 0} checks)</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* STEP 2: COMPLETE CHECKLIST */}
      {currentStep === 2 && activeTemplate && (
        <div className="space-y-4">
          <div className="bg-slate-900 text-white p-4 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold">{activeTemplate.name}</h2>
              <p className="text-xs text-slate-300 mt-0.5">
                {[
                  projects.find((p) => p.id === selectedProjectId)?.name,
                  buildings.find((b) => b.id === selectedBuildingId)?.name,
                  floors.find((f) => f.id === selectedFloorId)?.name,
                  zones.find((z) => z.id === selectedZoneId)?.name,
                ]
                  .filter(Boolean)
                  .join(' > ')}
              </p>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentStep(1)}
              className="bg-slate-800 text-white border-slate-700 hover:bg-slate-700 text-xs self-start sm:self-auto"
            >
              &larr; Back to Context
            </Button>
          </div>

          {activeTemplate.instructions && (
            <div className="p-3 bg-blue-50 text-blue-900 text-xs rounded border border-blue-200">
              <span className="font-bold block mb-1">FIELD PROTOCOL:</span>
              {activeTemplate.instructions}
            </div>
          )}

          <InspectionChecklist
            items={activeTemplate.items || []}
            values={checklistValues}
            onChange={handleChecklistChange}
          />

          <div className="p-4 bg-white rounded-lg border border-slate-200 shadow-sm flex items-center justify-between">
            <Button variant="outline" size="sm" onClick={() => setCurrentStep(1)}>
              &larr; Edit Context
            </Button>
            <Button
              onClick={handleSubmitChecklist}
              variant="default"
              size="sm"
              isLoading={isSubmitting}
              className="gap-1.5 font-semibold"
            >
              <Save className="w-4 h-4" />
              Submit Completed Inspection
            </Button>
          </div>
        </div>
      )}

      {/* STEP 3: DEFECT CREATION FROM FAILED ITEMS */}
      {currentStep === 3 && (
        <Card>
          <CardHeader className="bg-amber-500 text-white rounded-t-lg pb-3">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-950" />
              <span>
                Step 3: Defect Ticketing for Failed Checks ({failedItems.length} Failures Detected)
              </span>
            </CardTitle>
            <p className="text-xs text-amber-100">
              Inspection <span className="font-mono font-bold text-white">{submittedReference}</span>{' '}
              was saved. Log corresponding defect tickets for contractor assignment below.
            </p>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="space-y-4">
              {failedItems.map((failed) => {
                const form = defectForms[failed.template_item_id];
                if (!form) return null;

                return (
                  <div
                    key={failed.template_item_id}
                    className={`p-4 rounded-lg border transition-all ${
                      form.created ? 'bg-emerald-50/40 border-emerald-300' : 'bg-white border-slate-200'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-900">{form.title}</span>
                          <span className="text-[10px] font-bold uppercase bg-red-100 text-red-700 px-1.5 py-0.5 rounded">
                            FAILED
                          </span>
                        </div>
                        {failed.remarks && (
                          <p className="text-xs text-slate-500 mt-1 italic">
                            &quot;{failed.remarks}&quot;
                          </p>
                        )}
                      </div>

                      {form.created && (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Defect Logged
                        </span>
                      )}
                    </div>

                    {!form.created && (
                      <div className="space-y-3 pt-2 border-t border-slate-100 text-xs">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <div>
                            <label className="block text-[11px] font-semibold uppercase text-slate-600 mb-1">
                              Severity
                            </label>
                            <select
                              value={form.severity}
                              onChange={(e) =>
                                setDefectForms({
                                  ...defectForms,
                                  [failed.template_item_id]: {
                                    ...form,
                                    severity: e.target.value as DefectSeverity,
                                  },
                                })
                              }
                              className="w-full text-xs p-1.5 rounded border border-slate-300 bg-white"
                            >
                              <option value="critical">Critical</option>
                              <option value="high">High</option>
                              <option value="medium">Medium</option>
                              <option value="low">Low</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-[11px] font-semibold uppercase text-slate-600 mb-1">
                              Contractor
                            </label>
                            <select
                              value={form.contractor_id}
                              onChange={(e) =>
                                setDefectForms({
                                  ...defectForms,
                                  [failed.template_item_id]: {
                                    ...form,
                                    contractor_id: e.target.value,
                                  },
                                })
                              }
                              className="w-full text-xs p-1.5 rounded border border-slate-300 bg-white"
                            >
                              <option value="">Unassigned</option>
                              {contractors.map((c) => (
                                <option key={c.id} value={c.id}>
                                  {c.company_name}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-[11px] font-semibold uppercase text-slate-600 mb-1">
                              Due Date
                            </label>
                            <input
                              type="date"
                              value={form.due_date}
                              onChange={(e) =>
                                setDefectForms({
                                  ...defectForms,
                                  [failed.template_item_id]: {
                                    ...form,
                                    due_date: e.target.value,
                                  },
                                })
                              }
                              className="w-full text-xs p-1.5 rounded border border-slate-300 bg-white"
                            />
                          </div>
                        </div>

                        <div className="flex justify-end pt-1">
                          <Button
                            type="button"
                            size="sm"
                            variant="default"
                            onClick={() => handleCreateLinkedDefect(failed.template_item_id)}
                            className="h-8 text-xs font-semibold"
                          >
                            Log Defect Ticket
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                You can create additional defects now or view the finalized audit.
              </span>
              <Button
                variant="default"
                size="sm"
                onClick={() => navigate(`/inspections/${submittedInspectionId}`)}
                className="font-semibold"
              >
                Finish & View Inspection Dossier &rarr;
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
