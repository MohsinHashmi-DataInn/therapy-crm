import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';

/**
 * Interface for notification payload data
 */
interface NotificationData {
  recipientId: BigInt;
  notificationType: string;
  templateData: Record<string, any>;
}

/**
 * Interface for notification delivery channels
 */
interface NotificationChannels {
  email: boolean;
  sms: boolean;
  inApp: boolean;
}

/**
 * Service for sending notifications through various channels
 * Handles CASL compliance for user communication preferences
 */
@Injectable()
export class NotificationSenderService {
  private readonly logger = new Logger(NotificationSenderService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Send a notification to a user through their preferred channels
   * Only sends through channels the user has opted into (CASL compliance)
   * 
   * @param notificationData Data for the notification
   * @returns Object with results of sending through each channel
   */
  async sendNotification(notificationData: NotificationData) {
    try {
      const { recipientId, notificationType, templateData } = notificationData;
      
      // Get user's notification preferences
      const userPreferences = await this.getUserNotificationPreferences(recipientId);
      
      // Get notification type preferences for this specific notification type
      const typePreferences = await this.getNotificationTypePreferences(recipientId, notificationType);
      
      // Combine general preferences with notification-specific preferences
      const channels = this.determineNotificationChannels(userPreferences, typePreferences);
      
      // Get notification template
      const template = await this.getNotificationTemplate(notificationType);
      
      // Results container
      const results = {
        email: false,
        sms: false,
        inApp: false,
      };
      
      // Process each channel based on user preferences
      if (channels.email) {
        results.email = await this.sendEmailNotification(
          recipientId,
          template.email_subject,
          template.email_body,
          templateData,
        );
      }
      
      if (channels.sms) {
        results.sms = await this.sendSmsNotification(
          recipientId,
          template.sms_body,
          templateData,
        );
      }
      
      if (channels.inApp) {
        results.inApp = await this.createInAppNotification(
          recipientId,
          notificationType,
          template.email_subject,
          templateData,
        );
      }
      
      // Log the notification
      await this.logNotification(
        recipientId,
        notificationType,
        channels,
        results,
        templateData,
      );
      
      return results;
    } catch (error) {
      this.logger.error(`Failed to send notification: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get user's general notification preferences
   * @param userId User ID
   * @returns User's notification preferences
   */
  private async getUserNotificationPreferences(userId: BigInt) {
    try {
      // First check if user has custom preferences
      const userPrefs = await this.prisma.notification_preferences.findUnique({
        where: { user_id: userId },
      });
      
      if (userPrefs) {
        return userPrefs;
      }
      
      // If no custom preferences, return system defaults
      return {
        email_notifications: true,
        sms_notifications: false,
        in_app_notifications: true,
      };
    } catch (error) {
      this.logger.error(`Failed to get user notification preferences: ${error.message}`, error.stack);
      // Default to only email if error occurs (most conservative option)
      return {
        email_notifications: true,
        sms_notifications: false,
        in_app_notifications: false,
      };
    }
  }

  /**
   * Get user's preferences for a specific notification type
   * @param userId User ID
   * @param notificationType Type of notification
   * @returns Type-specific notification preferences
   */
  private async getNotificationTypePreferences(userId: BigInt, notificationType: string) {
    try {
      const typePrefs = await this.prisma.notification_type_preferences.findFirst({
        where: {
          user_id: userId,
          notification_type: notificationType,
        },
      });
      
      return typePrefs;
    } catch (error) {
      this.logger.error(
        `Failed to get notification type preferences: ${error.message}`,
        error.stack,
      );
      return null;
    }
  }

  /**
   * Combine general and type-specific preferences to determine which channels to use
   * @param userPreferences General user preferences
   * @param typePreferences Type-specific preferences
   * @returns Active notification channels
   */
  private determineNotificationChannels(
    userPreferences: any,
    typePreferences: any,
  ): NotificationChannels {
    // Start with user's general preferences
    const channels = {
      email: userPreferences.email_notifications,
      sms: userPreferences.sms_notifications,
      inApp: userPreferences.in_app_notifications,
    };
    
    // If type-specific preferences exist, they override general preferences
    if (typePreferences) {
      if (typePreferences.email_enabled !== null) {
        channels.email = typePreferences.email_enabled;
      }
      
      if (typePreferences.sms_enabled !== null) {
        channels.sms = typePreferences.sms_enabled;
      }
      
      if (typePreferences.in_app_enabled !== null) {
        channels.inApp = typePreferences.in_app_enabled;
      }
    }
    
    return channels;
  }

  /**
   * Get notification template for the specified notification type
   * @param notificationType Type of notification
   * @returns Notification template
   */
  private async getNotificationTemplate(notificationType: string) {
    try {
      const template = await this.prisma.notification_templates.findFirst({
        where: { notification_type: notificationType },
      });
      
      if (!template) {
        throw new Error(`No template found for notification type: ${notificationType}`);
      }
      
      return template;
    } catch (error) {
      this.logger.error(`Failed to get notification template: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Send an email notification
   * @param userId Recipient user ID
   * @param subject Email subject
   * @param bodyTemplate Email body template
   * @param templateData Data to populate the template
   * @returns Success status
   */
  private async sendEmailNotification(
    userId: BigInt,
    subject: string,
    bodyTemplate: string,
    templateData: Record<string, any>,
  ) {
    try {
      // Get user's email
      const user = await this.prisma.users.findUnique({
        where: { id: userId },
        select: { email: true, first_name: true, last_name: true },
      });
      
      if (!user || !user.email) {
        throw new Error(`User ${userId} has no email address`);
      }
      
      // Process the templates with the data
      const processedSubject = this.processTemplate(subject, {
        ...templateData,
        user_first_name: user.first_name,
        user_last_name: user.last_name,
      });
      
      const processedBody = this.processTemplate(bodyTemplate, {
        ...templateData,
        user_first_name: user.first_name,
        user_last_name: user.last_name,
      });
      
      // In a real implementation, this would call an email sending service
      // For now, we'll just log it
      this.logger.log(
        `[EMAIL NOTIFICATION] To: ${user.email}, Subject: ${processedSubject}`,
      );
      
      // Return success (in a real implementation, this would come from the email service)
      return true;
    } catch (error) {
      this.logger.error(`Failed to send email notification: ${error.message}`, error.stack);
      return false;
    }
  }

  /**
   * Send an SMS notification
   * @param userId Recipient user ID
   * @param bodyTemplate SMS body template
   * @param templateData Data to populate the template
   * @returns Success status
   */
  private async sendSmsNotification(
    userId: BigInt,
    bodyTemplate: string,
    templateData: Record<string, any>,
  ) {
    try {
      // Get user's phone number
      const user = await this.prisma.users.findUnique({
        where: { id: userId },
        select: { phone: true, first_name: true, last_name: true },
      });
      
      if (!user || !user.phone) {
        throw new Error(`User ${userId} has no phone number`);
      }
      
      // Process the template with the data
      const processedBody = this.processTemplate(bodyTemplate, {
        ...templateData,
        user_first_name: user.first_name,
        user_last_name: user.last_name,
      });
      
      // In a real implementation, this would call an SMS sending service
      // For now, we'll just log it
      this.logger.log(
        `[SMS NOTIFICATION] To: ${user.phone}, Message: ${processedBody}`,
      );
      
      // Return success (in a real implementation, this would come from the SMS service)
      return true;
    } catch (error) {
      this.logger.error(`Failed to send SMS notification: ${error.message}`, error.stack);
      return false;
    }
  }

  /**
   * Create an in-app notification
   * @param userId Recipient user ID
   * @param notificationType Type of notification
   * @param title Notification title
   * @param templateData Additional data
   * @returns Success status
   */
  private async createInAppNotification(
    userId: BigInt,
    notificationType: string,
    title: string,
    templateData: Record<string, any>,
  ) {
    try {
      // Process the title with template data
      const processedTitle = this.processTemplate(title, templateData);
      
      // Create in-app notification record
      // In a real implementation, this would create a notification in the system
      // For now, we'll just log it
      this.logger.log(
        `[IN-APP NOTIFICATION] User: ${userId}, Type: ${notificationType}, Title: ${processedTitle}`,
      );
      
      // Return success
      return true;
    } catch (error) {
      this.logger.error(`Failed to create in-app notification: ${error.message}`, error.stack);
      return false;
    }
  }

  /**
   * Log the notification for audit and tracking purposes
   * @param userId User who received the notification
   * @param notificationType Type of notification
   * @param channels Channels attempted
   * @param results Success status for each channel
   * @param data Context data
   * @returns Created log entry
   */
  private async logNotification(
    userId: BigInt,
    notificationType: string,
    channels: NotificationChannels,
    results: Record<string, boolean>,
    data: Record<string, any>,
  ) {
    try {
      return await this.prisma.notification_logs.create({
        data: {
          user_id: userId,
          notification_type: notificationType,
          email_sent: channels.email,
          email_success: results.email,
          sms_sent: channels.sms,
          sms_success: results.sms,
          in_app_sent: channels.inApp,
          in_app_success: results.inApp,
          context_data: JSON.stringify(data),
          sent_at: new Date(),
        },
      });
    } catch (error) {
      this.logger.error(`Failed to log notification: ${error.message}`, error.stack);
      // Continue despite logging error - this shouldn't prevent the notification from being sent
    }
  }

  /**
   * Process a template string with provided data
   * Replaces {{variable}} placeholders with actual values
   * @param template Template string with placeholders
   * @param data Data to inject into the template
   * @returns Processed template
   */
  private processTemplate(template: string, data: Record<string, any>): string {
    let result = template;
    
    // Replace all placeholders with their values
    for (const [key, value] of Object.entries(data)) {
      const placeholder = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      result = result.replace(placeholder, String(value));
    }
    
    return result;
  }
}
