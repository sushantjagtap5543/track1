import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Unified Archival & Retrieval Service
 * Handles seamless data fetching from hot (tc_positions) and cold (tc_positions_archive) storage.
 */
class ArchiveService {
  /**
   * Fetches route history from both hot and cold storage.
   */
  async getHistory(deviceIds, from, to) {
    const fromDate = new Date(from);
    const toDate = new Date(to);
    const HOT_RETENTION_DAYS = 90;
    const boundaryDate = new Date();
    boundaryDate.setDate(boundaryDate.getDate() - HOT_RETENTION_DAYS);

    let positions = [];

    // Case 1: Entire range is in Archive (Cold)
    if (toDate < boundaryDate) {
      positions = await this.queryArchive(deviceIds, fromDate, toDate);
    }
    // Case 2: Entire range is in Hot
    else if (fromDate >= boundaryDate) {
      positions = await this.queryHot(deviceIds, fromDate, toDate);
    }
    // Case 3: Range spans across both Hot and Cold
    else {
      const coldPart = await this.queryArchive(deviceIds, fromDate, boundaryDate);
      const hotPart = await this.queryHot(deviceIds, boundaryDate, toDate);
      positions = [...coldPart, ...hotPart];
    }

    return positions;
  }

  async queryHot(deviceIds, from, to) {
    return await prisma.tcPosition.findMany({
      where: {
        deviceId: { in: deviceIds.map(id => parseInt(id)) },
        fixtime: { gte: from, lte: to }
      },
      orderBy: { fixtime: 'asc' }
    });
  }

  async queryArchive(deviceIds, from, to) {
    return await prisma.tcPositionArchive.findMany({
      where: {
        deviceId: { in: deviceIds.map(id => parseInt(id)) },
        fixtime: { gte: from, lte: to }
      },
      orderBy: { fixtime: 'asc' }
    });
  }

  /**
   * Triggers the database stored procedure to move old data to archive.
   */
  async runArchivalTask(retentionDays = 90) {
    console.log(`[ArchiveService] Starting archival task (Retention: ${retentionDays} days)...`);
    try {
      await prisma.$executeRaw`CALL archive_old_data(${retentionDays})`;
      console.log('[ArchiveService] Archival task completed successfully.');
    } catch (error) {
      console.error('[ArchiveService] Archival task failed:', error);
      throw error;
    }
  }
}

export default new ArchiveService();
