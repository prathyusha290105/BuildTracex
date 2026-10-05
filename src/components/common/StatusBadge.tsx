import React from 'react';
import { DefectStatus, InspectionStatus } from '@/types';
import { getStatusBadgeClasses, formatStatusLabel } from '@/lib/utils';

interface StatusBadgeProps {
  status: DefectStatus | InspectionStatus;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
  // If inspection status
  if (status === 'draft' || status === 'in_progress' || status === 'completed' || status === 'cancelled') {
    let classes = 'bg-slate-100 text-slate-700 border-slate-200';
    let label = status.replace('_', ' ');

    if (status === 'completed') {
      classes = 'bg-emerald-50 text-emerald-700 border-emerald-200';
      label = 'Completed';
    } else if (status === 'in_progress') {
      classes = 'bg-blue-50 text-blue-700 border-blue-200';
      label = 'In Progress';
    }

    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize ${classes} ${className}`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
        {label}
      </span>
    );
  }

  // Defect status
  const classes = getStatusBadgeClasses(status as DefectStatus);
  const label = formatStatusLabel(status as DefectStatus);

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${classes} ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
      {label}
    </span>
  );
};
