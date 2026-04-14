import { execSync } from 'child_process';

/**
 * Anti-Gravity Schema Guard
 * Ensures the DB matches the Prisma schema on startup.
 */

const schemaGuard = () => {
  console.log('Running Schema Guard...');
  try {
    // In production, we don't want to run 'dev' migrations
    if (process.env.NODE_ENV === 'production') {
      execSync('npx prisma migrate deploy');
    } else {
      execSync('npx prisma migrate status');
    }
    console.log('[OK] Database schema verified.');
    return true;
  } catch (err) {
    console.error('[WARNING] Schema Mismatch or Prisma tools missing. Proceeding anyway...', err.message);
    return false;
  }
};

export default schemaGuard;
