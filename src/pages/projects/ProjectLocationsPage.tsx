import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, NavLink } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { projectService } from '@/services/projectService';
import { Building, Floor, Zone, Project } from '@/types';
import { DetailSkeleton } from '@/components/common/LoadingSkeleton';
import {
  Building2,
  Layers,
  MapPin,
  Plus,
  ChevronRight,
  ChevronDown,
  ArrowLeft,
  X,
  AlertCircle,
  FolderPlus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export const ProjectLocationsPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { canManageProject } = useAuth();
  const navigate = useNavigate();

  const [project, setProject] = useState<Project | null>(null);
  const [hierarchy, setHierarchy] = useState<Building[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Expanded nodes state
  const [expandedBuildings, setExpandedBuildings] = useState<Record<string, boolean>>({});
  const [expandedFloors, setExpandedFloors] = useState<Record<string, boolean>>({});

  // Creation modals
  const [modalType, setModalType] = useState<'building' | 'floor' | 'zone' | null>(null);
  const [selectedParentBuildingId, setSelectedParentBuildingId] = useState<string>('');
  const [selectedParentFloorId, setSelectedParentFloorId] = useState<string>('');
  const [itemName, setItemName] = useState('');
  const [itemDescription, setItemDescription] = useState('');
  const [itemLevelNumber, setItemLevelNumber] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const loadData = async () => {
    if (!projectId) return;
    setIsLoading(true);
    try {
      const [proj, tree] = await Promise.all([
        projectService.getProjectById(projectId),
        projectService.getFullHierarchy(projectId),
      ]);
      setProject(proj);
      setHierarchy(tree);

      // Auto-expand first building & its floors by default
      if (tree.length > 0) {
        const bMap: Record<string, boolean> = {};
        const fMap: Record<string, boolean> = {};
        tree.forEach((b) => {
          bMap[b.id] = true;
          b.floors?.forEach((f) => {
            fMap[f.id] = true;
          });
        });
        setExpandedBuildings(bMap);
        setExpandedFloors(fMap);
      }
    } catch (err) {
      console.warn('Error loading hierarchy:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [projectId]);

  const toggleBuilding = (id: string) => {
    setExpandedBuildings((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleFloor = (id: string) => {
    setExpandedFloors((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleOpenAddModal = (
    type: 'building' | 'floor' | 'zone',
    buildingId?: string,
    floorId?: string
  ) => {
    setModalType(type);
    setItemName('');
    setItemDescription('');
    setItemLevelNumber(1);
    setError('');
    if (buildingId) setSelectedParentBuildingId(buildingId);
    if (floorId) setSelectedParentFloorId(floorId);
  };

  const handleCreateNode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName.trim()) {
      setError('Name is mandatory.');
      return;
    }
    if (!projectId) return;

    setIsSubmitting(true);
    setError('');
    try {
      if (modalType === 'building') {
        await projectService.createBuilding({
          project_id: projectId,
          name: itemName,
          description: itemDescription || null,
          sort_order: hierarchy.length + 1,
        });
      } else if (modalType === 'floor') {
        if (!selectedParentBuildingId) throw new Error('Parent building must be selected.');
        await projectService.createFloor({
          building_id: selectedParentBuildingId,
          name: itemName,
          level_number: Number(itemLevelNumber),
          sort_order: 1,
        });
      } else if (modalType === 'zone') {
        if (!selectedParentFloorId) throw new Error('Parent floor must be selected.');
        await projectService.createZone({
          floor_id: selectedParentFloorId,
          name: itemName,
          description: itemDescription || null,
          sort_order: 1,
        });
      }

      setModalType(null);
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to create location entity');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <DetailSkeleton />;

  return (
    <div className="space-y-6">
      {/* Breadcrumb Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <NavLink to="/projects" className="hover:text-blue-600 flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Projects</span>
          </NavLink>
          <ChevronRight className="w-3 h-3 text-slate-300" />
          <NavLink to={`/projects/${project?.id}`} className="hover:text-blue-600">
            {project?.name}
          </NavLink>
          <ChevronRight className="w-3 h-3 text-slate-300" />
          <span className="font-semibold text-slate-800">Site Hierarchy</span>
        </div>

        {canManageProject() && (
          <Button
            size="sm"
            onClick={() => handleOpenAddModal('building')}
            className="gap-1.5 font-semibold"
          >
            <Plus className="w-4 h-4" />
            Add Building / Block
          </Button>
        )}
      </div>

      {/* Main Hierarchy Card */}
      <Card>
        <CardHeader className="border-b border-slate-100 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Layers className="w-5 h-5 text-blue-600" />
                <span>Site Hierarchy: Project &rarr; Building &rarr; Floor &rarr; Zone</span>
              </CardTitle>
              <p className="text-xs text-slate-500 mt-1">
                Explore structured construction zones for inspections, snag lists, and contractor coordination
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded">
              {hierarchy.length} Buildings / Blocks
            </span>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          {hierarchy.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-lg">
              <Building2 className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <h3 className="text-sm font-semibold text-slate-800">No site hierarchy defined yet</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-4">
                Begin structuring this project by adding the first residential tower, podium block, or wing.
              </p>
              {canManageProject() && (
                <Button size="sm" onClick={() => handleOpenAddModal('building')}>
                  Create First Building
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {hierarchy.map((bldg) => {
                const isBldgOpen = expandedBuildings[bldg.id] ?? true;

                return (
                  <div
                    key={bldg.id}
                    className="border border-slate-200 rounded-lg overflow-hidden bg-white shadow-sm"
                  >
                    {/* Building Level Header */}
                    <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
                      <div
                        onClick={() => toggleBuilding(bldg.id)}
                        className="flex items-center gap-2.5 cursor-pointer select-none"
                      >
                        {isBldgOpen ? (
                          <ChevronDown className="w-5 h-5 text-slate-400" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-slate-400" />
                        )}
                        <Building2 className="w-5 h-5 text-blue-400" />
                        <div>
                          <h3 className="font-bold text-sm text-white">{bldg.name}</h3>
                          {bldg.description && (
                            <p className="text-[11px] text-slate-300">{bldg.description}</p>
                          )}
                        </div>
                      </div>

                      {canManageProject() && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleOpenAddModal('floor', bldg.id)}
                          className="h-7 text-xs bg-slate-800 text-white hover:bg-slate-700 border border-slate-700"
                        >
                          <Plus className="w-3.5 h-3.5 mr-1" />
                          Add Floor
                        </Button>
                      )}
                    </div>

                    {/* Floors inside Building */}
                    {isBldgOpen && (
                      <div className="p-4 bg-slate-50/50 space-y-3">
                        {(!bldg.floors || bldg.floors.length === 0) ? (
                          <p className="text-xs text-slate-400 italic pl-6 py-2">
                            No floors configured yet for this block.
                          </p>
                        ) : (
                          bldg.floors.map((floor) => {
                            const isFloorOpen = expandedFloors[floor.id] ?? true;

                            return (
                              <div
                                key={floor.id}
                                className="border border-slate-200 rounded-md bg-white overflow-hidden"
                              >
                                {/* Floor Header */}
                                <div className="p-3 bg-slate-100 flex items-center justify-between border-b border-slate-200">
                                  <div
                                    onClick={() => toggleFloor(floor.id)}
                                    className="flex items-center gap-2 cursor-pointer select-none pl-2"
                                  >
                                    {isFloorOpen ? (
                                      <ChevronDown className="w-4 h-4 text-slate-500" />
                                    ) : (
                                      <ChevronRight className="w-4 h-4 text-slate-500" />
                                    )}
                                    <span className="font-bold text-xs text-slate-800">
                                      {floor.name}
                                    </span>
                                    <span className="text-[10px] text-slate-400 font-mono">
                                      (Level {floor.level_number ?? '0'})
                                    </span>
                                  </div>

                                  {canManageProject() && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleOpenAddModal('zone', bldg.id, floor.id)}
                                      className="h-6 text-[11px] text-blue-600 hover:text-blue-700"
                                    >
                                      <Plus className="w-3 h-3 mr-1" />
                                      Add Zone / Area
                                    </Button>
                                  )}
                                </div>

                                {/* Zones inside Floor */}
                                {isFloorOpen && (
                                  <div className="p-3 bg-white">
                                    {(!floor.zones || floor.zones.length === 0) ? (
                                      <p className="text-xs text-slate-400 italic pl-4 py-1">
                                        No zones defined on this floor.
                                      </p>
                                    ) : (
                                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                                        {floor.zones.map((zone) => (
                                          <div
                                            key={zone.id}
                                            className="p-2.5 rounded border border-slate-200 bg-slate-50/50 hover:bg-blue-50/40 hover:border-blue-300 transition-colors flex items-start gap-2"
                                          >
                                            <MapPin className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                                            <div className="min-w-0">
                                              <p className="text-xs font-semibold text-slate-900 truncate">
                                                {zone.name}
                                              </p>
                                              {zone.description && (
                                                <p className="text-[10px] text-slate-500 truncate">
                                                  {zone.description}
                                                </p>
                                              )}
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Entity Modal */}
      {modalType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-900 text-white">
              <h3 className="font-semibold text-sm capitalize">
                Add New {modalType === 'building' ? 'Building / Block' : modalType === 'floor' ? 'Floor' : 'Zone / Area'}
              </h3>
              <button
                onClick={() => setModalType(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateNode} className="p-5 space-y-4">
              {error && (
                <div className="p-2.5 bg-red-50 text-red-600 text-xs rounded border border-red-200">
                  {error}
                </div>
              )}

              {modalType === 'floor' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Select Parent Building
                  </label>
                  <select
                    value={selectedParentBuildingId}
                    onChange={(e) => setSelectedParentBuildingId(e.target.value)}
                    className="w-full text-sm rounded border border-slate-300 p-2 bg-white"
                    required
                  >
                    {hierarchy.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {modalType === 'zone' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Select Parent Floor
                  </label>
                  <select
                    value={selectedParentFloorId}
                    onChange={(e) => setSelectedParentFloorId(e.target.value)}
                    className="w-full text-sm rounded border border-slate-300 p-2 bg-white"
                    required
                  >
                    {hierarchy.flatMap((b) => b.floors || []).map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Name / Identifier <span className="text-red-500">*</span>
                </label>
                <Input
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  placeholder={
                    modalType === 'building'
                      ? 'e.g. Tower C or Podium Club'
                      : modalType === 'floor'
                      ? 'e.g. Level 4 or Basement 1'
                      : 'e.g. Unit 401 or Electrical Duct A'
                  }
                  required
                />
              </div>

              {modalType === 'floor' && (
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                    Level Number
                  </label>
                  <Input
                    type="number"
                    value={itemLevelNumber}
                    onChange={(e) => setItemLevelNumber(parseInt(e.target.value, 10))}
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Description / Remarks
                </label>
                <Input
                  value={itemDescription}
                  onChange={(e) => setItemDescription(e.target.value)}
                  placeholder="Optional architectural or construction notes..."
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setModalType(null)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="default" size="sm" isLoading={isSubmitting}>
                  Save Entity
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
