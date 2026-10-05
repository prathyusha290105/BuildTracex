import { supabase } from '@/lib/supabase';
import { Project, Building, Floor, Zone } from '@/types';
import { activityService } from './activityService';

export const projectService = {
  async getProjects(): Promise<Project[]> {
    const { data: projects, error } = await supabase
      .from('projects')
      .select('*, project_manager:profiles!project_manager_id(*)')
      .order('created_at', { ascending: false });

    if (error) throw error;
    if (!projects) return [];

    // Fetch counts for each project
    const projectsWithCounts = await Promise.all(
      projects.map(async (project) => {
        const [{ count: buildingCount }, { count: openDefectCount }, { count: totalDefectCount }] = await Promise.all([
          supabase.from('buildings').select('*', { count: 'exact', head: true }).eq('project_id', project.id),
          supabase.from('defects').select('*', { count: 'exact', head: true }).eq('project_id', project.id).neq('status', 'closed'),
          supabase.from('defects').select('*', { count: 'exact', head: true }).eq('project_id', project.id),
        ]);

        return {
          ...project,
          buildings_count: buildingCount || 0,
          open_defects_count: openDefectCount || 0,
          total_defects_count: totalDefectCount || 0,
        };
      })
    );

    return projectsWithCounts as Project[];
  },

  async getProjectById(id: string): Promise<Project> {
    const { data, error } = await supabase
      .from('projects')
      .select('*, project_manager:profiles!project_manager_id(*)')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as Project;
  },

  async createProject(project: Omit<Project, 'id' | 'created_at' | 'updated_at'>): Promise<Project> {
    const { data, error } = await supabase
      .from('projects')
      .insert([project])
      .select()
      .single();

    if (error) throw error;

    await activityService.logActivity(
      'create_project',
      'project',
      data.id,
      data.code,
      { name: data.name }
    );

    return data as Project;
  },

  async updateProject(id: string, updates: Partial<Project>): Promise<Project> {
    const { data, error } = await supabase
      .from('projects')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    await activityService.logActivity(
      'update_project',
      'project',
      id,
      data.code,
      { updates }
    );

    return data as Project;
  },

  // Site Hierarchy Methods
  async getBuildings(projectId: string): Promise<Building[]> {
    const { data, error } = await supabase
      .from('buildings')
      .select('*')
      .eq('project_id', projectId)
      .order('sort_order', { ascending: true });

    if (error) throw error;
    return data as Building[];
  },

  async createBuilding(building: Omit<Building, 'id' | 'created_at' | 'updated_at'>): Promise<Building> {
    const { data, error } = await supabase
      .from('buildings')
      .insert([building])
      .select()
      .single();

    if (error) throw error;
    return data as Building;
  },

  async getFloors(buildingId: string): Promise<Floor[]> {
    const { data, error } = await supabase
      .from('floors')
      .select('*')
      .eq('building_id', buildingId)
      .order('sort_order', { ascending: true });

    if (error) throw error;
    return data as Floor[];
  },

  async createFloor(floor: Omit<Floor, 'id' | 'created_at' | 'updated_at'>): Promise<Floor> {
    const { data, error } = await supabase
      .from('floors')
      .insert([floor])
      .select()
      .single();

    if (error) throw error;
    return data as Floor;
  },

  async getZones(floorId: string): Promise<Zone[]> {
    const { data, error } = await supabase
      .from('zones')
      .select('*')
      .eq('floor_id', floorId)
      .order('sort_order', { ascending: true });

    if (error) throw error;
    return data as Zone[];
  },

  async createZone(zone: Omit<Zone, 'id' | 'created_at' | 'updated_at'>): Promise<Zone> {
    const { data, error } = await supabase
      .from('zones')
      .insert([zone])
      .select()
      .single();

    if (error) throw error;
    return data as Zone;
  },

  async getFullHierarchy(projectId: string): Promise<Building[]> {
    const { data: buildings, error: bldgError } = await supabase
      .from('buildings')
      .select('*')
      .eq('project_id', projectId)
      .order('sort_order', { ascending: true });

    if (bldgError) throw bldgError;
    if (!buildings || buildings.length === 0) return [];

    const buildingIds = buildings.map((b) => b.id);
    const { data: floors, error: floorError } = await supabase
      .from('floors')
      .select('*')
      .in('building_id', buildingIds)
      .order('sort_order', { ascending: true });

    if (floorError) throw floorError;

    const floorIds = (floors || []).map((f) => f.id);
    let zones: Zone[] = [];
    if (floorIds.length > 0) {
      const { data: zonesData, error: zoneError } = await supabase
        .from('zones')
        .select('*')
        .in('floor_id', floorIds)
        .order('sort_order', { ascending: true });

      if (zoneError) throw zoneError;
      zones = (zonesData as Zone[]) || [];
    }

    // Nest hierarchy: Building -> Floors -> Zones
    const hierarchy = buildings.map((b) => {
      const buildingFloors = (floors || [])
        .filter((f) => f.building_id === b.id)
        .map((f) => ({
          ...f,
          zones: zones.filter((z) => z.floor_id === f.id),
        }));

      return {
        ...b,
        floors: buildingFloors,
      };
    });

    return hierarchy as Building[];
  },
};
