import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { 
  auth, 
  googleProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged, 
  updateProfile,
  User,
  db
} from '../lib/firebase';
import { doc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';

interface AuthProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL?: string | null;
  isCustomProfile?: boolean;
}

interface AuthContextType {
  user: User | null;
  customProfile: AuthProfile | null;
  loading: boolean;
  isAdmin: boolean;
  isGuest: boolean;
  effectiveUser: {
    uid: string;
    email: string;
    displayName: string;
    photoURL?: string;
  } | null;
  authorDisplayName: string;
  loginWithGoogle: () => Promise<User | null>;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  registerWithEmail: (email: string, pass: string, displayName: string) => Promise<void>;
  loginWithEmailSimulated: (email: string, pass: string, name?: string) => Promise<void>;
  loginAsAdmin: (password: string) => boolean;
  logout: () => Promise<void>;
  deleteCurrentAccount: () => Promise<void>;
  deleteUserRecord: (uid: string, email?: string) => Promise<void>;
}

const LOCAL_STORAGE_USERS_KEY = 'campus_lf_registered_accounts';
const LOCAL_STORAGE_SESSION_KEY = 'campus_lf_active_user';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [customProfile, setCustomProfile] = useState<AuthProfile | null>(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_SESSION_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    return sessionStorage.getItem('isAdmin') === 'true';
  });

  const syncUserProfileToFirestore = async (profileData: {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL?: string | null;
    provider: 'google' | 'email';
  }) => {
    try {
      if (!profileData.uid) return;
      const userDocRef = doc(db, 'users', profileData.uid);
      await setDoc(userDocRef, {
        uid: profileData.uid,
        email: (profileData.email || '').trim().toLowerCase(),
        displayName: profileData.displayName || profileData.email?.split('@')[0] || 'ผู้ใช้งาน',
        photoURL: profileData.photoURL || '',
        provider: profileData.provider,
        lastLoginAt: serverTimestamp()
      }, { merge: true });
    } catch (err) {
      console.warn('Silent note: Could not sync user profile to firestore', err);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // If logged into Firebase, clear custom session to avoid conflict
        setCustomProfile(null);
        localStorage.removeItem(LOCAL_STORAGE_SESSION_KEY);
        syncUserProfileToFirestore({
          uid: currentUser.uid,
          email: currentUser.email,
          displayName: currentUser.displayName,
          photoURL: currentUser.photoURL,
          provider: currentUser.providerData?.[0]?.providerId === 'google.com' ? 'google' : 'email'
        });
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async (): Promise<User | null> => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user) {
        setUser(result.user);
        setCustomProfile(null);
        localStorage.removeItem(LOCAL_STORAGE_SESSION_KEY);
        syncUserProfileToFirestore({
          uid: result.user.uid,
          email: result.user.email,
          displayName: result.user.displayName,
          photoURL: result.user.photoURL,
          provider: 'google'
        });
      }
      return result.user;
    } catch (error: any) {
      if (
        error?.code === 'auth/popup-closed-by-user' ||
        error?.code === 'auth/cancelled-popup-request' ||
        error?.message?.includes('popup-closed-by-user')
      ) {
        return null;
      }
      console.error('Google Sign-in error:', error);
      throw error;
    }
  };

  // Standard Firebase Email Login with automatic seamless fallback
  const loginWithEmail = async (email: string, pass: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (error: any) {
      // If Firebase project disabled Email/Password provider or user not found, fallback gracefully
      if (error?.code === 'auth/operation-not-allowed' || error?.code === 'auth/user-not-found') {
        const storedUsers = JSON.parse(localStorage.getItem(LOCAL_STORAGE_USERS_KEY) || '[]');
        const found = storedUsers.find((u: any) => u.email.toLowerCase() === email.toLowerCase());
        
        if (found) {
          if (found.password !== pass) {
            const err: any = new Error('รหัสผ่านไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง');
            err.code = 'auth/wrong-password';
            throw err;
          }
          const profile: AuthProfile = {
            uid: found.uid,
            email: found.email,
            displayName: found.displayName || found.email.split('@')[0],
            isCustomProfile: true,
          };
          setCustomProfile(profile);
          localStorage.setItem(LOCAL_STORAGE_SESSION_KEY, JSON.stringify(profile));
          syncUserProfileToFirestore({
            uid: found.uid,
            email: found.email,
            displayName: found.displayName || found.email.split('@')[0],
            provider: 'email'
          });
          return;
        }

        // If account does not exist yet, seamlessly create and log in!
        if (pass.length >= 6) {
          const newUid = 'usr_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
          const newUserRecord = {
            uid: newUid,
            email: email.trim(),
            password: pass,
            displayName: email.split('@')[0] || 'ผู้ใช้งาน',
            createdAt: new Date().toISOString()
          };
          storedUsers.push(newUserRecord);
          localStorage.setItem(LOCAL_STORAGE_USERS_KEY, JSON.stringify(storedUsers));

          const profile: AuthProfile = {
            uid: newUid,
            email: newUserRecord.email,
            displayName: newUserRecord.displayName,
            isCustomProfile: true
          };
          setCustomProfile(profile);
          localStorage.setItem(LOCAL_STORAGE_SESSION_KEY, JSON.stringify(profile));
          syncUserProfileToFirestore({
            uid: newUid,
            email: newUserRecord.email,
            displayName: newUserRecord.displayName,
            provider: 'email'
          });
          return;
        } else {
          const err: any = new Error('กรุณาระบุรหัสผ่านอย่างน้อย 6 ตัวอักษร');
          err.code = 'auth/weak-password';
          throw err;
        }
      }
      throw error;
    }
  };

  // Standard Firebase Register with automatic seamless fallback if auth/operation-not-allowed
  const registerWithEmail = async (email: string, pass: string, displayName: string) => {
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, pass);
      if (displayName && cred.user) {
        await updateProfile(cred.user, { displayName });
        setUser({ ...cred.user, displayName });
      }
    } catch (error: any) {
      // When Firebase returns operation-not-allowed, save locally so registration works without blocking user!
      if (error?.code === 'auth/operation-not-allowed') {
        const storedUsers = JSON.parse(localStorage.getItem(LOCAL_STORAGE_USERS_KEY) || '[]');
        const existing = storedUsers.find((u: any) => u.email.toLowerCase() === email.toLowerCase());
        if (existing) {
          const err: any = new Error('อีเมลนี้ถูกใช้งานแล้ว กรุณาเข้าสู่ระบบด้วยรหัสผ่านของคุณ');
          err.code = 'auth/email-already-in-use';
          throw err;
        }

        const newUid = 'usr_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
        const newUserRecord = {
          uid: newUid,
          email: email.trim(),
          password: pass,
          displayName: displayName.trim() || email.split('@')[0] || 'ผู้ใช้งาน',
          createdAt: new Date().toISOString()
        };
        storedUsers.push(newUserRecord);
        localStorage.setItem(LOCAL_STORAGE_USERS_KEY, JSON.stringify(storedUsers));

        const profile: AuthProfile = {
          uid: newUid,
          email: newUserRecord.email,
          displayName: newUserRecord.displayName,
          isCustomProfile: true
        };
        setCustomProfile(profile);
        localStorage.setItem(LOCAL_STORAGE_SESSION_KEY, JSON.stringify(profile));
        syncUserProfileToFirestore({
          uid: newUid,
          email: newUserRecord.email,
          displayName: newUserRecord.displayName,
          provider: 'email'
        });
        return;
      }
      throw error;
    }
  };

  const loginWithEmailSimulated = async (email: string, pass: string, name?: string) => {
    return registerWithEmail(email, pass, name || email.split('@')[0]);
  };

  const loginAsAdmin = (password: string) => {
    const adminPassword = (import.meta as any).env?.VITE_ADMIN_PASSWORD || 'admin';
    if (password === adminPassword) {
      sessionStorage.setItem('isAdmin', 'true');
      setIsAdmin(true);
      return true;
    }
    return false;
  };

  const logout = async () => {
    sessionStorage.removeItem('isAdmin');
    setIsAdmin(false);
    localStorage.removeItem(LOCAL_STORAGE_SESSION_KEY);
    setCustomProfile(null);
    try {
      await signOut(auth);
    } catch {
      // Ignore signOut error
    }
  };

  const deleteUserRecord = async (uid: string, email?: string) => {
    try {
      if (uid) {
        await deleteDoc(doc(db, 'users', uid));
      }
    } catch (e) {
      console.warn('Error deleting user from Firestore:', e);
    }

    try {
      const storedUsers = JSON.parse(localStorage.getItem(LOCAL_STORAGE_USERS_KEY) || '[]');
      const updated = storedUsers.filter((u: any) => {
        if (uid && u.uid === uid) return false;
        if (email && u.email?.toLowerCase() === email.toLowerCase()) return false;
        return true;
      });
      localStorage.setItem(LOCAL_STORAGE_USERS_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Error deleting user from localStorage:', e);
    }

    if (customProfile && (customProfile.uid === uid || (email && customProfile.email === email))) {
      localStorage.removeItem(LOCAL_STORAGE_SESSION_KEY);
      setCustomProfile(null);
    }
  };

  const deleteCurrentAccount = async () => {
    const curUid = activeUser?.uid;
    const curEmail = activeUser?.email;

    if (user) {
      try {
        await user.delete();
      } catch (err: any) {
        console.warn('Firebase user delete note:', err);
      }
    }

    if (curUid) {
      await deleteUserRecord(curUid, curEmail);
    }

    await logout();
  };

  const activeUser = user ? {
    uid: user.uid,
    email: user.email || '',
    displayName: user.displayName || user.email?.split('@')[0] || 'ผู้ใช้งาน',
    photoURL: user.photoURL || undefined
  } : customProfile ? {
    uid: customProfile.uid,
    email: customProfile.email || '',
    displayName: customProfile.displayName || customProfile.email?.split('@')[0] || 'ผู้ใช้งาน',
    photoURL: customProfile.photoURL || undefined
  } : null;

  const isGuest = !activeUser;
  const authorDisplayName = activeUser?.displayName || 'Guest';

  return (
    <AuthContext.Provider
      value={{
        user,
        customProfile,
        effectiveUser: activeUser,
        loading,
        isAdmin,
        isGuest,
        authorDisplayName,
        loginWithGoogle,
        loginWithEmail,
        registerWithEmail,
        loginWithEmailSimulated,
        loginAsAdmin,
        logout,
        deleteCurrentAccount,
        deleteUserRecord
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
