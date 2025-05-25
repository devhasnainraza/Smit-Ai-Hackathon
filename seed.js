import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Order from './models/Order.js';

dotenv.config();

const mongoURI = process.env.MONGODB_URI;

mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(async () => {
  console.log('MongoDB connected for seeding.');

  // Sample order data
  const sampleOrders = [
    {
      orderId: 'ORDER123',
      status: 'Shipped',
      items: ['Laptop', 'Mouse'],
      trackingNumber: 'TN123456789',
    },
    {
      orderId: 'ORDER456',
      status: 'Processing',
      items: ['Keyboard'],
    },
    {
      orderId: 'ORDER789',
      status: 'Delivered',
      items: ['Monitor', 'Webcam'],
      trackingNumber: 'TN987654321',
    },
  ];

  try {
    // Clear existing orders (optional, for fresh seeding)
    await Order.deleteMany({});
    console.log('Existing orders cleared.');

    // Insert sample orders
    await Order.insertMany(sampleOrders);
    console.log('Sample orders seeded successfully.');
  } catch (err) {
    console.error('Error seeding database:', err);
  } finally {
    mongoose.connection.close();
  }
})
.catch(err => {
  console.error('MongoDB connection error for seeding:', err);
}); 