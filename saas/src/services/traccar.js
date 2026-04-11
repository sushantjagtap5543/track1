// src/services/traccar.js
const { TRACCAR_URL, TRACCAR_ADMIN_EMAIL, TRACCAR_ADMIN_PASSWORD, MOCK_TRACCAR } = process.env;

const traccarBreaker = require('../middleware/circuitBreaker');

/**
 * Mock Data for Local Development
 */
const MOCK_DATA = {
  users: [{ id: 1, name: 'Mock User', email: 'admin@example.com' }],
  devices: [{ id: 1, name: 'Mock Vehicle', uniqueId: '123456789012345' }],
  positions: [{ id: 1, deviceId: 1, latitude: 18.5204, longitude: 73.8567, speed: 10, course: 0, attributes: { ignition: true } }]
};

const getAuthHeaders = (email = TRACCAR_ADMIN_EMAIL, password = TRACCAR_ADMIN_PASSWORD) => {
  return {
    'Authorization': 'Basic ' + Buffer.from(`${email}:${password}`).toString('base64'),
    'Content-Type': 'application/json'
  };
};

const fetchWithTimeout = async (url, options = {}, timeout = 10000) => {
  if (MOCK_TRACCAR === 'true') {
     console.log(`[Traccar Mock] Intercepted request to ${url}`);
     return { ok: true, json: async () => ({ id: Math.floor(Math.random() * 1000), ...JSON.parse(options.body || '{}') }) };
  }

  return traccarBreaker.run(async () => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    try {
      const response = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(id);
      return response;
    } catch (err) {
      clearTimeout(id);
      throw err;
    }
  });
};

const createUser = async (name, email, password) => {
  const response = await fetchWithTimeout(`${TRACCAR_URL}/api/users`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ name, email, password, attributes: {} })
  });
  if (!response.ok) throw new Error(`Traccar createUser failed: ${response.status}`);
  return response.json();
};

const createDevice = async (name, uniqueId) => {
  const response = await fetchWithTimeout(`${TRACCAR_URL}/api/devices`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ name, uniqueId })
  });
  if (!response.ok) throw new Error(`Traccar createDevice failed: ${response.status}`);
  return response.json();
};

const linkDeviceToUser = async (userId, deviceId) => {
  const response = await fetchWithTimeout(`${TRACCAR_URL}/api/permissions`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ userId, deviceId })
  });
  return response.ok;
};

const getLatestPosition = async (deviceId) => {
  if (MOCK_TRACCAR === 'true') return MOCK_DATA.positions[0];
  const response = await fetchWithTimeout(`${TRACCAR_URL}/api/positions?deviceId=${deviceId}`, {
    headers: getAuthHeaders()
  });
  if (!response.ok) return null;
  const positions = await response.json();
  return positions.length > 0 ? positions[0] : null;
};

const deleteUser = async (userId) => {
  const response = await fetchWithTimeout(`${TRACCAR_URL}/api/users/${userId}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  return response.ok;
};

const deleteDevice = async (deviceId) => {
  const response = await fetchWithTimeout(`${TRACCAR_URL}/api/devices/${deviceId}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  return response.ok;
};

const sendCommand = async (deviceId, type, attributes = {}) => {
  const response = await fetchWithTimeout(`${TRACCAR_URL}/api/commands/send`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ deviceId, type, attributes })
  });
  if (!response.ok) throw new Error(`Traccar sendCommand failed: ${response.status}`);
  return response.json();
};

const createGeofence = async (name, area) => {
  const response = await fetchWithTimeout(`${TRACCAR_URL}/api/geofences`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ name, area })
  });
  if (!response.ok) throw new Error(`Traccar createGeofence failed: ${response.status}`);
  return response.json();
};

const deleteGeofence = async (geofenceId) => {
  const response = await fetchWithTimeout(`${TRACCAR_URL}/api/geofences/${geofenceId}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  return response.ok;
};

const linkGeofenceToDevice = async (deviceId, geofenceId) => {
  const response = await fetchWithTimeout(`${TRACCAR_URL}/api/permissions`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ deviceId, geofenceId })
  });
  return response.ok;
};

const checkHealth = async () => {
  if (MOCK_TRACCAR === 'true') return true;
  try {
    const response = await fetchWithTimeout(`${TRACCAR_URL}/api/server`, { timeout: 2000 });
    return response.ok;
  } catch (err) {
    return false;
  }
};

module.exports = {
  createUser,
  createDevice,
  linkDeviceToUser,
  getLatestPosition,
  deleteUser,
  deleteDevice,
  sendCommand,
  createGeofence,
  deleteGeofence,
  linkGeofenceToDevice,
  checkHealth
};

