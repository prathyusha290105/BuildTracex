import React from 'react';
import { Search, X, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DefectStatus, DefectSeverity, Contractor } from '@/types';

interface SearchFilterBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  status?: string;
  onStatusChange?: (value: string) => void;
  severity?: string;
  onSeverityChange?: (value: string) => void;
  contractorId?: string;
  onContractorChange?: (value: string) => void;
  isOverdue?: boolean;
  onOverdueToggle?: () => void;
  contractors?: Contractor[];
  showContractorFilter?: boolean;
  showOverdueFilter?: boolean;
  onClearFilters: () => void;
  placeholder?: string;
}

export const SearchFilterBar: React.FC<SearchFilterBarProps> = ({
  search,
  onSearchChange,
  status,
  onStatusChange,
  severity,
  onSeverityChange,
  contractorId,
  onContractorChange,
  isOverdue,
  onOverdueToggle,
  contractors = [],
  showContractorFilter = true,
  showOverdueFilter = true,
  onClearFilters,
  placeholder = 'Search by ID (e.g. BTX-0001), title, or keywords...',
}) => {
  const hasActiveFilters =
    Boolean(search) ||
    (status && status !== 'all') ||
    (severity && severity !== 'all') ||
    (contractorId && contractorId !== 'all') ||
    Boolean(isOverdue);

  return (
    <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm space-y-3 mb-6">
      <div className="flex flex-col md:flex-row gap-3">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={placeholder}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent placeholder:text-slate-400"
          />
          {search && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter controls row */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status filter */}
          {onStatusChange && (
            <select
              value={status || 'all'}
              onChange={(e) => onStatusChange(e.target.value)}
              className="text-xs h-9 px-2.5 rounded-md border border-slate-300 bg-white text-slate-700 focus:ring-2 focus:ring-primary-500 focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="open">Open</option>
              <option value="assigned">Assigned</option>
              <option value="rectification_in_progress">In Progress</option>
              <option value="rectification_submitted">Rectification Submitted</option>
              <option value="awaiting_reinspection">Awaiting Reinspection</option>
              <option value="closed">Closed</option>
              <option value="rejected">Rejected</option>
              <option value="reopened">Reopened</option>
            </select>
          )}

          {/* Severity filter */}
          {onSeverityChange && (
            <select
              value={severity || 'all'}
              onChange={(e) => onSeverityChange(e.target.value)}
              className="text-xs h-9 px-2.5 rounded-md border border-slate-300 bg-white text-slate-700 focus:ring-2 focus:ring-primary-500 focus:outline-none"
            >
              <option value="all">All Severities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          )}

          {/* Contractor filter */}
          {showContractorFilter && onContractorChange && contractors.length > 0 && (
            <select
              value={contractorId || 'all'}
              onChange={(e) => onContractorChange(e.target.value)}
              className="text-xs h-9 px-2.5 rounded-md border border-slate-300 bg-white text-slate-700 focus:ring-2 focus:ring-primary-500 focus:outline-none max-w-[160px] truncate"
            >
              <option value="all">All Contractors</option>
              {contractors.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.company_name}
                </option>
              ))}
            </select>
          )}

          {/* Overdue toggle */}
          {showOverdueFilter && onOverdueToggle && (
            <button
              type="button"
              onClick={onOverdueToggle}
              className={`text-xs h-9 px-3 rounded-md border font-medium transition-colors flex items-center gap-1.5 ${
                isOverdue
                  ? 'bg-red-50 text-red-700 border-red-300'
                  : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${isOverdue ? 'bg-red-500' : 'bg-slate-300'}`} />
              Overdue Only
            </button>
          )}

          {/* Clear filters button */}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearFilters}
              className="text-xs text-slate-500 hover:text-red-600 h-9"
            >
              <X className="w-3.5 h-3.5 mr-1" />
              Reset Filters
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
