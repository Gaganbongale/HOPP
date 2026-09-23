const { calculateDistance } = require('../../src/utils/distanceCalculator');
const { calculateFare, calculateTime } = require('../../src/utils/fareCalculator');

describe('Distance Calculator Unit Tests', () => {
  test('Should return 0 for identical coordinates', () => {
    const lat = 15.3524;
    const lon = 75.1478;
    const distance = calculateDistance(lat, lon, lat, lon);
    expect(distance).toBe(0);
  });

  test('Should calculate correct distance between Hubli Station and BVB College (~3.42km)', () => {
    // Hubli Railway Station (15.3524, 75.1478)
    // BVB College (15.3715, 75.1228)
    const dist = calculateDistance(15.3524, 75.1478, 15.3715, 75.1228);
    expect(dist).toBe(3.42);
  });

  test('Should handle null or missing values gracefully', () => {
    expect(calculateDistance(null, 75.14, 15.35, 75.14)).toBe(0);
    expect(calculateDistance(15.35, undefined, 15.35, 75.14)).toBe(0);
  });
});

describe('Fare and Time Calculator Unit Tests', () => {
  const distance = 10; // 10 km

  test('Should calculate Bus fare using formula 10 + (distance * 2)', () => {
    const fare = calculateFare('Bus', distance);
    expect(fare).toBe(10 + 10 * 2); // 30
  });

  test('Should calculate Auto fare using formula 30 + (distance * 10)', () => {
    const fare = calculateFare('Auto', distance);
    expect(fare).toBe(30 + 10 * 10); // 130
  });

  test('Should calculate Cab fare using formula 50 + (distance * 15)', () => {
    const fare = calculateFare('Cab', distance);
    expect(fare).toBe(50 + 10 * 15); // 200
  });

  test('Should calculate dynamic time correctly: (distance / speed) * 60', () => {
    // Distance = 15km, Speed = 30km/h => Time = 30 mins
    const time = calculateTime(15, 30);
    expect(time).toBe(30);
  });

  test('Should return minimum 1 minute for very short distances', () => {
    const time = calculateTime(0.01, 30);
    expect(time).toBe(1);
  });
});
