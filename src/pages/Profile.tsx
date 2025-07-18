import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { signOut } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Mail, Calendar, Clock, User, LogOut, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface EmailRecord {
  id: string;
  professorName: string;
  professorEmail: string;
  subject: string;
  status: 'sent' | 'scheduled' | 'delivered' | 'failed';
  sentAt: Date;
  researchInterest: string;
}

const Profile = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [emails, setEmails] = useState<EmailRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'emails'),
      where('userId', '==', user.uid),
      orderBy('sentAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const emailsData: EmailRecord[] = [];
      querySnapshot.forEach((doc) => {
        emailsData.push({
          id: doc.id,
          ...doc.data(),
          sentAt: doc.data().sentAt.toDate()
        } as EmailRecord);
      });
      setEmails(emailsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
      navigate('/');
    } catch (error: any) {
      toast({
        title: "Logout Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent': return 'bg-blue-100 text-blue-800';
      case 'scheduled': return 'bg-yellow-100 text-yellow-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Button variant="ghost" onClick={() => navigate('/')} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>

        {/* User Info Card */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={user.photoURL || ''} />
                <AvatarFallback>
                  <User className="h-8 w-8" />
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-2xl font-bold">{user.displayName || 'User'}</h1>
                <p className="text-muted-foreground">{user.email}</p>
              </div>
            </CardTitle>
          </CardHeader>
        </Card>

        {/* Email History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Email History ({emails.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Loading email history...</p>
              </div>
            ) : emails.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No emails sent yet.</p>
                <Button 
                  className="mt-4" 
                  onClick={() => navigate('/')}
                >
                  Send Your First Email
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {emails.map((email, index) => (
                  <div key={email.id}>
                    <div className="flex items-start justify-between">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{email.professorName}</h3>
                          <Badge 
                            variant="secondary" 
                            className={getStatusColor(email.status)}
                          >
                            {email.status}
                          </Badge>
                        </div>
                        
                        <p className="text-sm text-muted-foreground">
                          To: {email.professorEmail}
                        </p>
                        
                        <p className="text-sm font-medium">{email.subject}</p>
                        
                        <p className="text-sm text-muted-foreground">
                          Research: {email.researchInterest}
                        </p>
                        
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {email.sentAt.toLocaleDateString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {email.sentAt.toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {index < emails.length - 1 && <Separator className="mt-4" />}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Profile;