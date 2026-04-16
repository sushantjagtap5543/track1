import prisma from '../utils/prisma.js';


/**
 * Security helper to verify if a user has access to specific devices.
 */
const verifyDeviceAccess = async (userId, deviceIds) => {
  for (const id of deviceIds) {
    if (!id) continue;
    const vehicle = await prisma.vehicle.findFirst({
      where: { traccarDeviceId: parseInt(id), userId: userId }
    });
    if (!vehicle) throw new Error(`Access denied to device ${id}`);
  }
};

export const getTrips = async (req, res) => {
  const { deviceId, from, to, page = 1, limit = 50 } = req.query;
  const deviceIds = Array.isArray(deviceId) ? deviceId : [deviceId].filter(Boolean);

  try {
    await verifyDeviceAccess(req.user.userId, deviceIds);
    
    // In a real system, we'd fetch from Traccar. For reports, Traccar doesn't support pagination.
    // We fetch all and then paginate in the SaaS layer for mobile efficiency.
    const query = new URLSearchParams({ from, to });
    deviceIds.forEach(id => query.append('deviceId', id));

    const response = await fetch(`${process.env.TRACCAR_URL}/api/reports/trips?${query.toString()}`, {
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${process.env.TRACCAR_ADMIN_EMAIL}:${process.env.TRACCAR_ADMIN_PASSWORD}`).toString('base64'),
        'Accept': 'application/json'
      }
    });

    if (!response.ok) throw new Error('Failed to fetch trips from Traccar');
    
    const trips = await response.json();
    res.json(paginate(trips, page, limit));
  } catch (error) {
    if (process.env.MOCK_TRACCAR === 'true' || process.env.NODE_ENV !== 'production') {
      const mockTrips = deviceIds.map(id => ({
        deviceId: parseInt(id),
        startTime: from || new Date(Date.now() - 7200000).toISOString(),
        endTime: to || new Date().toISOString(),
        distance: 15000,
        averageSpeed: 45,
        maxSpeed: 80,
        duration: 3600000,
        startAddress: 'Mock Start Point',
        endAddress: 'Mock End Point'
      }));
      return res.json(paginate(mockTrips, page, limit));
    }
    res.status(500).json({ error: 'Failed to generate trip report', details: error.message });
  }
};

export const getSummary = async (req, res) => {
  const { deviceId, from, to, daily } = req.query;
  const deviceIds = Array.isArray(deviceId) ? deviceId : [deviceId].filter(Boolean);

  try {
    await verifyDeviceAccess(req.user.userId, deviceIds);

    const query = new URLSearchParams({ from, to });
    deviceIds.forEach(id => query.append('deviceId', id));
    if (daily) query.set('daily', daily);

    const response = await fetch(`${process.env.TRACCAR_URL}/api/reports/summary?${query.toString()}`, {
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${process.env.TRACCAR_ADMIN_EMAIL}:${process.env.TRACCAR_ADMIN_PASSWORD}`).toString('base64'),
        'Accept': 'application/json'
      }
    });

    if (!response.ok) throw new Error('Failed to fetch summary from Traccar');
    
    const summary = await response.json();
    res.json(summary);
  } catch (error) {
    if (process.env.MOCK_TRACCAR === 'true' || process.env.NODE_ENV !== 'production') {
      const mockSummary = deviceIds.map(id => ({
        deviceId: parseInt(id),
        startTime: from || new Date(Date.now() - 86400000).toISOString(),
        distance: 50000,
        averageSpeed: 42,
        maxSpeed: 85,
        engineHours: 3600000,
        spentFuel: 5.5
      }));
      return res.json(mockSummary);
    }
    res.status(500).json({ error: 'Failed to generate summary report', details: error.message });
  }
};

export const getStops = async (req, res) => {
  const { deviceId, from, to, page = 1, limit = 50 } = req.query;
  const deviceIds = Array.isArray(deviceId) ? deviceId : [deviceId].filter(Boolean);

  try {
    await verifyDeviceAccess(req.user.userId, deviceIds);

    const query = new URLSearchParams({ from, to });
    deviceIds.forEach(id => query.append('deviceId', id));

    const response = await fetch(`${process.env.TRACCAR_URL}/api/reports/stops?${query.toString()}`, {
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${process.env.TRACCAR_ADMIN_EMAIL}:${process.env.TRACCAR_ADMIN_PASSWORD}`).toString('base64'),
        'Accept': 'application/json'
      }
    });

    if (!response.ok) throw new Error('Failed to fetch stops from Traccar');
    
    const stops = await response.json();
    res.json(paginate(stops, page, limit));
  } catch (error) {
    if (process.env.MOCK_TRACCAR === 'true' || process.env.NODE_ENV !== 'production') {
      const mockStops = deviceIds.map(id => ({
        deviceId: parseInt(id),
        startTime: from || new Date(Date.now() - 14400000).toISOString(),
        endTime: new Date(Date.now() - 7200000).toISOString(),
        duration: 7200000,
        address: 'Mock Stop Address',
        latitude: 18.5204,
        longitude: 73.8567,
        positionId: Math.floor(Math.random() * 1000)
      }));
      return res.json(paginate(mockStops, page, limit));
    }
    res.status(500).json({ error: 'Failed to generate stops report', details: error.message });
  }
};

export const getHistory = async (req, res) => {
  const { deviceId, from, to, page = 1, limit = 100, slim = 'true', fields } = req.query;
  const deviceIds = Array.isArray(deviceId) ? deviceId : [deviceId].filter(Boolean);

  try {
    await verifyDeviceAccess(req.user.userId, deviceIds);

    const history = await archiveService.getHistory(deviceIds, from, to);
    
    // Optimize history points for mobile (slim down or pick fields)
    const optimized = optimizePositions(history, { 
      slim: slim === 'true', 
      fields: fields ? fields.split(',') : null 
    });

    res.json(paginate(optimized, page, limit));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch history', details: error.message });
  }
};

export const getEvents = async (req, res) => {
  const { deviceId, from, to, type, page = 1, limit = 50 } = req.query;
  const deviceIds = Array.isArray(deviceId) ? deviceId : [deviceId].filter(Boolean);

  try {
    await verifyDeviceAccess(req.user.userId, deviceIds);

    const query = new URLSearchParams({ from, to });
    deviceIds.forEach(id => query.append('deviceId', id));
    if (type) {
      const types = Array.isArray(type) ? type : [type];
      types.forEach(t => query.append('type', t));
    }

    const response = await fetch(`${process.env.TRACCAR_URL}/api/reports/events?${query.toString()}`, {
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${process.env.TRACCAR_ADMIN_EMAIL}:${process.env.TRACCAR_ADMIN_PASSWORD}`).toString('base64'),
        'Accept': 'application/json'
      }
    });

    if (!response.ok) throw new Error('Failed to fetch events from Traccar');
    
    const events = await response.json();
    res.json(paginate(events, page, limit));
  } catch (error) {
    if (process.env.MOCK_TRACCAR === 'true' || process.env.NODE_ENV !== 'production') {
      const mockEvents = deviceIds.map(id => ({
        id: Math.floor(Math.random() * 10000),
        deviceId: parseInt(id),
        eventTime: new Date().toISOString(),
        type: 'deviceOnline',
        attributes: {},
        positionId: 0
      }));
      return res.json(paginate(mockEvents, page, limit));
    }
    res.status(500).json({ error: 'Failed to generate events report', details: error.message });
  }
};

export const getCombined = async (req, res) => {
  const { deviceId, from, to } = req.query;
  const deviceIds = Array.isArray(deviceId) ? deviceId : [deviceId].filter(Boolean);

  try {
    await verifyDeviceAccess(req.user.userId, deviceIds);

    const query = new URLSearchParams({ from, to });
    deviceIds.forEach(id => query.append('deviceId', id));

    const response = await fetch(`${process.env.TRACCAR_URL}/api/reports/combined?${query.toString()}`, {
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${process.env.TRACCAR_ADMIN_EMAIL}:${process.env.TRACCAR_ADMIN_PASSWORD}`).toString('base64'),
        'Accept': 'application/json'
      }
    });

    if (!response.ok) throw new Error('Failed to fetch combined report from Traccar');
    
    const combined = await response.json();
    res.json(combined);
  } catch (error) {
    if (process.env.MOCK_TRACCAR === 'true' || process.env.NODE_ENV !== 'production') {
       const mockData = deviceIds.map(id => ({
         deviceId: parseInt(id),
         events: [
           { id: Math.floor(Math.random() * 1000), eventTime: new Date().toISOString(), type: 'deviceOnline' }
         ],
         positions: [],
         trips: []
       }));
       return res.json(mockData);
    }
    res.status(500).json({ error: 'Failed to generate combined report', details: error.message });
  }
};

export const getGeofences = async (req, res) => {
  const { deviceId, from, to, geofenceId, page = 1, limit = 50 } = req.query;
  const deviceIds = Array.isArray(deviceId) ? deviceId : [deviceId].filter(Boolean);

  try {
    await verifyDeviceAccess(req.user.userId, deviceIds);

    const query = new URLSearchParams({ from, to });
    deviceIds.forEach(id => query.append('deviceId', id));
    if (geofenceId) {
      const gIds = Array.isArray(geofenceId) ? geofenceId : [geofenceId];
      gIds.forEach(id => query.append('geofenceId', id));
    }

    const response = await fetch(`${process.env.TRACCAR_URL}/api/reports/geofences?${query.toString()}`, {
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${process.env.TRACCAR_ADMIN_EMAIL}:${process.env.TRACCAR_ADMIN_PASSWORD}`).toString('base64'),
        'Accept': 'application/json'
      }
    });

    if (!response.ok) throw new Error('Failed to fetch geofence report from Traccar');
    
    const geofences = await response.json();
    res.json(paginate(geofences, page, limit));
  } catch (error) {
    if (process.env.MOCK_TRACCAR === 'true' || process.env.NODE_ENV !== 'production') {
      const mockGeofences = deviceIds.map(id => ({
        deviceId: parseInt(id),
        geofenceId: 1,
        startTime: from || new Date(Date.now() - 3600000).toISOString(),
        endTime: to || new Date().toISOString()
      }));
      return res.json(paginate(mockGeofences, page, limit));
    }
    res.status(500).json({ error: 'Failed to generate geofences report', details: error.message });
  }
};
