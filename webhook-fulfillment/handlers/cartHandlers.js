// Cart-related intent handlers
const { Card, Suggestion, Payload } = require('dialogflow-fulfillment');
const database = require('../services/database');
const formatter = require('../utils/formatter');
const sessionManager = require('../services/sessionManager');

/**
 * Handles add to cart intents
 * @param {DialogflowAgent} agent - The Dialogflow agent
 */
const handleAddToCart = async (agent) => {
  // Extract parameters
  const productName = agent.parameters['product-name'];
  const quantity = agent.parameters.quantity || 1;
  const color = agent.parameters.color;
  const size = agent.parameters.size;
  
  // Get the session ID to identify the user's cart
  const sessionId = agent.session.split('/').pop();
  
  try {
    // Find the product in the database
    const product = await database.getProductByName(productName);
    
    if (!product) {
      agent.add(`I couldn't find ${productName} in our inventory. Would you like to search for a similar product?`);
      agent.add(new Suggestion('Search similar products'));
      agent.add(new Suggestion('Browse categories'));
      return;
    }
    
    // Check if the product is available in the specified color and size
    const isAvailable = await database.checkProductAvailability(product.id, { color, size });
    
    if (!isAvailable) {
      agent.add(`I'm sorry, but ${productName} is not available in ${color || 'the selected color'} and ${size || 'the selected size'}. Would you like to see other available options?`);
      agent.add(new Suggestion('See available options'));
      agent.add(new Suggestion('View similar products'));
      return;
    }
    
    // Add the product to the cart
    const cartItem = {
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity,
      color: color || product.defaultColor,
      size: size || product.defaultSize,
      imageUrl: product.imageUrl
    };
    
    await sessionManager.addToCart(sessionId, cartItem);
    
    // Get the updated cart
    const cart = await sessionManager.getCart(sessionId);
    const cartTotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    
    // Create a response confirming the addition
    agent.add(`Great! I've added ${quantity} ${productName} to your cart. Your cart now has ${cart.length} item(s) with a total of $${cartTotal.toFixed(2)}.`);
    
    // Create a rich response showing the added item
    const addedItemResponse = {
      richContent: [
        [
          {
            type: "info",
            title: `Added to Cart: ${productName}`,
            subtitle: `Quantity: ${quantity} • Price: $${(product.price * quantity).toFixed(2)}`,
            image: {
              src: {
                rawUrl: product.imageUrl
              }
            }
          }
        ]
      ]
    };
    
    // Add action buttons
    const actionButtons = {
      richContent: [
        [
          {
            type: "chips",
            options: [
              { text: "View cart" },
              { text: "Checkout" },
              { text: "Continue shopping" }
            ]
          }
        ]
      ]
    };
    
    agent.add(new Payload(agent.UNSPECIFIED, addedItemResponse, { sendAsMessage: true, rawPayload: true }));
    agent.add(new Payload(agent.UNSPECIFIED, actionButtons, { sendAsMessage: true, rawPayload: true }));
    
  } catch (error) {
    console.error('Error adding item to cart:', error);
    agent.add('Sorry, I encountered an error while adding the item to your cart. Please try again later.');
  }
};

/**
 * Handles view cart intents
 * @param {DialogflowAgent} agent - The Dialogflow agent
 */
const handleViewCart = async (agent) => {
  // Get the session ID
  const sessionId = agent.session.split('/').pop();
  
  try {
    // Get the user's cart
    const cart = await sessionManager.getCart(sessionId);
    
    if (!cart || cart.length === 0) {
      agent.add('Your shopping cart is empty. Would you like to browse our products?');
      agent.add(new Suggestion('Browse products'));
      agent.add(new Suggestion('View deals'));
      return;
    }
    
    // Calculate the cart total
    const cartTotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    
    // Create a response with the cart contents
    agent.add(`You have ${cart.length} item(s) in your cart with a total of $${cartTotal.toFixed(2)}. Here's what's in your cart:`);
    
    // Create a rich response with cart items
    const cartItemsResponse = {
      richContent: [
        cart.map(item => ({
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
    };
    
    // Add a summary card
    const summaryResponse = {
      richContent: [
        [
          {
            type: "accordion",
            title: "Cart Summary",
            subtitle: `Total: $${cartTotal.toFixed(2)}`,
            text: `Subtotal: $${cartTotal.toFixed(2)}\nShipping: Calculated at checkout\nTax: Calculated at checkout`
          }
        ]
      ]
    };
    
    // Add action buttons
    const actionButtons = {
      richContent: [
        [
          {
            type: "chips",
            options: [
              { text: "Checkout" },
              { text: "Update cart" },
              { text: "Continue shopping" },
              { text: "Empty cart" }
            ]
          }
        ]
      ]
    };
    
    agent.add(new Payload(agent.UNSPECIFIED, cartItemsResponse, { sendAsMessage: true, rawPayload: true }));
    agent.add(new Payload(agent.UNSPECIFIED, summaryResponse, { sendAsMessage: true, rawPayload: true }));
    agent.add(new Payload(agent.UNSPECIFIED, actionButtons, { sendAsMessage: true, rawPayload: true }));
    
  } catch (error) {
    console.error('Error viewing cart:', error);
    agent.add('Sorry, I encountered an error while retrieving your cart. Please try again later.');
  }
};

/**
 * Handles remove from cart intents
 * @param {DialogflowAgent} agent - The Dialogflow agent
 */
const handleRemoveFromCart = async (agent) => {
  // Extract parameters
  const productName = agent.parameters['product-name'];
  const quantity = agent.parameters.quantity;
  
  // Get the session ID
  const sessionId = agent.session.split('/').pop();
  
  try {
    // Check if the product is in the cart
    const cart = await sessionManager.getCart(sessionId);
    
    if (!cart || cart.length === 0) {
      agent.add('Your shopping cart is already empty. Would you like to browse our products?');
      agent.add(new Suggestion('Browse products'));
      return;
    }
    
    const itemIndex = cart.findIndex(item => 
      item.name.toLowerCase() === productName.toLowerCase()
    );
    
    if (itemIndex === -1) {
      agent.add(`I couldn't find ${productName} in your cart. Here are the items in your cart:`);
      
      // List available items in cart
      const cartItemsResponse = {
        richContent: [
          [
            {
              type: "chips",
              options: cart.map(item => ({
                text: `Remove ${item.name}`
              }))
            }
          ]
        ]
      };
      
      agent.add(new Payload(agent.UNSPECIFIED, cartItemsResponse, { sendAsMessage: true, rawPayload: true }));
      return;
    }
    
    // If quantity is specified and less than the current quantity, reduce the quantity
    if (quantity && quantity < cart[itemIndex].quantity) {
      await sessionManager.updateCartItemQuantity(sessionId, cart[itemIndex].productId, cart[itemIndex].quantity - quantity);
      agent.add(`I've removed ${quantity} ${productName} from your cart.`);
    } else {
      // Otherwise remove the item completely
      await sessionManager.removeFromCart(sessionId, cart[itemIndex].productId);
      agent.add(`I've removed ${productName} from your cart.`);
    }
    
    // Get the updated cart
    const updatedCart = await sessionManager.getCart(sessionId);
    const cartTotal = updatedCart.reduce((total, item) => total + (item.price * item.quantity), 0);
    
    if (updatedCart.length === 0) {
      agent.add('Your cart is now empty. Would you like to continue shopping?');
      agent.add(new Suggestion('Browse products'));
      agent.add(new Suggestion('View deals'));
    } else {
      agent.add(`You now have ${updatedCart.length} item(s) in your cart with a total of $${cartTotal.toFixed(2)}.`);
      
      // Add action buttons
      const actionButtons = {
        richContent: [
          [
            {
              type: "chips",
              options: [
                { text: "View cart" },
                { text: "Checkout" },
                { text: "Continue shopping" }
              ]
            }
          ]
        ]
      };
      
      agent.add(new Payload(agent.UNSPECIFIED, actionButtons, { sendAsMessage: true, rawPayload: true }));
    }
    
  } catch (error) {
    console.error('Error removing item from cart:', error);
    agent.add('Sorry, I encountered an error while removing the item from your cart. Please try again later.');
  }
};

/**
 * Handles checkout intents
 * @param {DialogflowAgent} agent - The Dialogflow agent
 */
const handleCheckout = async (agent) => {
  // Get the session ID
  const sessionId = agent.session.split('/').pop();
  
  try {
    // Get the user's cart
    const cart = await sessionManager.getCart(sessionId);
    
    if (!cart || cart.length === 0) {
      agent.add('Your shopping cart is empty. You need to add items before checking out.');
      agent.add(new Suggestion('Browse products'));
      agent.add(new Suggestion('View deals'));
      return;
    }
    
    // Calculate the cart total
    const cartTotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    
    // Check if the user is logged in
    const isLoggedIn = await sessionManager.isUserLoggedIn(sessionId);
    
    if (!isLoggedIn) {
      agent.add(`To complete checkout, you'll need to log in or check out as a guest. Your cart total is $${cartTotal.toFixed(2)}.`);
      
      // Add login/guest checkout options
      const loginOptions = {
        richContent: [
          [
            {
              type: "button",
              icon: {
                type: "account_circle"
              },
              text: "Login to proceed",
              link: "https://example.com/login?redirect=checkout"
            },
            {
              type: "button",
              icon: {
                type: "person_outline"
              },
              text: "Continue as guest",
              link: "https://example.com/checkout/guest"
            }
          ]
        ]
      };
      
      agent.add(new Payload(agent.UNSPECIFIED, loginOptions, { sendAsMessage: true, rawPayload: true }));
      return;
    }
    
    // If user is logged in, proceed with checkout
    agent.add(`Ready to complete your purchase! Your cart total is $${cartTotal.toFixed(2)}. Please review your items and shipping information before proceeding.`);
    
    // Create a summary of the order
    const orderSummary = {
      richContent: [
        [
          {
            type: "accordion",
            title: "Order Summary",
            subtitle: `Total: $${cartTotal.toFixed(2)}`,
            text: cart.map(item => 
              `${item.name} (${item.quantity}) - $${(item.price * item.quantity).toFixed(2)}`
            ).join('\n')
          }
        ]
      ]
    };
    
    // Add checkout button
    const checkoutButton = {
      richContent: [
        [
          {
            type: "button",
            icon: {
              type: "shopping_cart"
            },
            text: "Proceed to checkout",
            link: "https://example.com/checkout"
          },
          {
            type: "button",
            icon: {
              type: "edit"
            },
            text: "Edit cart",
            link: "https://example.com/cart"
          }
        ]
      ]
    };
    
    agent.add(new Payload(agent.UNSPECIFIED, orderSummary, { sendAsMessage: true, rawPayload: true }));
    agent.add(new Payload(agent.UNSPECIFIED, checkoutButton, { sendAsMessage: true, rawPayload: true }));
    
    // Add payment method suggestions
    agent.add('You can pay using credit/debit card, PayPal, or other payment methods at checkout.');
    
  } catch (error) {
    console.error('Error during checkout:', error);
    agent.add('Sorry, I encountered an error during checkout. Please try again later or visit our website to complete your purchase.');
  }
};

module.exports = {
  handleAddToCart,
  handleViewCart,
  handleRemoveFromCart,
  handleCheckout
};