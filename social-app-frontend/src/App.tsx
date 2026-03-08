import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import LoginPage from './components/auth/LoginPage';
import SignupPage from './components/auth/SignupPage';
import ForgotPasswordPage from './components/auth/ForgotPasswordPage';
import OAuthCallback from './components/auth/OAuthCallback';
import MainLayout from './components/layout/MainLayout';
import ProfilePage from './components/profile/ProfilePage';
import EditProfilePage from './components/profile/EditProfilePage';
import SettingsPage from './components/settings/SettingsPage';
import { Feed } from './components/feed/Feed';
import { CreatePostPage } from './components/post/CreatePostPage';
import DraftsPage from './components/post/DraftsPage';
import { ExplorePage } from './components/explore/ExplorePage';
import { AnalyticsPage } from './components/analytics/AnalyticsPage';
import CommunityPage from './components/community/CommunityPage';
import UsersPage from './components/admin/UsersPage';
import UserDetailPage from './components/admin/UserDetailPage';
import { ModerationDashboard } from './components/admin/ModerationDashboard';
import CreateCommunityPage from './components/community/CreateCommunityPage';
import CommunityDetailsPage from './components/community/CommunityDetailsPage';
import NotificationsPage from './components/notifications/NotificationsPage';
import PostDetailPage from './components/post/PostDetailPage';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" />;
  return <>{children}</>;
};



const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/auth/github/callback" element={<OAuthCallback />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Feed />} />
        <Route path="feed" element={<Navigate to="/" replace />} />
        <Route path="create-post" element={<CreatePostPage />} />
        <Route path="drafts" element={<DraftsPage />} />
        <Route path="explore" element={<ExplorePage />} />
        <Route path="analytics" element={<AnalyticsPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="profile/:id" element={<ProfilePage />} />
        <Route path="profile/edit" element={<EditProfilePage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="users/:id" element={<UserDetailPage />} />
        <Route path="moderation" element={<ModerationDashboard />} />
        <Route path="community" element={<CommunityPage />} />
        <Route path="community/create" element={<CreateCommunityPage />} />
        <Route path="community/:id" element={<CommunityDetailsPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="post/:id" element={<PostDetailPage />} />
      </Route>
    </Routes>
  );
};

function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;
