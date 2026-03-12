import { Repository } from 'typeorm';
import { AppDataSource } from '../../../config/database';
import { User } from '../../../models/user.model';
import { Tenant } from '../../../models/tenant.model';
import { logger } from '../../../utils/logger';

export enum Permission {
  // PIL permissions
  CREATE_PIL = 'create_pil',
  VIEW_PIL = 'view_pil',
  UPDATE_PIL = 'update_pil',
  DELETE_PIL = 'delete_pil',
  SUBMIT_PIL = 'submit_pil',

  // Translation permissions
  TRANSLATE_PIL = 'translate_pil',
  REVIEW_TRANSLATION = 'review_translation',
  APPROVE_TRANSLATION = 'approve_translation',

  // Approval permissions
  APPROVE_PIL = 'approve_pil',
  REJECT_PIL = 'reject_pil',
  VIEW_APPROVALS = 'view_approvals',

  // Artwork permissions
  UPLOAD_ARTWORK = 'upload_artwork',
  REVIEW_ARTWORK = 'review_artwork',
  APPROVE_ARTWORK = 'approve_artwork',

  // AI Validation permissions
  VIEW_AI_VALIDATION = 'view_ai_validation',
  MANAGE_AI_VALIDATION = 'manage_ai_validation',
  EXPORT_VALIDATION_REPORTS = 'export_validation_reports',

  // Admin permissions
  MANAGE_USERS = 'manage_users',
  MANAGE_TENANTS = 'manage_tenants',
  VIEW_AUDIT_LOGS = 'view_audit_logs',
  EXPORT_AUDIT_LOGS = 'export_audit_logs',
}

interface RolePermissions {
  [role: string]: Permission[];
}

export class RBACService {
  private userRepository: Repository<User>;
  private tenantRepository: Repository<Tenant>;

  private rolePermissions: RolePermissions = {
    Translator: [
      Permission.VIEW_PIL,
      Permission.TRANSLATE_PIL,
      Permission.VIEW_AI_VALIDATION,
    ],
    Regulatory_Reviewer: [
      Permission.VIEW_PIL,
      Permission.REVIEW_TRANSLATION,
      Permission.APPROVE_TRANSLATION,
      Permission.VIEW_APPROVALS,
      Permission.VIEW_AI_VALIDATION,
      Permission.EXPORT_VALIDATION_REPORTS,
    ],
    Supplier: [
      Permission.VIEW_PIL,
      Permission.UPLOAD_ARTWORK,
      Permission.REVIEW_ARTWORK,
    ],
    Approver: [
      Permission.VIEW_PIL,
      Permission.APPROVE_PIL,
      Permission.REJECT_PIL,
      Permission.VIEW_APPROVALS,
      Permission.APPROVE_ARTWORK,
      Permission.VIEW_AI_VALIDATION,
      Permission.EXPORT_VALIDATION_REPORTS,
    ],
    Admin: Object.values(Permission),
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
        relations: ['tenant'],
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
      // This would require checking revision_rounds table
      // For now, simplified implementation
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
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      return [];
    }

    return this.rolePermissions[user.role] || [];
  }

  /**
   * Validate user has required role
   */
  async hasRole(userId: number, role: string): Promise<boolean> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    return user?.role === role;
  }

  /**
   * Validate user has any of the required roles
   */
  async hasAnyRole(userId: number, roles: string[]): Promise<boolean> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    return user ? roles.includes(user.role) : false;
  }
}