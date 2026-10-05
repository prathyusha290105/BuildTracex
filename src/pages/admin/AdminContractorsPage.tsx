import React, { useEffect, useState } from 'react';
import { contractorService } from '@/services/contractorService';
import { Contractor } from '@/types';
import { TableSkeleton } from '@/components/common/LoadingSkeleton';
import { ConfirmationDialog } from '@/components/common/ConfirmationDialog';
import { formatDate } from '@/lib/utils';
import {
  HardHat,
  Plus,
  Search,
  Edit2,
  CheckCircle2,
  XCircle,
  Mail,
  Phone,
  X,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export const AdminContractorsPage: React.FC = () => {
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingContractorId, setEditingContractorId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    company_name: '',
    contact_person: '',
    email: '',
    phone: '',
    address: '',
    specialization: '',
    is_active: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Confirmation for active toggle
  const [confirmContractor, setConfirmContractor] = useState<Contractor | null>(null);

  const loadContractors = async () => {
    setIsLoading(true);
    try {
      const list = await contractorService.getContractors();
      setContractors(list);
    } catch (err) {
      console.warn('Error loading contractors:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadContractors();
  }, []);

  const handleOpenCreate = () => {
    setEditingContractorId(null);
    setFormData({
      company_name: '',
      contact_person: '',
      email: '',
      phone: '',
      address: '',
      specialization: '',
      is_active: true,
    });
    setError('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (c: Contractor) => {
    setEditingContractorId(c.id);
    setFormData({
      company_name: c.company_name,
      contact_person: c.contact_person || '',
      email: c.email || '',
      phone: c.phone || '',
      address: c.address || '',
      specialization: c.specialization || '',
      is_active: c.is_active,
    });
    setError('');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.company_name.trim()) {
      setError('Company name is mandatory.');
      return;
    }

    setIsSubmitting(true);
    setError('');
    try {
      if (editingContractorId) {
        await contractorService.updateContractor(editingContractorId, formData);
      } else {
        await contractorService.createContractor(formData);
      }

      setIsModalOpen(false);
      loadContractors();
    } catch (err: any) {
      setError(err.message || 'Failed to save contractor');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async () => {
    if (!confirmContractor) return;
    try {
      await contractorService.updateContractor(confirmContractor.id, {
        is_active: !confirmContractor.is_active,
      });
      setConfirmContractor(null);
      loadContractors();
    } catch (err) {
      console.warn('Failed to update contractor active state:', err);
    }
  };

  const filtered = contractors.filter(
    (c) =>
      c.company_name.toLowerCase().includes(search.toLowerCase()) ||
      (c.specialization && c.specialization.toLowerCase().includes(search.toLowerCase())) ||
      (c.contact_person && c.contact_person.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <HardHat className="w-5 h-5 text-amber-500" />
            <span>Contractor Organizations Directory</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Register trade contractor companies, maintain specializations, and manage operational status
          </p>
        </div>

        <Button size="sm" onClick={handleOpenCreate} className="gap-1.5 font-semibold bg-blue-600 hover:bg-blue-700 text-white">
          <Plus className="w-4 h-4" />
          Register New Contractor
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search contractors by trade, company name, or contact person..."
            className="w-full pl-9 pr-4 py-2 text-sm rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          />
        </div>
      </div>

      {/* Contractors Table */}
      {isLoading ? (
        <TableSkeleton rows={4} />
      ) : (
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Company Name</th>
                  <th className="py-3 px-4">Specialization</th>
                  <th className="py-3 px-4">Contact Person</th>
                  <th className="py-3 px-4">Contact Information</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-bold text-slate-900 text-xs">
                      {c.company_name}
                    </td>
                    <td className="py-3 px-4 text-xs">
                      <span className="font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        {c.specialization || 'General Works'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs font-medium text-slate-800">
                      {c.contact_person || '—'}
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-500">
                      {c.email && (
                        <p className="flex items-center gap-1 text-[11px]">
                          <Mail className="w-3 h-3 text-slate-400" />
                          <span>{c.email}</span>
                        </p>
                      )}
                      {c.phone && (
                        <p className="flex items-center gap-1 text-[11px] mt-0.5">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{c.phone}</span>
                        </p>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                          c.is_active
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {c.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenEdit(c)}
                        className="text-xs h-7 text-blue-600 hover:text-blue-700"
                      >
                        <Edit2 className="w-3.5 h-3.5 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setConfirmContractor(c)}
                        className={`text-xs h-7 ${
                          c.is_active ? 'text-red-600 hover:bg-red-50' : 'text-emerald-600 hover:bg-emerald-50'
                        }`}
                      >
                        {c.is_active ? 'Deactivate' : 'Activate'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      {confirmContractor && (
        <ConfirmationDialog
          isOpen={Boolean(confirmContractor)}
          onClose={() => setConfirmContractor(null)}
          title={confirmContractor.is_active ? 'Deactivate Contractor' : 'Activate Contractor'}
          message={`Are you sure you want to ${confirmContractor.is_active ? 'deactivate' : 'activate'} ${confirmContractor.company_name}?`}
          confirmLabel={confirmContractor.is_active ? 'Deactivate' : 'Activate'}
          variant={confirmContractor.is_active ? 'danger' : 'primary'}
          onConfirm={handleToggleActive}
        />
      )}

      {/* Edit / Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full border border-slate-200 overflow-hidden">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HardHat className="w-5 h-5 text-amber-400" />
                <h3 className="font-semibold text-sm">
                  {editingContractorId ? 'Edit Contractor Details' : 'Register Contractor Organization'}
                </h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-4">
              {error && (
                <div className="p-2.5 bg-red-50 text-red-600 text-xs rounded border border-red-200">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Company / Organization Name <span className="text-red-500">*</span>
                </label>
                <Input
                  value={formData.company_name}
                  onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                  placeholder="e.g. Apex Finishes Ltd"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Trade Specialization
                </label>
                <Input
                  value={formData.specialization}
                  onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                  placeholder="e.g. Wall finishes, plastering & painting"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                    Contact Person
                  </label>
                  <Input
                    value={formData.contact_person}
                    onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                    placeholder="David Miller"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                    Phone Number
                  </label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+1 (555) 234-5678"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Official Email
                </label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="contact@apexfinishes.com"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Office / Yard Address
                </label>
                <Input
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="45 Industrial Way, Suite 200"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="default" size="sm" isLoading={isSubmitting}>
                  Save Contractor
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
