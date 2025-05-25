const dialogflow = require('@google-cloud/dialogflow');
const { WebhookClient, Suggestion } = require('dialogflow-fulfillment');
const nodemailer = require("nodemailer");
const express = require("express")
const cors = require("cors");
const accountSid = 'AC0961e16c51576e07a5e0272914649972';
const authToken = '81710522cf9b0bc33f4cd285b4267fd5';
const client = require('twilio')(accountSid, authToken);

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Order from './models/Order.js';
import Feedback from './models/Feedback.js';
import { geminiFallback } from './services/gemini.js';

dotenv.config();

// MongoDB Connection URL from environment variables
const mongoURI = process.env.MONGODB_URI;

// Connect to MongoDB
mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('Connected to MongoDB');
}).catch(err => {
  console.error('MongoDB connection error:', err);
});

const app = express();
app.use(express.json());
app.use(cors());

app.post('/webhook', async (req, res) => {
  const agent = new WebhookClient({ request: req, response: res });
  const intent = req.body.queryResult.intent.displayName;
  const parameters = req.body.queryResult.parameters;
  const queryText = req.body.queryResult.queryText;

  // Map intents to functions
  let intentMap = new Map();

  intentMap.set('Order_Status', () => {
    // This intent should prompt for Order ID. Current implementation is fine.
    agent.add('Please provide your order ID.');
  });

  intentMap.set('Provide_Order_ID', async () => {
    const orderId = parameters['order-id'];
    // TODO: Implement database lookup for order status using orderId
    try {
      const order = await Order.findOne({ orderId: orderId });

      if (order) {
        let response = `The status for Order ID ${orderId} is: ${order.status}.`;
        if (order.trackingNumber) {
          response += ` Your tracking number is ${order.trackingNumber}.`;
        }
        agent.add(response);
      } else {
        agent.add(`Sorry, I could not find an order with ID ${orderId}. Please double-check the ID.`);
      }
    } catch (err) {
      console.error('Error fetching order status:', err);
      agent.add('Sorry, there was an error fetching your order status. Please try again later.');
    }
  });

  // Add handlers for other intents
  intentMap.set('Complaint_Register', () => {
    // TODO: Implement logic to register the complaint in the database
    agent.add('Please describe your complaint, and we will register it. (Database integration coming soon)');
  });

  intentMap.set('Return_Request', () => {
    // TODO: Implement logic to handle return requests, potentially involving database updates
    agent.add('Please provide your order details for the return request. (Database integration coming soon)');
  });

  intentMap.set('Operating_Hours', () => {
    agent.add('Our operating hours are Monday to Friday, 9 AM to 5 PM.');
  });

  intentMap.set('Goodbye', () => {
    agent.add('Goodbye! Have a great day.');
  });

  intentMap.set('Booking_Slot', () => {
    // TODO: Implement logic for booking a slot, requiring database interaction
    agent.add('Please specify the service and preferred time for booking. (Database integration coming soon)');
  });

  intentMap.set('Refund_Status', () => {
    // TODO: Implement database lookup for refund status
    agent.add('Please provide your order ID to check the refund status. (Database lookup coming soon)');
  });

  intentMap.set('Product_Info', async () => {
    // This could potentially involve a database lookup or using Gemini for product descriptions.
    // For now, we can let Gemini handle it if no specific product info is available in DB.
    // TODO: Optional: Implement database lookup for specific product information
    let response = await geminiFallback(queryText);
    agent.add(response);
  });

  intentMap.set('Offers_Discounts', async () => {
    // This could involve fetching active offers/discounts from a database or using Gemini.
    // TODO: Optional: Implement database lookup for current offers/discounts
    let response = await geminiFallback(queryText);
    agent.add(response);
  });

  intentMap.set('Feedback_Submit', async () => {
    // TODO: Implement logic to save feedback to the database
    const feedbackText = parameters['feedback']; // Assuming 'feedback' is the parameter name in your Dialogflow intent
    if (feedbackText) {
      try {
        const newFeedback = new Feedback({ feedbackText: feedbackText });
        await newFeedback.save();
        agent.add('Thank you for your feedback! We have recorded it.');
      } catch (err) {
        console.error('Error saving feedback:', err);
        agent.add('Sorry, there was an error submitting your feedback. Please try again later.');
      }
    } else {
      agent.add('I did not receive any feedback. Please provide your feedback.');
    }
  });

  intentMap.set('Contact_Info', () => {
    agent.add('You can contact us via email at support@example.com or call us at 123-456-7890.');
  });

  intentMap.set('Cancel_Order', () => {
    // TODO: Implement logic to cancel an order, requiring database interaction
    agent.add('Please provide your order ID to cancel the order. (Database integration coming soon)');
  });

  // Default Fallback Intent will be handled by Dialogflow itself if not matched here
  // We can optionally add a specific handler here if needed, but the default Dialogflow behavior often suffices.

  // If the intent is not handled explicitly above, let Gemini handle it as a general fallback.
  // NOTE: Dialogflow's Default Fallback Intent will trigger *before* this if no other intent matches.
  // This part of the code will only be reached if an intent *is* matched, but we don't have a specific handler for it.
  // This might be redundant if Dialogflow handles fallbacks correctly.
  // Let's rely on Dialogflow's Default Fallback Intent to trigger Gemini via the separate intent handler.

  // Run the proper handler function based on the matched intent
  if (intentMap.has(intent)) {
    await intentMap.get(intent)();
  } else if (intent === 'Default Fallback Intent') {
      // Dialogflow's Default Fallback will be handled here, triggering Gemini
      let response = await geminiFallback(queryText);
      agent.add(response);
  } else {
      // Should not be reached if Default Fallback Intent is configured correctly in Dialogflow
      console.warn(`No specific handler for intent: ${intent}. Falling back to Gemini via query text.`);
      let response = await geminiFallback(queryText);
      agent.add(response);
  }

});

app.listen(process.env.PORT, () => {
  console.log(`Webhook running on port ${process.env.PORT}`);
});
