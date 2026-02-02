const fs = require('fs');
const crypto = require('crypto');

// Replace with your actual LIPANA_SECRET_KEY from backend/.env
const secret = process.env.LIPANA_SECRET_KEY || 'your-lipana-secret-key-here';
const body = fs.readFileSync('body.json');
const signature = crypto.createHmac('sha256', secret).update(body).digest('hex');

console.log('Computed Signature:');
console.log(signature);