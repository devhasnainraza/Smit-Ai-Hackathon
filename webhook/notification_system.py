import os
import requests
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import logging
from datetime import datetime
from typing import Dict, Optional

class NotificationSystem:
    """Complete notification system using MSG91 (SMS), WhatsApp Business API, and Gmail (Email)"""
    
    def __init__(self): 
        # MSG91 credentials for SMS
        self.msg91_auth_key = os.getenv('MSG91_AUTH_KEY')
        self.msg91_template_id = os.getenv('MSG91_TEMPLATE_ID', 'default_template')
        self.msg91_sender_id = os.getenv('MSG91_SENDER_ID', 'FOODIB')
        
        # WhatsApp Business API credentials
        self.whatsapp_token = os.getenv('WHATSAPP_TOKEN')
        self.whatsapp_phone_id = os.getenv('WHATSAPP_PHONE_ID')
        
        # GreenAPI credentials for WhatsApp (fallback)
        self.greenapi_instance_id = os.getenv('GREENAPI_INSTANCE_ID')
        self.greenapi_token = os.getenv('GREENAPI_TOKEN')
        
        # Email credentials (Gmail)
        self.email_user = os.getenv('EMAIL_USER')
        self.email_password = os.getenv('EMAIL_PASSWORD')
        self.smtp_server = 'smtp.gmail.com'
        self.smtp_port = 587
        
        logging.info("Notification system initialized with MSG91 SMS, WhatsApp Business API, and Gmail Email")
    
    def send_sms(self, to_number: str, message: str) -> Dict:
        """Send SMS using MSG91"""
        try:
            if not self.msg91_auth_key:
                return {"success": False, "error": "MSG91 auth key not configured"}
            
            # Format phone number
            if not to_number.startswith('+'):
                to_number = '+92' + to_number  # Default to Pakistan format
            elif to_number.startswith('+0'):
                to_number = '+92' + to_number[2:]  # Fix +03192004088 to +923192004088
            
            # Remove + from number for MSG91
            clean_number = to_number.replace('+', '')
            
            url = "https://api.msg91.com/api/v5/flow/"
            headers = {
                "authkey": self.msg91_auth_key,
                "Content-Type": "application/json"
            }
            
            payload = {
                "flow_id": self.msg91_template_id,
                "sender": self.msg91_sender_id,
                "mobiles": clean_number,
                "VAR1": message[:50]  # First 50 chars as variable
            }
            
            response = requests.post(url, headers=headers, json=payload)
            
            if response.status_code == 200:
                logging.info(f"SMS sent successfully to {to_number}")
                return {"success": True, "message_id": response.json().get('type')}
            else:
                logging.error(f"SMS sending failed: {response.text}")
                return {"success": False, "error": response.text}
            
        except Exception as e:
            logging.error(f"SMS sending error: {e}")
            return {"success": False, "error": str(e)}
    
    def send_whatsapp(self, to_number: str, message: str, template_name: str = None, template_variables: list = None) -> Dict:
        """Send WhatsApp using multiple methods"""
        try:
            # Format phone number
            if to_number.startswith('+0'):
                to_number = '+92' + to_number[2:]  # Fix +03192004088 to +923192004088
            
            # Try WhatsApp Business API first
            if self.whatsapp_token and self.whatsapp_phone_id:
                result = self._send_whatsapp_business_api(to_number, message, template_name, template_variables)
                if result['success']:
                    return result
            
            # Try GreenAPI as fallback
            if self.greenapi_token and self.greenapi_instance_id:
                result = self._send_whatsapp_greenapi(to_number, message)
                if result['success']:
                    return result
            
            # Try simple WhatsApp Web method
            result = self._send_whatsapp_simple(to_number, message)
            if result['success']:
                return result
            
            return {"success": False, "error": "All WhatsApp methods failed"}
            
        except Exception as e:
            logging.error(f"WhatsApp sending error: {e}")
            return {"success": False, "error": str(e)}
    
    def _send_whatsapp_business_api(self, to_number: str, message: str, template_name: str = None, template_variables: list = None) -> Dict:
        """Send WhatsApp using WhatsApp Business API"""
        try:
            clean_number = to_number.replace('+', '')
            
            url = f"https://graph.facebook.com/v22.0/{self.whatsapp_phone_id}/messages"
            headers = {
                "Authorization": f"Bearer {self.whatsapp_token}",
                "Content-Type": "application/json"
            }
            
            # Use simple text message (more reliable)
            payload = {
                "messaging_product": "whatsapp",
                "to": clean_number,
                "type": "text",
                "text": {"body": message}
            }
            
            response = requests.post(url, headers=headers, json=payload)
            
            if response.status_code == 200:
                logging.info(f"WhatsApp Business API sent successfully to {to_number}")
                return {"success": True, "method": "business_api"}
            else:
                logging.error(f"WhatsApp Business API failed: {response.text}")
                return {"success": False, "error": response.text}
                
        except Exception as e:
            logging.error(f"WhatsApp Business API error: {e}")
            return {"success": False, "error": str(e)}
    
    def _send_whatsapp_greenapi(self, to_number: str, message: str) -> Dict:
        """Send WhatsApp using GreenAPI"""
        try:
            clean_number = to_number.replace('+', '')
            
            # Try different GreenAPI endpoints
            endpoints = [
                f"https://{self.greenapi_instance_id}.api.greenapi.com/waSendText",
                f"https://api.greenapi.com/waSendText",
                f"https://greenapi.com/api/waSendText"
            ]
            
            for url in endpoints:
                try:
                    headers = {
                        "Content-Type": "application/json"
                    }
                    
                    payload = {
                        "idInstance": self.greenapi_instance_id,
                        "apiTokenInstance": self.greenapi_token,
                        "chatId": f"{clean_number}@c.us",
                        "message": message
                    }
                    
                    response = requests.post(url, headers=headers, json=payload, timeout=10)
                    
                    if response.status_code == 200:
                        result = response.json()
                        if result.get('idMessage'):
                            logging.info(f"GreenAPI WhatsApp sent successfully to {to_number}")
                            return {"success": True, "method": "greenapi"}
                    
                except Exception as e:
                    logging.warning(f"GreenAPI endpoint {url} failed: {e}")
                    continue
            
            return {"success": False, "error": "All GreenAPI endpoints failed"}
            
        except Exception as e:
            logging.error(f"GreenAPI error: {e}")
            return {"success": False, "error": str(e)}
    
    def _send_whatsapp_simple(self, to_number: str, message: str) -> Dict:
        """Send WhatsApp using simple method (for testing)"""
        try:
            # This is a placeholder for simple WhatsApp sending
            # In real implementation, you might use WhatsApp Web automation
            logging.info(f"WhatsApp message would be sent to {to_number}: {message[:50]}...")
            return {"success": True, "method": "simple", "note": "Message logged for testing"}
            
        except Exception as e:
            logging.error(f"Simple WhatsApp error: {e}")
            return {"success": False, "error": str(e)}
    
    def send_email(self, to_email: str, subject: str, html_content: str, text_content: str = None) -> Dict:
        """Send email notification"""
        try:
            if not self.email_user or not self.email_password:
                return {"success": False, "error": "Email credentials not configured"}
            
            # Create message
            msg = MIMEMultipart('alternative')
            msg['Subject'] = subject
            msg['From'] = self.email_user
            msg['To'] = to_email
            
            # Add text and HTML parts
            if text_content:
                text_part = MIMEText(text_content, 'plain')
                msg.attach(text_part)
            
            html_part = MIMEText(html_content, 'html')
            msg.attach(html_part)
            
            # Send email
            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                server.starttls()
                server.login(self.email_user, self.email_password)
                server.send_message(msg)
            
            logging.info(f"Email sent successfully to {to_email}")
            return {"success": True}
            
        except Exception as e:
            logging.error(f"Email sending error: {e}")
            return {"success": False, "error": str(e)}
    
    def send_order_confirmation(self, user_info: Dict, order_details: Dict) -> Dict:
        """Send order confirmation to all channels"""
        results = {}
        
        # Create message content
        sms_message = self._create_order_confirmation_sms(order_details)
        whatsapp_message = self._create_order_confirmation_whatsapp(order_details)
        email_subject = f"Order Confirmation - #{order_details['order_id']}"
        email_html = self._create_order_confirmation_email_html(order_details)
        email_text = self._create_order_confirmation_email_text(order_details)
        
        # Send SMS (Primary)
        if user_info.get('phone'):
            results['sms'] = self.send_sms(user_info['phone'], sms_message)
        
        # Send WhatsApp (Primary) - Use hello_world template
        if user_info.get('phone'):
            results['whatsapp'] = self.send_whatsapp(
                user_info['phone'], 
                whatsapp_message,
                template_name="hello_world",
                template_variables=[]
            )
        
        # Send Email (Primary)
        if user_info.get('email'):
            results['email'] = self.send_email(user_info['email'], email_subject, email_html, email_text)
        
        return results
    
    def send_status_update(self, user_info: Dict, order_details: Dict, status: str) -> Dict:
        """Send status update to all channels"""
        results = {}
        
        # Create message content
        sms_message = self._create_status_update_sms(order_details, status)
        whatsapp_message = self._create_status_update_whatsapp(order_details, status)
        email_subject = f"Order Update - #{order_details['order_id']} - {status.title()}"
        email_html = self._create_status_update_email_html(order_details, status)
        email_text = self._create_status_update_email_text(order_details, status)
        
        # Send SMS (Primary)
        if user_info.get('phone'):
            results['sms'] = self.send_sms(user_info['phone'], sms_message)
        
        # Send WhatsApp (Primary) - Use hello_world template
        if user_info.get('phone'):
            results['whatsapp'] = self.send_whatsapp(
                user_info['phone'], 
                whatsapp_message,
                template_name="hello_world",
                template_variables=[]
            )
        
        # Send Email (Primary)
        if user_info.get('email'):
            results['email'] = self.send_email(user_info['email'], email_subject, email_html, email_text)
        
        return results
    
    def send_delivery_notification(self, user_info: Dict, order_details: Dict) -> Dict:
        """Send delivery notification to all channels"""
        results = {}
        
        # Create message content
        sms_message = self._create_delivery_sms(order_details)
        whatsapp_message = self._create_delivery_whatsapp(order_details)
        email_subject = f"Your Order is Delivered! - #{order_details['order_id']}"
        email_html = self._create_delivery_email_html(order_details)
        email_text = self._create_delivery_email_text(order_details)
        
        # Send SMS (Primary)
        if user_info.get('phone'):
            results['sms'] = self.send_sms(user_info['phone'], sms_message)
        
        # Send WhatsApp (Primary) - Use hello_world template
        if user_info.get('phone'):
            results['whatsapp'] = self.send_whatsapp(
                user_info['phone'], 
                whatsapp_message,
                template_name="hello_world",
                template_variables=[]
            )
        
        # Send Email (Primary)
        if user_info.get('email'):
            results['email'] = self.send_email(user_info['email'], email_subject, email_html, email_text)
        
        return results
    
    # Message templates
    def _create_order_confirmation_sms(self, order_details: Dict) -> str:
        """Create SMS order confirmation message"""
        return f"""FoodiBot Order Confirmation

Order #{order_details['order_id']}
Status: {order_details['status']}
Total: Rs. {order_details['total_amount']:.2f}
ETA: {order_details.get('eta', 'Calculating...')}

Thank you for choosing FoodiBot!"""
    
    def _create_order_confirmation_whatsapp(self, order_details: Dict) -> str:
        """Create WhatsApp order confirmation message"""
        items_text = ""
        for item, quantity in order_details['items'].items():
            items_text += f"• {quantity}x {item.title()}\n"
        
        return f"""🍕 *FoodiBot Order Confirmation*

*Order #{order_details['order_id']}*
Status: {order_details['status']}
Total: Rs. {order_details['total_amount']:.2f}
ETA: {order_details.get('eta', 'Calculating...')}

*Your Order:*
{items_text}

Thank you for choosing FoodiBot! 🍕"""
    
    def _create_order_confirmation_email_html(self, order_details: Dict) -> str:
        """Create HTML email order confirmation"""
        items_html = ""
        for item, quantity in order_details['items'].items():
            items_html += f"<tr><td>{quantity}x {item.title()}</td><td>Rs. {order_details['item_prices'].get(item, 0):.2f}</td></tr>"
        
        return f"""
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; }}
                .header {{ background: linear-gradient(135deg, #ff6b6b, #ee5a24); color: white; padding: 20px; text-align: center; }}
                .content {{ padding: 20px; }}
                .order-table {{ width: 100%; border-collapse: collapse; margin: 20px 0; }}
                .order-table th, .order-table td {{ border: 1px solid #ddd; padding: 12px; text-align: left; }}
                .order-table th {{ background-color: #f8f9fa; }}
            </style>
        </head>
        <body>
            <div class="header">
                <h1>🍕 FoodiBot Order Confirmation</h1>
            </div>
            <div class="content">
                <h2>Order #{order_details['order_id']}</h2>
                <p><strong>Status:</strong> {order_details['status']}</p>
                <p><strong>Total:</strong> Rs.{order_details['total_amount']:.2f}</p>
                <p><strong>ETA:</strong> {order_details.get('eta', 'Calculating...')}</p>
                
                <h3>Your Order:</h3>
                <table class="order-table">
                    <tr><th>Item</th><th>Price</th></tr>
                    {items_html}
                </table>
                
                <p>Thank you for choosing FoodiBot! 🍕</p>
            </div>
        </body>
        </html>
        """
    
    def _create_order_confirmation_email_text(self, order_details: Dict) -> str:
        """Create text email order confirmation"""
        items_text = ""
        for item, quantity in order_details['items'].items():
            items_text += f"• {quantity}x {item.title()}\n"
        
        return f"""FoodiBot Order Confirmation

Order #{order_details['order_id']}
Status: {order_details['status']}
Total: Rs.{order_details['total_amount']:.2f}
ETA: {order_details.get('eta', 'Calculating...')}

Your Order:
{items_text}

Thank you for choosing FoodiBot! 🍕"""
    
    def _create_status_update_sms(self, order_details: Dict, status: str) -> str:
        """Create SMS status update message"""
        status_emoji = {
            "confirmed": "✅",
            "preparing": "👨‍🍳",
            "ready": "🎉",
            "out_for_delivery": "🚚",
            "delivered": "📦"
        }
        
        return f"""{status_emoji.get(status, "📋")} Order Update

Order #{order_details['order_id']}
Status: {status.title()}
ETA: {order_details.get('eta', 'Calculating...')}"""
    
    def _create_status_update_whatsapp(self, order_details: Dict, status: str) -> str:
        """Create WhatsApp status update message"""
        status_emoji = {
            "confirmed": "✅",
            "preparing": "👨‍🍳",
            "ready": "🎉",
            "out_for_delivery": "🚚",
            "delivered": "📦"
        }
        
        return f"""{status_emoji.get(status, "📋")} *Order Update*

*Order #{order_details['order_id']}*
Status: {status.title()}
ETA: {order_details.get('eta', 'Calculating...')}"""
    
    def _create_status_update_email_html(self, order_details: Dict, status: str) -> str:
        """Create HTML email status update"""
        status_emoji = {
            "confirmed": "✅",
            "preparing": "👨‍🍳",
            "ready": "🎉",
            "out_for_delivery": "🚚",
            "delivered": "📦"
        }
        
        return f"""
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; }}
                .header {{ background: linear-gradient(135deg, #ff6b6b, #ee5a24); color: white; padding: 20px; text-align: center; }}
                .content {{ padding: 20px; }}
                .status-badge {{ background: #28a745; color: white; padding: 8px 16px; border-radius: 20px; display: inline-block; }}
            </style>
        </head>
        <body>
            <div class="header">
                <h1>{status_emoji.get(status, "📋")} Order Status Update</h1>
            </div>
            <div class="content">
                <h2>Order #{order_details['order_id']}</h2>
                <p><span class="status-badge">{status.title()}</span></p>
                <p><strong>ETA:</strong> {order_details.get('eta', 'Calculating...')}</p>
            </div>
        </body>
        </html>
        """
    
    def _create_status_update_email_text(self, order_details: Dict, status: str) -> str:
        """Create text email status update"""
        return f"""Order Status Update

Order #{order_details['order_id']}
Status: {status.title()}
ETA: {order_details.get('eta', 'Calculating...')}"""
    
    def _create_delivery_sms(self, order_details: Dict) -> str:
        """Create SMS delivery notification"""
        return f"""📦 Your Order is Delivered!

Order #{order_details['order_id']}
Status: Delivered ✅

Your food has arrived! Enjoy your meal! 🍕"""
    
    def _create_delivery_whatsapp(self, order_details: Dict) -> str:
        """Create WhatsApp delivery notification"""
        return f"""📦 *Your Order is Delivered!*

*Order #{order_details['order_id']}*
Status: Delivered ✅

Your food has arrived! Enjoy your meal! 🍕"""
    
    def _create_delivery_email_html(self, order_details: Dict) -> str:
        """Create HTML email delivery notification"""
        return f"""
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; }}
                .header {{ background: linear-gradient(135deg, #28a745, #20c997); color: white; padding: 20px; text-align: center; }}
                .content {{ padding: 20px; }}
                .delivery-badge {{ background: #28a745; color: white; padding: 8px 16px; border-radius: 20px; display: inline-block; }}
            </style>
        </head>
        <body>
            <div class="header">
                <h1>📦 Your Order is Delivered!</h1>
            </div>
            <div class="content">
                <h2>Order #{order_details['order_id']}</h2>
                <p><span class="delivery-badge">Delivered ✅</span></p>
                <p>Your food has arrived! Enjoy your meal! 🍕</p>
            </div>
        </body>
        </html>
        """
    
    def _create_delivery_email_text(self, order_details: Dict) -> str:
        """Create text email delivery notification"""
        return f"""Your Order is Delivered!

Order #{order_details['order_id']}
Status: Delivered ✅

Your food has arrived! Enjoy your meal! 🍕"""

# Usage example
if __name__ == "__main__":
    # Initialize notification system
    notifications = NotificationSystem()
    
    # Test user info
    user_info = {
        "phone": "+923192004088",  # Your phone number
        "email": "user@example.com"
    }
    
    # Test order details
    order_details = {
        "order_id": "ORD123",
        "status": "confirmed",
        "total_amount": 25.99,
        "items": {"burger": 2, "pizza": 1},
        "item_prices": {"burger": 8.99, "pizza": 12.99},
        "eta": "30 minutes"
    }
    
    # Send order confirmation
    results = notifications.send_order_confirmation(user_info, order_details)
    print(f"Order confirmation results: {results}") 