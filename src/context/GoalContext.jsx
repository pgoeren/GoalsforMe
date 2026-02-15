import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as goalService from '../firebase/goalService';

const GoalContext = createContext(null);

export function GoalProvider({ children }) {
  const [yearlyGoals, setYearlyGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadGoals = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const goals = await goalService.getYearlyGoals();
      setYearlyGoals(goals);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadGoals();
  }, [loadGoals]);

  const addYearlyGoal = async (goal) => {
    const newGoal = await goalService.addYearlyGoal(goal);
    setYearlyGoals(prev => [newGoal, ...prev]);
    return newGoal;
  };

  const updateYearlyGoal = async (id, updates) => {
    await goalService.updateYearlyGoal(id, updates);
    setYearlyGoals(prev =>
      prev.map(g => (g.id === id ? { ...g, ...updates, updatedAt: new Date().toISOString() } : g))
    );
  };

  const deleteYearlyGoal = async (id) => {
    await goalService.deleteYearlyGoal(id);
    setYearlyGoals(prev => prev.filter(g => g.id !== id));
  };

  const value = {
    yearlyGoals,
    loading,
    error,
    loadGoals,
    addYearlyGoal,
    updateYearlyGoal,
    deleteYearlyGoal,
  };

  return <GoalContext.Provider value={value}>{children}</GoalContext.Provider>;
}

export function useGoals() {
  const context = useContext(GoalContext);
  if (!context) {
    throw new Error('useGoals must be used within a GoalProvider');
  }
  return context;
}
