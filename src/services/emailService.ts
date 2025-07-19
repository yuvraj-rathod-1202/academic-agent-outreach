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