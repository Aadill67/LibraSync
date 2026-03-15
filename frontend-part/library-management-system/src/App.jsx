import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeModeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
import Homepage from './pages/Homepage';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import AllBooks from './pages/AllBooks';
import AllMembers from './pages/AllMembers';
import Transactions from './pages/Transactions';
import Categories from './pages/Categories';
import CategoryBooks from './pages/CategoryBooks';
import MyBorrows from './pages/MyBorrows';
import Profile from './pages/Profile';
import Reports from './pages/Reports';
import Notifications from './pages/Notifications';
import BookDetail from './pages/BookDetail';
import Calendar from './pages/Calendar';
import AuditDashboard from './pages/AuditDashboard';
import AdminSettings from './pages/AdminSettings';

function App() {
  return (
    <ThemeModeProvider>
      <BrowserRouter>
        <AuthProvider>
          <ErrorBoundary>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Homepage />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password/:token" element={<ResetPassword />} />
              <Route path="/book/:id" element={<BookDetail />} />

              {/* Protected Routes inside Layout */}
              <Route
                element={
                  <ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>
                }
              >
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/books" element={<AllBooks />} />
                <Route path="/categories" element={<Categories />} />
                <Route path="/categories/:id" element={<CategoryBooks />} />
                <Route
                  path="/members"
                  element={
                    <ProtectedRoute roles={['admin', 'librarian']}>
                      <AllMembers />
                    </ProtectedRoute>
                  }
                />
                <Route path="/transactions" element={<Transactions />} />
                <Route
                  path="/reports"
                  element={
                    <ProtectedRoute roles={['admin', 'librarian']}>
                      <Reports />
                    </ProtectedRoute>
                  }
                />
                <Route path="/my-borrows" element={<MyBorrows />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/notifications" element={<Notifications />} />
                <Route path="/calendar" element={<Calendar />} />
                <Route
                  path="/audit"
                  element={
                    <ProtectedRoute roles={['admin', 'librarian']}>
                      <AuditDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/settings"
                  element={
                    <ProtectedRoute roles={['admin']}>
                      <AdminSettings />
                    </ProtectedRoute>
                  }
                />
              </Route>

              {/* Default redirect */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </ErrorBoundary>
        </AuthProvider>
      </BrowserRouter>
    </ThemeModeProvider>
  );
}

export default App;
