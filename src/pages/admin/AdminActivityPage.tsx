import React, { useEffect, useState } from 'react';
import { activityService } from '@/services/activityService';
import { ActivityLog } from '@/types';
import { TableSkeleton } from '@/components/common/LoadingSkeleton';
import { formatDateTime } from '@/lib/utils';
import { History, Search, Filter, Shield, Code, ChevronDown, ChevronRight } from 'lucide-react';

export const AdminActivityPage: React.FC = () => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadLogs() {
      setIsLoading(true);
      try {
        const list = await activityService.getActivityLogs(100);
        setLogs(list);
      } catch (err) {
        console.warn('Error loading audit logs:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadLogs();
  }, []);

  const filtered = logs.filter((log) => {
    const matchesSearch =
      log.action.toLowerCase().includes(search.toLowerCase()) ||
      (log.entity_reference && log.entity_reference.toLowerCase().includes(search.toLowerCase())) ||
      (log.user?.full_name && log.user.full_name.toLowerCase().includes(search.toLowerCase())) ||
      (log.entity_type && log.entity_type.toLowerCase().includes(search.toLowerCase()));

    const matchesAction = actionFilter === 'all' || log.action === actionFilter;
    return matchesSearch && matchesAction;
  });

  const allActions = Array.from(new Set(logs.map((l) => l.action)));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <History className="w-5 h-5 text-blue-600" />
          <span>System Activity & Audit Trail</span>
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Immutable chronological audit log capturing lifecycle transitions, assignments, inspections, and administrative edits
        </p>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search audit trail by actor name, reference (e.g. BTX-0001), or action..."
            className="w-full pl-9 pr-4 py-2 text-sm rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          />
        </div>

        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="text-xs h-9 px-3 rounded-md border border-slate-300 bg-white text-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
        >
          <option value="all">All Actions</option>
          {allActions.map((act) => (
            <option key={act} value={act}>
              {act.replace(/_/g, ' ')}
            </option>
          ))}
        </select>
      </div>

      {/* Audit Log Table */}
      {isLoading ? (
        <TableSkeleton rows={8} />
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-lg border border-slate-200 text-slate-400 text-sm">
          No activity logs match your search.
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 uppercase font-semibold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Actor</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Target Entity</th>
                  <th className="py-3 px-4">Reference</th>
                  <th className="py-3 px-4 text-right">Metadata</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {filtered.map((log) => {
                  const isExpanded = expandedLogId === log.id;

                  return (
                    <React.Fragment key={log.id}>
                      <tr className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 whitespace-nowrap text-slate-500 font-sans text-xs">
                          {formatDateTime(log.created_at)}
                        </td>
                        <td className="py-3 px-4 font-sans font-semibold text-slate-900 text-xs">
                          {log.user?.full_name || 'System / Batch'}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                            {log.action}
                          </span>
                        </td>
                        <td className="py-3 px-4 uppercase text-slate-500 text-[11px]">
                          {log.entity_type}
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-800">
                          {log.entity_reference || '—'}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {log.metadata && Object.keys(log.metadata).length > 0 ? (
                            <button
                              onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                              className="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:underline font-sans font-medium"
                            >
                              <Code className="w-3.5 h-3.5" />
                              <span>{isExpanded ? 'Hide' : 'Inspect'}</span>
                            </button>
                          ) : (
                            <span className="text-slate-400 font-sans">—</span>
                          )}
                        </td>
                      </tr>

                      {/* Expandable JSON Metadata */}
                      {isExpanded && log.metadata && (
                        <tr className="bg-slate-900 text-slate-200">
                          <td colSpan={6} className="p-4">
                            <div className="text-[11px] space-y-1">
                              <span className="text-slate-400 font-semibold uppercase tracking-wider block">
                                Captured Payload Metadata:
                              </span>
                              <pre className="p-3 bg-slate-950 rounded border border-slate-800 overflow-x-auto text-emerald-400">
                                {JSON.stringify(log.metadata, null, 2)}
                              </pre>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
