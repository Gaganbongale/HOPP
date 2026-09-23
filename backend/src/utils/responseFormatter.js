/**
 * Formats a successful API response.
 * @param {any} data - Data to send in response
 * @param {string} [message="Success"] - Optional success message
 * @returns {object} Formatted success response
 */
function sendSuccess(data, message = 'Success') {
  return {
    success: true,
    data,
    message,
  };
}

/**
 * Formats a failed API response.
 * @param {string} [message="Error"] - Error message
 * @param {any} [error={}] - Optional error details
 * @returns {object} Formatted error response
 */
function sendFailure(message = 'Error', error = {}) {
  return {
    success: false,
    message,
    error,
  };
}

module.exports = {
  sendSuccess,
  sendFailure,
};
