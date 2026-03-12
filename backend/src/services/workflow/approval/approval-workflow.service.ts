import { Repository } from 'typeorm';
import { AppDataSource } from '../../../config/database';
import { ApprovalGate, GateType, ApprovalStatus, RequiredRole } from '../../../models/approval-gate.model';
import { PIL } from '../../../models/pil.model';
import { User } from '../../../models/user.model';
import { AuditLogger } from '../../audit/audit-logger.enhanced';
import { NotificationService } from '../../notification/notification.service';
import { TemporalClient } from './temporal-client';
import { logger } from '../../../utils/logger';

interface CreateApprovalGateRequest {
  pilId: number;
  gateType: GateType;
  requiredRole: RequiredRole;
  assignedToId: number;
  revisionRoundId?: number;
  sequenceOrder?: number;
  isMandatory?: boolean;
}

interface SubmitApprovalRequest {
  gateId: number;
  decision: 'approved' | 'rejected';
  comments?: string;
  rejectionReason?: string;
  userId: number;
}

interface ApprovalWorkflowStatus {
  pilId: number;
  currentStatus: string;
  pendingGates: Array<{
    gateId: number;
    gateType: GateType;
    requiredRole: RequiredRole;
    assignedTo: string;
    createdAt: Date;
  }>;
  completedGates: Array<{
    gateId: number;
    gateType: GateType;
    approvedBy: string;
    approvedAt: Date;
  }>;
  canSubmit: boolean;
}

export class ApprovalWorkflowService {
  private approvalGateRepository: Repository<ApprovalGate>;
  private pilRepository: Repository<PIL>;
  private userRepository: Repository<User>;
  private auditLogger: AuditLogger;
  private notificationService: NotificationService;
  private temporalClient: TemporalClient;

  constructor() {
    this.approvalGateRepository = AppDataSource.getRepository(ApprovalGate);
    this.pilRepository = AppDataSource.getRepository(PIL);
    this.userRepository = AppDataSource.getRepository(User);
    this.auditLogger = new AuditLogger();
    this.notificationService = new NotificationService();
    this.temporalClient = new TemporalClient();
  }

  /**
   * Create approval gate for PIL workflow
   */
  async createApprovalGate(request: CreateApprovalGateRequest): Promise<ApprovalGate> {
    try {
      // Validate PIL exists
      const pil = await this.pilRepository.findOne({
        where: { id: request.pilId },
      });

      if (!pil) {
        throw new Error(`PIL ${request.pilId} not found`);
      }

      // Validate assigned user exists and has required role
      const assignedUser = await this.userRepository.findOne({
        where: { id: request.assignedToId },
      });

      if (!assignedUser) {
        throw new Error(`User ${request.assignedToId} not found`);
      }

      if (assignedUser.role !== request.requiredRole) {
        throw new Error(
          `User ${assignedUser.email} does not have required role ${request.requiredRole}`
        );
      }

      // Create approval gate
      const approvalGate = this.approvalGateRepository.create({
        pilId: request.pilId,
        gateType: request.gateType,
        requiredRole: request.requiredRole,
        assignedToId: request.assignedToId,
        revisionRoundId: request.revisionRoundId,
        sequenceOrder: request.sequenceOrder || 0,
        isMandatory: request.isMandatory !== false,
        status: ApprovalStatus.PENDING,
      });

      const savedGate = await this.approvalGateRepository.save(approvalGate);

      // Log audit event
      await this.auditLogger.logApprovalGateEvent({
        action: 'create',
        gateId: savedGate.id,
        pilId: request.pilId,
        gateType: request.gateType,
        assignedToId: request.assignedToId,
        userId: request.assignedToId,
      });

      // Send notification to assigned user
      await this.notificationService.sendApprovalAssignment({
        userId: request.assignedToId,
        gateId: savedGate.id,
        pilId: request.pilId,
        gateType: request.gateType,
      });

      // Start Temporal workflow for approval tracking
      await this.temporalClient.startApprovalWorkflow({
        gateId: savedGate.id,
        pilId: request.pilId,
        assignedToId: request.assignedToId,
      });

      logger.info('Approval gate created', {
        gateId: savedGate.id,
        pilId: request.pilId,
        gateType: request.gateType,
      });

      return savedGate;
    } catch (error) {
      logger.error('Failed to create approval gate', { error, request });
      throw error;
    }
  }

  /**
   * Submit approval decision (approve or reject)
   */
  async submitApproval(request: SubmitApprovalRequest): Promise<ApprovalGate> {
    try {
      const gate = await this.approvalGateRepository.findOne({
        where: { id: request.gateId },
        relations: ['pil', 'assignedTo'],
      });

      if (!gate) {
        throw new Error(`Approval gate ${request.gateId} not found`);
      }

      // Verify user is assigned to this gate
      if (gate.assignedToId !== request.userId) {
        throw new Error('User not authorized to approve this gate');
      }

      // Verify gate is still pending
      if (gate.status !== ApprovalStatus.PENDING) {
        throw new Error(`Gate already ${gate.status}`);
      }

      const beforeState = { ...gate };

      // Update gate status
      gate.status =
        request.decision === 'approved' ? ApprovalStatus.APPROVED : ApprovalStatus.REJECTED;
      gate.approvedAt = new Date();
      gate.comments = request.comments;
      gate.rejectionReason = request.rejectionReason;

      const updatedGate = await this.approvalGateRepository.save(gate);

      // Log audit event
      await this.auditLogger.logApprovalGateEvent({
        action: request.decision,
        gateId: gate.id,
        pilId: gate.pilId,
        gateType: gate.gateType,
        assignedToId: gate.assignedToId,
        userId: request.userId,
        comments: request.comments,
        rejectionReason: request.rejectionReason,
      });

      // Handle approval decision
      if (request.decision === 'approved') {
        await this.handleApproval(gate);
      } else {
        await this.handleRejection(gate, request.rejectionReason);
      }

      // Update Temporal workflow
      await this.temporalClient.completeApprovalWorkflow({
        gateId: gate.id,
        decision: request.decision,
      });

      logger.info('Approval decision submitted', {
        gateId: gate.id,
        pilId: gate.pilId,
        decision: request.decision,
      });

      return updatedGate;
    } catch (error) {
      logger.error('Failed to submit approval', { error, request });
      throw error;
    }
  }

  /**
   * Get approval workflow status for PIL
   */
  async getApprovalStatus(pilId: number): Promise<ApprovalWorkflowStatus> {
    try {
      const pil = await this.pilRepository.findOne({
        where: { id: pilId },
      });

      if (!pil) {
        throw new Error(`PIL ${pilId} not found`);
      }

      // Get all approval gates for this PIL
      const allGates = await this.approvalGateRepository.find({
        where: { pilId },
        relations: ['assignedTo'],
        order: { sequenceOrder: 'ASC', createdAt: 'ASC' },
      });

      const pendingGates = allGates
        .filter((gate) => gate.status === ApprovalStatus.PENDING)
        .map((gate) => ({
          gateId: gate.id,
          gateType: gate.gateType,
          requiredRole: gate.requiredRole,
          assignedTo: gate.assignedTo.email,
          createdAt: gate.createdAt,
        }));

      const completedGates = allGates
        .filter((gate) => gate.status === ApprovalStatus.APPROVED)
        .map((gate) => ({
          gateId: gate.id,
          gateType: gate.gateType,
          approvedBy: gate.assignedTo.email,
          approvedAt: gate.approvedAt!,
        }));

      // Check if all mandatory gates are approved
      const mandatoryGates = allGates.filter((gate) => gate.isMandatory);
      const canSubmit = mandatoryGates.every((gate) => gate.status === ApprovalStatus.APPROVED);

      return {
        pilId,
        currentStatus: pil.status,
        pendingGates,
        completedGates,
        canSubmit,
      };
    } catch (error) {
      logger.error('Failed to get approval status', { error, pilId });
      throw error;
    }
  }

  /**
   * Create multi-level approval workflow for PIL
   */
  async createMultiLevelWorkflow(
    pilId: number,
    workflowType: 'new_submission' | 'variation' | 'urgent'
  ): Promise<ApprovalGate[]> {
    try {
      const gates: ApprovalGate[] = [];

      // Define workflow sequences based on type
      const workflows = {
        new_submission: [
          { gateType: GateType.TRANSLATION, requiredRole: RequiredRole.TRANSLATOR },
          { gateType: GateType.REGULATORY, requiredRole: RequiredRole.REGULATORY_REVIEWER },
          { gateType: GateType.FINAL_SUBMISSION, requiredRole: RequiredRole.APPROVER },
        ],
        variation: [
          { gateType: GateType.REGULATORY, requiredRole: RequiredRole.REGULATORY_REVIEWER },
          { gateType: GateType.FINAL_SUBMISSION, requiredRole: RequiredRole.APPROVER },
        ],
        urgent: [
          { gateType: GateType.REGULATORY, requiredRole: RequiredRole.REGULATORY_REVIEWER },
          { gateType: GateType.APPROVER, requiredRole: RequiredRole.APPROVER },
        ],
      };

      const workflowSteps = workflows[workflowType];

      // Find users for each role
      for (let i = 0; i < workflowSteps.length; i++) {
        const step = workflowSteps[i];
        const user = await this.userRepository.findOne({
          where: { role: step.requiredRole, isActive: true },
        });

        if (!user) {
          throw new Error(`No active user found for role ${step.requiredRole}`);
        }

        const gate = await this.createApprovalGate({
          pilId,
          gateType: step.gateType,
          requiredRole: step.requiredRole,
          assignedToId: user.id,
          sequenceOrder: i,
          isMandatory: true,
        });

        gates.push(gate);
      }

      logger.info('Multi-level workflow created', {
        pilId,
        workflowType,
        gateCount: gates.length,
      });

      return gates;
    } catch (error) {
      logger.error('Failed to create multi-level workflow', { error, pilId, workflowType });
      throw error;
    }
  }

  /**
   * Check if PIL can be submitted (all mandatory gates approved)
   */
  async canSubmitPIL(pilId: number): Promise<boolean> {
    const status = await this.getApprovalStatus(pilId);
    return status.canSubmit;
  }

  /**
   * Handle approval - check if next gate should be triggered
   */
  private async handleApproval(gate: ApprovalGate): Promise<void> {
    // Send notification to approver
    await this.notificationService.sendApprovalConfirmation({
      userId: gate.assignedToId,
      gateId: gate.id,
      pilId: gate.pilId,
    });

    // Check if there are pending gates in sequence
    const nextGate = await this.approvalGateRepository.findOne({
      where: {
        pilId: gate.pilId,
        sequenceOrder: gate.sequenceOrder + 1,
        status: ApprovalStatus.PENDING,
      },
      relations: ['assignedTo'],
    });

    if (nextGate) {
      // Notify next approver
      await this.notificationService.sendApprovalAssignment({
        userId: nextGate.assignedToId,
        gateId: nextGate.id,
        pilId: gate.pilId,
        gateType: nextGate.gateType,
      });
    } else {
      // Check if all gates are approved
      const canSubmit = await this.canSubmitPIL(gate.pilId);
      if (canSubmit) {
        // Update PIL status to approved
        await this.pilRepository.update(gate.pilId, { status: 'approved' });

        // Notify submission team
        await this.notificationService.sendPILReadyForSubmission({
          pilId: gate.pilId,
        });
      }
    }
  }

  /**
   * Handle rejection - route back to appropriate stage
   */
  private async handleRejection(gate: ApprovalGate, rejectionReason?: string): Promise<void> {
    // Update PIL status to review
    await this.pilRepository.update(gate.pilId, { status: 'review' });

    // Determine who to notify based on gate type
    let notifyRole: RequiredRole;
    switch (gate.gateType) {
      case GateType.TRANSLATION:
        notifyRole = RequiredRole.TRANSLATOR;
        break;
      case GateType.REGULATORY:
        notifyRole = RequiredRole.REGULATORY_REVIEWER;
        break;
      case GateType.ARTWORK:
        notifyRole = RequiredRole.SUPPLIER;
        break;
      default:
        notifyRole = RequiredRole.TRANSLATOR;
    }

    // Find user with appropriate role
    const user = await this.userRepository.findOne({
      where: { role: notifyRole, isActive: true },
    });

    if (user) {
      await this.notificationService.sendRejectionNotification({
        userId: user.id,
        gateId: gate.id,
        pilId: gate.pilId,
        rejectionReason: rejectionReason || 'No reason provided',
      });
    }

    // Cancel pending gates in sequence
    await this.approvalGateRepository.update(
      {
        pilId: gate.pilId,
        sequenceOrder: gate.sequenceOrder + 1,
        status: ApprovalStatus.PENDING,
      },
      { status: ApprovalStatus.REJECTED }
    );
  }
}