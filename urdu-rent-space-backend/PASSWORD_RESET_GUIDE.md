# 🔐 Password Reset Guide

## Quick Start

For your Super Admin account (`superadmin@urdorentspace.com`), run:

```bash
cd /Users/macbookpro/Downloads/mudassir/urdu-rent-space-backend
node scripts/resetPassword.js superadmin@urdorentspace.com YourNewPassword123
```

---

## Two Methods Available

### Method 1: Quick Command-Line (Recommended for Fast Reset)

```bash
node scripts/resetPassword.js <email> <newPassword>
```

**Example:**
```bash
node scripts/resetPassword.js superadmin@urdorentspace.com Admin@2024
```

**Output:**
```
🔌 Connecting to MongoDB...
✅ Connected to MongoDB successfully

🔍 Looking for user with email: superadmin@urdorentspace.com
✅ User found: Super Admin (superadmin@urdorentspace.com)
   Role: both
   Is Admin: false
   Is Super Admin: false

🔐 Hashing new password...

✅ Password reset successful!

📋 New Credentials:
   Email: superadmin@urdorentspace.com
   Password: Admin@2024

⚠️  Please save these credentials securely and delete this output.
💡 It's recommended to change the password after first login.

🔌 MongoDB connection closed
```

---

### Method 2: Interactive (Recommended for Safety)

```bash
node scripts/resetPasswordInteractive.js
```

**Then follow the prompts:**

```
╔═══════════════════════════════════════════╗
║    🔐 Password Reset Utility Tool 🔐      ║
╚═══════════════════════════════════════════╝

🔌 Connecting to MongoDB...
✅ Connected to MongoDB successfully

Enter user email: superadmin@urdorentspace.com

🔍 Searching for user...

✅ User found:
─────────────────────────────────────────
📧 Email:        superadmin@urdorentspace.com
👤 Name:         Super Admin
📱 Phone:        +923007654321
🎭 Role:         both
👮 Admin:        No
⭐ Super Admin:  No
📊 Status:       active
─────────────────────────────────────────

Do you want to reset this user's password? (yes/no): yes

Enter new password (min 8 characters): ********
Confirm new password: ********

🔐 Hashing password...
💾 Updating password in database...

╔═══════════════════════════════════════════╗
║         ✅ Password Reset Success!        ║
╚═══════════════════════════════════════════╝

📋 Login Credentials:
   📧 Email:    superadmin@urdorentspace.com
   🔑 Password: [your new password]

⚠️  Security Notes:
   • Save these credentials securely
   • Clear your terminal history
   • Change password after first login
   • Login attempts have been reset

🔌 Connection closed
```

---

## Prerequisites

Before running the scripts, ensure:

1. **Navigate to backend directory:**
   ```bash
   cd /Users/macbookpro/Downloads/mudassir/urdu-rent-space-backend
   ```

2. **Dependencies are installed:**
   ```bash
   npm install
   ```

3. **`.env` file exists** with correct `MONGODB_URI`:
   ```
   MONGODB_URI=mongodb+srv://hamzakhan68485537_db_user:Z0kqUDT51V8ekxZm@cluster0.ydy8xtc.mongodb.net/urdu-rent-space
   ```

---

## Password Requirements

- Minimum 8 characters
- Can include letters, numbers, and special characters
- Examples of strong passwords:
  - `Admin@2024!`
  - `SuperSecure123`
  - `MyNewPass@456`

---

## Troubleshooting

### Problem: "User not found"
**Solution:** Double-check the email address spelling and ensure it exists in the database.

### Problem: "MongoDB connection error"
**Solution:** 
- Check `.env` file has correct `MONGODB_URI`
- Verify internet connection
- Confirm MongoDB Atlas credentials are valid

### Problem: "Password must be at least 8 characters"
**Solution:** Use a longer password (minimum 8 characters).

---

## After Reset

1. **Test the login** with new credentials
2. **Change password** through the app's settings
3. **Clear terminal history:**
   ```bash
   history -c
   ```
4. **Close the terminal** to remove password from screen

---

## Security Best Practices

✅ **Do:**
- Use strong, unique passwords
- Clear terminal after resetting
- Keep scripts access restricted
- Log password reset actions
- Change password after first login

❌ **Don't:**
- Share passwords in plain text
- Leave terminal output visible
- Use simple passwords like "password123"
- Reset passwords without user notification
- Store passwords in version control

---

## Need More Help?

See the detailed documentation:
```bash
cat /Users/macbookpro/Downloads/mudassir/urdu-rent-space-backend/scripts/README.md
```

Or check the scripts themselves for inline comments and documentation.
