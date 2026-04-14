import traccarBreaker from '../middleware/circuitBreaker.js';
import IORedis from 'ioredis';

const { TRACCAR_URL, TRACCAR_ADMIN_EMAIL, TRACCAR_ADMIN_PASSWORD, MOCK_TRACCAR } = process.env;
const redis = new IORedis({ host: process.env.REDIS_HOST || '127.0.0.1' });
const SESSION_CACHE_KEY = 'traccar:admin_session';

/**
 * Mock Data for Local Development
 */
const MOCK_DATA = {
  users: [{ id: 1, name: 'Mock User', email: 'admin@example.com' }],
  devices: [{ id: 1, name: 'Mock Vehicle', uniqueId: '123456789012345' }],
  positions: [{ id: 1, deviceId: 1, latitude: 40.7128, longitude: -74.0060, speed: 10, course: 0, attributes: { ignition: true } }]
};

const getAuthHeaders = async (req = null) => {
  if (MOCK_TRACCAR === 'true') {
     return { 'Content-Type': 'application/json' };
  }

  try {
    const cachedSession = await redis.get(SESSION_CACHE_KEY);
    if (cachedSession) {
      return {
        'Cookie': `JSESSIONID=${cachedSession}`,
        'Content-Type': 'application/json'
      };
    }
  } catch (err) {
    console.warn('[Traccar] Redis session cache failed:', err.message);
  }

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

const updateSessionCache = async (response) => {
  const setCookie = response.headers.get('set-cookie');
  if (setCookie) {
    const match = setCookie.match(/JSESSIONID=([^;]+)/);
    if (match) {
      await redis.set(SESSION_CACHE_KEY, match[1], 'EX', 3600); // 1 hour
    }
  }
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

const fetchWithTimeout = async (url, options = {}, timeout = 10000, retries = 2) => {
  if (MOCK_TRACCAR === 'true') {
     console.log(`[Traccar Mock] Intercepted request to ${url}`);
     return { 
       ok: true, 
       status: 200,
       json: async () => ({ id: Math.floor(Math.random() * 1000), ...(options.body ? JSON.parse(options.body) : {}) }),
       text: async () => JSON.stringify({ id: Math.floor(Math.random() * 1000), ...(options.body ? JSON.parse(options.body) : {}) }),
       headers: { get: () => null }
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

export const getDevices = async () => {
  if (MOCK_TRACCAR === 'true') return MOCK_DATA.devices;
  const headers = await getAuthHeaders();
  const response = await fetchWithTimeout(`${TRACCAR_URL}/api/devices`, {
    headers
  });
  if (response.ok) await updateSessionCache(response);
  if (!response.ok) await handleTraccarError(response, 'getDevices');
  return response.json();
};

export const getDevice = async (deviceId) => {
  if (MOCK_TRACCAR === 'true') return MOCK_DATA.devices.find(d => d.id === (typeof deviceId === 'string' ? parseInt(deviceId) : deviceId));
  const headers = await getAuthHeaders();
  const response = await fetchWithTimeout(`${TRACCAR_URL}/api/devices?id=${deviceId}`, {
    headers
  });
  if (response.ok) await updateSessionCache(response);
  if (!response.ok) await handleTraccarError(response, 'getDevice');
  const devices = await response.json();
  return devices.length > 0 ? devices[0] : null;
};

export const createUser = async (name, email, password, req = null) => {
  const headers = await getAuthHeaders(req);
  const response = await fetchWithTimeout(`${TRACCAR_URL}/api/users`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ name, email, password, attributes: {} })
  });
  if (response.ok) await updateSessionCache(response);
  if (!response.ok) await handleTraccarError(response, 'createUser');
  return response.json();
};

export const createDevice = async (name, uniqueId) => {
  const headers = await getAuthHeaders();
  const response = await fetchWithTimeout(`${TRACCAR_URL}/api/devices`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ name, uniqueId })
  });
  if (response.ok) await updateSessionCache(response);
  if (!response.ok) await handleTraccarError(response, 'createDevice');
  return response.json();
};

export const updateDevice = async (deviceId, data) => {
  const headers = await getAuthHeaders();
  const response = await fetchWithTimeout(`${TRACCAR_URL}/api/devices/${deviceId}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({ id: deviceId, ...data })
  });
  if (response.ok) await updateSessionCache(response);
  if (!response.ok) await handleTraccarError(response, 'updateDevice');
  return response.json();
};

export const linkDeviceToUser = async (userId, deviceId) => {
  const headers = await getAuthHeaders();
  const response = await fetchWithTimeout(`${TRACCAR_URL}/api/permissions`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ userId, deviceId })
  });
  if (response.ok) await updateSessionCache(response);
  if (!response.ok) await handleTraccarError(response, 'linkDeviceToUser');
  return response.ok;
};

export const getLatestPosition = async (deviceId) => {
  if (MOCK_TRACCAR === 'true') return MOCK_DATA.positions[0];
  const headers = await getAuthHeaders();
  const response = await fetchWithTimeout(`${TRACCAR_URL}/api/positions?deviceId=${deviceId}`, {
    headers
  });
  if (response.ok) await updateSessionCache(response);
  if (!response.ok) return null;
  const positions = await response.json();
  return positions.length > 0 ? positions[0] : null;
};

/**
 * Get positions for multiple devices or all authorized devices.
 * @param {Array<number>} deviceIds - Optional array of device IDs.
 */
export const getPositions = async (deviceIds = []) => {
  if (MOCK_TRACCAR === 'true') return MOCK_DATA.positions;
  const headers = await getAuthHeaders();
  const url = new URL(`${TRACCAR_URL}/api/positions`);
  if (deviceIds.length > 0) {
    deviceIds.forEach(id => url.searchParams.append('deviceId', id));
  }
  const response = await fetchWithTimeout(url.toString(), { headers });
  if (response.ok) await updateSessionCache(response);
  if (!response.ok) await handleTraccarError(response, 'getPositions');
  return response.json();
};

/**
 * Get route history for devices.
 */
export const getRoute = async (deviceIds, from, to) => {
  if (MOCK_TRACCAR === 'true') {
     return MOCK_DATA.positions.map(p => ({ ...p, deviceTime: new Date().toISOString() }));
  }
  const headers = await getAuthHeaders();
  const url = new URL(`${TRACCAR_URL}/api/reports/route`);
  deviceIds.forEach(id => url.searchParams.append('deviceId', id));
  url.searchParams.append('from', from);
  url.searchParams.append('to', to);

  const response = await fetchWithTimeout(url.toString(), {
    headers: { ...headers, 'Accept': 'application/json' }
  });
  if (response.ok) await updateSessionCache(response);
  if (!response.ok) await handleTraccarError(response, 'getRoute');
  return response.json();
};

export const deleteUser = async (userId) => {
  const headers = await getAuthHeaders();
  const response = await fetchWithTimeout(`${TRACCAR_URL}/api/users/${userId}`, {
    method: 'DELETE',
    headers
  });
  if (response.ok) await updateSessionCache(response);
  return response.ok;
};

export const deleteDevice = async (deviceId) => {
  const headers = await getAuthHeaders();
  const response = await fetchWithTimeout(`${TRACCAR_URL}/api/devices/${deviceId}`, {
    method: 'DELETE',
    headers
  });
  if (response.ok) await updateSessionCache(response);
  return response.ok;
};

export const sendCommand = async (deviceId, type, attributes = {}) => {
  const headers = await getAuthHeaders();
  const response = await fetchWithTimeout(`${TRACCAR_URL}/api/commands/send`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ deviceId, type, attributes })
  });
  if (response.ok) await updateSessionCache(response);
  if (!response.ok) await handleTraccarError(response, 'sendCommand');
  return response.json();
};

export const createGeofence = async (name, area) => {
  const headers = await getAuthHeaders();
  const response = await fetchWithTimeout(`${TRACCAR_URL}/api/geofences`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ name, area })
  });
  if (response.ok) await updateSessionCache(response);
  if (!response.ok) await handleTraccarError(response, 'createGeofence');
  return response.json();
};

export const deleteGeofence = async (geofenceId) => {
  const headers = await getAuthHeaders();
  const response = await fetchWithTimeout(`${TRACCAR_URL}/api/geofences/${geofenceId}`, {
    method: 'DELETE',
    headers
  });
  if (response.ok) await updateSessionCache(response);
  return response.ok;
};

export const linkGeofenceToDevice = async (deviceId, geofenceId) => {
  const headers = await getAuthHeaders();
  const response = await fetchWithTimeout(`${TRACCAR_URL}/api/permissions`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ deviceId, geofenceId })
  });
  if (response.ok) await updateSessionCache(response);
  if (!response.ok) await handleTraccarError(response, 'linkGeofenceToDevice');
  return response.ok;
};

export const updateUser = async (userId, data) => {
  const headers = await getAuthHeaders();
  const response = await fetchWithTimeout(`${TRACCAR_URL}/api/users/${userId}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({ id: userId, ...data })
  });
  if (response.ok) await updateSessionCache(response);
  if (!response.ok) await handleTraccarError(response, 'updateUser');
  return response.json();
};

export const disableUser = async (userId, disabled = true) => {
  return await updateUser(userId, { disabled });
};

export const updateServer = async (data) => {
  const headers = await getAuthHeaders();
  const response = await fetchWithTimeout(`${TRACCAR_URL}/api/server`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(data)
  });
  if (response.ok) await updateSessionCache(response);
  if (!response.ok) await handleTraccarError(response, 'updateServer');
  return response.json();
};

export const getServer = async () => {
  if (MOCK_TRACCAR === 'true') return { attributes: {} };
  const headers = await getAuthHeaders();
  const response = await fetchWithTimeout(`${TRACCAR_URL}/api/server`, {
    headers
  });
  if (response.ok) await updateSessionCache(response);
  if (!response.ok) await handleTraccarError(response, 'getServer');
  return response.json();
};

export const checkHealth = async () => {
  try {
    const response = await fetchWithTimeout(`${TRACCAR_URL}/api/server`, {
      headers: await getAuthHeaders()
    });
    return response.ok;
  } catch (error) {
    return false;
  }
};

export default {
  getDevices,
  getDevice,
  createUser,
  updateUser,
  disableUser,
  createDevice,
  updateDevice,
  linkDeviceToUser,
  getLatestPosition,
  getPositions,
  getRoute,
  deleteUser,
  deleteDevice,
  sendCommand,
  createGeofence,
  deleteGeofence,
  linkGeofenceToDevice,
  checkHealth,
  getServer,
  updateServer
};

