const http = require('http');

const SAAS_API_PORT = 3001; // SaaS API runs on this port based on .env
const options = {
    hostname: '127.0.0.1',
    port: SAAS_API_PORT,
    path: '/api/devices', // Adjust if the SaaS device creation path differs
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    }
};

// Based on standard Traccar setup, we might need a token or basic auth.
// If the local SaaS API mocks this, we can try without, or we can use admin@example.com / admin.
// Traccar default is Basic admin:admin => YWRtaW46YWRtaW4=

const requestOptions = {
    hostname: '127.0.0.1',
    port: 8082, // Let's try direct Traccar API if SaaS API fails
    path: '/api/devices',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + Buffer.from('admin@example.com:admin').toString('base64')
    }
};

async function createDevice(index) {
    return new Promise((resolve, reject) => {
        const uniqueId = `sim_${index.toString().padStart(4, '0')}`;
        const name = `Test_Vehicle_${index}`;
        const data = JSON.stringify({
            name: name,
            uniqueId: uniqueId,
        });

        const req = http.request(requestOptions, (res) => {
            let resData = '';
            res.on('data', chunk => resData += chunk);
            res.on('end', () => {
                if (res.statusCode === 200 || res.statusCode === 201) {
                    console.log(`Created device: ${name} (${uniqueId})`);
                    resolve(JSON.parse(resData));
                } else if (res.statusCode === 400 && resData.includes('Duplicate')) {
                     console.log(`Device likely exists: ${name} (${uniqueId})`);
                     resolve(null);
                } else {
                    console.error(`Failed to create ${name}. Status: ${res.statusCode}, Resp: ${resData}`);
                    resolve(null);
                }
            });
        });

        req.on('error', (e) => {
            console.error(`Problem with request for ${name}: ${e.message}`);
            resolve(null); // Continue even if error
        });

        req.write(data);
        req.end();
    });
}

async function run() {
    console.log("Creating 25 simulation devices...");
    for (let i = 1; i <= 25; i++) {
        await createDevice(i);
        // sleep a bit to avoid flooding
        await new Promise(r => setTimeout(r, 100));
    }
    console.log("Device creation process finished.");
}

run();
