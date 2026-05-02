import fetch from 'node-fetch';

const API_URL = 'http://localhost:5000/api/v1/auth/forgot-password';

const EMAIL = 'owner@fitfam.in';
const TOTAL_REQUESTS = 30;

async function sendRequest(i) {
  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: EMAIL }),
    });

    console.log(`Request ${i} → Status: ${res.status}`);
  } catch (err) {
    console.error(`Request ${i} failed`, err.message);
  }
}

async function runLoadTest() {
  console.log(`🚀 Sending ${TOTAL_REQUESTS} requests...`);

  const promises = [];

  for (let i = 0; i < TOTAL_REQUESTS; i++) {
    promises.push(sendRequest(i));
  }

  await Promise.all(promises);

  console.log('✅ Load test completed');
}

runLoadTest();
