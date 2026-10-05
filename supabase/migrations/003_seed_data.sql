-- BuildTracex Seed Data
-- Migration 003: Demo Seed Data for "Northstar Residential Block A"
-- Run this AFTER 001_schema.sql and 002_rls_policies.sql

-- Note: In Supabase, auth.users contains the login credentials.
-- This script seeds the operational data: Projects, Buildings, Floors, Zones,
-- Contractors, Inspection Templates, Checklist Items, Inspections, Defects, 
-- Rectifications, Reinspections, History, Evidence metadata, Notifications, Activity Logs.

DO $$
DECLARE
  v_project_id UUID := '11111111-1111-1111-1111-111111111111';
  v_bldg_a_id UUID := '22222222-2222-2222-2222-222222222221';
  v_bldg_b_id UUID := '22222222-2222-2222-2222-222222222222';
  
  v_floor_g_id UUID := '33333333-3333-3333-3333-333333333330';
  v_floor_1_id UUID := '33333333-3333-3333-3333-333333333331';
  v_floor_2_id UUID := '33333333-3333-3333-3333-333333333332';
  v_floor_3_id UUID := '33333333-3333-3333-3333-333333333333';

  v_zone_101_id UUID := '44444444-4444-4444-4444-444444444401';
  v_zone_102_id UUID := '44444444-4444-4444-4444-444444444402';
  v_zone_corridor_id UUID := '44444444-4444-4444-4444-444444444403';
  v_zone_lobby_id UUID := '44444444-4444-4444-4444-444444444404';

  v_contractor_apex_id UUID := '55555555-5555-5555-5555-555555555501';
  v_contractor_mep_id UUID := '55555555-5555-5555-5555-555555555502';
  v_contractor_prime_id UUID := '55555555-5555-5555-5555-555555555503';

  v_template_id UUID := '66666666-6666-6666-6666-666666666666';
  v_item_1_id UUID := '77777777-7777-7777-7777-777777777701';
  v_item_2_id UUID := '77777777-7777-7777-7777-777777777702';
  v_item_3_id UUID := '77777777-7777-7777-7777-777777777703';
  v_item_4_id UUID := '77777777-7777-7777-7777-777777777704';
  v_item_5_id UUID := '77777777-7777-7777-7777-777777777705';

  v_insp_1_id UUID := '88888888-8888-8888-8888-888888888801';
  v_insp_2_id UUID := '88888888-8888-8888-8888-888888888802';

  v_resp_1_1 UUID := '99999999-9999-9999-9999-999999999011';
  v_resp_1_2 UUID := '99999999-9999-9999-9999-999999999012';
  v_resp_1_3 UUID := '99999999-9999-9999-9999-999999999013';
  v_resp_1_4 UUID := '99999999-9999-9999-9999-999999999014';
  v_resp_1_5 UUID := '99999999-9999-9999-9999-999999999015';

  v_defect_1_id UUID := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa01';
  v_defect_2_id UUID := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa02';
  v_defect_3_id UUID := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa03';
  v_defect_4_id UUID := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa04';
  v_defect_5_id UUID := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa05';
  v_defect_6_id UUID := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa06';
  v_defect_7_id UUID := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa07';
  v_defect_8_id UUID := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa08';

  v_rect_4_id UUID := 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb04';
  v_rect_5_id UUID := 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb05';
  v_rect_6_id UUID := 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb06';
  v_rect_7_id UUID := 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb07';

  v_reinsp_6_id UUID := 'cccccccc-cccc-cccc-cccc-cccccccccc06';
  v_reinsp_7_id UUID := 'cccccccc-cccc-cccc-cccc-cccccccccc07';
  v_admin_id UUID;
BEGIN
  -- Attempt to pick an existing profile if available, otherwise fallback to any auth user
  SELECT id INTO v_admin_id FROM profiles WHERE role = 'system_admin' LIMIT 1;
  IF v_admin_id IS NULL THEN
    SELECT id INTO v_admin_id FROM profiles LIMIT 1;
  END IF;
  IF v_admin_id IS NULL THEN
    SELECT id INTO v_admin_id FROM auth.users ORDER BY created_at ASC LIMIT 1;
  END IF;

  -- 1. CONTRACTORS
  INSERT INTO contractors (id, company_name, contact_person, email, phone, address, specialization, is_active)
  VALUES
    (v_contractor_apex_id, 'Apex Finishes Ltd', 'David Miller', 'david.miller@apexfinishes.com', '+1 (555) 234-5678', '45 Industrial Way, Suite 200', 'Wall finishes, plastering & painting', true),
    (v_contractor_mep_id, 'BuildPro MEP Services', 'Sarah Jenkins', 's.jenkins@buildpromep.com', '+1 (555) 345-6789', '88 Trades Blvd, Bay 4', 'Mechanical, Electrical & Plumbing', true),
    (v_contractor_prime_id, 'Prime Structural & Masonry', 'Carlos Rodriguez', 'crodriguez@primestructural.com', '+1 (555) 456-7890', '12 Quarry Road', 'Concrete, Masonry & Tile Installation', true)
  ON CONFLICT (id) DO NOTHING;

  -- 2. PROJECT: Northstar Residential Block A
  INSERT INTO projects (id, name, code, description, site_address, status, start_date, end_date)
  VALUES (
    v_project_id,
    'Northstar Residential Block A',
    'PRJ-NRA-01',
    'Premium multi-family residential towers comprising 120 luxury units with integrated amenities, basement parking, and landscaped podium.',
    '742 Evergreen Terrace, North Sector, Metroville',
    'active',
    CURRENT_DATE - INTERVAL '180 days',
    CURRENT_DATE + INTERVAL '365 days'
  )
  ON CONFLICT (code) DO NOTHING;

  -- 3. CONTRACTOR PROJECT SCOPES
  INSERT INTO contractor_project_scopes (contractor_id, project_id)
  VALUES
    (v_contractor_apex_id, v_project_id),
    (v_contractor_mep_id, v_project_id),
    (v_contractor_prime_id, v_project_id)
  ON CONFLICT DO NOTHING;

  -- 4. SITE HIERARCHY
  INSERT INTO buildings (id, project_id, name, description, sort_order)
  VALUES
    (v_bldg_a_id, v_project_id, 'Tower A (Residential)', 'Primary residential tower, 18 levels', 1),
    (v_bldg_b_id, v_project_id, 'Tower B (Residential & Amenities)', 'Secondary residential tower with podium club', 2)
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO floors (id, building_id, name, level_number, sort_order)
  VALUES
    (v_floor_g_id, v_bldg_a_id, 'Ground Floor (Lobby & Services)', 0, 0),
    (v_floor_1_id, v_bldg_a_id, 'Level 1', 1, 1),
    (v_floor_2_id, v_bldg_a_id, 'Level 2', 2, 2),
    (v_floor_3_id, v_bldg_a_id, 'Level 3', 3, 3)
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO zones (id, floor_id, name, description, sort_order)
  VALUES
    (v_zone_101_id, v_floor_1_id, 'Unit 101 (3-BHK Model Unit)', 'Sample display unit with complete interior finishing', 1),
    (v_zone_102_id, v_floor_1_id, 'Unit 102 (2-BHK Standard)', 'Standard residential apartment unit', 2),
    (v_zone_corridor_id, v_floor_1_id, 'Central Corridor & Lift Lobby', 'Common circulation corridor and passenger lift lobby', 3),
    (v_zone_lobby_id, v_floor_g_id, 'Main Entrance Foyer', 'Grand double-height reception and security lobby', 1)
  ON CONFLICT (id) DO NOTHING;

  -- 5. INSPECTION TEMPLATE: Wall Finish Inspection
  INSERT INTO inspection_templates (id, name, category, description, instructions, is_active)
  VALUES (
    v_template_id,
    'Wall Finish Inspection',
    'Architectural & Finishes',
    'Standard quality assurance protocol for internal wall plastering, drywall partitions, skim coating, paint finish, and trim interfaces.',
    'Inspect under adequate 500-lux raking illumination. Check surfaces for deviations exceeding 2mm over 2m straight edge. Verify hairline crack thresholds and dampness readings before recording pass/fail.',
    true
  )
  ON CONFLICT (id) DO NOTHING;

  -- Checklist Items
  INSERT INTO template_items (id, template_id, title, description, sort_order, requires_remarks, requires_photo, default_severity)
  VALUES
    (v_item_1_id, v_template_id, 'Surface finish smoothness and uniformity', 'Surface must be free from trowel marks, pinholes, blistering, and uneven drywall texture.', 1, false, true, 'medium'),
    (v_item_2_id, v_template_id, 'Inspection for visible cracks, hair-line fissures or crazing', 'Check along partition corners, window lintels, and joints for structural or shrinkage cracking.', 2, true, true, 'high'),
    (v_item_3_id, v_template_id, 'Vertical and horizontal wall alignment / plumb check', 'Deviation must not exceed 2mm per 2000mm length using a calibrated digital spirit level.', 3, true, false, 'medium'),
    (v_item_4_id, v_template_id, 'Dampness, efflorescence, or moisture staining inspection', 'Test with digital pinless moisture probe. Any reading exceeding 15% WME requires immediate rectification.', 4, true, true, 'critical'),
    (v_item_5_id, v_template_id, 'Baseboard, skirting, and trim joint integrity', 'Perimeter skirting sealant must be continuous, neatly struck, with no gap or adhesive bleed.', 5, false, false, 'low')
  ON CONFLICT (id) DO NOTHING;

  -- 6. INSPECTIONS
  -- Inspection 1: Level 1 Unit 101 (Completed with defects created)
  IF v_admin_id IS NOT NULL THEN
    INSERT INTO inspections (id, reference, project_id, building_id, floor_id, zone_id, template_id, template_name_snapshot, inspector_id, inspection_date, status, notes, submitted_at)
    VALUES (
      v_insp_1_id,
      'INS-0001',
      v_project_id,
      v_bldg_a_id,
      v_floor_1_id,
      v_zone_101_id,
      v_template_id,
      'Wall Finish Inspection',
      v_admin_id,
      CURRENT_DATE - INTERVAL '12 days',
      'completed',
      'Pre-handover quality audit of Unit 101 model flat. Identified multiple plastering and paint defects requiring contractor rectification.',
      NOW() - INTERVAL '12 days'
    )
    ON CONFLICT (reference) DO NOTHING;

    -- Inspection 2: Unit 102 (Recently completed)
    INSERT INTO inspections (id, reference, project_id, building_id, floor_id, zone_id, template_id, template_name_snapshot, inspector_id, inspection_date, status, notes, submitted_at)
    VALUES (
      v_insp_2_id,
      'INS-0002',
      v_project_id,
      v_bldg_a_id,
      v_floor_1_id,
      v_zone_102_id,
      v_template_id,
      'Wall Finish Inspection',
      v_admin_id,
      CURRENT_DATE - INTERVAL '3 days',
      'completed',
      'Routine snagging audit before final coat of emulsion.',
      NOW() - INTERVAL '3 days'
    )
    ON CONFLICT (reference) DO NOTHING;

    -- Inspection 1 Responses
    INSERT INTO inspection_responses (id, inspection_id, template_item_id, item_title_snapshot, item_description_snapshot, response, remarks)
    VALUES
      (v_resp_1_1, v_insp_1_id, v_item_1_id, 'Surface finish smoothness and uniformity', 'Surface must be free from trowel marks...', 'fail', 'Rough patch and trowel ridging observed on bedroom east wall.'),
      (v_resp_1_2, v_insp_1_id, v_item_2_id, 'Inspection for visible cracks, hair-line fissures or crazing', 'Check along partition corners...', 'fail', 'Diagonal hairline shrinkage crack (0.3mm wide, 450mm long) near north window frame.'),
      (v_resp_1_3, v_insp_1_id, v_item_3_id, 'Vertical and horizontal wall alignment / plumb check', 'Deviation must not exceed 2mm...', 'pass', 'Plumb within 1.2mm tolerance across 2.8m height.'),
      (v_resp_1_4, v_insp_1_id, v_item_4_id, 'Dampness, efflorescence, or moisture staining inspection', 'Test with digital pinless moisture probe...', 'fail', 'Moisture meter reading 24% WME with bubbling paint below master bedroom window sill.'),
      (v_resp_1_5, v_insp_1_id, v_item_5_id, 'Baseboard, skirting, and trim joint integrity', 'Perimeter skirting sealant must be continuous...', 'pass', 'Neat acoustic sealant joint.')
    ON CONFLICT (id) DO NOTHING;

    -- 7. DEFECTS ACROSS ALL REQUIRED STATES AND SEVERITIES
    -- Defect 1: Open (not yet assigned)
    INSERT INTO defects (id, reference, title, description, category, severity, status, project_id, building_id, floor_id, zone_id, inspection_id, inspection_response_id, reported_by, due_date, created_at)
    VALUES (
      v_defect_1_id,
      'BTX-0001',
      'Uneven plaster finish in master bedroom',
      'Trowel marks and visible undulations along the bedroom east partition wall exceeding 3mm tolerance under raking light.',
      'Finishes',
      'low',
      'open',
      v_project_id,
      v_bldg_a_id,
      v_floor_1_id,
      v_zone_101_id,
      v_insp_1_id,
      v_resp_1_1,
      v_admin_id,
      CURRENT_DATE + INTERVAL '7 days',
      NOW() - INTERVAL '12 days'
    )
    ON CONFLICT (reference) DO NOTHING;

    -- Defect 2: Assigned (due in 4 days)
    INSERT INTO defects (id, reference, title, description, category, severity, status, project_id, building_id, floor_id, zone_id, inspection_id, inspection_response_id, contractor_id, reported_by, due_date, assigned_at, created_at)
    VALUES (
      v_defect_2_id,
      'BTX-0002',
      'Hairline crack on north partition wall',
      'Diagonal shrinkage crack near window frame jamb. Requires V-groove scraping, fiberglass mesh bandage, and flexible joint compound.',
      'Plastering',
      'high',
      'assigned',
      v_project_id,
      v_bldg_a_id,
      v_floor_1_id,
      v_zone_101_id,
      v_insp_1_id,
      v_resp_1_2,
      v_contractor_apex_id,
      v_admin_id,
      CURRENT_DATE + INTERVAL '4 days',
      NOW() - INTERVAL '10 days',
      NOW() - INTERVAL '11 days'
    )
    ON CONFLICT (reference) DO NOTHING;

    -- Defect 3: Rectification In Progress
    INSERT INTO defects (id, reference, title, description, category, severity, status, project_id, building_id, floor_id, zone_id, contractor_id, reported_by, due_date, assigned_at, created_at)
    VALUES (
      v_defect_3_id,
      'BTX-0003',
      'Misaligned tile installation near skirting',
      'Skirting tiles showing 4mm lippage against adjacent vitrified flooring in hallway junction. Tile crew currently chiseling and relaying.',
      'Tiling',
      'medium',
      'rectification_in_progress',
      v_project_id,
      v_bldg_a_id,
      v_floor_1_id,
      v_zone_101_id,
      v_contractor_prime_id,
      v_admin_id,
      CURRENT_DATE + INTERVAL '3 days',
      NOW() - INTERVAL '8 days',
      NOW() - INTERVAL '9 days'
    )
    ON CONFLICT (reference) DO NOTHING;

    -- Defect 4: Rectification Submitted
    INSERT INTO defects (id, reference, title, description, category, severity, status, project_id, building_id, floor_id, zone_id, inspection_id, inspection_response_id, contractor_id, reported_by, due_date, assigned_at, created_at)
    VALUES (
      v_defect_4_id,
      'BTX-0004',
      'Dampness and paint bubbling under window sill',
      'Moisture infiltration from external sealant leak caused bubbling of interior skim coat. External caulking redone; interior replastered.',
      'Waterproofing',
      'critical',
      'rectification_submitted',
      v_project_id,
      v_bldg_a_id,
      v_floor_1_id,
      v_zone_101_id,
      v_insp_1_id,
      v_resp_1_4,
      v_contractor_apex_id,
      v_admin_id,
      CURRENT_DATE + INTERVAL '1 day',
      NOW() - INTERVAL '9 days',
      NOW() - INTERVAL '10 days'
    )
    ON CONFLICT (reference) DO NOTHING;

    -- Defect 5: Awaiting Reinspection
    INSERT INTO defects (id, reference, title, description, category, severity, status, project_id, building_id, floor_id, zone_id, contractor_id, reported_by, due_date, assigned_at, created_at)
    VALUES (
      v_defect_5_id,
      'BTX-0005',
      'Chipped plaster around switchboard cutout',
      'Electrical back-box installation chipped plaster edge around 8-gang switchplate in living room. Re-skimmed and ready for QA inspection.',
      'Finishes',
      'medium',
      'awaiting_reinspection',
      v_project_id,
      v_bldg_a_id,
      v_floor_1_id,
      v_zone_102_id,
      v_contractor_apex_id,
      v_admin_id,
      CURRENT_DATE + INTERVAL '2 days',
      NOW() - INTERVAL '7 days',
      NOW() - INTERVAL '8 days'
    )
    ON CONFLICT (reference) DO NOTHING;

    -- Defect 6: Closed (Passing Reinspection)
    INSERT INTO defects (id, reference, title, description, category, severity, status, project_id, building_id, floor_id, zone_id, contractor_id, reported_by, due_date, assigned_at, closed_at, closed_by, created_at)
    VALUES (
      v_defect_6_id,
      'BTX-0006',
      'Wall cracks near balcony opening',
      'Vertical hairline crack between RC lintel beam and AAC masonry wall. Sealed with polymer mastic and repainted with two coats.',
      'Masonry',
      'high',
      'closed',
      v_project_id,
      v_bldg_a_id,
      v_floor_1_id,
      v_zone_101_id,
      v_contractor_prime_id,
      v_admin_id,
      CURRENT_DATE - INTERVAL '2 days',
      NOW() - INTERVAL '14 days',
      NOW() - INTERVAL '2 days',
      v_admin_id,
      NOW() - INTERVAL '15 days'
    )
    ON CONFLICT (reference) DO NOTHING;

    -- Defect 7: Rejected & Reopened
    INSERT INTO defects (id, reference, title, description, category, severity, status, project_id, building_id, floor_id, zone_id, contractor_id, reported_by, due_date, assigned_at, created_at)
    VALUES (
      v_defect_7_id,
      'BTX-0007',
      'Surface roughness and patchy paint in lobby',
      'Patchy roller stippling and color variation visible under ambient daylight. Contractor first rectification was rejected due to visible brush marks.',
      'Painting',
      'high',
      'reopened',
      v_project_id,
      v_bldg_a_id,
      v_floor_g_id,
      v_zone_lobby_id,
      v_contractor_apex_id,
      v_admin_id,
      CURRENT_DATE + INTERVAL '2 days',
      NOW() - INTERVAL '6 days',
      NOW() - INTERVAL '7 days'
    )
    ON CONFLICT (reference) DO NOTHING;

    -- Defect 8: Overdue Defect (due 5 days ago, status assigned)
    INSERT INTO defects (id, reference, title, description, category, severity, status, project_id, building_id, floor_id, zone_id, contractor_id, reported_by, due_date, assigned_at, created_at)
    VALUES (
      v_defect_8_id,
      'BTX-0008',
      'Damaged plaster along service shaft',
      'Impact damage from conduit pipe installation. Exposed reinforcement wire mesh requires anti-rust primer and high-strength repair mortar.',
      'Structural',
      'critical',
      'assigned',
      v_project_id,
      v_bldg_a_id,
      v_floor_1_id,
      v_zone_corridor_id,
      v_contractor_prime_id,
      v_admin_id,
      CURRENT_DATE - INTERVAL '5 days',
      NOW() - INTERVAL '16 days',
      NOW() - INTERVAL '20 days'
    )
    ON CONFLICT (reference) DO NOTHING;

    -- 8. RECTIFICATION SUBMISSIONS
    -- For Defect 4 (Submitted)
    INSERT INTO rectification_submissions (id, defect_id, submitted_by, description, completion_summary, submitted_at)
    VALUES (
      v_rect_4_id,
      v_defect_4_id,
      v_admin_id,
      'Exterior silicone joint re-injected with Dowsil 791 weatherproofing sealant. Internal damaged plaster removed, treated with anti-efflorescence solution, and re-skimmed.',
      'Work completed and water-spray tested for 2 hours with zero moisture penetration.',
      NOW() - INTERVAL '1 day'
    )
    ON CONFLICT (id) DO NOTHING;

    -- For Defect 5 (Awaiting reinspection)
    INSERT INTO rectification_submissions (id, defect_id, submitted_by, description, completion_summary, submitted_at)
    VALUES (
      v_rect_5_id,
      v_defect_5_id,
      v_admin_id,
      'Edge around electrical box rebuilt using quick-setting gypsum filler, sanded with 180-grit paper, and touched up with primer.',
      'Plaster flush with plate. Touch-up coat applied.',
      NOW() - INTERVAL '1 day'
    )
    ON CONFLICT (id) DO NOTHING;

    -- For Defect 6 (Closed)
    INSERT INTO rectification_submissions (id, defect_id, submitted_by, description, completion_summary, submitted_at)
    VALUES (
      v_rect_6_id,
      v_defect_6_id,
      v_admin_id,
      'Routed crack to 10mm depth, injected polyurethane crack sealer, applied alkali-resistant fiberglass mesh and finished with matching acrylic emulsion.',
      'Rectification completed per structural engineer specification.',
      NOW() - INTERVAL '3 days'
    )
    ON CONFLICT (id) DO NOTHING;

    -- For Defect 7 (Previously submitted, then rejected)
    INSERT INTO rectification_submissions (id, defect_id, submitted_by, description, completion_summary, submitted_at)
    VALUES (
      v_rect_7_id,
      v_defect_7_id,
      v_admin_id,
      'Sanded and applied single coat of touch-up paint over patch.',
      'Single coat touch-up done.',
      NOW() - INTERVAL '3 days'
    )
    ON CONFLICT (id) DO NOTHING;

    -- 9. REINSPECTIONS
    -- For Defect 6 (Approved & Closed)
    INSERT INTO reinspections (id, defect_id, rectification_submission_id, reviewer_id, outcome, comments, reviewed_at)
    VALUES (
      v_reinsp_6_id,
      v_defect_6_id,
      v_rect_6_id,
      v_admin_id,
      'approved',
      'Site reinspection verified. Crack repair is seamless and paint blend matches existing wall perfectly under 500-lux raking light. Defect approved for closure.',
      NOW() - INTERVAL '2 days'
    )
    ON CONFLICT (id) DO NOTHING;

    -- For Defect 7 (Rejected & Reopened)
    INSERT INTO reinspections (id, defect_id, rectification_submission_id, reviewer_id, outcome, comments, reviewed_at)
    VALUES (
      v_reinsp_7_id,
      v_defect_7_id,
      v_rect_7_id,
      v_admin_id,
      'rejected',
      'Rejected: Color mismatch and prominent lap marks still clearly noticeable across the main entrance wall. Full panel repainting from corner to corner is required.',
      NOW() - INTERVAL '2 days'
    )
    ON CONFLICT (id) DO NOTHING;

    -- 10. STATUS HISTORY AUDIT LOGS
    INSERT INTO defect_status_history (defect_id, previous_status, new_status, changed_by, reason, created_at)
    VALUES
      (v_defect_1_id, NULL, 'open', v_admin_id, 'Logged from Wall Finish Inspection INS-0001', NOW() - INTERVAL '12 days'),
      (v_defect_2_id, NULL, 'open', v_admin_id, 'Logged from inspection', NOW() - INTERVAL '11 days'),
      (v_defect_2_id, 'open', 'assigned', v_admin_id, 'Assigned to Apex Finishes Ltd with due date in 14 days', NOW() - INTERVAL '10 days'),
      (v_defect_3_id, 'open', 'assigned', v_admin_id, 'Assigned to Prime Structural & Masonry', NOW() - INTERVAL '8 days'),
      (v_defect_3_id, 'assigned', 'rectification_in_progress', v_admin_id, 'Contractor acknowledged assignment and commenced site rectification', NOW() - INTERVAL '6 days'),
      (v_defect_4_id, 'rectification_in_progress', 'rectification_submitted', v_admin_id, 'Contractor submitted weatherproofing rectification proof', NOW() - INTERVAL '1 day'),
      (v_defect_5_id, 'rectification_in_progress', 'awaiting_reinspection', v_admin_id, 'Contractor completed skim coat repair', NOW() - INTERVAL '1 day'),
      (v_defect_6_id, 'rectification_submitted', 'awaiting_reinspection', v_admin_id, 'Scheduled for QA/QC site reinspection', NOW() - INTERVAL '3 days'),
      (v_defect_6_id, 'awaiting_reinspection', 'closed', v_admin_id, 'Reinspection passed successfully. Work verified.', NOW() - INTERVAL '2 days'),
      (v_defect_7_id, 'awaiting_reinspection', 'rejected', v_admin_id, 'Reinspection failed: lap marks still visible', NOW() - INTERVAL '2 days'),
      (v_defect_7_id, 'rejected', 'reopened', v_admin_id, 'Returned to contractor for complete corner-to-corner recoat', NOW() - INTERVAL '2 days')
    ON CONFLICT DO NOTHING;

    -- 11. NOTIFICATIONS
    INSERT INTO notifications (recipient_id, type, title, message, entity_type, entity_id, is_read, created_at)
    VALUES
      (v_admin_id, 'new_assignment', 'Defect Assigned: BTX-0002', 'High-severity hairline crack in Unit 101 assigned to Apex Finishes Ltd.', 'defect', v_defect_2_id, false, NOW() - INTERVAL '10 days'),
      (v_admin_id, 'rectification_submitted', 'Rectification Submitted: BTX-0004', 'Apex Finishes Ltd submitted repair evidence for dampness under window sill.', 'defect', v_defect_4_id, false, NOW() - INTERVAL '1 day'),
      (v_admin_id, 'reinspection_required', 'Reinspection Ready: BTX-0005', 'Chipped plaster repair in Unit 102 is ready for QA/QC review.', 'defect', v_defect_5_id, false, NOW() - INTERVAL '1 day'),
      (v_admin_id, 'rectification_rejected', 'Rectification Rejected: BTX-0007', 'Surface roughness repair in Entrance Foyer rejected. Lap marks persist.', 'defect', v_defect_7_id, true, NOW() - INTERVAL '2 days'),
      (v_admin_id, 'overdue', 'Overdue Defect Alert: BTX-0008', 'Critical defect Damaged plaster along service shaft is 5 days overdue.', 'defect', v_defect_8_id, false, NOW() - INTERVAL '5 days'),
      (v_admin_id, 'defect_closed', 'Defect Closed: BTX-0006', 'High severity defect Wall cracks near balcony verified and closed.', 'defect', v_defect_6_id, true, NOW() - INTERVAL '2 days')
    ON CONFLICT DO NOTHING;

    -- 12. ACTIVITY AUDIT LOG
    INSERT INTO activity_logs (user_id, action, entity_type, entity_id, entity_reference, metadata, created_at)
    VALUES
      (v_admin_id, 'create_project', 'project', v_project_id, 'PRJ-NRA-01', '{"name": "Northstar Residential Block A"}'::jsonb, NOW() - INTERVAL '180 days'),
      (v_admin_id, 'create_template', 'template', v_template_id, 'Wall Finish Inspection', '{"items_count": 5}'::jsonb, NOW() - INTERVAL '60 days'),
      (v_admin_id, 'complete_inspection', 'inspection', v_insp_1_id, 'INS-0001', '{"failed_items": 3, "location": "Unit 101"}'::jsonb, NOW() - INTERVAL '12 days'),
      (v_admin_id, 'create_defect', 'defect', v_defect_1_id, 'BTX-0001', '{"severity": "low", "inspection": "INS-0001"}'::jsonb, NOW() - INTERVAL '12 days'),
      (v_admin_id, 'assign_defect', 'defect', v_defect_2_id, 'BTX-0002', '{"contractor": "Apex Finishes Ltd", "due_date": "2026-10-05"}'::jsonb, NOW() - INTERVAL '10 days'),
      (v_admin_id, 'submit_rectification', 'rectification', v_rect_4_id, 'BTX-0004', '{"summary": "Weatherproofing and skim re-done"}'::jsonb, NOW() - INTERVAL '1 day'),
      (v_admin_id, 'approve_closure', 'defect', v_defect_6_id, 'BTX-0006', '{"decision": "approved", "comment": "Seamless repair"}'::jsonb, NOW() - INTERVAL '2 days'),
      (v_admin_id, 'reject_rectification', 'defect', v_defect_7_id, 'BTX-0007', '{"decision": "rejected", "reason": "Lap marks still visible"}'::jsonb, NOW() - INTERVAL '2 days')
    ON CONFLICT DO NOTHING;

  ELSE
    RAISE NOTICE 'Base reference data (project, locations, contractors, inspection templates) seeded successfully. To populate demonstration defects and inspections, create a user in Supabase Auth and re-run this script.';
  END IF;
END $$;
