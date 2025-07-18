import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, Mail, Send, User, BookOpen } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Professor {
  id: string;
  name: string;
  department: string;
  research_areas: string[];
  email: string;
  rating: number;
}

interface EmailDraft {
  subject: string;
  body: string;
}

type Step = 'input' | 'selection' | 'email' | 'sent';

const ProfessorConnect = () => {
  const [step, setStep] = useState<Step>('input');
  const [researchInterest, setResearchInterest] = useState('');
  const [professors, setProfessors] = useState<Professor[]>([]);
  const [selectedProfessor, setSelectedProfessor] = useState<Professor | null>(null);
  const [emailDraft, setEmailDraft] = useState<EmailDraft>({ subject: '', body: '' });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleResearchSubmit = async () => {
    if (!researchInterest.trim()) return;
    
    setLoading(true);
    try {
      // Simulate API call to get matching professors
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock professors data
      const mockProfessors: Professor[] = [
        {
          id: '1',
          name: 'Dr. Sarah Chen',
          department: 'Computer Science',
          research_areas: ['Machine Learning', 'AI Ethics', 'Neural Networks'],
          email: 'sarah.chen@university.edu',
          rating: 4.8
        },
        {
          id: '2',
          name: 'Prof. Michael Rodriguez',
          department: 'Data Science',
          research_areas: ['Deep Learning', 'Computer Vision', 'Robotics'],
          email: 'michael.rodriguez@university.edu',
          rating: 4.6
        },
        {
          id: '3',
          name: 'Dr. Lisa Zhang',
          department: 'Information Systems',
          research_areas: ['Natural Language Processing', 'Information Retrieval'],
          email: 'lisa.zhang@university.edu',
          rating: 4.7
        }
      ];
      
      setProfessors(mockProfessors);
      setStep('selection');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to find matching professors. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleProfessorSelect = async (professor: Professor) => {
    setSelectedProfessor(professor);
    setLoading(true);
    
    try {
      // Simulate API call to draft email
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mock email draft
      const mockEmailDraft: EmailDraft = {
        subject: `Research Collaboration Opportunity - ${researchInterest}`,
        body: `Dear ${professor.name},

I hope this email finds you well. My name is [Your Name], and I am a [Your Year] student majoring in [Your Major] at [University Name].

I am reaching out because I am deeply interested in your research work, particularly in ${professor.research_areas.slice(0, 2).join(' and ')}. Your recent publications and contributions to the field have greatly inspired my academic journey.

I have been working on research related to "${researchInterest}" and believe that your expertise would be invaluable to my project. I would be honored to discuss potential collaboration opportunities or learn more about ongoing research in your lab.

I have attached my resume and would be happy to provide additional information about my background and research interests. Would you be available for a brief meeting in the coming weeks to discuss this further?

Thank you for your time and consideration. I look forward to hearing from you.

Best regards,
[Your Name]
[Your Email]
[Your Phone Number]`
      };
      
      setEmailDraft(mockEmailDraft);
      setStep('email');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate email draft. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSendEmail = async () => {
    setLoading(true);
    
    try {
      // Simulate API calls to schedule email and save to Firestore
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setStep('sent');
      toast({
        title: "Email Sent Successfully!",
        description: "Your email has been scheduled and saved for reference.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send email. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const resetFlow = () => {
    setStep('input');
    setResearchInterest('');
    setProfessors([]);
    setSelectedProfessor(null);
    setEmailDraft({ subject: '', body: '' });
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
            <Card key={professor.id} className="hover:shadow-md transition-shadow cursor-pointer">
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
                    
                    <p className="text-sm text-muted-foreground">
                      Rating: {professor.rating}/5.0
                    </p>
                  </div>
                  
                  <Button onClick={() => handleProfessorSelect(professor)}>
                    Select Professor
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
              <label className="text-sm font-medium">To: {selectedProfessor?.email}</label>
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