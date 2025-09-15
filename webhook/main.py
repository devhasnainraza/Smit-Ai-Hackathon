from fastapi import FastAPI, Request, Body, Query, Depends
from fastapi.responses import JSONResponse, Response
from fastapi.middleware.cors import CORSMiddleware
import db_helper
import generic_helper
import logging
import re
from datetime import datetime, timedelta
import time
import csv
from fastapi.responses import StreamingResponse
from io import StringIO
import hmac
import hashlib  
import json
import os
from dotenv import load_dotenv

# Load environment variables (optional for Vercel)
load_dotenv('.env', override=False)

# Import notification system
from notification_system import NotificationSystem

# Initialize notification system
notifications = NotificationSystem()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.FileHandler("bot.log"), logging.StreamHandler()]
)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def sanitize_food_item(item):
    return re.sub(r"[^a-zA-Z0-9\- ]", "", item).strip().lower()[:30]

def validate_order_params(parameters):
    food_items = parameters.get("food-item")
    quantities = parameters.get("number")
    if not food_items or not isinstance(food_items, list) or not all(isinstance(x, str) for x in food_items):
        return False, "Please specify valid food items."
    if quantities:
        if not isinstance(quantities, list) or len(quantities) != len(food_items):
            return False, "Please specify quantity for each food item."
        try:
            quantities = [int(q) for q in quantities]
        except Exception:
            return False, "Quantities must be numbers."
        if not all(q > 0 for q in quantities):
            return False, "Quantities must be positive numbers."
    return True, ""

def get_order(session_id):
    return db_helper.get_inprogress_order(session_id) or {}

def set_order(session_id, order):
    db_helper.set_inprogress_order(session_id, order)

def delete_order(session_id):
    db_helper.delete_inprogress_order(session_id)

@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    logging.error(f"Unhandled error: {exc}", exc_info=True)
    return JSONResponse(status_code=500, content={"fulfillmentText": "Sorry, something went wrong. Please try again later."})

@app.get("/")
async def root():
    return {"ok": True}

@app.get("/favicon.ico")
async def favicon():
    # 204 must not include a body; return an empty Response
    return Response(status_code=204)

@app.post("/")
async def handle_request(request: Request):
    try:
        payload = await request.json()
        logging.info(f"🔔 Received webhook payload: {json.dumps(payload, indent=2)}")
        
        intent = payload['queryResult']['intent']['displayName']
        parameters = payload['queryResult']['parameters']
        output_contexts = payload['queryResult']['outputContexts']
        session_id = generic_helper.extract_session_id(output_contexts[0]["name"])
        
        logging.info(f"🎯 Processing intent: {intent}")
        logging.info(f"📝 Session ID: {session_id}")
        logging.info(f"📋 Parameters: {parameters}")
        
        intent_handler_dict = {
            'order.add - context: ongoing-order': add_to_order,
            'order.remove - context: ongoing-order': remove_from_order,
            'order.complete - context: ongoing-order': complete_order,
            'track.order - context: ongoing-tracking': track_order,
            'order.summary - context: ongoing-order': order_summary_intent,
            'collect.phone - context: ongoing-order': collect_phone_number,
            'collect.email - context: ongoing-order': collect_email,
            'send.notifications - context: ongoing-order': send_notifications,
        }

        if intent not in intent_handler_dict:
            logging.warning(f"❌ Unknown intent: {intent}")
            return JSONResponse(content={
                "fulfillmentText": "Sorry, I didn't understand your request.",
                "status_code": "error"
            })

        logging.info(f"✅ Found intent handler for: {intent}")
        response = intent_handler_dict[intent](parameters, session_id)
        logging.info(f"📤 Sending response: {response}")
        
        return response

    except Exception as e:
        logging.error(f"💥 Error in handle_request: {e}", exc_info=True)
        return JSONResponse(status_code=500, content={
            "fulfillmentText": "Sorry, something went wrong. Please try again later."
        })




def add_to_order(parameters: dict, session_id: str):
    try:
        is_valid, msg = validate_order_params(parameters)
        if not is_valid:
            return JSONResponse(content={"fulfillmentText": msg, "status_code": "error"})
        food_items = [sanitize_food_item(item) for item in parameters["food-item"]]
        quantities = [int(q) for q in parameters["number"]]
        new_food_dict = dict(zip(food_items, quantities))
        current_order = get_order(session_id)
        for item, qty in new_food_dict.items():
            # Check if item exists in DB (case-insensitive)
            if not db_helper.food_item_exists(item):
                return JSONResponse(content={"fulfillmentText": f"Sorry, '{item}' is not available in our menu.", "status_code": "error"})
            current_order[item] = current_order.get(item, 0) + qty
        set_order(session_id, current_order)
        order_str = generic_helper.get_str_from_food_dict(current_order)
        return JSONResponse(content={
            "fulfillmentText": f"So far you have: {order_str}. Do you need anything else?",
            "order_summary": current_order,
            "status_code": "success"
        })
    except Exception as e:
        logging.error(f"Exception in add_to_order: {e}", exc_info=True)
        return JSONResponse(content={"fulfillmentText": "Sorry, an error occurred while adding to your order.", "status_code": "error"})

def remove_from_order(parameters: dict, session_id: str):
    try:
        is_valid, msg = validate_order_params(parameters)
        if not is_valid:
            return JSONResponse(content={"fulfillmentText": msg, "status_code": "error"})
        food_items = [sanitize_food_item(item) for item in parameters["food-item"]]
        quantities = parameters.get("number") or [1] * len(food_items)
        quantities = [int(q) for q in quantities]
        current_order = get_order(session_id)
        removed_items, no_such_items = [], []
        for item, qty in zip(food_items, quantities):
            if item not in current_order:
                no_such_items.append(item)
            else:
                if current_order[item] > qty:
                    current_order[item] -= qty
                    removed_items.append(f"{qty} {item}")
                else:
                    removed_items.append(f"{current_order[item]} {item}")
            del current_order[item]
        fulfillment_text = ""
        if removed_items:
            fulfillment_text += f"Removed {', '.join(removed_items)} from your order!"
        if no_such_items:
            fulfillment_text += f" Your current order does not have {', '.join(no_such_items)}."
        if not current_order:
            fulfillment_text += " Your order is empty!"
            delete_order(session_id)
            return JSONResponse(content={
                "fulfillmentText": fulfillment_text,
                "removed_items": removed_items,
                "remaining_items": {},
                "status_code": "success"
            })
        set_order(session_id, current_order)
        order_str = generic_helper.get_str_from_food_dict(current_order)
        fulfillment_text += f" Here is what is left in your order: {order_str}"
        return JSONResponse(content={
            "fulfillmentText": fulfillment_text,
            "removed_items": removed_items,
            "remaining_items": current_order,
            "status_code": "success"
        })
    except Exception as e:
        logging.error(f"Exception in remove_from_order: {e}", exc_info=True)
        return JSONResponse(content={"fulfillmentText": "Sorry, an error occurred while removing from your order.", "status_code": "error"})

def complete_order(parameters: dict, session_id: str):
    try:
        order = get_order(session_id)
        if not order:
            return JSONResponse(content={"fulfillmentText": "I'm having trouble finding your order. Sorry! Can you place a new order please?", "status_code": "error"})
        
        # Calculate order details for display
        order_items = []
        total_amount = 0
        for food_item, quantity in order.items():
            price = db_helper.get_item_price(food_item)
            total_amount += quantity * price
            order_items.append(f"{quantity}x {food_item.title()}")
        
        order_summary = ", ".join(order_items)
        
        # Generate order ID
        import time
        order_id = int(time.time())  # Use timestamp as order ID
        
        # Check if user has provided contact information
        phone_number = db_helper.get_user_phone(session_id)
        email = db_helper.get_user_email(session_id)
        
        if not phone_number and not email:
            # No contact info - ask for phone number only
            fulfillment_text = f"""🎉 Excellent! Your order has been placed successfully!

📋 Order Details:
• Order ID: #{order_id}
• Items: {order_summary}
• Total Amount: Rs. {total_amount}
• Payment: Pay at delivery
• Delivery Time: 30-45 minutes

📱 Please provide your phone number so I can send you SMS and WhatsApp updates about your order."""
            
            return JSONResponse(content={
                "fulfillmentText": fulfillment_text,
                "order_id": order_id,
                "total_price": total_amount,
                "status_code": "success",
                "ask_for_phone": True
            })
        elif not phone_number:
            # Has email but no phone - ask for phone number
            fulfillment_text = f"""🎉 Excellent! Your order has been placed successfully!

📋 Order Details:
• Order ID: #{order_id}
• Items: {order_summary}
• Total Amount: Rs. {total_amount}
• Payment: Pay at delivery
• Delivery Time: 30-45 minutes

📱 To receive SMS and WhatsApp updates, please provide your phone number."""
            
            return JSONResponse(content={
                "fulfillmentText": fulfillment_text,
                "order_id": order_id,
                "total_price": total_amount,
                "status_code": "success",
                "ask_for_phone": True
            })
        elif not email:
            # Has phone but no email - ask for email
            fulfillment_text = f"""🎉 Excellent! Your order has been placed successfully!

📋 Order Details:
• Order ID: #{order_id}
• Items: {order_summary}
• Total Amount: Rs. {total_amount}
• Payment: Pay at delivery
• Delivery Time: 30-45 minutes

📧 To receive email notifications as well, please provide your email address."""
            
            return JSONResponse(content={
                "fulfillmentText": fulfillment_text,
                "order_id": order_id,
                "total_price": total_amount,
                "status_code": "success",
                "ask_for_email": True
            })
        else:
            # Both contact info available - send notifications
            logging.info("📨 Both contact info available, sending notifications")
            
            # Prepare user info and order details for notifications
            user_info = {
                "phone": phone_number,
                "email": email
            }
            
            order_details = {
                "order_id": order_id,
                "status": "confirmed",
                "total_amount": total_amount,
                "items": order,
                "item_prices": {item: db_helper.get_item_price(item) for item in order.keys()},
                "eta": "30-45 minutes"
            }
            
            # Send notifications
            try:
                from notification_system import NotificationSystem
                notifications = NotificationSystem()
                results = notifications.send_order_confirmation(user_info, order_details)
                logging.info(f"📨 Notification results: {results}")
                
                # Check which notifications were successful
                success_channels = []
                if results.get('sms', {}).get('success'):
                    success_channels.append("SMS")
                if results.get('whatsapp', {}).get('success'):
                    success_channels.append("WhatsApp")
                if results.get('email', {}).get('success'):
                    success_channels.append("Email")
                
                if success_channels:
                    channels_text = ", ".join(success_channels)
                    fulfillment_text = f"""🎉 Excellent! Your order has been placed successfully!

📋 Order Details:
• Order ID: #{order_id}
• Items: {order_summary}
• Total Amount: Rs. {total_amount}
• Payment: Pay at delivery
• Delivery Time: 30-45 minutes

✅ Order confirmation sent via {channels_text}! You'll receive updates about your order status."""
                else:
                    fulfillment_text = f"""🎉 Excellent! Your order has been placed successfully!

📋 Order Details:
• Order ID: #{order_id}
• Items: {order_summary}
• Total Amount: Rs. {total_amount}
• Payment: Pay at delivery
• Delivery Time: 30-45 minutes

📱 Your order is confirmed! (Notification sending failed, but your order is saved!)"""
                    
            except Exception as e:
                logging.error(f"💥 Error sending notifications: {e}")
                fulfillment_text = f"""🎉 Excellent! Your order has been placed successfully!

📋 Order Details:
• Order ID: #{order_id}
• Items: {order_summary}
• Total Amount: Rs. {total_amount}
• Payment: Pay at delivery
• Delivery Time: 30-45 minutes

📱 Your order is confirmed!"""
            
        return JSONResponse(content={
                "fulfillmentText": fulfillment_text,
            "order_id": order_id,
                "total_price": total_amount,
            "status_code": "success"
        })
    except Exception as e:
        logging.error(f"Exception in complete_order: {e}", exc_info=True)
        print(f"DEBUG: Error in complete_order: {e}")
        return JSONResponse(content={"fulfillmentText": f"Sorry, an error occurred while completing your order. Error: {str(e)}", "status_code": "error"})

def track_order(parameters: dict, session_id: str):
    try:
        order_id = int(parameters['order_id'])
        order_status = db_helper.get_order_status(order_id)
        if order_status:
            fulfillment_text = f"The order status for order id ( {order_id} ) is: {order_status}"
        else:
            fulfillment_text = f"No order found with order id: {order_id}"
        return JSONResponse(content={"fulfillmentText": fulfillment_text})
    except Exception as e:
        logging.error(f"Exception in track_order: {e}", exc_info=True)
        return JSONResponse(content={"fulfillmentText": "Sorry, an error occurred while tracking your order."})

def repeat_last_order(parameters: dict, session_id: str):
    try:
        history = db_helper.get_order_history(session_id, limit=1)
        if not history or not history[0].get("order"):
            return JSONResponse(content={"fulfillmentText": "No previous order found.", "status_code": "error"})
        last_order = history[0]["order"]
        set_order(session_id, last_order)
        order_str = generic_helper.get_str_from_food_dict(last_order)
        return JSONResponse(content={
            "fulfillmentText": f"Your last order ({order_str}) has been added again. Do you want to complete it?",
            "order_summary": last_order,
            "status_code": "success"
        })
    except Exception as e:
        logging.error(f"Exception in repeat_last_order: {e}", exc_info=True)
        return JSONResponse(content={"fulfillmentText": "Sorry, an error occurred while repeating your order.", "status_code": "error"})

def order_history_intent(parameters: dict, session_id: str):
    try:
        history = db_helper.get_order_history(session_id)
        orders = [
            {
                "order_id": h.get("order_id"),
                "order": h.get("order"),
                "total_price": h.get("total_price")
            }
            for h in history
        ]
        return JSONResponse(content={
            "fulfillmentText": f"Here are your last {len(orders)} orders.",
            "orders": orders,
            "status_code": "success"
        })
    except Exception as e:
        logging.error(f"Exception in order_history_intent: {e}", exc_info=True)
        return JSONResponse(content={"fulfillmentText": "Sorry, an error occurred while fetching your order history.", "status_code": "error"})

def order_summary_intent(parameters: dict, session_id: str):
    try:
        order = get_order(session_id)
        if not order:
            return JSONResponse(content={"fulfillmentText": "You don't have any items in your order yet.", "status_code": "error"})
        
        total_items = sum(order.values())
        total_amount = sum(quantity * db_helper.get_item_price(item) for item, quantity in order.items())
        
        summary = f"Your order summary:\nTotal items: {total_items}\nTotal amount: ${total_amount:.2f}"
        return JSONResponse(content={"fulfillmentText": summary, "status_code": "success"})
    except Exception as e:
        logging.error(f"Error in order_summary_intent: {e}")
        return JSONResponse(content={"fulfillmentText": "Sorry, I couldn't get your order summary.", "status_code": "error"})

def collect_phone_number(parameters: dict, session_id: str):
    """Collect user's phone number for notifications"""
    try:
        logging.info(f"📱 Collecting phone number for session: {session_id}")
        
        phone_number = parameters.get("phone-number")
        logging.info(f"📞 Phone number from parameters: {phone_number}")
        
        if not phone_number:
            logging.warning("❌ No phone number provided")
            return JSONResponse(content={
                "fulfillmentText": "Please provide your phone number so I can send you order updates via SMS and WhatsApp.",
                "status_code": "error"
            })
        
        # Store phone number in database
        logging.info(f"💾 Storing phone number in database: {phone_number}")
        db_helper.set_user_phone(session_id, phone_number)
        
        # Check if we have both phone and email now
        email = db_helper.get_user_email(session_id)
        
        if phone_number and email:
            # Both contact info available
            response_text = f"Great! I've saved your phone number: {phone_number}. Your contact information is complete! I'll send you notifications via SMS, WhatsApp, and Email."
        else:
            response_text = f"Great! I've saved your phone number: {phone_number}. Now I can send you SMS and WhatsApp updates about your order. Please provide your email address for email notifications as well."
        
        logging.info(f"✅ Phone number collected successfully: {response_text}")
        
        return JSONResponse(content={
            "fulfillmentText": response_text,
            "status_code": "success"
        })
    except Exception as e:
        logging.error(f"💥 Error in collect_phone_number: {e}", exc_info=True)
        return JSONResponse(content={
            "fulfillmentText": "Sorry, I couldn't save your phone number. Please try again.",
            "status_code": "error"
        })

def collect_email(parameters: dict, session_id: str):
    """Collect user's email for notifications"""
    try:
        logging.info(f"📧 Collecting email for session: {session_id}")
        
        email = parameters.get("email")
        logging.info(f"📧 Email from parameters: {email}")
        
        if not email:
            logging.warning("❌ No email provided")
            return JSONResponse(content={
                "fulfillmentText": "Please provide your email address so I can send you order updates via email.",
                "status_code": "error"
            })
        
        # Store email in database
        logging.info(f"💾 Storing email in database: {email}")
        db_helper.set_user_email(session_id, email)
        
        # Check if we have both phone and email now
        phone_number = db_helper.get_user_phone(session_id)
        
        if phone_number and email:
            # Both contact info available
            response_text = f"Perfect! I've saved your email: {email}. Your contact information is complete! I'll send you notifications via SMS, WhatsApp, and Email."
        else:
            response_text = f"Perfect! I've saved your email: {email}. Your contact information is complete! I'll send you notifications via SMS, WhatsApp, and Email."
        
        logging.info(f"✅ Email collected successfully: {response_text}")
        
        return JSONResponse(content={
            "fulfillmentText": response_text,
            "status_code": "success"
        })
    except Exception as e:
        logging.error(f"💥 Error in collect_email: {e}", exc_info=True)
        return JSONResponse(content={
            "fulfillmentText": "Sorry, I couldn't save your email. Please try again.",
            "status_code": "error"
        })

def send_notifications(parameters: dict, session_id: str):
    """Send notifications to user"""
    try:
        logging.info(f"📨 Sending notifications for session: {session_id}")
        
        # Get user contact info
        phone_number = db_helper.get_user_phone(session_id)
        email = db_helper.get_user_email(session_id)
        
        logging.info(f"📞 Phone number from DB: {phone_number}")
        logging.info(f"📧 Email from DB: {email}")
        
        if not phone_number and not email:
            logging.warning("❌ No contact information found")
            return JSONResponse(content={
                "fulfillmentText": "I don't have your contact information yet. Please provide your phone number and email first.",
                "status_code": "error"
            })
        
        # Get current order
        order = get_order(session_id)
        logging.info(f"🛒 Current order: {order}")
        
        if not order:
            logging.warning("❌ No order found")
            return JSONResponse(content={
                "fulfillmentText": "You don't have any items in your order yet.",
                "status_code": "error"
            })
        
        # Calculate order details
        total_amount = sum(quantity * db_helper.get_item_price(item) for item, quantity in order.items())
        order_id = f"ORD{int(time.time())}"
        
        logging.info(f"💰 Total amount: ${total_amount}")
        logging.info(f"🆔 Order ID: {order_id}")
        
        # Prepare user info and order details
        user_info = {}
        if phone_number:
            user_info["phone"] = phone_number
        if email:
            user_info["email"] = email
        
        order_details = {
            "order_id": order_id,
            "status": "confirmed",
            "total_amount": total_amount,
            "items": order,
            "item_prices": {item: db_helper.get_item_price(item) for item in order.keys()},
            "eta": "30 minutes"
        }
        
        logging.info(f"📋 User info: {user_info}")
        logging.info(f"📋 Order details: {order_details}")
        
        # Send notifications
        logging.info("🚀 Sending notifications...")
        results = notifications.send_order_confirmation(user_info, order_details)
        logging.info(f"📨 Notification results: {results}")
        
        # Check results and provide feedback
        success_channels = []
        if results.get('sms', {}).get('success'):
            success_channels.append("SMS")
        if results.get('whatsapp', {}).get('success'):
            success_channels.append("WhatsApp")
        if results.get('email', {}).get('success'):
            success_channels.append("Email")
        
        logging.info(f"✅ Successful channels: {success_channels}")
        
        if success_channels:
            channels_text = ", ".join(success_channels)
            response_text = f"✅ Order confirmation sent successfully via {channels_text}! You'll receive updates about your order status."
            logging.info(f"🎉 Success response: {response_text}")
            
            return JSONResponse(content={
                "fulfillmentText": response_text,
                "status_code": "success"
            })
        else:
            logging.warning("⚠️ No notifications sent successfully")
            return JSONResponse(content={
                "fulfillmentText": "I tried to send notifications but there was an issue. Your order is still confirmed though!",
                "status_code": "warning"
            })
            
    except Exception as e:
        logging.error(f"💥 Error in send_notifications: {e}", exc_info=True)
        return JSONResponse(content={
            "fulfillmentText": "Sorry, I couldn't send notifications. Please try again later.",
            "status_code": "error"
        })

@app.get("/api/orders")
async def get_orders(request: Request):
    try:
        pipeline = [
            {
                "$lookup": {
                    "from": "food_items",
                    "localField": "item_id",
                    "foreignField": "item_id",
                    "as": "food_info"
                }
            },
            {
                "$unwind": "$food_info"
            },
            {
                "$group": {
                    "_id": "$order_id",
                    "items": {
                        "$push": {
                            "name": "$food_info.name",
                            "quantity": "$quantity"
                        }
                    },
                    "total_price": {"$sum": "$total_price"}
                }
            },
            {"$sort": {"_id": 1}}
        ]
        orders = list(db_helper.db.orders.aggregate(pipeline))
        # Add status
        for o in orders:
            status_doc = db_helper.db.order_tracking.find_one({"order_id": o["_id"]})
            o["status"] = status_doc["status"] if status_doc else "N/A"
        return {"orders": orders}
    except Exception as e:
        return {"orders": []}

@app.get("/api/orders/export")
async def export_orders_csv(request: Request):
    try:
        pipeline = [
            {
                "$lookup": {
                    "from": "food_items",
                    "localField": "item_id",
                    "foreignField": "item_id",
                    "as": "food_info"
                }
            },
            {
                "$unwind": "$food_info"
            },
            {
                "$group": {
                    "_id": "$order_id",
                    "items": {
                        "$push": {
                            "name": "$food_info.name",
                            "quantity": "$quantity"
                        }
                    },
                    "total_price": {"$sum": "$total_price"}
                }
            },
            {"$sort": {"_id": 1}}
        ]
        orders = list(db_helper.db.orders.aggregate(pipeline))
        # Add status
        for o in orders:
            status_doc = db_helper.db.order_tracking.find_one({"order_id": o["_id"]})
            o["status"] = status_doc["status"] if status_doc else "N/A"

        # Prepare CSV
        def generate():
            output = StringIO()
            writer = csv.writer(output)
            writer.writerow(["Order ID", "Items", "Total Price", "Status"])
            for o in orders:
                items_str = ", ".join([f"{item['quantity']} x {item['name']}" for item in o["items"]])
                writer.writerow([o["_id"], items_str, o["total_price"], o["status"]])
            yield output.getvalue()
            output.close()

        return StreamingResponse(generate(), media_type="text/csv", headers={
            "Content-Disposition": "attachment; filename=orders.csv"
        })
    except Exception as e:
        return JSONResponse(content={"error": "Failed to export orders."}, status_code=500)

@app.get("/api/menu")
async def get_menu(request: Request):
    try:
        menu = list(db_helper.db.food_items.find())
        for m in menu:
            m["_id"] = str(m["_id"])
        return {"menu": menu}
    except Exception as e:
        return {"menu": []}

@app.get("/api/analytics")
async def analytics(request: Request):
    try:
        total_orders = db_helper.db.orders.count_documents({})
        popular_items = db_helper.db.orders.aggregate([
            {"$group": {"_id": "$item_id", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}},
            # {"$limit": 5}
        ])
        return {
            "total_orders": total_orders,
            "popular_items": list(popular_items)
        }
    except Exception as e:
        return {
            "total_orders": 0,
            "popular_items": []
        }

@app.get("/api/analytics/sales-by-date")
async def sales_by_date(request: Request, days: int = Query(7)):
    try:
        # Group orders by date, sum total_price
        pipeline = [
            {
                "$group": {
                    "_id": {
                        "$dateToString": { "format": "%Y-%m-%d", "date": "$created_at" }
                    },
                    "total_sales": { "$sum": "$total_price" },
                    "order_count": { "$sum": 1 }
                }
            },
            { "$sort": { "_id": 1 } },
            { "$limit": days }
        ]
        sales = list(db_helper.db.orders.aggregate(pipeline))
        return {"sales": sales}
    except Exception as e:
        return {"sales": []}

@app.get("/api/analytics/total-revenue")
async def total_revenue(request: Request):
    try:
        pipeline = [
            { "$group": { "_id": None, "revenue": { "$sum": "$total_price" } } }
        ]
        result = list(db_helper.db.orders.aggregate(pipeline))
        return {"revenue": result[0]["revenue"] if result else 0}
    except Exception as e:
        return {"revenue": 0}

@app.get("/api/analytics/loyal-customers")
async def loyal_customers(request: Request, limit: int = Query(5)):
    try:
        pipeline = [
            { "$group": { "_id": "$session_id", "orders": { "$sum": 1 } } },
            { "$sort": { "orders": -1 } },
            { "$limit": limit }
        ]
        customers = list(db_helper.db.order_history.aggregate(pipeline))
        return {"customers": customers}
    except Exception as e:
        return {"customers": []}

@app.put("/api/orders/{order_id}/status")
async def update_order_status(request: Request, order_id: int, status: str = Body(..., embed=True)):
    try:
        result = db_helper.update_order_status(order_id, status)
        if result:
            return {"success": True, "message": f"Order {order_id} status updated to '{status}'."}
        else:
            return {"success": False, "message": "Order not found."}
    except Exception as e:
        return {"success": False, "message": "Error updating order status."}

# Add a new menu item
@app.post("/api/menu")
async def add_menu_item(request: Request, item: dict = Body(...)):
    try:
        result = db_helper.add_menu_item(item)
        if result:
            return {"success": True, "message": "Menu item added."}
        else:
            return {"success": False, "message": "Failed to add menu item."}
    except Exception as e:
        return {"success": False, "message": "Error adding menu item."}

# Edit a menu item
@app.put("/api/menu/{item_id}")
async def edit_menu_item(request: Request, item_id: int, item: dict = Body(...)):
    try:
        result = db_helper.edit_menu_item(item_id, item)
        if result:
            return {"success": True, "message": "Menu item updated."}
        else:
            return {"success": False, "message": "Menu item not found."}
    except Exception as e:
        return {"success": False, "message": "Error updating menu item."}

# Delete a menu item
@app.delete("/api/menu/{item_id}")
async def delete_menu_item(request: Request, item_id: int):
    try:
        result = db_helper.delete_menu_item(item_id)
        if result:
            return {"success": True, "message": "Menu item deleted."}
        else:
            return {"success": False, "message": "Menu item not found."}
    except Exception as e:
        return {"success": False, "message": "Error deleting menu item."}

# Health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "ok", "message": "Webhook is running"}

# Vercel compatibility
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)