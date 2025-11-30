// Backend API for handling emails with SendGrid
// Location: backend/server.js

const express = require('express');
const cors = require('cors');
const sgMail = require('@sendgrid/mail');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Initialize SendGrid only if API key exists
if (process.env.SENDGRID_API_KEY && process.env.SENDGRID_API_KEY !== 'your_sendgrid_api_key_here') {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  console.log('✅ SendGrid configured successfully');
} else {
  console.warn('⚠️ WARNING: SendGrid API key not configured');
  console.warn('📧 Emails will be logged to console only');
  console.warn('❌ To enable real email sending, update SENDGRID_API_KEY in backend/.env');
}

/**
 * POST /api/send-email
 * Send email via SendGrid
 */
app.post('/api/send-email', async (req, res) => {
  try {
    const { to, subject, html, text } = req.body;

    // Validate input
    if (!to || !subject || !html) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: to, subject, html'
      });
    }

    console.log('\n📧 Email Request:');
    console.log(`   To: ${to}`);
    console.log(`   Subject: ${subject}`);
    console.log(`   From: ${process.env.SENDGRID_FROM_EMAIL || 'support@shopki.com'}`);

    // Check if SendGrid is configured
    if (!process.env.SENDGRID_API_KEY || process.env.SENDGRID_API_KEY === 'your_sendgrid_api_key_here') {
      console.log('   Status: ⚠️ LOGGED TO CONSOLE (SendGrid not configured)');
      console.log('\n📧 Email Content Preview:');
      console.log('---START EMAIL---');
      console.log(html);
      console.log('---END EMAIL---\n');
      
      return res.json({
        success: true,
        message: `Email logged to console (SendGrid not configured). Recipient: ${to}`,
        note: 'To send real emails, configure SENDGRID_API_KEY in backend/.env'
      });
    }

    // Prepare email
    const msg = {
      to,
      from: process.env.SENDGRID_FROM_EMAIL || 'support@shopki.com',
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, '') // Strip HTML if no text provided
    };

    // Send email via SendGrid
    await sgMail.send(msg);

    console.log(`   Status: ✅ SENT via SendGrid\n`);
    res.json({
      success: true,
      message: `Email sent to ${to}`
    });

  } catch (error) {
    console.error('❌ Error sending email:', error.message);
    
    // Check if it's a SendGrid validation error
    if (error.response) {
      return res.status(error.response.status).json({
        success: false,
        error: error.response.body?.errors?.[0]?.message || error.message
      });
    }

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/health
 * Health check endpoint
 */
app.get('/api/health', (req, res) => {
  const sgStatus = process.env.SENDGRID_API_KEY && process.env.SENDGRID_API_KEY !== 'your_sendgrid_api_key_here'
    ? 'configured'
    : 'not_configured';
  
  res.json({
    status: 'ok',
    message: 'Email API server is running',
    sendgrid: sgStatus,
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    error: err.message
  });
});

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`\n🚀 Email API Server`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`Port: ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`SendGrid Status: ${process.env.SENDGRID_API_KEY && process.env.SENDGRID_API_KEY !== 'your_sendgrid_api_key_here' ? '✅ Configured' : '⚠️ Not configured (emails logged to console)'}`);
  console.log(`From Email: ${process.env.SENDGRID_FROM_EMAIL}`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
});
