import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useProject } from '@/context/ProjectContext';
import { defectService } from '@/services/defectService';
import { contractorService } from '@/services/contractorService';
import { reportService } from '@/services/reportService';
import { Defect, Contractor, DefectStatus, DefectSeverity } from '@/types';
import { SearchFilterBar } from '@/components/common/SearchFilterBar';
import { DefectTable } from '@/components/defects/DefectTable';
import { TableSkeleton } from '@/components/common/LoadingSkeleton';
import {
  AlertTriangle,
  Plus,
  FileDown,
  Download,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export const DefectsListPage: React.FC = () => {
  const { hasRole, isContractor } = useAuth();
  const { selectedProjectId, selectedProject } = useProject();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [defects, setDefects] = useState<Defect[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters state
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>(searchParams.get('status') || 'all');
  const [severity, setSeverity] = useState<string>('all');
  const [contractorId, setContractorId] = useState<string>('all');
  const [isOverdue, setIsOverdue] = useState<boolean>(searchParams.get('overdue') === 'true');

  useEffect(() => {
    contractorService.getContractors().then((cList) => {
      setContractors(cList.filter((c) => c.is_active));
    });
  }, []);

  const loadDefects = async () => {
    setIsLoading(true);
    try {
      const result = await defectService.getDefects({
        projectId: selectedProjectId,
        search,
        status: status as any,
        severity: severity as any,
        contractorId: contractorId !== 'all' ? contractorId : undefined,
        isOverdue,
      });

      setDefects(result.defects);
      setTotalCount(result.totalCount);
    } catch (err) {
      console.warn('Error loading defects:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDefects();
  }, [selectedProjectId, search, status, severity, contractorId, isOverdue]);

  const handleClearFilters = () => {
    setSearch('');
    setStatus('all');
    setSeverity('all');
    setContractorId('all');
    setIsOverdue(false);
  };

  const handleExportPDF = () => {
    const scopeDesc = selectedProject ? selectedProject.name : 'All Projects';
    reportService.generateDefectRegisterPDF(defects, scopeDesc);
  };

  const canCreate = hasRole(['system_admin', 'quality_manager', 'qaqc_engineer', 'site_engineer']);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Defect Tracking Register
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Total {totalCount} quality snags recorded across projects and locations
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportPDF}
            className="gap-1.5 font-semibold text-slate-700"
          >
            <Download className="w-4 h-4 text-blue-600" />
            Export Defect Register (PDF)
          </Button>

          {canCreate && (
            <Button
              size="sm"
              onClick={() => navigate('/defects/new')}
              className="gap-1.5 font-semibold"
            >
              <Plus className="w-4 h-4" />
              Report New Defect
            </Button>
          )}
        </div>
      </div>

      {/* Real Filter & Search Bar */}
      <SearchFilterBar
        search={search}
        onSearchChange={setSearch}
        status={status}
        onStatusChange={setStatus}
        severity={severity}
        onSeverityChange={setSeverity}
        contractorId={contractorId}
        onContractorChange={setContractorId}
        isOverdue={isOverdue}
        onOverdueToggle={() => setIsOverdue(!isOverdue)}
        contractors={contractors}
        onClearFilters={handleClearFilters}
      />

      {/* Defect Table */}
      {isLoading ? (
        <TableSkeleton rows={6} />
      ) : (
        <DefectTable defects={defects} isContractorView={isContractor()} />
      )}
    </div>
  );
};
