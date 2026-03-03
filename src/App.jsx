import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { GoalProvider } from './context/GoalContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import AddGoal from './pages/AddGoal';
import GoalDetail from './pages/GoalDetail';
import History from './pages/History';
import Profile from './pages/Profile';
import Inspiration from './pages/Inspiration';

function ProtectedRoute({ children }) {
  const { user, loading, isAuthEnabled } = useAuth();

  if (loading) {
    return <div className="loading-spinner">Loading...</div>;
  }

  // If Firebase isn't configured, allow through (local-only mode)
  if (!isAuthEnabled) return children;

  if (!user) return <Navigate to="/profile" replace />;

  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <GoalProvider>
        <HashRouter>
          <Routes>
            <Route element={<Layout />}>
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/add"
                element={
                  <ProtectedRoute>
                    <AddGoal />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/goal/:id"
                element={
                  <ProtectedRoute>
                    <GoalDetail />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/history"
                element={
                  <ProtectedRoute>
                    <History />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/inspire"
                element={
                  <ProtectedRoute>
                    <Inspiration />
                  </ProtectedRoute>
                }
              />
              <Route path="/profile" element={<Profile />} />
            </Route>
          </Routes>
        </HashRouter>
      </GoalProvider>
    </AuthProvider>
  );
}
