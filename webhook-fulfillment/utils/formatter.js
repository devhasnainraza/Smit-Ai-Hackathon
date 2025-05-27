// Utility functions for formatting data

/**
 * Format a date in a user-friendly way
 * @param {Date} date - Date to format
 * @returns {string} - Formatted date string
 */
const formatDate = (date) => {
  if (!date) return 'N/A';
  
  // Options for formatting
  const options = { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  };
  
  return new Date(date).toLocaleDateString('en-US', options);
};

/**
 * Format a price with currency symbol
 * @param {number} price - Price to format
 * @param {string} currencyCode - Currency code (default: USD)
 * @returns {string} - Formatted price string
 */
const formatPrice = (price, currencyCode = 'USD') => {
  if (typeof price !== 'number') return 'N/A';
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currencyCode
  }).format(price);
};

/**
 * Capitalize the first letter of a string
 * @param {string} string - String to capitalize
 * @returns {string} - Capitalized string
 */
const capitalizeFirstLetter = (string) => {
  if (!string) return '';
  return string.charAt(0).toUpperCase() + string.slice(1);
};

/**
 * Format a phone number in a standardized way
 * @param {string} phoneNumber - Phone number to format
 * @returns {string} - Formatted phone number
 */
const formatPhoneNumber = (phoneNumber) => {
  if (!phoneNumber) return '';
  
  // Remove non-numeric characters
  const cleaned = phoneNumber.replace(/\D/g, '');
  
  // Format as (XXX) XXX-XXXX for US numbers
  if (cleaned.length === 10) {
    return `(${cleaned.substring(0, 3)}) ${cleaned.substring(3, 6)}-${cleaned.substring(6, 10)}`;
  }
  
  // Return as is if not a standard US number
  return phoneNumber;
};

/**
 * Truncate a string to a specified length
 * @param {string} string - String to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} - Truncated string
 */
const truncateString = (string, maxLength = 100) => {
  if (!string) return '';
  if (string.length <= maxLength) return string;
  
  return string.substring(0, maxLength) + '...';
};

/**
 * Format a list of items into a readable string
 * @param {Array} items - Array of items
 * @param {string} joinWord - Word to join the last item (default: 'and')
 * @returns {string} - Formatted list string
 */
const formatList = (items, joinWord = 'and') => {
  if (!items || !Array.isArray(items)) return '';
  if (items.length === 0) return '';
  if (items.length === 1) return items[0];
  
  if (items.length === 2) {
    return `${items[0]} ${joinWord} ${items[1]}`;
  }
  
  const lastItem = items[items.length - 1];
  const otherItems = items.slice(0, items.length - 1);
  
  return `${otherItems.join(', ')}, ${joinWord} ${lastItem}`;
};

module.exports = {
  formatDate,
  formatPrice,
  capitalizeFirstLetter,
  formatPhoneNumber,
  truncateString,
  formatList
};