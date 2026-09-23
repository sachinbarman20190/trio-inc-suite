'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  signInWithPopup, 
  signOut as fbSignOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, googleProvider, db, handleFirestoreError, OperationType } from '@/lib/firebase';
import { 
  TeamMember, 
  UserRole, 
  DEFAULT_ADMIN_EMAIL, 
  INITIAL_WHITELIST, 
  AUTHORIZED_WHITELIST_EMAILS 
} from '@/lib/types';

export interface AuthContextType {
  // Required in prompt
  currentUser: User | null;
  userRole: UserRole | null;
  isAdmin: boolean;
  isLoading: boolean;

  // Backward compatibility & team utilities
  user: User | null;
  role: UserRole | null;
  loading: boolean;
  teamMember: TeamMember | null;
  isWhitelisted: boolean;
  whitelist: TeamMember[];
  isUnauthorized: boolean;
  unauthorizedEmail: string | null;
  clearUnauthorized: () => void;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  simulateMemberLogin: (email: string) => void;
  updateWhitelistMember: (index: number, updated: Partial<TeamMember>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [teamMember, setTeamMember] = useState<TeamMember | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isUnauthorized, setIsUnauthorized] = useState<boolean>(false);
  const [unauthorizedEmail, setUnauthorizedEmail] = useState<string | null>(null);

  const [whitelist, setWhitelist] = useState<TeamMember[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('trio_whitelist');
        if (saved) {
          const parsed: TeamMember[] = JSON.parse(saved);
          const hasSuraj = parsed.some((m) => m.email.toLowerCase() === 'suraj.yt.science@gmail.com');
          const hasSachin = parsed.some((m) => m.email.toLowerCase() === DEFAULT_ADMIN_EMAIL.toLowerCase());
          if (hasSuraj && hasSachin) {
            return parsed;
          }
        }
      } catch (e) {
        console.warn('Could not read saved whitelist', e);
      }
    }
    return INITIAL_WHITELIST;
  });

  const saveWhitelist = (newList: TeamMember[]) => {
    setWhitelist(newList);
    try {
      localStorage.setItem('trio_whitelist', JSON.stringify(newList));
    } catch (e) {
      console.warn('Could not persist whitelist:', e);
    }
  };

  const updateWhitelistMember = (index: number, updated: Partial<TeamMember>) => {
    const updatedList = [...whitelist];
    if (updatedList[index]) {
      updatedList[index] = { ...updatedList[index], ...updated };
      saveWhitelist(updatedList);
      if (teamMember && teamMember.email.toLowerCase() === updatedList[index].email.toLowerCase()) {
        setTeamMember(updatedList[index]);
        if (updated.role) {
          setUserRole(updated.role);
        }
      }
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      setIsLoading(true);

      if (authUser && authUser.email) {
        const emailLower = authUser.email.trim().toLowerCase();

        // Check if user is in authorized whitelist
        const isRootAdmin = emailLower === DEFAULT_ADMIN_EMAIL.toLowerCase();
        const isPredefined = AUTHORIZED_WHITELIST_EMAILS.some((e) => e.toLowerCase() === emailLower);
        const inLocalWhitelist = whitelist.some((m) => m.email.trim().toLowerCase() === emailLower);

        // Also check if already present in Firestore users collection
        let isFirestoreAuthorized = false;
        try {
          const userDocRef = doc(db, 'users', authUser.uid);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            isFirestoreAuthorized = true;
          }
        } catch (e) {
          console.warn('Error verifying user in Firestore:', e);
        }

        const isAuthorized = isRootAdmin || isPredefined || inLocalWhitelist || isFirestoreAuthorized;

        if (!isAuthorized) {
          // 3. CLEAN STATE RESTRICTION:
          // If an unauthorized email logs in, show a gentle access-denied screen and automatically trigger auth.signOut().
          const rejectedEmail = authUser.email;
          setUnauthorizedEmail(rejectedEmail);
          setIsUnauthorized(true);
          setCurrentUser(null);
          setTeamMember(null);
          setUserRole(null);
          setIsLoading(false);

          try {
            await fbSignOut(auth);
          } catch (err) {
            console.warn('Auto sign-out error for unauthorized user:', err);
          }
          return;
        }

        // User is authorized - clear any previous rejection
        setIsUnauthorized(false);
        setUnauthorizedEmail(null);

        // Compute role strictly: user.email === "sachinbarman20190@gmail.com" ? "admin" : "member"
        const assignedRole: UserRole = emailLower === DEFAULT_ADMIN_EMAIL.toLowerCase() ? 'admin' : 'member';

        // 1. AUTO-SYNC USER PROFILE ON LOGIN:
        // Inside onAuthStateChanged, when an authorized team member signs in with Google:
        // Check users collection using uid or sanitized email, upsert user profile document:
        // {
        //   uid: user.uid,
        //   name: user.displayName,
        //   email: user.email,
        //   photoURL: user.photoURL,
        //   role: user.email === "sachinbarman20190@gmail.com" ? "admin" : "member",
        //   lastActive: serverTimestamp(),
        //   isOnline: true
        // }
        // Set merge: true so existing settings/preferences are not overwritten.
        try {
          const userRef = doc(db, 'users', authUser.uid);
          await setDoc(userRef, {
            uid: authUser.uid,
            name: authUser.displayName || authUser.email.split('@')[0],
            email: authUser.email,
            photoURL: authUser.photoURL || '',
            role: authUser.email === "sachinbarman20190@gmail.com" ? "admin" : "member",
            lastActive: serverTimestamp(),
            isOnline: true,
          }, { merge: true });
        } catch (e) {
          handleFirestoreError(e, OperationType.WRITE, `users/${authUser.uid}`);
        }

        let found = whitelist.find((m) => m.email.trim().toLowerCase() === emailLower);
        if (!found) {
          found = INITIAL_WHITELIST.find((m) => m.email.trim().toLowerCase() === emailLower);
          if (found) {
            setWhitelist((prev) => {
              const updated = [...prev.filter((m) => m.email.toLowerCase() !== emailLower), found!];
              saveWhitelist(updated);
              return updated;
            });
          }
        }

        const memberData: TeamMember = {
          uid: authUser.uid,
          email: authUser.email,
          displayName: authUser.displayName || found?.displayName || (assignedRole === 'admin' ? 'Sachin Barman' : 'Team Member'),
          role: assignedRole,
          avatarUrl: authUser.photoURL || undefined,
          title: found?.title || (assignedRole === 'admin' ? 'Founder & Admin (5 TB Drive Host)' : 'Team Member'),
        };

        setCurrentUser(authUser);
        setTeamMember(memberData);
        setUserRole(assignedRole);
      } else {
        // No active Firebase Auth session
        setCurrentUser(null);
        if (!isUnauthorized) {
          // Initialize default preview session so app can be tested immediately
          const defaultMember = whitelist[0] || INITIAL_WHITELIST[0];
          setTeamMember(defaultMember);
          setUserRole(defaultMember?.role || 'admin');
        } else {
          setTeamMember(null);
          setUserRole(null);
        }
      }

      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [whitelist, isUnauthorized]);

  const signInWithGoogle = async () => {
    try {
      setIsLoading(true);
      setIsUnauthorized(false);
      setUnauthorizedEmail(null);
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      console.error('Google Sign-in error:', error);
      // Ignore user-cancelled popup closing without displaying an intrusive error
      if (error?.code !== 'auth/popup-closed-by-user' && error?.code !== 'auth/cancelled-popup-request') {
        alert(`Sign-in note: ${error.message || 'Error authenticating with Google'}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setIsLoading(true);
      if (auth.currentUser) {
        try {
          const userRef = doc(db, 'users', auth.currentUser.uid);
          await setDoc(userRef, {
            isOnline: false,
            lastActive: serverTimestamp(),
          }, { merge: true });
        } catch (e) {
          console.debug('Error setting offline status on sign out:', e);
        }
      }
      await fbSignOut(auth);
    } catch (error) {
      console.error('Sign-out error:', error);
    } finally {
      setCurrentUser(null);
      setTeamMember(null);
      setUserRole(null);
      setIsUnauthorized(false);
      setUnauthorizedEmail(null);
      setIsLoading(false);
    }
  };

  // Switch perspective for testing the 3 team member roles
  const simulateMemberLogin = (email: string) => {
    const emailLower = email.trim().toLowerCase();
    let found = whitelist.find((m) => m.email.trim().toLowerCase() === emailLower);
    if (!found) {
      found = INITIAL_WHITELIST.find((m) => m.email.trim().toLowerCase() === emailLower);
    }
    if (found) {
      setTeamMember(found);
      setUserRole(found.role);
      setIsUnauthorized(false);
      setUnauthorizedEmail(null);
    } else {
      setTeamMember(null);
      setUserRole(null);
    }
  };

  const clearUnauthorized = () => {
    setIsUnauthorized(false);
    setUnauthorizedEmail(null);
    const defaultMember = whitelist[0] || INITIAL_WHITELIST[0];
    setTeamMember(defaultMember);
    setUserRole(defaultMember?.role || 'admin');
  };

  const isWhitelisted = Boolean(
    teamMember && (
      AUTHORIZED_WHITELIST_EMAILS.some((e) => e.toLowerCase() === teamMember.email.trim().toLowerCase()) ||
      whitelist.some((m) => m.email.trim().toLowerCase() === teamMember.email.trim().toLowerCase()) ||
      teamMember.email.trim().toLowerCase() === DEFAULT_ADMIN_EMAIL.toLowerCase()
    )
  );

  const isAdmin = (userRole === 'admin') || (teamMember?.role === 'admin');

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userRole,
        isAdmin,
        isLoading,
        // Backward-compatibility aliases
        user: currentUser,
        role: userRole,
        loading: isLoading,
        teamMember,
        isWhitelisted,
        whitelist,
        isUnauthorized,
        unauthorizedEmail,
        clearUnauthorized,
        signInWithGoogle,
        signOut,
        simulateMemberLogin,
        updateWhitelistMember,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
