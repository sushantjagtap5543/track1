/**
 * Anti-Gravity Command Mapper
 * Maps generic SaaS actions to device-specific Traccar commands based on model/brand.
 */

const COMMAND_MAP = {
  'teltonika': {
    engineStop: { type: 'custom', attributes: { data: 'setparam 40006:1' } },
    engineResume: { type: 'custom', attributes: { data: 'setparam 40006:0' } },
    safeParkingOn: { type: 'custom', attributes: { data: 'setparam 40008:1' } },
    safeParkingOff: { type: 'custom', attributes: { data: 'setparam 40008:0' } },
    setSensitivity: (level) => ({ type: 'custom', attributes: { data: `setparam 40005:${level}` } })
  },
  'concox': {
    engineStop: { type: 'engineStop', attributes: {} },
    engineResume: { type: 'engineResume', attributes: {} },
    setSensitivity: (level) => ({ type: 'custom', attributes: { data: `SENSITIVITY,${level}#` } })
  },
  'gt06': {
    engineStop: { type: 'engineStop', attributes: {} },
    engineResume: { type: 'engineResume', attributes: {} },
    setSensitivity: (level) => ({ type: 'custom', attributes: { data: `SENSITIVITY,${level}#` } })
  },
  'coban': {
    engineStop: { type: 'custom', attributes: { data: 'stop123456' } },
    engineResume: { type: 'custom', attributes: { data: 'resume123456' } },
    setSensitivity: (level) => ({ type: 'custom', attributes: { data: `sensitivity123456 ${level}` } })
  },
  'meiligao': {
    engineStop: { type: 'custom', attributes: { data: 'DY01' } },
    engineResume: { type: 'custom', attributes: { data: 'DY00' } },
    setSensitivity: (level) => ({ type: 'custom', attributes: { data: `SENSITIVITY,${level}#` } })
  },
  'queclink': {
    engineStop: { type: 'custom', attributes: { data: 'AT+GVCTO=...' } },
    engineResume: { type: 'custom', attributes: { data: 'AT+GVCTO=...' } },
    setSensitivity: (level) => ({ type: 'custom', attributes: { data: `AT+GVSNS=...${level}` } })
  },
  'generic': {
    engineStop: { type: 'engineStop', attributes: {} },
    engineResume: { type: 'engineResume', attributes: {} },
    setSensitivity: (level) => ({ type: 'custom', attributes: { data: `SENSITIVITY:${level}` } })
  }
};

/**
 * Resolves the correct command for a given vehicle model/brand and action.
 * @param {string} identifier - Brand or Model of the device
 * @param {string} action - Generic action (e.g., 'engineStop')
 * @param {any} value - Optional dynamic value (e.g., sensitivity level)
 * @returns {Object} { type: string, attributes: object }
 */
export const resolveCommand = (identifier = 'generic', action, value = null) => {
  const idLower = identifier.toLowerCase();
  
  // Find matching brand in the map
  const brandKey = Object.keys(COMMAND_MAP).find(key => idLower.includes(key)) || 'generic';
  const brandMapping = COMMAND_MAP[brandKey];
  
  let mapping = brandMapping[action] || COMMAND_MAP['generic'][action];
  
  if (!mapping) {
    throw new Error(`Command '${action}' not supported for model '${identifier}'`);
  }

  // If mapping is a function (dynamic command), execute it
  if (typeof mapping === 'function') {
    return mapping(value);
  }
  
  return mapping;
};

export default {
  resolveCommand
};
