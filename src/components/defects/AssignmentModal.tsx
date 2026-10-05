import React, { useState, useEffect } from 'react';
import { Contractor, Profile } from '@/types';
import { contractorService } from '@/services/contractorService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { X, HardHat } from 'lucide-react';

interface AssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAssign: (contractorId: string, assignedTo?: string, dueDate?: string, notes?: string) => Promise<void>;
  currentContractorId?: string | null;
  currentDueDate?: string | null;
  defectReference: string;
}

export const AssignmentModal: React.FC<AssignmentModalProps> = ({
  isOpen,
  onClose,
  onAssign,
  currentContractorId,
  currentDueDate,
  defectReference,
}) => {
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [selectedContractorId, setSelectedContractorId] = useState(currentContractorId || '');
  const [contractorUsers, setContractorUsers] = useState<Profile[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [dueDate, setDueDate] = useState(currentDueDate || '');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      contractorService.getContractors().then((list) => {
        setContractors(list.filter((c) => c.is_active));
        if (currentContractorId) {
          setSelectedContractorId(currentContractorId);
        } else if (list.length > 0) {
          setSelectedContractorId(list[0].id);
        }
      });
      if (currentDueDate) {
        setDueDate(currentDueDate);
      } else {
        // Default due date: 7 days from now
        const defaultDue = new Date();
        defaultDue.setDate(defaultDue.getDate() + 7);
        setDueDate(defaultDue.toISOString().split('T')[0]);
      }
    }
  }, [isOpen, currentContractorId, currentDueDate]);

  useEffect(() => {
    if (selectedContractorId) {
      contractorService.getContractorUsers(selectedContractorId).then((users) => {
        setContractorUsers(users);
        if (users.length > 0) {
          setSelectedUserId(users[0].id);
        } else {
          setSelectedUserId('');
        }
      });
    } else {
      setContractorUsers([]);
      setSelectedUserId('');
    }
  }, [selectedContractorId]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedContractorId) {
      setError('Please select a contractor organization.');
      return;
    }
    if (!dueDate) {
      setError('Please select a rectification due date.');
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      await onAssign(selectedContractorId, selectedUserId || undefined, dueDate, notes);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to assign defect');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full border border-slate-200 overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-900 text-white">
          <div className="flex items-center gap-2">
            <HardHat className="w-5 h-5 text-amber-400" />
            <h3 className="font-semibold text-sm">
              Assign Defect: <span className="font-mono text-amber-300">{defectReference}</span>
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-2.5 bg-red-50 text-red-600 text-xs rounded border border-red-200">
              {error}
            </div>
          )}

          {/* Contractor select */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Contractor Organization <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedContractorId}
              onChange={(e) => setSelectedContractorId(e.target.value)}
              className="w-full text-sm rounded-md border border-slate-300 bg-white p-2 text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              required
            >
              <option value="">Select Contractor...</option>
              {contractors.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.company_name} ({c.specialization || 'General'})
                </option>
              ))}
            </select>
          </div>

          {/* Specific user select */}
          {contractorUsers.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Responsible Person (Optional)
              </label>
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="w-full text-sm rounded-md border border-slate-300 bg-white p-2 text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="">Any available person</option>
                {contractorUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.full_name} ({u.email})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Due date */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Rectification Due Date <span className="text-red-500">*</span>
            </label>
            <Input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              required
              min={new Date().toISOString().split('T')[0]}
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Assignment Notes / Instructions
            </label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Provide specific repair instructions or access requirements..."
              rows={3}
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" variant="default" size="sm" isLoading={isLoading}>
              Confirm Assignment
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
