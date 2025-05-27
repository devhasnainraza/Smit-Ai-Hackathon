// Mock database service for e-commerce chatbot
// In a real implementation, this would connect to your actual database

/**
 * Search for products based on criteria
 * @param {Object} criteria - Search criteria
 * @returns {Promise<Array>} - Array of matching products
 */
const searchProducts = async (criteria) => {
  // In a real implementation, this would query your product database
  // For demonstration, returning mock data
  
  console.log('Searching products with criteria:', criteria);
  
  // Mock products matching the search criteria
  const mockProducts = [
    {
      id: 'prod-001',
      name: 'Premium Smartphone',
      price: 799.99,
      description: 'High-end smartphone with advanced features',
      imageUrl: 'https://example.com/images/smartphone.jpg',
      inStock: true,
      category: 'smartphone'
    },
    {
      id: 'prod-002',
      name: 'Ultra Slim Laptop',
      price: 1299.99,
      description: 'Lightweight and powerful laptop',
      imageUrl: 'https://example.com/images/laptop.jpg',
      inStock: true,
      category: 'laptop'
    },
    {
      id: 'prod-003',
      name: 'Wireless Headphones',
      price: 199.99,
      description: 'Noise-cancelling wireless headphones',
      imageUrl: 'https://example.com/images/headphones.jpg',
      inStock: true,
      category: 'headphones'
    }
  ];
  
  // Filter based on product type if provided
  let filteredProducts = mockProducts;
  if (criteria.productType) {
    filteredProducts = mockProducts.filter(product => 
      product.category.toLowerCase() === criteria.productType.toLowerCase()
    );
  }
  
  // Simulate a delay to mimic database query
  await new Promise(resolve => setTimeout(resolve, 300));
  
  return filteredProducts;
};

/**
 * Get detailed information about a product
 * @param {string} productIdentifier - Product name or ID
 * @returns {Promise<Object>} - Product details
 */
const getProductDetails = async (productIdentifier) => {
  console.log('Getting product details for:', productIdentifier);
  
  // Simulate a delay to mimic database query
  await new Promise(resolve => setTimeout(resolve, 300));
  
  // Mock product details
  return {
    id: 'prod-001',
    name: 'Premium Smartphone',
    price: 799.99,
    description: 'Experience the future with our Premium Smartphone. Featuring a stunning 6.5" OLED display, 5G capability, and an advanced camera system that captures professional-quality photos and videos in any lighting conditions.',
    imageUrl: 'https://example.com/images/smartphone.jpg',
    inStock: true,
    category: 'smartphone',
    specifications: {
      display: '6.5" OLED',
      processor: 'OctoCore 2.4GHz',
      ram: '8GB',
      storage: '256GB',
      camera: '48MP + 12MP + 8MP',
      battery: '4500mAh',
      operatingSystem: 'Android 13'
    },
    colors: ['Black', 'Silver', 'Blue'],
    ratings: {
      average: 4.7,
      count: 358
    }
  };
};

/**
 * Get product by name
 * @param {string} productName - Product name
 * @returns {Promise<Object>} - Product information
 */
const getProductByName = async (productName) => {
  console.log('Getting product by name:', productName);
  
  // Simulate a delay to mimic database query
  await new Promise(resolve => setTimeout(resolve, 200));
  
  // Mock product
  return {
    id: 'prod-001',
    name: 'Premium Smartphone',
    price: 799.99,
    description: 'High-end smartphone with advanced features',
    imageUrl: 'https://example.com/images/smartphone.jpg',
    inStock: true,
    category: 'smartphone',
    defaultColor: 'Black',
    defaultSize: 'Standard'
  };
};

/**
 * Check if a product is available with specified options
 * @param {string} productId - Product ID
 * @param {Object} options - Options like color, size
 * @returns {Promise<boolean>} - Whether the product is available
 */
const checkProductAvailability = async (productId, options) => {
  console.log('Checking availability for product:', productId, 'with options:', options);
  
  // Simulate a delay to mimic database query
  await new Promise(resolve => setTimeout(resolve, 200));
  
  // Mock availability check (always true for demo)
  return true;
};

/**
 * Get order details by order number
 * @param {string} orderNumber - Order number
 * @returns {Promise<Object>} - Order details
 */
const getOrderByNumber = async (orderNumber) => {
  console.log('Getting order by number:', orderNumber);
  
  // Simulate a delay to mimic database query
  await new Promise(resolve => setTimeout(resolve, 300));
  
  // Mock order details
  return {
    orderNumber: orderNumber,
    status: 'Shipped',
    orderDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
    shippedDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    estimatedDeliveryDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
    shippingMethod: 'Express Shipping',
    trackingNumber: 'TRK123456789',
    total: 1299.97,
    items: [
      {
        id: 'prod-001',
        name: 'Premium Smartphone',
        price: 799.99,
        quantity: 1,
        imageUrl: 'https://example.com/images/smartphone.jpg'
      },
      {
        id: 'prod-003',
        name: 'Wireless Headphones',
        price: 199.99,
        quantity: 2,
        imageUrl: 'https://example.com/images/headphones.jpg'
      }
    ]
  };
};

/**
 * Get recent orders for a user
 * @param {string} userId - User ID
 * @returns {Promise<Array>} - Array of recent orders
 */
const getRecentOrders = async (userId) => {
  console.log('Getting recent orders for user:', userId);
  
  // Simulate a delay to mimic database query
  await new Promise(resolve => setTimeout(resolve, 300));
  
  // Mock recent orders
  return [
    {
      orderNumber: '10001',
      status: 'Delivered',
      orderDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      deliveredDate: new Date(Date.now() - 23 * 24 * 60 * 60 * 1000), // 23 days ago
      total: 799.99
    },
    {
      orderNumber: '10002',
      status: 'Shipped',
      orderDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      shippedDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      estimatedDeliveryDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
      total: 1299.97
    },
    {
      orderNumber: '10003',
      status: 'Processing',
      orderDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      total: 499.95
    }
  ];
};

/**
 * Cancel an order
 * @param {string} orderNumber - Order number
 * @returns {Promise<Object>} - Cancellation result
 */
const cancelOrder = async (orderNumber) => {
  console.log('Cancelling order:', orderNumber);
  
  // Simulate a delay to mimic database operation
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Mock cancellation response
  return {
    success: true,
    refundInitiated: true,
    refundAmount: 799.99,
    message: 'Order successfully cancelled. Refund has been initiated.'
  };
};

/**
 * Get shipping information for a location
 * @param {string} location - Location name
 * @returns {Promise<Object>} - Shipping information
 */
const getShippingInfoForLocation = async (location) => {
  console.log('Getting shipping info for location:', location);
  
  // Simulate a delay to mimic database query
  await new Promise(resolve => setTimeout(resolve, 200));
  
  // Mock shipping information
  return {
    generalInfo: 'We offer multiple shipping options to meet your needs.',
    standardShipping: {
      price: 0, // Free
      time: '3-5 business days',
      details: 'Standard shipping is free for all orders over $50. Orders placed before 2 PM ET typically ship the same day.'
    },
    expressShipping: {
      price: 15.99,
      time: '1-2 business days',
      details: 'Express shipping is available for quick delivery. Order by 11 AM ET for same-day processing.'
    },
    freeShippingThreshold: 50,
    restrictions: [
      'Some oversized items may incur additional shipping charges.',
      'Express shipping is not available for all locations.',
      'PO Boxes may experience delayed delivery times.'
    ]
  };
};

/**
 * Get default shipping information
 * @returns {Promise<Object>} - Default shipping information
 */
const getDefaultShippingInfo = async () => {
  // Simulate a delay to mimic database query
  await new Promise(resolve => setTimeout(resolve, 200));
  
  // Mock default shipping information
  return {
    generalInfo: 'We offer multiple shipping options to meet your needs.',
    standardShipping: {
      price: 4.99,
      time: '3-5 business days',
      details: 'Standard shipping is free for all orders over $50. Orders placed before 2 PM ET typically ship the same day.'
    },
    expressShipping: {
      price: 15.99,
      time: '1-2 business days',
      details: 'Express shipping is available for quick delivery. Order by 11 AM ET for same-day processing.'
    },
    freeShippingThreshold: 50,
    restrictions: [
      'Some oversized items may incur additional shipping charges.',
      'Express shipping is not available for all locations.',
      'PO Boxes may experience delayed delivery times.'
    ]
  };
};

/**
 * Get recommended products based on criteria
 * @param {Object} criteria - Recommendation criteria
 * @returns {Promise<Array>} - Array of recommended products
 */
const getRecommendedProducts = async (criteria) => {
  console.log('Getting recommended products with criteria:', criteria);
  
  // Simulate a delay to mimic database query
  await new Promise(resolve => setTimeout(resolve, 300));
  
  // Mock recommended products
  return [
    {
      id: 'prod-001',
      name: 'Premium Smartphone',
      price: 799.99,
      description: 'High-end smartphone with advanced features',
      imageUrl: 'https://example.com/images/smartphone.jpg',
      inStock: true,
      category: 'smartphone'
    },
    {
      id: 'prod-004',
      name: 'Smart Watch',
      price: 249.99,
      description: 'Advanced smartwatch with health monitoring',
      imageUrl: 'https://example.com/images/smartwatch.jpg',
      inStock: true,
      category: 'smartwatch'
    },
    {
      id: 'prod-005',
      name: 'Bluetooth Speaker',
      price: 89.99,
      description: 'Portable speaker with premium sound',
      imageUrl: 'https://example.com/images/speaker.jpg',
      inStock: true,
      category: 'speakers'
    }
  ];
};

/**
 * Get recommended products for a specific occasion
 * @param {string} occasion - Occasion name
 * @returns {Promise<Array>} - Array of recommended products
 */
const getRecommendedProductsForOccasion = async (occasion) => {
  console.log('Getting recommended products for occasion:', occasion);
  
  // Simulate a delay to mimic database query
  await new Promise(resolve => setTimeout(resolve, 300));
  
  // Mock recommended products for occasion
  return [
    {
      id: 'prod-006',
      name: 'Gift Set',
      price: 99.99,
      description: 'Perfect gift set for special occasions',
      imageUrl: 'https://example.com/images/giftset.jpg',
      inStock: true,
      category: 'gifts'
    },
    {
      id: 'prod-007',
      name: 'Premium Headphones',
      price: 199.99,
      description: 'Noise-cancelling headphones for music lovers',
      imageUrl: 'https://example.com/images/premium-headphones.jpg',
      inStock: true,
      category: 'headphones'
    },
    {
      id: 'prod-008',
      name: 'Smart Home Bundle',
      price: 299.99,
      description: 'Connected home devices for modern living',
      imageUrl: 'https://example.com/images/smarthome.jpg',
      inStock: true,
      category: 'smart home'
    }
  ];
};

/**
 * Get personalized recommendations for a user
 * @param {string} userId - User ID
 * @returns {Promise<Array>} - Array of personalized recommendations
 */
const getPersonalizedRecommendations = async (userId) => {
  console.log('Getting personalized recommendations for user:', userId);
  
  // Simulate a delay to mimic database query
  await new Promise(resolve => setTimeout(resolve, 300));
  
  // Mock personalized recommendations
  return [
    {
      id: 'prod-009',
      name: 'Wireless Earbuds',
      price: 129.99,
      description: 'True wireless earbuds with long battery life',
      imageUrl: 'https://example.com/images/earbuds.jpg',
      inStock: true,
      category: 'headphones'
    },
    {
      id: 'prod-010',
      name: 'Tablet Pro',
      price: 499.99,
      description: 'Professional tablet for work and entertainment',
      imageUrl: 'https://example.com/images/tablet.jpg',
      inStock: true,
      category: 'tablet'
    },
    {
      id: 'prod-011',
      name: 'Smart Display',
      price: 149.99,
      description: 'Voice-controlled smart display',
      imageUrl: 'https://example.com/images/smartdisplay.jpg',
      inStock: true,
      category: 'smart home'
    }
  ];
};

/**
 * Get trending products
 * @returns {Promise<Array>} - Array of trending products
 */
const getTrendingProducts = async () => {
  // Simulate a delay to mimic database query
  await new Promise(resolve => setTimeout(resolve, 300));
  
  // Mock trending products
  return [
    {
      id: 'prod-012',
      name: 'Gaming Console',
      price: 499.99,
      description: 'Next-generation gaming console',
      imageUrl: 'https://example.com/images/console.jpg',
      inStock: true,
      category: 'gaming'
    },
    {
      id: 'prod-013',
      name: 'Smart Camera',
      price: 349.99,
      description: 'AI-powered security camera',
      imageUrl: 'https://example.com/images/camera.jpg',
      inStock: true,
      category: 'camera'
    },
    {
      id: 'prod-014',
      name: 'Fitness Tracker',
      price: 99.99,
      description: 'Advanced fitness and health tracker',
      imageUrl: 'https://example.com/images/tracker.jpg',
      inStock: true,
      category: 'wearables'
    }
  ];
};

/**
 * Get similar products based on a product
 * @param {string} productIdentifier - Product name or ID
 * @returns {Promise<Array>} - Array of similar products
 */
const getSimilarProducts = async (productIdentifier) => {
  console.log('Getting similar products for:', productIdentifier);
  
  // Simulate a delay to mimic database query
  await new Promise(resolve => setTimeout(resolve, 300));
  
  // Mock similar products
  return [
    {
      id: 'prod-015',
      name: 'Premium Smartphone Plus',
      price: 899.99,
      description: 'Advanced smartphone with premium features',
      imageUrl: 'https://example.com/images/smartphone-plus.jpg',
      inStock: true,
      category: 'smartphone'
    },
    {
      id: 'prod-016',
      name: 'Budget Smartphone',
      price: 399.99,
      description: 'Affordable smartphone with great features',
      imageUrl: 'https://example.com/images/budget-smartphone.jpg',
      inStock: true,
      category: 'smartphone'
    },
    {
      id: 'prod-017',
      name: 'Smartphone Accessory Kit',
      price: 49.99,
      description: 'Essential accessories for your smartphone',
      imageUrl: 'https://example.com/images/accessories.jpg',
      inStock: true,
      category: 'accessories'
    }
  ];
};

/**
 * Get current promotions
 * @returns {Promise<Array>} - Array of current promotions
 */
const getCurrentPromotions = async () => {
  // Simulate a delay to mimic database query
  await new Promise(resolve => setTimeout(resolve, 300));
  
  // Mock current promotions
  return [
    {
      id: 'promo-001',
      title: 'Summer Sale',
      description: 'Save up to 40% on selected items',
      promoCode: 'SUMMER40',
      expiryDate: '2025-08-31',
      imageUrl: 'https://example.com/images/summer-sale.jpg',
      url: 'https://example.com/promotions/summer-sale'
    },
    {
      id: 'promo-002',
      title: 'Free Shipping',
      description: 'Free shipping on all orders over $50',
      promoCode: 'FREESHIP50',
      expiryDate: '2025-12-31',
      imageUrl: 'https://example.com/images/free-shipping.jpg',
      url: 'https://example.com/promotions/free-shipping'
    },
    {
      id: 'promo-003',
      title: 'Bundle Deal',
      description: 'Buy a smartphone and get 20% off accessories',
      promoCode: 'BUNDLE20',
      expiryDate: '2025-09-15',
      imageUrl: 'https://example.com/images/bundle-deal.jpg',
      url: 'https://example.com/promotions/bundle-deal'
    }
  ];
};

/**
 * Get promotions for a specific product type
 * @param {string} productType - Product type
 * @returns {Promise<Array>} - Array of promotions for the product type
 */
const getPromotionsForProductType = async (productType) => {
  console.log('Getting promotions for product type:', productType);
  
  // Simulate a delay to mimic database query
  await new Promise(resolve => setTimeout(resolve, 300));
  
  // Mock promotions for product type
  return [
    {
      id: 'promo-004',
      title: `${productType} Special Offer`,
      description: `Save 25% on selected ${productType}s`,
      promoCode: `${productType.toUpperCase().substring(0, 5)}25`,
      expiryDate: '2025-10-31',
      imageUrl: `https://example.com/images/${productType}-promo.jpg`,
      url: `https://example.com/promotions/${productType}-special`
    }
  ];
};

/**
 * Validate a coupon code
 * @param {string} couponCode - Coupon code to validate
 * @returns {Promise<Object>} - Validation result
 */
const validateCouponCode = async (couponCode) => {
  console.log('Validating coupon code:', couponCode);
  
  // Simulate a delay to mimic database query
  await new Promise(resolve => setTimeout(resolve, 300));
  
  // Mock coupon validation
  const validCoupons = ['SUMMER40', 'FREESHIP50', 'BUNDLE20'];
  
  if (validCoupons.includes(couponCode)) {
    return {
      valid: true,
      description: 'This coupon is valid and can be applied to your order.',
      discountInfo: couponCode === 'SUMMER40' ? '40% off selected items' : 
                    couponCode === 'FREESHIP50' ? 'Free shipping on orders over $50' : 
                    '20% off accessories when buying a smartphone',
      minimumOrderValue: couponCode === 'FREESHIP50' ? 50 : 0,
      expiryDate: '2025-12-31',
      restrictions: couponCode === 'BUNDLE20' ? 'Must include a smartphone in your cart' : null
    };
  } else {
    return {
      valid: false,
      reason: 'This coupon code is invalid or has expired.',
      suggestedCoupons: [
        {
          code: 'SUMMER40',
          description: 'Save up to 40% on selected items',
          discountInfo: '40% off selected items',
          expiryDate: '2025-08-31'
        },
        {
          code: 'FREESHIP50',
          description: 'Free shipping on all orders over $50',
          discountInfo: 'Free shipping',
          expiryDate: '2025-12-31'
        }
      ]
    };
  }
};

/**
 * Get all store locations
 * @returns {Promise<Array>} - Array of store locations
 */
const getAllStores = async () => {
  // Simulate a delay to mimic database query
  await new Promise(resolve => setTimeout(resolve, 300));
  
  // Mock store locations
  return [
    {
      id: 'store-001',
      name: 'Downtown Flagship Store',
      address: '123 Main St, New York, NY 10001',
      phone: '(212) 555-1234',
      email: 'downtown@example.com',
      hours: 'Mon-Sat: 10am-8pm, Sun: 11am-6pm',
      imageUrl: 'https://example.com/images/downtown-store.jpg'
    },
    {
      id: 'store-002',
      name: 'Westside Mall Location',
      address: '456 West Ave, Los Angeles, CA 90001',
      phone: '(310) 555-5678',
      email: 'westside@example.com',
      hours: 'Mon-Sat: 9am-9pm, Sun: 10am-7pm',
      imageUrl: 'https://example.com/images/westside-store.jpg'
    },
    {
      id: 'store-003',
      name: 'Eastside Shopping Center',
      address: '789 East Blvd, Chicago, IL 60007',
      phone: '(312) 555-9012',
      email: 'eastside@example.com',
      hours: 'Mon-Sat: 10am-7pm, Sun: 12pm-5pm',
      imageUrl: 'https://example.com/images/eastside-store.jpg'
    }
  ];
};

/**
 * Get stores by location
 * @param {string} location - Location name
 * @returns {Promise<Array>} - Array of stores in the location
 */
const getStoresByLocation = async (location) => {
  console.log('Getting stores in location:', location);
  
  // Simulate a delay to mimic database query
  await new Promise(resolve => setTimeout(resolve, 300));
  
  // Mock stores for the location
  return [
    {
      id: 'store-004',
      name: `${location} Store`,
      address: `123 ${location} Ave, ${location}, US`,
      phone: '(555) 123-4567',
      email: `${location.toLowerCase()}@example.com`,
      hours: 'Mon-Sat: 10am-8pm, Sun: 11am-6pm',
      imageUrl: `https://example.com/images/${location.toLowerCase()}-store.jpg`
    }
  ];
};

/**
 * Get nearest stores
 * @returns {Promise<Array>} - Array of nearest stores
 */
const getNearestStores = async () => {
  // Simulate a delay to mimic database query
  await new Promise(resolve => setTimeout(resolve, 300));
  
  // Mock nearest stores
  return [
    {
      id: 'store-005',
      name: 'Nearby Shopping Center',
      address: '321 Local Rd, Springfield, US',
      phone: '(555) 987-6543',
      email: 'nearby@example.com',
      hours: 'Mon-Sat: 10am-8pm, Sun: 11am-6pm',
      imageUrl: 'https://example.com/images/nearby-store.jpg',
      distance: '2.3 miles'
    }
  ];
};

/**
 * Get a specific store by ID
 * @param {string} storeId - Store ID
 * @returns {Promise<Object>} - Store details
 */
const getStoreById = async (storeId) => {
  console.log('Getting store by ID:', storeId);
  
  // Simulate a delay to mimic database query
  await new Promise(resolve => setTimeout(resolve, 200));
  
  // Mock store details
  return {
    id: storeId,
    name: 'Downtown Flagship Store',
    address: '123 Main St, New York, NY 10001',
    phone: '(212) 555-1234',
    email: 'downtown@example.com',
    hours: {
      monday: '10am-8pm',
      tuesday: '10am-8pm',
      wednesday: '10am-8pm',
      thursday: '10am-8pm',
      friday: '10am-9pm',
      saturday: '10am-9pm',
      sunday: '11am-6pm'
    },
    specialHours: [
      {
        date: 'Dec 24, 2025',
        hours: '10am-5pm'
      },
      {
        date: 'Dec 25, 2025',
        hours: 'Closed'
      }
    ],
    imageUrl: 'https://example.com/images/downtown-store.jpg'
  };
};

/**
 * Get default store
 * @returns {Promise<Object>} - Default store details
 */
const getDefaultStore = async () => {
  // Simulate a delay to mimic database query
  await new Promise(resolve => setTimeout(resolve, 200));
  
  // Mock default store
  return {
    id: 'store-001',
    name: 'Main Headquarters Store',
    address: '123 Main St, New York, NY 10001',
    phone: '(212) 555-1234',
    email: 'main@example.com',
    hours: {
      monday: '9am-8pm',
      tuesday: '9am-8pm',
      wednesday: '9am-8pm',
      thursday: '9am-8pm',
      friday: '9am-9pm',
      saturday: '10am-9pm',
      sunday: '11am-6pm'
    },
    imageUrl: 'https://example.com/images/main-store.jpg'
  };
};

module.exports = {
  searchProducts,
  getProductDetails,
  getProductByName,
  checkProductAvailability,
  getOrderByNumber,
  getRecentOrders,
  cancelOrder,
  getShippingInfoForLocation,
  getDefaultShippingInfo,
  getRecommendedProducts,
  getRecommendedProductsForOccasion,
  getPersonalizedRecommendations,
  getTrendingProducts,
  getSimilarProducts,
  getCurrentPromotions,
  getPromotionsForProductType,
  validateCouponCode,
  getAllStores,
  getStoresByLocation,
  getNearestStores,
  getStoreById,
  getDefaultStore
};