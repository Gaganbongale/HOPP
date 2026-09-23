require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../database/connection');
const TransportStop = require('../models/TransportStop');
const Landmark = require('../models/Landmark');
const RouteSegment = require('../models/RouteSegment');
const TransitRoute = require('../models/TransitRoute');

async function resolveStopByNameOrAlias(name) {
  const cleanName = name.trim();
  let stop = await TransportStop.findOne({
    active: true,
    $or: [
      { name: { $regex: new RegExp('^' + cleanName + '$', 'i') } },
      { aliases: { $regex: new RegExp('^' + cleanName + '$', 'i') } }
    ]
  });

  if (!stop) {
    stop = await TransportStop.findOne({
      active: true,
      $or: [
        { name: { $regex: new RegExp(cleanName, 'i') } },
        { aliases: { $regex: new RegExp(cleanName, 'i') } }
      ]
    });
  }

  if (!stop) {
    const landmark = await Landmark.findOne({
      active: true,
      $or: [
        { name: { $regex: new RegExp('^' + cleanName + '$', 'i') } },
        { aliases: { $regex: new RegExp('^' + cleanName + '$', 'i') } }
      ]
    }).populate('nearbyStops');

    if (landmark && landmark.nearbyStops && landmark.nearbyStops.length > 0) {
      stop = landmark.nearbyStops.find(s => s.active);
    } else if (landmark) {
      stop = await TransportStop.findOne({
        active: true,
        location: {
          $near: {
            $geometry: { type: 'Point', coordinates: landmark.location.coordinates },
            $maxDistance: 5000
          }
        }
      });
    }
  }

  return stop;
}

function findShortestPath(startStopId, endStopId, segments, weightFn) {
  const adj = {};
  for (const seg of segments) {
    const from = seg.fromStop.toString();
    const to = seg.toStop.toString();
    if (!adj[from]) adj[from] = [];
    adj[from].push({ segment: seg, to });
  }

  const distances = {};
  const previous = {};
  const visited = new Set();
  const queue = [];

  distances[startStopId] = 0;
  queue.push({ id: startStopId, dist: 0 });

  while (queue.length > 0) {
    queue.sort((a, b) => a.dist - b.dist);
    const curr = queue.shift();
    const currNode = curr.id;

    if (visited.has(currNode)) continue;
    visited.add(currNode);

    if (currNode === endStopId) break;

    const neighbors = adj[currNode] || [];
    for (const edge of neighbors) {
      if (visited.has(edge.to)) continue;

      const edgeWeight = weightFn(edge.segment);
      const newDist = distances[currNode] + edgeWeight;

      if (distances[edge.to] === undefined || newDist < distances[edge.to]) {
        distances[edge.to] = newDist;
        previous[edge.to] = { from: currNode, segment: edge.segment };
        queue.push({ id: edge.to, dist: newDist });
      }
    }
  }

  if (distances[endStopId] === undefined) {
    return null;
  }

  const pathSegments = [];
  let curr = endStopId;
  while (curr !== startStopId) {
    const edge = previous[curr];
    if (!edge) break;
    pathSegments.unshift(edge.segment);
    curr = edge.from;
  }

  return pathSegments;
}

async function run() {
  await connectDB();

  const stops = await TransportStop.find({ active: true });
  const routes = await TransitRoute.find({ active: true });
  const segments = await RouteSegment.find({ active: true });

  const stopsMap = new Map(stops.map(s => [s._id.toString(), s]));
  const routesMap = new Map(routes.map(r => [r._id.toString(), r]));

  const testPairs = [
    { from: 'Hubballi Railway Station', to: 'Dharwad BRTS Terminal' },
    { from: 'KLE Tech', to: 'SDM Medical College' },
    { from: 'Airport', to: 'Dharwad New Bus Stand' }
  ];

  for (const pair of testPairs) {
    console.log(`\nTesting path: "${pair.from}" -> "${pair.to}"`);
    const sourceStop = await resolveStopByNameOrAlias(pair.from);
    const destStop = await resolveStopByNameOrAlias(pair.to);

    if (!sourceStop) {
      console.error(`Could not resolve source: ${pair.from}`);
      continue;
    }
    if (!destStop) {
      console.error(`Could not resolve destination: ${pair.to}`);
      continue;
    }

    console.log(`Resolved stops: "${sourceStop.name}" (${sourceStop.code}) -> "${destStop.name}" (${destStop.code})`);

    const path = findShortestPath(sourceStop._id.toString(), destStop._id.toString(), segments, (s) => s.durationMinutes);
    if (!path) {
      console.error(`NO PATH FOUND!`);
    } else {
      console.log(`Path found with ${path.length} segments!`);
      let totalDuration = 0;
      let totalDistance = 0;
      let totalFare = 0;
      for (const seg of path) {
        const route = seg.route ? routesMap.get(seg.route.toString()) : null;
        const fromStop = stopsMap.get(seg.fromStop.toString());
        const toStop = stopsMap.get(seg.toStop.toString());
        console.log(` - Ride ${route?.routeNumber || seg.mode} from ${fromStop?.name} to ${toStop?.name} (${seg.durationMinutes} min, ${seg.distanceKm} km, ₹${seg.fare})`);
        totalDuration += seg.durationMinutes;
        totalDistance += seg.distanceKm;
        totalFare += seg.fare;
      }
      console.log(`Summary: Duration = ${totalDuration} min, Distance = ${totalDistance.toFixed(2)} km, Fare = ₹${totalFare}`);
    }
  }

  await mongoose.disconnect();
}

run().catch(console.error);
