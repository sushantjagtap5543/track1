import { PrismaClient } from '@prisma/client';
import traccarService from '../services/traccar.js';
import aiService from '../services/aiService.js';
import { optimizePositions } from '../utils/responseOptimizer.js';
import mapper from '../utils/commandMapper.js';
import logAudit from '../utils/auditLogger.js';

const prisma = new PrismaClient({ 
  datasources: { 
    db: { 
      url: process.env.DATABASE_URL || "file:./prisma/dev.db" 
    } 
  } 
});

// Get user's vehicles (Basic Metadata)
export const getVehicles = async (req, res) => {
  try {
    const vehicles = await prisma.vehicle.findMany({
      where: { userId: req.user.userId, deletedAt: null }
    });
    res.json(vehicles);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch vehicles' });
  }
};

// Get user's vehicles with live locations (Optimized Batch Fetching)
export const getVehiclesWithLocations = async (req, res) => {
  const { slim = 'true', fields } = req.query;
  try {
    // 1. Fetch SaaS vehicles
    const vehicles = await prisma.vehicle.findMany({
      where: { userId: req.user.userId, deletedAt: null }
    });

    const deviceIds = vehicles.map(v => v.traccarDeviceId).filter(Boolean);
    
    // 2. Fetch all positions in one call
    let positions = [];
    if (deviceIds.length > 0) {
      positions = await traccarService.getPositions(deviceIds);
    }

    // 3. Optimize positions
    const optimizedPositions = optimizePositions(positions, {
      slim: slim === 'true',
      fields: fields ? fields.split(',') : null
    });

    // 4. Merge data
    const merged = vehicles.map(vehicle => {
      const position = optimizedPositions.find(p => p.deviceId === vehicle.traccarDeviceId);
      return {
        ...vehicle,
        location: position || null
      };
    });

    res.json(merged);
  } catch (error) {
    console.error('Batch location fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch vehicles with locations' });
  }
};

// Toggle Engine (Ignition Control System)
export const toggleEngine = async (req, res) => {
  const { vehicleId, action } = req.body; // action: 'engineResume' or 'engineStop'

  try {
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

    if (action === 'engineStop') {
      const position = await traccarService.getLatestPosition(vehicle.traccarDeviceId);
      if (position && position.speed > 20) {
        return res.status(400).json({ error: 'CRITICAL: Cannot stop engine while driving over 20km/h for safety.' });
      }
    }

    const { type: finalType, attributes: finalAttributes } = mapper.resolveCommand(vehicle.model || vehicle.type || 'generic', action);

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
export const toggleSafeParking = async (req, res) => {
  const { vehicleId, enable, lat, lng, radius } = req.body;

  try {
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
      const area = `CIRCLE (${lat} ${lng}, ${radius || 20})`;
      const geofence = await traccarService.createGeofence(`SafeParking_${vehicle.name}`, area);
      traccarGeofenceId = geofence.id;

      const sensitivity = aiService.getRequiredSensitivity(enable);
      const sensitivityCommand = mapper.resolveCommand(vehicle.model || vehicle.type || 'generic', 'setSensitivity', sensitivity);

      await Promise.all([
        traccarService.linkGeofenceToDevice(vehicle.traccarDeviceId, traccarGeofenceId),
        traccarService.sendCommand(vehicle.traccarDeviceId, sensitivityCommand.type, sensitivityCommand.attributes),
        (async () => {
          const traccarDevice = await traccarService.getDevice(vehicle.traccarDeviceId);
          if (traccarDevice) {
            const attributes = { ...(traccarDevice.attributes || {}), safeParking: enable };
            await traccarService.updateDevice(vehicle.traccarDeviceId, { attributes });
          }
        })()
      ]);
    } else if (traccarGeofenceId) {
      const sensitivity = aiService.getRequiredSensitivity(false);
      const sensitivityCommand = mapper.resolveCommand(vehicle.model || vehicle.type || 'generic', 'setSensitivity', sensitivity);

      await Promise.all([
        traccarService.deleteGeofence(traccarGeofenceId).catch(e => console.error('Failed delete geofence:', e)),
        traccarService.sendCommand(vehicle.traccarDeviceId, sensitivityCommand.type, sensitivityCommand.attributes),
        (async () => {
          const traccarDevice = await traccarService.getDevice(vehicle.traccarDeviceId);
          if (traccarDevice) {
            const attributes = { ...(traccarDevice.attributes || {}), safeParking: false };
            await traccarService.updateDevice(vehicle.traccarDeviceId, { attributes });
          }
        })()
      ]);
      traccarGeofenceId = null;
    }

    await prisma.vehicle.update({
      where: { id: vehicle.id },
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

// Delete vehicle (Soft Delete)
export const deleteVehicle = async (req, res) => {
  const { vehicleId } = req.params;

  try {
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

    await prisma.vehicle.update({
      where: { id: vehicle.id },
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
