import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { defectService } from '@/services/defectService';
import { Defect } from '@/types';
import { DefectTable } from '@/components/defects/DefectTable';
import { TableSkeleton } from '@/components/common/LoadingSkeleton';
import { SearchFilterBar } from '@/components/common/SearchFilterBar';
import { HardHat } from 'lucide-react';

export const ContractorDefectsPage: React.FC = () => {
  const { contractor } = useAuth();
  const [searchParams] = useSearchParams();

  const [defects, setDefects] = useState<Defect[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>(searchParams.get('status') || 'all');
  const [severity, setSeverity] = useState<string>('all');
  const [isOverdue, setIsOverdue] = useState<boolean>(searchParams.get('overdue') === 'true');

  useEffect(() => {
    async function loadContractorDefects() {
      setIsLoading(true);
      try {
        const result = await defectService.getDefects({
          contractorId: contractor?.id || undefined,
          search,
          status: status as any,
          severity: severity as any,
          isOverdue,
        });
        setDefects(result.defects);
      } catch (err) {
        console.warn('Error loading contractor defects:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadContractorDefects();
  }, [contractor, search, status, severity, isOverdue]);

  const handleClearFilters = () => {
    setSearch('');
    setStatus('all');
    setSeverity('all');
    setIsOverdue(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <HardHat className="w-5 h-5 text-amber-500" />
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            My Assigned Defect Tasks
          </h1>
        </div>
        <p className="text-xs text-slate-500 mt-0.5">
          Restricted to snags allocated to <span className="font-semibold">{contractor?.company_name || 'Your Contractor Organization'}</span>
        </p>
      </div>

      {/* Filter Bar */}
      <SearchFilterBar
        search={search}
        onSearchChange={setSearch}
        status={status}
        onStatusChange={setStatus}
        severity={severity}
        onSeverityChange={setSeverity}
        isOverdue={isOverdue}
        onOverdueToggle={() => setIsOverdue(!isOverdue)}
        showContractorFilter={false}
        onClearFilters={handleClearFilters}
      />

      {/* Defect Table */}
      {isLoading ? (
        <TableSkeleton rows={5} />
      ) : (
        <DefectTable defects={defects} isContractorView={true} />
      )}
    </div>
  );
};
