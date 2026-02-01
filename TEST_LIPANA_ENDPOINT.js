/**
 * Test script to verify Lipana endpoint is responding
 * Run this after backend is running on port 3001
 */

const API_BASE_URL = 'http://localhost:3001';

async function testLipanaEndpoint() {
  console.log('\n🧪 Testing Lipana Endpoint...\n');
  
  const testPayload = {
    phone: '254712345678',
    amount: '50',
    orderId: 'TEST-ORDER-' + Date.now()
  };

  console.log('📤 Sending request to:', `${API_BASE_URL}/api/lipana/initiate-stk-push`);
  console.log('📋 Payload:', JSON.stringify(testPayload, null, 2));
  console.log('\n-------------------------------------------\n');

  try {
    const response = await fetch(`${API_BASE_URL}/api/lipana/initiate-stk-push`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testPayload)
    });

    console.log('✅ Response received!');
    console.log('   Status:', response.status, response.statusText);
    
    const data = await response.json();
    console.log('   Data:', JSON.stringify(data, null, 2));

    if (response.ok) {
      console.log('\n✅ ENDPOINT IS WORKING!\n');
    } else {
      console.log('\n⚠️ Endpoint responded but with error status\n');
    }

  } catch (error) {
    console.error('❌ Error testing endpoint:', error.message);
    console.log('\n⚠️ Make sure backend is running on port 3001!\n');
  }
}

testLipanaEndpoint();
