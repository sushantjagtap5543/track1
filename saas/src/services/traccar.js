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

const getAuthHeaders = (req = null) => {
  const email = TRACCAR_ADMIN_EMAIL || 'admin';
  const password = TRACCAR_ADMIN_PASSWORD || 'admin';
  const headers = {
    'Authorization': 'Basic ' + Buffer.from(`${email}:${password}`).toString('base64'),
    'Content-Type': 'application/json'
  };
  if (req?.headers?.['x-correlation-id']) {
    headers['X-Correlation-ID'] = req.headers['x-correlation-id'];
  }
  return headers;
};

const getDevices = async () => {
  if (MOCK_TRACCAR === 'true') return MOCK_DATA.devices;
  const response = await fetchWithTimeout(`${TRACCAR_URL}/api/devices`, {
    headers: getAuthHeaders()
  });
  if (!response.ok) await handleTraccarError(response, 'getDevices');
  return response.json();
};

const getDevice = async (deviceId) => {
  if (MOCK_TRACCAR === 'true') return MOCK_DATA.devices.find(d => d.id === (typeof deviceId === 'string' ? parseInt(deviceId) : deviceId));
  const response = await fetchWithTimeout(`${TRACCAR_URL}/api/devices?id=${deviceId}`, {
    headers: getAuthHeaders()
  });
  if (!response.ok) await handleTraccarError(response, 'getDevice');
  const devices = await response.json();
  return devices.length > 0 ? devices[0] : null;
};

const fetchWithTimeout = async (url, options = {}, timeout = 10000, retries = 2) => {
  if (MOCK_TRACCAR === 'true') {
     console.log(`[Traccar Mock] Intercepted request to ${url}`);
     return { 
       ok: true, 
       status: 200,
       json: async () => ({ id: Math.floor(Math.random() * 1000), ...(options.body ? JSON.parse(options.body) : {}) }),
       text: async () => JSON.stringify({ id: Math.floor(Math.random() * 1000), ...(options.body ? JSON.parse(options.body) : {}) })
     };
  }

  const runFetch = async (attempt = 0) => {
    return traccarBreaker.run(async () => {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), timeout);
      try {
        const response = await fetch(url, { ...options, signal: controller.signal });
        clearTimeout(id);
        if (!response.ok && attempt < retries && response.status >= 500) {
           console.warn(`[Traccar] Internal error (${response.status}). Retrying... ${attempt + 1}/${retries}`);
           return runFetch(attempt + 1);
        }
        return response;
      } catch (err) {
        clearTimeout(id);
        if (attempt < retries && (err.name === 'AbortError' || err.code === 'ECONNREFUSED')) {
           console.warn(`[Traccar] Connection error (${err.name}). Retrying... ${attempt + 1}/${retries}`);
           return runFetch(attempt + 1);
        }
        throw err;
      }
    });
  };

  return runFetch();
};

const handleTraccarError = async (response, context) => {
  let errorDetail;
  try {
    errorDetail = await response.text();
  } catch (e) {
    errorDetail = 'No detail provided';
  }
  const error = new Error(`Traccar ${context} failed: ${response.status}`);
  error.status = response.status;
  error.detail = errorDetail;
  throw error;
};

const createUser = async (name, email, password, req = null) => {
  const response = await fetchWithTimeout(`${TRACCAR_URL}/api/users`, {
    method: 'POST',
    headers: getAuthHeaders(req),
    body: JSON.stringify({ name, email, password, attributes: {} })
  });
  if (!response.ok) await handleTraccarError(response, 'createUser');
  return response.json();
};

const createDevice = async (name, uniqueId) => {
  const response = await fetchWithTimeout(`${TRACCAR_URL}/api/devices`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ name, uniqueId })
  });
  if (!response.ok) await handleTraccarError(response, 'createDevice');
  return response.json();
};

const updateDevice = async (deviceId, data) => {
  const response = await fetchWithTimeout(`${TRACCAR_URL}/api/devices/${deviceId}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({ id: deviceId, ...data })
  });
  if (!response.ok) await handleTraccarError(response, 'updateDevice');
  return response.json();
};

const linkDeviceToUser = async (userId, deviceId) => {
  const response = await fetchWithTimeout(`${TRACCAR_URL}/api/permissions`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ userId, deviceId })
  });
  if (!response.ok) await handleTraccarError(response, 'linkDeviceToUser');
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
  if (!response.ok) await handleTraccarError(response, 'sendCommand');
  return response.json();
};

const createGeofence = async (name, area) => {
  const response = await fetchWithTimeout(`${TRACCAR_URL}/api/geofences`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ name, area })
  });
  if (!response.ok) await handleTraccarError(response, 'createGeofence');
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
  if (!response.ok) await handleTraccarError(response, 'linkGeofenceToDevice');
  return response.ok;
};

const updateUser = async (userId, data) => {
  const response = await fetchWithTimeout(`${TRACCAR_URL}/api/users/${userId}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({ id: userId, ...data })
  });
  if (!response.ok) await handleTraccarError(response, 'updateUser');
  return response.json();
};

const disableUser = async (userId, disabled = true) => {
  return await updateUser(userId, { disabled });
};

const getServer = async () => {
  if (MOCK_TRACCAR === 'true') return { attributes: {} };
  const response = await fetchWithTimeout(`${TRACCAR_URL}/api/server`, {
    headers: getAuthHeaders()
  });
  if (!response.ok) await handleTraccarError(response, 'getServer');
  return response.json();
};

const checkHealth = async () => {
  try {
    const response = await fetchWithTimeout(`${TRACCAR_URL}/api/server`, {
      headers: getAuthHeaders()
    });
    return response.ok;
  } catch (error) {
    return false;
  }
};

module.exports = {
  getDevices,
  getDevice,
  createUser,
  updateUser,
  disableUser,
  createDevice,
  updateDevice,
  linkDeviceToUser,
  getLatestPosition,
  deleteUser,
  deleteDevice,
  sendCommand,
  createGeofence,
  deleteGeofence,
  linkGeofenceToDevice,
  checkHealth,
  getServer
};

