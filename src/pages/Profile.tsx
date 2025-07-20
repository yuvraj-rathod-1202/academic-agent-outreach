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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Mail, Calendar, Clock, User, LogOut, ArrowLeft, Send, RotateCcw, Edit, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { sendReminderEmail, sendAutomaticEmail, scheduleEmail, EmailData } from '@/services/emailService';
import ScheduleDialog from '@/components/ScheduleDialog';

interface EmailRecord {
  id: string;
  professorName: string;
  professorEmail: string;
  userEmail: string;
  subject: string;
  body: string;
  status: 'sent' | 'scheduled' | 'delivered' | 'failed';
  sentAt: Date;
  scheduledAt?: Date;
  researchInterest: string;
  userId: string;
}

const Profile = () => {
  const { user, getValidAccessToken } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [emails, setEmails] = useState<EmailRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingReminder, setSendingReminder] = useState<string | null>(null);
  const [resendingEmail, setResendingEmail] = useState<string | null>(null);
  const [editingEmail, setEditingEmail] = useState<EmailRecord | null>(null);
  const [editDraft, setEditDraft] = useState<{ subject: string; body: string; to: string }>({ subject: '', body: '', to: '' });
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [scheduleEmailData, setScheduleEmailData] = useState<EmailRecord | null>(null);

  const handleSendReminder = async (email: EmailRecord) => {
    if (!user) return;
    
    if (!user.accessToken) {
      toast({
        title: "Gmail Not Connected",
        description: "Please connect your Gmail account first to send reminder emails.",
        variant: "destructive"
      });
      return;
    }
    
    setSendingReminder(email.id);
    
    try {
      // Get a valid access token
      const accessToken = await getValidAccessToken();
      if (!accessToken) {
        toast({
          title: "Authentication Required",
          description: "Please connect your Gmail account first.",
          variant: "destructive"
        });
        return;
      }

      const reminderEmailData: EmailData = {
        userId: user.uid,
        professorName: email.professorName,
        professorEmail: email.professorEmail,
        userEmail: user.email || email.userEmail,
        subject: email.subject,
        body: email.body,
        researchInterest: email.researchInterest,
        status: 'sent'
      };

      await sendReminderEmail(reminderEmailData, accessToken);
      
      toast({
        title: "Reminder Sent",
        description: `Reminder email sent to ${email.professorName}`,
      });
    } catch (error: any) {
      toast({
        title: "Failed to Send Reminder",
        description: error.message || "An error occurred while sending the reminder email.",
        variant: "destructive"
      });
    } finally {
      setSendingReminder(null);
    }
  };

  const handleResendEmail = async (email: EmailRecord) => {
    if (!user) return;
    
    // Get a valid access token
    const accessToken = await getValidAccessToken();
    if (!accessToken) {
      toast({
        title: "Authentication Required",
        description: "Please connect your Gmail account first to resend emails.",
        variant: "destructive"
      });
      return;
    }
    
    setResendingEmail(email.id);
    
    try {
      const resendEmailData: EmailData = {
        userId: user.uid,
        professorName: email.professorName,
        professorEmail: email.professorEmail,
        userEmail: user.email || email.userEmail,
        subject: email.subject,
        body: email.body,
        researchInterest: email.researchInterest,
        status: 'sent',
        to: email.professorEmail
      };

      await sendAutomaticEmail(resendEmailData, accessToken);
      
      toast({
        title: "Email Resent",
        description: `Email resent successfully to ${email.professorName}`,
      });
    } catch (error: any) {
      toast({
        title: "Failed to Resend Email",
        description: error.message || "An error occurred while resending the email.",
        variant: "destructive"
      });
    } finally {
      setResendingEmail(null);
    }
  };

  const handleEditAndResend = (email: EmailRecord) => {
    setEditingEmail(email);
    setEditDraft({
      subject: email.subject,
      body: email.body,
      to: email.professorEmail
    });
  };

  const handleSaveAndResend = async () => {
    if (!editingEmail || !user) return;
    
    // Get a valid access token
    const accessToken = await getValidAccessToken();
    if (!accessToken) {
      toast({
        title: "Authentication Required",
        description: "Please connect your Gmail account first to send emails.",
        variant: "destructive"
      });
      return;
    }
    
    setResendingEmail(editingEmail.id);
    
    try {
      const updatedEmailData: EmailData = {
        userId: user.uid,
        professorName: editingEmail.professorName,
        professorEmail: editingEmail.professorEmail,
        userEmail: user.email || editingEmail.userEmail,
        subject: editDraft.subject,
        body: editDraft.body,
        researchInterest: editingEmail.researchInterest,
        status: 'sent',
        to: editDraft.to
      };

      await sendAutomaticEmail(updatedEmailData, accessToken);
      
      toast({
        title: "Email Sent",
        description: `Updated email sent successfully to ${editingEmail.professorName}`,
      });
      
      setEditingEmail(null);
    } catch (error: any) {
      toast({
        title: "Failed to Send Email",
        description: error.message || "An error occurred while sending the email.",
        variant: "destructive"
      });
    } finally {
      setResendingEmail(null);
    }
  };

  const handleScheduleResend = (email: EmailRecord) => {
    setScheduleEmailData(email);
    setShowScheduleDialog(true);
  };

  const handleScheduleEmail = async (scheduledDate: Date) => {
    if (!scheduleEmailData || !user) return;
    
    setResendingEmail(scheduleEmailData.id);
    setShowScheduleDialog(false);
    
    try {
      const emailData = {
        userId: user.uid,
        professorName: scheduleEmailData.professorName,
        professorEmail: scheduleEmailData.professorEmail,
        userEmail: user.email || scheduleEmailData.userEmail,
        subject: scheduleEmailData.subject,
        body: scheduleEmailData.body,
        researchInterest: scheduleEmailData.researchInterest,
        status: 'scheduled' as const,
        to: scheduleEmailData.professorEmail,
        scheduledAt: scheduledDate
      };

      await scheduleEmail(emailData, scheduledDate);
      
      toast({
        title: "Email Scheduled",
        description: `Email scheduled for ${scheduledDate.toLocaleString()}`,
      });
    } catch (error: any) {
      toast({
        title: "Failed to Schedule Email",
        description: error.message || "An error occurred while scheduling the email.",
        variant: "destructive"
      });
    } finally {
      setResendingEmail(null);
      setScheduleEmailData(null);
    }
  };

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
        const data = doc.data();
        emailsData.push({
          id: doc.id,
          ...data,
          sentAt: data.sentAt?.toDate?.() || null,  // safely handle null/undefined
          scheduledAt: data.scheduledAt?.toDate?.() || null, // safely handle null/undefined
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
                {user?.accessToken && (
                  <div className="flex items-center gap-2 mt-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-green-600 font-medium">Gmail Connected</span>
                  </div>
                )}
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
                          {email.status === 'scheduled' && email.scheduledAt ? (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Scheduled: {email.scheduledAt
                                ? email.scheduledAt.toLocaleDateString() + ' ' + email.scheduledAt.toLocaleTimeString()
                                : 'Not Scheduled'}
                            </span>
                          ) : email.sentAt ? (
                            <>
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {email.sentAt.toLocaleDateString()}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {email.sentAt.toLocaleTimeString()}
                              </span>
                            </>
                          ) : (
                            <span className="text-muted-foreground">Date not available</span>
                          )}
                        </div>
                      </div>
                      
                      {/* Reminder button for sent emails */}
                      {email.status === 'sent' && (
                        <div className="ml-4">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSendReminder(email)}
                            disabled={sendingReminder === email.id}
                            className="text-xs"
                          >
                            <Send className="h-3 w-3 mr-1" />
                            {sendingReminder === email.id ? 'Sending...' : 'Send Reminder'}
                          </Button>
                        </div>
                      )}

                      {/* Resend buttons for failed emails */}
                      {email.status === 'failed' && (
                        <div className="ml-4 flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleResendEmail(email)}
                            disabled={resendingEmail === email.id}
                            className="text-xs"
                          >
                            <RotateCcw className="h-3 w-3 mr-1" />
                            {resendingEmail === email.id ? 'Sending...' : 'Resend'}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditAndResend(email)}
                            disabled={resendingEmail === email.id}
                            className="text-xs"
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            Edit & Resend
                          </Button>
                        </div>
                      )}
                    </div>
                    
                    {index < emails.length - 1 && <Separator className="mt-4" />}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit Email Dialog */}
        <Dialog open={!!editingEmail} onOpenChange={() => setEditingEmail(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit and Resend Email</DialogTitle>
            </DialogHeader>
            
            {editingEmail && (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">To:</label>
                  <Input
                    value={editDraft.to}
                    onChange={(e) => setEditDraft(prev => ({ ...prev, to: e.target.value }))}
                    className="mt-1"
                    placeholder="Professor's email address"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium">Subject:</label>
                  <Input
                    value={editDraft.subject}
                    onChange={(e) => setEditDraft(prev => ({ ...prev, subject: e.target.value }))}
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium">Message:</label>
                  <Textarea
                    value={editDraft.body}
                    onChange={(e) => setEditDraft(prev => ({ ...prev, body: e.target.value }))}
                    className="mt-1 min-h-[300px]"
                  />
                </div>
              </div>
            )}
            
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setEditingEmail(null)}
                disabled={resendingEmail === editingEmail?.id}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveAndResend}
                disabled={resendingEmail === editingEmail?.id || !editDraft.subject.trim() || !editDraft.body.trim() || !editDraft.to.trim()}
              >
                {resendingEmail === editingEmail?.id ? (
                  <>
                    <Send className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Send Email
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Schedule Dialog */}
      <ScheduleDialog
        open={showScheduleDialog}
        onOpenChange={setShowScheduleDialog}
        onSchedule={handleScheduleEmail}
      />
    </div>
  );
};

export default Profile;