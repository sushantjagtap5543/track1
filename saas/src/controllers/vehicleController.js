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
    const vehicle = await prisma.vehicle.findFirst({
      where: { id: vehicleId, userId: req.user.userId }
    });

    if (!vehicle || !vehicle.traccarDeviceId) {
      return res.status(404).json({ error: 'Vehicle not found or not linked to device' });
    }

    // Prevention: Cannot stop engine while driving over 20km/h for safety
    if (action === 'engineStop') {
      const position = await traccarService.getLatestPosition(vehicle.traccarDeviceId);
      if (position && position.speed > 20) {
        return res.status(400).json({ error: 'CRITICAL: Cannot stop engine while driving over 20km/h for safety.' });
      }
    }

    // Enterprise Integration: Map command based on brand/device type
    let traccarCommandType = action;
    const brand = (vehicle.brand || 'generic').toLowerCase();
    
    // Command mapping for different brands
    const commandMap = {
        'teltonika': { 'engineStop': 'custom', 'engineResume': 'custom', 'attributes': { 'data': action === 'engineStop' ? 'setparam 40006:1' : 'setparam 40006:0' } },
        'concox': { 'engineStop': 'engineStop', 'engineResume': 'engineResume' },
        'gt06': { 'engineStop': 'engineStop', 'engineResume': 'engineResume' },
        // Default mapping if brand is unknown
        'generic': { 'engineStop': 'engineStop', 'engineResume': 'engineResume' }
    };

    const mapping = commandMap[brand] || commandMap['generic'];
    const finalType = mapping[action];
    const finalAttributes = mapping.attributes || {};

    // Send command to Traccar
    await traccarService.sendCommand(vehicle.traccarDeviceId, finalType, finalAttributes);

    res.json({ message: `Engine ${action === 'engineStop' ? 'locked' : 'unlocked'} successfully for ${brand} device.` });
  } catch (error) {
    console.error('Engine control error:', error);
    res.status(500).json({ error: 'Failed to toggle engine', details: error.message });
  }
};

// Toggle Safe Parking
exports.toggleSafeParking = async (req, res) => {
  const { vehicleId, enable, lat, lng, radius } = req.body;

  try {
    const vehicle = await prisma.vehicle.findFirst({
      where: { id: vehicleId, userId: req.user.userId }
    });

    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found' });
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
      const sensitivity = aiService.getRequiredSensitivity(true);
      await traccarService.sendCommand(vehicle.traccarDeviceId, 'custom', { data: `SENSITIVITY:${sensitivity}` });
      
    } else if (traccarGeofenceId) {
      // 4. Delete Geofence and REVERT sensitivity
      await traccarService.deleteGeofence(traccarGeofenceId).catch(e => console.error('Failed delete geofence:', e));
      traccarGeofenceId = null;
      
      const sensitivity = aiService.getRequiredSensitivity(false);
      await traccarService.sendCommand(vehicle.traccarDeviceId, 'custom', { data: `SENSITIVITY:${sensitivity}` });
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
