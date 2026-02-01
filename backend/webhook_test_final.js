const crypto = require('crypto');
const body = '{"event":"payment.succeeded","data":{"checkoutRequestId":"TEST123"}}';
const secret = '75f8507d24945d3989200e80d4b77f7429174182728fc0b0e9f25b59f7775b22';
const sig = crypto.createHmac('sha256', secret).update(body).digest('hex');
console.log('Body:', body);
console.log('Signature:', sig);
(async () => {
  try {
    const res = await fetch('http://127.0.0.1:3001/api/lipana/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-lipana-signature': sig
      },
      body
    });
    console.log('Status:', res.status);
    const text = await res.text();
    console.log('Response:', text);
  } catch (e) {
    console.error('Error:', e.message);
  }
})();
