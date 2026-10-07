const { ROLES, ROLE_CODES } = require('../constants/roles');

/**
 * Middleware factory to enforce granular permissions
 * @param {string|string[]} requiredPermissions - Required permission string or array of permissions
 */
const checkPermission = (requiredPermissions) => {
  return (req, res, next) => {
    if (!req.user || !req.user.roleId) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: No role assigned to user.',
      });
    }

    const role = req.user.roleId;

    // Super Admin has full permissions
    if (role.name === ROLES.SUPER_ADMIN || role.code === ROLE_CODES.SUPER_ADMIN) {
      return next();
    }

    const perms = Array.isArray(requiredPermissions)
      ? requiredPermissions
      : [requiredPermissions];

    const userPermissions = Array.isArray(role.permissions) ? role.permissions : [];

    // Check if user has at least one of the required permissions
    const hasPermission = perms.some((perm) => userPermissions.includes(perm));

    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: You do not have permission (${perms.join(', ')}) to perform this action.`,
      });
    }

    next();
  };
};

module.exports = { checkPermission };
