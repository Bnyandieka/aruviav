const crypto = require('crypto');
const fetch = globalThis.fetch || require('node-fetch');

const body = JSON.stringify({ event: 'payment.succeeded', data: { checkoutRequestId: 'TEST123' } });
const secret = '75f8507d24945d3989200e80d4b77f7429174182728fc0b0e9f25b59f7775b22';
const sig = crypto.createHmac('sha256', secret).update(body).digest('hex');

console.log('computed signature:', sig);

(async () => {
  try {
    const res = await fetch('http://localhost:3001/api/lipana/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-lipana-signature': sig
      },
      body
    });
    console.log('status', res.status);
    const text = await res.text();
    console.log('response body:', text);
  } catch (err) {
    console.error('request error', err);
  }
})();
