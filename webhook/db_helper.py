import re
import os
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv('.env', override=True)

MONGODB_URI = os.getenv("MONGODB_URI")
if not MONGODB_URI:
    raise RuntimeError("MONGODB_URI is not set")
client = MongoClient(MONGODB_URI, serverSelectionTimeoutMS=5000)
db = client["food_database"]

def food_item_exists(item_name):
    try:
        # Case-insensitive check
        return db.food_items.find_one({"name": {"$regex": f"^{re.escape(item_name)}$", "$options": "i"}}) is not None
    except Exception:
        return False

def insert_order_item(food_item, quantity, order_id):
    try:
        # Case-insensitive match
        food = db.food_items.find_one({"name": {"$regex": f"^{re.escape(food_item)}$", "$options": "i"}})
        if not food:
            return -1
        item_id = food["item_id"]
        price = food["price"]   
        total_price = price * quantity
        db.orders.insert_one({
            "order_id": order_id,
            "item_id": item_id,
            "quantity": quantity,
            "total_price": total_price
        })
        return 1
    except Exception as e:
        print(f"Error in insert_order_item: {e}")
        return -1

def insert_order_tracking(order_id, status):
    try:
        db.order_tracking.insert_one({
            "order_id": order_id,
            "status": status
        })
    except Exception as e:
        print(f"Error in insert_order_tracking: {e}")

def get_total_order_price(order_id):
    try:
        pipeline = [
            {"$match": {"order_id": order_id}},
            {"$group": {"_id": "$order_id", "total": {"$sum": "$total_price"}}}
        ]
        result = list(db.orders.aggregate(pipeline))
        if result:
            return result[0]["total"]
        return -1
    except Exception as e:
        print(f"Error in get_total_order_price: {e}")
        return -1

def get_next_order_id():
    try:
        last = db.orders.find_one(sort=[("order_id", -1)])
        if not last:
            return 1
        return last["order_id"] + 1
    except Exception as e:
        print(f"Error in get_next_order_id: {e}")
        return 1

def get_order_status(order_id):
    try:
        doc = db.order_tracking.find_one({"order_id": order_id})
        if doc:
            return doc["status"]
        return None
    except Exception as e:
        print(f"Error in get_order_status: {e}")
        return None

def get_inprogress_order(session_id):
    try:
        doc = db.inprogress_orders.find_one({"session_id": session_id})
        if doc:
            return doc["order"]
        return {}
    except Exception as e:
        print(f"Error in get_inprogress_order: {e}")
        return {}

def set_inprogress_order(session_id, order):
    try:
        db.inprogress_orders.update_one(
            {"session_id": session_id},
            {"$set": {"order": order}},
            upsert=True
        )
    except Exception as e:
        print(f"Error in set_inprogress_order: {e}")

def delete_inprogress_order(session_id):
    try:
        db.inprogress_orders.delete_one({"session_id": session_id})
    except Exception as e:
        print(f"Error in delete_inprogress_order: {e}")

def set_user_phone(session_id, phone_number):
    """Store user's phone number for notifications"""
    try:
        db.user_contacts.update_one(
            {"session_id": session_id},
            {"$set": {"phone": phone_number}},
            upsert=True
        )
        return True
    except Exception as e:
        print(f"Error in set_user_phone: {e}")
        return False

def get_user_phone(session_id):
    """Get user's phone number"""
    try:
        doc = db.user_contacts.find_one({"session_id": session_id})
        if doc:
            return doc.get("phone")
        return None
    except Exception as e:
        print(f"Error in get_user_phone: {e}")
        return None

def set_user_email(session_id, email):
    """Store user's email for notifications"""
    try:
        db.user_contacts.update_one(
            {"session_id": session_id},
            {"$set": {"email": email}},
            upsert=True
        )
        return True
    except Exception as e:
        print(f"Error in set_user_email: {e}")
        return False

def get_user_email(session_id):
    """Get user's email"""
    try:
        doc = db.user_contacts.find_one({"session_id": session_id})
        if doc:
            return doc.get("email")
        return None
    except Exception as e:
        print(f"Error in get_user_email: {e}")
        return None

def get_user_contact_info(session_id):
    """Get user's complete contact information"""
    try:
        doc = db.user_contacts.find_one({"session_id": session_id})
        if doc:
            return {
                "phone": doc.get("phone"),
                "email": doc.get("email")
            }
        return {"phone": None, "email": None}
    except Exception as e:
        print(f"Error in get_user_contact_info: {e}")
        return {"phone": None, "email": None}

def save_order_history(session_id, order, order_id, total_price):
    try:
        db.order_history.insert_one({
            "session_id": session_id,
            "order": order,
            "order_id": order_id,
            "total_price": total_price
        })
    except Exception as e:
        print(f"Error in save_order_history: {e}")

def get_order_history(session_id, limit=5):
    try:
        return list(db.order_history.find({"session_id": session_id}).sort("_id", -1).limit(limit))
    except Exception as e:
        print(f"Error in get_order_history: {e}")
        return []

def get_item_price(item_name):
    try:
        food = db.food_items.find_one({"name": {"$regex": f"^{re.escape(item_name)}$", "$options": "i"}})
        if food:
            return food.get("price", 0)
        return 0
    except Exception as e:
        print(f"Error in get_item_price: {e}")
        return 0

def update_order_status(order_id, status):
    try:
        result = db.order_tracking.update_one(
            {"order_id": order_id},
            {"$set": {"status": status}}
        )
        return result.modified_count > 0
    except Exception as e:
        print(f"Error in update_order_status: {e}")
        return False

def add_menu_item(item):
    try:
        # Auto-increment item_id
        last = db.food_items.find_one(sort=[("item_id", -1)])
        item_id = (last["item_id"] + 1) if last else 1
        item["item_id"] = item_id
        db.food_items.insert_one(item)
        return True
    except Exception as e:
        print(f"Error in add_menu_item: {e}")
        return False

def edit_menu_item(item_id, item):
    try:
        result = db.food_items.update_one(
            {"item_id": item_id},
            {"$set": item}
        )
        return result.modified_count > 0
    except Exception as e:
        print(f"Error in edit_menu_item: {e}")
        return False

def delete_menu_item(item_id):
    try:
        result = db.food_items.delete_one({"item_id": item_id})
        return result.deleted_count > 0
    except Exception as e:
        print(f"Error in delete_menu_item: {e}")
        return False
