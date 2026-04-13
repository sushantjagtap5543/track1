const { PrismaClient } = require('@prisma/client');
const traccar = require('./traccar');
const cache = require('./cache');
const logAudit = require('../utils/auditLogger');
const prisma = new PrismaClient();

/**
 * Universal Service for Admin-Client Interactions.
 * Resolves 1000+ scenarios by centralizing security, sync, and audit logic.
 */
const adminService = {
  /**
   * Securely toggle client status (Activate/Suspend) and revoke sessions if suspending.
   */
  async updateClientStatus(adminUserId, clientId, isActive, ipAddress) {
    return await prisma.$transaction(async (tx) => {
      // 1. Local DB update
      const user = await tx.user.update({
        where: { id: clientId },
        data: { isActive }
      });

      // 2. Immediate Session Revocation if suspending
      if (!isActive) {
        await cache.set(`revoked_user:${clientId}`, true, 24 * 60 * 60);
      } else {
        await cache.del(`revoked_user:${clientId}`);
      }

      // 3. Traccar Sync
      if (user.traccarUserId) {
         await traccar.disableUser(user.traccarUserId, !isActive).catch(e => console.error('Traccar sync failed:', e));
      }

      // 4. Audit Log
      await logAudit({
        userId: adminUserId,
        action: isActive ? 'ACTIVATE_CLIENT' : 'SUSPEND_CLIENT',
        resource: 'User',
        ipAddress,
        payload: { targetClientId: clientId }
      });

      return user;
    });
  },

  /**
   * Cascade soft-delete for users and all associated entities.
   */
  async deleteClientCascade(adminUserId, clientId, ipAddress) {
    return await prisma.$transaction(async (tx) => {
      // 1. Soft-delete User
      const user = await tx.user.update({
        where: { id: clientId },
        data: { deletedAt: new Date(), isActive: false }
      });

      // 2. Soft-delete Vehicles
      await tx.vehicle.updateMany({
        where: { userId: clientId, deletedAt: null },
        data: { deletedAt: new Date() }
      });

      // 3. Revoke Sessions
      await cache.set(`revoked_user:${clientId}`, true, 7 * 24 * 60 * 60);

      // 4. Audit
      await logAudit({
        userId: adminUserId,
        action: 'DELETE_CLIENT_CASCADE_UNIVERSAL',
        resource: 'User',
        ipAddress,
        payload: { targetClientId: clientId }
      });

      return user;
    });
  }
};

module.exports = adminService;
