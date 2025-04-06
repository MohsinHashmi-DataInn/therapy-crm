import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

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
  to: EmailRecipient | EmailRecipient[];
  subject: string;
  template?: string;
  templateData?: EmailTemplateData;
  html?: string;
  text?: string;
  cc?: EmailRecipient | EmailRecipient[];
  bcc?: EmailRecipient | EmailRecipient[];
  attachments?: EmailAttachment[];
  replyTo?: string;
}

/**
 * Service for sending email notifications
 */
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(private readonly mailerService: MailerService) {}

  /**
   * Send an email
   * @param options Email sending options
   * @returns Promise resolving to success boolean
   */
  async sendEmail(options: SendEmailOptions): Promise<boolean> {
    try {
      this.logger.log(`Sending email to ${typeof options.to === 'string' ? options.to : 'multiple recipients'}`);
      
      const to = Array.isArray(options.to) 
        ? options.to.map(recipient => this.formatRecipient(recipient)) 
        : this.formatRecipient(options.to);
      
      const cc = options.cc ? (Array.isArray(options.cc) 
        ? options.cc.map(recipient => this.formatRecipient(recipient)) 
        : this.formatRecipient(options.cc)) : undefined;
        
      const bcc = options.bcc ? (Array.isArray(options.bcc) 
        ? options.bcc.map(recipient => this.formatRecipient(recipient)) 
        : this.formatRecipient(options.bcc)) : undefined;

      const emailOptions: any = {
        to,
        subject: options.subject,
        ...(options.template && { template: options.template }),
        ...(options.templateData && { context: options.templateData }),
        ...(options.html && { html: options.html }),
        ...(options.text && { text: options.text }),
        ...(cc && { cc }),
        ...(bcc && { bcc }),
        ...(options.attachments && { attachments: options.attachments }),
        ...(options.replyTo && { replyTo: options.replyTo }),
      };

      await this.mailerService.sendMail(emailOptions);
      this.logger.log(`Email sent successfully to ${typeof to === 'string' ? to : 'multiple recipients'}`);
      return true;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Failed to send email: ${errorMessage}`, errorStack);
      throw new InternalServerErrorException(`Failed to send email: ${errorMessage}`);
    }
  }

  /**
   * Send a simple text email
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
   * Send an HTML email
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
   * Format recipient for email sending
   * @param recipient Email recipient
   * @returns Formatted recipient string
   */
  private formatRecipient(recipient: EmailRecipient): string {
    if (recipient.name) {
      return `"${recipient.name}" <${recipient.email}>`;
    }
    return recipient.email;
  }
}
