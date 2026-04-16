import prisma from '../utils/prisma.js';


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

export { exportUserData };

