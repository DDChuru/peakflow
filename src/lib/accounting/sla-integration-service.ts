import { SLAService } from './sla-service';
import { RecurringInvoiceService } from './recurring-invoice-service';
import { DebtorService } from '../firebase/debtor-service';
import { PostingService } from './posting-service';
import {
  ServiceAgreement,
  SLAProcessingResult,
  SLAProcessingOptions,
  SLASummary
} from '@/types/accounting/sla';
import { Debtor } from '@/types/financial';

/**
 * Integration service that coordinates SLA operations with existing services
 * Ensures proper integration with debtors, GL posting, and invoice generation
 */
export class SLAIntegrationService {
  private slaService: SLAService;
  private debtorService: DebtorService;
  private postingService: PostingService;

  constructor(companyId: string) {
    this.slaService = new SLAService();
    this.debtorService = new DebtorService();
    this.postingService = new PostingService({ tenantId: companyId });
  }

  /**
   * Create SLA with customer validation and setup
   */
  async createSLAWithCustomerIntegration(
    companyId: string,
    slaData: Omit<ServiceAgreement, 'id' | 'createdAt' | 'updatedAt' | 'companyId'>,
    userId: string,
    options?: {
      createCustomerIfNotExists?: boolean;
      validateCustomerCredit?: boolean;
      setupAutoPayment?: boolean;
    }
  ): Promise<{ sla: ServiceAgreement; customer: Debtor | null; warnings: string[] }> {
    const warnings: string[] = [];

    try {
      // Step 1: Validate and get/create customer
      let customer = await this.debtorService.getDebtor(companyId, slaData.customerId);

      if (!customer && options?.createCustomerIfNotExists) {
        // Create basic customer record
        customer = await this.debtorService.createDebtor(
          companyId,
          {
            name: slaData.customerName || 'Unknown Customer',
            email: '',
            phone: '',
            status: 'active',
            creditLimit: slaData.contractValue * 2, // Default credit limit
            currentBalance: 0,
            overdueAmount: 0,
            paymentTerms: slaData.paymentTerms,
            createdBy: userId
          },
          userId
        );
        warnings.push('New customer record created automatically');
      } else if (!customer) {
        throw new Error(`Customer ${slaData.customerId} not found. Set createCustomerIfNotExists to true to auto-create.`);
      }

      // Step 2: Validate customer credit if requested
      if (options?.validateCustomerCredit && customer) {
        const creditCheckResult = await this.validateCustomerCredit(customer, slaData.contractValue);
        if (!creditCheckResult.approved) {
          warnings.push(`Credit validation warning: ${creditCheckResult.reason}`);
        }
      }

      // Step 3: Ensure customer name is consistent
      const slaWithCustomerName = {
        ...slaData,
        customerName: customer?.name || slaData.customerName
      };

      // Step 4: Create the SLA
      const sla = await this.slaService.createSLA(companyId, slaWithCustomerName, userId);

      // Step 5: Update customer with SLA reference (optional metadata)
      if (customer) {
        await this.debtorService.updateDebtor(companyId, customer.id, {
          metadata: {
            ...customer.metadata,
            activeSLAs: [...(customer.metadata?.activeSLAs || []), sla.id]
          }
        });
      }

      return { sla, customer, warnings };

    } catch (error) {
      console.error('Error creating SLA with customer integration:', error);
      throw new Error(`Failed to create SLA with customer integration: ${error}`);
    }
  }

  /**
   * Process recurring billing with full integration
   */
  async processRecurringBillingWithIntegration(
    options: SLAProcessingOptions
  ): Promise<{
    results: SLAProcessingResult[];
    summary: {
      totalProcessed: number;
      successfulBilling: number;
      failedBilling: number;
      totalRevenue: number;
      customersNotified: number;
    };
  }> {
    try {
      const recurringService = new RecurringInvoiceService(options.companyId);

      // Step 1: Process recurring invoices
      const results = await recurringService.processRecurringInvoices(options);

      // Step 2: Update customer balances for successful invoices
      for (const result of results) {
        if (result.success && result.invoiceId && result.totalAmount > 0) {
          try {
            const sla = await this.slaService.getSLA(options.companyId, result.slaId);
            if (sla) {
              // Update customer balance
              await this.debtorService.updateDebtorBalance(
                options.companyId,
                sla.customerId,
                result.totalAmount,
                false // This is a new invoice, not a payment
              );
            }
          } catch (error) {
            console.error(`Error updating customer balance for SLA ${result.slaId}:`, error);
            result.warnings = result.warnings || [];
            result.warnings.push('Failed to update customer balance');
          }
        }
      }

      // Step 3: Generate summary
      const successfulResults = results.filter(r => r.success);
      const totalRevenue = successfulResults.reduce((sum, r) => sum + r.totalAmount, 0);

      const summary = {
        totalProcessed: results.length,
        successfulBilling: successfulResults.length,
        failedBilling: results.filter(r => !r.success).length,
        totalRevenue,
        customersNotified: 0 // TODO: Implement notification service
      };

      return { results, summary };

    } catch (error) {
      console.error('Error processing recurring billing with integration:', error);
      throw new Error(`Failed to process recurring billing: ${error}`);
    }
  }

  /**
   * Get comprehensive SLA dashboard data
   */
  async getSLADashboardData(companyId: string): Promise<{
    slaSummary: SLASummary;
    upcomingBilling: ServiceAgreement[];
    recentActivity: any[];
    customerBreakdown: any[];
    revenueProjection: any;
  }> {
    try {
      // Get SLA summary
      const slaSummary = await this.slaService.getSLASummary(companyId);

      // Get upcoming billing (next 30 days)
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

      const upcomingBilling = await this.slaService.getSLAs(companyId, {
        status: 'active',
        dueDateTo: thirtyDaysFromNow.toISOString().split('T')[0],
        autoGenerateOnly: true
      });

      // Get customer breakdown
      const allSLAs = await this.slaService.getSLAs(companyId, { status: 'active' });
      const customerBreakdown = await this.generateCustomerBreakdown(companyId, allSLAs);

      // Generate revenue projection
      const revenueProjection = this.calculateRevenueProjection(allSLAs);

      return {
        slaSummary,
        upcomingBilling,
        recentActivity: [], // TODO: Implement activity tracking
        customerBreakdown,
        revenueProjection
      };

    } catch (error) {
      console.error('Error getting SLA dashboard data:', error);
      throw new Error(`Failed to get SLA dashboard data: ${error}`);
    }
  }

  /**
   * Validate SLA line items against chart of accounts
   */
  async validateSLAAccounting(
    companyId: string,
    sla: ServiceAgreement
  ): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
    accountValidations: Array<{
      lineItemId: string;
      accountId: string;
      isValid: boolean;
      accountName?: string;
      accountType?: string;
    }>;
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const accountValidations: any[] = [];

    try {
      // TODO: Integrate with actual chart of accounts service
      // For now, basic validation
      for (const lineItem of sla.lineItems) {
        if (!lineItem.glAccountId) {
          errors.push(`Line item "${lineItem.description}" missing GL account`);
        }

        accountValidations.push({
          lineItemId: lineItem.id,
          accountId: lineItem.glAccountId,
          isValid: !!lineItem.glAccountId,
          accountName: lineItem.glAccountName || 'Unknown',
          accountType: 'Revenue' // Default assumption
        });
      }

      // Validate totals
      const calculatedTotal = sla.lineItems.reduce((sum, item) => sum + item.amount, 0);
      if (Math.abs(calculatedTotal - sla.contractValue) > 0.01) {
        warnings.push(
          `Contract value (${sla.contractValue}) doesn't match line item total (${calculatedTotal})`
        );
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        accountValidations
      };

    } catch (error) {
      console.error('Error validating SLA accounting:', error);
      return {
        isValid: false,
        errors: [`Validation failed: ${error}`],
        warnings,
        accountValidations
      };
    }
  }

  /**
   * Private helper methods
   */
  private async validateCustomerCredit(
    customer: Debtor,
    requestedAmount: number
  ): Promise<{ approved: boolean; reason?: string }> {
    const availableCredit = customer.creditLimit - customer.currentBalance;

    if (requestedAmount > availableCredit) {
      return {
        approved: false,
        reason: `Requested amount (${requestedAmount}) exceeds available credit (${availableCredit})`
      };
    }

    if (customer.overdueAmount > 0) {
      return {
        approved: false,
        reason: `Customer has overdue amount of ${customer.overdueAmount}`
      };
    }

    if (customer.status !== 'active') {
      return {
        approved: false,
        reason: `Customer status is ${customer.status}`
      };
    }

    return { approved: true };
  }

  private async generateCustomerBreakdown(
    companyId: string,
    slas: ServiceAgreement[]
  ): Promise<any[]> {
    const customerMap = new Map();

    for (const sla of slas) {
      if (!customerMap.has(sla.customerId)) {
        const customer = await this.debtorService.getDebtor(companyId, sla.customerId);
        customerMap.set(sla.customerId, {
          customerId: sla.customerId,
          customerName: customer?.name || sla.customerName || 'Unknown',
          activeSLAs: 0,
          totalContractValue: 0,
          monthlyRecurring: 0,
          nextBilling: null,
          status: customer?.status || 'unknown'
        });
      }

      const customerData = customerMap.get(sla.customerId);
      customerData.activeSLAs += 1;
      customerData.totalContractValue += sla.contractValue;

      // Calculate monthly recurring based on frequency
      let monthlyAmount = 0;
      switch (sla.billingFrequency) {
        case 'monthly':
          monthlyAmount = sla.contractValue;
          break;
        case 'quarterly':
          monthlyAmount = sla.contractValue / 3;
          break;
        case 'annual':
          monthlyAmount = sla.contractValue / 12;
          break;
      }
      customerData.monthlyRecurring += monthlyAmount;

      // Track earliest next billing date
      if (!customerData.nextBilling || sla.nextBillingDate < customerData.nextBilling) {
        customerData.nextBilling = sla.nextBillingDate;
      }
    }

    return Array.from(customerMap.values()).sort((a, b) => b.totalContractValue - a.totalContractValue);
  }

  private calculateRevenueProjection(slas: ServiceAgreement[]): any {
    const projection = {
      currentMonth: 0,
      next3Months: 0,
      next6Months: 0,
      next12Months: 0
    };

    const now = new Date();
    const oneMonth = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
    const threeMonths = new Date(now.getFullYear(), now.getMonth() + 3, now.getDate());
    const sixMonths = new Date(now.getFullYear(), now.getMonth() + 6, now.getDate());
    const twelveMonths = new Date(now.getFullYear(), now.getMonth() + 12, now.getDate());

    for (const sla of slas) {
      if (sla.status !== 'active') continue;

      let monthlyValue = 0;
      switch (sla.billingFrequency) {
        case 'monthly':
          monthlyValue = sla.contractValue;
          break;
        case 'quarterly':
          monthlyValue = sla.contractValue / 3;
          break;
        case 'annual':
          monthlyValue = sla.contractValue / 12;
          break;
      }

      const endDate = new Date(sla.endDate);

      // Current month
      if (endDate >= now) {
        projection.currentMonth += monthlyValue;
      }

      // Next 3 months
      if (endDate >= oneMonth) {
        projection.next3Months += monthlyValue * 3;
      }

      // Next 6 months
      if (endDate >= threeMonths) {
        projection.next6Months += monthlyValue * 6;
      }

      // Next 12 months
      if (endDate >= sixMonths) {
        projection.next12Months += monthlyValue * 12;
      }
    }

    return projection;
  }
}