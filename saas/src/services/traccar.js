// src/services/traccar.js
const { TRACCAR_URL, TRACCAR_ADMIN_EMAIL, TRACCAR_ADMIN_PASSWORD } = process.env;

const traccarBreaker = require('../middleware/circuitBreaker');

/**
 * Basic headers for Traccar API
 */
const getAuthHeaders = (email = TRACCAR_ADMIN_EMAIL, password = TRACCAR_ADMIN_PASSWORD) => {
  return {
    'Authorization': 'Basic ' + Buffer.from(`${email}:${password}`).toString('base64'),
    'Content-Type': 'application/json'
  };
};

/**
 * Custom fetch with timeout and Circuit Breaker
 */
const fetchWithTimeout = async (url, options = {}, timeout = 10000) => {
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

/**
 * Creates a new user in the Traccar system.
 * @async
 * @param {string} name - The user's full name.
 * @param {string} email - The user's email address (used for login).
 * @param {string} password - The user's password.
 * @returns {Promise<Object>} The created Traccar user object.
 * @throws {Error} If the Traccar API request fails.
 */
const createUser = async (name, email, password) => {
  const response = await fetchWithTimeout(`${TRACCAR_URL}/api/users`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ name, email, password })
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Traccar createUser failed: ${response.status} ${text}`);
  }
  return response.json();
};

/**
 * Creates a new device in the Traccar system.
 * @async
 * @param {string} name - A descriptive name for the vehicle/device.
 * @param {string} uniqueId - The unique identifier (usually IMEI) of the device.
 * @returns {Promise<Object>} The created Traccar device object.
 * @throws {Error} If the Traccar API request fails.
 */
const createDevice = async (name, uniqueId) => {
  const response = await fetchWithTimeout(`${TRACCAR_URL}/api/devices`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ name, uniqueId })
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Traccar createDevice failed: ${response.status} ${text}`);
  }
  return response.json();
};

/**
 * Grants a user permission to view and manage a specific device.
 * @async
 * @param {number} userId - The Traccar ID of the user.
 * @param {number} deviceId - The Traccar ID of the device.
 * @returns {Promise<boolean>} True if successful.
 * @throws {Error} If the Traccar API request fails.
 */
const linkDeviceToUser = async (userId, deviceId) => {
  const response = await fetchWithTimeout(`${TRACCAR_URL}/api/permissions`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ userId, deviceId })
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Traccar linkDeviceToUser failed: ${response.status} ${text}`);
  }
  return true;
};

/**
 * Retrieves the latest recorded position for a given device.
 * @async
 * @param {number} deviceId - The Traccar ID of the device.
 * @returns {Promise<Object|null>} The position object or null if none found.
 */
const getLatestPosition = async (deviceId) => {
  const response = await fetchWithTimeout(`${TRACCAR_URL}/api/positions?deviceId=${deviceId}`, {
    headers: getAuthHeaders()
  });
  if (!response.ok) return null;
  const positions = await response.json();
  return positions.length > 0 ? positions[0] : null;
};

/**
 * Deletes a user from the Traccar system.
 * @async
 * @param {number} userId - The Traccar ID of the user to delete.
 * @returns {Promise<boolean>} True if successful.
 */
const deleteUser = async (userId) => {
  const response = await fetchWithTimeout(`${TRACCAR_URL}/api/users/${userId}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  return response.ok;
};

/**
 * Deletes a device from the Traccar system.
 * @async
 * @param {number} deviceId - The Traccar ID of the device to delete.
 * @returns {Promise<boolean>} True if successful.
 */
const deleteDevice = async (deviceId) => {
  const response = await fetchWithTimeout(`${TRACCAR_URL}/api/devices/${deviceId}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  return response.ok;
};

/**
 * Sends a command to a specific device.
 * @async
 * @param {number} deviceId - The Traccar ID of the device.
 * @param {string} type - The type of command (e.g., 'engineStop').
 * @param {Object} [attributes={}] - Additional command attributes.
 * @returns {Promise<Object>} The Traccar API response.
 */
const sendCommand = async (deviceId, type, attributes = {}) => {
  const response = await fetchWithTimeout(`${TRACCAR_URL}/api/commands/send`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ deviceId, type, attributes })
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Traccar sendCommand failed: ${response.status} ${text}`);
  }
  return response.json();
};

/**
 * Creates a circular geofence in the Traccar system.
 * @async
 * @param {string} name - Name of the geofence.
 * @param {string} area - Area definition in WKT format (e.g., 'CIRCLE (lat lon, radius)').
 * @returns {Promise<Object>} The created geofence object.
 */
const createGeofence = async (name, area) => {
  const response = await fetchWithTimeout(`${TRACCAR_URL}/api/geofences`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ name, area })
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Traccar createGeofence failed: ${response.status} ${text}`);
  }
  return response.json();
};

/**
 * Deletes a geofence from the Traccar system.
 * @async
 * @param {number} geofenceId - The ID of the geofence.
 * @returns {Promise<boolean>} True if successful.
 */
const deleteGeofence = async (geofenceId) => {
  const response = await fetchWithTimeout(`${TRACCAR_URL}/api/geofences/${geofenceId}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  return response.ok;
};

/**
 * Links a geofence to a device to enable notifications.
 * @async
 * @param {number} deviceId - Traccar ID of the device.
 * @param {number} geofenceId - ID of the geofence.
 * @returns {Promise<boolean>} True if successful.
 */
const linkGeofenceToDevice = async (deviceId, geofenceId) => {
  const response = await fetchWithTimeout(`${TRACCAR_URL}/api/permissions`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ deviceId, geofenceId })
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Traccar linkGeofenceToDevice failed: ${response.status} ${text}`);
  }
  return true;
};

/**
 * Verifies the health and connectivity of the Traccar API.
 * @async
 * @returns {Promise<boolean>} True if the Traccar API is reachable.
 */
const checkHealth = async () => {
  try {
    const response = await fetchWithTimeout(`${TRACCAR_URL}/api/server`, { timeout: 3000 });
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
