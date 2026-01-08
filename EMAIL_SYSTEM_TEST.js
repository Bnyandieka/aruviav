// Test Email Creation - Run in browser console
// Use this to verify the email system is working

// Test 1: Create a test email in admin inbox
async function testCreateEmail() {
  const { saveEmailToAdminInbox } = await import('./src/services/email/adminEmailService');
  
  const result = await saveEmailToAdminInbox({
    to: 'test@example.com',
    from: 'noreply@aruviah.com',
    subject: '🧪 Test Email - ' + new Date().toLocaleTimeString(),
    htmlContent: '<p>This is a test email</p><p>Created at: ' + new Date().toLocaleString() + '</p>',
    type: 'test',
    relatedData: {
      test: true,
      timestamp: new Date().toISOString()
    },
    isSent: false
  });  return result;
}

// Test 2: Fetch emails from admin inbox
async function testFetchEmails(section = 'all') {
  const { getEmailsBySection } = await import('./src/services/email/adminEmailService');
  
  const result = await getEmailsBySection(section, 100);  return result;
}

// Test 3: Check Firestore directly
async function testFirestore() {
  const { db } = await import('./src/services/firebase/config');
  const { collection, getDocs, query, orderBy } = await import('firebase/firestore');
  
  try {
    const q = query(
      collection(db, 'admin_emails'),
      orderBy('createdAt', 'desc')
    );
    
    const snapshot = await getDocs(q);    })));
    
    return snapshot;
  } catch (error) {
    console.error('Firestore error:', error);
    return error;
  }
}

// Test 4: Test email send
async function testSendEmail() {
  const { sendTransactionalEmail } = await import('./src/services/email/brevoService');
  
  const result = await sendTransactionalEmail({
    email: 'test@example.com',
    subject: '🧪 Test Send Email - ' + new Date().toLocaleTimeString(),
    htmlContent: '<p>Test email from Brevo service</p>',
    saveToAdminInbox: true,
    emailType: 'test',
    relatedData: {
      test: true
    }
  });  return result;
}

// Run tests:console.log('1. testCreateEmail() - Create test email');
console.log('2. testFetchEmails("all") - Fetch all emails');
console.log('3. testFirestore() - Check Firestore directly');
console.log('4. testSendEmail() - Test email sending');
console.log('\nRun in browser console: await testCreateEmail()');
