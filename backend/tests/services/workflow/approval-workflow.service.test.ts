import { ApprovalWorkflowService } from '../../../src/services/workflow/approval/approval-workflow.service';
import { AppDataSource } from '../../../src/config/database';
import { ApprovalGate, GateType, ApprovalStatus, RequiredRole } from '../../../src/models/approval-gate.model';
import { PIL } from '../../../src/models/pil.model';
import { User } from '../../../src/models/user.model';

describe('ApprovalWorkflowService', () => {
  let service: ApprovalWorkflowService;
  let pilRepository: any;
  let approvalGateRepository: any;
  let userRepository: any;

  beforeAll(async () => {
    await AppDataSource.initialize();
    service = new ApprovalWorkflowService();
    pilRepository = AppDataSource.getRepository(PIL);
    approvalGateRepository = AppDataSource.getRepository(ApprovalGate);
    userRepository = AppDataSource.getRepository(User);
  });

  afterAll(async () => {
    await AppDataSource.destroy();
  });

  describe('createApprovalGate', () => {
    it('should create approval gate with correct attributes', async () => {
      const pil = await pilRepository.save({
        productName: 'Test Product',
        market: 'TFDA',
        status: 'draft',
        sourceType: 'innovator',
        createdById: 1,
      });

      const user = await userRepository.save({
        email: 'reviewer@test.com',
        fullName: 'Test Reviewer',
        role: RequiredRole.REGULATORY_REVIEWER,
        isActive: true,
      });

      const gate = await service.createApprovalGate({
        pilId: pil.id,
        gateType: GateType.REGULATORY,
        requiredRole: RequiredRole.REGULATORY_REVIEWER,
        assignedToId: user.id,
      });

      expect(gate.pilId).toBe(pil.id);
      expect(gate.gateType).toBe(GateType.REGULATORY);
      expect(gate.status).toBe(ApprovalStatus.PENDING);
      expect(gate.isMandatory).toBe(true);
    });

    it('should throw error if user does not have required role', async () => {
      const pil = await pilRepository.save({
        productName: 'Test Product',
        market: 'TFDA',
        status: 'draft',
        sourceType: 'innovator',
        createdById: 1,
      });

      const user = await userRepository.save({
        email: 'translator@test.com',
        fullName: 'Test Translator',
        role: RequiredRole.TRANSLATOR,
        isActive: true,
      });

      await expect(
        service.createApprovalGate({
          pilId: pil.id,
          gateType: GateType.REGULATORY,
          requiredRole: RequiredRole.REGULATORY_REVIEWER,
          assignedToId: user.id,
        })
      ).rejects.toThrow('does not have required role');
    });
  });

  describe('submitApproval', () => {
    it('should approve gate and update status', async () => {
      const pil = await pilRepository.save({
        productName: 'Test Product',
        market: 'TFDA',
        status: 'review',
        sourceType: 'innovator',
        createdById: 1,
      });

      const user = await userRepository.save({
        email: 'approver@test.com',
        fullName: 'Test Approver',
        role: RequiredRole.APPROVER,
        isActive: true,
      });

      const gate = await approvalGateRepository.save({
        pilId: pil.id,
        gateType: GateType.FINAL_SUBMISSION,
        requiredRole: RequiredRole.APPROVER,
        assignedToId: user.id,
        status: ApprovalStatus.PENDING,
      });

      const result = await service.submitApproval({
        gateId: gate.id,
        decision: 'approved',
        comments: 'Looks good',
        userId: user.id,
      });

      expect(result.status).toBe(ApprovalStatus.APPROVED);
      expect(result.approvedAt).toBeDefined();
      expect(result.comments).toBe('Looks good');
    });

    it('should reject gate and capture rejection reason', async () => {
      const pil = await pilRepository.save({
        productName: 'Test Product',
        market: 'TFDA',
        status: 'review',
        sourceType: 'innovator',
        createdById: 1,
      });

      const user = await userRepository.save({
        email: 'reviewer2@test.com',
        fullName: 'Test Reviewer 2',
        role: RequiredRole.REGULATORY_REVIEWER,
        isActive: true,
      });

      const gate = await approvalGateRepository.save({
        pilId: pil.id,
        gateType: GateType.REGULATORY,
        requiredRole: RequiredRole.REGULATORY_REVIEWER,
        assignedToId: user.id,
        status: ApprovalStatus.PENDING,
      });

      const result = await service.submitApproval({
        gateId: gate.id,
        decision: 'rejected',
        rejectionReason: 'Dosage information incomplete',
        userId: user.id,
      });

      expect(result.status).toBe(ApprovalStatus.REJECTED);
      expect(result.rejectionReason).toBe('Dosage information incomplete');
    });

    it('should throw error if user not authorized', async () => {
      const gate = await approvalGateRepository.save({
        pilId: 1,
        gateType: GateType.REGULATORY,
        requiredRole: RequiredRole.REGULATORY_REVIEWER,
        assignedToId: 1,
        status: ApprovalStatus.PENDING,
      });

      await expect(
        service.submitApproval({
          gateId: gate.id,
          decision: 'approved',
          userId: 999, // Different user
        })
      ).rejects.toThrow('not authorized');
    });
  });

  describe('createMultiLevelWorkflow', () => {
    it('should create new_submission workflow with 3 gates', async () => {
      const pil = await pilRepository.save({
        productName: 'Test Product',
        market: 'TFDA',
        status: 'draft',
        sourceType: 'innovator',
        createdById: 1,
      });

      // Create users for each role
      await userRepository.save([
        {
          email: 'translator@test.com',
          fullName: 'Translator',
          role: RequiredRole.TRANSLATOR,
          isActive: true,
        },
        {
          email: 'reviewer@test.com',
          fullName: 'Reviewer',
          role: RequiredRole.REGULATORY_REVIEWER,
          isActive: true,
        },
        {
          email: 'approver@test.com',
          fullName: 'Approver',
          role: RequiredRole.APPROVER,
          isActive: true,
        },
      ]);

      const gates = await service.createMultiLevelWorkflow(pil.id, 'new_submission');

      expect(gates).toHaveLength(3);
      expect(gates[0].gateType).toBe(GateType.TRANSLATION);
      expect(gates[1].gateType).toBe(GateType.REGULATORY);
      expect(gates[2].gateType).toBe(GateType.FINAL_SUBMISSION);
      expect(gates[0].sequenceOrder).toBe(0);
      expect(gates[1].sequenceOrder).toBe(1);
      expect(gates[2].sequenceOrder).toBe(2);
    });

    it('should create variation workflow with 2 gates', async () => {
      const pil = await pilRepository.save({
        productName: 'Test Product',
        market: 'TFDA',
        status: 'draft',
        sourceType: 'variation',
        createdById: 1,
      });

      const gates = await service.createMultiLevelWorkflow(pil.id, 'variation');

      expect(gates).toHaveLength(2);
      expect(gates[0].gateType).toBe(GateType.REGULATORY);
      expect(gates[1].gateType).toBe(GateType.FINAL_SUBMISSION);
    });
  });

  describe('canSubmitPIL', () => {
    it('should return true when all mandatory gates approved', async () => {
      const pil = await pilRepository.save({
        productName: 'Test Product',
        market: 'TFDA',
        status: 'review',
        sourceType: 'innovator',
        createdById: 1,
      });

      await approvalGateRepository.save([
        {
          pilId: pil.id,
          gateType: GateType.TRANSLATION,
          requiredRole: RequiredRole.TRANSLATOR,
          assignedToId: 1,
          status: ApprovalStatus.APPROVED,
          isMandatory: true,
        },
        {
          pilId: pil.id,
          gateType: GateType.REGULATORY,
          requiredRole: RequiredRole.REGULATORY_REVIEWER,
          assignedToId: 2,
          status: ApprovalStatus.APPROVED,
          isMandatory: true,
        },
      ]);

      const canSubmit = await service.canSubmitPIL(pil.id);
      expect(canSubmit).toBe(true);
    });

    it('should return false when mandatory gates pending', async () => {
      const pil = await pilRepository.save({
        productName: 'Test Product',
        market: 'TFDA',
        status: 'review',
        sourceType: 'innovator',
        createdById: 1,
      });

      await approvalGateRepository.save([
        {
          pilId: pil.id,
          gateType: GateType.TRANSLATION,
          requiredRole: RequiredRole.TRANSLATOR,
          assignedToId: 1,
          status: ApprovalStatus.APPROVED,
          isMandatory: true,
        },
        {
          pilId: pil.id,
          gateType: GateType.REGULATORY,
          requiredRole: RequiredRole.REGULATORY_REVIEWER,
          assignedToId: 2,
          status: ApprovalStatus.PENDING,
          isMandatory: true,
        },
      ]);

      const canSubmit = await service.canSubmitPIL(pil.id);
      expect(canSubmit).toBe(false);
    });
  });
});