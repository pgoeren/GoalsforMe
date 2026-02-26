import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as goalService from '../firebase/goalService';
import { isFirestoreAvailable } from '../firebase/goalService';
import { useAuth } from './AuthContext';

const GoalContext = createContext(null);

export function GoalProvider({ children }) {
  const [yearlyGoals, setYearlyGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user, isAuthEnabled } = useAuth();

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

  // Set up real-time listener for cross-device sync, fallback to localStorage
  useEffect(() => {
    if (isAuthEnabled && !user) {
      setYearlyGoals([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const unsubscribe = goalService.subscribeToYearlyGoals(
      (goals) => {
        setYearlyGoals(goals);
        setLoading(false);
        setError(null);
      },
      (err) => {
        setError(err.message);
        loadGoals(); // fall back to localStorage
      }
    );

    if (!unsubscribe) {
      // Firestore unavailable — load from localStorage
      loadGoals();
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [user, isAuthEnabled, loadGoals]);

  const addYearlyGoal = async (goal) => {
    const newGoal = await goalService.addYearlyGoal(goal);
    // Always update state immediately for a responsive UI.
    // When Firestore is active, onSnapshot may also fire — deduplicate by id to avoid doubles.
    setYearlyGoals(prev =>
      prev.some(g => g.id === newGoal.id) ? prev : [newGoal, ...prev]
    );
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
    isCloudSync: isFirestoreAvailable(),
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
