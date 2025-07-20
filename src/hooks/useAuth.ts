import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

interface ExtendedUser extends User {
  accessToken?: string;
}

export const useAuth = () => {
  const [user, setUser] = useState<ExtendedUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // Try to get stored access token from localStorage
        const storedToken = localStorage.getItem(`accessToken_${user.uid}`);
        setUser({
          ...user,
          accessToken: storedToken || undefined
        } as ExtendedUser);
      } else {
        setUser(null);
        // Clear any stored tokens when user logs out
        localStorage.removeItem('accessToken');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const updateAccessToken = (token: string) => {
    if (user) {
      localStorage.setItem(`accessToken_${user.uid}`, token);
      setUser(prev => prev ? { ...prev, accessToken: token } : null);
    }
  };

  const clearAccessToken = () => {
    if (user) {
      localStorage.removeItem(`accessToken_${user.uid}`);
      setUser(prev => prev ? { ...prev, accessToken: undefined } : null);
    }
  };

  return { user, loading, updateAccessToken, clearAccessToken };
};