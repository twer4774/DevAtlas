import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { useEffect } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { Layout } from './components/layout/Layout';
import { loadAdSenseScript } from './utils/adsense';

import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { AdminPage } from './pages/AdminPage';
import { IssuesPage } from './pages/IssuesPage';
import { CreateIssuePage } from './pages/CreateIssuePage';
import { IssueDetailPage } from './pages/IssueDetailPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { CreateProjectPage } from './pages/CreateProjectPage';
import { ProjectSettingsPage } from './pages/ProjectSettingsPage';
import { TemplatesPage } from './pages/TemplatesPage';
import { CreateTemplatePage } from './pages/CreateTemplatePage';
import { TemplateDetailPage } from './pages/TemplateDetailPage';
import { ProfilePage } from './pages/ProfilePage';
import { ProjectGroupsPage } from './pages/ProjectGroupsPage';
import { CreateProjectGroupPage } from './pages/CreateProjectGroupPage';
import AdSenseDemo from './components/AdSense/AdSenseDemo';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  useEffect(() => {
    // 애드센스 스크립트 로드
    loadAdSenseScript().catch(error => {
      console.warn('AdSense script loading failed:', error);
    });
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Router>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            
            {/* Protected routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout>
                    <DashboardPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Layout>
                    <DashboardPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            
            {/* Issue routes */}
            <Route
              path="/issues"
              element={
                <ProtectedRoute>
                  <Layout>
                    <IssuesPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/issues/create"
              element={
                <ProtectedRoute>
                  <Layout>
                    <CreateIssuePage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/issues/:id"
              element={
                <ProtectedRoute>
                  <Layout>
                    <IssueDetailPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            
            {/* Project routes */}
            <Route
              path="/projects"
              element={
                <ProtectedRoute>
                  <Layout>
                    <ProjectsPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/projects/new"
              element={
                <ProtectedRoute requiredRoles={['admin']}>
                  <Layout>
                    <CreateProjectPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/projects/:id/settings"
              element={
                <ProtectedRoute requiredRoles={['admin']}>
                  <Layout>
                    <ProjectSettingsPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            
            {/* Template routes */}
            <Route
              path="/templates"
              element={
                <ProtectedRoute>
                  <Layout>
                    <TemplatesPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/templates/new"
              element={
                <ProtectedRoute requiredRoles={['admin']}>
                  <Layout>
                    <CreateTemplatePage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/templates/:id"
              element={
                <ProtectedRoute>
                  <Layout>
                    <TemplateDetailPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            
            {/* Profile route */}
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Layout>
                    <ProfilePage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            
            {/* Project Group routes */}
            <Route
              path="/project-groups"
              element={
                <ProtectedRoute>
                  <Layout>
                    <ProjectGroupsPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/project-groups/new"
              element={
                <ProtectedRoute>
                  <Layout>
                    <CreateProjectGroupPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            
            {/* Admin-only routes */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute requiredRoles={['admin']}>
                  <Layout>
                    <AdminPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            
            {/* AdSense Demo route */}
            <Route
              path="/adsense-demo"
              element={
                <ProtectedRoute>
                  <Layout>
                    <AdSenseDemo />
                  </Layout>
                </ProtectedRoute>
              }
            />
            
            {/* Redirect any unknown routes to home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
            }}
          />
          </Router>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;