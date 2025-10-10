import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from './config';
import { Company, CompanyType, SupportedCurrency } from '@/types/auth';

export class CompaniesService {
  private collectionName = 'companies';

  // Get all companies
  async getAllCompanies(type?: CompanyType): Promise<Company[]> {
    try {
      let q;
      if (type) {
        q = query(
          collection(db, this.collectionName),
          where('type', '==', type),
          orderBy('createdAt', 'desc')
        );
      } else {
        q = query(
          collection(db, this.collectionName),
          orderBy('createdAt', 'desc')
        );
      }

      const querySnapshot = await getDocs(q);
      const companies: Company[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        companies.push({ 
          ...data, 
          id: doc.id,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        } as Company);
      });

      return companies;
    } catch (error) {
      console.error('Error fetching companies:', error);
      throw error;
    }
  }

  // Get company by ID
  async getCompanyById(id: string): Promise<Company | null> {
    try {
      const docRef = doc(db, this.collectionName, id);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        return null;
      }
      
      const data = docSnap.data();
      return {
        ...data,
        id: docSnap.id,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date()
      } as Company;
    } catch (error) {
      console.error('Error fetching company:', error);
      throw error;
    }
  }

  // Create a new company
  async createCompany(company: Omit<Company, 'id' | 'createdAt' | 'updatedAt'>, userId: string): Promise<string> {
    try {
      // Filter out undefined values
      const cleanCompanyData: Record<string, unknown> = {
        name: company.name,
        type: company.type,
        createdBy: userId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        isActive: company.isActive !== undefined ? company.isActive : true
      };

      // Only add optional fields if they have values
      if (company.industry) cleanCompanyData.industry = company.industry;
      if (company.domain) cleanCompanyData.domain = company.domain;
      if (company.logoUrl) cleanCompanyData.logoUrl = company.logoUrl;
      if (company.description) cleanCompanyData.description = company.description;
      if (company.address) cleanCompanyData.address = company.address;
      if (company.phone) cleanCompanyData.phone = company.phone;
      if (company.email) cleanCompanyData.email = company.email;
      if (company.vatNumber) cleanCompanyData.vatNumber = company.vatNumber;

      const docRef = await addDoc(collection(db, this.collectionName), cleanCompanyData);

      return docRef.id;
    } catch (error) {
      console.error('Error creating company:', error);
      throw error;
    }
  }

  // Update company
  async updateCompany(id: string, updates: Partial<Company>): Promise<void> {
    try {
      const docRef = doc(db, this.collectionName, id);
      
      // Remove fields that shouldn't be updated
      const { id: _, createdAt, ...updateData } = updates;
      
      await updateDoc(docRef, {
        ...updateData,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating company:', error);
      throw error;
    }
  }

  // Delete company
  async deleteCompany(id: string): Promise<void> {
    try {
      const docRef = doc(db, this.collectionName, id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting company:', error);
      throw error;
    }
  }

  // Toggle company status
  async toggleCompanyStatus(id: string, isActive: boolean): Promise<void> {
    try {
      await this.updateCompany(id, { isActive });
    } catch (error) {
      console.error('Error toggling company status:', error);
      throw error;
    }
  }

  // Get companies by type
  async getCompaniesByType(type: CompanyType): Promise<Company[]> {
    return this.getAllCompanies(type);
  }

  // Search companies
  async searchCompanies(searchTerm: string): Promise<Company[]> {
    try {
      // Note: Firestore doesn't support full-text search natively
      // This is a simple implementation that searches by exact name match
      // For production, consider using Algolia or ElasticSearch
      const companies = await this.getAllCompanies();
      
      const searchLower = searchTerm.toLowerCase();
      return companies.filter(company => 
        company.name.toLowerCase().includes(searchLower) ||
        company.domain?.toLowerCase().includes(searchLower) ||
        company.email?.toLowerCase().includes(searchLower)
      );
    } catch (error) {
      console.error('Error searching companies:', error);
      throw error;
    }
  }

  // Get company statistics
  async getCompanyStats(companyId: string): Promise<{ userCount: number }> {
    try {
      // Get user count for this company
      const usersQuery = query(
        collection(db, 'users'),
        where('companyId', '==', companyId)
      );

      const usersSnapshot = await getDocs(usersQuery);

      return {
        userCount: usersSnapshot.size
      };
    } catch (error) {
      console.error('Error fetching company stats:', error);
      throw error;
    }
  }

  /**
   * Update company currency and VAT settings
   */
  async updateCompanyConfig(
    companyId: string,
    config: {
      defaultCurrency?: SupportedCurrency;
      vatPercentage?: number;
    }
  ): Promise<void> {
    try {
      const companyRef = doc(db, this.collectionName, companyId);
      const updates: Record<string, unknown> = {
        updatedAt: serverTimestamp(),
      };

      if (config.defaultCurrency !== undefined) {
        updates.defaultCurrency = config.defaultCurrency;
      }

      if (config.vatPercentage !== undefined) {
        // Validate VAT percentage
        if (config.vatPercentage < 0 || config.vatPercentage > 100) {
          throw new Error('VAT percentage must be between 0 and 100');
        }
        updates.vatPercentage = config.vatPercentage;
      }

      await updateDoc(companyRef, updates);
      console.log(`[CompaniesService] Updated config for company: ${companyId}`);
    } catch (error) {
      console.error('Error updating company config:', error);
      throw error;
    }
  }

  /**
   * Get company currency configuration
   */
  async getCompanyCurrency(companyId: string): Promise<SupportedCurrency | undefined> {
    try {
      const company = await this.getCompanyById(companyId);
      return company?.defaultCurrency;
    } catch (error) {
      console.error('Error fetching company currency:', error);
      throw error;
    }
  }

  /**
   * Get company VAT configuration
   */
  async getCompanyVAT(companyId: string): Promise<number | undefined> {
    try {
      const company = await this.getCompanyById(companyId);
      return company?.vatPercentage;
    } catch (error) {
      console.error('Error fetching company VAT:', error);
      throw error;
    }
  }
}
