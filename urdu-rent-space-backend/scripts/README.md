# Utility Scripts

This directory contains utility scripts for managing the Urdu Rent Space application.

## Password Reset Scripts

Two password reset scripts are available:

### 1. Command-Line Version (`resetPassword.js`)

Quick one-line password reset.

**Usage:**
```bash
node scripts/resetPassword.js <email> <newPassword>
```

**Example:**
```bash
node scripts/resetPassword.js superadmin@urdorentspace.com Admin@123
```

**Features:**
- Fast and scriptable
- Good for automation
- Requires email and password as arguments
- Validates password length (min 8 characters)
- Resets login attempts and unlocks account

---

### 2. Interactive Version (`resetPasswordInteractive.js`)

User-friendly interactive prompt.

**Usage:**
```bash
node scripts/resetPasswordInteractive.js
```

**Features:**
- Step-by-step prompts
- Shows user details before resetting
- Confirmation prompt for safety
- Password confirmation
- More verbose output
- Better for manual use

---

## What These Scripts Do

Both scripts will:

1. ✅ Connect to MongoDB using your `.env` configuration
2. 🔍 Find the user by email address
3. 🔐 Hash the new password using bcrypt (same as app)
4. 💾 Update the password in the database
5. 🔓 Reset login attempts to 0
6. 🔓 Remove account lock (if locked)
7. 📅 Update `passwordChangedAt` timestamp

---

## Requirements

- Node.js installed
- All dependencies installed (`npm install`)
- Valid `.env` file with `MONGODB_URI`
- Network access to MongoDB

---

## Security Notes

⚠️ **Important Security Considerations:**

1. **Clear Terminal History**: After running, clear your terminal history to remove the password from logs
   ```bash
   history -c  # Linux/Mac
   ```

2. **Delete Output**: Don't leave password details in terminal sessions

3. **Change After Login**: Recommend users change the password after first login

4. **Restrict Access**: These scripts should only be run by system administrators

5. **Production Use**: In production, consider additional security measures:
   - Require multi-factor authentication
   - Log password reset actions
   - Send notification emails to users
   - Implement audit trails

---

## Troubleshooting

### Connection Errors

If you see MongoDB connection errors:

```bash
❌ MongoDB connection error: ...
```

**Check:**
- `.env` file exists and has correct `MONGODB_URI`
- MongoDB server is running
- Network connectivity
- MongoDB credentials are correct

### User Not Found

```bash
❌ User not found with email: ...
```

**Check:**
- Email spelling is correct
- Email is lowercase in database
- User actually exists in database

### Password Too Short

```bash
❌ Password must be at least 8 characters long
```

**Solution:**
- Use a password with at least 8 characters
- Follow password best practices

---

## Examples

### Reset Super Admin Password
```bash
node scripts/resetPassword.js superadmin@urdorentspace.com NewSecure@123
```

### Reset Regular User Password
```bash
node scripts/resetPassword.js user@example.com MyNewPass123
```

### Interactive Reset
```bash
node scripts/resetPasswordInteractive.js
# Follow the prompts
```

---

## Additional Scripts

### Other utility scripts in this directory:

- `deploy.sh` - Deployment automation
- `health-check.sh` - Application health checks

---

## Need Help?

If you encounter issues:

1. Check the `.env` file configuration
2. Verify MongoDB connection
3. Ensure all npm packages are installed
4. Check Node.js version compatibility
5. Review application logs

---

## Development Notes

- Scripts use the same User model as the application
- Password hashing uses bcrypt with configurable salt rounds
- Scripts properly close MongoDB connections
- Exit codes: 0 (success), 1 (error)
