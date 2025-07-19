import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { GoogleOAuthProvider, googleLogout, GoogleLogin, useGoogleLogin } from '@react-oauth/google';
import axios from 'axios';

export interface EmailData {
  userId: string;
  professorName: string;
  professorEmail: string;
  userEmail: string;
  subject: string;
  body: string;
  researchInterest: string;
  status: 'sent' | 'scheduled' | 'delivered' | 'failed';
}

export const saveEmailToFirestore = async (emailData: EmailData) => {
  try {
    const docRef = await addDoc(collection(db, 'emails'), {
      ...emailData,
      sentAt: serverTimestamp(),
      createdAt: serverTimestamp()
    });
    
    return docRef.id;
  } catch (error) {
    console.error('Error saving email to Firestore:', error);
    throw error;
  }
};

export const sendReminderEmail = async (originalEmailData: EmailData, reminderSubject?: string) => {
  try {
    const defaultReminderSubject = `Follow-up: ${originalEmailData.subject}`;
    const reminderBody = `Dear Professor ${originalEmailData.professorName},

I hope this email finds you well. I am writing to follow up on my previous email regarding research opportunities in ${originalEmailData.researchInterest}.

I understand you receive many emails, so I wanted to gently remind you of my interest in potentially joining your research group or collaborating on projects related to ${originalEmailData.researchInterest}.

If you have any questions or would like to discuss this further, please don't hesitate to reach out. I would be grateful for any opportunity to contribute to your research.

Thank you for your time and consideration.

Best regards,
${originalEmailData.userEmail}`;

    const reminderEmailData: EmailData = {
      ...originalEmailData,
      subject: reminderSubject || defaultReminderSubject,
      body: reminderBody,
      status: 'scheduled'
    };

    useGoogleLogin({
      scope: 'https://www.googleapis.com/auth/gmail.send',
      onSuccess: async (tokenResponse) => {
        try {
          // Save reminder email to Firestore
          const emailId = await saveEmailToFirestore({
            ...reminderEmailData,
            status: 'scheduled'
          });

          // Send the reminder email
          await axios.post('http://localhost:8000/api/send-email', {
            access_token: tokenResponse.access_token,
            to: reminderEmailData.professorEmail,
            subject: reminderEmailData.subject,
            body: reminderEmailData.body,
          });

          alert('Reminder email sent successfully!');
          return emailId;
        } catch (error) {
          console.error('Error sending reminder email:', error);
          alert('Failed to send reminder email.');
          throw error;
        }
      },
      onError: (error) => {
        console.error('Login failed:', error);
        alert('Failed to login and send reminder email.');
      }
    });
  } catch (error) {
    console.error('Error sending reminder email:', error);
    throw error;
  }
};

export const sendAutomaticEmail = async (emailData: EmailData) => {
  try {
    // This would integrate with your backend API for sending emails
    // For now, we'll simulate the process
    
    // Step 1: Save to Firestore
    const emailId = await saveEmailToFirestore({
      ...emailData,
      status: 'scheduled'
    });

    useGoogleLogin({
      scope: 'https://www.googleapis.com/auth/gmail.send',
      onSuccess: async (tokenResponse) => {
        const accessToken = tokenResponse.access_token;
    
      // Step 2: Send to backend for actual email delivery
        await axios.post('http://localhost:8000/api/send-email', {
          access_token: tokenResponse.access_token,
          to: emailData.professorEmail,
          subject: emailData.subject,
          body: emailData.body,
        });

        alert('Email sent successfully!');
      },
      onError: (error) => {
        console.error('Login failed:', error);
        alert('Failed to login and send email.');
      }
  });
    
    return emailId;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};