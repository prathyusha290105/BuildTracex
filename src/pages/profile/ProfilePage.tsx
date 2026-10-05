import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { authService } from '@/services/authService';
import { formatRoleLabel, formatDate } from '@/lib/utils';
import {
  User,
  Mail,
  Phone,
  Shield,
  HardHat,
  Save,
  CheckCircle2,
  AlertCircle,
  Building2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export const ProfilePage: React.FC = () => {
  const { profile, role, contractor } = useAuth();

  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [isSaving, setIsSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError('');
    setSuccess(false);

    try {
      await authService.updateProfile({
        full_name: fullName,
        phone,
      });
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">
          User Profile & Credentials
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          View your assigned operational role, project access scopes, and update contact details
        </p>
      </div>

      {success && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-md text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
          <span>Profile information updated successfully.</span>
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Role Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xl shadow-md">
              {profile?.full_name?.charAt(0) || 'U'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-slate-900">{profile?.full_name}</h3>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                  {formatRoleLabel(role)}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">{profile?.email}</p>
              <p className="text-[11px] text-slate-400 mt-1">
                Account registered on {formatDate(profile?.created_at)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contractor Organization linkage if role === 'contractor' */}
      {role === 'contractor' && (
        <Card>
          <CardHeader className="pb-3 border-b border-slate-100 bg-amber-50/50">
            <CardTitle className="text-xs font-bold uppercase text-amber-800 flex items-center gap-2">
              <HardHat className="w-4 h-4 text-amber-600" />
              <span>Linked Contractor Organization</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 text-xs space-y-2">
            <div>
              <span className="text-slate-400 font-semibold uppercase block">Company Name</span>
              <span className="font-bold text-slate-800 text-sm">{contractor?.company_name || 'Apex Finishes Ltd'}</span>
            </div>
            <div>
              <span className="text-slate-400 font-semibold uppercase block">Specialization</span>
              <span className="text-slate-700">{contractor?.specialization || 'Wall finishes, plastering & painting'}</span>
            </div>
            <div>
              <span className="text-slate-400 font-semibold uppercase block">Site Scope Access</span>
              <span className="text-slate-700">Restricted to assigned defects for this contractor organization</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Edit Form */}
      <Card>
        <CardHeader className="pb-3 border-b border-slate-100">
          <CardTitle className="text-sm font-bold text-slate-900">
            Contact Information
          </CardTitle>
        </CardHeader>
        <form onSubmit={handleUpdate} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Full Name
            </label>
            <div className="relative">
              <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Email Address (Authentication ID)
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="email"
                value={profile?.email || ''}
                disabled
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-md bg-slate-50 text-slate-500 cursor-not-allowed"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Phone Number
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (555) 000-0000"
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end">
            <Button type="submit" variant="default" size="sm" isLoading={isSaving} className="font-semibold gap-1.5">
              <Save className="w-4 h-4" />
              Save Changes
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
