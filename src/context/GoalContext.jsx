import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import * as goalService from '../firebase/goalService';
import { isFirestoreAvailable } from '../firebase/goalService';
import { useAuth } from './AuthContext';

const GoalContext = createContext(null);

export function GoalProvider({ children }) {
  const [yearlyGoals, setYearlyGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user, isAuthEnabled } = useAuth();

  // Track IDs being deleted so onSnapshot doesn't resurrect them
  const pendingDeletesRef = useRef(new Set());

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
    if (isAuthEnabled && !user) {
      setYearlyGoals([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const unsubscribe = goalService.subscribeToYearlyGoals(
      (goals) => {
        // Filter out goals that are mid-delete
        const filtered = pendingDeletesRef.current.size > 0
          ? goals.filter((g) => !pendingDeletesRef.current.has(g.id))
          : goals;
        setYearlyGoals(filtered);
        setLoading(false);
        setError(null);
      },
      (err) => {
        setError(err.message);
        loadGoals();
      }
    );

    if (!unsubscribe) {
      loadGoals();
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [user, isAuthEnabled, loadGoals]);

  const addYearlyGoal = async (goal) => {
    const newGoal = await goalService.addYearlyGoal(goal);
    // Deduplicate — onSnapshot may also fire
    setYearlyGoals((prev) =>
      prev.some((g) => g.id === newGoal.id) ? prev : [newGoal, ...prev]
    );
    return newGoal;
  };

  const updateYearlyGoal = async (id, updates) => {
    // Optimistic update
    const previous = yearlyGoals;
    setYearlyGoals((prev) =>
      prev.map((g) => (g.id === id ? { ...g, ...updates, updatedAt: new Date().toISOString() } : g))
    );
    try {
      await goalService.updateYearlyGoal(id, updates);
    } catch (err) {
      setYearlyGoals(previous);
      throw err;
    }
  };

  const deleteYearlyGoal = async (id) => {
    pendingDeletesRef.current.add(id);
    setYearlyGoals((prev) => prev.filter((g) => g.id !== id));
    try {
      await goalService.deleteYearlyGoal(id);
    } catch (err) {
      pendingDeletesRef.current.delete(id);
      loadGoals();
      throw err;
    }
    // Keep in pending briefly so in-flight onSnapshot doesn't re-add
    setTimeout(() => pendingDeletesRef.current.delete(id), 5000);
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
