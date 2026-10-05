import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MetricCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  description?: string;
  trend?: {
    value: number;
    label: string;
    isPositive?: boolean;
  };
  variant?: 'default' | 'critical' | 'warning' | 'success' | 'info';
  onClick?: () => void;
  className?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  icon: Icon,
  description,
  trend,
  variant = 'default',
  onClick,
  className = '',
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'critical':
        return {
          iconBg: 'bg-red-50 text-red-600',
          border: 'border-l-4 border-l-red-500',
          valueColor: 'text-red-700',
        };
      case 'warning':
        return {
          iconBg: 'bg-amber-50 text-amber-600',
          border: 'border-l-4 border-l-amber-500',
          valueColor: 'text-amber-700',
        };
      case 'success':
        return {
          iconBg: 'bg-emerald-50 text-emerald-600',
          border: 'border-l-4 border-l-emerald-500',
          valueColor: 'text-emerald-700',
        };
      case 'info':
        return {
          iconBg: 'bg-blue-50 text-blue-600',
          border: 'border-l-4 border-l-blue-500',
          valueColor: 'text-blue-700',
        };
      default:
        return {
          iconBg: 'bg-slate-100 text-slate-700',
          border: 'border-l-4 border-l-slate-400',
          valueColor: 'text-slate-900',
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <Card
      className={cn(
        'transition-all duration-200 hover:shadow-md cursor-pointer border-slate-200',
        styles.border,
        className
      )}
      onClick={onClick}
    >
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">{title}</p>
            <h3 className={cn('text-2xl font-bold mt-1 tracking-tight', styles.valueColor)}>
              {value}
            </h3>
            {description && (
              <p className="text-xs text-slate-500 mt-1">{description}</p>
            )}
            {trend && (
              <div className="flex items-center gap-1 mt-1 text-xs">
                <span className={trend.isPositive ? 'text-emerald-600' : 'text-red-600'}>
                  {trend.isPositive ? '+' : '-'}{Math.abs(trend.value)}%
                </span>
                <span className="text-slate-400">{trend.label}</span>
              </div>
            )}
          </div>
          <div className={cn('p-3 rounded-xl', styles.iconBg)}>
            <Icon className="w-5 h-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
