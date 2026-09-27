'use client';

import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { 
  User, 
  signInWithPopup, 
  signOut as fbSignOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, googleProvider, db } from '@/lib/firebase';
import { 
  TeamMember, 
  UserRole, 
  DEFAULT_ADMIN_EMAIL, 
  INITIAL_WHITELIST, 
  AUTHORIZED_WHITELIST_EMAILS 
} from '@/lib/types';

export function isAuthorizedEmail(email: string | null | undefined, currentWhitelist?: TeamMember[]): boolean {
  if (!email) return false;
  const cleanEmail = email.trim().toLowerCase();
  if (cleanEmail === DEFAULT_ADMIN_EMAIL.toLowerCase()) return true;
  if (AUTHORIZED_WHITELIST_EMAILS.some((e) => e.toLowerCase() === cleanEmail)) return true;
  if (currentWhitelist && currentWhitelist.some((m) => m.email.trim().toLowerCase() === cleanEmail)) return true;
  return false;
}

export function getAssignedRole(email: string | null | undefined): UserRole {
  if (!email) return 'member';
  const cleanEmail = email.trim().toLowerCase();
  return cleanEmail === DEFAULT_ADMIN_EMAIL.toLowerCase() ? 'admin' : 'member';
}

export function buildTeamMember(
  user: User,
  assignedRole: UserRole,
  currentWhitelist: TeamMember[]
): TeamMember {
  const emailLower = (user.email || '').trim().toLowerCase();
  const found = currentWhitelist.find((m) => m.email.trim().toLowerCase() === emailLower)
    || INITIAL_WHITELIST.find((m) => m.email.trim().toLowerCase() === emailLower);

  const fallbackDisplayName = assignedRole === 'admin' 
    ? 'Sachin Barman' 
    : (emailLower === 'surajbarman50191@gmail.com' || emailLower === 'suraj.yt.science@gmail.com'
        ? 'Suraj Barman'
        : (user.displayName || 'Team Member'));

  const fallbackTitle = assignedRole === 'admin' 
    ? 'Founder & Admin (5 TB Drive Host)' 
    : (emailLower === 'surajbarman50191@gmail.com'
        ? 'Operations & Production Lead'
        : (emailLower === 'suraj.yt.science@gmail.com'
            ? 'Research & Video Creative Lead'
            : 'Team Member'));

  return {
    uid: user.uid,
    email: user.email || emailLower,
    displayName: user.displayName || found?.displayName || fallbackDisplayName,
    role: assignedRole,
    avatarUrl: user.photoURL || undefined,
    title: found?.title || fallbackTitle,
  };
}

function syncUserProfileToFirestore(authUser: User, assignedRole: UserRole) {
  try {
    const userRef = doc(db, 'users', authUser.uid);
    setDoc(userRef, {
      uid: authUser.uid,
      name: authUser.displayName || authUser.email?.split('@')[0] || 'Team Member',
      email: authUser.email,
      photoURL: authUser.photoURL || '',
      role: assignedRole,
      lastActive: serverTimestamp(),
      isOnline: true,
    }, { merge: true }).catch((err) => {
      console.warn('Non-blocking user profile sync notice:', err);
    });
  } catch (e) {
    console.warn('Profile sync initialization error:', e);
  }
}

export interface AuthContextType {
  currentUser: User | null;
  userRole: UserRole | null;
  isAdmin: boolean;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAuthReady: boolean;
  isSigningIn: boolean;

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
  updateWhitelistMember: (index: number, updated: Partial<TeamMember>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [teamMember, setTeamMember] = useState<TeamMember | null>(null);
  const [isAuthReady, setIsAuthReady] = useState<boolean>(false);
  const [isSigningIn, setIsSigningIn] = useState<boolean>(false);
  const [isUnauthorized, setIsUnauthorized] = useState<boolean>(false);
  const [unauthorizedEmail, setUnauthorizedEmail] = useState<string | null>(null);

  const [whitelist, setWhitelist] = useState<TeamMember[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('trio_whitelist');
        if (saved) {
          const parsed: TeamMember[] = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            // Ensure all members of INITIAL_WHITELIST exist in the list
            const merged = [...parsed];
            for (const initial of INITIAL_WHITELIST) {
              if (!merged.some(m => m.email.trim().toLowerCase() === initial.email.trim().toLowerCase())) {
                merged.push(initial);
              }
            }
            return merged;
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

  const whitelistRef = useRef(whitelist);
  useEffect(() => {
    whitelistRef.current = whitelist;
  }, [whitelist]);

  // Initial auth session check safety timeout
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsAuthReady(true);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      try {
        if (authUser && authUser.email) {
          const emailLower = authUser.email.trim().toLowerCase();
          const currentList = whitelistRef.current;
          const isAuthorized = isAuthorizedEmail(emailLower, currentList);

          if (!isAuthorized) {
            // Unauthorized account: immediately isolate and sign out
            setUnauthorizedEmail(authUser.email);
            setIsUnauthorized(true);
            setCurrentUser(null);
            setTeamMember(null);
            setUserRole(null);
            setIsAuthReady(true);
            setIsSigningIn(false);

            try {
              await fbSignOut(auth);
            } catch (err) {
              console.warn('Auto sign-out error for unauthorized user:', err);
            }
            return;
          }

          // User is authorized
          const assignedRole = getAssignedRole(emailLower);
          const memberData = buildTeamMember(authUser, assignedRole, currentList);

          setIsUnauthorized(false);
          setUnauthorizedEmail(null);
          setCurrentUser(authUser);
          setTeamMember(memberData);
          setUserRole(assignedRole);
          setIsAuthReady(true);
          setIsSigningIn(false);

          // Non-blocking sync to Firestore
          syncUserProfileToFirestore(authUser, assignedRole);
        } else {
          // No active Firebase Auth session
          setCurrentUser(null);
          setTeamMember(null);
          setUserRole(null);
          setIsAuthReady(true);
          setIsSigningIn(false);
        }
      } catch (err) {
        console.error('Error handling auth state change:', err);
        setIsAuthReady(true);
        setIsSigningIn(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      setIsSigningIn(true);
      setIsUnauthorized(false);
      setUnauthorizedEmail(null);
      
      const result = await signInWithPopup(auth, googleProvider);
      const authUser = result.user;

      if (!authUser || !authUser.email) {
        setIsSigningIn(false);
        return;
      }

      const emailLower = authUser.email.trim().toLowerCase();
      const currentList = whitelistRef.current;
      const isAuthorized = isAuthorizedEmail(emailLower, currentList);

      if (!isAuthorized) {
        setUnauthorizedEmail(authUser.email);
        setIsUnauthorized(true);
        setCurrentUser(null);
        setTeamMember(null);
        setUserRole(null);
        setIsSigningIn(false);

        try {
          await fbSignOut(auth);
        } catch (e) {
          console.warn('Sign-out on rejection:', e);
        }
        return;
      }

      // Authorized user - immediately update state
      const assignedRole = getAssignedRole(emailLower);
      const memberData = buildTeamMember(authUser, assignedRole, currentList);

      setIsUnauthorized(false);
      setUnauthorizedEmail(null);
      setCurrentUser(authUser);
      setTeamMember(memberData);
      setUserRole(assignedRole);
      setIsSigningIn(false);

      // Background non-blocking profile sync
      syncUserProfileToFirestore(authUser, assignedRole);
    } catch (error: any) {
      console.warn('Google Sign-in info:', error?.message || error);
      setIsSigningIn(false);
    }
  };

  const signOut = async () => {
    try {
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
      setIsSigningIn(false);
    }
  };

  const clearUnauthorized = () => {
    setIsUnauthorized(false);
    setUnauthorizedEmail(null);
    setCurrentUser(null);
    setTeamMember(null);
    setUserRole(null);
    setIsSigningIn(false);
  };

  const isWhitelisted = Boolean(
    currentUser && currentUser.email && isAuthorizedEmail(currentUser.email, whitelist)
  );

  const isAuthenticated = Boolean(currentUser && isWhitelisted);
  const isAdmin = (userRole === 'admin') || (teamMember?.role === 'admin');
  const isLoading = !isAuthReady || isSigningIn;

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userRole,
        isAdmin,
        isLoading,
        isAuthenticated,
        isAuthReady,
        isSigningIn,
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

