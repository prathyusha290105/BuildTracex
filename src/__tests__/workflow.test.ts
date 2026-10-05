import { describe, it, expect } from 'vitest';
import { 
  canTransitionStatus, 
  ALLOWED_TRANSITIONS,
  calculateAgeingDays, 
  getAgeingBracket, 
  isDefectOverdue,
  formatStatusLabel,
  formatRoleLabel,
  formatSeverityLabel,
  getStatusBadgeClasses,
  getSeverityBadgeClasses
} from '../lib/utils';
import { DefectStatus, DefectSeverity, UserRole } from '../types';

describe('BuildTracex Core Quality Workflow & Logic Tests', () => {

  describe('1. Defect State Machine & Lifecycle Transitions', () => {
    it('allows valid progressive lifecycle transitions for QA/Admin roles', () => {
      expect(canTransitionStatus('open', 'assigned', 'qaqc_engineer').allowed).toBe(true);
      expect(canTransitionStatus('assigned', 'rectification_in_progress', 'qaqc_engineer').allowed).toBe(true);
      expect(canTransitionStatus('rectification_in_progress', 'rectification_submitted', 'qaqc_engineer').allowed).toBe(true);
      expect(canTransitionStatus('rectification_submitted', 'awaiting_reinspection', 'qaqc_engineer').allowed).toBe(true);
      expect(canTransitionStatus('awaiting_reinspection', 'closed', 'qaqc_engineer').allowed).toBe(true);
      expect(canTransitionStatus('awaiting_reinspection', 'rejected', 'qaqc_engineer').allowed).toBe(true);
      expect(canTransitionStatus('rejected', 'reopened', 'qaqc_engineer').allowed).toBe(true);
      expect(canTransitionStatus('reopened', 'rectification_in_progress', 'qaqc_engineer').allowed).toBe(true);
    });

    it('blocks illegal shortcuts and invalid transitions', () => {
      // Cannot jump from open directly to awaiting_reinspection
      expect(canTransitionStatus('open', 'awaiting_reinspection', 'system_admin').allowed).toBe(false);
      // Cannot jump from assigned directly to closed
      expect(canTransitionStatus('assigned', 'closed', 'system_admin').allowed).toBe(false);
      // Cannot transition from closed to in_progress directly
      expect(canTransitionStatus('closed', 'rectification_in_progress', 'system_admin').allowed).toBe(false);
    });

    it('enforces role-based transition constraints for Contractors', () => {
      // Contractors cannot close defects directly
      const closeAttempt = canTransitionStatus('awaiting_reinspection', 'closed', 'contractor');
      expect(closeAttempt.allowed).toBe(false);
      expect(closeAttempt.reason).toContain('Contractors cannot approve or close defects directly');

      // Contractors cannot reject defects
      const rejectAttempt = canTransitionStatus('awaiting_reinspection', 'rejected', 'contractor');
      expect(rejectAttempt.allowed).toBe(false);

      // Contractors CAN transition assigned -> rectification_in_progress
      const progressAttempt = canTransitionStatus('assigned', 'rectification_in_progress', 'contractor');
      expect(progressAttempt.allowed).toBe(true);

      // Contractors CAN submit rectification
      const submitAttempt = canTransitionStatus('rectification_in_progress', 'rectification_submitted', 'contractor');
      expect(submitAttempt.allowed).toBe(true);
    });
  });

  describe('2. 5-Tier Defect Ageing Engine', () => {
    it('correctly maps defect age to the 5 standard brackets (0-3, 4-7, 8-14, 15-30, 30+)', () => {
      expect(getAgeingBracket(0)).toBe('0-3');
      expect(getAgeingBracket(2)).toBe('0-3');
      expect(getAgeingBracket(3)).toBe('0-3');

      expect(getAgeingBracket(4)).toBe('4-7');
      expect(getAgeingBracket(7)).toBe('4-7');

      expect(getAgeingBracket(8)).toBe('8-14');
      expect(getAgeingBracket(14)).toBe('8-14');

      expect(getAgeingBracket(15)).toBe('15-30');
      expect(getAgeingBracket(30)).toBe('15-30');

      expect(getAgeingBracket(31)).toBe('30+');
      expect(getAgeingBracket(100)).toBe('30+');
    });

    it('accurately calculates age between date strings', () => {
      const created = '2026-09-01T00:00:00Z';
      const closed = '2026-09-06T00:00:00Z';
      expect(calculateAgeingDays(created, closed)).toBe(5);
    });

    it('defaults to current date if closedAt is null or undefined', () => {
      const recentDate = new Date(Date.now() - 86400000 * 3).toISOString();
      const age = calculateAgeingDays(recentDate);
      expect(age).toBeGreaterThanOrEqual(2);
      expect(age).toBeLessThanOrEqual(4);
    });
  });

  describe('3. SLA Overdue Detection', () => {
    it('flags overdue defects when due date is in the past and defect is active', () => {
      const pastDate = new Date(Date.now() - 86400000 * 3).toISOString();
      expect(isDefectOverdue('open', pastDate)).toBe(true);
      expect(isDefectOverdue('rectification_in_progress', pastDate)).toBe(true);
      expect(isDefectOverdue('assigned', pastDate)).toBe(true);
    });

    it('does NOT flag overdue if the defect is closed', () => {
      const pastDate = new Date(Date.now() - 86400000 * 10).toISOString();
      expect(isDefectOverdue('closed', pastDate)).toBe(false);
    });

    it('does NOT flag future due dates as overdue', () => {
      const futureDate = new Date(Date.now() + 86400000 * 5).toISOString();
      expect(isDefectOverdue('open', futureDate)).toBe(false);
      expect(isDefectOverdue('rectification_in_progress', futureDate)).toBe(false);
    });

    it('returns false if no due date is specified', () => {
      expect(isDefectOverdue('open', null)).toBe(false);
      expect(isDefectOverdue('open', undefined)).toBe(false);
    });
  });

  describe('4. Formatting & Role Label Consistency', () => {
    const roles: UserRole[] = [
      'system_admin', 
      'quality_manager', 
      'qaqc_engineer', 
      'site_engineer', 
      'project_manager', 
      'contractor'
    ];

    it('properly formats human-readable labels for all 6 user roles', () => {
      expect(formatRoleLabel('system_admin')).toBe('System Administrator');
      expect(formatRoleLabel('quality_manager')).toBe('Quality Manager');
      expect(formatRoleLabel('qaqc_engineer')).toBe('QA/QC Engineer');
      expect(formatRoleLabel('site_engineer')).toBe('Site Engineer');
      expect(formatRoleLabel('project_manager')).toBe('Project Manager');
      expect(formatRoleLabel('contractor')).toBe('Contractor');
    });

    it('verifies all 6 user roles are distinct', () => {
      expect(roles).toHaveLength(6);
      expect(new Set(roles).size).toBe(6);
    });

    it('properly formats human-readable labels for all defect severities', () => {
      expect(formatSeverityLabel('critical')).toBe('Critical');
      expect(formatSeverityLabel('high')).toBe('High');
      expect(formatSeverityLabel('medium')).toBe('Medium');
      expect(formatSeverityLabel('low')).toBe('Low');
    });

    it('properly formats human-readable labels for all defect statuses', () => {
      expect(formatStatusLabel('open')).toBe('Open');
      expect(formatStatusLabel('assigned')).toBe('Assigned');
      expect(formatStatusLabel('rectification_in_progress')).toBe('Rectification In Progress');
      expect(formatStatusLabel('rectification_submitted')).toBe('Rectification Submitted');
      expect(formatStatusLabel('awaiting_reinspection')).toBe('Awaiting Reinspection');
      expect(formatStatusLabel('closed')).toBe('Closed');
      expect(formatStatusLabel('rejected')).toBe('Rejected');
      expect(formatStatusLabel('reopened')).toBe('Reopened');
    });
  });

  describe('5. Inspection Pass Rate Calculation Formula', () => {
    it('calculates pass rate excluding N/A items', () => {
      const items = [
        { status: 'PASS' },
        { status: 'PASS' },
        { status: 'PASS' },
        { status: 'FAIL' },
        { status: 'NA' },
        { status: 'NA' },
      ];

      const passCount = items.filter(i => i.status === 'PASS').length;
      const failCount = items.filter(i => i.status === 'FAIL').length;
      const totalEvaluated = passCount + failCount;
      const passRate = totalEvaluated > 0 ? Math.round((passCount / totalEvaluated) * 100) : 0;

      expect(passCount).toBe(3);
      expect(failCount).toBe(1);
      expect(totalEvaluated).toBe(4);
      expect(passRate).toBe(75);
    });
  });
});
