import { useState } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Mail, Lock, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useGoogleLogin } from '@react-oauth/google';
import { useAuth } from '@/hooks/useAuth';

const Auth = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const { toast } = useToast();
  const { updateAccessToken } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast({
        title: "Welcome back!",
        description: "Successfully logged in.",
      });
    } catch (error: any) {
      toast({
        title: "Login Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "Passwords do not match.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      await createUserWithEmailAndPassword(auth, email, password);
      toast({
        title: "Account Created!",
        description: "Your account has been created successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Signup Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = useGoogleLogin({
    scope: 'openid email profile https://www.googleapis.com/auth/gmail.send',
    flow: 'auth-code',
    onSuccess: async (codeResponse) => {
      setLoading(true);
      try {
        // Send authorization code to backend to get tokens
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/callback`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            code: codeResponse.code
          })
        });

        if (!response.ok) {
          throw new Error('Failed to exchange authorization code for tokens');
        }

        const tokenData = await response.json();
        
        // Sign in to Firebase with Google for user management
        const provider = new GoogleAuthProvider();
        
        try {
          // Use popup for Firebase authentication
          const result = await signInWithPopup(auth, provider);
          const user = result.user;

          // Store both access token and refresh token in Firestore
          await updateAccessToken(tokenData.access_token, tokenData.refresh_token, user.uid);
          
          toast({
            title: "Welcome!",
            description: "Successfully logged in with Google and Gmail access granted.",
          });
          
        } catch (popupError: any) {
          // If popup is blocked, show user-friendly message
          if (popupError.code === 'auth/popup-blocked' || popupError.code === 'auth/popup-closed-by-user') {
            toast({
              title: "Popup Blocked",
              description: "Please allow popups for this website and try again. Check your browser's popup blocker settings.",
              variant: "destructive"
            });
          } else {
            throw popupError;
          }
        }
        
      } catch (error: any) {
        console.error('Google login error:', error);
        toast({
          title: "Google Login Failed",
          description: error.message || "Failed to authenticate with Google.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    },
    onError: (error) => {
      console.error('Google OAuth error:', error);
      toast({
        title: "Google Login Failed",
        description: "Failed to authenticate with Google. Please try again.",
        variant: "destructive"
      });
      setLoading(false);
    }
  });

  return (
    <div className="min-h-screen bg-background flex items-center justify-center py-12 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Professor Connect</CardTitle>
          <p className="text-muted-foreground">Connect with professors using AI</p>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login" className="space-y-4">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Logging in...
                    </>
                  ) : (
                    'Login'
                  )}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup" className="space-y-4">
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="Create a password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="confirm-password"
                      type="password"
                      placeholder="Confirm your password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    'Create Account'
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
          
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
              </div>
            </div>
            
            <Button 
              onClick={() => handleGoogleLogin()} 
              variant="outline" 
              className="w-full mt-4" 
              disabled={loading}
            >
              <User className="mr-2 h-4 w-4" />
              Google
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;