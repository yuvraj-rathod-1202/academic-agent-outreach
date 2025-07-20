import { useState } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

const GmailAuth = () => {
  const [isConnecting, setIsConnecting] = useState(false);
  const { toast } = useToast();
  const { user, updateAccessToken } = useAuth();

  const handleGmailConnect = useGoogleLogin({
    scope: 'https://www.googleapis.com/auth/gmail.send',
    onSuccess: async (tokenResponse) => {
      setIsConnecting(false);
      updateAccessToken(tokenResponse.access_token);
      
      toast({
        title: "Gmail Connected",
        description: "Successfully connected to Gmail. You can now send emails.",
      });
    },
    onError: (error) => {
      setIsConnecting(false);
      console.error('Gmail auth error:', error);
      toast({
        title: "Connection Failed",
        description: "Failed to connect to Gmail. Please try again.",
        variant: "destructive"
      });
    }
  });

  const handleConnect = () => {
    setIsConnecting(true);
    handleGmailConnect();
  };

  const hasGmailAccess = user?.accessToken;

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Gmail Connection
        </CardTitle>
      </CardHeader>
      <CardContent>
        {hasGmailAccess ? (
          <div className="flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <div>
              <p className="font-medium text-green-800">Gmail Connected</p>
              <p className="text-sm text-muted-foreground">
                You can send and resend emails through your Gmail account.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600" />
              <div>
                <p className="font-medium text-amber-800">Gmail Not Connected</p>
                <p className="text-sm text-muted-foreground">
                  Connect your Gmail account to send emails and reminders.
                </p>
              </div>
            </div>
            <Button 
              onClick={handleConnect} 
              disabled={isConnecting}
              className="w-full sm:w-auto"
            >
              {isConnecting ? (
                <>
                  <Mail className="mr-2 h-4 w-4 animate-pulse" />
                  Connecting...
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  Connect Gmail
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default GmailAuth;
