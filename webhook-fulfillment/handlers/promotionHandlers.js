// Promotion and discount intent handlers
const { Card, Suggestion, Payload } = require('dialogflow-fulfillment');
const database = require('../services/database');
const sessionManager = require('../services/sessionManager');

/**
 * Handles promotions and discounts intents
 * @param {DialogflowAgent} agent - The Dialogflow agent
 */
const handlePromotions = async (agent) => {
  // Extract parameters
  const productType = agent.parameters['product-type'];
  
  // Get the session ID
  const sessionId = agent.session.split('/').pop();
  
  try {
    let promotions;
    
    if (productType) {
      // Get promotions for specific product type
      promotions = await database.getPromotionsForProductType(productType);
      
      if (!promotions || promotions.length === 0) {
        agent.add(`I don't see any current promotions specifically for ${productType}. Let me show you our general ongoing promotions instead.`);
        promotions = await database.getCurrentPromotions();
      } else {
        agent.add(`Here are the current promotions for ${productType}:`);
      }
    } else {
      // Get all current promotions
      promotions = await database.getCurrentPromotions();
      agent.add('Here are our current promotions and special offers:');
    }
    
    if (!promotions || promotions.length === 0) {
      agent.add("I don't see any active promotions at the moment. Check back soon for new deals!");
      return;
    }
    
    // Create a rich response with promotions
    const promotionsResponse = {
      richContent: [
        promotions.map(promo => ({
          type: "info",
          title: promo.title,
          subtitle: promo.description,
          actionLink: promo.url,
          image: {
            src: {
              rawUrl: promo.imageUrl
            }
          }
        }))
      ]
    };
    
    // Add promo codes if available
    if (promotions.some(promo => promo.promoCode)) {
      const promoCodes = {
        richContent: [
          [
            {
              type: "info",
              title: "Promo Codes",
              subtitle: "Use these codes at checkout"
            },
            ...promotions
              .filter(promo => promo.promoCode)
              .map(promo => ({
                type: "accordion",
                title: promo.promoCode,
                subtitle: promo.title,
                text: `${promo.description}\nValid until: ${promo.expiryDate}`
              }))
          ]
        ]
      };
      
      agent.add(new Payload(agent.UNSPECIFIED, promoCodes, { sendAsMessage: true, rawPayload: true }));
    }
    
    agent.add(new Payload(agent.UNSPECIFIED, promotionsResponse, { sendAsMessage: true, rawPayload: true }));
    
    // Add suggestions for navigation
    agent.add('Would you like to shop any of these promotions?');
    
    // Add action buttons
    const actionButtons = {
      richContent: [
        [
          {
            type: "chips",
            options: [
              { text: "Show all deals" },
              { text: "Clearance items" },
              { text: "Add to cart" }
            ]
          }
        ]
      ]
    };
    
    agent.add(new Payload(agent.UNSPECIFIED, actionButtons, { sendAsMessage: true, rawPayload: true }));
    
  } catch (error) {
    console.error('Error fetching promotions:', error);
    agent.add('Sorry, I encountered an error while retrieving our current promotions. Please try again later or visit our website to see the latest deals.');
  }
};

/**
 * Handles coupon code validation intents
 * @param {DialogflowAgent} agent - The Dialogflow agent
 */
const handleCouponValidation = async (agent) => {
  // Extract parameters
  const couponCode = agent.parameters.couponCode;
  
  if (!couponCode) {
    agent.add('Please provide a coupon code to check its validity.');
    return;
  }
  
  try {
    // Validate the coupon code
    const couponValidation = await database.validateCouponCode(couponCode);
    
    if (couponValidation.valid) {
      agent.add(`Great news! The coupon code "${couponCode}" is valid. ${couponValidation.description}`);
      
      // Add details about the coupon
      const couponDetails = {
        richContent: [
          [
            {
              type: "info",
              title: `Valid Coupon: ${couponCode}`,
              subtitle: couponValidation.description,
              image: {
                src: {
                  rawUrl: "https://example.com/images/valid-coupon.png"
                }
              }
            },
            {
              type: "description",
              title: "Coupon Details",
              items: [
                { key: "Discount", value: couponValidation.discountInfo },
                { key: "Minimum Order", value: couponValidation.minimumOrderValue ? `$${couponValidation.minimumOrderValue.toFixed(2)}` : "No minimum" },
                { key: "Expiry Date", value: couponValidation.expiryDate },
                { key: "Restrictions", value: couponValidation.restrictions || "No restrictions" }
              ]
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
                { text: "Apply to cart" },
                { text: "Continue shopping" },
                { text: "View cart" }
              ]
            }
          ]
        ]
      };
      
      agent.add(new Payload(agent.UNSPECIFIED, couponDetails, { sendAsMessage: true, rawPayload: true }));
      agent.add(new Payload(agent.UNSPECIFIED, actionButtons, { sendAsMessage: true, rawPayload: true }));
    } else {
      agent.add(`I'm sorry, but the coupon code "${couponCode}" is not valid. ${couponValidation.reason || ''}`);
      
      // If there are suggested valid coupons, show them
      if (couponValidation.suggestedCoupons && couponValidation.suggestedCoupons.length > 0) {
        agent.add('Here are some valid coupon codes you can use instead:');
        
        const suggestedCoupons = {
          richContent: [
            [
              {
                type: "info",
                title: "Available Coupons",
                subtitle: "These coupon codes are currently valid"
              },
              ...couponValidation.suggestedCoupons.map(coupon => ({
                type: "accordion",
                title: coupon.code,
                subtitle: coupon.description,
                text: `Discount: ${coupon.discountInfo}\nExpiry: ${coupon.expiryDate}`
              }))
            ]
          ]
        };
        
        agent.add(new Payload(agent.UNSPECIFIED, suggestedCoupons, { sendAsMessage: true, rawPayload: true }));
      }
      
      // Add action buttons
      const actionButtons = {
        richContent: [
          [
            {
              type: "chips",
              options: [
                { text: "View current promotions" },
                { text: "Continue shopping" },
                { text: "Try another code" }
              ]
            }
          ]
        ]
      };
      
      agent.add(new Payload(agent.UNSPECIFIED, actionButtons, { sendAsMessage: true, rawPayload: true }));
    }
    
  } catch (error) {
    console.error('Error validating coupon code:', error);
    agent.add('Sorry, I encountered an error while validating the coupon code. Please try again later or contact our customer support for assistance.');
  }
};

module.exports = {
  handlePromotions,
  handleCouponValidation
};