import { AccessRole } from '@prisma/client';

/**
 * Permission levels for library operations.
 * PLAYER is level 0: players are library members but do NOT satisfy any
 * VIEWER/EDITOR/OWNER gate — they only see content explicitly shared with
 * them (ItemAccess / DmScreenAccess / PortalViewAccess).
 */
export const PERMISSION_LEVELS = {
  OWNER: 3,
  EDITOR: 2,
  VIEWER: 1,
  PLAYER: 0,
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
 * - OWNER can manage all roles (OWNER, EDITOR, VIEWER, PLAYER)
 * - EDITOR can manage VIEWER and PLAYER roles only
 * - VIEWER and PLAYER cannot manage any access
 */
export const canManageRole = (
  userRole: AccessRole,
  targetRole: AccessRole
): boolean => {
  if (userRole === AccessRole.OWNER) {
    return true; // Owner can manage all roles
  }

  if (
    userRole === AccessRole.EDITOR &&
    (targetRole === AccessRole.VIEWER || targetRole === AccessRole.PLAYER)
  ) {
    return true; // Editor can manage viewers and players
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
      return [AccessRole.OWNER, AccessRole.EDITOR, AccessRole.VIEWER, AccessRole.PLAYER];
    case AccessRole.EDITOR:
      return [AccessRole.VIEWER, AccessRole.PLAYER];
    case AccessRole.VIEWER:
    case AccessRole.PLAYER:
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










