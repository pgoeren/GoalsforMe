import { db, auth, isFirebaseConfigured } from './config';
import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  onSnapshot,
} from 'firebase/firestore';

// ====== HELPERS ======

function getCurrentUserId() {
  return auth?.currentUser?.uid || null;
}

let _firestoreOk = isFirebaseConfigured;

export function isFirestoreAvailable() {
  return _firestoreOk;
}

function canUseFirestore() {
  return isFirebaseConfigured && _firestoreOk && !!getCurrentUserId();
}

function handleFirestoreError(err) {
  if (
    err?.code === 'permission-denied' ||
    err?.message?.includes('Missing or insufficient permissions')
  ) {
    console.warn('[GoalsForMe] Firestore permission denied — falling back to localStorage.');
    _firestoreOk = false;
    return true;
  }
  return false;
}

// ====== LOCAL STORAGE ======

const LOCAL_KEYS = {
  yearlyGoals: 'gfm_yearlyGoals',
  quarterlyGoals: 'gfm_quarterlyGoals',
  changeLog: 'gfm_changeLog',
};

function getLocal(key) {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
}

function setLocal(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// ====== CHANGE LOG ======

async function logChange(entityType, entityId, entityTitle, changes) {
  const entry = {
    id: generateId(),
    entityType,
    entityId,
    entityTitle,
    changes,
    changedAt: new Date().toISOString(),
  };

  if (canUseFirestore()) {
    try {
      const userId = getCurrentUserId();
      await addDoc(collection(db, 'changeLog'), {
        ...entry,
        userId,
        changedAt: serverTimestamp(),
      });
      return;
    } catch (err) {
      if (!handleFirestoreError(err)) throw err;
    }
  }

  const log = getLocal(LOCAL_KEYS.changeLog);
  log.unshift(entry);
  setLocal(LOCAL_KEYS.changeLog, log);
}

// ====== YEARLY GOALS ======

export async function getYearlyGoals() {
  if (canUseFirestore()) {
    try {
      const userId = getCurrentUserId();
      const snapshot = await getDocs(
        query(
          collection(db, 'yearlyGoals'),
          where('userId', '==', userId),
          orderBy('createdAt', 'desc')
        )
      );
      return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    } catch (err) {
      if (!handleFirestoreError(err)) throw err;
    }
  }
  return getLocal(LOCAL_KEYS.yearlyGoals);
}

export function subscribeToYearlyGoals(onData, onErr) {
  if (!canUseFirestore()) return null;
  const userId = getCurrentUserId();
  const q = query(
    collection(db, 'yearlyGoals'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(
    q,
    (snapshot) => onData(snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))),
    (err) => {
      handleFirestoreError(err);
      if (onErr) onErr(err);
    }
  );
}

export async function addYearlyGoal(goal) {
  const now = new Date().toISOString();
  const { email, ...safeGoal } = goal;
  const newGoal = { ...safeGoal, createdAt: now, updatedAt: now };

  if (canUseFirestore()) {
    try {
      const userId = getCurrentUserId();
      const docRef = await addDoc(collection(db, 'yearlyGoals'), {
        ...newGoal,
        userId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return { id: docRef.id, ...newGoal, userId };
    } catch (err) {
      if (!handleFirestoreError(err)) throw err;
    }
  }

  newGoal.id = generateId();
  const goals = getLocal(LOCAL_KEYS.yearlyGoals);
  goals.unshift(newGoal);
  setLocal(LOCAL_KEYS.yearlyGoals, goals);
  return newGoal;
}

export async function updateYearlyGoal(id, updates) {
  if (canUseFirestore()) {
    try {
      await updateDoc(doc(db, 'yearlyGoals', id), {
        ...updates,
        updatedAt: serverTimestamp(),
      });
      logChange(
        'yearly_goal', id, updates.title || '',
        Object.keys(updates).filter((k) => k !== 'updatedAt').map((k) => ({ field: k, newValue: updates[k] }))
      ).catch(() => {});
      return;
    } catch (err) {
      if (!handleFirestoreError(err)) throw err;
    }
  }

  const goals = getLocal(LOCAL_KEYS.yearlyGoals);
  const current = goals.find((g) => g.id === id);
  if (current) {
    const changes = Object.keys(updates)
      .filter((k) => k !== 'updatedAt' && JSON.stringify(current[k]) !== JSON.stringify(updates[k]))
      .map((k) => ({ field: k, oldValue: current[k], newValue: updates[k] }));
    if (changes.length > 0) {
      await logChange('yearly_goal', id, current.title, changes);
    }
  }
  const idx = goals.findIndex((g) => g.id === id);
  goals[idx] = { ...goals[idx], ...updates, updatedAt: new Date().toISOString() };
  setLocal(LOCAL_KEYS.yearlyGoals, goals);
}

export async function deleteYearlyGoal(id) {
  // Always clear localStorage immediately so deleted goals never come back
  let goals = getLocal(LOCAL_KEYS.yearlyGoals);
  setLocal(LOCAL_KEYS.yearlyGoals, goals.filter((g) => g.id !== id));

  let qGoals = getLocal(LOCAL_KEYS.quarterlyGoals);
  setLocal(LOCAL_KEYS.quarterlyGoals, qGoals.filter((g) => g.yearlyGoalId !== id));

  if (canUseFirestore()) {
    const userId = getCurrentUserId();
    await deleteDoc(doc(db, 'yearlyGoals', id));
    const qSnap = await getDocs(
      query(
        collection(db, 'quarterlyGoals'),
        where('userId', '==', userId),
        where('yearlyGoalId', '==', id)
      )
    );
    await Promise.all(qSnap.docs.map((d) => deleteDoc(d.ref)));
  }
}

// ====== QUARTERLY GOALS ======

export function subscribeToQuarterlyGoals(yearlyGoalId, onData, onErr) {
  if (!canUseFirestore()) return null;
  const userId = getCurrentUserId();
  const q = query(
    collection(db, 'quarterlyGoals'),
    where('userId', '==', userId),
    where('yearlyGoalId', '==', yearlyGoalId),
    orderBy('quarter')
  );
  return onSnapshot(
    q,
    (snapshot) => onData(snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))),
    (err) => {
      handleFirestoreError(err);
      if (onErr) onErr(err);
    }
  );
}

export async function getQuarterlyGoals(yearlyGoalId) {
  if (canUseFirestore()) {
    try {
      const userId = getCurrentUserId();
      const snapshot = await getDocs(
        query(
          collection(db, 'quarterlyGoals'),
          where('userId', '==', userId),
          where('yearlyGoalId', '==', yearlyGoalId),
          orderBy('quarter')
        )
      );
      return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    } catch (err) {
      if (!handleFirestoreError(err)) throw err;
    }
  }
  return getLocal(LOCAL_KEYS.quarterlyGoals)
    .filter((g) => g.yearlyGoalId === yearlyGoalId)
    .sort((a, b) => a.quarter - b.quarter);
}

export async function addQuarterlyGoal(goal) {
  const now = new Date().toISOString();
  const { email, ...safeGoal } = goal;
  const newGoal = {
    ...safeGoal,
    status: 'not_started',
    kpiProgress: 0,
    checkInCompleted: false,
    checkInNotes: '',
    createdAt: now,
    updatedAt: now,
  };

  if (canUseFirestore()) {
    try {
      const userId = getCurrentUserId();
      const docRef = await addDoc(collection(db, 'quarterlyGoals'), {
        ...newGoal,
        userId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return { id: docRef.id, ...newGoal, userId };
    } catch (err) {
      if (!handleFirestoreError(err)) throw err;
    }
  }

  newGoal.id = generateId();
  const goals = getLocal(LOCAL_KEYS.quarterlyGoals);
  goals.push(newGoal);
  setLocal(LOCAL_KEYS.quarterlyGoals, goals);
  return newGoal;
}

export async function updateQuarterlyGoal(id, updates) {
  if (canUseFirestore()) {
    try {
      await updateDoc(doc(db, 'quarterlyGoals', id), {
        ...updates,
        updatedAt: serverTimestamp(),
      });
      logChange(
        'quarterly_goal', id, updates.title || '',
        Object.keys(updates).filter((k) => k !== 'updatedAt').map((k) => ({ field: k, newValue: updates[k] }))
      ).catch(() => {});
      return;
    } catch (err) {
      if (!handleFirestoreError(err)) throw err;
    }
  }

  const goals = getLocal(LOCAL_KEYS.quarterlyGoals);
  const current = goals.find((g) => g.id === id);
  if (current) {
    const changes = Object.keys(updates)
      .filter((k) => k !== 'updatedAt' && JSON.stringify(current[k]) !== JSON.stringify(updates[k]))
      .map((k) => ({ field: k, oldValue: current[k], newValue: updates[k] }));
    if (changes.length > 0) {
      await logChange('quarterly_goal', id, current.title || `Q${current.quarter}`, changes);
    }
  }
  const idx = goals.findIndex((g) => g.id === id);
  goals[idx] = { ...goals[idx], ...updates, updatedAt: new Date().toISOString() };
  setLocal(LOCAL_KEYS.quarterlyGoals, goals);
}

export async function deleteQuarterlyGoal(id) {
  if (canUseFirestore()) {
    try {
      await deleteDoc(doc(db, 'quarterlyGoals', id));
      return;
    } catch (err) {
      if (!handleFirestoreError(err)) throw err;
    }
  }

  let goals = getLocal(LOCAL_KEYS.quarterlyGoals);
  setLocal(LOCAL_KEYS.quarterlyGoals, goals.filter((g) => g.id !== id));
}

// ====== CHANGE LOG ======

export async function getChangeLog(entityId) {
  if (canUseFirestore()) {
    try {
      const userId = getCurrentUserId();
      const snapshot = await getDocs(
        query(
          collection(db, 'changeLog'),
          where('entityId', '==', entityId),
          where('userId', '==', userId),
          orderBy('changedAt', 'desc')
        )
      );
      return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    } catch (err) {
      if (!handleFirestoreError(err)) throw err;
    }
  }
  return getLocal(LOCAL_KEYS.changeLog).filter((e) => e.entityId === entityId);
}

export async function getAllChanges() {
  if (canUseFirestore()) {
    try {
      const userId = getCurrentUserId();
      const snapshot = await getDocs(
        query(
          collection(db, 'changeLog'),
          where('userId', '==', userId),
          orderBy('changedAt', 'desc')
        )
      );
      return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    } catch (err) {
      if (!handleFirestoreError(err)) throw err;
    }
  }
  return getLocal(LOCAL_KEYS.changeLog);
}
