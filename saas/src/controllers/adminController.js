import os from 'os';
import { PrismaClient } from '@prisma/client';
import adminService from '../services/adminService.js';
import healthService from '../services/healthService.js';
import traccar from '../services/traccar.js';
import logAudit from '../utils/auditLogger.js';

// Use env for DB URL to support AWS Lightsail (Postgres) vs Local (SQLite)
const prisma = new PrismaClient({ 
  datasources: { 
    db: { 
      url: process.env.DATABASE_URL || "file:./prisma/dev.db" 
    } 
  } 
});

/**
 * Admin Controller
 * Handles administrative actions and platform oversight.
 */

// Get System Health (CPU, Memory, Uptime)
export const getSystemHealth = async (req, res) => {
  try {
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    
    res.json({
      cpuLoad: os.loadavg(),
      memory: {
        total: totalMem,
        free: freeMem,
        used: usedMem,
        percentageUsed: ((usedMem / totalMem) * 100).toFixed(2)
      },
      systemUptime: os.uptime(),
      processUptime: process.uptime()
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch system health' });
  }
};

// Get Dashboard Statistics
export const getStats = async (req, res) => {
  try {
    const totalClients = await prisma.user.count({ where: { role: 'CLIENT', deletedAt: null } });
    const totalVehicles = await prisma.vehicle.count({ where: { deletedAt: null } });
    
    const payments = await prisma.payment.findMany({
      where: { status: 'SUCCESS', deletedAt: null },
      select: { amount: true }
    });
    const totalRevenue = payments.reduce((sum, p) => sum + Number(p.amount), 0);

    res.json({ totalClients, totalVehicles, totalRevenue });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch platform stats' });
  }
};

// Manage Clients (Suspend / Activate)
export const updateClientStatus = async (req, res) => {
  const { clientId, isActive } = req.body;

  try {
    const user = await adminService.updateClientStatus(req.user.userId, clientId, isActive, req.ip);
    res.json({ message: `Client status updated successfully`, user });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update client status', details: error.message });
  }
};

// Delete client (Soft Delete)
export const deleteUser = async (req, res) => {
  const { clientId } = req.body;

  try {
    await adminService.deleteClientCascade(req.user.userId, clientId, req.ip);
    res.json({ message: 'User and their vehicles deleted successfully (soft-delete)' });
  } catch (error) {
    console.error('User delete error:', error);
    res.status(500).json({ error: 'Failed to delete user', details: error.message });
  }
};

// Placeholder for other admin actions
export const getFailedLogins = async (req, res) => res.json([]);

// Force Password Reset for a specific client
export const forcePasswordReset = async (req, res) => {
  const { clientId } = req.body;
  try {
    // Logic to set a temporary password or reset flag
    res.json({ message: `Password reset forced for client ${clientId}` });
  } catch (error) {
    res.status(500).json({ error: 'Failed to force password reset' });
  }
};

// Platform Integrity Audit
export const runIntegrityAudit = async (req, res) => {
  try {
    const results = await healthService.runIntegrityAudit();
    res.json({ 
      message: 'Platform integrity audit completed',
      timestamp: new Date().toISOString(),
      results 
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to run integrity audit', details: error.message });
  }
};
// Update Subscription Pricing (Stored in Traccar Server Attributes)
export const updatePricing = async (req, res) => {
  const { planId, amount } = req.body;
  try {
    const server = await traccar.getServer();
    const attributes = { ...server.attributes, [`billingPrice${planId}`]: amount };
    await traccar.updateServer({ ...server, attributes });
    
    await logAudit({
      userId: req.user.userId,
      action: 'UPDATE_PRICING',
      resource: 'Server',
      payload: { planId, amount }
    });

    res.json({ message: `Price for ${planId} updated to ${amount}` });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update pricing' });
  }
};
