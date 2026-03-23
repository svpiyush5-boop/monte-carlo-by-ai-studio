import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut, User } from 'firebase/auth';
import { auth, googleProvider, db } from './firebase';
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { Scenario } from './types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: () => Promise<void>;
  logOut: () => Promise<void>;
  scenarios: Scenario[];
  saveScenario: (name: string, params: any) => Promise<void>;
  deleteScenario: (id: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [scenarios, setScenarios] = useState<Scenario[]>([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!user) {
      setScenarios([]);
      return;
    }
    const q = query(collection(db, 'scenarios'), where('uid', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Scenario));
      setScenarios(data);
    }, (error) => {
      console.error("Error fetching scenarios:", error);
    });
    return unsubscribe;
  }, [user]);

  const signIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Sign in error:", error);
    }
  };

  const logOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  const saveScenario = async (name: string, params: any) => {
    if (!user) return;
    if (scenarios.length >= 3) {
      alert("You can only save up to 3 scenarios. Please delete one first.");
      return;
    }
    try {
      await addDoc(collection(db, 'scenarios'), {
        uid: user.uid,
        name,
        params,
        createdAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Error saving scenario:", error);
    }
  };

  const deleteScenario = async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'scenarios', id));
    } catch (error) {
      console.error("Error deleting scenario:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, logOut, scenarios, saveScenario, deleteScenario }}>
      {children}
    </AuthContext.Provider>
  );
};
