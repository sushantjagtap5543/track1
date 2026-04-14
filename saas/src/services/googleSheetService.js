import { google } from 'googleapis';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * PRODUCTION-GRADE Google Sheets Sync Service
 * Handles real-time synchronization of device billing data.
 */
class GoogleSheetService {
  constructor() {
    this.spreadsheetId = process.env.GOOGLE_SHEET_ID || '1Bb_sbpc5rwa_EoTccDy7DAS-edP57y93GsDBj51Kpis';
    this.auth = null;
    this.sheets = null;
    
    this.initialize();
  }

  async initialize() {
    try {
      if (process.env.GOOGLE_SERVICE_ACCOUNT_CREDENTIALS) {
        const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_CREDENTIALS);
        this.auth = new google.auth.GoogleAuth({
          credentials,
          scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });
        this.sheets = google.sheets({ version: 'v4', auth: this.auth });
      } else {
        console.warn('[GoogleSheetService] Warning: googleapis credentials missing. Operating in MOCK mode.');
      }
    } catch (error) {
      console.error('[GoogleSheetService] Initialization failed:', error);
    }
  }

  /**
   * Sync a single device's billing data to the sheet with retry logic.
   */
  async syncDevice(deviceId, retries = 3) {
    try {
      const vehicle = await prisma.vehicle.findUnique({
        where: { id: deviceId },
        include: { user: true }
      });

      if (!vehicle) throw new Error('Vehicle not found');

      if (!this.sheets) {
        console.log(`[GoogleSheetService][MOCK] Syncing device ${vehicle.imei} to sheet...`);
        return;
      }

      const rowData = [
        vehicle.user.name,
        vehicle.user.phone || 'N/A',
        vehicle.imei,
        vehicle.name,
        vehicle.plate || 'N/A',
        vehicle.subscriptionPlan,
        vehicle.planAmount,
        vehicle.subscriptionStart ? vehicle.subscriptionStart.toISOString().split('T')[0] : 'N/A',
        vehicle.nextBillingDate ? vehicle.nextBillingDate.toISOString().split('T')[0] : 'N/A',
        vehicle.paymentStatus,
        vehicle.lastPaymentDate ? vehicle.lastPaymentDate.toISOString().split('T')[0] : 'N/A',
        vehicle.paymentMode || 'N/A',
        vehicle.transactionId || 'N/A',
        vehicle.billingCycleCount,
        vehicle.deletedAt ? 'Removed' : (vehicle.nextBillingDate < new Date() ? 'Expired' : 'Active'),
        vehicle.remarks || ''
      ];

      await this.sheets.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range: 'Sheet1!A:P',
        valueInputOption: 'USER_ENTERED',
        resource: { values: [rowData] },
      });

      console.log(`[GoogleSheetService] Synced device ${vehicle.imei} successfully.`);
    } catch (error) {
      if (retries > 0) {
        console.warn(`[GoogleSheetService] Sync failed for ${deviceId}. Retrying... (${retries} left)`);
        await new Promise(r => setTimeout(r, 2000));
        return this.syncDevice(deviceId, retries - 1);
      }
      console.error('[GoogleSheetService] Sync PERMANENTLY failed for device:', deviceId, error);
    }
  }

  /**
   * Force full sync of all active devices to the sheet.
   */
  async syncAll() {
    console.log('[GoogleSheetService] Starting full bulk sync...');
    const vehicles = await prisma.vehicle.findMany({
      where: { deletedAt: null },
      include: { user: true }
    });

    for (const vehicle of vehicles) {
      await this.syncDevice(vehicle.id);
    }
  }
}

export default new GoogleSheetService();
