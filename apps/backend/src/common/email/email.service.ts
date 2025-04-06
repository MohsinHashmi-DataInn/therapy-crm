import { Injectable, Logger } from '@nestjs/common';

/**
 * Email template data interface
 */
export interface EmailTemplateData {
  [key: string]: any;
}

/**
 * Email recipient interface
 */
export interface EmailRecipient {
  email: string;
  name?: string;
}

/**
 * Email attachment interface
 */
export interface EmailAttachment {
  filename: string;
  content: Buffer | string;
  contentType?: string;
}

/**
 * Email sending options interface
 */
export interface SendEmailOptions {
  to: string | EmailRecipient | (string | EmailRecipient)[];
  subject: string;
  text?: string;
  html?: string;
  template?: string;
  context?: EmailTemplateData;
  attachments?: EmailAttachment[];
  cc?: string | EmailRecipient | (string | EmailRecipient)[];
  bcc?: string | EmailRecipient | (string | EmailRecipient)[];
}

/**
 * Service for sending email notifications
 * MOCK IMPLEMENTATION FOR DEVELOPMENT
 */
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor() {
    this.logger.log('Mock EmailService initialized');
  }

  /**
   * Send an email - MOCK IMPLEMENTATION
   * @param options Email sending options
   * @returns Promise resolving to success boolean
   */
  async sendEmail(options: SendEmailOptions): Promise<boolean> {
    this.logger.log(`[MOCK] Would send email to: ${JSON.stringify(options.to)}`);
    this.logger.log(`[MOCK] Subject: ${options.subject}`);
    
    if (options.text) {
      this.logger.log(`[MOCK] Text content: ${options.text.substring(0, 50)}...`);
    }
    
    if (options.html) {
      this.logger.log(`[MOCK] HTML content available (not shown)`);
    }
    
    if (options.attachments) {
      this.logger.log(`[MOCK] Attachments: ${options.attachments.length}`);
    }
    
    return true;
  }

  /**
   * Send a simple text email - MOCK IMPLEMENTATION
   * @param to Recipient email or recipient object
   * @param subject Email subject
   * @param text Email text content
   * @returns Promise resolving to success boolean
   */
  async sendTextEmail(to: string | EmailRecipient, subject: string, text: string): Promise<boolean> {
    const recipient = typeof to === 'string' ? { email: to } : to;
    return this.sendEmail({
      to: recipient,
      subject,
      text,
    });
  }

  /**
   * Send an HTML email - MOCK IMPLEMENTATION
   * @param to Recipient email or recipient object
   * @param subject Email subject
   * @param html Email HTML content
   * @returns Promise resolving to success boolean
   */
  async sendHtmlEmail(to: string | EmailRecipient, subject: string, html: string): Promise<boolean> {
    const recipient = typeof to === 'string' ? { email: to } : to;
    return this.sendEmail({
      to: recipient,
      subject,
      html,
    });
  }

  /**
   * Helper method to format a recipient for display in logs
   * @param recipient String or EmailRecipient object
   * @returns Formatted recipient string
   */
  private formatRecipient(recipient: string | EmailRecipient): string {
    if (typeof recipient === 'string') {
      return recipient;
    }
    
    if (recipient.name) {
      return `${recipient.name} <${recipient.email}>`;
    }
    
    return recipient.email;
  }
}
