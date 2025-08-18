# 🍕 FoodiBot - AI-Powered Food Ordering System

A complete AI-powered food ordering system with SMS, WhatsApp, and Email notifications.

## 🚀 Features

- **AI Chatbot**: Dialogflow ES integration for natural conversations
- **Order Management**: Add, remove, and track orders
- **Multi-Channel Notifications**: SMS, WhatsApp, and Email
- **Contact Collection**: Automatic phone and email collection
- **Admin Dashboard**: Web-based admin panel
- **Analytics**: Sales and customer analytics

## 📁 Project Structure

```
testing/
├── main.py                 # Main bot application
├── notification_system.py  # SMS, WhatsApp, Email notifications
├── db_helper.py           # Database operations
├── generic_helper.py      # Utility functions
├── env_template.txt       # Environment variables template
├── requirements.txt       # Python dependencies
├── web_chat.html         # Web chat interface
├── dialogflow_fix_guide.md # Dialogflow setup guide
├── my-admin-dashboard/   # Admin dashboard (Next.js)
└── r.w/                  # Backup files
```

## 🛠️ Setup Instructions

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Configure Environment Variables
Copy `env_template.txt` to `.env` and update with your credentials:
```
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
TWILIO_PHONE_NUMBER=your_twilio_number
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
```

### 3. Start the Bot
```bash
python main.py
```

## 📱 Notification Setup

### Email (Gmail)
1. Enable 2-Factor Authentication
2. Generate App Password
3. Update `EMAIL_PASSWORD` in environment variables

### WhatsApp
1. Join Twilio WhatsApp sandbox
2. Send code to +14155238886
3. Test with your phone number

### SMS
1. Buy Twilio phone number
2. Update `TWILIO_PHONE_NUMBER` in environment variables

## 🔧 API Endpoints

- `POST /` - Dialogflow webhook
- `GET /api/menu` - Get menu items
- `GET /api/orders` - Get all orders
- `PUT /api/orders/{id}/status` - Update order status
- `GET /api/analytics` - Get analytics data

## 🎯 Usage

1. **Start the bot**: `python main.py`
2. **Configure Dialogflow ES** with webhook URL
3. **Test notifications** with your phone/email
4. **Access admin dashboard** at `http://localhost:3000`

## 📊 Features Status

- ✅ **SMS Notifications**: Working
- ✅ **Email Notifications**: Working  
- ✅ **WhatsApp Notifications**: Working
- ✅ **Order Management**: Working
- ✅ **Contact Collection**: Working
- ✅ **Admin Dashboard**: Ready

## 🎉 Your FoodiBot is Ready!

All notifications are working perfectly. Start your bot and begin taking orders! 