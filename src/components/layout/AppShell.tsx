import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useProject } from '@/context/ProjectContext';
import { useNotifications } from '@/context/NotificationContext';
import { UserRole } from '@/types';
import { formatRoleLabel } from '@/lib/utils';
import {
  LayoutDashboard,
  ClipboardCheck,
  FileSpreadsheet,
  AlertTriangle,
  BarChart3,
  Users,
  Building2,
  MapPin,
  HardHat,
  Sliders,
  History,
  Settings,
  Bell,
  LogOut,
  User as UserIcon,
  Menu,
  X,
  ChevronDown,
  Shield,
  Layers,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { profile, role, signOut, switchDemoRole, isContractor, isAdmin } = useAuth();
  const { projects, selectedProjectId, setSelectedProjectId } = useProject();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [notifMenuOpen, setNotifMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const navItemClasses = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
      isActive
        ? 'bg-blue-600 text-white font-semibold shadow-sm'
        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
    }`;

  const allRoles: UserRole[] = [
    'system_admin',
    'quality_manager',
    'qaqc_engineer',
    'site_engineer',
    'project_manager',
    'contractor',
  ];

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900 font-sans">
      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 md:hidden animate-in fade-in"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Left Sidebar */}
      <aside
        className={`fixed md:sticky top-0 z-50 h-screen w-64 bg-[#0f172a] text-white flex flex-col justify-between transition-transform duration-300 ease-in-out md:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div>
          {/* Logo Brand Header */}
          <div className="h-16 flex items-center justify-between px-5 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-md">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-base tracking-tight text-white">BuildTracex</span>
                <span className="block text-[10px] uppercase font-semibold tracking-wider text-blue-400 -mt-0.5">
                  Quality & Defects
                </span>
              </div>
            </div>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="md:hidden text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Items */}
          <nav className="p-4 space-y-6 overflow-y-auto max-h-[calc(100vh-140px)]">
            {/* OVERVIEW */}
            <div>
              <p className="px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Overview
              </p>
              <div className="space-y-1">
                {isContractor() ? (
                  <NavLink to="/contractor/dashboard" className={navItemClasses} onClick={() => setMobileMenuOpen(false)}>
                    <LayoutDashboard className="w-4 h-4" />
                    <span>Contractor Portal</span>
                  </NavLink>
                ) : (
                  <NavLink to="/dashboard" className={navItemClasses} onClick={() => setMobileMenuOpen(false)}>
                    <LayoutDashboard className="w-4 h-4" />
                    <span>Quality Dashboard</span>
                  </NavLink>
                )}
                {!isContractor() && (
                  <NavLink to="/projects" className={navItemClasses} onClick={() => setMobileMenuOpen(false)}>
                    <Layers className="w-4 h-4" />
                    <span>Projects & Sites</span>
                  </NavLink>
                )}
              </div>
            </div>

            {/* QUALITY OPERATIONS */}
            {!isContractor() && (
              <div>
                <p className="px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Quality Operations
                </p>
                <div className="space-y-1">
                  <NavLink to="/inspections" className={navItemClasses} onClick={() => setMobileMenuOpen(false)}>
                    <ClipboardCheck className="w-4 h-4" />
                    <span>Site Inspections</span>
                  </NavLink>
                  <NavLink to="/inspection-templates" className={navItemClasses} onClick={() => setMobileMenuOpen(false)}>
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>Inspection Templates</span>
                  </NavLink>
                  <NavLink to="/defects" className={navItemClasses} onClick={() => setMobileMenuOpen(false)}>
                    <AlertTriangle className="w-4 h-4" />
                    <span>Defects Register</span>
                  </NavLink>
                </div>
              </div>
            )}

            {/* CONTRACTOR WORKSPACE */}
            {isContractor() && (
              <div>
                <p className="px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  My Rectifications
                </p>
                <div className="space-y-1">
                  <NavLink to="/contractor/defects" className={navItemClasses} onClick={() => setMobileMenuOpen(false)}>
                    <HardHat className="w-4 h-4" />
                    <span>Assigned Defects</span>
                  </NavLink>
                </div>
              </div>
            )}

            {/* INSIGHTS & REPORTS */}
            {!isContractor() && (
              <div>
                <p className="px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Insights
                </p>
                <div className="space-y-1">
                  <NavLink to="/reports" className={navItemClasses} onClick={() => setMobileMenuOpen(false)}>
                    <BarChart3 className="w-4 h-4" />
                    <span>Analytics & Reports</span>
                  </NavLink>
                </div>
              </div>
            )}

            {/* ADMINISTRATION */}
            {isAdmin() && (
              <div>
                <p className="px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Administration
                </p>
                <div className="space-y-1">
                  <NavLink to="/admin" end className={navItemClasses} onClick={() => setMobileMenuOpen(false)}>
                    <Shield className="w-4 h-4" />
                    <span>Admin Overview</span>
                  </NavLink>
                  <NavLink to="/admin/users" className={navItemClasses} onClick={() => setMobileMenuOpen(false)}>
                    <Users className="w-4 h-4" />
                    <span>User Management</span>
                  </NavLink>
                  <NavLink to="/admin/projects" className={navItemClasses} onClick={() => setMobileMenuOpen(false)}>
                    <Building2 className="w-4 h-4" />
                    <span>Projects</span>
                  </NavLink>
                  <NavLink to="/admin/locations" className={navItemClasses} onClick={() => setMobileMenuOpen(false)}>
                    <MapPin className="w-4 h-4" />
                    <span>Site Hierarchy</span>
                  </NavLink>
                  <NavLink to="/admin/contractors" className={navItemClasses} onClick={() => setMobileMenuOpen(false)}>
                    <HardHat className="w-4 h-4" />
                    <span>Contractor Orgs</span>
                  </NavLink>
                  <NavLink to="/admin/templates" className={navItemClasses} onClick={() => setMobileMenuOpen(false)}>
                    <Sliders className="w-4 h-4" />
                    <span>Templates Admin</span>
                  </NavLink>
                  <NavLink to="/admin/activity" className={navItemClasses} onClick={() => setMobileMenuOpen(false)}>
                    <History className="w-4 h-4" />
                    <span>Audit Logs</span>
                  </NavLink>
                  <NavLink to="/admin/settings" className={navItemClasses} onClick={() => setMobileMenuOpen(false)}>
                    <Settings className="w-4 h-4" />
                    <span>System Settings</span>
                  </NavLink>
                </div>
              </div>
            )}
          </nav>
        </div>

        {/* Sidebar Footer User Info */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-blue-600/30 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold text-sm">
              {profile?.full_name?.charAt(0) || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{profile?.full_name}</p>
              <p className="text-[11px] text-blue-400 truncate">{formatRoleLabel(role)}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="sticky top-0 z-30 h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden text-slate-500 hover:text-slate-800 p-1 rounded-md"
            >
              <Menu className="w-6 h-6" />
            </button>

            {/* Global Project Selector */}
            {!isContractor() && projects.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase text-slate-400 hidden sm:inline">Project:</span>
                <select
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className="text-xs sm:text-sm font-medium bg-slate-50 border border-slate-300 rounded-md px-2.5 py-1.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 max-w-[200px] sm:max-w-xs truncate"
                >
                  <option value="all">All Projects</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.code})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Demo Role Switcher Badge (Essential for testing all 6 roles!) */}
            <div className="relative">
              <button
                onClick={() => setRoleMenuOpen(!roleMenuOpen)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors"
                title="Switch active role for testing and review"
              >
                <Shield className="w-3.5 h-3.5 text-blue-600" />
                <span className="hidden sm:inline">Role:</span>
                <span className="font-bold">{formatRoleLabel(role)}</span>
                <ChevronDown className="w-3 h-3 ml-0.5 opacity-70" />
              </button>

              {roleMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-slate-200 py-1 z-50 animate-in fade-in">
                  <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                    Switch Test Role
                  </div>
                  {allRoles.map((r) => (
                    <button
                      key={r}
                      onClick={() => {
                        switchDemoRole(r);
                        setRoleMenuOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 ${
                        role === r ? 'text-blue-600 font-bold bg-blue-50/50' : 'text-slate-700'
                      }`}
                    >
                      <span>{formatRoleLabel(r)}</span>
                      {role === r && <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setNotifMenuOpen(!notifMenuOpen)}
                className="relative p-2 text-slate-500 hover:text-slate-800 rounded-full hover:bg-slate-100 transition-colors"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center animate-pulse">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {notifMenuOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-lg shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in">
                  <div className="px-4 py-2 flex items-center justify-between border-b border-slate-100">
                    <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Notifications ({unreadCount} unread)
                    </span>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllAsRead}
                        className="text-xs text-blue-600 hover:underline font-medium"
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>

                  <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                    {notifications.length === 0 ? (
                      <p className="text-xs text-slate-400 text-center py-6">No notifications</p>
                    ) : (
                      notifications.slice(0, 6).map((n) => (
                        <div
                          key={n.id}
                          onClick={() => {
                            if (!n.is_read) markAsRead(n.id);
                            if (n.entity_type === 'defect' && n.entity_id) {
                              navigate(isContractor() ? `/contractor/defects/${n.entity_id}` : `/defects/${n.entity_id}`);
                              setNotifMenuOpen(false);
                            }
                          }}
                          className={`p-3 text-xs hover:bg-slate-50 cursor-pointer transition-colors ${
                            !n.is_read ? 'bg-blue-50/40' : ''
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-slate-800 truncate">{n.title}</span>
                            {!n.is_read && <span className="w-2 h-2 rounded-full bg-blue-600 flex-shrink-0" />}
                          </div>
                          <p className="text-slate-500 mt-1 line-clamp-2">{n.message}</p>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="p-2 border-t border-slate-100 text-center">
                    <NavLink
                      to="/notifications"
                      onClick={() => setNotifMenuOpen(false)}
                      className="text-xs text-blue-600 font-semibold hover:underline block py-1"
                    >
                      View all notifications &rarr;
                    </NavLink>
                  </div>
                </div>
              )}
            </div>

            {/* Profile Avatar Menu */}
            <div className="relative">
              <button
                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                className="flex items-center gap-2 p-1 rounded-full hover:bg-slate-100 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
                  {profile?.full_name?.charAt(0) || 'U'}
                </div>
              </button>

              {profileMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-slate-200 py-1 z-50 animate-in fade-in">
                  <div className="px-4 py-2 border-b border-slate-100">
                    <p className="text-xs font-semibold text-slate-800 truncate">{profile?.full_name}</p>
                    <p className="text-[10px] text-slate-400 truncate">{profile?.email}</p>
                  </div>
                  <NavLink
                    to="/profile"
                    onClick={() => setProfileMenuOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50"
                  >
                    <UserIcon className="w-3.5 h-3.5" />
                    <span>My Profile</span>
                  </NavLink>
                  <button
                    onClick={() => {
                      setProfileMenuOpen(false);
                      handleSignOut();
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2 text-xs text-red-600 hover:bg-red-50"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content with container */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
