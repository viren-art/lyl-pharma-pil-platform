import { Repository } from 'typeorm';
import { AppDataSource } from '../../../config/database';
import { User } from '../../../models/user.model';
import { Tenant } from '../../../models/tenant.model';
import { logger } from '../../../utils/logger';

export enum Permission {
  // PIL permissions
  CREATE_PIL = 'create_pil',
  READ_PIL = 'read_pil',
  UPDATE_PIL = 'update_pil',
  DELETE_PIL = 'delete_pil',
  SUBMIT_PIL = 'submit_pil',

  // Translation permissions
  TRANSLATE_PIL = 'translate_pil',
  REVIEW_TRANSLATION = 'review_translation',
  APPROVE_TRANSLATION = 'approve_translation',

  // Approval permissions
  CREATE_APPROVAL_GATE = 'create_approval_gate',
  SUBMIT_APPROVAL = 'submit_approval',
  VIEW_APPROVAL_STATUS = 'view_approval_status',

  // Artwork permissions
  UPLOAD_ARTWORK = 'upload_artwork',
  REVIEW_ARTWORK = 'review_artwork',
  APPROVE_ARTWORK = 'approve_artwork',

  // Admin permissions
  MANAGE_USERS = 'manage_users',
  VIEW_AUDIT_LOGS = 'view_audit_logs',
  EXPORT_AUDIT_TRAIL = 'export_audit_trail',
}

interface RolePermissions {
  [role: string]: Permission[];
}

export class RBACService {
  private userRepository: Repository<User>;
  private tenantRepository: Repository<Tenant>;

  private rolePermissions: RolePermissions = {
    Translator: [
      Permission.READ_PIL,
      Permission.TRANSLATE_PIL,
      Permission.VIEW_APPROVAL_STATUS,
    ],
    Regulatory_Reviewer: [
      Permission.READ_PIL,
      Permission.UPDATE_PIL,
      Permission.REVIEW_TRANSLATION,
      Permission.SUBMIT_APPROVAL,
      Permission.VIEW_APPROVAL_STATUS,
      Permission.REVIEW_ARTWORK,
    ],
    Supplier: [
      Permission.READ_PIL,
      Permission.UPLOAD_ARTWORK,
      Permission.VIEW_APPROVAL_STATUS,
    ],
    Approver: [
      Permission.READ_PIL,
      Permission.APPROVE_TRANSLATION,
      Permission.APPROVE_ARTWORK,
      Permission.SUBMIT_APPROVAL,
      Permission.SUBMIT_PIL,
      Permission.VIEW_APPROVAL_STATUS,
      Permission.CREATE_APPROVAL_GATE,
    ],
    Admin: Object.values(Permission), // All permissions
  };

  constructor() {
    this.userRepository = AppDataSource.getRepository(User);
    this.tenantRepository = AppDataSource.getRepository(Tenant);
  }

  /**
   * Check if user has specific permission
   */
  async hasPermission(userId: number, permission: Permission): Promise<boolean> {
    try {
      const user = await this.userRepository.findOne({
        where: { id: userId },
      });

      if (!user || !user.isActive) {
        return false;
      }

      const rolePermissions = this.rolePermissions[user.role] || [];
      return rolePermissions.includes(permission);
    } catch (error) {
      logger.error('Failed to check permission', { error, userId, permission });
      return false;
    }
  }

  /**
   * Check if user has any of the specified permissions
   */
  async hasAnyPermission(userId: number, permissions: Permission[]): Promise<boolean> {
    for (const permission of permissions) {
      if (await this.hasPermission(userId, permission)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Check if user has all specified permissions
   */
  async hasAllPermissions(userId: number, permissions: Permission[]): Promise<boolean> {
    for (const permission of permissions) {
      if (!(await this.hasPermission(userId, permission))) {
        return false;
      }
    }
    return true;
  }

  /**
   * Check if user can access PIL (tenant-scoped)
   */
  async canAccessPIL(userId: number, pilId: number): Promise<boolean> {
    try {
      const user = await this.userRepository.findOne({
        where: { id: userId },
        relations: ['tenant'],
      });

      if (!user || !user.isActive) {
        return false;
      }

      // Admin can access all PILs
      if (user.role === 'Admin') {
        return true;
      }

      // Internal users (Lotus staff) can access all PILs
      if (user.tenant?.tenantType === 'internal') {
        return true;
      }

      // Suppliers can only access PILs assigned to them
      if (user.role === 'Supplier') {
        // Check if supplier is assigned to any revision round for this PIL
        const { RevisionRound } = await import('../../../models/revision-round.model');
        const revisionRoundRepository = AppDataSource.getRepository(RevisionRound);

        const assignedRevision = await revisionRoundRepository.findOne({
          where: {
            pilId,
            supplier: { tenant: { id: user.tenantId } },
          },
        });

        return !!assignedRevision;
      }

      return true;
    } catch (error) {
      logger.error('Failed to check PIL access', { error, userId, pilId });
      return false;
    }
  }

  /**
   * Get all permissions for user role
   */
  async getUserPermissions(userId: number): Promise<Permission[]> {
    try {
      const user = await this.userRepository.findOne({
        where: { id: userId },
      });

      if (!user || !user.isActive) {
        return [];
      }

      return this.rolePermissions[user.role] || [];
    } catch (error) {
      logger.error('Failed to get user permissions', { error, userId });
      return [];
    }
  }

  /**
   * Validate user has required role
   */
  async hasRole(userId: number, requiredRole: string): Promise<boolean> {
    try {
      const user = await this.userRepository.findOne({
        where: { id: userId },
      });

      return user?.isActive && user.role === requiredRole;
    } catch (error) {
      logger.error('Failed to check user role', { error, userId, requiredRole });
      return false;
    }
  }

  /**
   * Validate user has any of the required roles
   */
  async hasAnyRole(userId: number, requiredRoles: string[]): Promise<boolean> {
    try {
      const user = await this.userRepository.findOne({
        where: { id: userId },
      });

      return user?.isActive && requiredRoles.includes(user.role);
    } catch (error) {
      logger.error('Failed to check user roles', { error, userId, requiredRoles });
      return false;
    }
  }
}