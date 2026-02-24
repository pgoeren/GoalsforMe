import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { GoalProvider } from './context/GoalContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import AddGoal from './pages/AddGoal';
import GoalDetail from './pages/GoalDetail';
import History from './pages/History';
import Login from './pages/Login';

function ProtectedRoute({ children }) {
  const { user, loading, isAuthEnabled } = useAuth();

  if (loading) {
    return <div className="loading-spinner">Loading...</div>;
  }

  // If Firebase isn't configured, allow through (local-only mode)
  if (!isAuthEnabled) return children;

  if (!user) return <Navigate to="/login" replace />;

  return children;
}

function AuthRoute({ children }) {
  const { user, loading, isAuthEnabled } = useAuth();

  if (loading) {
    return <div className="loading-spinner">Loading...</div>;
  }

  // Already logged in — redirect to dashboard
  if (isAuthEnabled && user) return <Navigate to="/" replace />;

  // No Firebase — skip login entirely
  if (!isAuthEnabled) return <Navigate to="/" replace />;

  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <GoalProvider>
        <HashRouter>
          <Routes>
            <Route
              path="/login"
              element={
                <AuthRoute>
                  <Login />
                </AuthRoute>
              }
            />
            <Route
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route path="/" element={<Dashboard />} />
              <Route path="/add" element={<AddGoal />} />
              <Route path="/goal/:id" element={<GoalDetail />} />
              <Route path="/history" element={<History />} />
            </Route>
          </Routes>
        </HashRouter>
      </GoalProvider>
    </AuthProvider>
  );
}
