require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../database/connection');
const routeService = require('../services/route.service');

async function run() {
  await connectDB();

  // Clear cache first to test live computation
  const RouteCache = require('../models/RouteCache');
  await RouteCache.deleteMany({});
  console.log('Cleared Route Cache for testing.');

  const testPairs = [
    { from: 'Hubballi Railway Station', to: 'Dharwad BRTS Terminal' },
    { from: 'KLE Tech', to: 'SDM Medical College' },
    { from: 'Airport', to: 'Dharwad New Bus Stand' }
  ];

  for (const pair of testPairs) {
    console.log(`\n======================================================`);
    console.log(`PLANNING ROUTE: "${pair.from}" -> "${pair.to}"`);
    console.log(`======================================================`);

    try {
      const plan = await routeService.planRoutes(pair.from, pair.to, 'balanced');
      console.log(`Source: ${plan.source_label} | Destination: ${plan.destination_label}`);
      console.log(`Recommended Option Index: ${plan.recommended_index}`);

      plan.options.forEach((opt, idx) => {
        console.log(`\nOption ${idx + 1}: ${opt.label} [Tag: ${opt.tag}]`);
        console.log(`  - Fare: ₹${opt.fare_inr}`);
        console.log(`  - Duration: ${opt.duration_range || (opt.duration_min + ' mins')}`);
        console.log(`  - Transfers: ${opt.transfer_label}`);
        console.log(`  - Recommended For: ${opt.recommended_for}`);
        console.log(`  - Legs:`);
        
        opt.legs.forEach((leg, legIdx) => {
          console.log(`    Leg ${legIdx + 1}: [Type: ${leg.type}] ${leg.description} (${leg.duration_min} mins, ${leg.distance_meters} meters, stops: ${leg.stops_count})`);
          if (leg.intermediate_stops && leg.intermediate_stops.length > 0) {
            console.log(`      -> Intermediate Stops: ${leg.intermediate_stops.join(', ')}`);
          }
        });
      });
    } catch (err) {
      console.error(`Error planning route:`, err);
    }
  }

  await mongoose.disconnect();
}

run().catch(console.error);
