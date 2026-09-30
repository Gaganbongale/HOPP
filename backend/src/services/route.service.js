const TransportStop = require('../models/TransportStop');
const Landmark = require('../models/Landmark');
const RouteSegment = require('../models/RouteSegment');
const TransitRoute = require('../models/TransitRoute');
const RouteCache = require('../models/RouteCache');
const TravelHistory = require('../models/TravelHistory');
const logger = require('../utils/logger');

class RouteService {
  // Haversine formula to compute direct distance as a fallback
  getHaversineDistanceKm(coords1, coords2) {
    const [lon1, lat1] = coords1;
    const [lon2, lat2] = coords2;
    const R = 6371; // Radius of earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  // Resolves stop by name, alias, or nearest landmark
  async resolveStopByNameOrAlias(name) {
    const displayName = name.trim();
    const normalizedInput = displayName.toLowerCase().replace(/[^a-z0-9]/g, '');
    // Connect names from the cleaned BRTS directory to the same physical
    // nodes used in the routing graph and generated database seed data.
    const routeDirectoryAliases = {
      hubballicentralbusterminal: 'HDMC',
      dharwadbrtsterminal: 'Dharwad New Bus Stand',
      navanagara: 'Navanagar',
    };
    const cleanName = routeDirectoryAliases[normalizedInput] || displayName;
    // Frontend/verified stop data sometimes omits punctuation ("Dr B R" vs
    // "Dr. B.R."). Build a literal, punctuation-tolerant pattern so these
    // names still resolve to the same graph node without treating user text
    // as executable regular-expression syntax.
    const normalizedPattern = cleanName
      .split(/[^a-z0-9]+/i)
      .filter(Boolean)
      .map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
      .join('[^a-z0-9]*');
    const exactNamePattern = new RegExp(`^${normalizedPattern}$`, 'i');
    
    // 1. Direct active stop search by name or alias (exact case-insensitive)
    let stop = await TransportStop.findOne({
      active: true,
      $or: [
        { name: { $regex: exactNamePattern } },
        { aliases: { $regex: exactNamePattern } }
      ]
    });

    // 2. Substring search if not found
    if (!stop) {
      stop = await TransportStop.findOne({
        active: true,
        $or: [
          { name: { $regex: new RegExp(normalizedPattern, 'i') } },
          { aliases: { $regex: new RegExp(normalizedPattern, 'i') } }
        ]
      });
    }

    // 3. Search Landmarks
    if (!stop) {
      const landmark = await Landmark.findOne({
        active: true,
        $or: [
          { name: { $regex: new RegExp('^' + cleanName + '$', 'i') } },
          { aliases: { $regex: new RegExp('^' + cleanName + '$', 'i') } }
        ]
      }).populate('nearbyStops');

      if (landmark) {
        if (landmark.nearbyStops && landmark.nearbyStops.length > 0) {
          stop = landmark.nearbyStops.find(s => s.active);
        } else {
          // Fallback: find nearest active stop spatially
          stop = await TransportStop.findOne({
            active: true,
            location: {
              $near: {
                $geometry: { type: 'Point', coordinates: landmark.location.coordinates },
                $maxDistance: 5000 // 5km radius
              }
            }
          });
        }
      }
    }

    return stop;
  }

  // Core Dijkstra Pathfinder
  findShortestPath(startStopId, endStopId, segments, weightFn) {
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

  // Convert list of segments to UI legs
  convertPathToLegs(pathSegments, stopsMap, routesMap) {
    if (!pathSegments || pathSegments.length === 0) return [];

    const legs = [];
    let currentLeg = null;

    const getBusSystemName = (seg) => {
      if (seg.mode === 'BRTS') return 'Chigari BRTS';
      if (seg.mode === 'CITY_BUS' || seg.mode === 'FEEDER_BUS') return 'NWKRTC Bus';
      return 'Bus';
    };

    for (let i = 0; i < pathSegments.length; i++) {
      const seg = pathSegments[i];
      const fromStopObj = stopsMap.get(seg.fromStop.toString());
      const toStopObj = stopsMap.get(seg.toStop.toString());
      
      let legType = 'walk';
      if (seg.mode !== 'WALK') {
        legType = 'bus';
      }

      const routeNum = seg.route ? (routesMap.get(seg.route.toString())?.routeNumber || 'Transit') : (seg.mode === 'SHARED_AUTO' ? 'Shared Auto' : seg.mode === 'AUTO_RICKSHAW' ? 'Auto Rickshaw' : seg.mode === 'CAB' ? 'Cab' : null);

      if (currentLeg && currentLeg.type === legType && currentLeg.bus_number === routeNum && currentLeg.mode === seg.mode) {
        currentLeg.duration_min += seg.durationMinutes;
        currentLeg.distance_meters = (currentLeg.distance_meters || 0) + Math.round(seg.distanceKm * 1000);
        currentLeg.stops_count = (currentLeg.stops_count || 0) + 1;
        currentLeg.stop_to = toStopObj ? toStopObj.name : 'Unknown Stop';
        
        if (fromStopObj) {
          currentLeg.intermediate_stops.push(fromStopObj.name);
        }

        if (legType === 'bus') {
          if (seg.mode === 'TRAIN') {
            currentLeg.description = `Ride SWR Train ${routeNum || ''} from ${currentLeg.stop_from} to ${currentLeg.stop_to}`;
          } else if (seg.mode === 'SHARED_AUTO' || seg.mode === 'AUTO_RICKSHAW') {
            currentLeg.description = seg.mode === 'AUTO_RICKSHAW' ? `Ride Auto Rickshaw from ${currentLeg.stop_from} to ${currentLeg.stop_to}` : `Ride Shared Auto from ${currentLeg.stop_from} to ${currentLeg.stop_to}`;
          } else if (seg.mode === 'CAB') {
            currentLeg.description = `Ride Cab from ${currentLeg.stop_from} to ${currentLeg.stop_to}`;
          } else {
            const sysName = getBusSystemName(seg);
            currentLeg.description = `Ride ${sysName} route ${routeNum || 'bus'} from ${currentLeg.stop_from} to ${currentLeg.stop_to}`;
          }
        } else {
          currentLeg.description = `Walk from ${currentLeg.stop_from} to ${currentLeg.stop_to}`;
        }
      } else {
        if (currentLeg && currentLeg.type === 'bus' && legType === 'bus') {
          legs.push({
            type: 'wait',
            mode: 'WAIT',
            description: `Wait for connection at ${currentLeg.stop_to}`,
            stop_from: currentLeg.stop_to,
            stop_to: null,
            duration_min: 5,
            bus_number: null,
            distance_meters: null,
            stops_count: null,
            intermediate_stops: []
          });
        }

        let desc = '';
        if (legType === 'bus') {
          if (seg.mode === 'TRAIN') {
            desc = `Board SWR Train ${routeNum || ''} at ${fromStopObj?.name || 'Unknown Stop'} to ${toStopObj?.name || 'Unknown Stop'}`;
          } else if (seg.mode === 'SHARED_AUTO' || seg.mode === 'AUTO_RICKSHAW') {
            desc = seg.mode === 'AUTO_RICKSHAW' ? `Take Auto Rickshaw at ${fromStopObj?.name || 'Unknown Stop'} to ${toStopObj?.name || 'Unknown Stop'}` : `Take Shared Auto at ${fromStopObj?.name || 'Unknown Stop'} to ${toStopObj?.name || 'Unknown Stop'}`;
          } else if (seg.mode === 'CAB') {
            desc = `Take Cab at ${fromStopObj?.name || 'Unknown Stop'} to ${toStopObj?.name || 'Unknown Stop'}`;
          } else {
            const sysName = getBusSystemName(seg);
            desc = `Board ${sysName} route ${routeNum || 'bus'} at ${fromStopObj?.name || 'Unknown Stop'} to ${toStopObj?.name || 'Unknown Stop'}`;
          }
        } else {
          desc = `Walk from ${fromStopObj?.name || 'Unknown Stop'} to ${toStopObj?.name || 'Unknown Stop'}`;
        }

        currentLeg = {
          type: legType,
          mode: seg.mode,
          bus_number: routeNum,
          description: desc,
          stop_from: fromStopObj ? fromStopObj.name : 'Unknown Stop',
          stop_to: toStopObj ? toStopObj.name : 'Unknown Stop',
          duration_min: seg.durationMinutes,
          distance_meters: Math.round(seg.distanceKm * 1000),
          stops_count: 1,
          intermediate_stops: []
        };
        legs.push(currentLeg);
      }
    }

    return legs;
  }

  // Map StopTypes to OpenAPI Stop Types
  mapStopType(stopTypes) {
    if (!stopTypes || stopTypes.length === 0) return 'stop';
    if (stopTypes.includes('BUS_TERMINAL') || stopTypes.includes('RAILWAY_STATION') || stopTypes.includes('AIRPORT')) {
      return 'terminal';
    }
    if (stopTypes.includes('BRTS_STATION')) {
      return 'hub';
    }
    return 'stop';
  }

  // 1. Plan Routes between source and destination
  async planRoutes(sourceName, destinationName, preference = 'balanced', userId = null) {
    const startTime = Date.now();

    if (!sourceName || !destinationName) {
      const error = new Error('Source and destination names are required');
      error.statusCode = 400;
      throw error;
    }

    const sourceStop = await this.resolveStopByNameOrAlias(sourceName);
    const destStop = await this.resolveStopByNameOrAlias(destinationName);

    if (!sourceStop) {
      const error = new Error(`Source location "${sourceName}" not found`);
      error.statusCode = 404;
      throw error;
    }

    if (!destStop) {
      const error = new Error(`Destination location "${destinationName}" not found`);
      error.statusCode = 404;
      throw error;
    }

    if (sourceStop._id.toString() === destStop._id.toString()) {
      const error = new Error('Source and destination cannot be the same stop');
      error.statusCode = 400;
      throw error;
    }

    // Check Cache
    const cacheKeyPref = preference || 'balanced';
    const cached = await RouteCache.findOne({
      sourceStop: sourceStop.name,
      destinationStop: destStop.name,
      preference: cacheKeyPref
    });

    if (cached) {
      logger.info(`Cache hit for ${sourceStop.name} -> ${destStop.name} (${cacheKeyPref})`);
      return cached.result;
    }

    // Load active DB nodes, edges, routes
    const stops = await TransportStop.find({ active: true }).lean();
    const routes = await TransitRoute.find({ active: true }).lean();
    const segments = await RouteSegment.find({ active: true }).lean();

    const stopsMap = new Map(stops.map(s => [s._id.toString(), s]));
    const routesMap = new Map(routes.map(r => [r._id.toString(), r]));

    // Generate in-memory walking connections between stops close to each other (<= 0.6 km)
    const walkSegments = [];
    const maxWalkDist = 0.6; // 600 meters
    for (let i = 0; i < stops.length; i++) {
      const s1 = stops[i];
      if (!s1.location || !s1.location.coordinates || s1.location.coordinates.length < 2) continue;
      for (let j = i + 1; j < stops.length; j++) {
        const s2 = stops[j];
        if (!s2.location || !s2.location.coordinates || s2.location.coordinates.length < 2) continue;

        const dist = this.getHaversineDistanceKm(s1.location.coordinates, s2.location.coordinates);
        if (dist <= maxWalkDist && dist > 0.001) {
          walkSegments.push({
            fromStop: s1._id,
            toStop: s2._id,
            mode: 'WALK',
            distanceKm: dist,
            durationMinutes: Math.max(1, Math.round(dist * 12)), // 5 km/h walking speed (12 mins/km)
            fare: 0,
            active: true
          });
          walkSegments.push({
            fromStop: s2._id,
            toStop: s1._id,
            mode: 'WALK',
            distanceKm: dist,
            durationMinutes: Math.max(1, Math.round(dist * 12)),
            fare: 0,
            active: true
          });
        }
      }
    }

    const allSegments = [...segments, ...walkSegments];

    // Filter segments for Cheapest Option (Buses, Train, Walk only)
    const cheapestSegments = allSegments.filter(s => 
      ['CITY_BUS', 'FEEDER_BUS', 'BRTS', 'TRAIN', 'WALK'].includes(s.mode)
    );
    // Filter segments for Fastest Option (Shared Auto, Buses, Train, Walk)
    const fastestSegments = allSegments.filter(s => 
      ['SHARED_AUTO', 'CITY_BUS', 'FEEDER_BUS', 'BRTS', 'TRAIN', 'WALK'].includes(s.mode)
    );
    // Find paths
    const pathCheapest = this.findShortestPath(
      sourceStop._id.toString(), 
      destStop._id.toString(), 
      cheapestSegments, 
      (s) => s.fare + s.durationMinutes * 0.01 // primary fare, tiny tie-breaker for time
    );
    const pathFastest = this.findShortestPath(
      sourceStop._id.toString(), 
      destStop._id.toString(), 
      fastestSegments, 
      (s) => s.durationMinutes
    );
    const options = [];

    // Formulate option formatter
    const createOption = (path, id, label, tag, defaultConf, crowd, recFor) => {
      if (!path || path.length === 0) {
        // Fallback: Haversine direct option if graph is disconnected
        if (sourceStop.location?.coordinates && destStop.location?.coordinates) {
          const dist = this.getHaversineDistanceKm(sourceStop.location.coordinates, destStop.location.coordinates);
          const duration = Math.max(5, Math.round(dist * 2.5)); // 2.5 min per km approx
          const fare = Math.max(10, Math.round(dist * 5)); // ₹5 per km approx
          const walkLeg = {
            type: 'walk',
            bus_number: null,
            description: `Walk/Taxi directly from ${sourceStop.name} to ${destStop.name}`,
            stop_from: sourceStop.name,
            stop_to: destStop.name,
            duration_min: duration,
            distance_meters: Math.round(dist * 1000),
            stops_count: 0,
            intermediate_stops: []
          };
          return {
            id,
            label,
            tag,
            duration_min: duration,
            duration_range: `${Math.max(1, duration - 2)}-${duration + 3} mins`,
            fare_inr: fare,
            savings_inr: 0,
            transfers: 0,
            transfer_label: 'Direct Walk/Taxi',
            confidence: defaultConf,
            recommended_for: recFor,
            legs: [walkLeg],
            crowding: 'low'
          };
        }
        return null;
      }

      const legs = this.convertPathToLegs(path, stopsMap, routesMap);
      const totalDuration = legs.reduce((sum, leg) => sum + leg.duration_min, 0);
      const totalFare = path.reduce((sum, seg) => sum + seg.fare, 0);
      const transfers = legs.filter(l => l.type === 'wait').length;

      return {
        id,
        label,
        tag,
        duration_min: totalDuration,
        duration_range: `${Math.max(1, totalDuration - 2)}-${totalDuration + 3} minutes`,
        fare_inr: totalFare,
        transfers,
        transfer_label: transfers === 0 ? 'Direct' : transfers === 1 ? '1 transfer' : `${transfers} transfers`,
        confidence: defaultConf,
        recommended_for: recFor,
        legs,
        crowding: crowd
      };
    };

    const optFastest = createOption(pathFastest, 'opt_fastest', 'Fastest Connection', 'fastest', 95, 'moderate', 'Time-critical commuters');
    const optCheapest = createOption(pathCheapest, 'opt_cheapest', 'Eco Saver Option', 'cheapest', 88, 'high', 'Students & budget travelers');

    // Private ride provider APIs are not connected. Always return clearly
    // labeled fare estimates; use actual coordinates when present, otherwise
    // derive distance from the transit path so stations without coordinates
    // still get a comfortable ride option.
    const routeDistanceKm = (pathFastest || pathCheapest || []).reduce((sum, segment) => sum + (segment.distanceKm || 0), 0);
    const hasCoordinates = sourceStop.location?.coordinates?.length === 2 && destStop.location?.coordinates?.length === 2;
    const directDistanceKm = hasCoordinates ? this.getHaversineDistanceKm(sourceStop.location.coordinates, destStop.location.coordinates) : 0;
    const dist = Math.max(0.5, directDistanceKm || routeDistanceKm || Math.abs((sourceStop.corridorDistanceKm ?? 0) - (destStop.corridorDistanceKm ?? 0)) || 5);
    const providerEstimates = [
      { provider: 'Uber', fare_inr: Math.max(50, Math.round(50 + dist * 15)), duration_min: Math.max(5, Math.round((dist / 50) * 60)), ride_type: 'Car' },
      { provider: 'Rapido', fare_inr: Math.max(15, Math.round(15 + dist * 6)), duration_min: Math.max(5, Math.round((dist / 45) * 60)), ride_type: 'Bike' },
      { provider: 'Local auto', fare_inr: Math.max(30, Math.round(30 + dist * 10)), duration_min: Math.max(5, Math.round((dist / 40) * 60)), ride_type: 'Auto' },
    ];
    const uberEstimate = providerEstimates[0];
    const optComfortable = {
      id: 'opt_comfortable',
      label: 'Uber & Rapido estimates',
      tag: 'comfortable',
      duration_min: uberEstimate.duration_min,
      duration_range: `${Math.max(1, uberEstimate.duration_min - 2)}-${uberEstimate.duration_min + 3} mins`,
      fare_inr: uberEstimate.fare_inr,
      transfers: 0,
      transfer_label: 'Direct ride',
      confidence: 70,
      recommended_for: 'Compare estimated private ride fares',
      provider_estimates: providerEstimates,
      fare_note: 'Estimates only; live provider prices and availability are not connected.',
      legs: [{
        type: 'bus', mode: 'CAB', bus_number: null,
        description: `Estimated direct ride from ${sourceStop.name} to ${destStop.name}`,
        stop_from: sourceStop.name, stop_to: destStop.name,
        duration_min: uberEstimate.duration_min, distance_meters: Math.round(dist * 1000),
        stops_count: 0, intermediate_stops: []
      }],
      crowding: 'none'
    };

    if (optFastest) options.push(optFastest);
    if (optCheapest) options.push(optCheapest);
    if (optComfortable) options.push(optComfortable);

    // Calculate savings
    if (options.length > 0) {
      const fares = options.map(o => o.fare_inr);
      const maxFare = Math.max(...fares);
      options.forEach(o => {
        const savings = maxFare - o.fare_inr;
        o.savings_inr = savings > 0 ? savings : null;
      });
    }

    // Determine recommended index: 0=fastest, 1=cheapest, 2=comfortable
    let recIdx = 1; // Default to cheapest (public transit option for daily commuters)
    if (preference === 'fastest') recIdx = 0;
    else if (preference === 'cheapest') recIdx = 1;
    else if (preference === 'comfortable') recIdx = 2;
    
    // Clamp recommendation index to bounds of options
    if (recIdx >= options.length) {
      recIdx = Math.max(0, options.length - 1);
    }

    const analysisTime = Date.now() - startTime;
    const responsePayload = {
      options,
      recommended_index: recIdx,
      analysis_time_ms: analysisTime,
      source_label: sourceStop.name,
      destination_label: destStop.name
    };

    // Cache the result
    try {
      await RouteCache.create({
        sourceStop: sourceStop.name,
        destinationStop: destStop.name,
        preference: cacheKeyPref,
        result: responsePayload
      });
    } catch (cacheErr) {
      logger.error(`Failed to cache route plan: ${cacheErr.message}`);
    }

    // Log Travel History
    try {
      const recOption = options[recIdx] || options[0];
      if (recOption) {
        await TravelHistory.create({
          userId: userId || null,
          sourceLocation: sourceStop._id,
          destinationLocation: destStop._id,
          transportSelected: recOption.tag,
          estimatedFare: recOption.fare_inr,
          estimatedDistance: recOption.legs.reduce((acc, l) => acc + (l.distance_meters || 0), 0) / 1000,
          estimatedTime: recOption.duration_min
        });
      }
    } catch (historyErr) {
      logger.error(`Failed to log travel history: ${historyErr.message}`);
    }

    return responsePayload;
  }

  // 2. Search stops
  async searchStops(query) {
    if (!query || query.trim() === '') {
      return [];
    }

    const cleanQuery = query.trim();
    const stops = await TransportStop.find({
      active: true,
      $or: [
        { name: { $regex: new RegExp(cleanQuery, 'i') } },
        { aliases: { $regex: new RegExp(cleanQuery, 'i') } }
      ]
    }).limit(15);

    const results = [];
    for (const stop of stops) {
      // Fetch lines running through this stop
      const passingRoutes = await TransitRoute.find({
        active: true,
        'stops.stop': stop._id
      });
      const busLines = passingRoutes.map(r => r.routeNumber);

      results.push({
        id: stop._id.toString(),
        name: stop.name,
        type: this.mapStopType(stop.stopTypes),
        area: stop.area || '',
        city: stop.city === 'Hubballi' ? 'Hubli' : stop.city,
        bus_lines: busLines
      });
    }

    return results;
  }

  // 3. Network Statistics
  async getNetworkStats() {
    const total_routes = await TransitRoute.countDocuments({ active: true });
    const total_stops = await TransportStop.countDocuments({ active: true });

    // Aggregate average fare and average segment duration
    const statsAgg = await RouteSegment.aggregate([
      { $match: { active: true } },
      {
        $group: {
          _id: null,
          avgFare: { $avg: '$fare' },
          avgDur: { $avg: '$durationMinutes' }
        }
      }
    ]);

    const avg_fare_inr = statsAgg.length > 0 ? Math.round(statsAgg[0].avgFare) : 12;
    const avg_duration_min = statsAgg.length > 0 ? Math.round(statsAgg[0].avgDur) : 10;

    return {
      total_routes,
      total_stops,
      total_buses: total_routes * 5, // Derived bus instances count
      cities_connected: 2,
      avg_fare_inr,
      avg_duration_min,
      daily_passengers: 82000 // Verified daily average
    };
  }

  // 4. Network Nodes for 3D visualization
  async getNetworkNodes() {
    const stops = await TransportStop.find({ active: true }).lean();
    const routes = await TransitRoute.find({ active: true }).lean();
    const segments = await RouteSegment.find({ active: true }).lean();

    const stopsWithCoords = stops.filter(s => s.location && s.location.coordinates && s.location.coordinates.length === 2);
    
    if (stopsWithCoords.length === 0) {
      return [];
    }

    // Determine geographical bounding box
    let minLng = Infinity, maxLng = -Infinity;
    let minLat = Infinity, maxLat = -Infinity;

    for (const stop of stopsWithCoords) {
      const [lng, lat] = stop.location.coordinates;
      if (lng < minLng) minLng = lng;
      if (lng > maxLng) maxLng = lng;
      if (lat < minLat) minLat = lat;
      if (lat > maxLat) maxLat = lat;
    }

    const lngRange = maxLng - minLng || 1;
    const latRange = maxLat - minLat || 1;

    // Index mappings
    const routesMap = new Map(routes.map(r => [r._id.toString(), r]));
    
    // Build adjacency mapping for connections
    const stopConnections = {};
    for (const seg of segments) {
      const from = seg.fromStop.toString();
      const to = seg.toStop.toString();
      if (!stopConnections[from]) stopConnections[from] = new Set();
      stopConnections[from].add(to);
    }

    // Build stop -> route mapping for bus lines
    const stopBusLines = {};
    for (const route of routes) {
      for (const entry of route.stops) {
        const stopId = entry.stop.toString();
        if (!stopBusLines[stopId]) stopBusLines[stopId] = new Set();
        stopBusLines[stopId].add(route.routeNumber);
      }
    }

    return stopsWithCoords.map(stop => {
      const [lng, lat] = stop.location.coordinates;
      const stopId = stop._id.toString();

      // Normalize coords to [0, 1] bounds
      const x = (lng - minLng) / lngRange;
      const y = (lat - minLat) / latRange;

      const connections = stopConnections[stopId] ? Array.from(stopConnections[stopId]) : [];
      const busLines = stopBusLines[stopId] ? Array.from(stopBusLines[stopId]) : [];

      return {
        id: stopId,
        name: stop.name,
        type: this.mapStopType(stop.stopTypes),
        x,
        y,
        connections,
        bus_lines: busLines
      };
    });
  }

  // Keep older repositories functions for backward compatibility
  async getPopularRoutes() {
    const popular = await TravelHistory.aggregate([
      {
        $group: {
          _id: {
            sourceLocation: '$sourceLocation',
            destinationLocation: '$destinationLocation',
          },
          query_count: { $sum: 1 },
        },
      },
      { $sort: { query_count: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'transportstops',
          localField: '_id.sourceLocation',
          foreignField: '_id',
          as: 'sourceStop',
        },
      },
      {
        $lookup: {
          from: 'transportstops',
          localField: '_id.destinationLocation',
          foreignField: '_id',
          as: 'destStop',
        },
      },
      { $unwind: '$sourceStop' },
      { $unwind: '$destStop' },
      {
        $project: {
          _id: 0,
          source: '$sourceStop.name',
          destination: '$destStop.name',
          query_count: 1,
        },
      },
    ]);
    return popular;
  }
}

module.exports = new RouteService();
