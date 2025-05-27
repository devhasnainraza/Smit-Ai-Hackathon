// Shipping-related intent handlers
const { Card, Suggestion, Payload } = require('dialogflow-fulfillment');
const database = require('../services/database');
const formatter = require('../utils/formatter');

/**
 * Handles shipping information intents
 * @param {DialogflowAgent} agent - The Dialogflow agent
 */
const handleShippingInfo = async (agent) => {
  // Extract parameters
  const location = agent.parameters.location;
  
  try {
    // Get shipping information based on location
    let shippingInfo;
    
    if (location) {
      // Get shipping details for the specific location
      shippingInfo = await database.getShippingInfoForLocation(location);
      
      if (!shippingInfo) {
        agent.add(`I'm sorry, but we don't have specific shipping information for ${location}. Let me provide our general shipping details.`);
        shippingInfo = await database.getDefaultShippingInfo();
      } else {
        agent.add(`Here's the shipping information for ${location}:`);
      }
    } else {
      // Get default shipping information
      shippingInfo = await database.getDefaultShippingInfo();
      agent.add('Here are our shipping options and policies:');
    }
    
    // Create a rich response with shipping options
    const shippingOptionsResponse = {
      richContent: [
        [
          {
            type: "info",
            title: "Shipping Options",
            subtitle: shippingInfo.generalInfo,
            image: {
              src: {
                rawUrl: "https://example.com/images/shipping-icon.png"
              }
            }
          },
          {
            type: "accordion",
            title: "Standard Shipping",
            subtitle: `${shippingInfo.standardShipping.price === 0 ? 'FREE' : '$' + shippingInfo.standardShipping.price.toFixed(2)} • ${shippingInfo.standardShipping.time}`,
            text: shippingInfo.standardShipping.details
          },
          {
            type: "accordion",
            title: "Express Shipping",
            subtitle: `$${shippingInfo.expressShipping.price.toFixed(2)} • ${shippingInfo.expressShipping.time}`,
            text: shippingInfo.expressShipping.details
          }
        ]
      ]
    };
    
    // Add shipping restrictions or notes if applicable
    if (shippingInfo.restrictions && shippingInfo.restrictions.length > 0) {
      const restrictionsResponse = {
        richContent: [
          [
            {
              type: "info",
              title: "Shipping Restrictions",
              subtitle: "Please note the following shipping restrictions",
            },
            {
              type: "list",
              title: "Important Notes",
              items: shippingInfo.restrictions
            }
          ]
        ]
      };
      
      agent.add(new Payload(agent.UNSPECIFIED, restrictionsResponse, { sendAsMessage: true, rawPayload: true }));
    }
    
    // Add free shipping threshold if applicable
    if (shippingInfo.freeShippingThreshold) {
      agent.add(`Orders over $${shippingInfo.freeShippingThreshold.toFixed(2)} qualify for FREE standard shipping!`);
    }
    
    agent.add(new Payload(agent.UNSPECIFIED, shippingOptionsResponse, { sendAsMessage: true, rawPayload: true }));
    
    // Add follow-up suggestions
    agent.add('Is there anything specific about shipping you\'d like to know?');
    agent.add(new Suggestion('Shipping timeframes'));
    agent.add(new Suggestion('International shipping'));
    agent.add(new Suggestion('Return policy'));
    
  } catch (error) {
    console.error('Error fetching shipping information:', error);
    agent.add('Sorry, I encountered an error while retrieving shipping information. Please try again later or contact our customer support for assistance.');
  }
};

/**
 * Handles international shipping information intents
 * @param {DialogflowAgent} agent - The Dialogflow agent
 */
const handleInternationalShipping = async (agent) => {
  // Extract parameters
  const country = agent.parameters.country;
  
  try {
    // Get international shipping information
    let internationalShippingInfo;
    
    if (country) {
      // Get shipping details for the specific country
      internationalShippingInfo = await database.getInternationalShippingForCountry(country);
      
      if (!internationalShippingInfo) {
        agent.add(`I'm sorry, but we don't have specific shipping information for ${country}. Let me provide our general international shipping details.`);
        internationalShippingInfo = await database.getDefaultInternationalShipping();
      } else {
        agent.add(`Here's the international shipping information for ${country}:`);
      }
    } else {
      // Get default international shipping information
      internationalShippingInfo = await database.getDefaultInternationalShipping();
      agent.add('Here is our international shipping information:');
    }
    
    // Create a rich response with international shipping details
    const internationalShippingResponse = {
      richContent: [
        [
          {
            type: "info",
            title: "International Shipping",
            subtitle: internationalShippingInfo.generalInfo,
            image: {
              src: {
                rawUrl: "https://example.com/images/international-shipping-icon.png"
              }
            }
          },
          {
            type: "description",
            title: "Shipping Options",
            items: [
              { key: "Standard", value: `$${internationalShippingInfo.standardShipping.price.toFixed(2)} • ${internationalShippingInfo.standardShipping.time}` },
              { key: "Express", value: `$${internationalShippingInfo.expressShipping.price.toFixed(2)} • ${internationalShippingInfo.expressShipping.time}` }
            ]
          },
          {
            type: "info",
            title: "Customs & Duties",
            subtitle: internationalShippingInfo.customsInfo
          }
        ]
      ]
    };
    
    // Add country restrictions if applicable
    if (internationalShippingInfo.countryRestrictions && internationalShippingInfo.countryRestrictions.length > 0) {
      const restrictionsResponse = {
        richContent: [
          [
            {
              type: "info",
              title: "Country Restrictions",
              subtitle: "We currently cannot ship to the following countries"
            },
            {
              type: "list",
              title: "Restricted Countries",
              items: internationalShippingInfo.countryRestrictions
            }
          ]
        ]
      };
      
      agent.add(new Payload(agent.UNSPECIFIED, restrictionsResponse, { sendAsMessage: true, rawPayload: true }));
    }
    
    agent.add(new Payload(agent.UNSPECIFIED, internationalShippingResponse, { sendAsMessage: true, rawPayload: true }));
    
    // Add follow-up suggestions
    agent.add('Is there anything specific about international shipping you\'d like to know?');
    agent.add(new Suggestion('Customs fees'));
    agent.add(new Suggestion('Tracking international orders'));
    agent.add(new Suggestion('International returns'));
    
  } catch (error) {
    console.error('Error fetching international shipping information:', error);
    agent.add('Sorry, I encountered an error while retrieving international shipping information. Please try again later or contact our customer support for assistance.');
  }
};

module.exports = {
  handleShippingInfo,
  handleInternationalShipping
};