'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  updateProfile,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/config';
import { User, Company, LoginCredentials, SignupCredentials, UserRole } from '@/types/auth';
import toast from 'react-hot-toast';

interface AuthContextType {
  user: User | null;
  company: Company | null;
  loading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  signup: (credentials: SignupCredentials) => Promise<void>;
  loginWithGoogle: (rememberMe?: boolean) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateUserProfile: (data: Partial<User>) => Promise<void>;
  hasRole: (role: UserRole) => boolean;
  hasAnyRole: (roles: UserRole[]) => boolean;
  isAdmin: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch user data from Firestore
  const fetchUserData = async (firebaseUser: FirebaseUser): Promise<User | null> => {
    try {
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
      
      if (!userDoc.exists()) {
        // Create new user document if it doesn't exist
        const newUser: User = {
          uid: firebaseUser.uid,
          email: firebaseUser.email!,
          fullName: firebaseUser.displayName || '',
          roles: ['developer'], // Default role - temporarily set to developer for testing
          imageUrl: firebaseUser.photoURL || undefined,
          emailVerified: firebaseUser.emailVerified,
          createdAt: new Date(),
          updatedAt: new Date(),
          isActive: true
        };
        
        await setDoc(doc(db, 'users', firebaseUser.uid), {
          ...newUser,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        
        return newUser;
      }
      
      const userData = userDoc.data() as User;
      
      // Fetch company data if user has companyId
      if (userData.companyId) {
        const companyDoc = await getDoc(doc(db, 'companies', userData.companyId));
        if (companyDoc.exists()) {
          setCompany(companyDoc.data() as Company);
        }
      }
      
      // Update last login
      await updateDoc(doc(db, 'users', firebaseUser.uid), {
        lastLoginAt: serverTimestamp()
      });
      
      return userData;
    } catch (error) {
      console.error('Error fetching user data:', error);
      return null;
    }
  };

  // Login with email and password
  const login = async ({ email, password, rememberMe = false }: LoginCredentials) => {
    try {
      setLoading(true);
      
      // Set persistence based on remember me
      await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);
      
      const result = await signInWithEmailAndPassword(auth, email, password);
      const userData = await fetchUserData(result.user);
      
      if (userData) {
        setUser(userData);
        toast.success('Logged in successfully!');
      }
    } catch (error: unknown) {
      console.error('Login error:', error);
      const message = error instanceof Error ? error.message : 'Failed to login';
      toast.error(message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Signup with email and password
  const signup = async ({ email, password, fullName, phoneNumber }: SignupCredentials) => {
    try {
      setLoading(true);
      
      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update display name
      await updateProfile(result.user, { displayName: fullName });
      
      // Create user document
      const newUser: User = {
        uid: result.user.uid,
        email,
        fullName,
        roles: ['client'], // Default role, admin will change later
        phoneNumber,
        emailVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true
      };
      
      await setDoc(doc(db, 'users', result.user.uid), {
        ...newUser,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      setUser(newUser);
      toast.success('Account created successfully! Please wait for admin approval.');
    } catch (error: unknown) {
      console.error('Signup error:', error);
      const message = error instanceof Error ? error.message : 'Failed to create account';
      toast.error(message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Login with Google
  const loginWithGoogle = async (rememberMe = false) => {
    try {
      setLoading(true);
      
      // Set persistence
      await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);
      
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      const userData = await fetchUserData(result.user);
      
      if (userData) {
        setUser(userData);
        toast.success('Logged in with Google successfully!');
      }
    } catch (error: unknown) {
      console.error('Google login error:', error);
      const message = error instanceof Error ? error.message : 'Failed to login with Google';
      toast.error(message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Logout
  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setCompany(null);
      toast.success('Logged out successfully');
    } catch (error: unknown) {
      console.error('Logout error:', error);
      toast.error('Failed to logout');
      throw error;
    }
  };

  // Reset password
  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
      toast.success('Password reset email sent!');
    } catch (error: unknown) {
      console.error('Password reset error:', error);
      const message = error instanceof Error ? error.message : 'Failed to send reset email';
      toast.error(message);
      throw error;
    }
  };

  // Update user profile
  const updateUserProfile = async (data: Partial<User>) => {
    if (!user) throw new Error('No user logged in');
    
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        ...data,
        updatedAt: serverTimestamp()
      });
      
      setUser({ ...user, ...data });
      toast.success('Profile updated successfully');
    } catch (error: unknown) {
      console.error('Profile update error:', error);
      toast.error('Failed to update profile');
      throw error;
    }
  };

  // Role checking helpers
  const hasRole = (role: UserRole): boolean => {
    return user?.roles?.includes(role) || false;
  };

  const hasAnyRole = (roles: UserRole[]): boolean => {
    return roles.some(role => hasRole(role));
  };

  const isAdmin = (): boolean => {
    return hasRole('admin');
  };

  // Listen to auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userData = await fetchUserData(firebaseUser);
        setUser(userData);
      } else {
        setUser(null);
        setCompany(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    user,
    company,
    loading,
    login,
    signup,
    loginWithGoogle,
    logout,
    resetPassword,
    updateUserProfile,
    hasRole,
    hasAnyRole,
    isAdmin
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
