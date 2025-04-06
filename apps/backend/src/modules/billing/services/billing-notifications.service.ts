import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { EmailService, EmailRecipient } from '../../../common/email/email.service';
import { InvoiceStatus } from '../../../types/prisma-models';
import { ClaimStatus } from '../../../types/prisma-models';
import { Prisma } from '@prisma/client';

/**
 * Service to handle notifications related to billing activities
 * Generates and sends notifications for invoices, payments, and insurance claims
 */
@Injectable()
export class BillingNotificationsService {
  private readonly logger = new Logger(BillingNotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService
  ) {}

  /**
   * Send an email notification about a new invoice
   * @param email The recipient's email address
   * @param clientName The client's first name
   * @param invoiceNumber The invoice number
   * @param amount The invoice amount
   * @param dueDate The invoice due date
   */
  private async sendInvoiceEmail(
    email: string,
    clientName: string,
    invoiceNumber: string,
    amount: string,
    dueDate: Date
  ): Promise<boolean> {
    const subject = `New Invoice #${invoiceNumber}`;
    const formattedDate = new Date(dueDate).toLocaleDateString();
    const formattedAmount = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(amount));
    
    const html = `
      <h2>New Invoice from Therapy CRM</h2>
      <p>Hello ${clientName},</p>
      <p>A new invoice has been created for your account.</p>
      <p><strong>Invoice Number:</strong> ${invoiceNumber}</p>
      <p><strong>Amount Due:</strong> ${formattedAmount}</p>
      <p><strong>Due Date:</strong> ${formattedDate}</p>
      <p>Please log in to your account to view and pay this invoice.</p>
      <p>Thank you for your business!</p>
      <p>Therapy CRM Team</p>
    `;

    const recipient: EmailRecipient = {
      email,
      name: clientName
    };

    return this.emailService.sendEmail({
      to: recipient,
      subject,
      html,
    });
  }

  /**
   * Send an email notification about an overdue invoice
   * @param email The recipient's email address
   * @param clientName The client's first name
   * @param invoiceNumber The invoice number
   * @param amount The invoice amount
   * @param dueDate The invoice due date
   * @param daysOverdue The number of days the invoice is overdue
   */
  private async sendOverdueInvoiceEmail(
    email: string,
    clientName: string,
    invoiceNumber: string,
    amount: string,
    dueDate: Date,
    daysOverdue: number
  ): Promise<boolean> {
    const subject = `OVERDUE: Invoice #${invoiceNumber}`;
    const formattedDate = new Date(dueDate).toLocaleDateString();
    const formattedAmount = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(amount));
    
    const html = `
      <h2>Overdue Invoice Reminder</h2>
      <p>Hello ${clientName},</p>
      <p>This is a reminder that your invoice is <strong>${daysOverdue} days overdue</strong>.</p>
      <p><strong>Invoice Number:</strong> ${invoiceNumber}</p>
      <p><strong>Amount Due:</strong> ${formattedAmount}</p>
      <p><strong>Due Date:</strong> ${formattedDate}</p>
      <p>Please log in to your account to make a payment as soon as possible.</p>
      <p>If you have any questions or need assistance, please contact us.</p>
      <p>Thank you for your prompt attention to this matter.</p>
      <p>Therapy CRM Team</p>
    `;

    const recipient: EmailRecipient = {
      email,
      name: clientName
    };

    return this.emailService.sendEmail({
      to: recipient,
      subject,
      html,
    });
  }

  /**
   * Send an email notification about a payment received
   * @param email The recipient's email address
   * @param clientName The client's first name
   * @param invoiceNumber The invoice number
   * @param amount The payment amount
   * @param paymentMethod The payment method used
   */
  private async sendPaymentReceivedEmail(
    email: string,
    clientName: string,
    invoiceNumber: string,
    amount: string,
    paymentMethod: string
  ): Promise<boolean> {
    const subject = `Payment Confirmation for Invoice #${invoiceNumber}`;
    const formattedAmount = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(amount));
    
    const html = `
      <h2>Payment Confirmation</h2>
      <p>Hello ${clientName},</p>
      <p>We have received your payment. Thank you!</p>
      <p><strong>Invoice Number:</strong> ${invoiceNumber}</p>
      <p><strong>Amount Paid:</strong> ${formattedAmount}</p>
      <p><strong>Payment Method:</strong> ${paymentMethod}</p>
      <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
      <p>This payment has been applied to your account. You can log in to view your updated invoice status.</p>
      <p>Thank you for your business!</p>
      <p>Therapy CRM Team</p>
    `;

    const recipient: EmailRecipient = {
      email,
      name: clientName
    };

    return this.emailService.sendEmail({
      to: recipient,
      subject,
      html,
    });
  }

  /**
   * Send notification when a new invoice is created
   * @param invoiceId - ID of the created invoice
   */
  async sendInvoiceCreatedNotification(invoiceId: bigint): Promise<void> {
    try {
      // Use type casting to help TypeScript recognize the prisma models
      const prismaClient = this.prisma as unknown as {
        invoice: any;
        notification: any;
      };
      
      const invoice = await prismaClient.invoice.findUnique({
        where: { id: invoiceId },
        include: {
          client: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
              preferredContactMethod: true,
            },
          },
        },
      });

      if (!invoice || !invoice.client) {
        this.logger.warn(`Cannot send invoice created notification: Invoice ${invoiceId} or client not found`);
        return;
      }

      const notificationData = {
        recipientId: invoice.clientId.toString(),
        recipientType: 'CLIENT',
        title: 'New Invoice Available',
        content: `A new invoice (#${invoice.invoiceNumber}) for $${invoice.totalAmount} has been generated. Due date: ${invoice.dueDate.toLocaleDateString()}.`,
        type: 'INVOICE',
        priority: 'MEDIUM',
        relatedEntityId: invoiceId.toString(),
        relatedEntityType: 'INVOICE',
        data: JSON.stringify({
          invoiceId: invoiceId.toString(),
          invoiceNumber: invoice.invoiceNumber,
          amount: invoice.totalAmount.toString(),
          dueDate: invoice.dueDate.toISOString(),
        }),
      };

      await (this.prisma as unknown as { notification: any }).notification.create({
        data: notificationData,
      });

      // Send email notification if client has email
      if (invoice.client.email) {
        await this.sendInvoiceEmail(
          invoice.client.email,
          invoice.client.firstName,
          invoice.invoiceNumber,
          invoice.totalAmount.toString(),
          invoice.dueDate
        );
      }

      this.logger.log(`Created invoice notification for client ${invoice.clientId} (invoice #${invoice.invoiceNumber})`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Failed to send invoice created notification: ${errorMessage}`, errorStack);
    }
  }

  /**
   * Send notification when an invoice becomes overdue
   * @param invoiceId - ID of the overdue invoice
   */
  async sendInvoiceOverdueNotification(invoiceId: bigint): Promise<void> {
    try {
      // Use type casting to help TypeScript recognize the prisma models
      const prismaClient = this.prisma as unknown as {
        invoice: any;
        notification: any;
      };
      
      const invoice = await prismaClient.invoice.findUnique({
        where: { id: invoiceId },
        include: {
          client: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });

      if (!invoice || !invoice.client) {
        this.logger.warn(`Cannot send invoice overdue notification: Invoice ${invoiceId} or client not found`);
        return;
      }

      const daysOverdue = Math.floor((new Date().getTime() - invoice.dueDate.getTime()) / (1000 * 3600 * 24));

      const notificationData = {
        recipientId: invoice.clientId.toString(),
        recipientType: 'CLIENT',
        title: 'Invoice Overdue',
        content: `Your invoice (#${invoice.invoiceNumber}) for $${invoice.totalAmount} is now ${daysOverdue} days overdue. Please arrange payment at your earliest convenience.`,
        type: 'INVOICE',
        priority: 'HIGH',
        relatedEntityId: invoiceId.toString(),
        relatedEntityType: 'INVOICE',
        data: JSON.stringify({
          invoiceId: invoiceId.toString(),
          invoiceNumber: invoice.invoiceNumber,
          amount: invoice.totalAmount.toString(),
          dueDate: invoice.dueDate.toISOString(),
          daysOverdue,
        }),
      };

      await (this.prisma as unknown as { notification: any }).notification.create({
        data: notificationData,
      });

      // Send email notification for overdue invoice
      if (invoice.client.email) {
        await this.sendOverdueInvoiceEmail(
          invoice.client.email,
          invoice.client.firstName,
          invoice.invoiceNumber,
          invoice.totalAmount.toString(),
          invoice.dueDate,
          daysOverdue
        );
      }

      this.logger.log(`Created overdue invoice notification for client ${invoice.clientId} (invoice #${invoice.invoiceNumber})`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Failed to send invoice overdue notification: ${errorMessage}`, errorStack);
    }
  }

  /**
   * Send notification when a payment is received
   * @param paymentId - ID of the received payment
   */
  async sendPaymentReceivedNotification(paymentId: bigint): Promise<void> {
    try {
      // Use type casting to help TypeScript recognize the prisma models
      const prismaClient = this.prisma as unknown as {
        payment: any;
        notification: any;
      };
      
      const payment = await prismaClient.payment.findUnique({
        where: { id: paymentId },
        include: {
          invoice: {
            include: {
              client: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                },
              },
            },
          },
        },
      });

      if (!payment || !payment.invoice || !payment.invoice.client) {
        this.logger.warn(`Cannot send payment received notification: Payment ${paymentId}, invoice, or client not found`);
        return;
      }

      const notificationData = {
        recipientId: payment.invoice.clientId.toString(),
        recipientType: 'CLIENT',
        title: 'Payment Received',
        content: `We've received your payment of $${payment.amount} for invoice #${payment.invoice.invoiceNumber}. Thank you!`,
        type: 'PAYMENT',
        priority: 'MEDIUM',
        relatedEntityId: paymentId.toString(),
        relatedEntityType: 'PAYMENT',
        data: JSON.stringify({
          paymentId: paymentId.toString(),
          invoiceId: payment.invoiceId.toString(),
          invoiceNumber: payment.invoice.invoiceNumber,
          amount: payment.amount.toString(),
          paymentDate: payment.date.toISOString(),
          method: payment.method,
        }),
      };

      await (this.prisma as unknown as { notification: any }).notification.create({
        data: notificationData,
      });

      // Send email notification for payment received
      if (payment.invoice.client.email) {
        await this.sendPaymentReceivedEmail(
          payment.invoice.client.email,
          payment.invoice.client.firstName,
          payment.invoice.invoiceNumber,
          payment.amount.toString(),
          payment.method
        );
      }

      this.logger.log(`Created payment received notification for client ${payment.invoice.clientId} (invoice #${payment.invoice.invoiceNumber})`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Failed to send payment received notification: ${errorMessage}`, errorStack);
    }
  }

  /**
   * Send notification when an insurance claim status changes
   * @param claimId - ID of the insurance claim
   * @param oldStatus - Previous status of the claim
   * @param newStatus - New status of the claim
   */
  async sendClaimStatusUpdateNotification(claimId: bigint, oldStatus: ClaimStatus, newStatus: ClaimStatus): Promise<void> {
    try {
      // Use type casting to help TypeScript recognize the prisma models
      const prismaClient = this.prisma as unknown as {
        insuranceClaim: any;
        notification: any;
      };
      
      const claim = await prismaClient.insuranceClaim.findUnique({
        where: { id: claimId },
        include: {
          invoice: {
            include: {
              client: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                },
              },
            },
          },
          insuranceProvider: true,
        },
      });

      if (!claim || !claim.invoice || !claim.invoice.client) {
        this.logger.warn(`Cannot send claim status notification: Claim ${claimId}, invoice, or client not found`);
        return;
      }

      let title = 'Insurance Claim Update';
      let content = `Your insurance claim for invoice #${claim.invoice.invoiceNumber} with ${claim.insuranceProvider.name} has been updated from ${oldStatus} to ${newStatus}.`;
      let priority = 'MEDIUM';

      // Customize message based on status change
      if (newStatus === ClaimStatus.APPROVED) {
        title = 'Insurance Claim Approved';
        content = `Great news! Your insurance claim for invoice #${claim.invoice.invoiceNumber} with ${claim.insuranceProvider.name} has been approved.`;
        priority = 'HIGH';
      } else if (newStatus === ClaimStatus.DENIED) {
        title = 'Insurance Claim Denied';
        content = `Unfortunately, your insurance claim for invoice #${claim.invoice.invoiceNumber} with ${claim.insuranceProvider.name} has been denied. Please contact us for more information.`;
        priority = 'HIGH';
      } else if (newStatus === ClaimStatus.PAID) {
        title = 'Insurance Payment Received';
        content = `We've received payment from ${claim.insuranceProvider.name} for your insurance claim related to invoice #${claim.invoice.invoiceNumber}.`;
        priority = 'HIGH';
      }

      const notificationData = {
        recipientId: claim.invoice.clientId.toString(),
        recipientType: 'CLIENT',
        title,
        content,
        type: 'INSURANCE',
        priority,
        relatedEntityId: claimId.toString(),
        relatedEntityType: 'INSURANCE_CLAIM',
        data: JSON.stringify({
          claimId: claimId.toString(),
          invoiceId: claim.invoiceId.toString(),
          invoiceNumber: claim.invoice.invoiceNumber,
          oldStatus,
          newStatus,
          insuranceProvider: claim.insuranceProvider.name,
        }),
      };

      await (this.prisma as unknown as { notification: any }).notification.create({
        data: notificationData,
      });

      this.logger.log(`Created insurance claim status update notification for client ${claim.invoice.clientId} (claim #${claimId})`);      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Failed to send claim status update notification: ${errorMessage}`, errorStack);
    }
  }

  /**
   * Send reminder for invoices due soon
   * @param invoiceId - ID of the invoice due soon
   * @param daysUntilDue - Number of days until the invoice is due
   */
  async sendInvoiceDueReminderNotification(invoiceId: bigint, daysUntilDue: number): Promise<void> {
    try {
      // Use type casting to help TypeScript recognize the prisma models
      const prismaClient = this.prisma as unknown as {
        invoice: any;
        notification: any;
      };
      
      const invoice = await prismaClient.invoice.findUnique({
        where: { id: invoiceId },
        include: {
          client: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });

      if (!invoice || !invoice.client) {
        this.logger.warn(`Cannot send invoice due reminder: Invoice ${invoiceId} or client not found`);
        return;
      }

      const notificationData = {
        recipientId: invoice.clientId.toString(),
        recipientType: 'CLIENT',
        title: 'Invoice Due Soon',
        content: `Your invoice (#${invoice.invoiceNumber}) for $${invoice.totalAmount} is due in ${daysUntilDue} days. Please arrange payment to avoid late fees.`,
        type: 'INVOICE',
        priority: daysUntilDue <= 3 ? 'HIGH' : 'MEDIUM',
        relatedEntityId: invoiceId.toString(),
        relatedEntityType: 'INVOICE',
        data: JSON.stringify({
          invoiceId: invoiceId.toString(),
          invoiceNumber: invoice.invoiceNumber,
          amount: invoice.totalAmount.toString(),
          dueDate: invoice.dueDate.toISOString(),
          daysUntilDue,
        }),
      };

      await (this.prisma as unknown as { notification: any }).notification.create({
        data: notificationData,
      });

      this.logger.log(`Created invoice due reminder for client ${invoice.clientId} (invoice #${invoice.invoiceNumber}, due in ${daysUntilDue} days)`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Failed to send invoice due reminder: ${errorMessage}`, errorStack);
    }
  }

  /**
   * Check and send notifications for invoices due soon (scheduler can call this daily)
   */
  async checkAndSendDueInvoiceReminders(): Promise<void> {
    try {
      // Use type casting to help TypeScript recognize the prisma models
      const prismaClient = this.prisma as unknown as {
        invoice: any;
      };
      
      const today = new Date();
      const reminderDays = [7, 3, 1]; // Send reminders 7 days, 3 days, and 1 day before due date
      
      for (const days of reminderDays) {
        const targetDate = new Date();
        targetDate.setDate(today.getDate() + days);
        
        // Set time to beginning of day for comparison
        targetDate.setHours(0, 0, 0, 0);
        
        // Find invoices due on target date
        const invoices = await prismaClient.invoice.findMany({
          where: {
            status: {
              in: [InvoiceStatus.SENT, InvoiceStatus.PARTIALLY_PAID]
            },
            dueDate: {
              gte: targetDate,
              lt: new Date(targetDate.getTime() + 24 * 60 * 60 * 1000) // Less than next day
            },
          },
        });
        
        for (const invoice of invoices) {
          await this.sendInvoiceDueReminderNotification(invoice.id, days);
        }
        
        this.logger.log(`Processed ${invoices.length} invoices for ${days}-day reminders`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Failed to process due invoice reminders: ${errorMessage}`, errorStack);
    }
  }

  /**
   * Check and send notifications for overdue invoices (scheduler can call this daily)
   */
  async checkAndSendOverdueInvoiceNotifications(): Promise<void> {
    try {
      // Use type casting to help TypeScript recognize the prisma models
      const prismaClient = this.prisma as unknown as {
        invoice: any;
      };
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Find invoices that are overdue and have not had a notification sent recently
      const overdueInvoices = await prismaClient.invoice.findMany({
        where: {
          status: {
            in: [InvoiceStatus.SENT, InvoiceStatus.PARTIALLY_PAID, InvoiceStatus.OVERDUE]
          },
          dueDate: {
            lt: today
          },
        },
        include: {
          notifications: {
            where: {
              type: 'INVOICE',
              createdAt: {
                gte: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000) // Within the last 7 days
              }
            }
          }
        }
      });
      
      // Send notifications for invoices without recent notifications
      for (const invoice of overdueInvoices) {
        // Only send if no notification in the last 7 days
        if (invoice.notifications.length === 0) {
          await this.sendInvoiceOverdueNotification(invoice.id);
          
          // Update invoice status to OVERDUE if not already
          if (invoice.status !== InvoiceStatus.OVERDUE) {
            await (this.prisma as unknown as { invoice: any }).invoice.update({
              where: { id: invoice.id },
              data: { status: InvoiceStatus.OVERDUE }
            });
          }
        }
      }
      
      this.logger.log(`Processed ${overdueInvoices.length} overdue invoices for notifications`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Failed to process overdue invoice notifications: ${errorMessage}`, errorStack);
    }
  }
}
