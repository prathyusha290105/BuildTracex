import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, differenceInDays, isPast, parseISO, isValid } from 'date-fns';
import { DefectStatus, DefectSeverity, UserRole } from '@/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString?: string | null): string {
  if (!dateString) return '—';
  try {
    const date = parseISO(dateString);
    if (!isValid(date)) return '—';
    return format(date, 'MMM d, yyyy');
  } catch {
    return '—';
  }
}

export function formatDateTime(dateString?: string | null): string {
  if (!dateString) return '—';
  try {
    const date = parseISO(dateString);
    if (!isValid(date)) return '—';
    return format(date, 'MMM d, yyyy HH:mm');
  } catch {
    return '—';
  }
}

export function calculateAgeingDays(createdAt: string, closedAt?: string | null): number {
  try {
    const start = parseISO(createdAt);
    const end = closedAt ? parseISO(closedAt) : new Date();
    if (!isValid(start) || !isValid(end)) return 0;
    const days = differenceInDays(end, start);
    return Math.max(0, days);
  } catch {
    return 0;
  }
}

export function getAgeingBracket(days: number): '0-3' | '4-7' | '8-14' | '15-30' | '30+' {
  if (days <= 3) return '0-3';
  if (days <= 7) return '4-7';
  if (days <= 14) return '8-14';
  if (days <= 30) return '15-30';
  return '30+';
}

export function isDefectOverdue(status: DefectStatus, dueDate?: string | null): boolean {
  if (status === 'closed') return false;
  if (!dueDate) return false;
  try {
    const due = parseISO(dueDate);
    if (!isValid(due)) return false;
    return isPast(due) && differenceInDays(new Date(), due) > 0;
  } catch {
    return false;
  }
}

export function formatStatusLabel(status: DefectStatus): string {
  switch (status) {
    case 'open': return 'Open';
    case 'assigned': return 'Assigned';
    case 'rectification_in_progress': return 'Rectification In Progress';
    case 'rectification_submitted': return 'Rectification Submitted';
    case 'awaiting_reinspection': return 'Awaiting Reinspection';
    case 'closed': return 'Closed';
    case 'rejected': return 'Rejected';
    case 'reopened': return 'Reopened';
    default: return status;
  }
}

export function formatSeverityLabel(severity: DefectSeverity): string {
  switch (severity) {
    case 'critical': return 'Critical';
    case 'high': return 'High';
    case 'medium': return 'Medium';
    case 'low': return 'Low';
    default: return severity;
  }
}

export function formatRoleLabel(role: UserRole): string {
  switch (role) {
    case 'system_admin': return 'System Administrator';
    case 'quality_manager': return 'Quality Manager';
    case 'qaqc_engineer': return 'QA/QC Engineer';
    case 'site_engineer': return 'Site Engineer';
    case 'project_manager': return 'Project Manager';
    case 'contractor': return 'Contractor';
    default: return role;
  }
}

export function getStatusBadgeClasses(status: DefectStatus): string {
  switch (status) {
    case 'open':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'assigned':
      return 'bg-purple-50 text-purple-700 border-purple-200';
    case 'rectification_in_progress':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'rectification_submitted':
      return 'bg-cyan-50 text-cyan-700 border-cyan-200';
    case 'awaiting_reinspection':
      return 'bg-pink-50 text-pink-700 border-pink-200';
    case 'closed':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'rejected':
      return 'bg-rose-50 text-rose-700 border-rose-200';
    case 'reopened':
      return 'bg-orange-50 text-orange-700 border-orange-200';
    default:
      return 'bg-slate-50 text-slate-700 border-slate-200';
  }
}

export function getSeverityBadgeClasses(severity: DefectSeverity): string {
  switch (severity) {
    case 'critical':
      return 'bg-red-100 text-red-800 border-red-300 font-semibold';
    case 'high':
      return 'bg-orange-100 text-orange-800 border-orange-300';
    case 'medium':
      return 'bg-amber-100 text-amber-800 border-amber-300';
    case 'low':
      return 'bg-slate-100 text-slate-800 border-slate-300';
    default:
      return 'bg-slate-100 text-slate-800 border-slate-300';
  }
}

// State transition validation matrix per requirements section 13
export const ALLOWED_TRANSITIONS: Record<DefectStatus, DefectStatus[]> = {
  open: ['assigned', 'closed'],
  assigned: ['rectification_in_progress', 'assigned', 'open'],
  rectification_in_progress: ['rectification_submitted', 'assigned'],
  rectification_submitted: ['awaiting_reinspection', 'rectification_in_progress'],
  awaiting_reinspection: ['closed', 'rejected'],
  rejected: ['reopened', 'rectification_in_progress'],
  reopened: ['assigned', 'rectification_in_progress'],
  closed: ['reopened'], // Only authorized users can reopen with reason
};

export function canTransitionStatus(
  currentStatus: DefectStatus,
  newStatus: DefectStatus,
  userRole: UserRole
): { allowed: boolean; reason?: string } {
  // Contractors cannot close defects or approve them
  if (userRole === 'contractor' && (newStatus === 'closed' || newStatus === 'rejected')) {
    return { allowed: false, reason: 'Contractors cannot approve or close defects directly.' };
  }

  // Contractors can only transition assigned -> in_progress or in_progress -> rectification_submitted
  if (userRole === 'contractor') {
    const contractorAllowed = ['rectification_in_progress', 'rectification_submitted'];
    if (!contractorAllowed.includes(newStatus)) {
      return { allowed: false, reason: 'Action not permitted for Contractor role.' };
    }
  }

  // Check valid flow
  const validNext = ALLOWED_TRANSITIONS[currentStatus] || [];
  if (!validNext.includes(newStatus)) {
    return {
      allowed: false,
      reason: `Invalid transition from ${formatStatusLabel(currentStatus)} to ${formatStatusLabel(newStatus)}.`,
    };
  }

  return { allowed: true };
}
