// Product recommendation intent handlers
const { Card, Suggestion, Payload } = require('dialogflow-fulfillment');
const database = require('../services/database');
const sessionManager = require('../services/sessionManager');

/**
 * Handles product recommendation intents
 * @param {DialogflowAgent} agent - The Dialogflow agent
 */
const handleProductRecommendation = async (agent) => {
  // Extract parameters
  const productType = agent.parameters['product-type'];
  const occasion = agent.parameters.occasion;
  
  // Get the session ID for personalization
  const sessionId = agent.session.split('/').pop();
  
  try {
    let recommendations;
    let recommendationContext;
    
    if (productType) {
      // Get recommendations for specific product type
      recommendations = await database.getRecommendedProducts({ productType });
      recommendationContext = `Here are some popular ${productType} products:`;
    } else if (occasion) {
      // Get recommendations for specific occasion
      recommendations = await database.getRecommendedProductsForOccasion(occasion);
      recommendationContext = `Here are some great products for ${occasion}:`;
    } else {
      // Get personalized recommendations based on browsing/purchase history
      const userId = await sessionManager.getUserId(sessionId);
      const isLoggedIn = await sessionManager.isUserLoggedIn(sessionId);
      
      if (isLoggedIn) {
        // Personalized recommendations for logged-in users
        recommendations = await database.getPersonalizedRecommendations(userId);
        recommendationContext = "Based on your past activity, you might like these products:";
      } else {
        // General trending/popular products for guests
        recommendations = await database.getTrendingProducts();
        recommendationContext = "Here are some of our popular products right now:";
      }
    }
    
    if (!recommendations || recommendations.length === 0) {
      agent.add(`I don't have any specific recommendations at the moment. Would you like to browse our popular categories instead?`);
      
      // Suggest popular categories
      const categorySuggestions = {
        richContent: [
          [
            {
              type: "chips",
              options: [
                { text: "Electronics" },
                { text: "Clothing" },
                { text: "Home goods" },
                { text: "Accessories" }
              ]
            }
          ]
        ]
      };
      
      agent.add(new Payload(agent.UNSPECIFIED, categorySuggestions, { sendAsMessage: true, rawPayload: true }));
      return;
    }
    
    agent.add(recommendationContext);
    
    // Create a rich response with product recommendations
    const recommendationsResponse = {
      richContent: [
        recommendations.slice(0, 3).map(product => ({
          type: "info",
          title: product.name,
          subtitle: `$${product.price.toFixed(2)}`,
          actionLink: `https://example.com/products/${product.id}`,
          image: {
            src: {
              rawUrl: product.imageUrl
            }
          }
        }))
      ]
    };
    
    // Add action buttons for each product
    const actionButtons = {
      richContent: [
        [
          {
            type: "chips",
            options: recommendations.slice(0, 3).map(product => ({
              text: `View ${product.name}`,
              image: {
                src: {
                  rawUrl: "https://example.com/images/view-icon.png"
                }
              }
            }))
          }
        ]
      ]
    };
    
    // Add a "View more" button if there are more recommendations
    if (recommendations.length > 3) {
      const viewMoreButton = {
        richContent: [
          [
            {
              type: "button",
              icon: {
                type: "more_horiz"
              },
              text: "View more recommendations",
              link: productType 
                ? `https://example.com/products?category=${encodeURIComponent(productType)}`
                : "https://example.com/recommendations"
            }
          ]
        ]
      };
      
      agent.add(new Payload(agent.UNSPECIFIED, viewMoreButton, { sendAsMessage: true, rawPayload: true }));
    }
    
    agent.add(new Payload(agent.UNSPECIFIED, recommendationsResponse, { sendAsMessage: true, rawPayload: true }));
    agent.add(new Payload(agent.UNSPECIFIED, actionButtons, { sendAsMessage: true, rawPayload: true }));
    
    // Add follow-up question
    agent.add('Would you like more specific recommendations?');
    
  } catch (error) {
    console.error('Error getting product recommendations:', error);
    agent.add('Sorry, I encountered an error while retrieving product recommendations. Please try again later.');
  }
};

/**
 * Handles similar products recommendation intents
 * @param {DialogflowAgent} agent - The Dialogflow agent
 */
const handleSimilarProducts = async (agent) => {
  // Extract parameters
  const productName = agent.parameters['product-name'];
  const productId = agent.parameters.productId;
  
  try {
    // Get similar products based on product name or ID
    const similarProducts = await database.getSimilarProducts(productId || productName);
    
    if (!similarProducts || similarProducts.length === 0) {
      agent.add(`I don't have any similar products to suggest at the moment. Would you like to browse our popular categories instead?`);
      return;
    }
    
    agent.add(`Here are some products similar to ${productName}:`);
    
    // Create a rich response with similar products
    const similarProductsResponse = {
      richContent: [
        similarProducts.slice(0, 3).map(product => ({
          type: "info",
          title: product.name,
          subtitle: `$${product.price.toFixed(2)}`,
          actionLink: `https://example.com/products/${product.id}`,
          image: {
            src: {
              rawUrl: product.imageUrl
            }
          }
        }))
      ]
    };
    
    // Add action buttons for each product
    const actionButtons = {
      richContent: [
        [
          {
            type: "chips",
            options: similarProducts.slice(0, 3).map(product => ({
              text: `View ${product.name}`,
              image: {
                src: {
                  rawUrl: "https://example.com/images/view-icon.png"
                }
              }
            }))
          }
        ]
      ]
    };
    
    agent.add(new Payload(agent.UNSPECIFIED, similarProductsResponse, { sendAsMessage: true, rawPayload: true }));
    agent.add(new Payload(agent.UNSPECIFIED, actionButtons, { sendAsMessage: true, rawPayload: true }));
    
  } catch (error) {
    console.error('Error getting similar products:', error);
    agent.add('Sorry, I encountered an error while retrieving similar products. Please try again later.');
  }
};

module.exports = {
  handleProductRecommendation,
  handleSimilarProducts
};