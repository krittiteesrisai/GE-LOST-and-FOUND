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
  User 
} from '../lib/firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  isGuest: boolean;
  authorDisplayName: string;
  loginWithGoogle: () => Promise<void>;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  registerWithEmail: (email: string, pass: string, displayName: string) => Promise<void>;
  loginAsAdmin: (password: string) => boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    return sessionStorage.getItem('isAdmin') === 'true';
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      console.error('Google Sign-in error:', error);
      throw error;
    }
  };

  const loginWithEmail = async (email: string, pass: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (error: any) {
      console.error('Email Sign-in error:', error);
      throw error;
    }
  };

  const registerWithEmail = async (email: string, pass: string, displayName: string) => {
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, pass);
      if (displayName && cred.user) {
        await updateProfile(cred.user, { displayName });
        // Force refresh user state with updated profile
        setUser({ ...cred.user, displayName });
      }
    } catch (error: any) {
      console.error('Register error:', error);
      throw error;
    }
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
    await signOut(auth);
  };

  const isGuest = !user;
  const authorDisplayName = user?.displayName || user?.email?.split('@')[0] || 'Guest';

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAdmin,
        isGuest,
        authorDisplayName,
        loginWithGoogle,
        loginWithEmail,
        registerWithEmail,
        loginAsAdmin,
        logout
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
