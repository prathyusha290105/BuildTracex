import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Profile, UserRole, Contractor } from '@/types';
import { contractorService } from '@/services/contractorService';
import { activityService } from '@/services/activityService';
import { TableSkeleton } from '@/components/common/LoadingSkeleton';
import { ConfirmationDialog } from '@/components/common/ConfirmationDialog';
import { formatRoleLabel, formatDate } from '@/lib/utils';
import {
  Users,
  Plus,
  Search,
  UserCheck,
  UserX,
  Shield,
  Edit2,
  HardHat,
  X,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';

export const AdminUsersPage: React.FC = () => {
  const [users, setUsers] = useState<Profile[]>([]);
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [contractorMap, setContractorMap] = useState<Record<string, string>>({});
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  // New User Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    email: '',
    full_name: '',
    role: 'site_engineer' as UserRole,
    phone: '',
    password: '',
    contractor_id: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');

  // Confirmation dialog for toggle active
  const [confirmUser, setConfirmUser] = useState<Profile | null>(null);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const [{ data: userProfiles }, cList, { data: cUsers }] = await Promise.all([
        supabase.from('profiles').select('*').order('created_at', { ascending: false }),
        contractorService.getContractors(),
        supabase.from('contractor_users').select('user_id, contractor_id, contractors(company_name)'),
      ]);

      setUsers((userProfiles as Profile[]) || []);
      setContractors(cList);

      const mapping: Record<string, string> = {};
      (cUsers || []).forEach((item: any) => {
        if (item.contractors?.company_name) {
          mapping[item.user_id] = item.contractors.company_name;
        }
      });
      setContractorMap(mapping);
    } catch (err) {
      console.warn('Error loading users:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.email || !newUser.full_name) {
      setModalError('Email and full name are required.');
      return;
    }

    setIsSubmitting(true);
    setModalError('');
    try {
      // Create user auth account
      const { data, error } = await supabase.auth.signUp({
        email: newUser.email,
        password: newUser.password || 'TemporaryPassword123!',
        options: {
          data: {
            full_name: newUser.full_name,
            role: newUser.role,
          },
        },
      });

      if (error) throw error;

      if (data.user) {
        // Update profile
        await supabase
          .from('profiles')
          .update({
            full_name: newUser.full_name,
            role: newUser.role,
            phone: newUser.phone || null,
          })
          .eq('id', data.user.id);

        // If contractor role, link to contractor organization
        if (newUser.role === 'contractor' && newUser.contractor_id) {
          await contractorService.linkUserToContractor(data.user.id, newUser.contractor_id);
        }

        await activityService.logActivity(
          'provision_user',
          'profile',
          data.user.id,
          newUser.email,
          { role: newUser.role }
        );
      }

      setIsModalOpen(false);
      setNewUser({
        email: '',
        full_name: '',
        role: 'site_engineer',
        phone: '',
        password: '',
        contractor_id: '',
      });
      loadUsers();
    } catch (err: any) {
      setModalError(err.message || 'Failed to create user account');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async () => {
    if (!confirmUser) return;
    const newStatus = !confirmUser.is_active;

    try {
      await supabase
        .from('profiles')
        .update({ is_active: newStatus })
        .eq('id', confirmUser.id);

      await activityService.logActivity(
        newStatus ? 'activate_user' : 'deactivate_user',
        'profile',
        confirmUser.id,
        confirmUser.email,
        { previous_status: confirmUser.is_active, new_status: newStatus }
      );

      setConfirmUser(null);
      loadUsers();
    } catch (err) {
      console.warn('Failed to update user active status:', err);
    }
  };

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    try {
      await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);

      await activityService.logActivity(
        'change_user_role',
        'profile',
        userId,
        undefined,
        { new_role: newRole }
      );

      loadUsers();
    } catch (err) {
      console.warn('Failed to update user role:', err);
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.full_name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            User & Access Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Provision user accounts, configure 6 operational roles, project scopes, and contractor affiliations
          </p>
        </div>

        <Button
          size="sm"
          onClick={() => setIsModalOpen(true)}
          className="gap-1.5 font-semibold bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Plus className="w-4 h-4" />
          Provision New User
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by user name or email..."
            className="w-full pl-9 pr-4 py-2 text-sm rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          />
        </div>

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="text-xs h-9 px-3 rounded-md border border-slate-300 bg-white text-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
        >
          <option value="all">All Roles (6 Total)</option>
          <option value="system_admin">System Administrator</option>
          <option value="quality_manager">Quality Manager</option>
          <option value="qaqc_engineer">QA/QC Engineer</option>
          <option value="site_engineer">Site Engineer</option>
          <option value="project_manager">Project Manager</option>
          <option value="contractor">Contractor</option>
        </select>
      </div>

      {/* Users Table */}
      {isLoading ? (
        <TableSkeleton rows={6} />
      ) : (
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Assigned Role</th>
                  <th className="py-3 px-4">Affiliation / Scope</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Joined</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50">
                    {/* User Info */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
                          {u.full_name?.charAt(0) || 'U'}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-xs">{u.full_name}</p>
                          <p className="text-[11px] text-slate-400">{u.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Role Dropdown */}
                    <td className="py-3 px-4">
                      <select
                        value={u.role}
                        onChange={(e) => handleRoleChange(u.id, e.target.value as UserRole)}
                        className="text-xs font-semibold py-1 px-2 rounded border border-slate-300 bg-white text-slate-800"
                      >
                        <option value="system_admin">System Administrator</option>
                        <option value="quality_manager">Quality Manager</option>
                        <option value="qaqc_engineer">QA/QC Engineer</option>
                        <option value="site_engineer">Site Engineer</option>
                        <option value="project_manager">Project Manager</option>
                        <option value="contractor">Contractor</option>
                      </select>
                    </td>

                    {/* Affiliation */}
                    <td className="py-3 px-4 text-xs">
                      {u.role === 'contractor' ? (
                        contractorMap[u.id] ? (
                          <span className="inline-flex items-center gap-1 font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            <HardHat className="w-3 h-3 text-amber-600" />
                            {contractorMap[u.id]}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">No contractor linked</span>
                        )
                      ) : (
                        <span className="text-slate-600">NxtWise QA Team</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                          u.is_active
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {u.is_active ? 'Active' : 'Deactivated'}
                      </span>
                    </td>

                    {/* Joined */}
                    <td className="py-3 px-4 text-xs text-slate-400 whitespace-nowrap">
                      {formatDate(u.created_at)}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setConfirmUser(u)}
                        className={`text-xs h-8 px-2.5 ${
                          u.is_active ? 'text-red-600 hover:bg-red-50' : 'text-emerald-600 hover:bg-emerald-50'
                        }`}
                      >
                        {u.is_active ? <UserX className="w-4 h-4 mr-1" /> : <UserCheck className="w-4 h-4 mr-1" />}
                        {u.is_active ? 'Deactivate' : 'Activate'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Confirmation Dialog for Toggle Active */}
      {confirmUser && (
        <ConfirmationDialog
          isOpen={Boolean(confirmUser)}
          onClose={() => setConfirmUser(null)}
          title={confirmUser.is_active ? 'Deactivate User Account' : 'Reactivate User Account'}
          message={`Are you sure you want to ${confirmUser.is_active ? 'deactivate' : 'reactivate'} the account for ${confirmUser.full_name} (${confirmUser.email})? Deactivated users cannot log into BuildTracex.`}
          confirmLabel={confirmUser.is_active ? 'Deactivate Account' : 'Activate Account'}
          variant={confirmUser.is_active ? 'danger' : 'primary'}
          onConfirm={handleToggleActive}
        />
      )}

      {/* Provision User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full border border-slate-200 overflow-hidden">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-400" />
                <h3 className="font-semibold text-sm">Provision New User Account</h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="p-5 space-y-4">
              {modalError && (
                <div className="p-2.5 bg-red-50 text-red-600 text-xs rounded border border-red-200">
                  {modalError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <Input
                  value={newUser.full_name}
                  onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })}
                  placeholder="e.g. John Doe"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <Input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  placeholder="name@buildtracex.com"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Operational Role <span className="text-red-500">*</span>
                </label>
                <select
                  value={newUser.role}
                  onChange={(e) =>
                    setNewUser({ ...newUser, role: e.target.value as UserRole })
                  }
                  className="w-full text-sm rounded border border-slate-300 p-2 bg-white font-medium"
                >
                  <option value="system_admin">System Administrator</option>
                  <option value="quality_manager">Quality Manager</option>
                  <option value="qaqc_engineer">QA/QC Engineer</option>
                  <option value="site_engineer">Site Engineer</option>
                  <option value="project_manager">Project Manager</option>
                  <option value="contractor">Contractor</option>
                </select>
              </div>

              {newUser.role === 'contractor' && (
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                    Link to Contractor Organization <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={newUser.contractor_id}
                    onChange={(e) => setNewUser({ ...newUser, contractor_id: e.target.value })}
                    className="w-full text-sm rounded border border-slate-300 p-2 bg-white"
                    required
                  >
                    <option value="">Select Contractor Firm...</option>
                    {contractors.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.company_name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Initial Password
                </label>
                <Input
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  placeholder="Defaults to TemporaryPassword123!"
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
                  Provision User
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
