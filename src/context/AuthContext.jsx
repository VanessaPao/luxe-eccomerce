import React, { createContext, useContext, useEffect, useState } from 'react';
import { subscribeToAuth } from '../firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);   // Firebase Auth user
  const [profile, setProfile] = useState(null);   // Firestore extra data
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubProfile = null;

    const unsubAuth = subscribeToAuth((firebaseUser) => {
      setUser(firebaseUser);

      // Clean up previous profile subscription if any
      if (unsubProfile) {
        unsubProfile();
        unsubProfile = null;
      }

      if (firebaseUser) {
        // Subscribe to user document in Firestore in real-time
        unsubProfile = onSnapshot(doc(db, 'users', firebaseUser.uid), (snap) => {
          setProfile(snap.exists() ? snap.data() : null);
          setLoading(false);
        }, (error) => {
          console.error("Error subscribing to profile:", error);
          setProfile(null);
          setLoading(false);
        });
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      unsubAuth();
      if (unsubProfile) unsubProfile();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, profile, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
