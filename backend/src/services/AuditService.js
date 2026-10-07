const AuditLog = require('../models/AuditLog');

class AuditService {
  /**
   * Log system audit events
   */
  static async log({ userId, userEmail, action, module, recordId, oldData, newData, req }) {
    try {
      const ipAddress = req?.ip || req?.headers?.['x-forwarded-for'] || '';
      const userAgent = req?.headers?.['user-agent'] || '';

      await AuditLog.create({
        userId: userId || req?.user?._id,
        userEmail: userEmail || req?.user?.email || 'system',
        action,
        module,
        recordId: recordId ? String(recordId) : '',
        oldData: oldData || null,
        newData: newData || null,
        ipAddress,
        userAgent,
        timestamp: new Date(),
      });
    } catch (err) {
      console.error('Failed to write audit log:', err.message);
      // Non-blocking so business transaction does not fail
    }
  }
}

module.exports = AuditService;
