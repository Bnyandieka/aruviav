# 🔴 URGENT: Regenerate Brevo API Key

Your API key was exposed in the chat and must be regenerated immediately.

**Exposed Key:**
```
[REMOVED - PLEASE REGENERATE KEY]
```

## Steps to Regenerate:

1. **Login to Brevo:**
   - Go to https://app.brevo.com
   - Sign in with your account

2. **Delete Old API Key:**
   - Click on your account name (top right)
   - Select "SMTP & API"
   - Find the exposed key and delete it

3. **Create New API Key:**
   - In the same SMTP & API section
   - Click "Create a new API key"
   - Name it: "Shopki App"
   - Select scope: All access
   - Click "Generate"
   - Copy the new key (starts with `xkeysib-`)

4. **Update .env:**
   - Open `.env` file in your project root
   - Replace the old key with the new key:
   ```
   REACT_APP_BREVO_API_KEY=xkeysib-[NEW-KEY-HERE]
   ```

5. **Restart React App:**
   ```bash
   npm start
   ```

## What I Fixed:

The Brevo API key initialization issue has been fixed in `src/services/email/brevoService.js`. The axios client is now created dynamically inside functions instead of at module load time, so it will pick up the environment variable correctly.

## Testing:

After updating the .env and restarting:

1. **Create a new account** - You should receive a welcome email
2. **Place an order** - You should receive an order confirmation
3. **Check your email inbox** - Verify emails are arriving

## Additional Setup:

Before the first email is sent, you also need to:

- **Verify your sender email in Brevo:**
  - Go to https://app.brevo.com
  - Click "Senders" 
  - Add your sender email (e.g., orders@yourdomain.com)
  - Click the verification link in the email you receive

- **Verify the newsletter list ID:**
  - Go to "Contacts" → "Lists"
  - Copy your list ID
  - Add to .env: `REACT_APP_BREVO_NEWSLETTER_LIST_ID=2` (your list ID)

