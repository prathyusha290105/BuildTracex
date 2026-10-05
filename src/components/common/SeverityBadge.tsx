import React from 'react';
import { DefectSeverity } from '@/types';
import { getSeverityBadgeClasses, formatSeverityLabel } from '@/lib/utils';
import { AlertOctagon, AlertTriangle, AlertCircle, Info } from 'lucide-react';

interface SeverityBadgeProps {
  severity: DefectSeverity;
  showIcon?: boolean;
  className?: string;
}

export const SeverityBadge: React.FC<SeverityBadgeProps> = ({
  severity,
  showIcon = true,
  className = '',
}) => {
  const classes = getSeverityBadgeClasses(severity);
  const label = formatSeverityLabel(severity);

  const getIcon = () => {
    switch (severity) {
      case 'critical':
        return <AlertOctagon className="w-3 h-3 text-red-700 animate-pulse" />;
      case 'high':
        return <AlertTriangle className="w-3 h-3 text-orange-700" />;
      case 'medium':
        return <AlertCircle className="w-3 h-3 text-amber-700" />;
      case 'low':
        return <Info className="w-3 h-3 text-slate-600" />;
    }
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${classes} ${className}`}
    >
      {showIcon && getIcon()}
      <span>{label}</span>
    </span>
  );
};
