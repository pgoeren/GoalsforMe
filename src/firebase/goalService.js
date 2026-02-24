import { db, auth, isFirebaseConfigured } from './config';
import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';

// ====== HELPERS ======
function getCurrentUserId() {
  return auth?.currentUser?.uid || null;
}

/** Require an authenticated user — throws if not logged in. */
function requireUserId() {
  const uid = getCurrentUserId();
  if (!uid) {
    throw new Error('Not authenticated — please log in and try again.');
  }
  return uid;
}

// ====== LOCAL STORAGE HELPERS ======
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

  if (isFirebaseConfigured) {
    const userId = requireUserId();
    await addDoc(collection(db, 'changeLog'), {
      ...entry,
      userId,
      changedAt: serverTimestamp(),
    });
  } else {
    const log = getLocal(LOCAL_KEYS.changeLog);
    log.unshift(entry);
    setLocal(LOCAL_KEYS.changeLog, log);
  }
}

// ====== YEARLY GOALS ======
export async function getYearlyGoals() {
  if (isFirebaseConfigured) {
    const userId = getCurrentUserId();
    if (!userId) return [];
    const snapshot = await getDocs(
      query(
        collection(db, 'yearlyGoals'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      )
    );
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  }
  return getLocal(LOCAL_KEYS.yearlyGoals);
}

export async function getYearlyGoal(id) {
  if (isFirebaseConfigured) {
    const docSnap = await getDoc(doc(db, 'yearlyGoals', id));
    if (!docSnap.exists()) return null;
    const data = docSnap.data();
    // Verify ownership
    if (data.userId !== getCurrentUserId()) return null;
    return { id: docSnap.id, ...data };
  }
  const goals = getLocal(LOCAL_KEYS.yearlyGoals);
  return goals.find(g => g.id === id) || null;
}

export async function addYearlyGoal(goal) {
  const now = new Date().toISOString();
  const { email, ...safeGoal } = goal; // strip email if present (Firestore rules reject it)
  const newGoal = {
    ...safeGoal,
    createdAt: now,
    updatedAt: now,
  };

  if (isFirebaseConfigured) {
    const userId = requireUserId();
    const docRef = await addDoc(collection(db, 'yearlyGoals'), {
      ...newGoal,
      userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return { id: docRef.id, ...newGoal, userId };
  }

  newGoal.id = generateId();
  const goals = getLocal(LOCAL_KEYS.yearlyGoals);
  goals.unshift(newGoal);
  setLocal(LOCAL_KEYS.yearlyGoals, goals);
  return newGoal;
}

export async function updateYearlyGoal(id, updates) {
  let current;
  if (isFirebaseConfigured) {
    const docSnap = await getDoc(doc(db, 'yearlyGoals', id));
    current = docSnap.data();
    if (current.userId !== getCurrentUserId()) throw new Error('Unauthorized');
  } else {
    const goals = getLocal(LOCAL_KEYS.yearlyGoals);
    current = goals.find(g => g.id === id);
  }

  const changes = [];
  for (const [key, value] of Object.entries(updates)) {
    if (JSON.stringify(current[key]) !== JSON.stringify(value) && key !== 'updatedAt') {
      changes.push({ field: key, oldValue: current[key], newValue: value });
    }
  }

  if (changes.length > 0) {
    await logChange('yearly_goal', id, current.title, changes);
  }

  if (isFirebaseConfigured) {
    await updateDoc(doc(db, 'yearlyGoals', id), {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  } else {
    const goals = getLocal(LOCAL_KEYS.yearlyGoals);
    const idx = goals.findIndex(g => g.id === id);
    goals[idx] = { ...goals[idx], ...updates, updatedAt: new Date().toISOString() };
    setLocal(LOCAL_KEYS.yearlyGoals, goals);
  }
}

export async function deleteYearlyGoal(id) {
  if (isFirebaseConfigured) {
    const docSnap = await getDoc(doc(db, 'yearlyGoals', id));
    if (docSnap.data()?.userId !== getCurrentUserId()) throw new Error('Unauthorized');
    await deleteDoc(doc(db, 'yearlyGoals', id));
    const qSnap = await getDocs(
      query(collection(db, 'quarterlyGoals'), where('yearlyGoalId', '==', id))
    );
    for (const d of qSnap.docs) {
      await deleteDoc(d.ref);
    }
  } else {
    let goals = getLocal(LOCAL_KEYS.yearlyGoals);
    goals = goals.filter(g => g.id !== id);
    setLocal(LOCAL_KEYS.yearlyGoals, goals);

    let qGoals = getLocal(LOCAL_KEYS.quarterlyGoals);
    qGoals = qGoals.filter(g => g.yearlyGoalId !== id);
    setLocal(LOCAL_KEYS.quarterlyGoals, qGoals);
  }
}

// ====== QUARTERLY GOALS ======
export async function getQuarterlyGoals(yearlyGoalId) {
  if (isFirebaseConfigured) {
    const snapshot = await getDocs(
      query(
        collection(db, 'quarterlyGoals'),
        where('yearlyGoalId', '==', yearlyGoalId),
        orderBy('quarter')
      )
    );
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  }
  return getLocal(LOCAL_KEYS.quarterlyGoals)
    .filter(g => g.yearlyGoalId === yearlyGoalId)
    .sort((a, b) => a.quarter - b.quarter);
}

export async function addQuarterlyGoal(goal) {
  const now = new Date().toISOString();
  const { email, ...safeGoal } = goal; // strip email if present (Firestore rules reject it)
  const newGoal = {
    ...safeGoal,
    status: 'not_started',
    kpiProgress: 0,
    checkInCompleted: false,
    checkInNotes: '',
    createdAt: now,
    updatedAt: now,
  };

  if (isFirebaseConfigured) {
    const userId = requireUserId();
    const docRef = await addDoc(collection(db, 'quarterlyGoals'), {
      ...newGoal,
      userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return { id: docRef.id, ...newGoal, userId };
  }

  newGoal.id = generateId();
  const goals = getLocal(LOCAL_KEYS.quarterlyGoals);
  goals.push(newGoal);
  setLocal(LOCAL_KEYS.quarterlyGoals, goals);
  return newGoal;
}

export async function updateQuarterlyGoal(id, updates) {
  let current;
  if (isFirebaseConfigured) {
    const docSnap = await getDoc(doc(db, 'quarterlyGoals', id));
    current = docSnap.data();
    if (current.userId !== getCurrentUserId()) throw new Error('Unauthorized');
  } else {
    const goals = getLocal(LOCAL_KEYS.quarterlyGoals);
    current = goals.find(g => g.id === id);
  }

  const changes = [];
  for (const [key, value] of Object.entries(updates)) {
    if (JSON.stringify(current[key]) !== JSON.stringify(value) && key !== 'updatedAt') {
      changes.push({ field: key, oldValue: current[key], newValue: value });
    }
  }

  if (changes.length > 0) {
    await logChange('quarterly_goal', id, current.title || `Q${current.quarter}`, changes);
  }

  if (isFirebaseConfigured) {
    await updateDoc(doc(db, 'quarterlyGoals', id), {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  } else {
    const goals = getLocal(LOCAL_KEYS.quarterlyGoals);
    const idx = goals.findIndex(g => g.id === id);
    goals[idx] = { ...goals[idx], ...updates, updatedAt: new Date().toISOString() };
    setLocal(LOCAL_KEYS.quarterlyGoals, goals);
  }
}

export async function deleteQuarterlyGoal(id) {
  if (isFirebaseConfigured) {
    const docSnap = await getDoc(doc(db, 'quarterlyGoals', id));
    if (docSnap.data()?.userId !== getCurrentUserId()) throw new Error('Unauthorized');
    await deleteDoc(doc(db, 'quarterlyGoals', id));
  } else {
    let goals = getLocal(LOCAL_KEYS.quarterlyGoals);
    goals = goals.filter(g => g.id !== id);
    setLocal(LOCAL_KEYS.quarterlyGoals, goals);
  }
}

// ====== CHANGE LOG ======
export async function getChangeLog(entityId) {
  if (isFirebaseConfigured) {
    const userId = getCurrentUserId();
    if (!userId) return [];
    const snapshot = await getDocs(
      query(
        collection(db, 'changeLog'),
        where('entityId', '==', entityId),
        where('userId', '==', userId),
        orderBy('changedAt', 'desc')
      )
    );
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  }
  return getLocal(LOCAL_KEYS.changeLog).filter(e => e.entityId === entityId);
}

export async function getAllChanges() {
  if (isFirebaseConfigured) {
    const userId = getCurrentUserId();
    if (!userId) return [];
    const snapshot = await getDocs(
      query(
        collection(db, 'changeLog'),
        where('userId', '==', userId),
        orderBy('changedAt', 'desc')
      )
    );
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  }
  return getLocal(LOCAL_KEYS.changeLog);
}
