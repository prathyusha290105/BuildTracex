// BuildTracex Core TypeScript Definitions

export type UserRole =
  | 'system_admin'
  | 'quality_manager'
  | 'qaqc_engineer'
  | 'site_engineer'
  | 'project_manager'
  | 'contractor';

export type ProjectStatus =
  | 'planning'
  | 'active'
  | 'on_hold'
  | 'completed'
  | 'archived';

export type DefectSeverity =
  | 'critical'
  | 'high'
  | 'medium'
  | 'low';

export type DefectStatus =
  | 'open'
  | 'assigned'
  | 'rectification_in_progress'
  | 'rectification_submitted'
  | 'awaiting_reinspection'
  | 'closed'
  | 'rejected'
  | 'reopened';

export type InspectionStatus =
  | 'draft'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export type ChecklistResponse =
  | 'pass'
  | 'fail'
  | 'not_applicable';

export type EvidenceStage =
  | 'original_inspection'
  | 'defect_report'
  | 'contractor_rectification'
  | 'reinspection';

export type NotificationType =
  | 'new_assignment'
  | 'reassignment'
  | 'approaching_deadline'
  | 'overdue'
  | 'rectification_submitted'
  | 'reinspection_required'
  | 'rectification_rejected'
  | 'defect_closed'
  | 'defect_reopened';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  phone?: string | null;
  avatar_url?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Contractor {
  id: string;
  company_name: string;
  contact_person?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  specialization?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ContractorUser {
  id: string;
  user_id: string;
  contractor_id: string;
  created_at: string;
  contractor?: Contractor;
}

export interface Project {
  id: string;
  name: string;
  code: string;
  description?: string | null;
  site_address?: string | null;
  status: ProjectStatus;
  project_manager_id?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
  project_manager?: Profile | null;
  buildings_count?: number;
  open_defects_count?: number;
  total_defects_count?: number;
}

export interface Building {
  id: string;
  project_id: string;
  name: string;
  description?: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
  floors?: Floor[];
}

export interface Floor {
  id: string;
  building_id: string;
  name: string;
  level_number?: number | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
  zones?: Zone[];
}

export interface Zone {
  id: string;
  floor_id: string;
  name: string;
  description?: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface InspectionTemplate {
  id: string;
  name: string;
  category?: string | null;
  description?: string | null;
  instructions?: string | null;
  is_active: boolean;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
  items_count?: number;
  items?: TemplateItem[];
}

export interface TemplateItem {
  id: string;
  template_id: string;
  title: string;
  description?: string | null;
  sort_order: number;
  requires_remarks: boolean;
  requires_photo: boolean;
  default_severity?: DefectSeverity | null;
  created_at: string;
  updated_at: string;
}

export interface Inspection {
  id: string;
  reference?: string | null;
  project_id: string;
  building_id?: string | null;
  floor_id?: string | null;
  zone_id?: string | null;
  template_id: string;
  template_name_snapshot: string;
  inspector_id: string;
  inspection_date: string;
  status: InspectionStatus;
  notes?: string | null;
  submitted_at?: string | null;
  created_at: string;
  updated_at: string;
  project?: Project;
  building?: Building;
  floor?: Floor;
  zone?: Zone;
  inspector?: Profile;
  responses?: InspectionResponse[];
  defects?: Defect[];
  evidence?: EvidenceFile[];
}

export interface InspectionResponse {
  id: string;
  inspection_id: string;
  template_item_id: string;
  item_title_snapshot: string;
  item_description_snapshot?: string | null;
  response?: ChecklistResponse | null;
  remarks?: string | null;
  created_at: string;
  updated_at: string;
  evidence?: EvidenceFile[];
}

export interface Defect {
  id: string;
  reference: string;
  title: string;
  description?: string | null;
  category?: string | null;
  severity: DefectSeverity;
  status: DefectStatus;
  project_id: string;
  building_id?: string | null;
  floor_id?: string | null;
  zone_id?: string | null;
  inspection_id?: string | null;
  inspection_response_id?: string | null;
  contractor_id?: string | null;
  assigned_to?: string | null;
  reported_by: string;
  due_date?: string | null;
  assigned_at?: string | null;
  closed_at?: string | null;
  closed_by?: string | null;
  created_at: string;
  updated_at: string;

  // Joined relations
  project?: Project;
  building?: Building;
  floor?: Floor;
  zone?: Zone;
  contractor?: Contractor;
  reporter?: Profile;
  assignee?: Profile;
  closer?: Profile;
  inspection?: Inspection;
  evidence?: EvidenceFile[];
  rectifications?: RectificationSubmission[];
  reinspections?: Reinspection[];
  history?: DefectStatusHistory[];
  comments?: Comment[];
}

export interface DefectStatusHistory {
  id: string;
  defect_id: string;
  previous_status?: DefectStatus | null;
  new_status: DefectStatus;
  changed_by: string;
  reason?: string | null;
  created_at: string;
  changer?: Profile;
}

export interface RectificationSubmission {
  id: string;
  defect_id: string;
  submitted_by: string;
  description: string;
  completion_summary?: string | null;
  submitted_at: string;
  created_at: string;
  submitter?: Profile;
  evidence?: EvidenceFile[];
}

export interface Reinspection {
  id: string;
  defect_id: string;
  rectification_submission_id?: string | null;
  reviewer_id: string;
  outcome: 'approved' | 'rejected';
  comments?: string | null;
  reviewed_at: string;
  created_at: string;
  reviewer?: Profile;
  evidence?: EvidenceFile[];
}

export interface Comment {
  id: string;
  defect_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  user?: Profile;
}

export interface EvidenceFile {
  id: string;
  storage_path: string;
  original_filename: string;
  mime_type?: string | null;
  file_size?: number | null;
  uploaded_by: string;
  stage: EvidenceStage;
  inspection_id?: string | null;
  inspection_response_id?: string | null;
  defect_id?: string | null;
  rectification_submission_id?: string | null;
  reinspection_id?: string | null;
  caption?: string | null;
  created_at: string;
  url?: string;
}

export interface Notification {
  id: string;
  recipient_id: string;
  type: NotificationType;
  title: string;
  message?: string | null;
  entity_type?: string | null;
  entity_id?: string | null;
  is_read: boolean;
  read_at?: string | null;
  created_at: string;
}

export interface ActivityLog {
  id: string;
  user_id?: string | null;
  action: string;
  entity_type: string;
  entity_id?: string | null;
  entity_reference?: string | null;
  metadata?: Record<string, any> | null;
  created_at: string;
  user?: Profile;
}

export interface UserProjectScope {
  id: string;
  user_id: string;
  project_id: string;
  created_at: string;
  project?: Project;
}

// KPI Dashboard metrics
export interface DashboardMetrics {
  totalInspections: number;
  totalDefects: number;
  openDefects: number;
  overdueDefects: number;
  awaitingReinspection: number;
  closedDefects: number;
  byStatus: Record<DefectStatus, number>;
  bySeverity: Record<DefectSeverity, number>;
  ageing: {
    '0-3': number;
    '4-7': number;
    '8-14': number;
    '15-30': number;
    '30+': number;
  };
}

export interface ContractorPerformanceMetric {
  contractorId: string;
  contractorName: string;
  totalAssigned: number;
  closed: number;
  overdue: number;
  rejectedRectifications: number;
  closureRate: number; // percentage
  avgClosureDays: number;
}
