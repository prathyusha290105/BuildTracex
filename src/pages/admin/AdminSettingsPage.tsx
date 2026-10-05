import React, { useState } from 'react';
import { testSupabaseConnection, isSupabaseConfigured } from '@/lib/supabase';
import {
  Settings,
  Database,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  FolderArchive,
  ExternalLink,
  Shield,
  FileCode,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export const AdminSettingsPage: React.FC = () => {
  const [testResult, setTestResult] = useState<{
    tested: boolean;
    connected: boolean;
    message: string;
    details?: any;
  }>({
    tested: false,
    connected: false,
    message: '',
  });

  const [isTesting, setIsTesting] = useState(false);

  const handleTestConnection = async () => {
    setIsTesting(true);
    try {
      const res = await testSupabaseConnection();
      setTestResult({
        tested: true,
        connected: res.connected,
        message: res.message,
        details: res.details,
      });
    } finally {
      setIsTesting(false);
    }
  };

  const configured = isSupabaseConfigured();

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <Settings className="w-5 h-5 text-blue-600" />
          <span>System Settings & Supabase Diagnostics</span>
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Verify PostgreSQL connection, storage bucket health, and deployment configuration
        </p>
      </div>

      {/* Supabase Connectivity Card */}
      <Card>
        <CardHeader className="pb-3 border-b border-slate-100 bg-slate-900 text-white rounded-t-lg">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Database className="w-5 h-5 text-emerald-400" />
              <span>Supabase Database & Auth Integration</span>
            </CardTitle>
            <span
              className={`text-xs px-2.5 py-0.5 rounded font-bold uppercase ${
                configured ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'
              }`}
            >
              {configured ? 'Configured' : 'Needs Setup'}
            </span>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
            <div>
              <h4 className="font-bold text-xs uppercase text-slate-700 tracking-wider">
                Connection Status:
              </h4>
              <p className="text-xs text-slate-600 mt-1">
                {configured
                  ? 'Client is configured with VITE_SUPABASE_URL and anon key.'
                  : 'Currently operating in demo mode. Please supply your Supabase project keys in .env to connect persistent PostgreSQL.'}
              </p>
            </div>

            <Button
              onClick={handleTestConnection}
              isLoading={isTesting}
              size="sm"
              variant="default"
              className="font-semibold text-xs gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Test Live Connection
            </Button>
          </div>

          {testResult.tested && (
            <div
              className={`p-4 rounded-lg border text-xs flex items-start gap-3 ${
                testResult.connected
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                  : 'bg-red-50 border-red-300 text-red-900'
              }`}
            >
              {testResult.connected ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              )}
              <div className="space-y-1">
                <p className="font-bold text-sm">
                  {testResult.connected ? 'Connected Successfully' : 'Connection Check Failed'}
                </p>
                <p>{testResult.message}</p>
                {testResult.details && (
                  <pre className="p-2 bg-black/10 rounded font-mono text-[10px] mt-2">
                    {JSON.stringify(testResult.details, null, 2)}
                  </pre>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Migration Checklist Guide */}
      <Card>
        <CardHeader className="pb-3 border-b border-slate-100">
          <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <FileCode className="w-4 h-4 text-blue-600" />
            <span>Database Setup Checklist & Migrations</span>
          </CardTitle>
          <p className="text-xs text-slate-500 mt-0.5">
            To initialize your Supabase PostgreSQL instance, run the following SQL files located in <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-[11px]">supabase/migrations/</code>:
          </p>
        </CardHeader>
        <CardContent className="p-6 space-y-3">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900">1. Migration 001_schema.sql</span>
              <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">Core DDL</span>
            </div>
            <p className="text-slate-500 text-[11px]">
              Creates 21 relational tables, enum types, sequential BTX-XXXX / INS-XXXX trigger generators, and security definer helper functions.
            </p>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900">2. Migration 002_rls_policies.sql</span>
              <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded">Security RLS</span>
            </div>
            <p className="text-slate-500 text-[11px]">
              Enforces Row-Level Security on all 21 tables: admin full access, user project scopes, and contractor assignment isolation.
            </p>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900">3. Migration 003_seed_data.sql</span>
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">Seed Data</span>
            </div>
            <p className="text-slate-500 text-[11px]">
              Populates realistic construction demo data: Northstar Residential Block A, towers, levels, units, Apex Finishes, Wall Finish template, inspections, snags in all 9 states, history, and notifications.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Storage Bucket Guide */}
      <Card>
        <CardHeader className="pb-3 border-b border-slate-100">
          <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <FolderArchive className="w-4 h-4 text-cyan-600" />
            <span>Supabase Storage Bucket Configuration</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 text-xs text-slate-600 space-y-2">
          <p>
            In your Supabase Dashboard &rarr; <span className="font-semibold text-slate-800">Storage</span>:
          </p>
          <ol className="list-decimal pl-5 space-y-1.5">
            <li>Create a new bucket named <code className="bg-slate-100 px-1 py-0.5 rounded font-mono font-bold text-blue-600">evidence</code>.</li>
            <li>Configure privacy: Keep private or enable public URL read access based on your security policies.</li>
            <li>Upload size limit: Recommended 10MB per file (JPEG, PNG, WebP supported).</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
};
