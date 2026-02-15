import { HashRouter, Routes, Route } from 'react-router-dom';
import { GoalProvider } from './context/GoalContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import AddGoal from './pages/AddGoal';
import GoalDetail from './pages/GoalDetail';
import History from './pages/History';

export default function App() {
  return (
    <GoalProvider>
      <HashRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/add" element={<AddGoal />} />
            <Route path="/goal/:id" element={<GoalDetail />} />
            <Route path="/history" element={<History />} />
          </Route>
        </Routes>
      </HashRouter>
    </GoalProvider>
  );
}
