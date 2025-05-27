// Order-related intent handlers
const { Card, Suggestion, Payload } = require('dialogflow-fulfillment');
const database = require('../services/database');
const formatter = require('../utils/formatter');
const sessionManager = require('../services/sessionManager');

/**
 * Handles order tracking intents
 * @param {DialogflowAgent} agent - The Dialogflow agent
 */
const handleOrderTracking = async (agent) => {
  // Extract parameters
  const orderNumber = agent.parameters['order-number'];
  
  // Get the session ID to check if the user is logged in
  const sessionId = agent.session.split('/').pop();
  const isLoggedIn = await sessionManager.isUserLoggedIn(sessionId);
  
  try {
    let order;
    
    if (orderNumber) {
      // Track by order number
      order = await database.getOrderByNumber(orderNumber);
    } else if (isLoggedIn) {
      // If no order number but user is logged in, get their recent orders
      const userId = await sessionManager.getUserId(sessionId);
      const recentOrders = await database.getRecentOrders(userId);
      
      if (recentOrders && recentOrders.length > 0) {
        agent.add('Here are your recent orders:');
        
        // Create a rich response with recent orders
        const recentOrdersResponse = {
          richContent: [
            recentOrders.map(order => ({
              type: "info",
              title: `Order #${order.orderNumber}`,
              subtitle: `Placed on ${formatter.formatDate(order.orderDate)} • Status: ${order.status}`,
              actionLink: `https://example.com/orders/${order.orderNumber}`
            }))
          ]
        };
        
        agent.add(new Payload(agent.UNSPECIFIED, recentOrdersResponse, { sendAsMessage: true, rawPayload: true }));
        agent.add('Which order would you like to track?');
        return;
      } else {
        agent.add("I couldn't find any recent orders for your account. If you have an order number, please provide it.");
        return;
      }
    } else {
      // Not logged in and no order number
      agent.add('To track your order, please provide your order number. You can find it in your order confirmation email.');
      
      // Add login option
      const loginOption = {
        richContent: [
          [
            {
              type: "button",
              icon: {
                type: "account_circle"
              },
              text: "Login to view your orders",
              link: "https://example.com/login?redirect=orders"
            }
          ]
        ]
      };
      
      agent.add(new Payload(agent.UNSPECIFIED, loginOption, { sendAsMessage: true, rawPayload: true }));
      return;
    }
    
    if (!order) {
      agent.add(`I couldn't find an order with the number ${orderNumber}. Please check the number and try again.`);
      return;
    }
    
    // Format the response based on order status
    let statusMessage;
    let statusDetails;
    
    switch (order.status.toLowerCase()) {
      case 'processing':
        statusMessage = 'Your order is being processed.';
        statusDetails = 'We\'re preparing your items for shipment. This usually takes 1-2 business days.';
        break;
      case 'shipped':
        statusMessage = 'Your order has been shipped!';
        statusDetails = `It was shipped on ${formatter.formatDate(order.shippedDate)} via ${order.shippingMethod}.`;
        break;
      case 'delivered':
        statusMessage = 'Your order has been delivered!';
        statusDetails = `It was delivered on ${formatter.formatDate(order.deliveredDate)}.`;
        break;
      case 'cancelled':
        statusMessage = 'Your order has been cancelled.';
        statusDetails = order.cancellationReason || 'The order was cancelled.';
        break;
      default:
        statusMessage = `Your order status is: ${order.status}`;
        statusDetails = 'Please contact customer support for more information.';
    }
    
    agent.add(`Order #${order.orderNumber}: ${statusMessage}`);
    
    // Create a rich card with order details
    const orderCard = {
      richContent: [
        [
          {
            type: "info",
            title: `Order #${order.orderNumber}`,
            subtitle: `Placed on ${formatter.formatDate(order.orderDate)}`,
            image: {
              src: {
                rawUrl: "https://example.com/images/order-icon.png"
              }
            }
          },
          {
            type: "accordion",
            title: "Order Status",
            subtitle: order.status,
            text: statusDetails
          },
          {
            type: "description",
            title: "Order Information",
            items: [
              { key: "Order Date", value: formatter.formatDate(order.orderDate) },
              { key: "Shipping Method", value: order.shippingMethod },
              { key: "Tracking Number", value: order.trackingNumber || "Not available yet" },
              { key: "Estimated Delivery", value: order.estimatedDeliveryDate ? formatter.formatDate(order.estimatedDeliveryDate) : "Pending" }
            ]
          }
        ]
      ]
    };
    
    // Add items in the order
    const orderItemsResponse = {
      richContent: [
        [
          {
            type: "info",
            title: "Order Items",
            subtitle: `${order.items.length} item(s)`,
            actionLink: `https://example.com/orders/${order.orderNumber}`
          },
          ...order.items.map(item => ({
            type: "info",
            title: item.name,
            subtitle: `Quantity: ${item.quantity} • Price: $${(item.price * item.quantity).toFixed(2)}`,
            image: {
              src: {
                rawUrl: item.imageUrl
              }
            }
          }))
        ]
      ]
    };
    
    // Add action buttons based on order status
    let actionButtons;
    
    if (order.status.toLowerCase() === 'delivered') {
      actionButtons = {
        richContent: [
          [
            {
              type: "chips",
              options: [
                { text: "Write a review" },
                { text: "Report an issue" },
                { text: "Buy again" }
              ]
            }
          ]
        ]
      };
    } else if (order.status.toLowerCase() === 'processing') {
      actionButtons = {
        richContent: [
          [
            {
              type: "chips",
              options: [
                { text: "Cancel order" },
                { text: "Modify order" },
                { text: "Contact support" }
              ]
            }
          ]
        ]
      };
    } else if (order.status.toLowerCase() === 'shipped') {
      actionButtons = {
        richContent: [
          [
            {
              type: "button",
              icon: {
                type: "map"
              },
              text: "Track shipment",
              link: `https://example.com/track?number=${order.trackingNumber}`
            },
            {
              type: "chips",
              options: [
                { text: "Delivery issues" },
                { text: "Contact support" }
              ]
            }
          ]
        ]
      };
    }
    
    agent.add(new Payload(agent.UNSPECIFIED, orderCard, { sendAsMessage: true, rawPayload: true }));
    agent.add(new Payload(agent.UNSPECIFIED, orderItemsResponse, { sendAsMessage: true, rawPayload: true }));
    
    if (actionButtons) {
      agent.add(new Payload(agent.UNSPECIFIED, actionButtons, { sendAsMessage: true, rawPayload: true }));
    }
    
  } catch (error) {
    console.error('Error tracking order:', error);
    agent.add('Sorry, I encountered an error while tracking your order. Please try again later or contact our customer support for assistance.');
  }
};

/**
 * Handles order cancellation intents
 * @param {DialogflowAgent} agent - The Dialogflow agent
 */
const handleOrderCancel = async (agent) => {
  // Extract parameters
  const orderNumber = agent.parameters['order-number'];
  
  // Get the session ID to check if the user is logged in
  const sessionId = agent.session.split('/').pop();
  const isLoggedIn = await sessionManager.isUserLoggedIn(sessionId);
  
  try {
    // Validate order number and user authentication
    if (!orderNumber) {
      if (isLoggedIn) {
        // If logged in but no order number, show recent orders
        const userId = await sessionManager.getUserId(sessionId);
        const recentOrders = await database.getRecentOrders(userId);
        
        if (recentOrders && recentOrders.length > 0) {
          agent.add('Which order would you like to cancel? Here are your recent orders:');
          
          // Create a rich response with recent orders
          const recentOrdersResponse = {
            richContent: [
              recentOrders
                .filter(order => ['processing', 'pending'].includes(order.status.toLowerCase()))
                .map(order => ({
                  type: "info",
                  title: `Order #${order.orderNumber}`,
                  subtitle: `Placed on ${formatter.formatDate(order.orderDate)} • Status: ${order.status}`,
                  actionLink: `https://example.com/orders/${order.orderNumber}`
                }))
            ]
          };
          
          if (recentOrdersResponse.richContent[0].length === 0) {
            agent.add('I couldn\'t find any recent orders that can be cancelled. Orders can only be cancelled if they are still processing and haven\'t shipped yet.');
            return;
          }
          
          agent.add(new Payload(agent.UNSPECIFIED, recentOrdersResponse, { sendAsMessage: true, rawPayload: true }));
          return;
        } else {
          agent.add("I couldn't find any recent orders for your account. If you have an order number, please provide it.");
          return;
        }
      } else {
        // Not logged in and no order number
        agent.add('To cancel your order, please provide your order number. You can find it in your order confirmation email.');
        
        // Add login option
        const loginOption = {
          richContent: [
            [
              {
                type: "button",
                icon: {
                  type: "account_circle"
                },
                text: "Login to view your orders",
                link: "https://example.com/login?redirect=orders"
              }
            ]
          ]
        };
        
        agent.add(new Payload(agent.UNSPECIFIED, loginOption, { sendAsMessage: true, rawPayload: true }));
        return;
      }
    }
    
    // Check if the order exists and can be cancelled
    const order = await database.getOrderByNumber(orderNumber);
    
    if (!order) {
      agent.add(`I couldn't find an order with the number ${orderNumber}. Please check the number and try again.`);
      return;
    }
    
    // Check if the order is in a cancellable state
    if (!['processing', 'pending'].includes(order.status.toLowerCase())) {
      agent.add(`I'm sorry, but order #${orderNumber} cannot be cancelled because it has already been ${order.status.toLowerCase()}.`);
      
      // Offer alternatives based on status
      if (order.status.toLowerCase() === 'shipped') {
        agent.add('Since your order has already shipped, you can return it once received. Would you like information about our return policy?');
        agent.add(new Suggestion('Return policy'));
        agent.add(new Suggestion('Track order'));
      } else if (order.status.toLowerCase() === 'delivered') {
        agent.add('Since your order has been delivered, you can initiate a return if you\'re not satisfied. Would you like information about our return policy?');
        agent.add(new Suggestion('Return policy'));
        agent.add(new Suggestion('Start a return'));
      }
      
      return;
    }
    
    // Confirm cancellation intent
    agent.add(`Are you sure you want to cancel order #${orderNumber}? This action cannot be undone.`);
    
    // Create confirmation buttons
    const confirmationButtons = {
      richContent: [
        [
          {
            type: "chips",
            options: [
              { text: `Yes, cancel order #${orderNumber}` },
              { text: "No, keep my order" }
            ]
          }
        ]
      ]
    };
    
    // Add order summary
    const orderSummary = {
      richContent: [
        [
          {
            type: "accordion",
            title: `Order #${orderNumber} Summary`,
            subtitle: `${order.items.length} item(s) • Total: $${order.total.toFixed(2)}`,
            text: order.items.map(item => 
              `${item.name} (${item.quantity}) - $${(item.price * item.quantity).toFixed(2)}`
            ).join('\n')
          }
        ]
      ]
    };
    
    agent.add(new Payload(agent.UNSPECIFIED, orderSummary, { sendAsMessage: true, rawPayload: true }));
    agent.add(new Payload(agent.UNSPECIFIED, confirmationButtons, { sendAsMessage: true, rawPayload: true }));
    
    // Store the order number in context for the confirmation follow-up
    agent.context.set('awaiting_cancellation_confirmation', 2, {
      orderNumber: orderNumber
    });
    
  } catch (error) {
    console.error('Error processing order cancellation:', error);
    agent.add('Sorry, I encountered an error while processing your cancellation request. Please try again later or contact our customer support for assistance.');
  }
};

/**
 * Handles order cancellation confirmation (follow-up intent)
 * @param {DialogflowAgent} agent - The Dialogflow agent
 */
const handleOrderCancelConfirmation = async (agent) => {
  // This would be a follow-up intent for "Order.Cancel - yes" confirmation
  // Get the order number from context
  const cancellationContext = agent.context.get('awaiting_cancellation_confirmation');
  
  if (!cancellationContext || !cancellationContext.parameters.orderNumber) {
    agent.add('I\'m not sure which order you want to cancel. Please provide the order number.');
    return;
  }
  
  const orderNumber = cancellationContext.parameters.orderNumber;
  
  try {
    // Process the cancellation
    const cancellationResult = await database.cancelOrder(orderNumber);
    
    if (cancellationResult.success) {
      agent.add(`Your order #${orderNumber} has been successfully cancelled. You should receive a confirmation email shortly.`);
      
      // If refund is being processed
      if (cancellationResult.refundInitiated) {
        agent.add(`A refund of $${cancellationResult.refundAmount.toFixed(2)} has been initiated and will be processed within 3-5 business days, depending on your payment method.`);
      }
      
      // Add follow-up options
      const followUpOptions = {
        richContent: [
          [
            {
              type: "chips",
              options: [
                { text: "Shop again" },
                { text: "View similar products" },
                { text: "Contact support" }
              ]
            }
          ]
        ]
      };
      
      agent.add(new Payload(agent.UNSPECIFIED, followUpOptions, { sendAsMessage: true, rawPayload: true }));
    } else {
      agent.add(`I'm sorry, there was an issue cancelling your order #${orderNumber}. ${cancellationResult.message || 'Please contact customer support for assistance.'}`);
      
      // Add contact support option
      const supportOption = {
        richContent: [
          [
            {
              type: "button",
              icon: {
                type: "contact_support"
              },
              text: "Contact Customer Support",
              link: "https://example.com/contact"
            }
          ]
        ]
      };
      
      agent.add(new Payload(agent.UNSPECIFIED, supportOption, { sendAsMessage: true, rawPayload: true }));
    }
    
    // Clear the context
    agent.context.delete('awaiting_cancellation_confirmation');
    
  } catch (error) {
    console.error('Error confirming order cancellation:', error);
    agent.add('Sorry, I encountered an error while processing your cancellation request. Please try again later or contact our customer support for assistance.');
  }
};

module.exports = {
  handleOrderTracking,
  handleOrderCancel,
  handleOrderCancelConfirmation
};