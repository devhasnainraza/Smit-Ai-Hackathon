// Product-related intent handlers
const { Card, Suggestion, Payload } = require('dialogflow-fulfillment');
const database = require('../services/database');
const formatter = require('../utils/formatter');

/**
 * Handles product search intents
 * @param {DialogflowAgent} agent - The Dialogflow agent
 */
const handleProductSearch = async (agent) => {
  // Extract parameters from the conversation
  const productType = agent.parameters['product-type'];
  const color = agent.parameters['color'];
  const size = agent.parameters['size'];
  const priceRange = agent.parameters['price-range'];
  
  try {
    // Query the database for matching products
    const products = await database.searchProducts({ 
      productType, 
      color, 
      size, 
      priceRange 
    });
    
    if (products.length === 0) {
      // No products found
      agent.add(`I couldn't find any ${productType} matching your criteria. Would you like to try a different search?`);
      agent.add(new Suggestion('View all products'));
      agent.add(new Suggestion('Change filters'));
      return;
    }
    
    // Acknowledge the search
    let responseText = `I found ${products.length} ${productType}`;
    if (color) responseText += ` in ${color}`;
    if (size) responseText += `, size ${size}`;
    if (priceRange) responseText += ` ${priceRange}`;
    
    agent.add(`${responseText}. Here are some options:`);
    
    // Create a rich response with product cards
    const richResponse = {
      richContent: [
        products.slice(0, 3).map(product => ({
          type: "info",
          title: product.name,
          subtitle: `$${product.price.toFixed(2)}`,
          actionLink: `https://example.com/products/${product.id}`,
          image: {
            src: {
              rawUrl: product.imageUrl
            }
          },
          accessibilityText: `Image of ${product.name}`
        }))
      ]
    };
    
    // Add action buttons for each product
    const actionButtons = {
      richContent: [
        [
          {
            type: "chips",
            options: products.slice(0, 3).map(product => ({
              text: `View ${product.name}`,
              image: {
                src: {
                  rawUrl: "https://example.com/images/view-icon.png"
                }
              }
            }))
          },
          {
            type: "chips",
            options: [
              { text: "View more results" },
              { text: "Refine search" }
            ]
          }
        ]
      ]
    };
    
    // Send the rich responses
    agent.add(new Payload(agent.UNSPECIFIED, richResponse, { sendAsMessage: true, rawPayload: true }));
    agent.add(new Payload(agent.UNSPECIFIED, actionButtons, { sendAsMessage: true, rawPayload: true }));
    
  } catch (error) {
    console.error('Error in product search:', error);
    agent.add('Sorry, I encountered an error while searching for products. Please try again later.');
  }
};

/**
 * Handles product details intents
 * @param {DialogflowAgent} agent - The Dialogflow agent
 */
const handleProductDetails = async (agent) => {
  // Extract parameters
  const productName = agent.parameters['product-name'];
  const productId = extractProductId(agent.parameters);
  
  try {
    // Get product details from database
    const product = await database.getProductDetails(productId || productName);
    
    if (!product) {
      agent.add(`I couldn't find details for ${productName}. Would you like to search for something else?`);
      return;
    }
    
    // Create a detailed response with product information
    agent.add(`Here are the details for ${product.name}:`);
    
    // Create a rich card with product details
    const detailsCard = new Card({
      title: product.name,
      imageUrl: product.imageUrl,
      text: product.description,
      buttonText: 'View on website',
      buttonUrl: `https://example.com/products/${product.id}`
    });
    
    // Add specifications as a structured response
    const specsResponse = {
      richContent: [
        [
          {
            type: "info",
            title: "Specifications",
            subtitle: "Product details and features",
            image: {
              src: {
                rawUrl: product.imageUrl
              }
            }
          },
          {
            type: "description",
            title: "Key Features",
            items: Object.entries(product.specifications).map(([key, value]) => (
              { key: formatter.capitalizeFirstLetter(key), value: value.toString() }
            ))
          },
          {
            type: "info",
            title: "Price",
            subtitle: `$${product.price.toFixed(2)}`,
            actionLink: `https://example.com/products/${product.id}`
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
              { 
                text: "Add to cart",
                image: {
                  src: {
                    rawUrl: "https://example.com/images/cart-icon.png"
                  }
                }
              },
              { 
                text: "See reviews",
                image: {
                  src: {
                    rawUrl: "https://example.com/images/review-icon.png"
                  }
                } 
              },
              { 
                text: "Similar products",
                image: {
                  src: {
                    rawUrl: "https://example.com/images/similar-icon.png"
                  }
                } 
              }
            ]
          }
        ]
      ]
    };
    
    // Add availability information
    if (product.inStock) {
      agent.add(`This item is in stock and ready to ship.`);
    } else {
      agent.add(`This item is currently out of stock. Would you like to be notified when it's available?`);
    }
    
    agent.add(detailsCard);
    agent.add(new Payload(agent.UNSPECIFIED, specsResponse, { sendAsMessage: true, rawPayload: true }));
    agent.add(new Payload(agent.UNSPECIFIED, actionButtons, { sendAsMessage: true, rawPayload: true }));
    
  } catch (error) {
    console.error('Error fetching product details:', error);
    agent.add('Sorry, I encountered an error while fetching product details. Please try again later.');
  }
};

/**
 * Extract product ID from parameters or contexts
 * @param {Object} parameters - Parameters from Dialogflow
 * @returns {string|null} The product ID or null
 */
const extractProductId = (parameters) => {
  // This would extract a product ID from either explicit parameters
  // or from context if the user is referring to a previously shown product
  return parameters.productId || null;
};

module.exports = {
  handleProductSearch,
  handleProductDetails
};