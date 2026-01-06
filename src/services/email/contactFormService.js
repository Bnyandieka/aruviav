// Contact Form Email Service
import axios from 'axios';
import { saveEmailToAdminInbox } from './adminEmailService';
import { getEmailTemplate } from './brevoService';

const BREVO_API_BASE = 'https://api.brevo.com/v3';

const getBrevClient = () => {
  const apiKey = process.env.REACT_APP_BREVO_API_KEY;
  
  if (!apiKey) {
    console.warn('⚠️ REACT_APP_BREVO_API_KEY is not set. Contact form emails will fail.');
  }
  
  return axios.create({
    baseURL: BREVO_API_BASE,
    headers: {
      'api-key': apiKey,
      'Content-Type': 'application/json'
    }
  });
};

/**
 * Send contact form message to admin and confirmation to user
 * @param {Object} contactData - { name, email, phone, subject, message }
 */
export const sendContactFormEmail = async (contactData) => {
  try {
    const { name, email, phone, subject, message } = contactData;
    const senderEmail = process.env.REACT_APP_BREVO_SENDER_EMAIL;
    
    if (!senderEmail) {
      throw new Error('Sender email is not configured. Please set REACT_APP_BREVO_SENDER_EMAIL in .env');
    }
    
    const brevoClient = getBrevClient();

    // Get the custom contact form template or use default
    let userEmailTemplate;
    try {
      userEmailTemplate = await getEmailTemplate('contactFormConfirmation');
    } catch (err) {
      console.warn('⚠️ Custom template not found, using default');
      userEmailTemplate = null;
    }

    // Build confirmation email with custom or default template
    let userEmailContent;
    let confirmationSubject;

    if (userEmailTemplate && userEmailTemplate.htmlContent) {
      // Replace variables in custom template
      userEmailContent = userEmailTemplate.htmlContent
        .replace(/{{name}}/g, name)
        .replace(/{{email}}/g, email)
        .replace(/{{subject}}/g, subject || 'No subject')
        .replace(/{{message}}/g, message)
        .replace(/{{phone}}/g, phone || 'Not provided')
        .replace(/{{currentYear}}/g, new Date().getFullYear());
      confirmationSubject = userEmailTemplate.subject || `We received your message - ${subject || 'Contact Form Submission'}`;
    } else {
      // Use default template
      confirmationSubject = `We received your message - ${subject || 'Contact Form Submission'}`;
      userEmailContent = `
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
              .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 5px 5px; }
              .footer { background: #333; color: white; padding: 10px; text-align: center; font-size: 12px; border-radius: 0 0 5px 5px; }
              h2 { color: #667eea; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Thank You!</h1>
              </div>
              <div class="content">
                <p>Hi ${name},</p>
                <p>We've received your message and appreciate you reaching out to Aruviah.</p>
                <p><strong>Your Message Details:</strong></p>
                <ul>
                  <li><strong>Subject:</strong> ${subject || 'No subject'}</li>
                  <li><strong>Message:</strong> ${message}</li>
                  ${phone ? `<li><strong>Phone:</strong> ${phone}</li>` : ''}
                </ul>
                <p>Our team will review your message and get back to you as soon as possible, typically within 24 hours.</p>
                <p>Best regards,<br><strong>Aruviah Team</strong></p>
              </div>
              <div class="footer">
                <p>&copy; ${new Date().getFullYear()} Aruviah. All rights reserved.</p>
              </div>
            </div>
          </body>
        </html>
      `;
    }

    await brevoClient.post('/smtp/email', {
      to: [{ email: email, name: name }],
      sender: { name: 'Aruviah Support', email: senderEmail },
      subject: confirmationSubject,
      htmlContent: userEmailContent
    });

    console.log('✅ Confirmation email sent to user');

    // 2. Send notification email to admin
    const adminEmailContent = `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #dc2626; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
            .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 5px 5px; }
            .footer { background: #333; color: white; padding: 10px; text-align: center; font-size: 12px; }
            .info-box { background: white; padding: 15px; border-left: 4px solid #dc2626; margin: 15px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔔 New Contact Form Submission</h1>
            </div>
            <div class="content">
              <p>You have received a new message through the contact form:</p>
              
              <div class="info-box">
                <p><strong>Name:</strong> ${name}</p>
                <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
                ${phone ? `<p><strong>Phone:</strong> <a href="tel:${phone}">${phone}</a></p>` : ''}
                <p><strong>Subject:</strong> ${subject || 'No subject provided'}</p>
              </div>

              <p><strong>Message:</strong></p>
              <div class="info-box">
                <p>${message.replace(/\n/g, '<br>')}</p>
              </div>

              <p><strong>Action Required:</strong> Please review and respond to this message as soon as possible.</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} Aruviah. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const adminEmail = process.env.REACT_APP_ADMIN_EMAIL || senderEmail;
    
    await brevoClient.post('/smtp/email', {
      to: [{ email: adminEmail, name: 'Aruviah Admin' }],
      replyTo: { email: email, name: name },
      sender: { name: 'Aruviah Contact Form', email: senderEmail },
      subject: `New Contact Form: ${subject || 'Contact Form Submission'}`,
      htmlContent: adminEmailContent
    });

    console.log('✅ Admin notification email sent');

    // 3. Save to admin inbox for record
    try {
      await saveEmailToAdminInbox({
        to: adminEmail,
        from: `${name} <${email}>`,
        subject: `New Contact Form: ${subject || 'Contact Form Submission'}`,
        htmlContent: adminEmailContent,
        type: 'CONTACT_FORM',
        relatedId: null,
        relatedData: {
          senderName: name,
          senderEmail: email,
          senderPhone: phone || 'Not provided'
        }
      });
      console.log('✅ Email saved to admin inbox');
    } catch (inboxError) {
      console.warn('⚠️ Warning: Email sent but not saved to inbox:', inboxError.message);
      // Don't fail the entire process if inbox save fails
    }

    return { success: true, message: 'Your message has been sent successfully!' };

  } catch (error) {
    console.error('❌ Error sending contact form email:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || error.message || 'Failed to send message. Please try again.');
  }
};
