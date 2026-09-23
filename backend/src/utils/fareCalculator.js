/**
 * Calculate the estimated fare for a transport mode.
 * @param {string} transportType - Type of transport (Bus, Auto, Cab, etc.)
 * @param {number} distance - Distance in kilometers
 * @param {number} [customBaseFare] - Optional base fare override
 * @param {number} [customFarePerKm] - Optional fare per km override
 * @returns {number} Estimated fare in currency units, rounded to 2 decimal places
 */
function calculateFare(transportType, distance, customBaseFare, customFarePerKm) {
  let baseFare = 0;
  let farePerKm = 0;

  // Use custom parameters if provided, otherwise default to rules
  if (customBaseFare !== undefined && customFarePerKm !== undefined) {
    baseFare = customBaseFare;
    farePerKm = customFarePerKm;
  } else {
    switch (transportType.toLowerCase()) {
      case 'bus':
        baseFare = 10;
        farePerKm = 2;
        break;
      case 'auto':
        baseFare = 30;
        farePerKm = 10;
        break;
      case 'cab':
        baseFare = 50;
        farePerKm = 15;
        break;
      default:
        baseFare = 20;
        farePerKm = 5;
    }
  }

  const fare = baseFare + distance * farePerKm;
  return parseFloat(fare.toFixed(2));
}

/**
 * Calculate the estimated travel time in minutes.
 * @param {number} distance - Distance in kilometers
 * @param {number} averageSpeed - Average speed in km/h
 * @returns {number} Estimated travel time in minutes, rounded to nearest integer (min 1 min)
 */
function calculateTime(distance, averageSpeed) {
  const speed = averageSpeed || 30; // default 30 km/h if not provided
  const timeHours = distance / speed;
  const timeMinutes = timeHours * 60;
  return Math.max(1, Math.round(timeMinutes));
}

module.exports = {
  calculateFare,
  calculateTime,
};
