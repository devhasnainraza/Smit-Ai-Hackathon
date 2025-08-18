#!/usr/bin/env python3
"""
Test script for notification system
Tests MSG91 SMS, GreenAPI WhatsApp, and Gmail Email
"""

import os
from dotenv import load_dotenv
from notification_system import NotificationSystem
import logging

# Load environment variables
load_dotenv()

# Setup logging
logging.basicConfig(level=logging.INFO)

def test_notification_system():
    """Test all notification channels"""
    print("🧪 Testing Notification System...")
    
    # Initialize notification system
    notifications = NotificationSystem()
    
    # Test user info
    user_info = {
        "phone": "+923192004088",  # Your phone number
        "email": "chat.hasnain@gmail.com"
    }
    
    # Test order details
    order_details = {
        "order_id": "TEST123",
        "status": "confirmed",
        "total_amount": 25.99,
        "items": {"burger": 2, "pizza": 1},
        "item_prices": {"burger": 8.99, "pizza": 12.99},
        "eta": "30 minutes"
    }
    
    print("\n📱 Testing SMS (MSG91)...")
    sms_result = notifications.send_sms(user_info["phone"], "🧪 Test SMS from FoodiBot!")
    print(f"SMS Result: {sms_result}")
    
    print("\n📱 Testing WhatsApp (GreenAPI)...")
    whatsapp_result = notifications.send_whatsapp(user_info["phone"], "🧪 Test WhatsApp from FoodiBot!")
    print(f"WhatsApp Result: {whatsapp_result}")
    
    print("\n📧 Testing Email (Gmail)...")
    email_result = notifications.send_email(
        user_info["email"], 
        "🧪 Test Email from FoodiBot", 
        "<h1>Test Email</h1><p>This is a test email from FoodiBot!</p>",
        "Test Email\nThis is a test email from FoodiBot!"
    )
    print(f"Email Result: {email_result}")
    
    print("\n🎯 Testing Complete Order Confirmation...")
    complete_result = notifications.send_order_confirmation(user_info, order_details)
    print(f"Complete Result: {complete_result}")
    
    print("\n✅ Test Complete!")
    return {
        "sms": sms_result,
        "whatsapp": whatsapp_result,
        "email": email_result,
        "complete": complete_result
    }

if __name__ == "__main__":
    results = test_notification_system()
    
    print("\n📊 Summary:")
    print(f"SMS Success: {results['sms']['success']}")
    print(f"WhatsApp Success: {results['whatsapp']['success']}")
    print(f"Email Success: {results['email']['success']}")
    
    if results['sms']['success']:
        print("✅ SMS working!")
    else:
        print("❌ SMS failed:", results['sms'].get('error', 'Unknown error'))
    
    if results['whatsapp']['success']:
        print("✅ WhatsApp working!")
    else:
        print("❌ WhatsApp failed:", results['whatsapp'].get('error', 'Unknown error'))
    
    if results['email']['success']:
        print("✅ Email working!")
    else:
        print("❌ Email failed:", results['email'].get('error', 'Unknown error'))
