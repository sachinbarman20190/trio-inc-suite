'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  signInWithPopup, 
  signOut as fbSignOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, googleProvider, db, handleFirestoreError, OperationType } from '@/lib/firebase';
import { TeamMember, UserRole, DEFAULT_ADMIN_EMAIL, INITIAL_WHITELIST, AUTHORIZED_WHITELIST_EMAILS } from '@/lib/types';

interface AuthContextType {
  user: User | null;
  teamMember: TeamMember | null;
  role: UserRole | null;
  isAdmin: boolean;
  isWhitelisted: boolean;
  loading: boolean;
  whitelist: TeamMember[];
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  // For easy dev preview/testing across roles
  simulateMemberLogin: (email: string) => void;
  updateWhitelistMember: (index: number, updated: Partial<TeamMember>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [teamMember, setTeamMember] = useState<TeamMember | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [whitelist, setWhitelist] = useState<TeamMember[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('trio_whitelist');
        if (saved) {
          const parsed: TeamMember[] = JSON.parse(saved);
          const hasSuraj = parsed.some((m) => m.email.toLowerCase() === 'suraj.yt.science@gmail.com');
          const hasSachin = parsed.some((m) => m.email.toLowerCase() === 'sachinbarman20190@gmail.com');
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
    } catch (e) {}
  };

  const updateWhitelistMember = (index: number, updated: Partial<TeamMember>) => {
    const updatedList = [...whitelist];
    if (updatedList[index]) {
      updatedList[index] = { ...updatedList[index], ...updated };
      saveWhitelist(updatedList);
      // If current user is this member, update
      if (teamMember && teamMember.email === updatedList[index].email) {
        setTeamMember(updatedList[index]);
      }
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser && currentUser.email) {
        const emailLower = currentUser.email.trim().toLowerCase();
        let found = whitelist.find((m) => m.email.trim().toLowerCase() === emailLower);

        // Fallback to check INITIAL_WHITELIST or predefined authorized emails
        if (!found) {
          found = INITIAL_WHITELIST.find((m) => m.email.trim().toLowerCase() === emailLower);
          if (found) {
            setWhitelist((prev) => {
              const updated = [...prev.filter((m) => m.email.toLowerCase() !== emailLower), found!];
              try {
                localStorage.setItem('trio_whitelist', JSON.stringify(updated));
              } catch (e) {}
              return updated;
            });
          }
        }

        // Specifically ensure suraj.yt.science@gmail.com is granted access immediately
        if (!found && emailLower === 'suraj.yt.science@gmail.com') {
          found = {
            email: 'suraj.yt.science@gmail.com',
            displayName: currentUser.displayName || 'Suraj Barman',
            role: 'member',
            title: 'Team Member',
          };
        }

        if (found) {
          const memberData: TeamMember = {
            uid: currentUser.uid,
            email: currentUser.email,
            displayName: currentUser.displayName || found.displayName,
            role: found.role,
            avatarUrl: currentUser.photoURL || undefined,
            title: found.title,
          };
          setTeamMember(memberData);

          // Update user profile in Firestore
          try {
            const userRef = doc(db, 'users', currentUser.uid);
            await setDoc(userRef, {
              uid: currentUser.uid,
              email: currentUser.email,
              displayName: memberData.displayName,
              role: memberData.role,
              photoURL: currentUser.photoURL || '',
              lastActive: new Date().toISOString(),
            }, { merge: true });
          } catch (e) {
            handleFirestoreError(e, OperationType.WRITE, `users/${currentUser.uid}`);
          }
        } else {
          // Not in whitelist
          setTeamMember(null);
        }
      } else {
        // Auto-initialize demo Admin session for instant preview if no Firebase session yet
        // Sachin Barman (Admin)
        const defaultMember = whitelist[0] || INITIAL_WHITELIST[0];
        setTeamMember(defaultMember);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [whitelist]);

  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      console.error('Google Sign-in error:', error);
      alert(`Sign in note: ${error.message || 'Error authenticating with Google'}`);
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    await fbSignOut(auth);
    setUser(null);
    setTeamMember(null);
  };

  // Quick switch for testing 3-member perspective
  const simulateMemberLogin = (email: string) => {
    const emailLower = email.trim().toLowerCase();
    let found = whitelist.find((m) => m.email.trim().toLowerCase() === emailLower);
    if (!found) {
      found = INITIAL_WHITELIST.find((m) => m.email.trim().toLowerCase() === emailLower);
    }
    if (found) {
      setTeamMember(found);
    } else {
      setTeamMember(null);
    }
  };

  const isWhitelisted = Boolean(
    teamMember && (
      AUTHORIZED_WHITELIST_EMAILS.some((e) => e.toLowerCase() === teamMember.email.trim().toLowerCase()) ||
      whitelist.some((m) => m.email.trim().toLowerCase() === teamMember.email.trim().toLowerCase())
    )
  );
  const role = teamMember?.role || null;
  const isAdmin = role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        user,
        teamMember,
        role,
        isAdmin,
        isWhitelisted,
        loading,
        whitelist,
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
