import React from 'react';
import { calculateAgeingDays, getAgeingBracket } from '@/lib/utils';
import { Clock } from 'lucide-react';

interface AgeingBadgeProps {
  createdAt: string;
  closedAt?: string | null;
  className?: string;
}

export const AgeingBadge: React.FC<AgeingBadgeProps> = ({
  createdAt,
  closedAt,
  className = '',
}) => {
  const days = calculateAgeingDays(createdAt, closedAt);
  const bracket = getAgeingBracket(days);

  let colorClasses = 'bg-slate-100 text-slate-700 border-slate-200';
  if (bracket === '0-3') {
    colorClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  } else if (bracket === '4-7') {
    colorClasses = 'bg-blue-50 text-blue-700 border-blue-200';
  } else if (bracket === '8-14') {
    colorClasses = 'bg-amber-50 text-amber-700 border-amber-200';
  } else if (bracket === '15-30') {
    colorClasses = 'bg-orange-50 text-orange-700 border-orange-200';
  } else if (bracket === '30+') {
    colorClasses = 'bg-red-50 text-red-700 border-red-200 font-semibold';
  }

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${colorClasses} ${className}`}
      title={`Ageing: ${days} days (Bracket ${bracket} days)`}
    >
      <Clock className="w-3 h-3 opacity-70" />
      <span>{days}d</span>
    </span>
  );
};
