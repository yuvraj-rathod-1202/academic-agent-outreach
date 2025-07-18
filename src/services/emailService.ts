import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

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
    
    // Step 2: Send to backend for actual email delivery
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        emailId,
        to: emailData.professorEmail,
        from: emailData.userEmail,
        subject: emailData.subject,
        body: emailData.body,
      }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to send email');
    }
    
    return emailId;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};