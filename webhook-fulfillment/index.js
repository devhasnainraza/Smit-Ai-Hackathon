// E-commerce Chatbot Webhook Fulfillment - Main Entry Point
const express = require('express');
const bodyParser = require('body-parser');
const { WebhookClient, Payload } = require('dialogflow-fulfillment');

// Import intent handlers
const productHandlers = require('./handlers/productHandlers');
const cartHandlers = require('./handlers/cartHandlers');
const orderHandlers = require('./handlers/orderHandlers');
const shippingHandlers = require('./handlers/shippingHandlers');
const recommendationHandlers = require('./handlers/recommendationHandlers');
const promotionHandlers = require('./handlers/promotionHandlers');
const storeHandlers = require('./handlers/storeHandlers');
const llmService = require('./services/llmService');

// Initialize Express app
const app = express();
app.use(bodyParser.json());

const PORT = process.env.PORT || 3000;

// Handle Dialogflow webhook requests
app.post('/webhook', async (req, res) => {
  console.log('Webhook request received');
  
  const agent = new WebhookClient({ request: req, response: res });
  
  // Map intents to handler functions
  const intentMap = new Map();
  
  // Product related intents
  intentMap.set('Search.Product', productHandlers.handleProductSearch);
  intentMap.set('Product.Details', productHandlers.handleProductDetails);
  intentMap.set('Product.Recommendation', recommendationHandlers.handleProductRecommendation);
  
  // Cart related intents
  intentMap.set('Cart.Add', cartHandlers.handleAddToCart);
  intentMap.set('Cart.View', cartHandlers.handleViewCart);
  intentMap.set('Cart.Remove', cartHandlers.handleRemoveFromCart);
  intentMap.set('Checkout', cartHandlers.handleCheckout);
  
  // Order related intents
  intentMap.set('Order.Track', orderHandlers.handleOrderTracking);
  intentMap.set('Order.Cancel', orderHandlers.handleOrderCancel);
  
  // Shipping related intents
  intentMap.set('Shipping.Info', shippingHandlers.handleShippingInfo);
  
  // Promotions and discounts
  intentMap.set('Discount.Promo', promotionHandlers.handlePromotions);
  
  // Store locations
  intentMap.set('Store.Location', storeHandlers.handleStoreLocation);
  
  // Fallback intent with LLM integration
  intentMap.set('Default Fallback Intent', async (agent) => {
    try {
      // Get the user's message from the request
      const userMessage = agent.query;
      
      // Get response from LLM service
      const llmResponse = await llmService.getFallbackResponse(userMessage);
      
      // Add the LLM response
      agent.add(llmResponse);
      
      // Add suggestion chips for common actions
      const suggestionPayload = {
        richContent: [
          [
            {
              type: "chips",
              options: [
                { text: "Find products" },
                { text: "Track my order" },
                { text: "View cart" },
                { text: "Contact support" }
              ]
            }
          ]
        ]
      };
      
      agent.add(new Payload(agent.UNSPECIFIED, suggestionPayload, { sendAsMessage: true, rawPayload: true }));
    } catch (error) {
      console.error('Error in fallback intent:', error);
      agent.add("I apologize, but I'm having trouble understanding. Could you please rephrase your question or try one of these common options?");
    }
  });
  
  // Handle the intent
  agent.handleRequest(intentMap);
});

// Health check endpoint
app.get('/', (req, res) => {
  res.send('E-commerce Chatbot Fulfillment Server is running!');
});

// Start the server
app.listen(PORT, () => {
  console.log(`Fulfillment server listening on port ${PORT}`);
});

module.exports = app;