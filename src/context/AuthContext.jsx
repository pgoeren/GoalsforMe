import { createContext, useContext, useState, useEffect } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from 'firebase/auth';
import { auth, isFirebaseConfigured } from '../firebase/config';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      // No Firebase — skip auth, run in local-only mode
      setLoading(false);
      return;
    }

    // Fallback: if Firebase auth doesn't respond in 5 s, unblock the app
    const timeout = setTimeout(() => {
      console.warn('[GoalsForMe] Firebase auth timed out — falling back to local mode.');
      setLoading(false);
    }, 5000);

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      clearTimeout(timeout);
      setUser(firebaseUser);
      setLoading(false);
    });

    return () => {
      clearTimeout(timeout);
      unsubscribe();
    };
  }, []);

  const signup = async (email, password, displayName) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    if (displayName) {
      await updateProfile(cred.user, { displayName });
    }
    return cred.user;
  };

  const login = async (email, password) => {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    return cred.user;
  };

  const logout = () => signOut(auth);

  const updateDisplayName = async (displayName) => {
    if (!auth?.currentUser) return;
    await updateProfile(auth.currentUser, { displayName });
    // Force a re-render with updated user object
    setUser({ ...auth.currentUser });
  };

  const value = {
    user,
    loading,
    signup,
    login,
    logout,
    updateDisplayName,
    isAuthEnabled: isFirebaseConfigured && !!auth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
