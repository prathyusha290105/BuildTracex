-- BuildTracex Database Schema
-- Migration 001: Core schema creation (Idempotent)
-- Run this in the Supabase SQL Editor

-- ============================================================
-- ENUMS (Idempotent creation)
-- ============================================================

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM (
      'system_admin',
      'quality_manager',
      'qaqc_engineer',
      'site_engineer',
      'project_manager',
      'contractor'
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'project_status') THEN
    CREATE TYPE project_status AS ENUM (
      'planning',
      'active',
      'on_hold',
      'completed',
      'archived'
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'defect_severity') THEN
    CREATE TYPE defect_severity AS ENUM (
      'critical',
      'high',
      'medium',
      'low'
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'defect_status') THEN
    CREATE TYPE defect_status AS ENUM (
      'open',
      'assigned',
      'rectification_in_progress',
      'rectification_submitted',
      'awaiting_reinspection',
      'closed',
      'rejected',
      'reopened'
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'inspection_status') THEN
    CREATE TYPE inspection_status AS ENUM (
      'draft',
      'in_progress',
      'completed',
      'cancelled'
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'checklist_response') THEN
    CREATE TYPE checklist_response AS ENUM (
      'pass',
      'fail',
      'not_applicable'
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'evidence_stage') THEN
    CREATE TYPE evidence_stage AS ENUM (
      'original_inspection',
      'defect_report',
      'contractor_rectification',
      'reinspection'
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_type') THEN
    CREATE TYPE notification_type AS ENUM (
      'new_assignment',
      'reassignment',
      'approaching_deadline',
      'overdue',
      'rectification_submitted',
      'reinspection_required',
      'rectification_rejected',
      'defect_closed',
      'defect_reopened'
    );
  END IF;
END $$;

-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================

-- Function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to generate sequential reference numbers for defects (BTX-0001)
CREATE OR REPLACE FUNCTION generate_defect_reference()
RETURNS TRIGGER AS $$
DECLARE
  next_num INTEGER;
BEGIN
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(reference FROM 'BTX-(\d+)') AS INTEGER)
  ), 0) + 1 INTO next_num FROM defects;
  NEW.reference := 'BTX-' || LPAD(next_num::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to generate sequential reference numbers for inspections (INS-0001)
CREATE OR REPLACE FUNCTION generate_inspection_reference()
RETURNS TRIGGER AS $$
DECLARE
  next_num INTEGER;
BEGIN
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(reference FROM 'INS-(\d+)') AS INTEGER)
  ), 0) + 1 INTO next_num FROM inspections;
  NEW.reference := 'INS-' || LPAD(next_num::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 1. PROFILES & AUTH
-- ============================================================

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'site_engineer',
  phone TEXT,
  avatar_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_is_active ON profiles(is_active);

DROP TRIGGER IF EXISTS profiles_updated_at ON profiles;
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 2. CONTRACTORS
-- ============================================================

CREATE TABLE IF NOT EXISTS contractors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL,
  contact_person TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  specialization TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contractors_active ON contractors(is_active);

DROP TRIGGER IF EXISTS contractors_updated_at ON contractors;
CREATE TRIGGER contractors_updated_at
  BEFORE UPDATE ON contractors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 3. CONTRACTOR USERS (links auth users to contractor orgs)
-- ============================================================

CREATE TABLE IF NOT EXISTS contractor_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  contractor_id UUID NOT NULL REFERENCES contractors(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, contractor_id)
);

CREATE INDEX IF NOT EXISTS idx_contractor_users_user ON contractor_users(user_id);
CREATE INDEX IF NOT EXISTS idx_contractor_users_contractor ON contractor_users(contractor_id);

-- ============================================================
-- 4. PROJECTS
-- ============================================================

CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  site_address TEXT,
  status project_status NOT NULL DEFAULT 'planning',
  project_manager_id UUID REFERENCES profiles(id),
  start_date DATE,
  end_date DATE,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_manager ON projects(project_manager_id);
CREATE INDEX IF NOT EXISTS idx_projects_code ON projects(code);

DROP TRIGGER IF EXISTS projects_updated_at ON projects;
CREATE TRIGGER projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 5. USER PROJECT SCOPES
-- ============================================================

CREATE TABLE IF NOT EXISTS user_project_scopes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, project_id)
);

CREATE INDEX IF NOT EXISTS idx_user_project_scopes_user ON user_project_scopes(user_id);
CREATE INDEX IF NOT EXISTS idx_user_project_scopes_project ON user_project_scopes(project_id);

-- ============================================================
-- 6. CONTRACTOR PROJECT SCOPES
-- ============================================================

CREATE TABLE IF NOT EXISTS contractor_project_scopes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contractor_id UUID NOT NULL REFERENCES contractors(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(contractor_id, project_id)
);

CREATE INDEX IF NOT EXISTS idx_contractor_project_scopes_contractor ON contractor_project_scopes(contractor_id);
CREATE INDEX IF NOT EXISTS idx_contractor_project_scopes_project ON contractor_project_scopes(project_id);

-- ============================================================
-- 7. SITE HIERARCHY: BUILDINGS → FLOORS → ZONES
-- ============================================================

CREATE TABLE IF NOT EXISTS buildings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_buildings_project ON buildings(project_id);

DROP TRIGGER IF EXISTS buildings_updated_at ON buildings;
CREATE TRIGGER buildings_updated_at
  BEFORE UPDATE ON buildings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TABLE IF NOT EXISTS floors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  building_id UUID NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  level_number INTEGER,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_floors_building ON floors(building_id);

DROP TRIGGER IF EXISTS floors_updated_at ON floors;
CREATE TRIGGER floors_updated_at
  BEFORE UPDATE ON floors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TABLE IF NOT EXISTS zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  floor_id UUID NOT NULL REFERENCES floors(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_zones_floor ON zones(floor_id);

DROP TRIGGER IF EXISTS zones_updated_at ON zones;
CREATE TRIGGER zones_updated_at
  BEFORE UPDATE ON zones
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 8. INSPECTION TEMPLATES
-- ============================================================

CREATE TABLE IF NOT EXISTS inspection_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT,
  description TEXT,
  instructions TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_templates_active ON inspection_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_templates_category ON inspection_templates(category);

DROP TRIGGER IF EXISTS templates_updated_at ON inspection_templates;
CREATE TRIGGER templates_updated_at
  BEFORE UPDATE ON inspection_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TABLE IF NOT EXISTS template_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES inspection_templates(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  requires_remarks BOOLEAN NOT NULL DEFAULT false,
  requires_photo BOOLEAN NOT NULL DEFAULT false,
  default_severity defect_severity,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_template_items_template ON template_items(template_id);
CREATE INDEX IF NOT EXISTS idx_template_items_sort ON template_items(template_id, sort_order);

DROP TRIGGER IF EXISTS template_items_updated_at ON template_items;
CREATE TRIGGER template_items_updated_at
  BEFORE UPDATE ON template_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 9. INSPECTIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS inspections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference TEXT UNIQUE,
  project_id UUID NOT NULL REFERENCES projects(id),
  building_id UUID REFERENCES buildings(id),
  floor_id UUID REFERENCES floors(id),
  zone_id UUID REFERENCES zones(id),
  template_id UUID NOT NULL REFERENCES inspection_templates(id),
  template_name_snapshot TEXT NOT NULL,
  inspector_id UUID NOT NULL REFERENCES profiles(id),
  inspection_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status inspection_status NOT NULL DEFAULT 'in_progress',
  notes TEXT,
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inspections_project ON inspections(project_id);
CREATE INDEX IF NOT EXISTS idx_inspections_inspector ON inspections(inspector_id);
CREATE INDEX IF NOT EXISTS idx_inspections_status ON inspections(status);
CREATE INDEX IF NOT EXISTS idx_inspections_date ON inspections(inspection_date);
CREATE INDEX IF NOT EXISTS idx_inspections_reference ON inspections(reference);

DROP TRIGGER IF EXISTS inspections_updated_at ON inspections;
CREATE TRIGGER inspections_updated_at
  BEFORE UPDATE ON inspections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS inspections_reference ON inspections;
CREATE TRIGGER inspections_reference
  BEFORE INSERT ON inspections
  FOR EACH ROW
  WHEN (NEW.reference IS NULL)
  EXECUTE FUNCTION generate_inspection_reference();

-- ============================================================
-- 10. INSPECTION RESPONSES
-- ============================================================

CREATE TABLE IF NOT EXISTS inspection_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inspection_id UUID NOT NULL REFERENCES inspections(id) ON DELETE CASCADE,
  template_item_id UUID NOT NULL REFERENCES template_items(id),
  item_title_snapshot TEXT NOT NULL,
  item_description_snapshot TEXT,
  response checklist_response,
  remarks TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_responses_inspection ON inspection_responses(inspection_id);
CREATE INDEX IF NOT EXISTS idx_responses_response ON inspection_responses(response);

DROP TRIGGER IF EXISTS responses_updated_at ON inspection_responses;
CREATE TRIGGER responses_updated_at
  BEFORE UPDATE ON inspection_responses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 11. DEFECTS
-- ============================================================

CREATE TABLE IF NOT EXISTS defects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference TEXT UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  severity defect_severity NOT NULL DEFAULT 'medium',
  status defect_status NOT NULL DEFAULT 'open',
  project_id UUID NOT NULL REFERENCES projects(id),
  building_id UUID REFERENCES buildings(id),
  floor_id UUID REFERENCES floors(id),
  zone_id UUID REFERENCES zones(id),
  inspection_id UUID REFERENCES inspections(id),
  inspection_response_id UUID REFERENCES inspection_responses(id),
  contractor_id UUID REFERENCES contractors(id),
  assigned_to UUID REFERENCES profiles(id),
  reported_by UUID NOT NULL REFERENCES profiles(id),
  due_date DATE,
  assigned_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  closed_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_defects_reference ON defects(reference);
CREATE INDEX IF NOT EXISTS idx_defects_project ON defects(project_id);
CREATE INDEX IF NOT EXISTS idx_defects_status ON defects(status);
CREATE INDEX IF NOT EXISTS idx_defects_severity ON defects(severity);
CREATE INDEX IF NOT EXISTS idx_defects_contractor ON defects(contractor_id);
CREATE INDEX IF NOT EXISTS idx_defects_assigned ON defects(assigned_to);
CREATE INDEX IF NOT EXISTS idx_defects_due_date ON defects(due_date);
CREATE INDEX IF NOT EXISTS idx_defects_created ON defects(created_at);
CREATE INDEX IF NOT EXISTS idx_defects_inspection ON defects(inspection_id);

DROP TRIGGER IF EXISTS defects_updated_at ON defects;
CREATE TRIGGER defects_updated_at
  BEFORE UPDATE ON defects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS defects_reference ON defects;
CREATE TRIGGER defects_reference
  BEFORE INSERT ON defects
  FOR EACH ROW
  WHEN (NEW.reference IS NULL)
  EXECUTE FUNCTION generate_defect_reference();

-- ============================================================
-- 12. DEFECT STATUS HISTORY
-- ============================================================

CREATE TABLE IF NOT EXISTS defect_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  defect_id UUID NOT NULL REFERENCES defects(id) ON DELETE CASCADE,
  previous_status defect_status,
  new_status defect_status NOT NULL,
  changed_by UUID NOT NULL REFERENCES profiles(id),
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_status_history_defect ON defect_status_history(defect_id);
CREATE INDEX IF NOT EXISTS idx_status_history_created ON defect_status_history(created_at);

-- ============================================================
-- 13. RECTIFICATION SUBMISSIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS rectification_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  defect_id UUID NOT NULL REFERENCES defects(id) ON DELETE CASCADE,
  submitted_by UUID NOT NULL REFERENCES profiles(id),
  description TEXT NOT NULL,
  completion_summary TEXT,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rectifications_defect ON rectification_submissions(defect_id);
CREATE INDEX IF NOT EXISTS idx_rectifications_submitted_by ON rectification_submissions(submitted_by);

-- ============================================================
-- 14. REINSPECTIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS reinspections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  defect_id UUID NOT NULL REFERENCES defects(id) ON DELETE CASCADE,
  rectification_submission_id UUID REFERENCES rectification_submissions(id),
  reviewer_id UUID NOT NULL REFERENCES profiles(id),
  outcome TEXT NOT NULL CHECK (outcome IN ('approved', 'rejected')),
  comments TEXT,
  reviewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reinspections_defect ON reinspections(defect_id);
CREATE INDEX IF NOT EXISTS idx_reinspections_reviewer ON reinspections(reviewer_id);

-- ============================================================
-- 15. COMMENTS
-- ============================================================

CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  defect_id UUID NOT NULL REFERENCES defects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_comments_defect ON comments(defect_id);
CREATE INDEX IF NOT EXISTS idx_comments_user ON comments(user_id);

DROP TRIGGER IF EXISTS comments_updated_at ON comments;
CREATE TRIGGER comments_updated_at
  BEFORE UPDATE ON comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 16. EVIDENCE FILES
-- ============================================================

CREATE TABLE IF NOT EXISTS evidence_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  storage_path TEXT NOT NULL,
  original_filename TEXT NOT NULL,
  mime_type TEXT,
  file_size BIGINT,
  uploaded_by UUID NOT NULL REFERENCES profiles(id),
  stage evidence_stage NOT NULL,
  inspection_id UUID REFERENCES inspections(id),
  inspection_response_id UUID REFERENCES inspection_responses(id),
  defect_id UUID REFERENCES defects(id),
  rectification_submission_id UUID REFERENCES rectification_submissions(id),
  reinspection_id UUID REFERENCES reinspections(id),
  caption TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_evidence_inspection ON evidence_files(inspection_id);
CREATE INDEX IF NOT EXISTS idx_evidence_defect ON evidence_files(defect_id);
CREATE INDEX IF NOT EXISTS idx_evidence_rectification ON evidence_files(rectification_submission_id);
CREATE INDEX IF NOT EXISTS idx_evidence_reinspection ON evidence_files(reinspection_id);
CREATE INDEX IF NOT EXISTS idx_evidence_stage ON evidence_files(stage);

-- ============================================================
-- 17. NOTIFICATIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  entity_type TEXT,
  entity_id UUID,
  is_read BOOLEAN NOT NULL DEFAULT false,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(recipient_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at);

-- ============================================================
-- 18. ACTIVITY LOGS
-- ============================================================

CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  entity_reference TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_user ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_entity ON activity_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_activity_created ON activity_logs(created_at);

-- ============================================================
-- 19. HELPER FUNCTIONS FOR RLS POLICIES
-- ============================================================

CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role AS $$
DECLARE
  v_role user_role;
BEGIN
  SELECT role INTO v_role FROM profiles WHERE id = auth.uid();
  RETURN v_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN get_user_role() = 'system_admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION is_active_user()
RETURNS BOOLEAN AS $$
DECLARE
  v_active BOOLEAN;
BEGIN
  SELECT is_active INTO v_active FROM profiles WHERE id = auth.uid();
  RETURN COALESCE(v_active, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION user_has_project_access(p_project_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Admins have access to all projects
  IF is_admin() THEN RETURN true; END IF;
  -- Project managers have access to their projects
  IF EXISTS (SELECT 1 FROM projects WHERE id = p_project_id AND project_manager_id = auth.uid()) THEN
    RETURN true;
  END IF;
  -- Users with explicit scope
  RETURN EXISTS (
    SELECT 1 FROM user_project_scopes WHERE user_id = auth.uid() AND project_id = p_project_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION get_user_contractor_id()
RETURNS UUID AS $$
DECLARE
  v_contractor_id UUID;
BEGIN
  SELECT contractor_id INTO v_contractor_id
  FROM contractor_users
  WHERE user_id = auth.uid()
  LIMIT 1;
  RETURN v_contractor_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================================
-- 20. AUTO-CREATE PROFILE ON AUTH SIGNUP
-- ============================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'site_engineer')
  )
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email,
      full_name = COALESCE(EXCLUDED.full_name, profiles.full_name);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
