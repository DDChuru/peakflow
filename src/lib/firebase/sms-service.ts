import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from './config';

// Rate limiting configuration
const RATE_LIMIT_ATTEMPTS = 3;
const RATE_LIMIT_WINDOW_HOURS = 1;
const BLOCK_DURATION_HOURS = 24;

interface RateLimitEntry {
  identifier: string;
  type: 'email' | 'phone';
  attempts: number;
  lastAttempt: Date;
  blockedUntil?: Date;
}

export class RateLimiter {
  private collectionName = 'rateLimits';

  async checkRateLimit(identifier: string, type: 'email' | 'phone'): Promise<{ allowed: boolean; message?: string }> {
    const docRef = doc(db, this.collectionName, `${type}_${identifier}`);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return { allowed: true };
    }

    const data = docSnap.data() as RateLimitEntry;
    const now = new Date();

    // Check if blocked
    if (data.blockedUntil && new Date(data.blockedUntil) > now) {
      const blockedUntilStr = new Date(data.blockedUntil).toLocaleString();
      return {
        allowed: false,
        message: `Too many attempts. Please try again after ${blockedUntilStr}`
      };
    }

    // Check if window has expired
    const windowExpiry = new Date(data.lastAttempt);
    windowExpiry.setHours(windowExpiry.getHours() + RATE_LIMIT_WINDOW_HOURS);

    if (windowExpiry < now) {
      // Reset counter
      await updateDoc(docRef, {
        attempts: 1,
        lastAttempt: now,
        blockedUntil: null
      });
      return { allowed: true };
    }

    // Check attempts within window
    if (data.attempts >= RATE_LIMIT_ATTEMPTS) {
      // Block the identifier
      const blockedUntil = new Date();
      blockedUntil.setHours(blockedUntil.getHours() + BLOCK_DURATION_HOURS);

      await updateDoc(docRef, {
        blockedUntil: blockedUntil
      });

      return {
        allowed: false,
        message: `Too many attempts. Please try again after ${blockedUntil.toLocaleString()}`
      };
    }

    // Increment attempts
    await updateDoc(docRef, {
      attempts: data.attempts + 1,
      lastAttempt: now
    });

    return { allowed: true };
  }

  async recordAttempt(identifier: string, type: 'email' | 'phone'): Promise<void> {
    const docRef = doc(db, this.collectionName, `${type}_${identifier}`);
    const now = new Date();

    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      await setDoc(docRef, {
        identifier,
        type,
        attempts: 1,
        lastAttempt: now
      });
    } else {
      const data = docSnap.data() as RateLimitEntry;
      
      // Check if window has expired
      const windowExpiry = new Date(data.lastAttempt);
      windowExpiry.setHours(windowExpiry.getHours() + RATE_LIMIT_WINDOW_HOURS);

      if (windowExpiry < now) {
        // Reset counter
        await updateDoc(docRef, {
          attempts: 1,
          lastAttempt: now,
          blockedUntil: null
        });
      } else {
        // Increment attempts
        await updateDoc(docRef, {
          attempts: data.attempts + 1,
          lastAttempt: now
        });
      }
    }
  }
}

// SMS Service (placeholder - would integrate with Twilio/AWS SNS in production)
export class SMSService {
  private rateLimiter = new RateLimiter();

  async sendPasswordResetSMS(phoneNumber: string, code: string): Promise<{ success: boolean; message: string }> {
    // Check rate limit
    const rateLimitCheck = await this.rateLimiter.checkRateLimit(phoneNumber, 'phone');
    
    if (!rateLimitCheck.allowed) {
      return {
        success: false,
        message: rateLimitCheck.message || 'Rate limit exceeded'
      };
    }

    // Record the attempt
    await this.rateLimiter.recordAttempt(phoneNumber, 'phone');

    // In production, integrate with Twilio/AWS SNS
    // For now, we'll store the code in Firestore and log it
    const resetCodeDoc = doc(db, 'passwordResetCodes', phoneNumber);
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15); // 15 minute expiry

    await setDoc(resetCodeDoc, {
      phoneNumber,
      code,
      createdAt: new Date(),
      expiresAt,
      used: false
    });

    // In development, log the code
    if (process.env.NODE_ENV === 'development') {
      console.log(`SMS Reset Code for ${phoneNumber}: ${code}`);
    }

    // TODO: Integrate with SMS provider
    // Example Twilio integration:
    // const twilioClient = require('twilio')(accountSid, authToken);
    // await twilioClient.messages.create({
    //   body: `Your PeakFlow password reset code is: ${code}`,
    //   from: '+1234567890',
    //   to: phoneNumber
    // });

    return {
      success: true,
      message: 'Reset code sent successfully'
    };
  }

  async verifyResetCode(phoneNumber: string, code: string): Promise<{ valid: boolean; message?: string }> {
    const resetCodeDoc = doc(db, 'passwordResetCodes', phoneNumber);
    const docSnap = await getDoc(resetCodeDoc);

    if (!docSnap.exists()) {
      return {
        valid: false,
        message: 'Invalid or expired reset code'
      };
    }

    const data = docSnap.data();
    const now = new Date();

    // Check if code is expired
    if (new Date(data.expiresAt.toDate()) < now) {
      return {
        valid: false,
        message: 'Reset code has expired'
      };
    }

    // Check if code was already used
    if (data.used) {
      return {
        valid: false,
        message: 'Reset code has already been used'
      };
    }

    // Check if code matches
    if (data.code !== code) {
      return {
        valid: false,
        message: 'Invalid reset code'
      };
    }

    // Mark code as used
    await updateDoc(resetCodeDoc, {
      used: true,
      usedAt: now
    });

    return {
      valid: true,
      message: 'Code verified successfully'
    };
  }

  generateResetCode(): string {
    // Generate a 6-digit code
    return Math.floor(100000 + Math.random() * 900000).toString();
  }
}