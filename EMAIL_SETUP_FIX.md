# 📧 Gmail Email Setup Fix

## ❌ Current Error

```
Invalid login: 535-5.7.8 Username and Password not accepted
```

Gmail is rejecting your email credentials. Here's how to fix it:

---

## ✅ Solution: Use Gmail App Password

Gmail no longer allows "less secure apps" to use regular passwords. You need to create an **App Password**.

### Step-by-Step Guide:

#### 1. Enable 2-Step Verification (if not already enabled)

1. Go to: https://myaccount.google.com/security
2. Scroll to "How you sign in to Google"
3. Click **"2-Step Verification"**
4. Follow the prompts to enable it
5. **Important:** You MUST have 2FA enabled to create App Passwords

#### 2. Create App Password

1. Go to: https://myaccount.google.com/apppasswords
   - Or: Google Account → Security → 2-Step Verification → App passwords
2. Sign in if prompted
3. Click **"Select app"** dropdown
4. Choose **"Mail"** (or "Other (Custom name)")
5. If custom, name it: "Urdu Rent Space Backend"
6. Click **"Generate"**
7. **Copy the 16-character password** (something like: `abcd efgh ijkl mnop`)
8. **IMPORTANT:** Remove spaces, so it becomes: `abcdefghijklmnop`

#### 3. Update Your `.env` File

Replace the current email password with the new App Password:

```env
EMAIL_PASS=abcdefghijklmnop
```

**Remove all spaces from the App Password!**

---

## 🔧 Quick Fix Commands

### Option 1: Update .env Manually

1. Open: `/Users/macbookpro/Downloads/mudassir/urdu-rent-space-backend/.env`
2. Find the line: `EMAIL_PASS=fjdifcoblahfphxv`
3. Replace with your new App Password (no spaces!)
4. Save the file
5. Restart backend: Press Ctrl+C, then `npm run dev`

### Option 2: Temporary Testing (Skip Email)

If you just want to test the app without email for now, you can temporarily disable email verification:

The forgot password will still generate tokens and save them to the database, but won't send emails.

---

## 🧪 Test Email After Fix

I've created a test script for you:

```bash
cd /Users/macbookpro/Downloads/mudassir/urdu-rent-space-backend
node test-email.js
```

This will test if email sending works.

---

## 📋 Current Email Configuration

**From your `.env`:**
```
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=hamza100xdev@gmail.com
EMAIL_PASS=fjdifcoblahfphxv  ← THIS NEEDS TO BE REPLACED
```

**What you need:**
```
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=hamza100xdev@gmail.com
EMAIL_PASS=YOUR_16_CHAR_APP_PASSWORD  ← New App Password here
```

---

## 🔐 Security Note

**Never share your App Password!**
- It's as powerful as your real password
- Each app should have its own App Password
- You can revoke App Passwords anytime from Google Account settings

---

## 🚀 After Fixing Email

Once you update the App Password:

1. **Restart Backend:**
   ```bash
   # Press Ctrl+C
   npm run dev
   ```

2. **Test Forgot Password:**
   - Go to: http://localhost:8080/forgot-password
   - Enter: superadmin@urdorentspace.com
   - You should receive the reset email!

---

## 🎯 Alternative: Use Different Email Service

If you don't want to use Gmail, you can use:

### Option A: Mailtrap (Development/Testing)
```env
EMAIL_HOST=smtp.mailtrap.io
EMAIL_PORT=2525
EMAIL_USER=your_mailtrap_user
EMAIL_PASS=your_mailtrap_pass
```
Sign up: https://mailtrap.io/

### Option B: SendGrid
```env
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USER=apikey
EMAIL_PASS=your_sendgrid_api_key
```
Sign up: https://sendgrid.com/

### Option C: AWS SES
Use AWS Simple Email Service (more setup required)

---

## 🐛 Troubleshooting

### Still getting "Invalid login"?
- Make sure you copied the ENTIRE App Password (16 characters)
- Remove ALL spaces from the password
- Make sure 2FA is enabled on your Google account
- Try generating a new App Password

### "App passwords" option not showing?
- You need to enable 2-Step Verification first
- Some Google Workspace accounts may have this disabled by admin

### Email sending but not receiving?
- Check spam folder
- Check "Promotions" or "Updates" tab in Gmail
- Verify the recipient email is correct

---

## ✅ Quick Checklist

Before testing:
- [ ] 2-Step Verification enabled on Google account
- [ ] App Password generated from Google
- [ ] Spaces removed from App Password
- [ ] `.env` file updated with new password
- [ ] Backend restarted after updating `.env`
- [ ] Correct email address (hamza100xdev@gmail.com)

---

## 🎉 Summary

1. **Enable 2FA** on your Google account
2. **Generate App Password** at https://myaccount.google.com/apppasswords
3. **Update `.env`** with the 16-character password (no spaces)
4. **Restart backend**
5. **Test forgot password** feature

---

## 📞 Need Help?

If you're still having issues:

1. Double-check the App Password is correct
2. Try generating a new one
3. Consider using Mailtrap for testing (easier setup)
4. Check Google Account security settings

**For now, the app works except for email sending. The forgot password feature saves tokens to the database, but just can't send the email.**

---

**TL;DR:** 
Go to https://myaccount.google.com/apppasswords → Generate → Copy password (remove spaces) → Update `EMAIL_PASS` in `.env` → Restart backend ✅
