# Quick Start Guide

## Fast Setup (5 minutes)

### Step 1: Setup MySQL Database

```bash
# Login to MySQL
mysql -u root -p

# Run these commands:
CREATE DATABASE node_dashboard;
USE node_dashboard;

# Then copy and paste the contents from backend/schema.sql
# Or run: source /path/to/backend/schema.sql;
```

### Step 2: Configure Backend

```bash
cd backend

# Edit .env file with your MySQL password
# Change this line:
DB_PASSWORD=your_password

# Install and start
npm install
npm start
```

You should see: "Server running on port 5000"

### Step 3: Start Frontend

In a NEW terminal:

```bash
cd frontend

# Install and start
npm install
npm start
```

Browser will open automatically at http://localhost:3000

## Test Real-Time Features

1. Open http://localhost:3000 in 2 different browser windows
2. Add a product in window 1
3. Watch it appear instantly in window 2! 🎉

## Default Credentials

The schema.sql includes 8 sample products with different statuses.

## Troubleshooting

**Port 5000 already in use?**
```bash
# Kill the process using port 5000
# On Mac/Linux:
lsof -ti:5000 | xargs kill -9

# On Windows:
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

**MySQL connection error?**
- Check MySQL is running: `mysql -u root -p`
- Verify credentials in backend/.env
- Make sure database 'node_dashboard' exists

**Frontend shows connection error?**
- Make sure backend is running first (npm start in backend folder)
- Check http://localhost:5000/api/products in browser
- Clear browser cache

## What to Try First

1. ✅ Add a new product
2. ✅ Change product status using the dropdown
3. ✅ Edit a product
4. ✅ Delete a product
5. ✅ Open in 2 windows and watch real-time updates!

Enjoy! 🚀
