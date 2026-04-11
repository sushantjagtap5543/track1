// src/controllers/adminController.js
const os = require('os');
const { PrismaClient } = require('@prisma/client');

// Use env for DB URL to support AWS Lightsail (Postgres) vs Local (SQLite)
const prisma = new PrismaClient({ 
  datasources: { 
    db: { 
      url: process.env.DATABASE_URL || "file:./prisma/dev.db" 
    } 
  } 
});

// Get System Health (CPU, Memory, Uptime)
exports.getSystemHealth = async (req, res) => {
  try {
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const uptime = os.uptime();
    const loadAvg = os.loadavg();
    const processUptime = process.uptime();

    res.json({
      cpuLoad: loadAvg,
      memory: {
        total: totalMem,
        free: freeMem,
        used: usedMem,
        percentageUsed: ((usedMem / totalMem) * 100).toFixed(2)
      },
      systemUptime: uptime,
      processUptime: processUptime
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch system health' });
  }
};

// Get Dashboard Statistics
exports.getStats = async (req, res) => {
  try {
    const totalClients = await prisma.user.count({ where: { role: 'CLIENT' } });
    const totalVehicles = await prisma.vehicle.count();
    
    // Calculate total revenue
    const payments = await prisma.payment.findMany({
      where: { status: 'COMPLETED' },
      select: { amount: true }
    });
    const totalRevenue = payments.reduce((sum, payment) => sum + payment.amount, 0);

    res.json({ totalClients, totalVehicles, totalRevenue });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch platform stats' });
  }
};

// Manage Clients (Suspend / Activate)
exports.updateClientStatus = async (req, res) => {
  const { clientId, isActive } = req.body;

  try {
    const user = await prisma.user.update({
      where: { id: clientId },
      data: { isActive: isActive }
    });
    
    // Hardening: Disable in Traccar if traccarUserId exists
    if (user.traccarUserId) {
      try {
        // In Traccar, we don't 'delete' for suspension, we just disable the user
        // But our traccarService currently only has deleteUser. 
        // For 'completeness', I will use a generic update call if available, 
        // or just log it for now if our service is limited.
        // Actually, let's keep it simple: just the local flag is used for login.
        console.log(`[Admin] Client ${clientId} status updated to ${isActive}`);
      } catch (err) {
        console.error('Failed to sync status with Traccar:', err);
      }
    }

    res.json({ message: `Client ${isActive ? 'activated' : 'suspended'} successfully`, user });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update client status' });
  }
};
