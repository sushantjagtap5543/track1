import express from 'express';
import { updateMockPosition, getMockPositions } from '../services/mockState.js';

const router = express.Router();

const isRecoveryMode = process.env.MOCK_TRACCAR === 'true' || process.env.NODE_ENV !== 'production';

if (isRecoveryMode) {
  console.log('[System] Traccar Mock Mode Active');
  
  router.get('/api/server', (req, res) => res.json({
    id: 1, name: 'GeoSurePath Mock', registration: true, latitude: 40.7128, longitude: -74.0060, zoom: 12, attributes: {}
  }));

  router.all('/api/session', (req, res) => {
    const mockUser = { id: 1, name: "Admin", email: "admin@example.com", administrator: true, attributes: {} };
    if (req.method === 'POST') return res.json(mockUser);
    res.json(mockUser);
  });

  router.all('/api/session/token', (req, res) => {
    res.send('mock-session-token-' + Date.now());
  });

  router.get('/api/geofences/:id', (req, res) => res.json({ id: parseInt(req.params.id), name: "GeoSure HQ", area: "CIRCLE (18.5204 73.8567, 500)", attributes: {} }));

  router.get(['/api/notifications', '/api/notification'], (req, res) => {
    const list = Array.from({ length: 25 }, (_, i) => ({
      id: i + 1,
      type: ['deviceOnline', 'deviceOffline', 'ignitionOn', 'geofenceEnter', 'overspeed', 'alarm'][i % 6],
      always: true,
      description: `Alert ${i + 1}: ${['Connection restablished', 'Connection lost', 'Engine started', 'Entered Warehouse', 'Speeding at 95km/h', 'SOS Button Pressed'][i % 6]}`,
      notificators: 'web,mail',
      attributes: { alarm: i % 6 === 5 ? 'sos' : null, speedLimit: 80 }
    }));
    if (req.query.deviceId) return res.json(list.filter(n => n.id % 2 === 0));
    res.json(list);
  });
  
  router.get('/api/notifications/:id', (req, res) => res.json({ id: parseInt(req.params.id), type: 'deviceOnline', always: true, description: 'Mock Notification', notificators: 'web', attributes: {} }));

  router.get('/api/notifications/types', (req, res) => res.json([
    { type: 'all' }, { type: 'alarm' }, { type: 'deviceOnline' }, { type: 'deviceOffline' }, { type: 'deviceMoving' },
    { type: 'deviceStopped' }, { type: 'deviceOverspeed' }, { type: 'geofenceEnter' }, { type: 'geofenceExit' },
    { type: 'ignitionOn' }, { type: 'ignitionOff' }, { type: 'maintenance' }, { type: 'commandResult' }
  ]));
  
  router.get('/api/notifications/notificators', (req, res) => res.json([
    { type: 'web' }, { type: 'mail' }, { type: 'sms' }, { type: 'traccar' }, { type: 'telegram' }, { type: 'pushover' }
  ]));

  router.get(['/api/devices', '/api/device'], (req, res) => {
    const list = Array.from({ length: 20 }, (_, i) => ({
      id: i + 1,
      name: `Vehicle ${i + 1}`,
      uniqueId: String(i + 1),
      status: i % 3 === 0 ? 'online' : 'offline',
      lastUpdate: new Date(),
      attributes: { batteryLevel: 70 + (i % 30), ignition: i % 2 === 0 }
    }));
    res.json(list);
  });

  router.get(['/api/positions', '/api/position'], (req, res) => {
    const { deviceId, from, to } = req.query;
    const dId = parseInt(deviceId) || 1;
    if (from && to) {
      const count = 50;
      const fromMs = new Date(from).getTime();
      const toMs = new Date(to).getTime();
      const startLat = 40.7128, startLon = -74.0060;
      const endLat = 40.7528, endLon = -74.0460;
      const results = [];
      for (let i = 0; i <= count; i++) {
        const fixTimeMs = fromMs + (toMs - fromMs) * (i / count);
        const speed = Math.max(0, 40 + Math.sin(i * 0.4) * 20 + (Math.random() - 0.5) * 8);
        results.push({
          id: 2000 + i, deviceId: dId, fixTime: new Date(fixTimeMs).toISOString(), deviceTime: new Date(fixTimeMs + 300).toISOString(),
          serverTime: new Date(fixTimeMs + 600).toISOString(), latitude: startLat + (endLat - startLat) * (i / count) + (Math.random() - 0.5) * 0.001,
          longitude: startLon + (endLon - startLon) * (i / count) + (Math.random() - 0.5) * 0.001, altitude: 550 + Math.sin(i * 0.3) * 40,
          speed: parseFloat(speed.toFixed(2)), course: 45 + (Math.random() - 0.5) * 20, address: `Point ${i + 1}, Pune`,
          attributes: { ignition: true, batteryLevel: Math.max(20, 90 - i), distance: parseFloat((i * 160).toFixed(1)), totalDistance: parseFloat((i * 160).toFixed(1)), motion: speed > 5 }
        });
      }
      return res.json(results);
    }
    const targetDeviceId = parseInt(req.query.deviceId);
    if (targetDeviceId) {
       const pos = getMockPositions().find(p => p.deviceId === targetDeviceId);
       return res.json(pos ? [pos] : []);
    }
    res.json(getMockPositions());
  });

  router.get(['/api/groups', '/api/group'], (req, res) => res.json([{ id: 1, name: "Luxury Fleet", attributes: {} }]));
  
  router.get('/api/geofences', (req, res) => {
    const list = [
      { id: 1, name: "GeoSure HQ", area: "CIRCLE (18.5204 73.8567, 500)", attributes: {} },
      { id: 2, name: "Logistics Hub", area: "CIRCLE (18.5504 73.8867, 1000)", attributes: {} },
      { id: 3, name: "Client Site A", area: "CIRCLE (18.5004 73.8267, 300)", attributes: {} }
    ];
    if (req.query.deviceId) return res.json([list[0]]);
    res.json(list);
  });

  router.get(['/api/drivers', '/api/driver'], (req, res) => {
    const list = [
       { id: 1, name: 'Sushant J.', uniqueId: 'SJ001' },
       { id: 2, name: 'Rahul M.', uniqueId: 'RM002' }
    ];
    if (req.query.deviceId) return res.json([list[0]]);
    res.json(list);
  });

  router.get('/api/devices/:id', (req, res) => res.json({ id: parseInt(req.params.id), name: 'Vehicle ' + req.params.id, uniqueId: String(req.params.id), status: 'online', lastUpdate: new Date(), attributes: {} }));
  router.get('/api/groups/:id', (req, res) => res.json({ id: parseInt(req.params.id), name: "Group " + req.params.id, attributes: {} }));
  router.get('/api/drivers/:id', (req, res) => res.json({ id: parseInt(req.params.id), name: 'Driver ' + req.params.id, uniqueId: 'D' + req.params.id }));
  
  router.get(['/api/maintenance', '/api/maintenances'], (req, res) => {
    const list = [
      { id: 1, name: 'Oil Change', type: 'oil', start: 10000, period: 5000, attributes: {} },
      { id: 2, name: 'Tire Rotation', type: 'tire', start: 20000, period: 10000, attributes: {} },
      { id: 3, name: 'Annual Inspection', type: 'inspection', start: 0, period: 365, attributes: { type: 'time' } }
    ];
    if (req.query.deviceId) return res.json([list[0]]);
    res.json(list);
  });
  
  router.get('/api/maintenance/:id', (req, res) => res.json({ id: parseInt(req.params.id), name: "Maintenance " + req.params.id, type: "service", start: 0, period: 5000, attributes: {} }));
  
  router.get(['/api/commands', '/api/command'], (req, res) => res.json([
    { id: 1, deviceId: 1, type: "engineStop", description: "Stop Engine", attributes: {} },
    { id: 2, deviceId: 1, type: "engineResume", description: "Resume Engine", attributes: {} },
    { id: 3, deviceId: 1, type: "custom", description: "Reboot GPS", attributes: {} }
  ]));
  
  router.post('/api/commands/send', (req, res) => {
    console.log('[Mock Traccar] Command Sent:', req.body);
    const { deviceId, type } = req.body;
    
    if (type === 'engineStop') {
      updateMockPosition(deviceId, { attributes: { ignition: false } });
    } else if (type === 'engineResume') {
      updateMockPosition(deviceId, { attributes: { ignition: true } });
    } else if (type === 'setSensitivity') {
       // Safe parking sets high sensitivity
       updateMockPosition(deviceId, { attributes: { safeParking: req.body.attributes.sensitivity === 'HIGH' } });
    }

    res.status(202).json({ id: Date.now(), ...req.body, status: 'sent' });
  });
  
  router.get('/api/commands/:id', (req, res) => res.json({ id: parseInt(req.params.id), deviceId: 1, type: "custom", description: "Mock Command " + req.params.id, attributes: {} }));

  router.get(['/api/reports/combined', '/api/reports/events', '/api/reports/geofences', '/api/reports/trips', '/api/reports/stops', '/api/reports/summary', '/api/reports/route'], (req, res) => {
    const { deviceId } = req.query;
    const dId = parseInt(deviceId) || 1;
    if (req.path.includes('events')) return res.json([{ id: 101, deviceId: dId, eventTime: new Date().toISOString(), type: 'deviceOnline', attributes: {} }]);
    if (req.path.includes('trips')) return res.json([{ deviceId: dId, startTime: new Date(Date.now() - 7200000).toISOString(), endTime: new Date(Date.now() - 3600000).toISOString(), distance: 15400, averageSpeed: 45.5, maxSpeed: 82, duration: 3600000, startAddress: '123 Business Way, Silicon Valley', endAddress: '456 Innovation Dr, San Francisco', startPositionId: 101, endPositionId: 202 }]);
    if (req.path.includes('stops')) return res.json([{ deviceId: dId, startTime: new Date(Date.now() - 14400000).toISOString(), endTime: new Date(Date.now() - 10800000).toISOString(), duration: 3600000, address: '789 Corporate Blvd, Pune', latitude: 18.5204, longitude: 73.8567, positionId: 505 }]);
    if (req.path.includes('summary')) return res.json([{ deviceId: dId, startTime: new Date(Date.now() - 86400000).toISOString(), distance: 45000, averageSpeed: 40, maxSpeed: 80, engineHours: 3600000, spentFuel: 5.2 }]);
    res.json([]);
  });

  router.get('/api/statistics', (req, res) => {
    const stats = Array.from({ length: 7 }, (_, i) => ({
      id: i + 1, captureTime: new Date(Date.now() - i * 86400000).toISOString(), activeUsers: 5, activeDevices: 3, requests: 1200, messagesReceived: 4500, messagesStored: 4000, mailSent: 2, smsSent: 1, geocoderRequests: 150, geolocationRequests: 80
    }));
    res.json(stats);
  });

  router.get('/api/audit', (req, res) => {
    const audits = Array.from({ length: 20 }, (_, i) => ({
      id: 100 + i, actionTime: new Date(Date.now() - i * 600000).toISOString(), address: '127.0.0.1', userId: 1, actionType: 'login', objectType: 'user', objectId: 1
    }));
    res.json(audits);
  });

  const _scheduledReports = [];
  router.get('/api/reports', (req, res) => res.json(_scheduledReports));
  router.post('/api/reports', (req, res) => { const r = { id: Date.now(), ...req.body }; _scheduledReports.push(r); res.status(201).json(r); });
  router.delete('/api/reports/:id', (req, res) => { const idx = _scheduledReports.findIndex((r) => r.id === parseInt(req.params.id)); if (idx !== -1) _scheduledReports.splice(idx, 1); res.status(204).send(); });
  
  router.get('/api/users', (req, res) => res.json([{ id: 1, name: 'Admin', email: 'admin@geosurepath.com', administrator: true, attributes: {} }]));
  router.get('/api/users/:id', (req, res) => res.json({ id: parseInt(req.params.id), name: 'Admin', email: 'admin@geosurepath.com', administrator: true, attributes: {} }));
  router.put('/api/users/:id', (req, res) => res.json({ ...req.body, id: parseInt(req.params.id) }));
  // Added: POST /api/users (needed for registration saga — creates Traccar user)
  router.post('/api/users', (req, res) => {
    const { name, email } = req.body || {};
    res.status(201).json({ id: Math.floor(Math.random() * 9000) + 1000, name: name || 'New User', email: email || '', administrator: false, attributes: {} });
  });
  // Added: DELETE /api/users/:id (needed for registration rollback)
  router.delete('/api/users/:id', (req, res) => res.status(204).send());
  // Added: POST /api/devices (needed for device creation)
  router.post('/api/devices', (req, res) => {
    const { name, uniqueId } = req.body || {};
    res.status(201).json({ id: Math.floor(Math.random() * 9000) + 1000, name: name || 'New Device', uniqueId: uniqueId || String(Date.now()), status: 'offline', attributes: {} });
  });
  // Added: DELETE /api/devices/:id (cleanup)
  router.delete('/api/devices/:id', (req, res) => res.status(204).send());
  // Added: POST /api/permissions (link user to device)
  router.post('/api/permissions', (req, res) => res.status(204).send());
  router.post('/api/server/reboot', (req, res) => res.status(202).send());
  router.post('/api/session/token', (req, res) => res.send('mock_token_' + Math.random().toString(36).substring(7)));
  
  router.get(['/api/calendars', '/api/calendar'], (req, res) => res.json([]));
  router.delete('/api/permissions', (req, res) => res.status(204).send());
}

export default router;
