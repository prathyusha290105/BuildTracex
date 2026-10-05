import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, NavLink } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { defectService } from '@/services/defectService';
import { rectificationService } from '@/services/rectificationService';
import { Defect } from '@/types';
import { DetailSkeleton } from '@/components/common/LoadingSkeleton';
import { StatusBadge } from '@/components/common/StatusBadge';
import { SeverityBadge } from '@/components/common/SeverityBadge';
import { AgeingBadge } from '@/components/common/AgeingBadge';
import { EvidenceGallery } from '@/components/evidence/EvidenceGallery';
import { PhotoUploader } from '@/components/evidence/PhotoUploader';
import { formatDate, formatDateTime, isDefectOverdue } from '@/lib/utils';
import {
  HardHat,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Camera,
  ArrowLeft,
  ChevronRight,
  Send,
  Building2,
  Calendar,
  MessageSquare,
  AlertCircle,
  X,
  FileText,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export const ContractorDefectDetailPage: React.FC = () => {
  const { defectId } = useParams<{ defectId: string }>();
  const { profile, role } = useAuth();
  const navigate = useNavigate();

  const [defect, setDefect] = useState<Defect | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Rectification Submission Form
  const [description, setDescription] = useState('');
  const [summary, setSummary] = useState('');
  const [photos, setPhotos] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Comment input
  const [commentInput, setCommentInput] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  const loadDefect = async () => {
    if (!defectId) return;
    setIsLoading(true);
    try {
      const data = await defectService.getDefectById(defectId);
      setDefect(data);
    } catch (err) {
      console.warn('Error loading defect:', err);
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
        <p className="text-slate-500 mb-4">Defect task not found or unauthorized.</p>
        <Button variant="outline" onClick={() => navigate('/contractor/defects')}>
          Back to Assigned Tasks
        </Button>
      </div>
    );
  }

  const overdue = isDefectOverdue(defect.status, defect.due_date);

  const handleAcknowledge = async () => {
    try {
      await defectService.transitionStatus(
        defect.id,
        'rectification_in_progress',
        'Contractor acknowledged defect and commenced site rectification',
        'contractor'
      );
      loadDefect();
    } catch (err: any) {
      setError(err.message || 'Failed to acknowledge assignment');
    }
  };

  const handleSubmitRectification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      setError('Please provide a description of the rectification work performed.');
      return;
    }
    if (photos.length === 0) {
      setError('Photographic proof of the completed repair is required.');
      return;
    }

    setIsSubmitting(true);
    setError('');
    try {
      await rectificationService.submitRectification({
        defectId: defect.id,
        description,
        completionSummary: summary,
        photos,
      });

      setSuccessMessage('Rectification successfully submitted! Quality team will reinspect.');
      setDescription('');
      setSummary('');
      setPhotos([]);
      loadDefect();
    } catch (err: any) {
      setError(err.message || 'Failed to submit rectification');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInput.trim()) return;

    setIsSubmittingComment(true);
    try {
      await defectService.addComment(defect.id, commentInput);
      setCommentInput('');
      loadDefect();
    } catch (err) {
      console.warn('Failed to post comment:', err);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const isEditable =
    defect.status === 'assigned' ||
    defect.status === 'rectification_in_progress' ||
    defect.status === 'reopened';

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Breadcrumb Header */}
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <NavLink to="/contractor/defects" className="hover:text-blue-600 flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>My Defects</span>
        </NavLink>
        <ChevronRight className="w-3 h-3 text-slate-300" />
        <span className="font-mono font-bold text-slate-800">{defect.reference}</span>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError('')} className="text-red-500">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {successMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-md text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Task Summary Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded border border-blue-200">
                  {defect.reference}
                </span>
                <SeverityBadge severity={defect.severity} />
                <StatusBadge status={defect.status} />
                {overdue && (
                  <span className="text-xs font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded uppercase">
                    OVERDUE
                  </span>
                )}
                <AgeingBadge createdAt={defect.created_at} closedAt={defect.closed_at} />
              </div>

              <h1 className="text-xl font-bold text-slate-900 tracking-tight">{defect.title}</h1>

              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mt-2">
                <span className="flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  <span>
                    {[defect.project?.name, defect.building?.name, defect.floor?.name, defect.zone?.name]
                      .filter(Boolean)
                      .join(' > ')}
                  </span>
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span className={overdue ? 'text-red-600 font-bold' : ''}>
                    Deadline: {formatDate(defect.due_date)}
                  </span>
                </span>
              </div>
            </div>

            {/* Quick Action Button for Contractor */}
            {defect.status === 'assigned' && (
              <Button
                size="sm"
                onClick={handleAcknowledge}
                className="gap-1.5 font-semibold bg-amber-600 hover:bg-amber-700 text-white self-start"
              >
                <Clock className="w-4 h-4" />
                Acknowledge & Start Repair
              </Button>
            )}
          </div>

          <div className="mt-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-1">
              Required Defect Rectification Scope:
            </h4>
            <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded border border-slate-100">
              {defect.description || 'No detailed instructions provided.'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Original Defect Photographs */}
      <Card>
        <CardHeader className="pb-3 border-b border-slate-100">
          <CardTitle className="text-sm font-bold text-slate-900">
            Original Before Photographs (Inspection Evidence)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <EvidenceGallery
            evidence={defect.evidence || []}
            stageFilter="defect_report"
            emptyMessage="No original before photographs attached to this ticket."
          />
        </CardContent>
      </Card>

      {/* Previous Review Outcomes / Rejection Warning */}
      {defect.status === 'reopened' && defect.reinspections && defect.reinspections.length > 0 && (
        <div className="p-4 bg-red-50 border border-red-300 rounded-lg text-xs space-y-1 text-red-900">
          <div className="flex items-center gap-2 font-bold text-red-700 text-sm">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            <span>Previous Repair Was Rejected by QA Reviewer</span>
          </div>
          <p className="mt-1">
            <span className="font-semibold">Rejection Reason:</span>{' '}
            {defect.reinspections[0].comments || 'Repair did not meet quality standards.'}
          </p>
          <p className="text-[11px] text-red-700 mt-0.5">
            Please perform complete rework and submit fresh photographic evidence.
          </p>
        </div>
      )}

      {/* Contractor Rectification Submission Form */}
      {isEditable ? (
        <Card>
          <CardHeader className="pb-3 border-b border-slate-100 bg-slate-900 text-white rounded-t-lg">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Camera className="w-5 h-5 text-cyan-400" />
              <span>Submit Rectification Report & Completion Evidence</span>
            </CardTitle>
            <p className="text-xs text-slate-300">
              Document the corrective measures taken and attach clear photographs for QA/QC reinspection.
            </p>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSubmitRectification} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Corrective Actions Taken / Materials Used <span className="text-red-500">*</span>
                </label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detail the method of repair, replacement materials, coats applied..."
                  required
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Completion Summary Note
                </label>
                <Input
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="e.g. Scraped, re-plastered, sanded and coated with 2x finish paint."
                />
              </div>

              <div>
                <PhotoUploader
                  files={photos}
                  onChange={setPhotos}
                  label="Upload Completion Proof Photographs (Mandatory)"
                  required={true}
                />
              </div>

              <div className="flex justify-end pt-3 border-t border-slate-100">
                <Button
                  type="submit"
                  variant="default"
                  size="sm"
                  isLoading={isSubmitting}
                  className="font-semibold gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  Submit Work for Quality Reinspection
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-800 flex items-center gap-2">
          <Clock className="w-4 h-4 text-blue-600 flex-shrink-0" />
          <span>
            {defect.status === 'rectification_submitted' || defect.status === 'awaiting_reinspection'
              ? 'Your rectification has been submitted and is currently awaiting QA/QC reinspection review.'
              : 'This defect ticket has been verified and closed by the QA team.'}
          </span>
        </div>
      )}

      {/* Progress Comments & Activity */}
      <Card>
        <CardHeader className="pb-3 border-b border-slate-100">
          <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-slate-500" />
            <span>Site Coordination Comments ({defect.comments?.length || 0})</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5 space-y-4">
          <div className="space-y-3 max-h-60 overflow-y-auto">
            {(!defect.comments || defect.comments.length === 0) ? (
              <p className="text-xs text-slate-400 text-center py-2">No comments posted yet.</p>
            ) : (
              defect.comments.map((c) => (
                <div key={c.id} className="p-3 bg-slate-50 rounded text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">{c.user?.full_name}</span>
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
              placeholder="Ask a question or add a site update..."
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
    </div>
  );
};
