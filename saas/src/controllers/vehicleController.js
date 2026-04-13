// src/controllers/vehicleController.js
const { PrismaClient } = require('@prisma/client');
const traccarService = require('../services/traccar');
const aiService = require('../services/aiService');

// Use env for DB URL to support AWS Lightsail (Postgres) vs Local (SQLite)
const prisma = new PrismaClient({ 
  datasources: { 
    db: { 
      url: process.env.DATABASE_URL || "file:./prisma/dev.db" 
    } 
  } 
});

// Get user's vehicles
exports.getVehicles = async (req, res) => {
  try {
    const vehicles = await prisma.vehicle.findMany({
      where: { userId: req.user.userId }
    });
    res.json(vehicles);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch vehicles' });
  }
};

// Toggle Engine (Ignition Control System)
exports.toggleEngine = async (req, res) => {
  const { vehicleId, action } = req.body; // action: 'engineResume' or 'engineStop'

  try {
    // Support both SaaS UUID and Traccar Device ID
    const isNumericId = !isNaN(vehicleId) && Number.isInteger(Number(vehicleId));
    const vehicle = await prisma.vehicle.findFirst({
      where: {
        userId: req.user.userId,
        ...(isNumericId ? { traccarDeviceId: parseInt(vehicleId) } : { id: vehicleId })
      }
    });

    if (!vehicle || (isNumericId && !vehicle.traccarDeviceId)) {
      return res.status(404).json({ error: 'Vehicle not found or not linked to device' });
    }

    // Prevention: Cannot stop engine while driving over 20km/h for safety
    if (action === 'engineStop') {
      const position = await traccarService.getLatestPosition(vehicle.traccarDeviceId);
      if (position && position.speed > 20) {
        return res.status(400).json({ error: 'CRITICAL: Cannot stop engine while driving over 20km/h for safety.' });
      }
    }

    // Enterprise Integration: Map command based on brand/device model
    const mapper = require('../utils/commandMapper');
    const { type: finalType, attributes: finalAttributes } = mapper.resolveCommand(vehicle.model || vehicle.type || 'generic', action);

    // Send command to Traccar
    await traccarService.sendCommand(vehicle.traccarDeviceId, finalType, finalAttributes);

    res.json({ 
      message: `Engine ${action === 'engineStop' ? 'locked' : 'unlocked'} successfully.`,
      deviceModel: vehicle.model || 'Generic',
      commandSent: finalType
    });
  } catch (error) {
    console.error('Engine control error:', error);
    res.status(500).json({ error: 'Failed to toggle engine', details: error.message });
  }
};

// Toggle Safe Parking
exports.toggleSafeParking = async (req, res) => {
  const { vehicleId, enable, lat, lng, radius } = req.body;

  try {
    // Support both SaaS UUID and Traccar Device ID
    const isNumericId = !isNaN(vehicleId) && Number.isInteger(Number(vehicleId));
    const vehicle = await prisma.vehicle.findFirst({
      where: {
        userId: req.user.userId,
        ...(isNumericId ? { traccarDeviceId: parseInt(vehicleId) } : { id: vehicleId })
      }
    });

    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found in SaaS database' });
    }

    if (enable && (!lat || !lng)) {
      return res.status(400).json({ error: 'GPS coordinates (lat/lng) are required to enable safe parking' });
    }

    let traccarGeofenceId = vehicle.traccarGeofenceId;

    if (enable) {
      // 1. Create Geofence in Traccar (Circle format)
      const area = `CIRCLE (${lat} ${lng}, ${radius || 20})`;
      const geofence = await traccarService.createGeofence(`SafeParking_${vehicle.name}`, area);
      traccarGeofenceId = geofence.id;

      // 2. Link Geofence to Device in Traccar
      await traccarService.linkGeofenceToDevice(vehicle.traccarDeviceId, traccarGeofenceId);

      // 3. AI-Driven Sensitivity Increase
      const sensitivity = aiService.getRequiredSensitivity(enable);
      const mapper = require('../utils/commandMapper');
      const sensitivityCommand = mapper.resolveCommand(vehicle.model || vehicle.type || 'generic', 'setSensitivity', sensitivity);
      await traccarService.sendCommand(vehicle.traccarDeviceId, sensitivityCommand.type, sensitivityCommand.attributes);

      // Sync attributes with Traccar for UI persistence
      const traccarDevice = await traccarService.getDevice(vehicle.traccarDeviceId);
      if (traccarDevice) {
        const attributes = { ...(traccarDevice.attributes || {}), safeParking: enable };
        await traccarService.updateDevice(vehicle.traccarDeviceId, { attributes });
      }
    } else if (traccarGeofenceId) {
      // 4. Delete Geofence and REVERT sensitivity
      await traccarService.deleteGeofence(traccarGeofenceId).catch(e => console.error('Failed delete geofence:', e));
      traccarGeofenceId = null;
      
      const sensitivity = aiService.getRequiredSensitivity(false);
      const mapper = require('../utils/commandMapper');
      const sensitivityCommand = mapper.resolveCommand(vehicle.model || vehicle.type || 'generic', 'setSensitivity', sensitivity);
      await traccarService.sendCommand(vehicle.traccarDeviceId, sensitivityCommand.type, sensitivityCommand.attributes);

      // Sync attributes with Traccar for UI persistence
      const traccarDevice = await traccarService.getDevice(vehicle.traccarDeviceId);
      if (traccarDevice) {
        const attributes = { ...(traccarDevice.attributes || {}), safeParking: false };
        await traccarService.updateDevice(vehicle.traccarDeviceId, { attributes });
      }
    }

    // 5. Update local DB
    await prisma.vehicle.update({
      where: { id: vehicleId },
      data: {
        safeParkingOn: enable,
        parkingLat: enable ? lat : null,
        parkingLng: enable ? lng : null,
        parkingRadius: enable ? (radius || 20) : null,
        traccarGeofenceId: traccarGeofenceId
      }
    });

    res.json({ 
        message: `Safe parking ${enable ? 'activated' : 'deactivated'}`,
        sensitivity: enable ? 'HIGH (Sensing micro-vibrations)' : 'NORMAL'
    });
  } catch (error) {
    console.error('Safe parking error:', error);
    res.status(500).json({ error: 'Failed to update safe parking status', details: error.message });
  }
};

const logAudit = require('../utils/auditLogger');

// Delete vehicle (Soft Delete)
exports.deleteVehicle = async (req, res) => {
  const { vehicleId } = req.params;

  try {
    // Support both SaaS UUID and Traccar Device ID
    const isNumericId = !isNaN(vehicleId) && Number.isInteger(Number(vehicleId));
    const vehicle = await prisma.vehicle.findFirst({
      where: {
        userId: req.user.userId,
        deletedAt: null,
        ...(isNumericId ? { traccarDeviceId: parseInt(vehicleId) } : { id: vehicleId })
      }
    });

    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    // Soft Delete
    await prisma.vehicle.update({
      where: { id: vehicleId },
      data: { deletedAt: new Date() }
    });

    await logAudit({
      userId: req.user.userId,
      action: 'DELETE_VEHICLE',
      resource: 'Vehicle',
      ipAddress: req.ip,
      payload: { vehicleId, imei: vehicle.imei }
    });

    res.json({ message: 'Vehicle deleted successfully (soft-delete)' });
  } catch (error) {
    console.error('Vehicle delete error:', error);
    res.status(500).json({ error: 'Failed to delete vehicle', details: error.message });
  }
};
