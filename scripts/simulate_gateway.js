// scripts/simulate_gateway.js
const http = require('http');

/**
 * GeoSurePath IoT Gateway Simulator
 * Demonstrates how an intelligent gateway sends proto-optimized/pre-processed data.
 */

const sendPosition = (deviceId, lat, lng) => {
  const data = JSON.stringify({
    deviceId,
    latitude: lat,
    longitude: lng,
    speed: Math.random() * 100,
    deviceTime: new Date().toISOString(),
    attributes: {
      ignition: true,
      battery: 85
    }
  });

  const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/webhooks/traccar',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length,
      'X-Gateway-ID': 'GW-ALPHA-01',
      'X-Edge-Intelligence': 'active'
    }
  };

  const req = http.request(options, (res) => {
    let responseData = '';
    res.on('data', (chunk) => responseData += chunk);
    res.on('end', () => {
      console.log(`[Gateway Simulator] Status: ${res.statusCode}`);
      console.log(`[Gateway Simulator] Response: ${responseData}`);
    });
  });

  req.on('error', (e) => {
    console.error(`[Gateway Simulator] Error: ${e.message}`);
  });

  req.write(data);
  req.end();
};

console.log('--- GeoSurePath IoT Gateway Simulator ---');
sendPosition(1, 18.5204, 73.8567);
