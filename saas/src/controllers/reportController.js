// src/controllers/reportController.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({ datasources: { db: { url: "file:./prisma/dev.db" } } });

// In a real system, these would fetch from Traccar's API (/api/reports/trips, /api/reports/summary)
// and aggregate based on user's authorized vehicles.

exports.getTrips = async (req, res) => {
  const { deviceId, from, to } = req.query;
  const deviceIds = Array.isArray(deviceId) ? deviceId : [deviceId];
  
  try {
    for (const id of deviceIds) {
      if (!id) continue;
      const vehicle = await prisma.vehicle.findFirst({
          where: { traccarDeviceId: parseInt(id), userId: req.user.userId }
      });
      if (!vehicle) return res.status(403).json({ error: `Access denied to device ${id}` });
    }

    const query = new URLSearchParams({ from, to });
    deviceIds.filter(Boolean).forEach(id => query.append('deviceId', id));

    const response = await fetch(`${process.env.TRACCAR_URL}/api/reports/trips?${query.toString()}`, {
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${process.env.TRACCAR_ADMIN_EMAIL}:${process.env.TRACCAR_ADMIN_PASSWORD}`).toString('base64'),
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) throw new Error('Failed to fetch trips from Traccar');
    
    const trips = await response.json();
    res.json(trips);
  } catch (error) {
    if (process.env.MOCK_TRACCAR === 'true' || process.env.NODE_ENV !== 'production') {
        return res.json(deviceIds.filter(Boolean).map(id => ({
            deviceId: parseInt(id),
            startTime: from || new Date(Date.now() - 7200000).toISOString(),
            endTime: to || new Date().toISOString(),
            distance: 15000,
            averageSpeed: 45,
            maxSpeed: 80,
            duration: 3600000,
            startAddress: 'Mock Start Point',
            endAddress: 'Mock End Point'
        })));
    }
    res.status(500).json({ error: 'Failed to generate trip report', details: error.message });
  }
};

exports.getSummary = async (req, res) => {
  const { deviceId, from, to } = req.query;
  const deviceIds = Array.isArray(deviceId) ? deviceId : [deviceId];
  
  try {
    for (const id of deviceIds) {
      if (!id) continue;
      const vehicle = await prisma.vehicle.findFirst({
          where: { traccarDeviceId: parseInt(id), userId: req.user.userId }
      });
      if (!vehicle) return res.status(403).json({ error: `Access denied to device ${id}` });
    }

    const query = new URLSearchParams({ from, to });
    deviceIds.filter(Boolean).forEach(id => query.append('deviceId', id));
    if (req.query.daily) query.set('daily', req.query.daily);

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
        return res.json(deviceIds.filter(Boolean).map(id => ({
            deviceId: parseInt(id),
            startTime: from || new Date(Date.now() - 86400000).toISOString(),
            distance: 50000,
            averageSpeed: 42,
            maxSpeed: 85,
            engineHours: 3600000,
            spentFuel: 5.5
        })));
    }
    res.status(500).json({ error: 'Failed to generate summary report', details: error.message });
  }
};

exports.getStops = async (req, res) => {
  const { deviceId, from, to } = req.query;
  const deviceIds = Array.isArray(deviceId) ? deviceId : [deviceId];

  try {
    for (const id of deviceIds) {
      if (!id) continue;
      const vehicle = await prisma.vehicle.findFirst({
          where: { traccarDeviceId: parseInt(id), userId: req.user.userId }
      });
      if (!vehicle) return res.status(403).json({ error: `Access denied to device ${id}` });
    }

    const query = new URLSearchParams({ from, to });
    deviceIds.filter(Boolean).forEach(id => query.append('deviceId', id));

    const response = await fetch(`${process.env.TRACCAR_URL}/api/reports/stops?${query.toString()}`, {
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${process.env.TRACCAR_ADMIN_EMAIL}:${process.env.TRACCAR_ADMIN_PASSWORD}`).toString('base64'),
        'Accept': 'application/json'
      }
    });

    if (!response.ok) throw new Error('Failed to fetch stops from Traccar');
    
    const stops = await response.json();
    res.json(stops);
  } catch (error) {
    if (process.env.MOCK_TRACCAR === 'true' || process.env.NODE_ENV !== 'production') {
        return res.json(deviceIds.filter(Boolean).map(id => ({
            deviceId: parseInt(id),
            startTime: from || new Date(Date.now() - 14400000).toISOString(),
            endTime: new Date(Date.now() - 7200000).toISOString(),
            duration: 7200000,
            address: 'Mock Stop Address',
            latitude: 18.5204,
            longitude: 73.8567,
            positionId: Math.floor(Math.random() * 1000)
        })));
    }
    res.status(500).json({ error: 'Failed to generate stops report', details: error.message });
  }
};

exports.getCombined = async (req, res) => {
  const { deviceId, from, to } = req.query;
  const deviceIds = Array.isArray(deviceId) ? deviceId : [deviceId];

  try {
    // Security check: ensure all deviceIds belong to the user
    for (const id of deviceIds) {
      if (!id) continue;
      const vehicle = await prisma.vehicle.findFirst({
          where: { traccarDeviceId: parseInt(id), userId: req.user.userId }
      });
      if (!vehicle) return res.status(403).json({ error: `Access denied to device ${id}` });
    }

    // Build query with multiple deviceId parameters
    const query = new URLSearchParams({ from, to });
    deviceIds.forEach(id => { if (id) query.append('deviceId', id); });

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
    // Fallback for mock/recovery mode if Traccar is down
    if (process.env.MOCK_TRACCAR === 'true' || process.env.NODE_ENV !== 'production') {
       const mockData = deviceIds.filter(Boolean).map(id => ({
         deviceId: parseInt(id),
         events: [
           { id: Math.floor(Math.random() * 1000), eventTime: new Date().toISOString(), type: 'deviceOnline' },
           { id: Math.floor(Math.random() * 1000), eventTime: new Date(Date.now() - 3600000).toISOString(), type: 'ignitionOn' }
         ],
         positions: [],
         trips: []
       }));
       return res.json(mockData);
    }
    res.status(500).json({ error: 'Failed to generate combined report', details: error.message });
  }
};

exports.getEvents = async (req, res) => {
  const { deviceId, from, to } = req.query;
  const deviceIds = Array.isArray(deviceId) ? deviceId : [deviceId];

  try {
    for (const id of deviceIds) {
      if (!id) continue;
      const vehicle = await prisma.vehicle.findFirst({
          where: { traccarDeviceId: parseInt(id), userId: req.user.userId }
      });
      if (!vehicle) return res.status(403).json({ error: `Access denied to device ${id}` });
    }

    const query = new URLSearchParams({ from, to });
    deviceIds.forEach(id => { if (id) query.append('deviceId', id); });
    if (req.query.type) {
        const types = Array.isArray(req.query.type) ? req.query.type : [req.query.type];
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
    res.json(events);
  } catch (error) {
    if (process.env.MOCK_TRACCAR === 'true' || process.env.NODE_ENV !== 'production') {
       const mockEvents = deviceIds.filter(Boolean).map(id => ({
         id: Math.floor(Math.random() * 10000),
         deviceId: parseInt(id),
         eventTime: new Date().toISOString(),
         type: 'deviceOnline',
         attributes: {},
         positionId: 0
       }));
       return res.json(mockEvents);
    }
    res.status(500).json({ error: 'Failed to generate events report', details: error.message });
  }
};

exports.getGeofences = async (req, res) => {
  const { deviceId, from, to } = req.query;
  const deviceIds = Array.isArray(deviceId) ? deviceId : [deviceId];

  try {
    for (const id of deviceIds) {
      if (!id) continue;
      const vehicle = await prisma.vehicle.findFirst({
          where: { traccarDeviceId: parseInt(id), userId: req.user.userId }
      });
      if (!vehicle) return res.status(403).json({ error: `Access denied to device ${id}` });
    }

    const query = new URLSearchParams({ from, to });
    deviceIds.forEach(id => { if (id) query.append('deviceId', id); });
    if (req.query.geofenceId) {
        const geofenceIds = Array.isArray(req.query.geofenceId) ? req.query.geofenceId : [req.query.geofenceId];
        geofenceIds.forEach(id => query.append('geofenceId', id));
    }

    const response = await fetch(`${process.env.TRACCAR_URL}/api/reports/geofences?${query.toString()}`, {
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${process.env.TRACCAR_ADMIN_EMAIL}:${process.env.TRACCAR_ADMIN_PASSWORD}`).toString('base64'),
        'Accept': 'application/json'
      }
    });

    if (!response.ok) throw new Error('Failed to fetch geofence report from Traccar');
    
    const geofences = await response.json();
    res.json(geofences);
  } catch (error) {
    if (process.env.MOCK_TRACCAR === 'true' || process.env.NODE_ENV !== 'production') {
       const geoIds = req.query.geofenceId ? (Array.isArray(req.query.geofenceId) ? req.query.geofenceId : [req.query.geofenceId]) : [1, 2];
       const results = [];
       deviceIds.filter(Boolean).forEach(dId => {
           geoIds.forEach(gId => {
             results.push({
               deviceId: parseInt(dId),
               geofenceId: parseInt(gId),
               startTime: from || new Date(Date.now() - 3600000).toISOString(),
               endTime: to || new Date().toISOString()
             });
           });
       });
       return res.json(results);
    }
    res.status(500).json({ error: 'Failed to generate geofences report', details: error.message });
  }
};
