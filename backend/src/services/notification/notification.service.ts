import { Repository } from 'typeorm';
import { AppDataSource } from '../../config/database';
import { User } from '../../models/user.model';
import { logger } from '../../utils/logger';

interface ApprovalAssignmentNotification {
  userId: number;
  gateId: number;
  pilId: number;
  gateType: string;
}

interface ApprovalConfirmationNotification {
  userId: number;
  gateId: number;
  pilId: number;
}

interface RejectionNotification {
  userId: number;
  gateId: number;
  pilId: number;
  rejectionReason: string;
}

interface PILReadyNotification {
  pilId: number;
}

export class NotificationService {
  private userRepository: Repository<User>;

  constructor() {
    this.userRepository = AppDataSource.getRepository(User);
  }

  async sendApprovalAssignment(notification: ApprovalAssignmentNotification): Promise<void> {
    try {
      const user = await this.userRepository.findOne({
        where: { id: notification.userId },
      });

      if (!user) {
        throw new Error(`User ${notification.userId} not found`);
      }

      // In production, this would send email via SES or push notification
      logger.info('Approval assignment notification sent', {
        email: user.email,
        gateId: notification.gateId,
        pilId: notification.pilId,
        gateType: notification.gateType,
      });

      // Mock email content
      const emailContent = {
        to: user.email,
        subject: `New Approval Required: PIL ${notification.pilId}`,
        body: `You have been assigned to approve ${notification.gateType} for PIL ${notification.pilId}. Please review and submit your decision.`,
      };

      // TODO: Integrate with AWS SES or email service
      logger.debug('Email content', emailContent);
    } catch (error) {
      logger.error('Failed to send approval assignment notification', { error, notification });
    }
  }

  async sendApprovalConfirmation(notification: ApprovalConfirmationNotification): Promise<void> {
    try {
      const user = await this.userRepository.findOne({
        where: { id: notification.userId },
      });

      if (!user) {
        throw new Error(`User ${notification.userId} not found`);
      }

      logger.info('Approval confirmation notification sent', {
        email: user.email,
        gateId: notification.gateId,
        pilId: notification.pilId,
      });

      const emailContent = {
        to: user.email,
        subject: `Approval Confirmed: PIL ${notification.pilId}`,
        body: `Your approval for PIL ${notification.pilId} has been recorded. Thank you.`,
      };

      logger.debug('Email content', emailContent);
    } catch (error) {
      logger.error('Failed to send approval confirmation notification', { error, notification });
    }
  }

  async sendRejectionNotification(notification: RejectionNotification): Promise<void> {
    try {
      const user = await this.userRepository.findOne({
        where: { id: notification.userId },
      });

      if (!user) {
        throw new Error(`User ${notification.userId} not found`);
      }

      logger.info('Rejection notification sent', {
        email: user.email,
        gateId: notification.gateId,
        pilId: notification.pilId,
      });

      const emailContent = {
        to: user.email,
        subject: `PIL ${notification.pilId} Rejected - Revision Required`,
        body: `PIL ${notification.pilId} has been rejected. Reason: ${notification.rejectionReason}. Please revise and resubmit.`,
      };

      logger.debug('Email content', emailContent);
    } catch (error) {
      logger.error('Failed to send rejection notification', { error, notification });
    }
  }

  async sendPILReadyForSubmission(notification: PILReadyNotification): Promise<void> {
    try {
      // Find all approvers
      const approvers = await this.userRepository.find({
        where: { role: 'Approver', isActive: true },
      });

      logger.info('PIL ready for submission notification sent', {
        pilId: notification.pilId,
        recipientCount: approvers.length,
      });

      for (const approver of approvers) {
        const emailContent = {
          to: approver.email,
          subject: `PIL ${notification.pilId} Ready for Regulatory Submission`,
          body: `All approval gates have been completed for PIL ${notification.pilId}. The submission package can now be generated.`,
        };

        logger.debug('Email content', emailContent);
      }
    } catch (error) {
      logger.error('Failed to send PIL ready notification', { error, notification });
    }
  }
}