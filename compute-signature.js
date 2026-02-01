const fs = require('fs');
const crypto = require('crypto');

// Replace with your actual LIPANA_SECRET_KEY from backend/.env
const secret = 'lip_sk_live_a747e3f343608c9e50546cae1c033891b693912e11275bfc7267a021ddd2261f';
const body = fs.readFileSync('body.json');
const signature = crypto.createHmac('sha256', secret).update(body).digest('hex');

console.log('Computed Signature:');
console.log(signature);