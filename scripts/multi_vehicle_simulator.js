// scripts/multi_vehicle_simulator.js
const http = require('http');

/**
 * GeoSurePath Multi-Vehicle Simulator
 * Simulates 10 vehicles moving across the platform.
 */

const VEHICLE_COUNT = 20;
const UPDATE_INTERVAL_MS = 3000; // 3 seconds
const BASE_LAT = 18.5204;
const BASE_LNG = 73.8567;
const WEBHOOK_URL = 'http://localhost:3001/api/webhooks/traccar';

const vehicles = Array.from({ length: VEHICLE_COUNT }, (_, i) => ({
    id: i + 1,
    lat: BASE_LAT + (Math.random() - 0.5) * 0.01,
    lng: BASE_LNG + (Math.random() - 0.5) * 0.01,
    speed: 0,
    heading: Math.random() * 360,
    battery: 100,
    ignition: true
}));

const sendPosition = (vehicle) => {
    const data = JSON.stringify({
        deviceId: vehicle.id,
        latitude: vehicle.lat,
        longitude: vehicle.lng,
        speed: vehicle.speed,
        deviceTime: new Date().toISOString(),
        attributes: {
            ignition: vehicle.ignition,
            battery: Math.round(vehicle.battery),
            heading: Math.round(vehicle.heading),
            source: 'simulator'
        }
    });

    const options = {
        hostname: 'localhost',
        port: 3001,
        path: '/api/v1/webhooks/traccar',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': data.length,
            'X-Gateway-ID': 'SIMULATOR-01',
            'X-Edge-Intelligence': 'active'
        }
    };

    const req = http.request(options, (res) => {
        let responseData = '';
        res.on('data', (chunk) => responseData += chunk);
        res.on('end', () => {
            if (res.statusCode === 201) {
                console.log(`[SIM] Vehicle ${vehicle.id} sent: (${vehicle.lat.toFixed(6)}, ${vehicle.lng.toFixed(6)}) | Speed: ${vehicle.speed.toFixed(1)}`);
            } else {
                console.error(`[SIM] Vehicle ${vehicle.id} FAILED: ${res.statusCode} - ${responseData}`);
            }
        });
    });

    req.on('error', (e) => {
        console.error(`[SIM] Network Error for Vehicle ${vehicle.id}: ${e.message}`);
    });

    req.write(data);
    req.end();
};

const updateVehicles = () => {
    vehicles.forEach(vehicle => {
        // Randomly change speed and heading
        vehicle.speed = Math.max(0, Math.min(120, vehicle.speed + (Math.random() - 0.4) * 10));
        vehicle.heading = (vehicle.heading + (Math.random() - 0.5) * 30) % 360;

        // Move vehicle based on speed and heading (approximate)
        const moveDist = (vehicle.speed * (UPDATE_INTERVAL_MS / 1000)) / 3600; // Distance in km
        const latChange = moveDist / 111 * Math.cos(vehicle.heading * Math.PI / 180);
        const lngChange = moveDist / (111 * Math.cos(vehicle.lat * Math.PI / 180)) * Math.sin(vehicle.heading * Math.PI / 180);

        vehicle.lat += latChange;
        vehicle.lng += lngChange;

        // Simulate battery drain
        vehicle.battery = Math.max(0, vehicle.battery - 0.01);

        sendPosition(vehicle);
    });
};

console.log('--- Starting GeoSurePath Multi-Vehicle Simulator ---');
console.log(`Target: ${WEBHOOK_URL}`);
console.log(`Simulating ${VEHICLE_COUNT} vehicles...`);

setInterval(updateVehicles, UPDATE_INTERVAL_MS);
updateVehicles(); // Initial run
