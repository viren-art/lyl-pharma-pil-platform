import { Connection, Client, WorkflowClient } from '@temporalio/client';
import { logger } from '../../../utils/logger';

interface StartApprovalWorkflowRequest {
  gateId: number;
  pilId: number;
  assignedToId: number;
}

interface CompleteApprovalWorkflowRequest {
  gateId: number;
  decision: 'approved' | 'rejected';
}

export class TemporalClient {
  private client: Client | null = null;
  private workflowClient: WorkflowClient | null = null;

  constructor() {
    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      const connection = await Connection.connect({
        address: process.env.TEMPORAL_ADDRESS || 'localhost:7233',
      });

      this.client = new Client({ connection });
      this.workflowClient = new WorkflowClient({ connection });

      logger.info('Temporal client initialized');
    } catch (error) {
      logger.error('Failed to initialize Temporal client', { error });
      // In development, continue without Temporal
      if (process.env.NODE_ENV !== 'production') {
        logger.warn('Running without Temporal in development mode');
      } else {
        throw error;
      }
    }
  }

  /**
   * Start approval workflow with durable execution
   */
  async startApprovalWorkflow(request: StartApprovalWorkflowRequest): Promise<string> {
    if (!this.workflowClient) {
      logger.warn('Temporal client not available, skipping workflow start');
      return `mock-workflow-${request.gateId}`;
    }

    try {
      const workflowId = `approval-gate-${request.gateId}`;

      const handle = await this.workflowClient.start('approvalWorkflow', {
        taskQueue: 'approval-queue',
        workflowId,
        args: [
          {
            gateId: request.gateId,
            pilId: request.pilId,
            assignedToId: request.assignedToId,
            startTime: new Date().toISOString(),
          },
        ],
        workflowExecutionTimeout: '30 days', // 20-day artwork cycle + buffer
        workflowRunTimeout: '30 days',
      });

      logger.info('Approval workflow started', {
        workflowId,
        gateId: request.gateId,
      });

      return workflowId;
    } catch (error) {
      logger.error('Failed to start approval workflow', { error, request });
      throw error;
    }
  }

  /**
   * Complete approval workflow
   */
  async completeApprovalWorkflow(request: CompleteApprovalWorkflowRequest): Promise<void> {
    if (!this.workflowClient) {
      logger.warn('Temporal client not available, skipping workflow completion');
      return;
    }

    try {
      const workflowId = `approval-gate-${request.gateId}`;

      const handle = this.workflowClient.getHandle(workflowId);

      await handle.signal('approvalDecision', {
        decision: request.decision,
        timestamp: new Date().toISOString(),
      });

      logger.info('Approval workflow completed', {
        workflowId,
        decision: request.decision,
      });
    } catch (error) {
      logger.error('Failed to complete approval workflow', { error, request });
      throw error;
    }
  }

  /**
   * Query approval workflow status
   */
  async getWorkflowStatus(gateId: number): Promise<any> {
    if (!this.workflowClient) {
      return { status: 'unknown', message: 'Temporal client not available' };
    }

    try {
      const workflowId = `approval-gate-${gateId}`;
      const handle = this.workflowClient.getHandle(workflowId);

      const status = await handle.query('getStatus');
      return status;
    } catch (error) {
      logger.error('Failed to query workflow status', { error, gateId });
      throw error;
    }
  }
}