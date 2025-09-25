import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  getDocs,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from './config';
import { User } from '@/types/auth';

export type ActivityType = 
  | 'user_assigned_to_company'
  | 'user_removed_from_company'
  | 'company_created'
  | 'company_updated'
  | 'company_deleted'
  | 'user_role_changed'
  | 'user_created'
  | 'user_updated';

export interface Activity {
  id?: string;
  type: ActivityType;
  userId: string;
  userEmail: string;
  targetId?: string;
  targetType?: 'user' | 'company';
  targetName?: string;
  companyId?: string;
  companyName?: string;
  metadata?: Record<string, unknown>;
  description: string;
  createdAt: Date | Timestamp;
}

export class ActivityService {
  private readonly collectionName = 'activities';

  async logActivity(activity: Omit<Activity, 'id' | 'createdAt'>): Promise<void> {
    try {
      await addDoc(collection(db, this.collectionName), {
        ...activity,
        createdAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error logging activity:', error);
    }
  }

  async logUserAssignedToCompany(
    performedBy: User,
    targetUser: User,
    companyId: string,
    companyName: string
  ): Promise<void> {
    await this.logActivity({
      type: 'user_assigned_to_company',
      userId: performedBy.uid,
      userEmail: performedBy.email,
      targetId: targetUser.uid,
      targetType: 'user',
      targetName: targetUser.fullName,
      companyId,
      companyName,
      description: `${performedBy.fullName} assigned ${targetUser.fullName} to ${companyName}`,
      metadata: {
        targetUserEmail: targetUser.email,
        targetUserRoles: targetUser.roles
      }
    });
  }

  async logUserRemovedFromCompany(
    performedBy: User,
    targetUser: User,
    companyId: string,
    companyName: string
  ): Promise<void> {
    await this.logActivity({
      type: 'user_removed_from_company',
      userId: performedBy.uid,
      userEmail: performedBy.email,
      targetId: targetUser.uid,
      targetType: 'user',
      targetName: targetUser.fullName,
      companyId,
      companyName,
      description: `${performedBy.fullName} removed ${targetUser.fullName} from ${companyName}`,
      metadata: {
        targetUserEmail: targetUser.email,
        targetUserRoles: targetUser.roles
      }
    });
  }

  async logCompanyCreated(
    performedBy: User,
    companyId: string,
    companyName: string,
    companyType: string
  ): Promise<void> {
    await this.logActivity({
      type: 'company_created',
      userId: performedBy.uid,
      userEmail: performedBy.email,
      targetId: companyId,
      targetType: 'company',
      targetName: companyName,
      companyId,
      companyName,
      description: `${performedBy.fullName} created ${companyType} company "${companyName}"`,
      metadata: {
        companyType
      }
    });
  }

  async logCompanyUpdated(
    performedBy: User,
    companyId: string,
    companyName: string,
    changes: Record<string, unknown>
  ): Promise<void> {
    await this.logActivity({
      type: 'company_updated',
      userId: performedBy.uid,
      userEmail: performedBy.email,
      targetId: companyId,
      targetType: 'company',
      targetName: companyName,
      companyId,
      companyName,
      description: `${performedBy.fullName} updated company "${companyName}"`,
      metadata: {
        changes: Object.keys(changes)
      }
    });
  }

  async getCompanyActivities(companyId: string, limitCount: number = 50): Promise<Activity[]> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('companyId', '==', companyId),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Activity));
    } catch (error) {
      console.error('Error fetching company activities:', error);
      return [];
    }
  }

  async getUserActivities(userId: string, limitCount: number = 50): Promise<Activity[]> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Activity));
    } catch (error) {
      console.error('Error fetching user activities:', error);
      return [];
    }
  }

  async getRecentActivities(limitCount: number = 100): Promise<Activity[]> {
    try {
      const q = query(
        collection(db, this.collectionName),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Activity));
    } catch (error) {
      console.error('Error fetching recent activities:', error);
      return [];
    }
  }
}
