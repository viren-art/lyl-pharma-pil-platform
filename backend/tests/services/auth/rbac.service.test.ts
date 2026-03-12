import { RBACService, Permission } from '../../../src/services/auth/rbac/rbac.service';
import { AppDataSource } from '../../../src/config/database';
import { User } from '../../../src/models/user.model';
import { Tenant } from '../../../src/models/tenant.model';

describe('RBACService', () => {
  let service: RBACService;
  let userRepository: any;
  let tenantRepository: any;

  beforeAll(async () => {
    await AppDataSource.initialize();
    service = new RBACService();
    userRepository = AppDataSource.getRepository(User);
    tenantRepository = AppDataSource.getRepository(Tenant);
  });

  afterAll(async () => {
    await AppDataSource.destroy();
  });

  describe('hasPermission', () => {
    it('should return true for Translator with TRANSLATE_PIL permission', async () => {
      const user = await userRepository.save({
        email: 'translator@test.com',
        fullName: 'Test Translator',
        role: 'Translator',
        isActive: true,
      });

      const hasPermission = await service.hasPermission(user.id, Permission.TRANSLATE_PIL);
      expect(hasPermission).toBe(true);
    });

    it('should return false for Translator with SUBMIT_PIL permission', async () => {
      const user = await userRepository.save({
        email: 'translator2@test.com',
        fullName: 'Test Translator 2',
        role: 'Translator',
        isActive: true,
      });

      const hasPermission = await service.hasPermission(user.id, Permission.SUBMIT_PIL);
      expect(hasPermission).toBe(false);
    });

    it('should return true for Admin with any permission', async () => {
      const user = await userRepository.save({
        email: 'admin@test.com',
        fullName: 'Test Admin',
        role: 'Admin',
        isActive: true,
      });

      const hasPermission = await service.hasPermission(user.id, Permission.MANAGE_USERS);
      expect(hasPermission).toBe(true);
    });

    it('should return false for inactive user', async () => {
      const user = await userRepository.save({
        email: 'inactive@test.com',
        fullName: 'Inactive User',
        role: 'Approver',
        isActive: false,
      });

      const hasPermission = await service.hasPermission(user.id, Permission.SUBMIT_APPROVAL);
      expect(hasPermission).toBe(false);
    });
  });

  describe('canAccessPIL', () => {
    it('should allow internal users to access any PIL', async () => {
      const tenant = await tenantRepository.save({
        name: 'Lotus Pharmaceutical',
        tenantType: 'internal',
      });

      const user = await userRepository.save({
        email: 'internal@lotus.com',
        fullName: 'Internal User',
        role: 'Regulatory_Reviewer',
        tenantId: tenant.id,
        isActive: true,
      });

      const canAccess = await service.canAccessPIL(user.id, 123);
      expect(canAccess).toBe(true);
    });

    it('should allow Admin to access any PIL', async () => {
      const user = await userRepository.save({
        email: 'admin2@test.com',
        fullName: 'Admin User',
        role: 'Admin',
        isActive: true,
      });

      const canAccess = await service.canAccessPIL(user.id, 456);
      expect(canAccess).toBe(true);
    });
  });
});