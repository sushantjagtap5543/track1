const mockPositions = Array.from({ length: 25 }, (_, i) => ({
  id: 1000 + i,
  deviceId: i + 1,
  latitude: 40.7128 + (Math.random() - 0.5) * 0.1,
  longitude: -74.0060 + (Math.random() - 0.5) * 0.1,
  speed: 0,
  course: Math.random() * 360,
  attributes: {
    ignition: true,
    batteryLevel: 80 + (i % 20),
    safeParking: false
  },
  fixTime: new Date().toISOString(),
  deviceTime: new Date().toISOString(),
  servertime: new Date().toISOString(),
}));

export const getMockPositions = () => mockPositions;

export const updateMockPosition = (deviceId, updates) => {
  const index = mockPositions.findIndex(p => p.deviceId === deviceId);
  if (index !== -1) {
    mockPositions[index] = {
      ...mockPositions[index],
      ...updates,
      attributes: {
        ...mockPositions[index].attributes,
        ...(updates.attributes || {})
      }
    };
  }
};

export const moveMockPositions = () => {
  mockPositions.forEach(p => {
    if (p.attributes.ignition) {
      p.latitude += (Math.random() - 0.5) * 0.001;
      p.longitude += (Math.random() - 0.5) * 0.001;
      p.speed = Math.max(0, 40 + (Math.random() - 0.5) * 20);
    } else {
      p.speed = 0;
    }
    p.fixTime = new Date().toISOString();
    p.deviceTime = new Date().toISOString();
    p.servertime = new Date().toISOString();
  });
};

export default {
  getMockPositions,
  updateMockPosition,
  moveMockPositions
};
