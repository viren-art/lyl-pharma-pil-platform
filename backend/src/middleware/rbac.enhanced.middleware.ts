import { Request, Response, NextFunction } from 'express';
import { RBACService, Permission } from '../services/auth/rbac/rbac.service';
import { logger } from '../utils/logger';

const rbacService = new RBACService();

/**
 * Middleware to require specific permission
 */
export function requirePermission(...permissions: Permission[]) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user?.id;

      if (!userId) {
        res.status(401).json({
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
            timestamp: new Date().toISOString(),
          },
        });
        return;
      }

      const hasPermission = await rbacService.hasAnyPermission(userId, permissions);

      if (!hasPermission) {
        logger.warn('Permission denied', {
          userId,
          requiredPermissions: permissions,
          path: req.path,
        });

        res.status(403).json({
          error: {
            code: 'FORBIDDEN',
            message: 'Insufficient permissions',
            requiredPermissions: permissions,
            timestamp: new Date().toISOString(),
          },
        });
        return;
      }

      next();
    } catch (error) {
      logger.error('Permission check failed', { error });
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Permission check failed',
          timestamp: new Date().toISOString(),
        },
      });
    }
  };
}

/**
 * Middleware to require specific role
 */
export function requireRole(...allowedRoles: string[]) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user?.id;

      if (!userId) {
        res.status(401).json({
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
            timestamp: new Date().toISOString(),
          },
        });
        return;
      }

      const hasRole = await rbacService.hasAnyRole(userId, allowedRoles);

      if (!hasRole) {
        logger.warn('Role check failed', {
          userId,
          requiredRoles: allowedRoles,
          path: req.path,
        });

        res.status(403).json({
          error: {
            code: 'FORBIDDEN',
            message: 'Insufficient role privileges',
            requiredRoles: allowedRoles,
            timestamp: new Date().toISOString(),
          },
        });
        return;
      }

      next();
    } catch (error) {
      logger.error('Role check failed', { error });
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Role check failed',
          timestamp: new Date().toISOString(),
        },
      });
    }
  };
}

/**
 * Middleware to check PIL access (tenant-scoped)
 */
export function requirePILAccess() {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user?.id;
      const pilId = parseInt(req.params.pilId || req.body.pilId);

      if (!userId) {
        res.status(401).json({
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
            timestamp: new Date().toISOString(),
          },
        });
        return;
      }

      if (!pilId) {
        res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'PIL ID required',
            timestamp: new Date().toISOString(),
          },
        });
        return;
      }

      const canAccess = await rbacService.canAccessPIL(userId, pilId);

      if (!canAccess) {
        logger.warn('PIL access denied', {
          userId,
          pilId,
          path: req.path,
        });

        res.status(403).json({
          error: {
            code: 'SUPPLIER_NOT_AUTHORIZED',
            message: 'Access denied to this PIL',
            pilId,
            timestamp: new Date().toISOString(),
          },
        });
        return;
      }

      next();
    } catch (error) {
      logger.error('PIL access check failed', { error });
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Access check failed',
          timestamp: new Date().toISOString(),
        },
      });
    }
  };
}