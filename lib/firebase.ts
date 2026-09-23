// Firebase Client SDK Initializer for Trio INC.
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { initializeFirestore, getFirestore } from 'firebase/firestore';

export const firebaseConfig = {
  apiKey: "AIzaSyCgHeXLfVdAapLkroys2d_3kuTo_DcygwA",
  authDomain: "trio-inc.firebaseapp.com",
  projectId: "trio-inc",
  storageBucket: "trio-inc.firebasestorage.app",
  messagingSenderId: "520516666421",
  appId: "1:520516666421:web:f39a0860be9ce567205d7c",
  firestoreDatabaseId: "(default)",
};

// Initialize App (Singleton pattern)
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);

// Use custom firestoreDatabaseId if configured in config or default
const firestoreDatabaseId = firebaseConfig.firestoreDatabaseId || '(default)';

// Initialize Firestore with long-polling transport for reliable iframe/proxy connectivity
function createFirestoreInstance() {
  if (typeof window === 'undefined') {
    return getFirestore(app, firestoreDatabaseId);
  }

  try {
    return initializeFirestore(
      app,
      {
        experimentalForceLongPolling: true,
      },
      firestoreDatabaseId
    );
  } catch {
    return getFirestore(app, firestoreDatabaseId);
  }
}

export const db = createFirestoreInstance();

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): FirestoreErrorInfo {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  return errInfo;
}

export default app;
