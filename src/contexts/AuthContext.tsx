import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  auth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as firebaseSignOut, 
  onAuthStateChanged,
  signInAnonymously,
  syncUserProfileToFirestore,
  fetchUserProfileFromFirestore,
  User,
  FirestoreUserProfile
} from '../lib/firebase';
import { updateStoredProfile, UserProfile } from '../lib/userSettings';

interface AuthContextType {
  currentUser: User | null;
  userProfile: FirestoreUserProfile | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  register: (email: string, pass: string, profileData: Partial<FirestoreUserProfile>) => Promise<{ success: boolean; error?: string }>;
  loginAsGuestDemo: (role?: 'citizen' | 'dispatcher' | 'responder' | 'admin') => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<FirestoreUserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!isMounted) return;
      setCurrentUser(user);

      if (user) {
        try {
          // Fetch or hydrate user profile from Firestore
          const profile = await fetchUserProfileFromFirestore(user.uid);
          if (profile && isMounted) {
            setUserProfile(profile);
            // Sync with local state safely
            updateStoredProfile({
              fullName: profile.fullName || user.displayName || 'Barry Allen',
              displayName: profile.displayName || user.displayName || 'Barry',
              email: profile.email || user.email || '',
              bloodType: profile.bloodType || 'O+',
              birthdate: profile.birthdate || '1992-04-12',
              heightCm: profile.heightCm || 180,
              weightKg: profile.weightKg || 75
            });
          }
        } catch (err) {
          console.warn('[AuthContext] Firestore profile fetch notice:', err);
        }
      } else {
        if (isMounted) setUserProfile(null);
      }

      if (isMounted) setLoading(false);
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const login = async (email: string, pass: string) => {
    try {
      const cred = await signInWithEmailAndPassword(auth, email.trim(), pass);
      const profile = await fetchUserProfileFromFirestore(cred.user.uid);
      if (profile) setUserProfile(profile);
      return { success: true };
    } catch (err: any) {
      console.warn('[Firebase Auth] Login error:', err.code, err.message);
      let errorMsg = 'Failed to sign in. Please verify your credentials.';
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        errorMsg = 'Invalid email or password.';
      } else if (err.code === 'auth/operation-not-allowed') {
        errorMsg = 'Email/Password sign-in is not enabled in Firebase console yet. Try demo mode or enable it in console.';
      }
      return { success: false, error: errorMsg };
    }
  };

  const register = async (email: string, pass: string, profileData: Partial<FirestoreUserProfile>) => {
    try {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), pass);
      const newProfile: FirestoreUserProfile = {
        uid: cred.user.uid,
        email: email.trim(),
        fullName: profileData.fullName || 'Registered Citizen',
        displayName: profileData.displayName || profileData.fullName?.split(' ')[0] || 'Citizen',
        bloodType: profileData.bloodType || 'O+',
        birthdate: profileData.birthdate || '1995-01-01',
        heightCm: profileData.heightCm || 175,
        weightKg: profileData.weightKg || 70,
        allergies: profileData.allergies || [],
        emergencyContact: profileData.emergencyContact,
        role: profileData.role || 'citizen'
      };

      await syncUserProfileToFirestore(newProfile);
      setUserProfile(newProfile);
      return { success: true };
    } catch (err: any) {
      console.warn('[Firebase Auth] Register error:', err.code, err.message);
      let errorMsg = 'Registration failed. Please try again.';
      if (err.code === 'auth/email-already-in-use') {
        errorMsg = 'This email address is already in use.';
      } else if (err.code === 'auth/weak-password') {
        errorMsg = 'Password should be at least 6 characters.';
      } else if (err.code === 'auth/operation-not-allowed') {
        errorMsg = 'Email/Password provider is not enabled in Firebase Console. Enable it in Auth > Sign-in method.';
      }
      return { success: false, error: errorMsg };
    }
  };

  const loginAsGuestDemo = async (role: 'citizen' | 'dispatcher' | 'responder' | 'admin' = 'citizen') => {
    try {
      let uid = 'demo-guest-' + Date.now();
      try {
        const cred = await signInAnonymously(auth);
        uid = cred.user.uid;
      } catch {
        // Fallback if anonymous auth is not enabled in console
      }

      const demoProfile: FirestoreUserProfile = {
        uid,
        email: 'demo.user@serds.app',
        fullName: role === 'citizen' ? 'Barry Allen' : role === 'dispatcher' ? 'Dispatcher Unit' : 'Responder Squad',
        displayName: role === 'citizen' ? 'Barry' : 'Operator',
        bloodType: 'O+',
        birthdate: '1992-04-12',
        role
      };
      setUserProfile(demoProfile);
      return { success: true };
    } catch (err: any) {
      return { success: true }; // Allow immediate offline/demo access
    }
  };

  const logout = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (err) {
      console.warn('[Firebase Auth] Sign out error:', err);
    }
    setCurrentUser(null);
    setUserProfile(null);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        loading,
        login,
        register,
        loginAsGuestDemo,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
