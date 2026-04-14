import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3001/api';
const AUTH = 'Basic ' + Buffer.from('admin:admin').toString('base64');

async function createDevice(index) {
  const name = `Dummy Device ${index.toString().padStart(3, '0')}`;
  const uniqueId = `860${index.toString().padStart(12, '0')}`;
  
  const response = await fetch(`${BASE_URL}/devices`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': AUTH
    },
    body: JSON.stringify({
      name,
      uniqueId,
      category: 'car',
      model: 'Simulator',
      contact: 'Tech Support',
      phone: '+123456789'
    })
  });

  if (!response.ok) {
    const error = await response.text();
    console.error(`Failed to create device ${index}: ${error}`);
    return null;
  }
  
  const device = await response.json();
  console.log(`Created device ${index}: ${device.id}`);
  return device;
}

async function main() {
  console.log('Starting dummy device generation...');
  const count = 100;
  for (let i = 1; i <= count; i++) {
    await createDevice(i);
    // Add a small delay
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  console.log('Finished generating 100 devices.');
}

main().catch(console.error);
