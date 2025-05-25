import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  orderId: {
    type: String,
    required: true,
    unique: true,
  },
  status: {
    type: String,
    required: true,
    default: 'Processing',
  },
  // You can add more fields here like items, trackingNumber, etc.
  items: [String], // Example: array of strings for item names/IDs
  trackingNumber: String,
});

const Order = mongoose.model('Order', orderSchema);

export default Order; 