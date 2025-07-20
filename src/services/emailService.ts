import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export interface EmailData {
  userId: string;
  professorName: string;
  professorEmail: string;
  userEmail: string;
  subject: string;
  body: string;
  researchInterest: string;
  status: 'sent' | 'scheduled' | 'delivered' | 'failed';
  to?: string; // Optional field for API-provided recipient
  scheduledAt?: Date; // For scheduled emails
}

export const saveEmailToFirestore = async (emailData: EmailData) => {
  try {
    const docRef = await addDoc(collection(db, 'emails'), {
      ...emailData,
      sentAt: emailData.status === 'sent' ? serverTimestamp() : null,
      scheduledAt: emailData.scheduledAt || null,
      createdAt: serverTimestamp()
    });
    
    return docRef.id;
  } catch (error) {
    console.error('Error saving email to Firestore:', error);
    throw error;
  }
};

export const sendReminderEmail = async (originalEmailData: EmailData, accessToken: string, reminderSubject?: string) => {
  try {
    // Prepare user data for API
    const userData = {
      name: originalEmailData.userEmail.split('@')[0], // Extract name from email or use provided
      email: originalEmailData.userEmail,
    };

    // Call the email API to generate a reminder email
    const response = await axios.post(`${API_BASE_URL}/api/email`, {
      name: originalEmailData.professorName,
      email: originalEmailData.professorEmail,
      user_prompt: `Follow-up reminder for: ${originalEmailData.researchInterest}`,
      user_data: userData,
      data: {
        originalSubject: originalEmailData.subject,
        originalBody: originalEmailData.body,
        researchInterest: originalEmailData.researchInterest,
        isReminder: true
      }
    });

    const reminderEmailData: EmailData = {
      ...originalEmailData,
      subject: reminderSubject || response.data.subject || `Follow-up: ${originalEmailData.subject}`,
      body: response.data.body || `Dear Professor ${originalEmailData.professorName},

I hope this email finds you well. I am writing to follow up on my previous email regarding research opportunities in ${originalEmailData.researchInterest}.

I understand you receive many emails, so I wanted to gently remind you of my interest in potentially joining your research group or collaborating on projects related to ${originalEmailData.researchInterest}.

If you have any questions or would like to discuss this further, please don't hesitate to reach out. I would be grateful for any opportunity to contribute to your research.

Thank you for your time and consideration.

Best regards,
${originalEmailData.userEmail}`,
      status: 'scheduled'
    };

    // Save reminder email to Firestore
    const emailId = await saveEmailToFirestore({
      ...reminderEmailData,
      status: 'scheduled'
    });

    // Send the reminder email
    await axios.post(`${API_BASE_URL}/api/send-email`, {
      access_token: accessToken,
      to: response.data.to || reminderEmailData.professorEmail,
      subject: reminderEmailData.subject,
      body: reminderEmailData.body,
    });

    return emailId;
  } catch (error) {
    console.error('Error sending reminder email:', error);
    throw error;
  }
};

export const scheduleEmail = async (emailData: EmailData, scheduledDate: Date) => {
  try {
    const emailId = await saveEmailToFirestore({
      ...emailData,
      status: 'scheduled',
      scheduledAt: scheduledDate
    });

    return emailId;
  } catch (error) {
    console.error('Error scheduling email:', error);
    throw error;
  }
};

export const sendAutomaticEmail = async (emailData: EmailData, accessToken: string) => {
  try {
    const emailId = await saveEmailToFirestore({
      ...emailData,
      status: 'scheduled'
    });

    await axios.post(`${API_BASE_URL}/api/send-email`, {
      access_token: accessToken,
      to: emailData.to || emailData.professorEmail,
      subject: emailData.subject,
      body: emailData.body,
    });

    alert('Email sent successfully!');
    return emailId;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};
