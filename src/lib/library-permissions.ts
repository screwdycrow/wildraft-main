import { AccessRole } from '@prisma/client';

/**
 * Permission levels for library operations
 */
export const PERMISSION_LEVELS = {
  OWNER: 3,
  EDITOR: 2,
  VIEWER: 1,
} as const;

/**
 * Check if a role has permission to perform an operation
 */
export const hasPermission = (
  userRole: AccessRole,
  requiredRole: AccessRole
): boolean => {
  return PERMISSION_LEVELS[userRole] >= PERMISSION_LEVELS[requiredRole];
};

/**
 * Check if user can read the library
 */
export const canRead = (userRole: AccessRole): boolean => {
  return hasPermission(userRole, AccessRole.VIEWER);
};

/**
 * Check if user can edit the library
 */
export const canEdit = (userRole: AccessRole): boolean => {
  return hasPermission(userRole, AccessRole.EDITOR);
};

/**
 * Check if user is the owner
 */
export const isOwner = (userRole: AccessRole): boolean => {
  return userRole === AccessRole.OWNER;
};

/**
 * Check if user can manage access for a specific role
 * - OWNER can manage all roles (OWNER, EDITOR, VIEWER)
 * - EDITOR can manage VIEWER role only
 * - VIEWER cannot manage any access
 */
export const canManageRole = (
  userRole: AccessRole,
  targetRole: AccessRole
): boolean => {
  if (userRole === AccessRole.OWNER) {
    return true; // Owner can manage all roles
  }
  
  if (userRole === AccessRole.EDITOR && targetRole === AccessRole.VIEWER) {
    return true; // Editor can manage viewers
  }
  
  return false;
};

/**
 * Check if user can grant a specific role
 * Users can only grant roles equal to or lower than their own
 */
export const canGrantRole = (
  userRole: AccessRole,
  roleToGrant: AccessRole
): boolean => {
  return PERMISSION_LEVELS[userRole] >= PERMISSION_LEVELS[roleToGrant];
};

/**
 * Get allowed roles that a user can grant
 */
export const getAllowedRolesToGrant = (userRole: AccessRole): AccessRole[] => {
  switch (userRole) {
    case AccessRole.OWNER:
      return [AccessRole.OWNER, AccessRole.EDITOR, AccessRole.VIEWER];
    case AccessRole.EDITOR:
      return [AccessRole.VIEWER];
    case AccessRole.VIEWER:
      return [];
    default:
      return [];
  }
};

/**
 * Validate if a role transition is allowed
 * Used when updating existing access
 */
export const canChangeRole = (
  currentUserRole: AccessRole,
  currentTargetRole: AccessRole,
  newTargetRole: AccessRole
): boolean => {
  // Must be able to manage the current role
  if (!canManageRole(currentUserRole, currentTargetRole)) {
    return false;
  }
  
  // Must be able to grant the new role
  if (!canGrantRole(currentUserRole, newTargetRole)) {
    return false;
  }
  
  return true;
};






