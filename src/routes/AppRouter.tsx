import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { ProjectProvider } from '@/context/ProjectContext';
import { NotificationProvider } from '@/context/NotificationContext';
import { ProtectedRoute } from './ProtectedRoute';

// Auth Pages
import { LoginPage } from '@/pages/auth/LoginPage';
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage';

// Main Application Pages
import { DashboardPage } from '@/pages/dashboard/DashboardPage';
import { ProjectsListPage } from '@/pages/projects/ProjectsListPage';
import { ProjectDetailPage } from '@/pages/projects/ProjectDetailPage';
import { ProjectLocationsPage } from '@/pages/projects/ProjectLocationsPage';
import { InspectionsListPage } from '@/pages/inspections/InspectionsListPage';
import { NewInspectionPage } from '@/pages/inspections/NewInspectionPage';
import { InspectionDetailPage } from '@/pages/inspections/InspectionDetailPage';
import { TemplatesListPage } from '@/pages/templates/TemplatesListPage';
import { TemplateEditorPage } from '@/pages/templates/TemplateEditorPage';
import { DefectsListPage } from '@/pages/defects/DefectsListPage';
import { NewDefectPage } from '@/pages/defects/NewDefectPage';
import { DefectDetailPage } from '@/pages/defects/DefectDetailPage';
import { ReportsPage } from '@/pages/reports/ReportsPage';
import { NotificationsPage } from '@/pages/notifications/NotificationsPage';
import { ProfilePage } from '@/pages/profile/ProfilePage';

// Contractor Workspace Pages
import { ContractorDashboardPage } from '@/pages/contractor/ContractorDashboardPage';
import { ContractorDefectsPage } from '@/pages/contractor/ContractorDefectsPage';
import { ContractorDefectDetailPage } from '@/pages/contractor/ContractorDefectDetailPage';

// Admin Pages
import { AdminOverviewPage } from '@/pages/admin/AdminOverviewPage';
import { AdminUsersPage } from '@/pages/admin/AdminUsersPage';
import { AdminProjectsPage } from '@/pages/admin/AdminProjectsPage';
import { AdminLocationsPage } from '@/pages/admin/AdminLocationsPage';
import { AdminContractorsPage } from '@/pages/admin/AdminContractorsPage';
import { AdminTemplatesPage } from '@/pages/admin/AdminTemplatesPage';
import { AdminActivityPage } from '@/pages/admin/AdminActivityPage';
import { AdminSettingsPage } from '@/pages/admin/AdminSettingsPage';

export const AppRouter: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ProjectProvider>
          <NotificationProvider>
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />

              {/* Protected Authenticated Routes */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Navigate to="/dashboard" replace />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <DashboardPage />
                  </ProtectedRoute>
                }
              />

              {/* Projects */}
              <Route
                path="/projects"
                element={
                  <ProtectedRoute allowedRoles={['system_admin', 'quality_manager', 'qaqc_engineer', 'site_engineer', 'project_manager']}>
                    <ProjectsListPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/projects/:projectId"
                element={
                  <ProtectedRoute allowedRoles={['system_admin', 'quality_manager', 'qaqc_engineer', 'site_engineer', 'project_manager']}>
                    <ProjectDetailPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/projects/:projectId/locations"
                element={
                  <ProtectedRoute allowedRoles={['system_admin', 'quality_manager', 'qaqc_engineer', 'site_engineer', 'project_manager']}>
                    <ProjectLocationsPage />
                  </ProtectedRoute>
                }
              />

              {/* Inspections */}
              <Route
                path="/inspections"
                element={
                  <ProtectedRoute allowedRoles={['system_admin', 'quality_manager', 'qaqc_engineer', 'site_engineer', 'project_manager']}>
                    <InspectionsListPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/inspections/new"
                element={
                  <ProtectedRoute allowedRoles={['system_admin', 'quality_manager', 'qaqc_engineer']}>
                    <NewInspectionPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/inspections/:inspectionId"
                element={
                  <ProtectedRoute allowedRoles={['system_admin', 'quality_manager', 'qaqc_engineer', 'site_engineer', 'project_manager']}>
                    <InspectionDetailPage />
                  </ProtectedRoute>
                }
              />

              {/* Templates */}
              <Route
                path="/inspection-templates"
                element={
                  <ProtectedRoute allowedRoles={['system_admin', 'quality_manager', 'qaqc_engineer', 'site_engineer', 'project_manager']}>
                    <TemplatesListPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/inspection-templates/new"
                element={
                  <ProtectedRoute allowedRoles={['system_admin', 'quality_manager']}>
                    <TemplateEditorPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/inspection-templates/:templateId"
                element={
                  <ProtectedRoute allowedRoles={['system_admin', 'quality_manager']}>
                    <TemplateEditorPage />
                  </ProtectedRoute>
                }
              />

              {/* Defects */}
              <Route
                path="/defects"
                element={
                  <ProtectedRoute allowedRoles={['system_admin', 'quality_manager', 'qaqc_engineer', 'site_engineer', 'project_manager']}>
                    <DefectsListPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/defects/new"
                element={
                  <ProtectedRoute allowedRoles={['system_admin', 'quality_manager', 'qaqc_engineer', 'site_engineer']}>
                    <NewDefectPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/defects/:defectId"
                element={
                  <ProtectedRoute>
                    <DefectDetailPage />
                  </ProtectedRoute>
                }
              />

              {/* Reports */}
              <Route
                path="/reports"
                element={
                  <ProtectedRoute allowedRoles={['system_admin', 'quality_manager', 'project_manager', 'qaqc_engineer']}>
                    <ReportsPage />
                  </ProtectedRoute>
                }
              />

              {/* Notifications & Profile */}
              <Route
                path="/notifications"
                element={
                  <ProtectedRoute>
                    <NotificationsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                }
              />

              {/* Contractor Portal */}
              <Route
                path="/contractor/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['contractor', 'system_admin']}>
                    <ContractorDashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/contractor/defects"
                element={
                  <ProtectedRoute allowedRoles={['contractor', 'system_admin']}>
                    <ContractorDefectsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/contractor/defects/:defectId"
                element={
                  <ProtectedRoute allowedRoles={['contractor', 'system_admin']}>
                    <ContractorDefectDetailPage />
                  </ProtectedRoute>
                }
              />

              {/* Administration Portal */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute allowedRoles={['system_admin', 'quality_manager']}>
                    <AdminOverviewPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/users"
                element={
                  <ProtectedRoute allowedRoles={['system_admin']}>
                    <AdminUsersPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/projects"
                element={
                  <ProtectedRoute allowedRoles={['system_admin', 'quality_manager']}>
                    <AdminProjectsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/locations"
                element={
                  <ProtectedRoute allowedRoles={['system_admin', 'quality_manager']}>
                    <AdminLocationsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/contractors"
                element={
                  <ProtectedRoute allowedRoles={['system_admin', 'quality_manager']}>
                    <AdminContractorsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/templates"
                element={
                  <ProtectedRoute allowedRoles={['system_admin', 'quality_manager']}>
                    <AdminTemplatesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/activity"
                element={
                  <ProtectedRoute allowedRoles={['system_admin']}>
                    <AdminActivityPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/settings"
                element={
                  <ProtectedRoute allowedRoles={['system_admin']}>
                    <AdminSettingsPage />
                  </ProtectedRoute>
                }
              />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </NotificationProvider>
        </ProjectProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};
