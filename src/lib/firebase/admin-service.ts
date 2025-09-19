import { 
  collection, 
  doc, 
  getDocs, 
  updateDoc, 
  query, 
  where, 
  orderBy,
  serverTimestamp,
  setDoc
} from 'firebase/firestore';
import { db } from './config';
import { User, Company, UserRole } from '@/types/auth';

export class AdminService {
  // Get all users
  async getAllUsers(companyId?: string): Promise<User[]> {
    try {
      let q;
      if (companyId) {
        q = query(
          collection(db, 'users'),
          where('companyId', '==', companyId),
          orderBy('createdAt', 'desc')
        );
      } else {
        q = query(
          collection(db, 'users'),
          orderBy('createdAt', 'desc')
        );
      }

      const querySnapshot = await getDocs(q);
      const users: User[] = [];
      
      querySnapshot.forEach((doc) => {
        users.push({ ...doc.data(), uid: doc.id } as User);
      });

      return users;
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  }

  // Get all companies
  async getAllCompanies(): Promise<Company[]> {
    try {
      const q = query(
        collection(db, 'companies'),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const companies: Company[] = [];
      
      querySnapshot.forEach((doc) => {
        companies.push({ ...doc.data(), id: doc.id } as Company);
      });

      return companies;
    } catch (error) {
      console.error('Error fetching companies:', error);
      throw error;
    }
  }

  // Create a new company
  async createCompany(company: Omit<Company, 'id' | 'createdAt' | 'updatedAt'>): Promise<Company> {
    try {
      const companyRef = doc(collection(db, 'companies'));
      const newCompany: Company = {
        ...company,
        id: companyRef.id,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await setDoc(companyRef, {
        ...newCompany,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      return newCompany;
    } catch (error) {
      console.error('Error creating company:', error);
      throw error;
    }
  }

  // Update user roles
  async updateUserRoles(userId: string, roles: UserRole[]): Promise<void> {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        roles,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating user roles:', error);
      throw error;
    }
  }

  // Assign user to company
  async assignUserToCompany(userId: string, companyId: string): Promise<void> {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        companyId,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error assigning user to company:', error);
      throw error;
    }
  }

  // Remove user from company
  async removeUserFromCompany(userId: string): Promise<void> {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        companyId: null,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error removing user from company:', error);
      throw error;
    }
  }

  // Activate/Deactivate user
  async toggleUserStatus(userId: string, isActive: boolean): Promise<void> {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        isActive,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error toggling user status:', error);
      throw error;
    }
  }

  // Delete user (soft delete - just marks as inactive)
  async deleteUser(userId: string): Promise<void> {
    try {
      await this.toggleUserStatus(userId, false);
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  // Get users by role
  async getUsersByRole(role: UserRole): Promise<User[]> {
    try {
      const q = query(
        collection(db, 'users'),
        where('roles', 'array-contains', role),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const users: User[] = [];
      
      querySnapshot.forEach((doc) => {
        users.push({ ...doc.data(), uid: doc.id } as User);
      });

      return users;
    } catch (error) {
      console.error('Error fetching users by role:', error);
      throw error;
    }
  }

  // Get users without company
  async getUnassignedUsers(): Promise<User[]> {
    try {
      const q = query(
        collection(db, 'users'),
        where('companyId', '==', null),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const users: User[] = [];
      
      querySnapshot.forEach((doc) => {
        users.push({ ...doc.data(), uid: doc.id } as User);
      });

      return users;
    } catch (error) {
      console.error('Error fetching unassigned users:', error);
      throw error;
    }
  }
}