import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, NavLink } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { defectService } from '@/services/defectService';
import { rectificationService } from '@/services/rectificationService';
import { reinspectionService } from '@/services/reinspectionService';
import { reportService } from '@/services/reportService';
import { Defect, UserRole } from '@/types';
import { DetailSkeleton } from '@/components/common/LoadingSkeleton';
import { StatusBadge } from '@/components/common/StatusBadge';
import { SeverityBadge } from '@/components/common/SeverityBadge';
import { AgeingBadge } from '@/components/common/AgeingBadge';
import { EvidenceGallery } from '@/components/evidence/EvidenceGallery';
import { PhotoUploader } from '@/components/evidence/PhotoUploader';
import { AssignmentModal } from '@/components/defects/AssignmentModal';
import { ConfirmationDialog } from '@/components/common/ConfirmationDialog';
import {
  formatDate,
  formatDateTime,
  formatStatusLabel,
  isDefectOverdue,
  canTransitionStatus,
} from '@/lib/utils';
import {
  AlertTriangle,
  Building2,
  Calendar,
  Clock,
  User,
  HardHat,
  MapPin,
  CheckCircle2,
  XCircle,
  RotateCcw,
  FileDown,
  ArrowLeft,
  ChevronRight,
  MessageSquare,
  History,
  Send,
  Camera,
  Check,
  X,
  FileCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export const DefectDetailPage: React.FC = () => {
  const { defectId } = useParams<{ defectId: string }>();
  const { profile, role, canApproveClosure, isContractor, isAdmin } = useAuth();
  const navigate = useNavigate();

  const [defect, setDefect] = useState<Defect | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [commentInput, setCommentInput] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  // Modal dialog states
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isRectificationModalOpen, setIsRectificationModalOpen] = useState(false);
  const [isReinspectionModalOpen, setIsReinspectionModalOpen] = useState(false);
  const [isReopenModalOpen, setIsReopenModalOpen] = useState(false);

  // Rectification submission state
  const [rectDescription, setRectDescription] = useState('');
  const [rectSummary, setRectSummary] = useState('');
  const [rectPhotos, setRectPhotos] = useState<File[]>([]);
  const [isSubmittingRect, setIsSubmittingRect] = useState(false);

  // Reinspection state
  const [reinspOutcome, setReinspOutcome] = useState<'approved' | 'rejected'>('approved');
  const [reinspComments, setReinspComments] = useState('');
  const [reinspPhotos, setReinspPhotos] = useState<File[]>([]);
  const [isSubmittingReinsp, setIsSubmittingReinsp] = useState(false);

  // Error/Feedback
  const [actionError, setActionError] = useState('');

  const loadDefect = async () => {
    if (!defectId) return;
    setIsLoading(true);
    try {
      const data = await defectService.getDefectById(defectId);
      setDefect(data);
    } catch (err) {
      console.warn('Error loading defect detail:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDefect();
  }, [defectId]);

  if (isLoading) return <DetailSkeleton />;

  if (!defect) {
    return (
      <div className="p-8 text-center bg-white rounded-lg border border-slate-200">
        <p className="text-slate-500 mb-4">Defect ticket not found or access denied.</p>
        <Button variant="outline" onClick={() => navigate('/defects')}>
          Back to Defects
        </Button>
      </div>
    );
  }

  const overdue = isDefectOverdue(defect.status, defect.due_date);

  // Handle Contractor starting work (Assigned -> In Progress)
  const handleAcknowledgeWork = async () => {
    try {
      await defectService.transitionStatus(defect.id, 'rectification_in_progress', 'Contractor acknowledged assignment and commenced site rectification work', role);
      loadDefect();
    } catch (err: any) {
      setActionError(err.message || 'Failed to update status');
    }
  };

  // Handle Contractor Submitting Rectification
  const handleSubmitRectification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rectDescription.trim()) {
      setActionError('Please describe the repair work performed.');
      return;
    }

    setIsSubmittingRect(true);
    setActionError('');
    try {
      await rectificationService.submitRectification({
        defectId: defect.id,
        description: rectDescription,
        completionSummary: rectSummary,
        photos: rectPhotos,
      });

      setIsRectificationModalOpen(false);
      setRectDescription('');
      setRectSummary('');
      setRectPhotos([]);
      loadDefect();
    } catch (err: any) {
      setActionError(err.message || 'Failed to submit rectification');
    } finally {
      setIsSubmittingRect(false);
    }
  };

  // Handle QA Reinspection Decision (Approve / Reject)
  const handleSubmitReinspection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (reinspOutcome === 'rejected' && !reinspComments.trim()) {
      setActionError('A detailed rejection reason is mandatory when failing a repair.');
      return;
    }

    setIsSubmittingReinsp(true);
    setActionError('');
    try {
      const latestRect = defect.rectifications?.[0];
      await reinspectionService.submitReinspection({
        defectId: defect.id,
        rectificationSubmissionId: latestRect?.id,
        outcome: reinspOutcome,
        comments: reinspComments,
        photos: reinspPhotos,
      });

      setIsReinspectionModalOpen(false);
      setReinspComments('');
      setReinspPhotos([]);
      loadDefect();
    } catch (err: any) {
      setActionError(err.message || 'Failed to submit reinspection review');
    } finally {
      setIsSubmittingReinsp(false);
    }
  };

  // Handle Reopening Closed Defect
  const handleReopenDefect = async (reason?: string) => {
    if (!reason || !reason.trim()) {
      setActionError('Reason is required to reopen defect.');
      return;
    }
    try {
      await reinspectionService.reopenDefect(defect.id, reason);
      setIsReopenModalOpen(false);
      loadDefect();
    } catch (err: any) {
      setActionError(err.message || 'Failed to reopen defect');
    }
  };

  // Handle Add Comment
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInput.trim()) return;

    setIsSubmittingComment(true);
    try {
      await defectService.addComment(defect.id, commentInput);
      setCommentInput('');
      loadDefect();
    } catch (err) {
      console.warn('Failed to add comment:', err);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  // Handle PDF Export
  const handleDownloadPDF = () => {
    if (defect) {
      reportService.generateDefectPDF(defect);
    }
  };

  // Permission guards for buttons
  const canAssign = !isContractor() && (isAdmin() || role === 'quality_manager' || role === 'qaqc_engineer' || role === 'project_manager');
  const canContractorRectify = isContractor() || isAdmin();
  const canInspect = canApproveClosure();

  return (
    <div className="space-y-6">
      {/* Top Header & Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <NavLink to={isContractor() ? '/contractor/defects' : '/defects'} className="hover:text-blue-600 flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Defects</span>
          </NavLink>
          <ChevronRight className="w-3 h-3 text-slate-300" />
          <span className="font-mono font-bold text-slate-800">{defect.reference}</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadPDF}
            className="gap-1.5 font-semibold text-slate-700"
          >
            <FileDown className="w-4 h-4 text-blue-600" />
            Download Defect Dossier (PDF)
          </Button>

          {/* Action 1: Assign / Reassign */}
          {canAssign && defect.status !== 'closed' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAssignModalOpen(true)}
              className="gap-1.5 font-semibold text-amber-700 border-amber-300 hover:bg-amber-50"
            >
              <HardHat className="w-4 h-4" />
              {defect.contractor ? 'Reassign Contractor' : 'Assign Contractor'}
            </Button>
          )}

          {/* Action 2: Contractor Acknowledge Assignment */}
          {canContractorRectify && defect.status === 'assigned' && (
            <Button
              variant="default"
              size="sm"
              onClick={handleAcknowledgeWork}
              className="gap-1.5 font-semibold bg-amber-600 hover:bg-amber-700 text-white"
            >
              <Clock className="w-4 h-4" />
              Start Rectification Work
            </Button>
          )}

          {/* Action 3: Contractor Submit Rectification */}
          {canContractorRectify &&
            (defect.status === 'rectification_in_progress' || defect.status === 'reopened' || defect.status === 'assigned') && (
              <Button
                variant="default"
                size="sm"
                onClick={() => {
                  setActionError('');
                  setIsRectificationModalOpen(true);
                }}
                className="gap-1.5 font-semibold bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Camera className="w-4 h-4" />
                Submit Rectification Evidence
              </Button>
            )}

          {/* Action 4: QA Reinspection Review (Approve or Reject) */}
          {canInspect &&
            (defect.status === 'rectification_submitted' || defect.status === 'awaiting_reinspection') && (
              <Button
                variant="default"
                size="sm"
                onClick={() => {
                  setActionError('');
                  setIsReinspectionModalOpen(true);
                }}
                className="gap-1.5 font-semibold bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <FileCheck className="w-4 h-4" />
                Perform Reinspection Review
              </Button>
            )}

          {/* Action 5: Reopen Closed Defect */}
          {canInspect && defect.status === 'closed' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsReopenModalOpen(true)}
              className="gap-1.5 font-semibold text-orange-600 border-orange-300 hover:bg-orange-50"
            >
              <RotateCcw className="w-4 h-4" />
              Reopen Defect
            </Button>
          )}
        </div>
      </div>

      {actionError && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{actionError}</span>
          </div>
          <button onClick={() => setActionError('')} className="text-red-500 hover:text-red-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* SECTION A: SUMMARY & STATUS HEADER */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 pb-5 border-b border-slate-100">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="font-mono text-sm font-bold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded border border-blue-200">
                  {defect.reference}
                </span>
                <SeverityBadge severity={defect.severity} />
                <StatusBadge status={defect.status} />
                {overdue && (
                  <span className="text-xs font-bold text-red-700 bg-red-100 border border-red-200 px-2 py-0.5 rounded uppercase">
                    OVERDUE ({defect.due_date})
                  </span>
                )}
                <AgeingBadge createdAt={defect.created_at} closedAt={defect.closed_at} />
              </div>

              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{defect.title}</h1>

              <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-500 mt-2">
                <span className="flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>Reported By: {defect.reporter?.full_name || 'QA Inspector'}</span>
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>Logged: {formatDate(defect.created_at)}</span>
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Due: {formatDate(defect.due_date)}</span>
                </span>
              </div>
            </div>

            {/* Contractor Card Snapshot */}
            <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 min-w-[200px] text-xs">
              <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider mb-1">
                Assigned Contractor:
              </span>
              {defect.contractor ? (
                <div>
                  <p className="font-bold text-slate-900">{defect.contractor.company_name}</p>
                  <p className="text-slate-500 text-[11px]">{defect.contractor.specialization || 'General Works'}</p>
                  {defect.contractor.contact_person && (
                    <p className="text-slate-400 text-[10px] mt-1">Contact: {defect.contractor.contact_person}</p>
                  )}
                </div>
              ) : (
                <div className="text-amber-600 font-semibold flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Unassigned</span>
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="mt-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-1">
              Defect Description & Non-Conformance:
            </h4>
            <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-3.5 rounded border border-slate-100">
              {defect.description || 'No detailed description provided.'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* SECTION B: LOCATION & SOURCE */}
      <Card>
        <CardHeader className="pb-3 border-b border-slate-100">
          <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-blue-600" />
            <span>Location & Inspection Audit Source</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-slate-400 uppercase font-semibold block">Project</span>
              <span className="font-bold text-slate-800 mt-0.5 block">{defect.project?.name || '—'}</span>
            </div>
            <div>
              <span className="text-slate-400 uppercase font-semibold block">Building / Block</span>
              <span className="font-semibold text-slate-800 mt-0.5 block">{defect.building?.name || '—'}</span>
            </div>
            <div>
              <span className="text-slate-400 uppercase font-semibold block">Floor</span>
              <span className="font-semibold text-slate-800 mt-0.5 block">{defect.floor?.name || '—'}</span>
            </div>
            <div>
              <span className="text-slate-400 uppercase font-semibold block">Zone / Unit</span>
              <span className="font-semibold text-slate-800 mt-0.5 block">{defect.zone?.name || '—'}</span>
            </div>
          </div>

          {defect.inspection_id && (
            <div className="mt-4 p-3 bg-blue-50/60 rounded border border-blue-100 flex items-center justify-between text-xs">
              <span className="text-blue-900">
                Generated from Quality Inspection Check
              </span>
              <NavLink
                to={`/inspections/${defect.inspection_id}`}
                className="text-blue-600 font-semibold hover:underline flex items-center gap-1"
              >
                <span>View Source Audit</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </NavLink>
            </div>
          )}
        </CardContent>
      </Card>

      {/* SECTION D: ORIGINAL EVIDENCE */}
      <Card>
        <CardHeader className="pb-3 border-b border-slate-100">
          <CardTitle className="text-sm font-bold text-slate-900">
            Original Before-Inspection Evidence
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <EvidenceGallery
            evidence={defect.evidence || []}
            stageFilter="defect_report"
            emptyMessage="No original before-rectification photographs were uploaded."
          />
        </CardContent>
      </Card>

      {/* SECTION E: RECTIFICATION SUBMISSIONS */}
      <Card>
        <CardHeader className="pb-3 border-b border-slate-100 bg-cyan-50/30">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <HardHat className="w-4 h-4 text-cyan-700" />
              <span>Contractor Rectification Submissions ({defect.rectifications?.length || 0})</span>
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-5">
          {(!defect.rectifications || defect.rectifications.length === 0) ? (
            <p className="text-xs text-slate-400 py-3 text-center">
              No rectification reports submitted by the contractor yet.
            </p>
          ) : (
            <div className="space-y-4">
              {defect.rectifications.map((r, i) => (
                <div key={r.id} className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800">
                      Submission #{defect.rectifications!.length - i} &bull; {r.submitter?.full_name || 'Contractor'}
                    </span>
                    <span className="text-slate-400">{formatDateTime(r.submitted_at)}</span>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed">{r.description}</p>
                  {r.completion_summary && (
                    <p className="text-xs text-slate-600 bg-white p-2 rounded border border-slate-100 italic">
                      <span className="font-semibold text-slate-800">Completion Summary:</span> {r.completion_summary}
                    </p>
                  )}
                  {/* Rectification photos */}
                  <div className="pt-2">
                    <EvidenceGallery
                      evidence={defect.evidence || []}
                      stageFilter="contractor_rectification"
                      emptyMessage="No photo attachments for this submission."
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* SECTION F: REINSPECTIONS & CLOSURE VERIFICATION */}
      <Card>
        <CardHeader className="pb-3 border-b border-slate-100 bg-emerald-50/30">
          <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-700" />
            <span>QA/QC Reinspections & Verification Reviews ({defect.reinspections?.length || 0})</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5">
          {(!defect.reinspections || defect.reinspections.length === 0) ? (
            <p className="text-xs text-slate-400 py-3 text-center">
              No reinspection decisions recorded yet.
            </p>
          ) : (
            <div className="space-y-4">
              {defect.reinspections.map((ri) => {
                const approved = ri.outcome === 'approved';

                return (
                  <div
                    key={ri.id}
                    className={`p-4 rounded-lg border ${
                      approved ? 'bg-emerald-50/40 border-emerald-300' : 'bg-rose-50/40 border-rose-300'
                    } space-y-2`}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-bold px-2 py-0.5 rounded text-[10px] uppercase tracking-wider ${
                            approved ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
                          }`}
                        >
                          {ri.outcome.toUpperCase()}
                        </span>
                        <span className="font-bold text-slate-800">
                          Reviewer: {ri.reviewer?.full_name || 'QA Reviewer'}
                        </span>
                      </div>
                      <span className="text-slate-400">{formatDateTime(ri.reviewed_at)}</span>
                    </div>

                    <p className="text-xs text-slate-700 leading-relaxed font-medium">
                      {ri.comments}
                    </p>

                    <div className="pt-2">
                      <EvidenceGallery
                        evidence={defect.evidence || []}
                        stageFilter="reinspection"
                        emptyMessage="No reinspection verification photos."
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* SECTION G: CHRONOLOGICAL ACTIVITY TIMELINE */}
      <Card>
        <CardHeader className="pb-3 border-b border-slate-100">
          <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <History className="w-4 h-4 text-slate-600" />
            <span>Defect Status Audit Trail & Timeline</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5">
          {(!defect.history || defect.history.length === 0) ? (
            <p className="text-xs text-slate-400 py-2">No history events recorded.</p>
          ) : (
            <div className="space-y-4 relative pl-4 border-l-2 border-slate-200">
              {defect.history.map((h) => (
                <div key={h.id} className="relative text-xs">
                  <div className="absolute -left-[21px] top-0.5 w-2.5 h-2.5 rounded-full bg-blue-600 border-2 border-white" />
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">
                      {h.previous_status ? (
                        <>
                          <span className="text-slate-500">{formatStatusLabel(h.previous_status)}</span>
                          <span className="mx-1 text-slate-400">&rarr;</span>
                        </>
                      ) : null}
                      <span className="text-blue-600">{formatStatusLabel(h.new_status)}</span>
                    </span>
                    <span className="text-[10px] text-slate-400">{formatDateTime(h.created_at)}</span>
                  </div>
                  <p className="text-slate-600 mt-0.5">
                    <span className="font-semibold text-slate-700">{h.changer?.full_name || 'System'}:</span>{' '}
                    {h.reason || 'Status updated'}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* SECTION: COMMENTS & COORDINATION */}
      <Card>
        <CardHeader className="pb-3 border-b border-slate-100">
          <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-slate-600" />
            <span>Comments & On-Site Coordination ({defect.comments?.length || 0})</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5 space-y-4">
          <div className="space-y-3 max-h-72 overflow-y-auto">
            {(!defect.comments || defect.comments.length === 0) ? (
              <p className="text-xs text-slate-400 text-center py-4">No comments posted yet.</p>
            ) : (
              defect.comments.map((c) => (
                <div key={c.id} className="p-3 bg-slate-50 rounded-lg text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">{c.user?.full_name || 'User'}</span>
                    <span className="text-[10px] text-slate-400">{formatDateTime(c.created_at)}</span>
                  </div>
                  <p className="text-slate-700">{c.content}</p>
                </div>
              ))
            )}
          </div>

          <form onSubmit={handleAddComment} className="flex gap-2 pt-2 border-t border-slate-100">
            <Input
              value={commentInput}
              onChange={(e) => setCommentInput(e.target.value)}
              placeholder="Add progress note or site coordination comment..."
              className="text-xs"
            />
            <Button
              type="submit"
              size="sm"
              variant="default"
              isLoading={isSubmittingComment}
              className="gap-1 font-semibold"
            >
              <Send className="w-3.5 h-3.5" />
              Post
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* MODAL 1: ASSIGN / REASSIGN */}
      <AssignmentModal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        defectReference={defect.reference}
        currentContractorId={defect.contractor_id}
        currentDueDate={defect.due_date}
        onAssign={async (contractorId, assignedTo, dueDate, notes) => {
          await defectService.assignDefect(defect.id, contractorId, assignedTo, dueDate, notes);
          loadDefect();
        }}
      />

      {/* MODAL 2: CONTRACTOR RECTIFICATION SUBMISSION */}
      {isRectificationModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-in fade-in">
          <div className="bg-white rounded-lg shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="font-semibold text-sm">
                Submit Rectification: <span className="font-mono text-cyan-400">{defect.reference}</span>
              </h3>
              <button onClick={() => setIsRectificationModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitRectification} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Rectification Work Performed <span className="text-red-500">*</span>
                </label>
                <Textarea
                  value={rectDescription}
                  onChange={(e) => setRectDescription(e.target.value)}
                  placeholder="Detail the materials used, corrective actions taken, and method of repair..."
                  required
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Completion Summary
                </label>
                <Input
                  value={rectSummary}
                  onChange={(e) => setRectSummary(e.target.value)}
                  placeholder="e.g. Replastered with polymer compound, ready for QA reinspection."
                />
              </div>

              <div>
                <PhotoUploader
                  files={rectPhotos}
                  onChange={setRectPhotos}
                  label="Upload Rectification Proof Photographs"
                  required={true}
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsRectificationModalOpen(false)}
                  disabled={isSubmittingRect}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="default" size="sm" isLoading={isSubmittingRect} className="font-semibold">
                  Submit Work for Reinspection
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: QA REINSPECTION REVIEW */}
      {isReinspectionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-in fade-in">
          <div className="bg-white rounded-lg shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="font-semibold text-sm">
                Site Reinspection Review: <span className="font-mono text-emerald-400">{defect.reference}</span>
              </h3>
              <button onClick={() => setIsReinspectionModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitReinspection} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
                  Reinspection Verification Decision <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setReinspOutcome('approved')}
                    className={`p-3 rounded-lg border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                      reinspOutcome === 'approved'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-700 ring-2 ring-emerald-500 ring-offset-1'
                        : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Pass / Approve Closure</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setReinspOutcome('rejected')}
                    className={`p-3 rounded-lg border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                      reinspOutcome === 'rejected'
                        ? 'bg-rose-50 border-rose-500 text-rose-700 ring-2 ring-rose-500 ring-offset-1'
                        : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <XCircle className="w-4 h-4 text-rose-600" />
                    <span>Fail / Reject Repair</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Reviewer Verification Notes {reinspOutcome === 'rejected' && <span className="text-red-500">* (Mandatory reason)</span>}
                </label>
                <Textarea
                  value={reinspComments}
                  onChange={(e) => setReinspComments(e.target.value)}
                  placeholder={
                    reinspOutcome === 'rejected'
                      ? 'Specify why repair was rejected and what rework is required...'
                      : 'Verification comments on workmanship, plumbness, finish, or closure sign-off...'
                  }
                  required={reinspOutcome === 'rejected'}
                  rows={3}
                />
              </div>

              <div>
                <PhotoUploader
                  files={reinspPhotos}
                  onChange={setReinspPhotos}
                  label="Reinspection Verification Photographs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsReinspectionModalOpen(false)}
                  disabled={isSubmittingReinsp}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant={reinspOutcome === 'approved' ? 'success' : 'destructive'}
                  size="sm"
                  isLoading={isSubmittingReinsp}
                  className="font-semibold"
                >
                  {reinspOutcome === 'approved' ? 'Sign Off & Close Defect' : 'Reject & Reopen for Rework'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: REOPEN CLOSED DEFECT */}
      <ConfirmationDialog
        isOpen={isReopenModalOpen}
        onClose={() => setIsReopenModalOpen(false)}
        title="Reopen Closed Defect"
        message="Reopening this defect requires an authorized explanation. It will return the ticket to contractor rectification queue."
        confirmLabel="Reopen Defect"
        variant="warning"
        requireReason={true}
        reasonPlaceholder="Mandatory reason for reopening (e.g. defect recurring, secondary crack formed)..."
        onConfirm={handleReopenDefect}
      />
    </div>
  );
};
