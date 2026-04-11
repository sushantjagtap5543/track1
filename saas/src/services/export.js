const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Data Sovereignty Service
 * GDPR-compliant JSON export for users.
 */
const exportUserData = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      Subscription: true,
      Session: true,
      Vehicle: true
    }
  });

  // Redact sensitive system fields
  if (user) {
    delete user.password;
    delete user.mfaSecret;
  }

  return user;
};

module.exports = { exportUserData };
