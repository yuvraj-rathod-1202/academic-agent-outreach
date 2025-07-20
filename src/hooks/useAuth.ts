import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

interface ExtendedUser extends User {
  accessToken?: string;
}

interface TokenData {
  access_token: string;
  refresh_token: string;
  expires_at: number;
}

export const useAuth = () => {
  const [user, setUser] = useState<ExtendedUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Try to get stored access token from Firestore
        try {
          const tokenDoc = await getDoc(doc(db, 'userTokens', user.uid));
          let accessToken: string | undefined;
          
          if (tokenDoc.exists()) {
            const tokenData = tokenDoc.data() as TokenData;
            
            // Check if token is expired
            if (Date.now() >= tokenData.expires_at) {
              // Token expired, try to refresh
              const refreshedToken = await refreshAccessToken(user.uid, tokenData.refresh_token);
              accessToken = refreshedToken;
            } else {
              accessToken = tokenData.access_token;
            }
          }
          
          setUser({
            ...user,
            accessToken: accessToken
          } as ExtendedUser);
        } catch (error) {
          console.error('Error fetching user tokens:', error);
          setUser({
            ...user,
            accessToken: undefined
          } as ExtendedUser);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const updateAccessToken = async (accessToken: string, refreshToken: string, userId: string) => {
    try {
      // Calculate expiry time (tokens typically expire in 1 hour)
      const expiresAt = Date.now() + (60 * 60 * 1000); // 1 hour from now
      
      // Store in Firestore
      await setDoc(doc(db, 'userTokens', userId), {
        access_token: accessToken,
        refresh_token: refreshToken,
        expires_at: expiresAt,
        updated_at: Date.now()
      });

      // Update local state
      if (user && user.uid === userId) {
        setUser(prev => prev ? { ...prev, accessToken } : null);
      }
    } catch (error) {
      console.error('Error storing tokens:', error);
      throw error;
    }
  };

  const refreshAccessToken = async (userId: string, refreshToken: string): Promise<string> => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refresh_token: refreshToken
        })
      });

      if (!response.ok) {
        throw new Error('Failed to refresh access token');
      }

      const tokenData = await response.json();
      
      // Update stored tokens
      await updateAccessToken(tokenData.access_token, refreshToken, userId);
      
      return tokenData.access_token;
    } catch (error) {
      console.error('Error refreshing access token:', error);
      throw error;
    }
  };

  const clearAccessToken = async () => {
    if (user) {
      try {
        // Remove from Firestore
        await setDoc(doc(db, 'userTokens', user.uid), {
          access_token: '',
          refresh_token: '',
          expires_at: 0,
          updated_at: Date.now()
        });
        
        // Clear local state
        setUser(prev => prev ? { ...prev, accessToken: undefined } : null);
      } catch (error) {
        console.error('Error clearing tokens:', error);
      }
    }
  };

  const getValidAccessToken = async (): Promise<string | null> => {
    if (!user) return null;
    
    try {
      const tokenDoc = await getDoc(doc(db, 'userTokens', user.uid));
      
      if (!tokenDoc.exists()) {
        return null;
      }
      
      const tokenData = tokenDoc.data() as TokenData;
      
      // Check if token is expired
      if (Date.now() >= tokenData.expires_at) {
        // Token expired, try to refresh
        const refreshedToken = await refreshAccessToken(user.uid, tokenData.refresh_token);
        return refreshedToken;
      }
      
      return tokenData.access_token;
    } catch (error) {
      console.error('Error getting valid access token:', error);
      return null;
    }
  };

  return { 
    user, 
    loading, 
    updateAccessToken, 
    clearAccessToken, 
    refreshAccessToken,
    getValidAccessToken 
  };
};