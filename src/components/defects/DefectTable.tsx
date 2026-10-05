import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Defect } from '@/types';
import { StatusBadge } from '@/components/common/StatusBadge';
import { SeverityBadge } from '@/components/common/SeverityBadge';
import { AgeingBadge } from '@/components/common/AgeingBadge';
import { formatDate, isDefectOverdue } from '@/lib/utils';
import { Eye, AlertCircle, ArrowUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DefectTableProps {
  defects: Defect[];
  isLoading?: boolean;
  onSort?: (field: keyof Defect) => void;
  isContractorView?: boolean;
}

export const DefectTable: React.FC<DefectTableProps> = ({
  defects,
  isLoading = false,
  isContractorView = false,
}) => {
  const navigate = useNavigate();

  const handleRowClick = (defectId: string) => {
    navigate(isContractorView ? `/contractor/defects/${defectId}` : `/defects/${defectId}`);
  };

  if (defects.length === 0 && !isLoading) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 p-8 text-center text-sm text-slate-500">
        No defects found matching your criteria.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200">
            <tr>
              <th className="py-3 px-4">Defect ID</th>
              <th className="py-3 px-4">Title & Details</th>
              {!isContractorView && <th className="py-3 px-4">Project / Location</th>}
              <th className="py-3 px-4">Severity</th>
              <th className="py-3 px-4">Status</th>
              {!isContractorView && <th className="py-3 px-4">Contractor</th>}
              <th className="py-3 px-4">Due Date</th>
              <th className="py-3 px-4">Ageing</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {defects.map((defect) => {
              const overdue = isDefectOverdue(defect.status, defect.due_date);

              return (
                <tr
                  key={defect.id}
                  onClick={() => handleRowClick(defect.id)}
                  className={`hover:bg-slate-50/80 cursor-pointer transition-colors ${
                    overdue ? 'bg-red-50/20' : ''
                  }`}
                >
                  {/* Defect ID */}
                  <td className="py-3 px-4 font-mono font-bold text-xs text-blue-600">
                    {defect.reference}
                  </td>

                  {/* Title & Category */}
                  <td className="py-3 px-4 max-w-xs">
                    <p className="font-semibold text-slate-900 truncate">{defect.title}</p>
                    <p className="text-xs text-slate-400 truncate mt-0.5">
                      {defect.category || 'General'}
                    </p>
                  </td>

                  {/* Project & Location */}
                  {!isContractorView && (
                    <td className="py-3 px-4 text-xs text-slate-500 max-w-[180px]">
                      <p className="font-medium text-slate-800 truncate">{defect.project?.name || '—'}</p>
                      <p className="text-slate-400 truncate">
                        {[defect.building?.name, defect.floor?.name, defect.zone?.name]
                          .filter(Boolean)
                          .join(' > ') || '—'}
                      </p>
                    </td>
                  )}

                  {/* Severity */}
                  <td className="py-3 px-4">
                    <SeverityBadge severity={defect.severity} />
                  </td>

                  {/* Status */}
                  <td className="py-3 px-4">
                    <StatusBadge status={defect.status} />
                  </td>

                  {/* Contractor */}
                  {!isContractorView && (
                    <td className="py-3 px-4 text-xs">
                      {defect.contractor ? (
                        <span className="font-medium text-slate-800">{defect.contractor.company_name}</span>
                      ) : (
                        <span className="text-amber-600 font-semibold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          Unassigned
                        </span>
                      )}
                    </td>
                  )}

                  {/* Due Date & Overdue Indicator */}
                  <td className="py-3 px-4 text-xs whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <span className={overdue ? 'text-red-600 font-bold' : 'text-slate-700'}>
                        {formatDate(defect.due_date)}
                      </span>
                      {overdue && (
                        <span className="inline-flex items-center text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                          Overdue
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Ageing Badge */}
                  <td className="py-3 px-4">
                    <AgeingBadge createdAt={defect.created_at} closedAt={defect.closed_at} />
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-4 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRowClick(defect.id);
                      }}
                      className="text-slate-500 hover:text-blue-600 h-8 px-2"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
