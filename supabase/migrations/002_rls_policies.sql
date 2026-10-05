-- BuildTracex Row Level Security Policies
-- Migration 002: RLS policies (Idempotent)
-- Run this AFTER 001_schema.sql in the Supabase SQL Editor

-- ============================================================
-- ENABLE RLS ON ALL TABLES
-- ============================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE contractors ENABLE ROW LEVEL SECURITY;
ALTER TABLE contractor_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_project_scopes ENABLE ROW LEVEL SECURITY;
ALTER TABLE contractor_project_scopes ENABLE ROW LEVEL SECURITY;
ALTER TABLE buildings ENABLE ROW LEVEL SECURITY;
ALTER TABLE floors ENABLE ROW LEVEL SECURITY;
ALTER TABLE zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspection_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspection_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE defects ENABLE ROW LEVEL SECURITY;
ALTER TABLE defect_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE rectification_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reinspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- PROFILES POLICIES
-- ============================================================

DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (id = auth.uid());

DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  USING (is_admin());

DROP POLICY IF EXISTS "Active users can view profiles list" ON profiles;
CREATE POLICY "Active users can view profiles list"
  ON profiles FOR SELECT
  USING (is_active_user());

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "Admins can update any profile" ON profiles;
CREATE POLICY "Admins can update any profile"
  ON profiles FOR UPDATE
  USING (is_admin());

DROP POLICY IF EXISTS "Admins can insert profiles" ON profiles;
CREATE POLICY "Admins can insert profiles"
  ON profiles FOR INSERT
  WITH CHECK (is_admin() OR id = auth.uid());

-- ============================================================
-- CONTRACTORS POLICIES
-- ============================================================

DROP POLICY IF EXISTS "Active users can view contractors" ON contractors;
CREATE POLICY "Active users can view contractors"
  ON contractors FOR SELECT
  USING (is_active_user());

DROP POLICY IF EXISTS "Admins can manage contractors" ON contractors;
CREATE POLICY "Admins can manage contractors"
  ON contractors FOR ALL
  USING (is_admin());

DROP POLICY IF EXISTS "Quality managers can view contractors" ON contractors;
CREATE POLICY "Quality managers can view contractors"
  ON contractors FOR SELECT
  USING (get_user_role() IN ('quality_manager', 'qaqc_engineer', 'project_manager'));

-- ============================================================
-- CONTRACTOR USERS POLICIES
-- ============================================================

DROP POLICY IF EXISTS "Admins can manage contractor users" ON contractor_users;
CREATE POLICY "Admins can manage contractor users"
  ON contractor_users FOR ALL
  USING (is_admin());

DROP POLICY IF EXISTS "Users can view own contractor link" ON contractor_users;
CREATE POLICY "Users can view own contractor link"
  ON contractor_users FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Active users can view contractor users" ON contractor_users;
CREATE POLICY "Active users can view contractor users"
  ON contractor_users FOR SELECT
  USING (is_active_user());

-- ============================================================
-- PROJECTS POLICIES
-- ============================================================

DROP POLICY IF EXISTS "Admins can manage projects" ON projects;
CREATE POLICY "Admins can manage projects"
  ON projects FOR ALL
  USING (is_admin());

DROP POLICY IF EXISTS "Users can view scoped projects" ON projects;
CREATE POLICY "Users can view scoped projects"
  ON projects FOR SELECT
  USING (
    is_active_user() AND (
      project_manager_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM user_project_scopes
        WHERE user_id = auth.uid() AND project_id = projects.id
      )
    )
  );

DROP POLICY IF EXISTS "Contractors can view assigned projects" ON projects;
CREATE POLICY "Contractors can view assigned projects"
  ON projects FOR SELECT
  USING (
    is_active_user() AND
    get_user_role() = 'contractor' AND
    EXISTS (
      SELECT 1 FROM contractor_project_scopes cps
      JOIN contractor_users cu ON cu.contractor_id = cps.contractor_id
      WHERE cu.user_id = auth.uid() AND cps.project_id = projects.id
    )
  );

-- ============================================================
-- USER PROJECT SCOPES POLICIES
-- ============================================================

DROP POLICY IF EXISTS "Admins can manage scopes" ON user_project_scopes;
CREATE POLICY "Admins can manage scopes"
  ON user_project_scopes FOR ALL
  USING (is_admin());

DROP POLICY IF EXISTS "Users can view own scopes" ON user_project_scopes;
CREATE POLICY "Users can view own scopes"
  ON user_project_scopes FOR SELECT
  USING (user_id = auth.uid());

-- ============================================================
-- CONTRACTOR PROJECT SCOPES POLICIES
-- ============================================================

DROP POLICY IF EXISTS "Admins can manage contractor scopes" ON contractor_project_scopes;
CREATE POLICY "Admins can manage contractor scopes"
  ON contractor_project_scopes FOR ALL
  USING (is_admin());

DROP POLICY IF EXISTS "Active users can view contractor scopes" ON contractor_project_scopes;
CREATE POLICY "Active users can view contractor scopes"
  ON contractor_project_scopes FOR SELECT
  USING (is_active_user());

-- ============================================================
-- BUILDINGS, FLOORS, ZONES POLICIES
-- ============================================================

-- Buildings
DROP POLICY IF EXISTS "Active users can view buildings" ON buildings;
CREATE POLICY "Active users can view buildings"
  ON buildings FOR SELECT
  USING (is_active_user() AND user_has_project_access(project_id));

DROP POLICY IF EXISTS "Admins can manage buildings" ON buildings;
CREATE POLICY "Admins can manage buildings"
  ON buildings FOR ALL
  USING (is_admin());

DROP POLICY IF EXISTS "Quality managers can manage buildings" ON buildings;
CREATE POLICY "Quality managers can manage buildings"
  ON buildings FOR INSERT
  WITH CHECK (get_user_role() IN ('quality_manager', 'qaqc_engineer') AND user_has_project_access(project_id));

DROP POLICY IF EXISTS "Quality managers can update buildings" ON buildings;
CREATE POLICY "Quality managers can update buildings"
  ON buildings FOR UPDATE
  USING (get_user_role() IN ('quality_manager', 'qaqc_engineer') AND user_has_project_access(project_id));

-- Floors
DROP POLICY IF EXISTS "Active users can view floors" ON floors;
CREATE POLICY "Active users can view floors"
  ON floors FOR SELECT
  USING (
    is_active_user() AND EXISTS (
      SELECT 1 FROM buildings b WHERE b.id = floors.building_id AND user_has_project_access(b.project_id)
    )
  );

DROP POLICY IF EXISTS "Admins can manage floors" ON floors;
CREATE POLICY "Admins can manage floors"
  ON floors FOR ALL
  USING (is_admin());

DROP POLICY IF EXISTS "Authorized users can insert floors" ON floors;
CREATE POLICY "Authorized users can insert floors"
  ON floors FOR INSERT
  WITH CHECK (
    get_user_role() IN ('quality_manager', 'qaqc_engineer') AND
    EXISTS (
      SELECT 1 FROM buildings b WHERE b.id = floors.building_id AND user_has_project_access(b.project_id)
    )
  );

DROP POLICY IF EXISTS "Authorized users can update floors" ON floors;
CREATE POLICY "Authorized users can update floors"
  ON floors FOR UPDATE
  USING (
    get_user_role() IN ('quality_manager', 'qaqc_engineer') AND
    EXISTS (
      SELECT 1 FROM buildings b WHERE b.id = floors.building_id AND user_has_project_access(b.project_id)
    )
  );

-- Zones
DROP POLICY IF EXISTS "Active users can view zones" ON zones;
CREATE POLICY "Active users can view zones"
  ON zones FOR SELECT
  USING (
    is_active_user() AND EXISTS (
      SELECT 1 FROM floors f
      JOIN buildings b ON b.id = f.building_id
      WHERE f.id = zones.floor_id AND user_has_project_access(b.project_id)
    )
  );

DROP POLICY IF EXISTS "Admins can manage zones" ON zones;
CREATE POLICY "Admins can manage zones"
  ON zones FOR ALL
  USING (is_admin());

DROP POLICY IF EXISTS "Authorized users can insert zones" ON zones;
CREATE POLICY "Authorized users can insert zones"
  ON zones FOR INSERT
  WITH CHECK (
    get_user_role() IN ('quality_manager', 'qaqc_engineer') AND
    EXISTS (
      SELECT 1 FROM floors f
      JOIN buildings b ON b.id = f.building_id
      WHERE f.id = zones.floor_id AND user_has_project_access(b.project_id)
    )
  );

DROP POLICY IF EXISTS "Authorized users can update zones" ON zones;
CREATE POLICY "Authorized users can update zones"
  ON zones FOR UPDATE
  USING (
    get_user_role() IN ('quality_manager', 'qaqc_engineer') AND
    EXISTS (
      SELECT 1 FROM floors f
      JOIN buildings b ON b.id = f.building_id
      WHERE f.id = zones.floor_id AND user_has_project_access(b.project_id)
    )
  );

-- ============================================================
-- INSPECTION TEMPLATES POLICIES
-- ============================================================

DROP POLICY IF EXISTS "Active users can view active templates" ON inspection_templates;
CREATE POLICY "Active users can view active templates"
  ON inspection_templates FOR SELECT
  USING (is_active_user());

DROP POLICY IF EXISTS "Admins can manage templates" ON inspection_templates;
CREATE POLICY "Admins can manage templates"
  ON inspection_templates FOR ALL
  USING (is_admin());

DROP POLICY IF EXISTS "Quality managers can manage templates" ON inspection_templates;
CREATE POLICY "Quality managers can manage templates"
  ON inspection_templates FOR INSERT
  WITH CHECK (get_user_role() = 'quality_manager');

DROP POLICY IF EXISTS "Quality managers can update templates" ON inspection_templates;
CREATE POLICY "Quality managers can update templates"
  ON inspection_templates FOR UPDATE
  USING (get_user_role() = 'quality_manager');

-- Template items
DROP POLICY IF EXISTS "Active users can view template items" ON template_items;
CREATE POLICY "Active users can view template items"
  ON template_items FOR SELECT
  USING (is_active_user());

DROP POLICY IF EXISTS "Admins can manage template items" ON template_items;
CREATE POLICY "Admins can manage template items"
  ON template_items FOR ALL
  USING (is_admin());

DROP POLICY IF EXISTS "Quality managers can manage template items" ON template_items;
CREATE POLICY "Quality managers can manage template items"
  ON template_items FOR INSERT
  WITH CHECK (get_user_role() = 'quality_manager');

DROP POLICY IF EXISTS "Quality managers can update template items" ON template_items;
CREATE POLICY "Quality managers can update template items"
  ON template_items FOR UPDATE
  USING (get_user_role() = 'quality_manager');

DROP POLICY IF EXISTS "Quality managers can delete template items" ON template_items;
CREATE POLICY "Quality managers can delete template items"
  ON template_items FOR DELETE
  USING (get_user_role() IN ('quality_manager', 'system_admin'));

-- ============================================================
-- INSPECTIONS POLICIES
-- ============================================================

DROP POLICY IF EXISTS "Users can view inspections for their projects" ON inspections;
CREATE POLICY "Users can view inspections for their projects"
  ON inspections FOR SELECT
  USING (is_active_user() AND user_has_project_access(project_id));

DROP POLICY IF EXISTS "Admins can manage inspections" ON inspections;
CREATE POLICY "Admins can manage inspections"
  ON inspections FOR ALL
  USING (is_admin());

DROP POLICY IF EXISTS "QA engineers can create inspections" ON inspections;
CREATE POLICY "QA engineers can create inspections"
  ON inspections FOR INSERT
  WITH CHECK (
    get_user_role() IN ('qaqc_engineer', 'quality_manager') AND
    user_has_project_access(project_id)
  );

DROP POLICY IF EXISTS "QA engineers can update inspections" ON inspections;
CREATE POLICY "QA engineers can update inspections"
  ON inspections FOR UPDATE
  USING (
    get_user_role() IN ('qaqc_engineer', 'quality_manager') AND
    user_has_project_access(project_id)
  );

DROP POLICY IF EXISTS "Contractors can view relevant inspections" ON inspections;
CREATE POLICY "Contractors can view relevant inspections"
  ON inspections FOR SELECT
  USING (
    get_user_role() = 'contractor' AND
    EXISTS (
      SELECT 1 FROM defects d
      WHERE d.inspection_id = inspections.id
      AND d.contractor_id = get_user_contractor_id()
    )
  );

-- ============================================================
-- INSPECTION RESPONSES POLICIES
-- ============================================================

DROP POLICY IF EXISTS "Users can view responses for accessible inspections" ON inspection_responses;
CREATE POLICY "Users can view responses for accessible inspections"
  ON inspection_responses FOR SELECT
  USING (
    is_active_user() AND EXISTS (
      SELECT 1 FROM inspections i
      WHERE i.id = inspection_responses.inspection_id
      AND user_has_project_access(i.project_id)
    )
  );

DROP POLICY IF EXISTS "Admins can manage responses" ON inspection_responses;
CREATE POLICY "Admins can manage responses"
  ON inspection_responses FOR ALL
  USING (is_admin());

DROP POLICY IF EXISTS "Inspectors can insert responses" ON inspection_responses;
CREATE POLICY "Inspectors can insert responses"
  ON inspection_responses FOR INSERT
  WITH CHECK (
    get_user_role() IN ('qaqc_engineer', 'quality_manager') AND
    EXISTS (
      SELECT 1 FROM inspections i
      WHERE i.id = inspection_responses.inspection_id
      AND user_has_project_access(i.project_id)
    )
  );

DROP POLICY IF EXISTS "Inspectors can update responses" ON inspection_responses;
CREATE POLICY "Inspectors can update responses"
  ON inspection_responses FOR UPDATE
  USING (
    get_user_role() IN ('qaqc_engineer', 'quality_manager') AND
    EXISTS (
      SELECT 1 FROM inspections i
      WHERE i.id = inspection_responses.inspection_id
      AND user_has_project_access(i.project_id)
    )
  );

-- ============================================================
-- DEFECTS POLICIES
-- ============================================================

DROP POLICY IF EXISTS "Users can view defects for their projects" ON defects;
CREATE POLICY "Users can view defects for their projects"
  ON defects FOR SELECT
  USING (
    is_active_user() AND (
      user_has_project_access(project_id)
      OR (
        get_user_role() = 'contractor'
        AND contractor_id = get_user_contractor_id()
      )
    )
  );

DROP POLICY IF EXISTS "Admins can manage defects" ON defects;
CREATE POLICY "Admins can manage defects"
  ON defects FOR ALL
  USING (is_admin());

DROP POLICY IF EXISTS "Authorized users can create defects" ON defects;
CREATE POLICY "Authorized users can create defects"
  ON defects FOR INSERT
  WITH CHECK (
    get_user_role() IN ('qaqc_engineer', 'quality_manager', 'site_engineer') AND
    user_has_project_access(project_id)
  );

DROP POLICY IF EXISTS "Authorized users can update defects" ON defects;
CREATE POLICY "Authorized users can update defects"
  ON defects FOR UPDATE
  USING (
    is_active_user() AND (
      (get_user_role() IN ('qaqc_engineer', 'quality_manager', 'site_engineer') AND user_has_project_access(project_id))
      OR
      (get_user_role() = 'contractor' AND contractor_id = get_user_contractor_id())
    )
  );

-- ============================================================
-- DEFECT STATUS HISTORY POLICIES
-- ============================================================

DROP POLICY IF EXISTS "Users can view status history for accessible defects" ON defect_status_history;
CREATE POLICY "Users can view status history for accessible defects"
  ON defect_status_history FOR SELECT
  USING (
    is_active_user() AND EXISTS (
      SELECT 1 FROM defects d
      WHERE d.id = defect_status_history.defect_id
      AND (user_has_project_access(d.project_id) OR d.contractor_id = get_user_contractor_id())
    )
  );

DROP POLICY IF EXISTS "Active users can insert status history" ON defect_status_history;
CREATE POLICY "Active users can insert status history"
  ON defect_status_history FOR INSERT
  WITH CHECK (is_active_user());

DROP POLICY IF EXISTS "Admins can manage status history" ON defect_status_history;
CREATE POLICY "Admins can manage status history"
  ON defect_status_history FOR ALL
  USING (is_admin());

-- ============================================================
-- RECTIFICATION SUBMISSIONS POLICIES
-- ============================================================

DROP POLICY IF EXISTS "Users can view rectifications for accessible defects" ON rectification_submissions;
CREATE POLICY "Users can view rectifications for accessible defects"
  ON rectification_submissions FOR SELECT
  USING (
    is_active_user() AND EXISTS (
      SELECT 1 FROM defects d
      WHERE d.id = rectification_submissions.defect_id
      AND (user_has_project_access(d.project_id) OR d.contractor_id = get_user_contractor_id())
    )
  );

DROP POLICY IF EXISTS "Contractors can submit rectifications" ON rectification_submissions;
CREATE POLICY "Contractors can submit rectifications"
  ON rectification_submissions FOR INSERT
  WITH CHECK (
    get_user_role() = 'contractor' AND
    EXISTS (
      SELECT 1 FROM defects d
      WHERE d.id = rectification_submissions.defect_id
      AND d.contractor_id = get_user_contractor_id()
    )
  );

DROP POLICY IF EXISTS "Admins can manage rectifications" ON rectification_submissions;
CREATE POLICY "Admins can manage rectifications"
  ON rectification_submissions FOR ALL
  USING (is_admin());

-- ============================================================
-- REINSPECTIONS POLICIES
-- ============================================================

DROP POLICY IF EXISTS "Users can view reinspections for accessible defects" ON reinspections;
CREATE POLICY "Users can view reinspections for accessible defects"
  ON reinspections FOR SELECT
  USING (
    is_active_user() AND EXISTS (
      SELECT 1 FROM defects d
      WHERE d.id = reinspections.defect_id
      AND (user_has_project_access(d.project_id) OR d.contractor_id = get_user_contractor_id())
    )
  );

DROP POLICY IF EXISTS "QA can perform reinspections" ON reinspections;
CREATE POLICY "QA can perform reinspections"
  ON reinspections FOR INSERT
  WITH CHECK (
    get_user_role() IN ('qaqc_engineer', 'quality_manager') AND
    EXISTS (
      SELECT 1 FROM defects d
      WHERE d.id = reinspections.defect_id
      AND user_has_project_access(d.project_id)
    )
  );

DROP POLICY IF EXISTS "Admins can manage reinspections" ON reinspections;
CREATE POLICY "Admins can manage reinspections"
  ON reinspections FOR ALL
  USING (is_admin());

-- ============================================================
-- COMMENTS POLICIES
-- ============================================================

DROP POLICY IF EXISTS "Users can view comments for accessible defects" ON comments;
CREATE POLICY "Users can view comments for accessible defects"
  ON comments FOR SELECT
  USING (
    is_active_user() AND EXISTS (
      SELECT 1 FROM defects d
      WHERE d.id = comments.defect_id
      AND (user_has_project_access(d.project_id) OR d.contractor_id = get_user_contractor_id())
    )
  );

DROP POLICY IF EXISTS "Active users can insert comments" ON comments;
CREATE POLICY "Active users can insert comments"
  ON comments FOR INSERT
  WITH CHECK (
    is_active_user() AND user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM defects d
      WHERE d.id = comments.defect_id
      AND (user_has_project_access(d.project_id) OR d.contractor_id = get_user_contractor_id())
    )
  );

DROP POLICY IF EXISTS "Users can update own comments" ON comments;
CREATE POLICY "Users can update own comments"
  ON comments FOR UPDATE
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can manage comments" ON comments;
CREATE POLICY "Admins can manage comments"
  ON comments FOR ALL
  USING (is_admin());

-- ============================================================
-- EVIDENCE FILES POLICIES
-- ============================================================

DROP POLICY IF EXISTS "Users can view evidence for accessible records" ON evidence_files;
CREATE POLICY "Users can view evidence for accessible records"
  ON evidence_files FOR SELECT
  USING (
    is_active_user() AND (
      (defect_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM defects d
        WHERE d.id = evidence_files.defect_id
        AND (user_has_project_access(d.project_id) OR d.contractor_id = get_user_contractor_id())
      ))
      OR
      (inspection_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM inspections i
        WHERE i.id = evidence_files.inspection_id
        AND user_has_project_access(i.project_id)
      ))
      OR
      (rectification_submission_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM rectification_submissions rs
        JOIN defects d ON d.id = rs.defect_id
        WHERE rs.id = evidence_files.rectification_submission_id
        AND (user_has_project_access(d.project_id) OR d.contractor_id = get_user_contractor_id())
      ))
    )
  );

DROP POLICY IF EXISTS "Active users can upload evidence" ON evidence_files;
CREATE POLICY "Active users can upload evidence"
  ON evidence_files FOR INSERT
  WITH CHECK (is_active_user() AND uploaded_by = auth.uid());

DROP POLICY IF EXISTS "Admins can manage evidence" ON evidence_files;
CREATE POLICY "Admins can manage evidence"
  ON evidence_files FOR ALL
  USING (is_admin());

-- ============================================================
-- NOTIFICATIONS POLICIES
-- ============================================================

DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (recipient_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (recipient_id = auth.uid());

DROP POLICY IF EXISTS "System can insert notifications" ON notifications;
CREATE POLICY "System can insert notifications"
  ON notifications FOR INSERT
  WITH CHECK (is_active_user());

DROP POLICY IF EXISTS "Admins can manage notifications" ON notifications;
CREATE POLICY "Admins can manage notifications"
  ON notifications FOR ALL
  USING (is_admin());

-- ============================================================
-- ACTIVITY LOGS POLICIES
-- ============================================================

DROP POLICY IF EXISTS "Admins can view all activity" ON activity_logs;
CREATE POLICY "Admins can view all activity"
  ON activity_logs FOR SELECT
  USING (is_admin());

DROP POLICY IF EXISTS "Users can view own activity" ON activity_logs;
CREATE POLICY "Users can view own activity"
  ON activity_logs FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Quality managers can view activity" ON activity_logs;
CREATE POLICY "Quality managers can view activity"
  ON activity_logs FOR SELECT
  USING (get_user_role() IN ('quality_manager', 'project_manager'));

DROP POLICY IF EXISTS "Active users can insert activity" ON activity_logs;
CREATE POLICY "Active users can insert activity"
  ON activity_logs FOR INSERT
  WITH CHECK (is_active_user());

DROP POLICY IF EXISTS "Admins can manage activity" ON activity_logs;
CREATE POLICY "Admins can manage activity"
  ON activity_logs FOR ALL
  USING (is_admin());
