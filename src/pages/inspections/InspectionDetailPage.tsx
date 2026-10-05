import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, NavLink } from 'react-router-dom';
import { inspectionService } from '@/services/inspectionService';
import { reportService } from '@/services/reportService';
import { Inspection } from '@/types';
import { DetailSkeleton } from '@/components/common/LoadingSkeleton';
import { StatusBadge } from '@/components/common/StatusBadge';
import { SeverityBadge } from '@/components/common/SeverityBadge';
import { EvidenceGallery } from '@/components/evidence/EvidenceGallery';
import { formatDate, formatDateTime } from '@/lib/utils';
import {
  ClipboardCheck,
  Building2,
  Calendar,
  User,
  MapPin,
  CheckCircle2,
  XCircle,
  Minus,
  FileDown,
  ArrowLeft,
  ChevronRight,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export const InspectionDetailPage: React.FC = () => {
  const { inspectionId } = useParams<{ inspectionId: string }>();
  const navigate = useNavigate();

  const [inspection, setInspection] = useState<Inspection | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (inspectionId) {
      setIsLoading(true);
      inspectionService
        .getInspectionById(inspectionId)
        .then((data) => setInspection(data))
        .catch((err) => console.warn('Error loading inspection:', err))
        .finally(() => setIsLoading(false));
    }
  }, [inspectionId]);

  if (isLoading) return <DetailSkeleton />;

  if (!inspection) {
    return (
      <div className="p-8 text-center bg-white rounded-lg border border-slate-200">
        <p className="text-slate-500 mb-4">Inspection record not found.</p>
        <Button variant="outline" onClick={() => navigate('/inspections')}>
          Back to Inspections
        </Button>
      </div>
    );
  }

  const handleDownloadPDF = () => {
    if (inspection) {
      reportService.generateInspectionPDF(inspection);
    }
  };

  const passCount = (inspection.responses || []).filter((r) => r.response === 'pass').length;
  const failCount = (inspection.responses || []).filter((r) => r.response === 'fail').length;
  const naCount = (inspection.responses || []).filter((r) => r.response === 'not_applicable').length;

  return (
    <div className="space-y-6">
      {/* Breadcrumb Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <NavLink to="/inspections" className="hover:text-blue-600 flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Inspections</span>
          </NavLink>
          <ChevronRight className="w-3 h-3 text-slate-300" />
          <span className="font-mono font-bold text-slate-800">{inspection.reference}</span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadPDF}
            className="gap-1.5 font-semibold text-slate-700"
          >
            <FileDown className="w-4 h-4 text-blue-600" />
            Download Inspection PDF
          </Button>
        </div>
      </div>

      {/* Main Inspection Dossier Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 pb-5 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2.5 mb-2">
                <span className="font-mono text-sm font-bold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded border border-blue-200">
                  {inspection.reference}
                </span>
                <StatusBadge status={inspection.status} />
              </div>

              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                {inspection.template_name_snapshot}
              </h1>

              <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-500 mt-2">
                <span className="flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-medium text-slate-700">{inspection.project?.name}</span>
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>
                    {[inspection.building?.name, inspection.floor?.name, inspection.zone?.name]
                      .filter(Boolean)
                      .join(' > ') || 'General Site'}
                  </span>
                </span>
                <span className="flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>Inspector: {inspection.inspector?.full_name || 'QA Engineer'}</span>
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>Conducted: {formatDate(inspection.inspection_date)}</span>
                </span>
              </div>
            </div>

            {/* Scorecard pill */}
            <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200 self-start">
              <div className="text-center px-2">
                <span className="block text-base font-bold text-emerald-600">{passCount}</span>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Pass</span>
              </div>
              <div className="h-6 w-px bg-slate-200" />
              <div className="text-center px-2">
                <span className="block text-base font-bold text-red-600">{failCount}</span>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Fail</span>
              </div>
              <div className="h-6 w-px bg-slate-200" />
              <div className="text-center px-2">
                <span className="block text-base font-bold text-slate-600">{naCount}</span>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">N/A</span>
              </div>
            </div>
          </div>

          {inspection.notes && (
            <div className="mt-4 p-3 bg-slate-50 rounded text-xs text-slate-600 border border-slate-200">
              <span className="font-bold text-slate-800 uppercase text-[10px] tracking-wider block mb-1">
                Field Audit Notes:
              </span>
              {inspection.notes}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Checklist Evaluation Breakdown */}
      <Card>
        <CardHeader className="pb-3 border-b border-slate-100">
          <CardTitle className="text-sm font-bold text-slate-900">
            Checklist Item Evaluations ({inspection.responses?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-slate-100">
            {(inspection.responses || []).map((resp, idx) => {
              const isPass = resp.response === 'pass';
              const isFail = resp.response === 'fail';

              return (
                <div key={resp.id} className="p-4 hover:bg-slate-50/50 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <div>
                        <h4 className="text-sm font-semibold text-slate-900">
                          {resp.item_title_snapshot}
                        </h4>
                        {resp.item_description_snapshot && (
                          <p className="text-xs text-slate-400 mt-0.5">
                            {resp.item_description_snapshot}
                          </p>
                        )}
                        {resp.remarks && (
                          <p className="text-xs text-slate-700 bg-slate-50 p-2 rounded mt-2 border border-slate-100">
                            <span className="font-semibold text-slate-900">Inspector Observation:</span>{' '}
                            {resp.remarks}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="self-start sm:self-auto flex items-center gap-2">
                      {isPass && (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          PASS
                        </span>
                      )}
                      {isFail && (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-red-700 bg-red-50 border border-red-200 px-2.5 py-1 rounded-full">
                          <XCircle className="w-3.5 h-3.5" />
                          FAIL
                        </span>
                      )}
                      {!isPass && !isFail && (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-600 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-full">
                          <Minus className="w-3.5 h-3.5" />
                          N/A
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Linked Defects Section */}
      {inspection.defects && inspection.defects.length > 0 && (
        <Card>
          <CardHeader className="pb-3 border-b border-slate-100 bg-red-50/40">
            <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <span>Defects Logged from this Inspection ({inspection.defects.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-100">
              {inspection.defects.map((def: any) => (
                <div
                  key={def.id}
                  onClick={() => navigate(`/defects/${def.id}`)}
                  className="p-4 hover:bg-slate-50 cursor-pointer flex items-center justify-between gap-3 transition-colors"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-blue-600">
                        {def.reference}
                      </span>
                      <SeverityBadge severity={def.severity} />
                      <StatusBadge status={def.status} />
                    </div>
                    <p className="text-sm font-semibold text-slate-900 mt-1">{def.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Contractor: {def.contractor?.company_name || 'Unassigned'}
                    </p>
                  </div>

                  <span className="text-xs text-blue-600 font-semibold hover:underline flex items-center gap-1">
                    <span>Inspect Ticket</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Photographic Evidence Gallery */}
      {inspection.evidence && inspection.evidence.length > 0 && (
        <Card>
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-sm font-bold text-slate-900">
              Site Photographic Evidence ({inspection.evidence.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <EvidenceGallery evidence={inspection.evidence} />
          </CardContent>
        </Card>
      )}
    </div>
  );
};
