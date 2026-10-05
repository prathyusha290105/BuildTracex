import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { UserRole } from '@/types';
import { formatRoleLabel } from '@/lib/utils';
import { Building2, Lock, Mail, Eye, EyeOff, Shield, AlertCircle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export const LoginPage: React.FC = () => {
  const { signIn, isConfigured } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const from = (location.state as any)?.from?.pathname || '/dashboard';

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      await signIn(email, password);
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.message || 'Invalid email or password.');
    } finally {
      setIsLoading(false);
    }
  };

  // Demo accounts helper for rapid evaluation
  const demoAccounts = [
    { role: 'system_admin' as UserRole, email: 'admin@buildtracex.com', label: 'System Admin' },
    { role: 'quality_manager' as UserRole, email: 'quality.mgr@buildtracex.com', label: 'Quality Manager' },
    { role: 'qaqc_engineer' as UserRole, email: 'qaqc.eng@buildtracex.com', label: 'QA/QC Engineer' },
    { role: 'site_engineer' as UserRole, email: 'site.eng@buildtracex.com', label: 'Site Engineer' },
    { role: 'project_manager' as UserRole, email: 'pm@buildtracex.com', label: 'Project Manager' },
    { role: 'contractor' as UserRole, email: 'contractor@apexfinishes.com', label: 'Contractor (Apex)' },
  ];

  const handleDemoLogin = async (demoEmail: string, role: UserRole) => {
    setEmail(demoEmail);
    setPassword('DemoPassword123!');
    setIsLoading(true);
    setError('');
    try {
      await signIn(demoEmail, 'DemoPassword123!');
      if (role === 'contractor') {
        navigate('/contractor/dashboard', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Logo & Header */}
        <div className="flex justify-center">
          <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg">
            <Building2 className="w-7 h-7" />
          </div>
        </div>
        <h2 className="mt-4 text-center text-2xl font-extrabold text-slate-900 tracking-tight">
          BuildTracex
        </h2>
        <p className="mt-1 text-center text-xs uppercase font-semibold tracking-wider text-slate-500">
          Construction Quality, Inspection & Defect Management
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-xl rounded-xl border border-slate-200 sm:px-10">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@buildtracex.com"
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-10 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  type="checkbox"
                  defaultChecked
                  className="h-4 w-4 text-blue-600 border-slate-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 text-slate-600">
                  Remember session
                </label>
              </div>
              <a href="/forgot-password" className="text-blue-600 hover:underline font-medium">
                Forgot password?
              </a>
            </div>

            <Button
              type="submit"
              variant="default"
              className="w-full h-10 font-semibold"
              isLoading={isLoading}
            >
              Sign In to Platform
            </Button>
          </form>

          {/* Rapid Demo Login Selector */}
          <div className="mt-6 pt-6 border-t border-slate-200">
            <div className="flex items-center gap-1.5 mb-2.5 text-slate-700">
              <Shield className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-bold uppercase tracking-wider">
                Instant Demo Access (All 6 Roles)
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mb-3">
              Click any role below to sign in instantly and inspect role-based workflows:
            </p>
            <div className="grid grid-cols-2 gap-2">
              {demoAccounts.map((acc) => (
                <button
                  key={acc.role}
                  type="button"
                  onClick={() => handleDemoLogin(acc.email, acc.role)}
                  className="text-left p-2 rounded border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 transition-colors text-xs"
                >
                  <span className="font-semibold text-slate-900 block truncate">{acc.label}</span>
                  <span className="text-[10px] text-slate-400 truncate block">{acc.email}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
