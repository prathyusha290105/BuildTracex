import React, { useEffect, useState } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { projectService } from '@/services/projectService';
import { contractorService } from '@/services/contractorService';
import { defectService } from '@/services/defectService';
import { evidenceService } from '@/services/evidenceService';
import { Project, Building, Floor, Zone, Contractor, DefectSeverity } from '@/types';
import { PhotoUploader } from '@/components/evidence/PhotoUploader';
import { DetailSkeleton } from '@/components/common/LoadingSkeleton';
import {
  AlertTriangle,
  ArrowLeft,
  ChevronRight,
  Save,
  AlertCircle,
  Building2,
  HardHat,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export const NewDefectPage: React.FC = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();

  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [selectedBuildingId, setSelectedBuildingId] = useState<string>('');
  const [floors, setFloors] = useState<Floor[]>([]);
  const [selectedFloorId, setSelectedFloorId] = useState<string>('');
  const [zones, setZones] = useState<Zone[]>([]);
  const [selectedZoneId, setSelectedZoneId] = useState<string>('');

  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [selectedContractorId, setSelectedContractorId] = useState<string>('');

  // Form Fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Finishes');
  const [severity, setSeverity] = useState<DefectSeverity>('medium');
  const [dueDate, setDueDate] = useState<string>('');
  const [photos, setPhotos] = useState<File[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const [projs, contrs] = await Promise.all([
          projectService.getProjects(),
          contractorService.getContractors(),
        ]);
        setProjects(projs);
        setContractors(contrs.filter((c) => c.is_active));

        if (projs.length > 0) {
          setSelectedProjectId(projs[0].id);
        }

        // Default due date: 7 days from now
        const defaultDue = new Date();
        defaultDue.setDate(defaultDue.getDate() + 7);
        setDueDate(defaultDue.toISOString().split('T')[0]);
      } catch (err) {
        console.warn('Error loading defect creation metadata:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, []);

  // Hierarchy cascades
  useEffect(() => {
    if (selectedProjectId) {
      projectService.getBuildings(selectedProjectId).then((bldgs) => {
        setBuildings(bldgs);
        if (bldgs.length > 0) setSelectedBuildingId(bldgs[0].id);
        else {
          setSelectedBuildingId('');
          setFloors([]);
          setZones([]);
        }
      });
    }
  }, [selectedProjectId]);

  useEffect(() => {
    if (selectedBuildingId) {
      projectService.getFloors(selectedBuildingId).then((flrs) => {
        setFloors(flrs);
        if (flrs.length > 0) setSelectedFloorId(flrs[0].id);
        else {
          setSelectedFloorId('');
          setZones([]);
        }
      });
    } else {
      setFloors([]);
      setSelectedFloorId('');
    }
  }, [selectedBuildingId]);

  useEffect(() => {
    if (selectedFloorId) {
      projectService.getZones(selectedFloorId).then((zns) => {
        setZones(zns);
        if (zns.length > 0) setSelectedZoneId(zns[0].id);
        else setSelectedZoneId('');
      });
    } else {
      setZones([]);
      setSelectedZoneId('');
    }
  }, [selectedFloorId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Defect title is required.');
      return;
    }
    if (!selectedProjectId) {
      setError('Please select a project.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      // 1. Create defect ticket
      const newDefect = await defectService.createDefect({
        title,
        description,
        category,
        severity,
        project_id: selectedProjectId,
        building_id: selectedBuildingId || null,
        floor_id: selectedFloorId || null,
        zone_id: selectedZoneId || null,
        contractor_id: selectedContractorId || null,
        due_date: dueDate || null,
      });

      // 2. Upload initial defect evidence photos if any
      if (photos.length > 0) {
        for (const file of photos) {
          await evidenceService.uploadFile(file, 'defect_report', {
            defect_id: newDefect.id,
            caption: 'Initial defect observation photo',
          });
        }
      }

      navigate(`/defects/${newDefect.id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to create defect record.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <DetailSkeleton />;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Breadcrumb Header */}
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <NavLink to="/defects" className="hover:text-blue-600 flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Defects</span>
        </NavLink>
        <ChevronRight className="w-3 h-3 text-slate-300" />
        <span className="font-semibold text-slate-800">Manual Defect Logging</span>
      </div>

      <Card>
        <CardHeader className="pb-3 border-b border-slate-100 bg-slate-900 text-white rounded-t-lg">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            <span>Log Construction Quality Snag / Defect</span>
          </CardTitle>
          <p className="text-xs text-slate-300">
            A unique reference ID (e.g. BTX-0004) will be automatically allocated upon submission.
          </p>
        </CardHeader>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Section 1: Title & Classification */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Defect Title / Summary <span className="text-red-500">*</span>
              </label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Wall cracks near window frame or Uneven floor screed..."
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Defect Category / Trade
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full text-sm rounded border border-slate-300 p-2 bg-white"
                >
                  <option value="Finishes">Finishes & Plastering</option>
                  <option value="Structural">Structural & RC Concrete</option>
                  <option value="Masonry">Blockwork & Masonry</option>
                  <option value="Tiling">Flooring & Tiling</option>
                  <option value="Waterproofing">Waterproofing & Sealants</option>
                  <option value="Electrical">Electrical & Low Voltage</option>
                  <option value="Plumbing">Plumbing & Sanitary</option>
                  <option value="HVAC">HVAC & Mechanical</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Severity Classification <span className="text-red-500">*</span>
                </label>
                <select
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value as DefectSeverity)}
                  className="w-full text-sm rounded border border-slate-300 p-2 bg-white font-semibold"
                >
                  <option value="low">Low (Minor cosmetic imperfection)</option>
                  <option value="medium">Medium (Requires rectification prior to finishing)</option>
                  <option value="high">High (Major defect or non-conformance)</option>
                  <option value="critical">Critical (Immediate safety, leakage, or structural hazard)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Detailed Observation & Defect Description
              </label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Specific dimensions, exact location on wall/slab, and non-conformance details..."
                rows={3}
              />
            </div>
          </div>

          {/* Section 2: Location Hierarchy */}
          <div className="pt-4 border-t border-slate-200">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-3 flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-blue-600" />
              <span>Location Hierarchy</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-lg border border-slate-200">
              <div>
                <label className="block text-[11px] font-semibold uppercase text-slate-600 mb-1">
                  Project <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className="w-full text-xs rounded border border-slate-300 p-2 bg-white"
                  required
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase text-slate-600 mb-1">
                  Building / Block
                </label>
                <select
                  value={selectedBuildingId}
                  onChange={(e) => setSelectedBuildingId(e.target.value)}
                  className="w-full text-xs rounded border border-slate-300 p-2 bg-white"
                >
                  <option value="">Select block...</option>
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
                  <option value="">Select floor...</option>
                  {floors.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase text-slate-600 mb-1">
                  Zone / Room
                </label>
                <select
                  value={selectedZoneId}
                  onChange={(e) => setSelectedZoneId(e.target.value)}
                  disabled={!selectedFloorId || zones.length === 0}
                  className="w-full text-xs rounded border border-slate-300 p-2 bg-white disabled:bg-slate-100"
                >
                  <option value="">Select zone...</option>
                  {zones.map((z) => (
                    <option key={z.id} value={z.id}>
                      {z.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Section 3: Assignment */}
          <div className="pt-4 border-t border-slate-200">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-3 flex items-center gap-1.5">
              <HardHat className="w-4 h-4 text-amber-500" />
              <span>Contractor Assignment & Deadline</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Assign to Contractor
                </label>
                <select
                  value={selectedContractorId}
                  onChange={(e) => setSelectedContractorId(e.target.value)}
                  className="w-full text-sm rounded border border-slate-300 p-2 bg-white"
                >
                  <option value="">Leave Unassigned (Open status)</option>
                  {contractors.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.company_name} ({c.specialization || 'Trade'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Target Rectification Deadline
                </label>
                <Input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>
          </div>

          {/* Section 4: Photographic Evidence */}
          <div className="pt-4 border-t border-slate-200">
            <PhotoUploader
              files={photos}
              onChange={setPhotos}
              label="Before-Rectification Evidence Photographs"
            />
          </div>

          {/* Submit button */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => navigate('/defects')}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" variant="default" size="sm" isLoading={isSubmitting} className="font-semibold">
              <Save className="w-4 h-4 mr-1.5" />
              Save Defect Ticket
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
