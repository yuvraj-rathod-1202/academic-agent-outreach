import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, Mail, Send, User, BookOpen } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { saveEmailToFirestore, sendAutomaticEmail } from "@/services/emailService";
import axios from "axios";
import { useGoogleLogin } from "@react-oauth/google";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

interface Professor {
  id: string;
  name: string;
  department: string;
  research_areas: string[];
  email: string;
  additional_data: string[];
}

interface EmailDraft {
  subject: string;
  body: string;
  to?: string;
}

type Step = 'input' | 'selection' | 'email' | 'sent';

const ProfessorConnect = () => {
  const [step, setStep] = useState<Step>('input');
  const [researchInterest, setResearchInterest] = useState('');
  const [professors, setProfessors] = useState<Professor[]>([]);
  const [selectedProfessor, setSelectedProfessor] = useState<Professor | null>(null);
  const [emailDraft, setEmailDraft] = useState<EmailDraft>({ subject: '', body: '' });
  const [loading, setLoading] = useState(false);
  const [emailGenerationLoading, setEmailGenerationLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleResearchSubmit = async () => {
    if (!researchInterest.trim()) return;
    
    setLoading(true);
    try {
      // Call the scraping API to get matching professors
      const response = await axios.post(`${API_BASE_URL}/api/scraping`, {
        prompt: researchInterest.trim()
      });
      
      // Transform API response to match our Professor interface
      const professorsData: Professor[] = response.data.map((prof: any, index: number) => ({
        id: prof.id || `prof_${index}`,
        name: prof.name || 'Unknown Professor',
        department: prof.department || 'Unknown Department',
        research_areas: Array.isArray(prof.research_areas) ? prof.research_areas : [prof.research_areas || 'General Research'],
        email: prof.email || '',
        additional_data: prof.additional_data || [""]
      }));
      
      setProfessors(professorsData);
      setStep('selection');
      
      toast({
        title: "Success",
        description: `Found ${professorsData.length} matching professors`,
      });
    } catch (error: any) {
      console.error('API Error:', error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to find matching professors. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleProfessorSelect = async (professor: Professor) => {
    setSelectedProfessor(professor);
    setEmailGenerationLoading(true);
    
    try {
      // Prepare user data
      const userData = {
        name: user?.displayName || '',
        email: user?.email || '',
        // Add any additional user data you want to send
      };
      
      // Call the email drafting API
      const response = await axios.post(`${API_BASE_URL}/api/email`, {
        name: professor.name,
        email: professor.email,
        user_prompt: researchInterest,
        user_data:`name:${userData.name}`,
        data: Object.values(professor.additional_data).map(item => String(item))
      });
      
      // Extract email draft from API response
      const emailDraft: EmailDraft = {
        subject: response.data.subject || `Research Collaboration Opportunity - ${researchInterest}`,
        body: response.data.body || response.data.message || '',
        to: response.data.to || professor.email
      };
      
      setEmailDraft(emailDraft);
      setStep('email');
      
      toast({
        title: "Email Draft Generated",
        description: "Your email has been personalized for the selected professor",
      });
    } catch (error: any) {
      console.error('Email draft API Error:', error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to generate email draft. Please try again.",
        variant: "destructive"
      });
    } finally {
      setEmailGenerationLoading(false);
    }
  };

  const loginAndSendEmail = useGoogleLogin({
    scope: 'https://www.googleapis.com/auth/gmail.send',
    onSuccess: async (tokenResponse) => {
      const accessToken = tokenResponse.access_token;

      try {
        await sendAutomaticEmail({
          userId: user.uid,
          professorName: selectedProfessor.name,
          professorEmail: selectedProfessor.email,
          userEmail: user.email || '',
          subject: emailDraft.subject,
          body: emailDraft.body,
          researchInterest,
          status: 'sent',
          to: emailDraft.to
        }, accessToken);

        setStep('sent');
        toast({
          title: "Email Sent Successfully!",
          description: "Your email has been scheduled and saved for reference.",
        });
      } catch (err) {
        console.error('Email sending failed:', err);

        try {
          await saveEmailToFirestore({
            userId: user.uid,
            professorName: selectedProfessor.name,
            professorEmail: selectedProfessor.email,
            userEmail: user.email || '',
            subject: emailDraft.subject,
            body: emailDraft.body,
            researchInterest,
            status: 'failed'
          });
        } catch (saveErr) {
          console.error('Firestore saving failed:', saveErr);
        }

        toast({
          title: "Email Saved",
          description: "Email saved but sending failed. Check your profile.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    },
    onError: (error) => {
      console.error('Login failed:', error);
      toast({
        title: "Authentication Failed",
        description: "Could not authorize Gmail access.",
        variant: "destructive"
      });
      setLoading(false);
    },
  });

  const handleSendEmail = async () => {
    if (!user || !selectedProfessor) return;
    setLoading(true);

    // start login flow which leads to sending email
    loginAndSendEmail(); // This invokes the hook's callback
  };

  const resetFlow = () => {
    setStep('input');
    setResearchInterest('');
    setProfessors([]);
    setSelectedProfessor(null);
    setEmailDraft({ subject: '', body: '' });
    setEmailGenerationLoading(false);
  };

  if (step === 'input') {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-6 w-6" />
            Tell us about your research interest
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="e.g., Machine learning applications in healthcare..."
            value={researchInterest}
            onChange={(e) => setResearchInterest(e.target.value)}
            className="min-h-[80px]"
          />
          <Button 
            onClick={handleResearchSubmit} 
            disabled={!researchInterest.trim() || loading}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Finding matching professors...
              </>
            ) : (
              'Find Professors'
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (step === 'selection') {
    return (
      <div className="w-full max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Best Professor Matches</CardTitle>
          </CardHeader>
        </Card>
        
        <div className="grid gap-4">
          {professors.map((professor) => (
            <Card 
              key={professor.id} 
              className={`hover:shadow-md transition-shadow cursor-pointer ${
                emailGenerationLoading ? 'opacity-50 pointer-events-none' : ''
              }`}
            >
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="space-y-3 flex-1">
                    <div className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      <h3 className="text-xl font-semibold">{professor.name}</h3>
                      <Badge variant="secondary">{professor.department}</Badge>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      {professor.research_areas.map((area) => (
                        <Badge key={area} variant="outline">{area}</Badge>
                      ))}
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <Badge variant="secondary">{professor.email}</Badge>
                    </div>
                    
                    
                  </div>
                  
                  <Button 
                    onClick={() => handleProfessorSelect(professor)}
                    disabled={emailGenerationLoading}
                  >
                    {emailGenerationLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating Email...
                      </>
                    ) : (
                      'Select Professor'
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        <Button variant="outline" onClick={resetFlow} className="w-full">
          Start Over
        </Button>
      </div>
    );
  }

  if (step === 'email') {
    return (
      <div className="w-full max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-6 w-6" />
              Review & Customize Your Email
            </CardTitle>
          </CardHeader>
        </Card>
        
        <Card>
          <CardContent className="p-6 space-y-4">
            <div>
              <label className="text-sm font-medium">To:</label>
              <Input
                value={emailDraft.to || selectedProfessor?.email || ''}
                onChange={(e) => setEmailDraft(prev => ({ ...prev, to: e.target.value }))}
                className="mt-1"
                placeholder="Professor's email address"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium">Subject:</label>
              <Input
                value={emailDraft.subject}
                onChange={(e) => setEmailDraft(prev => ({ ...prev, subject: e.target.value }))}
                className="mt-1"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium">Message:</label>
              <Textarea
                value={emailDraft.body}
                onChange={(e) => setEmailDraft(prev => ({ ...prev, body: e.target.value }))}
                className="mt-1 min-h-[400px]"
              />
            </div>
            
            <div className="flex gap-3">
              <Button onClick={handleSendEmail} disabled={loading} className="flex-1">
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Send Email
                  </>
                )}
              </Button>
              
              <Button variant="outline" onClick={() => setStep('selection')}>
                Back to Professors
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === 'sent') {
    return (
      <Card className="w-full max-w-2xl mx-auto text-center">
        <CardContent className="p-8 space-y-4">
          <div className="flex justify-center">
            <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center">
              <Send className="h-8 w-8 text-green-600" />
            </div>
          </div>
          
          <h2 className="text-2xl font-bold">Email Sent Successfully!</h2>
          <p className="text-muted-foreground">
            Your email to {selectedProfessor?.name} has been scheduled and saved to your records.
          </p>
          
          <Button onClick={resetFlow} className="w-full">
            Connect with Another Professor
          </Button>
        </CardContent>
      </Card>
    );
  }

  return null;
};

export default ProfessorConnect;