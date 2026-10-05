import { describe, it, expect } from 'vitest';
import { reportService } from '../services/reportService';
import { Inspection, Defect } from '../types';

describe('Report Service & PDF Generation Tests', () => {

  const mockInspection: Inspection = {
    id: 'test-insp-1',
    project_id: 'proj-1',
    template_id: 'tmpl-1',
    template_name_snapshot: 'Pre-Pour Concrete Inspection',
    inspector_id: 'user-1',
    reference: 'INS-0001',
    status: 'completed',
    inspection_date: '2026-09-15T09:00:00Z',
    notes: 'All reinforcement bars verified. Minor rebar tie issue logged.',
    created_at: '2026-09-15T08:00:00Z',
    updated_at: '2026-09-15T11:00:00Z',
    project: {
      id: 'proj-1',
      name: 'Northstar Tower A',
      code: 'NTA',
      status: 'active',
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z'
    },
    building: {
      id: 'bldg-1',
      project_id: 'proj-1',
      name: 'Block A',
      sort_order: 1,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z'
    },
    floor: {
      id: 'fl-1',
      building_id: 'bldg-1',
      name: 'Level 3',
      sort_order: 3,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z'
    },
    zone: {
      id: 'zone-1',
      floor_id: 'fl-1',
      name: 'Zone A - Living Room',
      sort_order: 1,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z'
    },
    inspector: {
      id: 'user-1',
      email: 'qa@buildtracex.com',
      full_name: 'John QA Engineer',
      role: 'qaqc_engineer',
      is_active: true,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z'
    },
    responses: [
      {
        id: 'resp-1',
        inspection_id: 'test-insp-1',
        template_item_id: 'ti-1',
        item_title_snapshot: 'Verify rebar diameter and spacing',
        response: 'pass',
        remarks: 'Correct thickness confirmed',
        created_at: '2026-09-15T09:30:00Z',
        updated_at: '2026-09-15T09:30:00Z'
      },
      {
        id: 'resp-2',
        inspection_id: 'test-insp-1',
        template_item_id: 'ti-2',
        item_title_snapshot: 'Verify tie wire firmness',
        response: 'fail',
        remarks: 'Tie wire loose on Grid 4B',
        created_at: '2026-09-15T09:45:00Z',
        updated_at: '2026-09-15T09:45:00Z'
      }
    ]
  };

  const mockDefects: Defect[] = [
    {
      id: 'def-1',
      reference: 'BTX-0001',
      title: 'Exposed Rebar in Shear Wall',
      description: 'Rebar exposed without required 40mm concrete cover.',
      category: 'Structural Concrete',
      severity: 'critical',
      status: 'rectification_in_progress',
      project_id: 'proj-1',
      building_id: 'bldg-1',
      floor_id: 'fl-1',
      zone_id: 'zone-1',
      reported_by: 'user-1',
      due_date: '2026-09-17T00:00:00Z',
      created_at: '2026-09-15T10:00:00Z',
      updated_at: '2026-09-15T12:00:00Z',
      contractor: {
        id: 'cont-1',
        company_name: 'Apex Structural Works Ltd',
        contact_person: 'David Miller',
        email: 'apex@contractors.com',
        phone: '+1-555-0199',
        specialization: 'Concrete & Formwork',
        is_active: true,
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z'
      },
      building: mockInspection.building,
      floor: mockInspection.floor,
      zone: mockInspection.zone,
      reporter: mockInspection.inspector
    }
  ];

  it('generates an Inspection Summary PDF document without errors', () => {
    const doc = reportService.generateInspectionPDF(mockInspection);
    expect(doc).toBeDefined();
    expect(doc.getNumberOfPages()).toBeGreaterThanOrEqual(1);
    
    const blob = doc.output('blob');
    expect(blob).toBeDefined();
    expect(blob.size).toBeGreaterThan(500);
  });

  it('generates a Defect Dossier PDF document without errors', () => {
    const doc = reportService.generateDefectPDF(mockDefects[0]);
    expect(doc).toBeDefined();
    expect(doc.getNumberOfPages()).toBeGreaterThanOrEqual(1);

    const blob = doc.output('blob');
    expect(blob).toBeDefined();
    expect(blob.size).toBeGreaterThan(500);
  });

  it('generates a Defect Register PDF document without errors', () => {
    const doc = reportService.generateDefectRegisterPDF(mockDefects, 'Northstar Tower A');
    expect(doc).toBeDefined();
    expect(doc.getNumberOfPages()).toBeGreaterThanOrEqual(1);

    const blob = doc.output('blob');
    expect(blob).toBeDefined();
    expect(blob.size).toBeGreaterThan(500);
  });

  it('handles empty defect lists gracefully in PDF generation', () => {
    const doc = reportService.generateDefectRegisterPDF([], 'Northstar Tower A');
    expect(doc).toBeDefined();
    expect(doc.getNumberOfPages()).toBeGreaterThanOrEqual(1);
  });
});
