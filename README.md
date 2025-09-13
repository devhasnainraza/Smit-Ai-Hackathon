# Smit AI Hackathon - Dialogflow + AI Customer Support Project

This repository contains both the admin dashboard (Next.js) and webhook service (Python) for a Dialogflow-powered AI customer support system.

## Project Structure

```
├── admin-dashboard/     # Next.js admin dashboard
│   ├── src/
│   │   ├── app/
│   │   │   ├── admin/    # Admin pages (analytics, menu, orders)
│   │   │   └── layout.tsx
│   │   └── components/   # Reusable components
│   ├── package.json
│   └── next.config.mjs
├── webhook/             # Python webhook service
│   ├── main.py          # Main Flask/FastAPI application
│   ├── db_helper.py     # Database operations
│   ├── notification_system.py
│   └── requirements.txt
└── README.md
```

## Deployment Guide

### 1. Admin Dashboard (Vercel)

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your GitHub repository
4. **Important**: Set Root Directory to `admin-dashboard`
5. Build Settings:
   - Framework Preset: Next.js
   - Install Command: `npm install`
   - Build Command: `npm run build`
   - Output Directory: `.next` (auto-detected)
6. Environment Variables:
   - `NEXT_PUBLIC_API_BASE_URL=https://your-webhook-service.onrender.com`
7. Deploy

**Result**: `https://your-admin-dashboard.vercel.app`

### 2. Webhook Service (Render)

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New" → "Web Service"
3. Connect your GitHub repository
4. **Important**: Set Root Directory to `webhook`
5. Configuration:
   - Runtime: Python 3
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `gunicorn main:app` (or `python main.py` if custom server)
6. Environment Variables:
   - `MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/dbname`
   - Add any other API keys your webhook needs
7. Deploy

**Result**: `https://your-webhook-service.onrender.com`

### 3. Dialogflow ES Configuration

1. Go to [Dialogflow Console](https://dialogflow.cloud.google.com)
2. Select your agent
3. Go to "Fulfillment" → "Webhook"
4. Enable webhook
5. Set URL: `https://your-webhook-service.onrender.com/webhook`
6. For each intent that needs server logic:
   - Enable "Use webhook"

## Local Development

### Admin Dashboard
```bash
cd admin-dashboard
npm install
npm run dev
# Runs on http://localhost:3000
```

### Webhook Service
```bash
cd webhook
pip install -r requirements.txt
python main.py
# Runs on http://localhost:8000
```

## Environment Variables

### Admin Dashboard (.env.local)
```
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

### Webhook Service (.env)
```
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/dbname
# Add other API keys as needed
```

## Features

- **Admin Dashboard**: Menu management, order tracking, analytics
- **Webhook Service**: Dialogflow fulfillment, database operations, notifications
- **Real-time Updates**: Order status changes, menu modifications
- **Analytics**: Sales reports, customer insights

## Tech Stack

- **Frontend**: Next.js 15, TypeScript, Tailwind CSS
- **Backend**: Python, Flask/FastAPI
- **Database**: MongoDB
- **AI**: Dialogflow ES
- **Deployment**: Vercel (Frontend), Render (Backend)
