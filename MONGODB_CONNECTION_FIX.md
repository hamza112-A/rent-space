# 🔧 MongoDB Connection Fix Guide

## ❌ Current Error

```
❌ Database connection failed: queryTxt ETIMEOUT cluster0.ydy8xtc.mongodb.net
```

This error means your backend can't reach MongoDB Atlas due to network/firewall issues.

---

## ✅ Quick Solutions (Try in Order)

### **Solution 1: Whitelist Your IP in MongoDB Atlas** ⭐ (MOST COMMON FIX)

Your current IP address is likely blocked by MongoDB Atlas.

#### Steps:

1. **Go to MongoDB Atlas**
   - Visit: https://cloud.mongodb.com/
   - Log in with your account

2. **Navigate to Network Access**
   - Click **"Network Access"** in the left sidebar
   - OR: Click your project → "Security" → "Network Access"

3. **Add IP Address**
   - Click **"Add IP Address"** button
   - Choose one option:
     - **"Add Current IP Address"** (recommended for production)
     - **"Allow Access from Anywhere"** (easier for development)
       - This adds `0.0.0.0/0` which allows all IPs

4. **Save and Wait**
   - Click **"Confirm"**
   - **Wait 1-2 minutes** for the change to propagate

5. **Test Connection**
   ```bash
   cd /Users/macbookpro/Downloads/mudassir/urdu-rent-space-backend
   node test-mongodb.js
   ```

---

### **Solution 2: Test Your Connection**

I've created a test script for you.

```bash
cd /Users/macbookpro/Downloads/mudassir/urdu-rent-space-backend
node test-mongodb.js
```

This will:
- ✅ Test MongoDB connection
- ✅ Show detailed error messages
- ✅ Suggest specific fixes
- ✅ List available collections if successful

---

### **Solution 3: Check MongoDB Cluster Status**

Your cluster might be paused or experiencing issues.

1. Go to https://cloud.mongodb.com/
2. Check your cluster status
3. Look for:
   - ⚠️ "Paused" indicator
   - ⚠️ "Upgrading" status
   - ⚠️ Red error indicators

If paused, click "Resume" and wait a few minutes.

---

### **Solution 4: Verify Credentials**

Check if username/password are correct.

**Current credentials in `.env`:**
- Username: `hamzakhan68485537_db_user`
- Password: `Z0kqUDT51V8ekxZm`
- Cluster: `cluster0.ydy8xtc.mongodb.net`
- Database: `urdu-rent-space`

**To verify:**
1. Go to MongoDB Atlas
2. Click "Database Access"
3. Check if user `hamzakhan68485537_db_user` exists
4. If not, create a new user or update `.env` with correct credentials

---

### **Solution 5: Check Internet Connection**

Test if you can reach MongoDB:

```bash
# Test DNS resolution
ping cluster0.ydy8xtc.mongodb.net

# Test with dig (if available)
dig cluster0.ydy8xtc.mongodb.net
```

If these fail:
- Check your internet connection
- Disable VPN if using one
- Check firewall settings
- Try a different network

---

### **Solution 6: Use Different Connection String Format**

I've already updated your `.env` with better options:

```env
MONGODB_URI=mongodb+srv://hamzakhan68485537_db_user:Z0kqUDT51V8ekxZm@cluster0.ydy8xtc.mongodb.net/urdu-rent-space?retryWrites=true&w=majority
```

The `?retryWrites=true&w=majority` parameters help with reliability.

---

## 🧪 Testing Commands

### Test MongoDB Connection
```bash
cd urdu-rent-space-backend
node test-mongodb.js
```

### Start Backend (After Fix)
```bash
cd urdu-rent-space-backend
npm run dev
```

### Check Server Health
```bash
curl http://localhost:5000/health
```

---

## 🔍 Common Error Messages & Fixes

### Error: `ETIMEOUT` or `queryTxt ETIMEOUT`
**Cause:** Network timeout (can't reach MongoDB)
**Fix:** Whitelist your IP in MongoDB Atlas (Solution 1)

### Error: `authentication failed`
**Cause:** Wrong username or password
**Fix:** Verify credentials in MongoDB Atlas (Solution 4)

### Error: `ENOTFOUND`
**Cause:** Can't resolve domain name
**Fix:** Check internet/DNS (Solution 5)

### Error: `MongoServerError: bad auth`
**Cause:** Invalid credentials or user doesn't have permission
**Fix:** Check Database Access in MongoDB Atlas

### Error: `ECONNREFUSED`
**Cause:** MongoDB cluster is down or not accepting connections
**Fix:** Check cluster status in MongoDB Atlas (Solution 3)

---

## ✅ After the Fix

Once MongoDB connects successfully, you should see:

```
✅ MongoDB Connected: cluster0-shard-00-01.ydy8xtc.mongodb.net
🚀 Server running in development mode
📡 Port: 5000
🌐 API: http://localhost:5000/api/v1
```

---

## 🚀 Full Restart Procedure

After making changes:

```bash
# Stop the backend (Ctrl+C if running)

# Clear any cache (optional)
cd urdu-rent-space-backend
rm -rf node_modules/.cache

# Restart
npm run dev
```

---

## 📞 Still Not Working?

If you've tried everything and it still doesn't work:

### Option A: Use Local MongoDB (Development Only)

1. Install MongoDB locally:
   ```bash
   brew install mongodb-community@7.0  # macOS
   brew services start mongodb-community@7.0
   ```

2. Update `.env`:
   ```env
   MONGODB_URI=mongodb://localhost:27017/urdu-rent-space
   ```

### Option B: Create New MongoDB Atlas Cluster

1. Go to MongoDB Atlas
2. Create a new FREE cluster
3. Set up database access (user + password)
4. Set up network access (allow all IPs)
5. Get new connection string
6. Update `.env` with new URI

---

## 📋 Checklist

Before running backend, verify:

- [ ] IP whitelisted in MongoDB Atlas
- [ ] Cluster is running (not paused)
- [ ] Credentials are correct
- [ ] Internet connection working
- [ ] `.env` file has correct MONGODB_URI
- [ ] Waited 1-2 minutes after whitelisting IP

---

## 🎯 Next Steps

1. **Fix MongoDB connection** using Solution 1 (whitelist IP)
2. **Test connection** with `node test-mongodb.js`
3. **Start backend** with `npm run dev`
4. **Start frontend** with `npm run dev` (in urdu-rent-space folder)
5. **Test forgot password** feature

---

## 📧 Test Without Database (Optional)

If you need to test the frontend without database:

You can mock the auth endpoints temporarily or use the frontend in isolation mode. Let me know if you need help with this.

---

**TL;DR:** Go to MongoDB Atlas → Network Access → Add IP Address → Allow 0.0.0.0/0 → Wait 2 minutes → Restart backend ✅
