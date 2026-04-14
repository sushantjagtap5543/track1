import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

/**
 * Logs a sensitive action to the AuditLog table
 * @param {string} userId - ID of the user performing the action (optional)
 * @param {string} action - The action performed (e.g., 'LOGIN', 'REGISTER', 'PAYMENT')
 * @param {string} resource - The resource affected (e.g., 'User', 'Payment')
 * @param {Object} payload - Additional context (optional)
 * @param {string} ipAddress - IP address of the request (optional)
 */
const logAudit = async ({ userId, action, resource, payload, ipAddress }) => {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        resource,
        payload: payload ? JSON.parse(JSON.stringify(payload)) : null,
        ipAddress
      }
    });
  } catch (error) {
    console.error('[AuditLog] Error writing audit log:', error.message);
  }
};

export default logAudit;
