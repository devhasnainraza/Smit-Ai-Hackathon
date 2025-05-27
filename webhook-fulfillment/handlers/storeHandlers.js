// Store location intent handlers
const { Card, Suggestion, Payload } = require('dialogflow-fulfillment');
const database = require('../services/database');

/**
 * Handles store location intents
 * @param {DialogflowAgent} agent - The Dialogflow agent
 */
const handleStoreLocation = async (agent) => {
  // Extract parameters
  const location = agent.parameters.location;
  
  try {
    let stores;
    
    if (location) {
      // Get stores near the specified location
      stores = await database.getStoresByLocation(location);
      
      if (!stores || stores.length === 0) {
        agent.add(`I couldn't find any stores in ${location}. Let me show you our nearest locations instead.`);
        stores = await database.getNearestStores();
      } else {
        agent.add(`I found ${stores.length} store(s) in ${location}:`);
      }
    } else {
      // Get all store locations or popular ones
      stores = await database.getAllStores();
      agent.add('Here are our store locations:');
    }
    
    if (!stores || stores.length === 0) {
      agent.add("I couldn't find any store information at the moment. Please visit our website for the most up-to-date store locations.");
      
      // Add website link
      const websiteLink = {
        richContent: [
          [
            {
              type: "button",
              icon: {
                type: "store"
              },
              text: "Find stores on our website",
              link: "https://example.com/store-locator"
            }
          ]
        ]
      };
      
      agent.add(new Payload(agent.UNSPECIFIED, websiteLink, { sendAsMessage: true, rawPayload: true }));
      return;
    }
    
    // Create a rich response with store locations
    const storeLocationsResponse = {
      richContent: [
        stores.slice(0, 3).map(store => ({
          type: "info",
          title: store.name,
          subtitle: store.address,
          actionLink: `https://maps.google.com/?q=${encodeURIComponent(store.address)}`,
          image: {
            src: {
              rawUrl: store.imageUrl || "https://example.com/images/store-icon.png"
            }
          }
        }))
      ]
    };
    
    // Add store hours and contact info
    const storeDetailsResponse = {
      richContent: [
        stores.slice(0, 3).map(store => ({
          type: "accordion",
          title: `${store.name} Details`,
          subtitle: "Hours & Contact Information",
          text: `Hours: ${store.hours}\nPhone: ${store.phone}\nEmail: ${store.email}`
        }))
      ]
    };
    
    // Add action buttons
    const actionButtons = {
      richContent: [
        [
          {
            type: "button",
            icon: {
              type: "map"
            },
            text: "View all locations",
            link: "https://example.com/store-locator"
          },
          {
            type: "chips",
            options: [
              { text: "Store hours" },
              { text: "Store services" },
              { text: "Online shopping" }
            ]
          }
        ]
      ]
    };
    
    agent.add(new Payload(agent.UNSPECIFIED, storeLocationsResponse, { sendAsMessage: true, rawPayload: true }));
    agent.add(new Payload(agent.UNSPECIFIED, storeDetailsResponse, { sendAsMessage: true, rawPayload: true }));
    agent.add(new Payload(agent.UNSPECIFIED, actionButtons, { sendAsMessage: true, rawPayload: true }));
    
    // Add a store finder prompt
    if (stores.length > 3) {
      agent.add(`I've shown you ${Math.min(3, stores.length)} of our ${stores.length} locations. To see all stores, use our store locator tool.`);
    }
    
  } catch (error) {
    console.error('Error fetching store locations:', error);
    agent.add('Sorry, I encountered an error while retrieving store locations. Please try again later or visit our website for store information.');
  }
};

/**
 * Handles store hours intents
 * @param {DialogflowAgent} agent - The Dialogflow agent
 */
const handleStoreHours = async (agent) => {
  // Extract parameters
  const location = agent.parameters.location;
  const storeId = agent.parameters.storeId;
  
  try {
    let store;
    
    if (storeId) {
      // Get specific store by ID
      store = await database.getStoreById(storeId);
    } else if (location) {
      // Get first store in location
      const stores = await database.getStoresByLocation(location);
      store = stores && stores.length > 0 ? stores[0] : null;
    } else {
      // Default to nearest/main store
      store = await database.getDefaultStore();
    }
    
    if (!store) {
      agent.add("I couldn't find the store hours for that location. Please visit our website for the most up-to-date store hours.");
      return;
    }
    
    agent.add(`Here are the hours for our ${store.name} store:`);
    
    // Create a rich response with store hours
    const storeHoursResponse = {
      richContent: [
        [
          {
            type: "info",
            title: `${store.name} Hours`,
            subtitle: store.address,
            image: {
              src: {
                rawUrl: store.imageUrl || "https://example.com/images/store-icon.png"
              }
            }
          },
          {
            type: "description",
            title: "Weekly Hours",
            items: [
              { key: "Monday", value: store.hours.monday },
              { key: "Tuesday", value: store.hours.tuesday },
              { key: "Wednesday", value: store.hours.wednesday },
              { key: "Thursday", value: store.hours.thursday },
              { key: "Friday", value: store.hours.friday },
              { key: "Saturday", value: store.hours.saturday },
              { key: "Sunday", value: store.hours.sunday }
            ]
          }
        ]
      ]
    };
    
    // Add special hours or holiday hours if applicable
    if (store.specialHours && store.specialHours.length > 0) {
      const specialHoursResponse = {
        richContent: [
          [
            {
              type: "info",
              title: "Special Hours",
              subtitle: "Holiday hours and special events"
            },
            {
              type: "description",
              title: "Upcoming Changes",
              items: store.specialHours.map(special => ({
                key: special.date,
                value: special.hours || "Closed"
              }))
            }
          ]
        ]
      };
      
      agent.add(new Payload(agent.UNSPECIFIED, specialHoursResponse, { sendAsMessage: true, rawPayload: true }));
    }
    
    agent.add(new Payload(agent.UNSPECIFIED, storeHoursResponse, { sendAsMessage: true, rawPayload: true }));
    
    // Add contact information
    agent.add(`For more information, you can call the store at ${store.phone} or email ${store.email}.`);
    
    // Add action buttons
    const actionButtons = {
      richContent: [
        [
          {
            type: "button",
            icon: {
              type: "directions"
            },
            text: "Get directions",
            link: `https://maps.google.com/?q=${encodeURIComponent(store.address)}`
          },
          {
            type: "chips",
            options: [
              { text: "Store services" },
              { text: "Other locations" },
              { text: "Online shopping" }
            ]
          }
        ]
      ]
    };
    
    agent.add(new Payload(agent.UNSPECIFIED, actionButtons, { sendAsMessage: true, rawPayload: true }));
    
  } catch (error) {
    console.error('Error fetching store hours:', error);
    agent.add('Sorry, I encountered an error while retrieving store hours. Please try again later or visit our website for the most up-to-date information.');
  }
};

module.exports = {
  handleStoreLocation,
  handleStoreHours
};