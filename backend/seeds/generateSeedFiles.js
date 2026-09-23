const fs = require('fs');
const path = require('path');

const out = (name, data) =>
  fs.writeFileSync(path.join(__dirname, name), `${JSON.stringify(data, null, 2)}\n`);

const slug = (value) =>
  value
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_|_$/g, '');

const operators = [
  { code: 'NWKRTC', name: 'North Western Karnataka Road Transport Corporation', operatorType: 'GOVERNMENT', modes: ['CITY_BUS', 'FEEDER_BUS'], website: 'https://nwkrtc.karnataka.gov.in', contactNumbers: ['7760991675', '9606030542', '7760991555'] },
  { code: 'HDBRTS', name: 'Hubballi-Dharwad BRTS Company Limited', operatorType: 'PUBLIC_COMPANY', modes: ['BRTS', 'FEEDER_BUS'], website: 'https://www.hdbrts.com' },
  { code: 'SWR', name: 'South Western Railway', operatorType: 'RAILWAY', modes: ['TRAIN'] },
  { code: 'LOCAL_AUTO', name: 'Hubballi-Dharwad Local Auto Operators', operatorType: 'COMMUNITY', modes: ['SHARED_AUTO', 'AUTO_RICKSHAW'] },
];

const landmarkRows = [
  ['HUBBALLI_RAILWAY_STATION', 'Hubballi Railway Station (SSS Hubballi Jn)', ['SSS Hubballi Junction', 'Railway Station Hubli'], ['TRANSPORT_HUB'], 'Hubballi', 15.3495, 75.1485, 'HIGH'],
  ['DHARWAD_RAILWAY_STATION', 'Dharwad Railway Station', ['DWR'], ['TRANSPORT_HUB'], 'Dharwad', 15.441, 75.004, 'HIGH'],
  ['CBT_HUBBALLI', 'CBT Hubballi (Central Bus Terminal)', ['CBT Hubballi', 'Central Bus Stand'], ['TRANSPORT_HUB'], 'Hubballi', 15.365, 75.135, 'HIGH'],
  ['DHARWAD_NEW_BUS_STAND', 'Dharwad New Bus Stand', ['Dharwad CBT', 'Dharwad BRTS Terminal'], ['TRANSPORT_HUB'], 'Dharwad', 15.458, 75.0075, 'HIGH'],
  ['KLE_TECH', 'KLE Technological University', ['KLE Tech'], ['EDUCATIONAL'], 'Hubballi', 15.3688, 75.1231, 'HIGH'],
  ['BVB_CAMPUS', 'BVB Campus (Vidyanagar)', ['BVB', 'BVBCET'], ['EDUCATIONAL'], 'Hubballi', 15.3683, 75.1231, 'HIGH'],
  ['KIMS_HOSPITAL', 'KIMS Hospital Vidyanagar', ['KIMS Hospital', 'KIMS'], ['HOSPITAL'], 'Hubballi', 15.3693, 75.1215, 'HIGH'],
  ['SDM_MEDICAL_COLLEGE', 'SDM Medical College Dharwad', ['SDM Medical College', 'SDM Hospital'], ['HOSPITAL', 'EDUCATIONAL'], 'Dharwad', 15.459, 75.008, 'HIGH'],
  ['HUBBALLI_AIRPORT', 'Hubballi Airport (HBX)', ['Hubballi Airport', 'HBX Airport'], ['TRANSPORT_HUB'], 'Hubballi', 15.357, 75.0842, 'HIGH'],
  ['U_MALL', 'U Mall Hubli', ['U Mall'], ['COMMERCIAL'], 'Hubballi', 15.3481, 75.125, 'MEDIUM'],
  ['VIDYANAGAR', 'Vidyanagar', [], ['RESIDENTIAL', 'EDUCATIONAL'], 'Hubballi', 15.368, 75.122, 'HIGH'],
  ['UNKAL', 'Unkal', [], ['RESIDENTIAL', 'TOURIST'], 'Hubballi', 15.3782, 75.1064, 'HIGH'],
  ['UNKAL_LAKE', 'Unkal Lake', [], ['TOURIST', 'RECREATIONAL'], 'Hubballi', 15.3823, 75.1119, 'MEDIUM'],
  ['GOKUL_ROAD', 'Gokul Road', [], ['COMMERCIAL', 'RESIDENTIAL'], 'Hubballi', 15.355, 75.115, 'HIGH'],
  ['NAVANAGAR', 'Navanagar', ['Navanagara'], ['RESIDENTIAL'], 'Hubballi', 15.3932, 75.0815, 'MEDIUM'],
  ['COURT_CIRCLE', 'Court Circle (Dharwad)', ['Court Circle'], ['COMMERCIAL', 'GOVERNMENT'], 'Dharwad', 15.456, 75.005, 'HIGH'],
  ['JUBILEE_CIRCLE', 'Jubilee Circle (Dharwad)', ['Jubilee Circle'], ['COMMERCIAL', 'TRANSPORT_HUB'], 'Dharwad', 15.4581, 75.0075, 'HIGH'],
  ['PC_JABIN_COLLEGE', 'PC Jabin College Vidyanagar', [], ['EDUCATIONAL'], 'Hubballi', 15.367, 75.1219, 'MEDIUM'],
  ['VASAN_EYE_CARE', 'Vasan Eye Care Hospital', [], ['HOSPITAL'], 'Dharwad', 15.4555, 75.0045, 'MEDIUM'],
  ['CHANDRAMAULESHWARA_TEMPLE', 'Chandramauleshwara Temple Unkal', [], ['RELIGIOUS', 'TOURIST'], 'Hubballi', 15.38, 75.108, 'MEDIUM'],
  ['NRUPATUNGA_BETTA', 'Nrupatunga Betta (Hill)', [], ['TOURIST'], 'Hubballi', 15.39, 75.11, 'MEDIUM'],
  ['INDIRA_GANDHI_GLASS_HOUSE', 'Indira Gandhi Glass House', [], ['TOURIST'], 'Hubballi', 15.385, 75.105, 'MEDIUM'],
  ['KUVEMPU_NAGAR', 'Kuvempu Nagar Dharwad', [], ['RESIDENTIAL'], 'Dharwad', 15.452, 75.002, 'MEDIUM'],
  ['DESHPANDE_NAGAR', 'Deshpande Nagar Hubli', [], ['RESIDENTIAL'], 'Hubballi', 15.4558, 75.0052, 'MEDIUM'],
  ['GADAGA_ROAD', 'Gadaga Road Hubli', [], ['COMMERCIAL'], 'Hubballi', 15.35, 75.13, 'MEDIUM'],
  ['STATION_ROAD', 'Station Road Hubli', [], ['COMMERCIAL', 'TRANSPORT_HUB'], 'Hubballi', 15.348, 75.149, 'HIGH'],
  ['RD_STREET', 'RD Street Dharwad', [], ['COMMERCIAL', 'MARKET'], 'Dharwad', 15.457, 75.006, 'MEDIUM'],
  ['PUSPAGIRI', 'Puspagiri Dharwad', [], ['RESIDENTIAL'], 'Dharwad', 15.45, 75.01, 'LOW'],
  ['CAMP_AREA', 'Camp Area Dharwad', [], ['GOVERNMENT', 'COMMERCIAL'], 'Dharwad', 15.454, 75.004, 'MEDIUM'],
  ['APMC_MARKET', 'APMC Market Hubli', [], ['COMMERCIAL', 'MARKET'], 'Hubballi', 15.36, 75.138, 'MEDIUM'],
];

const landmarks = landmarkRows.map(([code, name, aliases, categories, city, lat, lon, importance]) => ({
  code,
  name,
  aliases,
  categories,
  city,
  location: { type: 'Point', coordinates: [lon, lat] },
  importance,
  nearbyStopCodes: [code],
}));

const coordinateStops = landmarkRows.map(([code, name, aliases, categories, city, lat, lon, importance]) => ({
  code,
  name: name.replace(/ \(.*\)/, ''),
  aliases,
  city,
  area: name,
  stopTypes: categories.includes('TRANSPORT_HUB') ? ['BUS_STOP', 'BUS_TERMINAL'] : ['BUS_STOP'],
  location: { type: 'Point', coordinates: [lon, lat] },
  importance,
  dataConfidence: 'HIGH',
}));

const brtsRows = [
  ['CBT_HUBBALLI', 'CBT Hubballi', 'Hubballi', 0], ['AMBEDKAR_CIRCLE', 'Dr. B.R. Ambedkar Circle', 'Hubballi', 0.5],
  ['HDMC', 'HDMC', 'Hubballi', 1], ['HOSUR_CROSS', 'Hosur Cross', 'Hubballi', 1.5],
  ['HOSUR_REGIONAL_TERMINAL', 'Hosur Regional Terminal', 'Hubballi', 2], ['KIMS_HOSPITAL', 'KIMS Hospital', 'Hubballi', 2.5],
  ['VIDYANAGAR', 'Vidyanagar', 'Hubballi', 3], ['BVB_CAMPUS', 'BVB (BVBCET)', 'Hubballi', 3.5],
  ['UNKAL_CROSS', 'Unkal Cross', 'Hubballi', 4], ['UNKAL_VILLAGE', 'Unkal Village', 'Hubballi', 4.5],
  ['UNKAL_LAKE', 'Unkal Lake', 'Hubballi', 5], ['BIRIDEVARAKOPPA', 'Biridevarakoppa', 'Hubballi', 5.5],
  ['SHANTINIKETHAN', 'Shantinikethan', 'Hubballi', 6], ['APMC_3RD_GATE', 'APMC 3rd Gate', 'Hubballi', 6.5],
  ['NAVANAGAR', 'Navanagara', 'Hubballi', 7], ['RTO', 'RTO', 'Dharwad', 7.5],
  ['ISKCON_TEMPLE', 'ISKCON Temple', 'Dharwad', 8], ['RAYAPUR', 'Rayapur', 'Dharwad', 8.5],
  ['KMF', 'KMF', 'Dharwad', 9], ['NAVLURU_RAILWAY_STATION', 'Navluru Railway Station', 'Dharwad', 9.5],
  ['SDM_MEDICAL_COLLEGE', 'SDM Medical College', 'Dharwad', 10], ['SATTUR', 'Sattur', 'Dharwad', 10.5],
  ['LAKMANAHALLI', 'Lakmanahalli', 'Dharwad', 11], ['GANDHINAGAR_DHARWAD', 'Gandhinagar', 'Dharwad', 11.5],
  ['VIDYAGIRI', 'Vidyagiri', 'Dharwad', 12], ['TOLL_NAKA', 'Toll Naka', 'Dharwad', 12.5],
  ['HOSA_YELLAPUR_CROSS', 'Hosa Yellapur Cross', 'Dharwad', 13], ['NTTF', 'NTTF', 'Dharwad', 13.5],
  ['COURT_CIRCLE', 'Court Circle', 'Dharwad', 14], ['JUBILEE_CIRCLE', 'Jubilee Circle', 'Dharwad', 14.5],
  ['DHARWAD_NEW_BUS_STAND', 'Dharwad BRTS Terminal', 'Dharwad', 15], ['SANJIVINI_PARK', 'Sanjivini Park', 'Dharwad', 15.5],
  ['YALAKKI_SHETTAR_COLONY_CROSS', 'Yalakki Shettar Colony Cross', 'Dharwad', 16], ['AGRICULTURAL_UNIVERSITY', 'Agricultural University', 'Dharwad', 17],
];

const namedStops = [
  ['HUBLI_STATION_RAILWAY_COLONY', 'Hubli Station Railway Colony', 'Hubballi'],
  ['DHARWAD_HOSAYELLAPUR', 'Dharwad Hosayellapur', 'Dharwad'],
  ['STATION_ROAD', 'Station Road', 'Hubballi'], ['HUBLI_AIRPORT_ROAD', 'Hubli Airport Road', 'Hubballi'],
  ['PB_ROAD', 'PB Road', 'Dharwad'], ['SHAKTI_COLONY', 'Shakti Colony', 'Hubballi'],
  ['DEVANGPETH', 'Devangpeth', 'Hubballi'], ['VIJAY_NAGAR', 'Vijay Nagar', 'Hubballi'],
  ['GOPANKOPPA', 'Gopankoppa', 'Hubballi'], ['KENGERI', 'Kengeri', 'Hubballi'],
  ['KESHAWAPUR', 'Keshawapur', 'Hubballi'], ['SUTAGATTI', 'Sutagatti', 'Hubballi'],
  ['CHENNAMMA_CIRCLE', 'Kitturu Rani Channamma Circle', 'Hubballi'], ['HUBLI_OLD_BUS_STAND', 'Hubli Old Bus Stand', 'Hubballi'],
  ['HOSUR_ROAD', 'Hosur Road', 'Hubballi'], ['LAMINGTON_SCHOOL_ROAD', 'Lamington School Road', 'Hubballi'],
  ['DHARWAD_OLD_BUS_STAND', 'Dharwad Old Bus Stand', 'Dharwad'], ['UNKAL_RAILWAY_HALT', 'Unkal Railway Halt', 'Hubballi'],
];

const feederAreas = [
  'Deen Bandhu Colony', 'Bendigeri', 'Bhandiwadagasi', 'Sanstimath', 'K.R. Nagar', 'KHB Colony',
  'Ashok Nagar', 'Bhavaninagar', 'Uday Nagara', 'Bengeri', 'Golden Park Area', 'Silver Park Area',
  'Bhuvaninagar', 'Gandhinagar Hubli', 'MG Road', 'Lamington Road', 'Chandramouli Nagar',
  'Kamalat Nagar', 'Rabindranath Nagar', 'Rajiv Gandhi Nagar', 'Sadananda Nagar', 'Siddheshwar Nagar',
  'Gandhi Nagar Near KIMS', 'Bellehulli', 'Kamakshi Nagar', 'Kodagali', 'Koppa Kol', 'Mastikatti',
  'Muddebihala', 'Nehru Nagar', 'Nrupatunga Nagar', 'Panchayat Nagar', 'Raghavendra Nagar',
  'Rajiv Nagar Near Airport', 'Ramakrishna Nagar', 'Rameshwar Nagar', 'Sadasiv Nagar', 'S VR Nagar',
  'Shivaji Nagar', 'Sri Krishna Nagar', 'Station Road Area', 'Tilak Nagar',
];

const stopMap = new Map(coordinateStops.map((stop) => [stop.code, stop]));
for (const [code, name, city, distance] of brtsRows) {
  const existing = stopMap.get(code);
  if (existing) {
    existing.stopTypes = [...new Set([...existing.stopTypes, 'BRTS_STATION'])];
    existing.corridorDistanceKm = distance;
  } else {
    stopMap.set(code, { code, name, aliases: [], city, area: name, stopTypes: ['BRTS_STATION'], corridorDistanceKm: distance, importance: 'MEDIUM', dataConfidence: 'MEDIUM' });
  }
}
for (const [code, name, city] of namedStops) {
  if (!stopMap.has(code)) stopMap.set(code, { code, name, aliases: [], city, area: name, stopTypes: ['BUS_STOP'], importance: 'MEDIUM', dataConfidence: 'LOW' });
}
for (const name of feederAreas) {
  const code = slug(name);
  if (!stopMap.has(code)) stopMap.set(code, { code, name, aliases: [], city: 'Hubballi', area: name, stopTypes: ['AREA'], importance: 'LOW', dataConfidence: 'LOW' });
}
stopMap.get('HUBBALLI_RAILWAY_STATION').stopTypes.push('RAILWAY_STATION');
stopMap.get('DHARWAD_RAILWAY_STATION').stopTypes.push('RAILWAY_STATION');
stopMap.get('HUBBALLI_AIRPORT').stopTypes.push('AIRPORT');
const stops = [...stopMap.values()];

const route = (routeNumber, name, operatorCode, mode, stopCodes, extra = {}) => ({
  routeNumber, name, operatorCode, mode, direction: extra.direction || 'BIDIRECTIONAL',
  stopCodes, estimatedTravelTimeMinutes: extra.time ?? null, estimatedFare: extra.fare ?? null,
  fareRange: extra.fareRange || { min: null, max: null }, serviceHours: extra.hours || { start: '', end: '' },
  frequency: extra.frequency || { regular: '', peak: '' }, dataConfidence: extra.confidence || 'MEDIUM',
  notes: extra.notes || [],
});

const routes = [
  route('201B-D', 'Dharwad New Bus Station to SSS Hubballi Junction Railway Station', 'HDBRTS', 'BRTS', ['DHARWAD_NEW_BUS_STAND', 'JUBILEE_CIRCLE', 'COURT_CIRCLE', 'UNKAL_LAKE', 'CBT_HUBBALLI', 'HUBBALLI_RAILWAY_STATION'], { direction: 'DOWN', time: 45, fare: 25, hours: { start: '05:30', end: '22:00' }, frequency: { regular: 'Every 10-15 mins', peak: 'Every 5-8 mins' } }),
  route('201B-U', 'SSS Hubballi Junction Railway Station to Dharwad CBT', 'HDBRTS', 'BRTS', ['HUBBALLI_RAILWAY_STATION', 'CBT_HUBBALLI', 'UNKAL', 'COURT_CIRCLE', 'JUBILEE_CIRCLE', 'DHARWAD_NEW_BUS_STAND'], { direction: 'UP', time: 50, fare: 28, hours: { start: '05:30', end: '22:30' }, frequency: { regular: 'Every 10-15 mins', peak: 'Every 5-8 mins' } }),
  route('BRTS-1', 'CBT Hubballi to Dharwad CBT', 'HDBRTS', 'BRTS', brtsRows.slice(0, 31).map(([code]) => code), { time: 35, fare: 30, hours: { start: '05:00', end: '23:00' }, frequency: { regular: 'Every 8 mins', peak: 'Every 4-5 mins' } }),
  route('13', 'Hubli Station to Dharwad', 'NWKRTC', 'CITY_BUS', ['HUBLI_STATION_RAILWAY_COLONY', 'VIDYANAGAR', 'KLE_TECH', 'UNKAL_LAKE', 'COURT_CIRCLE', 'DHARWAD_NEW_BUS_STAND'], { time: 40, fare: 20, frequency: { regular: 'Every 15-20 mins', peak: 'Every 8-10 mins' } }),
  route('21', 'CBT Hubballi to Vidyanagar', 'NWKRTC', 'CITY_BUS', ['CBT_HUBBALLI', 'STATION_ROAD', 'GOKUL_ROAD', 'KIMS_HOSPITAL', 'VIDYANAGAR'], { time: 25, fare: 15, frequency: { regular: 'Every 15 mins', peak: 'Every 7 mins' } }),
  route('35', 'Gokul Road to Navanagar', 'NWKRTC', 'CITY_BUS', ['GOKUL_ROAD', 'UNKAL', 'HUBLI_AIRPORT_ROAD', 'NAVANAGAR'], { time: 20, fare: 12, frequency: { regular: 'Every 20 mins', peak: 'Every 10 mins' } }),
  route('45', 'Railway Station to KLE Technological University', 'NWKRTC', 'CITY_BUS', ['HUBBALLI_RAILWAY_STATION', 'STATION_ROAD', 'VIDYANAGAR', 'BVB_CAMPUS', 'KLE_TECH'], { time: 20, fare: 12, frequency: { regular: 'Every 15 mins', peak: 'Every 8 mins' } }),
  route('52', 'Dharwad New Bus Stand to SDM Medical College', 'NWKRTC', 'CITY_BUS', ['DHARWAD_NEW_BUS_STAND', 'JUBILEE_CIRCLE', 'COURT_CIRCLE', 'PB_ROAD', 'SDM_MEDICAL_COLLEGE'], { time: 15, fare: 10, frequency: { regular: 'Every 12 mins', peak: 'Every 6 mins' } }),
  route('67', 'Hubli Old Bus Stand to Dharwad', 'NWKRTC', 'CITY_BUS', ['CHENNAMMA_CIRCLE', 'HUBLI_OLD_BUS_STAND', 'GOKUL_ROAD', 'UNKAL', 'COURT_CIRCLE', 'DHARWAD_NEW_BUS_STAND'], { time: 35, fare: 18, frequency: { regular: 'Every 20 mins', peak: '' } }),
  route('72', 'Navanagar to KLE Tech', 'NWKRTC', 'CITY_BUS', ['NAVANAGAR', 'UNKAL', 'KLE_TECH', 'VIDYANAGAR'], { time: 15, fare: 10, frequency: { regular: 'Every 15 mins', peak: '' } }),
  route('88', 'CBT Hubballi to Kengeri', 'NWKRTC', 'CITY_BUS', ['CBT_HUBBALLI', 'KIMS_HOSPITAL', 'KENGERI', 'KESHAWAPUR'], { time: 18, fare: 12, frequency: { regular: 'Every 20 mins', peak: '' } }),
  route('FEEDER-A', 'Shakti Colony to Unkal Lake BRTS', 'NWKRTC', 'FEEDER_BUS', ['SHAKTI_COLONY', 'VIDYANAGAR', 'KLE_TECH', 'UNKAL_LAKE'], { time: 15, fareRange: { min: 8, max: 10 }, confidence: 'LOW' }),
  route('FEEDER-B', 'Devangpeth to CBT Hubballi BRTS', 'NWKRTC', 'FEEDER_BUS', ['DEVANGPETH', 'VIJAY_NAGAR', 'HDMC', 'CBT_HUBBALLI'], { time: 15, fareRange: { min: 8, max: 10 }, confidence: 'LOW' }),
  route('FEEDER-C', 'Gopankoppa to Navanagar BRTS', 'NWKRTC', 'FEEDER_BUS', ['GOPANKOPPA', 'KENGERI', 'KESHAWAPUR', 'NAVANAGAR'], { time: 15, fareRange: { min: 8, max: 10 }, confidence: 'LOW' }),
  route('17325', 'Vishwamanav Express Dharwad to Hubballi', 'SWR', 'TRAIN', ['DHARWAD_RAILWAY_STATION', 'HUBBALLI_RAILWAY_STATION'], { direction: 'DOWN', time: 30, fare: 45, frequency: { regular: '7 daily', peak: '' }, confidence: 'HIGH' }),
  route('HBX-UBL-2026', 'Hubli Airport to Hubli Railway Station', 'NWKRTC', 'CITY_BUS', ['HUBBALLI_AIRPORT', 'CBT_HUBBALLI', 'HOSUR_ROAD', 'HOSUR_CROSS', 'CHENNAMMA_CIRCLE', 'LAMINGTON_SCHOOL_ROAD', 'HUBBALLI_RAILWAY_STATION'], { time: null, fare: null, notes: ['Availability reported for April 2026', 'Airport departures: 08:05, 11:45, 17:05, 18:35, 19:10, 20:05, 20:50'], confidence: 'MEDIUM' }),
];

const sharedAutoRows = [
  ['SA-001','Railway Station to CBT','HUBBALLI_RAILWAY_STATION','CBT_HUBBALLI',15,'06:00','22:00','HIGH'],
  ['SA-002','CBT to Vidyanagar/KLE Tech','CBT_HUBBALLI','KLE_TECH',15,'06:00','21:30','HIGH'],
  ['SA-003','Vidyanagar to KLE Tech','VIDYANAGAR','KLE_TECH',10,'06:30','21:00','HIGH'],
  ['SA-004','Dharwad Bus Stand to University Area','DHARWAD_NEW_BUS_STAND','KLE_TECH',20,'06:00','21:00','MEDIUM'],
  ['SA-005','Railway Station to Vidyanagar','HUBBALLI_RAILWAY_STATION','VIDYANAGAR',15,'06:00','22:00','HIGH'],
  ['SA-006','Unkal to Hubli Airport','UNKAL_LAKE','HUBBALLI_AIRPORT',25,'05:00','23:00','MEDIUM'],
  ['SA-007','Gokul Road to Railway Station','GOKUL_ROAD','HUBBALLI_RAILWAY_STATION',15,'06:00','22:00','HIGH'],
  ['SA-008','Court Circle to Dharwad Bus Stand','COURT_CIRCLE','DHARWAD_NEW_BUS_STAND',10,'06:00','21:30','HIGH'],
  ['SA-009','Jubilee Circle to SDM College','JUBILEE_CIRCLE','SDM_MEDICAL_COLLEGE',10,'06:00','21:00','MEDIUM'],
  ['SA-010','Navanagar to Unkal','NAVANAGAR','UNKAL_LAKE',15,'07:00','21:00','MEDIUM'],
];
routes.push(...sharedAutoRows.map(([number, name, from, to, fare, start, end, demand]) =>
  route(number, name, 'LOCAL_AUTO', 'SHARED_AUTO', [from, to], {
    fare,
    hours: { start, end },
    frequency: { regular: demand === 'HIGH' ? 'Frequent shared service' : 'Demand-dependent shared service', peak: '' },
    notes: [`Demand level: ${demand}`],
  })
));

const samparkaRows = [
  ['FS-001','Navanagar/Sutagatti to Dharwad New Bus Stand',['SUTAGATTI','NAVANAGAR','DHARWAD_NEW_BUS_STAND'],28,25,3],
  ['FS-002','Navanagar/Sutagatti to Dharwad BRTS Terminal/Jubilee Circle',['SUTAGATTI','NAVANAGAR','JUBILEE_CIRCLE'],27,24,4],
  ['FS-003','Navanagar/Sutagatti to Gandhinagar Dharwad',['SUTAGATTI','NAVANAGAR','GANDHINAGAR_DHARWAD'],24,20,4],
  ['FS-004','Navanagar/Sutagatti to SDM Hospital',['SUTAGATTI','NAVANAGAR','SDM_MEDICAL_COLLEGE'],21,17,4],
  ['FS-005','Navanagar/Sutagatti to CBT Hubballi/Railway Station',['SUTAGATTI','NAVANAGAR','CBT_HUBBALLI','HUBBALLI_RAILWAY_STATION'],26,22,4],
  ['FS-006','Navanagar/Sutagatti to Hubli Old Bus Stand/HDMC',['SUTAGATTI','NAVANAGAR','HDMC','HUBLI_OLD_BUS_STAND'],24,20,4],
  ['FS-007','Navanagar/Sutagatti to KLE Technological University',['SUTAGATTI','NAVANAGAR','KLE_TECH'],22,18,4],
  ['FS-008','Shakti Colony to Unkal Lake BRTS via KLE Tech',['SHAKTI_COLONY','KLE_TECH','UNKAL_LAKE'],20,16,4],
  ['FS-009','Shakti Colony to CBT Hubballi via Vidyanagar',['SHAKTI_COLONY','VIDYANAGAR','CBT_HUBBALLI'],18,14,4],
  ['FS-010','Devangpeth to CBT via Vijay Nagar and HDMC',['DEVANGPETH','VIJAY_NAGAR','HDMC','CBT_HUBBALLI'],17,13,4],
  ['FS-011','Devangpeth to KIMS via Vijay Nagar',['DEVANGPETH','VIJAY_NAGAR','KIMS_HOSPITAL'],16,12,4],
  ['FS-012','Gopankoppa to Unkal BRTS via Kengeri and Navanagar',['GOPANKOPPA','KENGERI','NAVANAGAR','UNKAL_LAKE'],19,15,4],
  ['FS-013','Gopankoppa to CBT Hubballi via Keshawapur',['GOPANKOPPA','KESHAWAPUR','CBT_HUBBALLI'],18,14,4],
  ['FS-014','Kengeri to CBT via KLE Tech and Vidyanagar',['KENGERI','KLE_TECH','VIDYANAGAR','CBT_HUBBALLI'],17,13,4],
  ['FS-015','Keshawapur to Unkal Lake BRTS via Navanagar',['KESHAWAPUR','NAVANAGAR','UNKAL_LAKE'],18,14,4],
];
routes.push(...samparkaRows.map(([number, name, stopCodes, originalFare, fare, savings]) =>
  route(number, name, 'HDBRTS', 'FEEDER_BUS', stopCodes, {
    fare,
    notes: [`Original city bus + BRTS fare: INR ${originalFare}`, `Chigari Samparka savings: INR ${savings}`],
    confidence: 'MEDIUM',
  })
));

const graphRows = [
  ['HUBBALLI_RAILWAY_STATION','CBT_HUBBALLI','CITY_BUS',15,20,8],['HUBBALLI_RAILWAY_STATION','VIDYANAGAR','CITY_BUS',12,18,7],
  ['HUBBALLI_RAILWAY_STATION','KLE_TECH','CITY_BUS',12,20,8],['HUBBALLI_RAILWAY_STATION','UNKAL_LAKE','CITY_BUS',10,15,6],
  ['HUBBALLI_RAILWAY_STATION','HUBBALLI_AIRPORT','CITY_BUS',20,25,10],['CBT_HUBBALLI','VIDYANAGAR','CITY_BUS',10,15,5],
  ['CBT_HUBBALLI','KLE_TECH','CITY_BUS',12,18,6],['CBT_HUBBALLI','DHARWAD_NEW_BUS_STAND','CITY_BUS',25,35,15],
  ['CBT_HUBBALLI','UNKAL_LAKE','CITY_BUS',8,12,4],['VIDYANAGAR','KLE_TECH','CITY_BUS',5,5,1],
  ['VIDYANAGAR','HUBBALLI_AIRPORT','CITY_BUS',15,20,8],['VIDYANAGAR','DHARWAD_RAILWAY_STATION','CITY_BUS',25,35,14],
  ['UNKAL_LAKE','HUBBALLI_AIRPORT','CITY_BUS',12,15,5],['UNKAL_LAKE','DHARWAD_NEW_BUS_STAND','CITY_BUS',20,30,12],
  ['UNKAL_LAKE','COURT_CIRCLE','CITY_BUS',15,20,8],['GOKUL_ROAD','HUBBALLI_RAILWAY_STATION','CITY_BUS',10,15,5],
  ['GOKUL_ROAD','VIDYANAGAR','CITY_BUS',8,12,4],['GOKUL_ROAD','KLE_TECH','CITY_BUS',10,15,5],
  ['NAVANAGAR','UNKAL_LAKE','CITY_BUS',8,12,4],['NAVANAGAR','HUBBALLI_AIRPORT','CITY_BUS',10,12,4],
  ['COURT_CIRCLE','JUBILEE_CIRCLE','CITY_BUS',5,8,2],['COURT_CIRCLE','DHARWAD_NEW_BUS_STAND','CITY_BUS',8,10,2],
  ['COURT_CIRCLE','SDM_MEDICAL_COLLEGE','CITY_BUS',10,12,3],['JUBILEE_CIRCLE','DHARWAD_NEW_BUS_STAND','CITY_BUS',5,8,2],
  ['JUBILEE_CIRCLE','SDM_MEDICAL_COLLEGE','CITY_BUS',8,10,2],['DHARWAD_RAILWAY_STATION','DHARWAD_NEW_BUS_STAND','CITY_BUS',8,10,2],
  ['DHARWAD_RAILWAY_STATION','COURT_CIRCLE','CITY_BUS',10,12,3],['DHARWAD_RAILWAY_STATION','JUBILEE_CIRCLE','CITY_BUS',10,12,3],
  ['DHARWAD_RAILWAY_STATION','SDM_MEDICAL_COLLEGE','CITY_BUS',12,15,4],['HUBBALLI_AIRPORT','DHARWAD_NEW_BUS_STAND','CITY_BUS',25,40,18],
  ['HUBBALLI_AIRPORT','KLE_TECH','CITY_BUS',15,20,8],['HUBBALLI_AIRPORT','VIDYANAGAR','CITY_BUS',15,20,8],
  ['HUBBALLI_AIRPORT','CBT_HUBBALLI','CITY_BUS',12,18,7],['HUBBALLI_AIRPORT','HUBBALLI_RAILWAY_STATION','CITY_BUS',20,25,10],
  ['HUBBALLI_RAILWAY_STATION','DHARWAD_RAILWAY_STATION','TRAIN',45,30,21],['HUBBALLI_RAILWAY_STATION','DHARWAD_RAILWAY_STATION','CITY_BUS',28,50,20],
  ['CBT_HUBBALLI','DHARWAD_NEW_BUS_STAND','BRTS',30,35,18],
];

const segmentsMap = new Map();

const addSegment = (fromStopCode, toStopCode, mode, distanceKm, durationMinutes, fare) => {
  const key = `${fromStopCode}->${toStopCode}:${mode}`;
  const reverseKey = `${toStopCode}->${fromStopCode}:${mode}`;
  
  const seg = {
    fromStopCode,
    toStopCode,
    mode,
    distanceKm: parseFloat(distanceKm.toFixed(2)),
    durationMinutes: Math.max(1, Math.round(durationMinutes)),
    fare: Math.max(0, Math.round(fare)),
    bidirectional: true,
    dataConfidence: 'HIGH'
  };

  segmentsMap.set(key, seg);
  segmentsMap.set(reverseKey, { ...seg, fromStopCode: toStopCode, toStopCode: fromStopCode });
};

// 1. Add manual rows
graphRows.forEach(([fromStopCode, toStopCode, mode, fare, durationMinutes, distanceKm]) => {
  addSegment(fromStopCode, toStopCode, mode, distanceKm, durationMinutes, fare);
});

// 2. Compile BRTS distances mapping
const brtsDistances = {};
brtsRows.forEach(([code, name, city, distance]) => {
  brtsDistances[code] = distance;
});

// 3. Process all routes and feeder routes to extract segments programmatically
routes.forEach(route => {
  if (route.mode === 'BRTS') {
    for (let i = 0; i < route.stopCodes.length - 1; i++) {
      const s1 = route.stopCodes[i];
      const s2 = route.stopCodes[i+1];
      const dist1 = brtsDistances[s1];
      const dist2 = brtsDistances[s2];
      if (dist1 !== undefined && dist2 !== undefined) {
        const dist = Math.abs(dist2 - dist1);
        const duration = dist * 2.0; // 30 km/h average
        const fare = dist <= 3.0 ? 12 : (dist <= 8.0 ? 18 : 25);
        addSegment(s1, s2, 'BRTS', dist, duration, fare);
      }
    }
  } else if (route.mode === 'FEEDER_BUS') {
    for (let i = 0; i < route.stopCodes.length - 1; i++) {
      const s1 = route.stopCodes[i];
      const s2 = route.stopCodes[i+1];
      addSegment(s1, s2, 'FEEDER_BUS', 2.0, 6.0, 10.0);
    }
  } else if (route.mode === 'SHARED_AUTO') {
    if (route.stopCodes.length === 2) {
      addSegment(route.stopCodes[0], route.stopCodes[1], 'SHARED_AUTO', 3.0, 10.0, route.estimatedFare || 15);
    }
  }
});

const segments = Array.from(segmentsMap.values());

const autoFareRows = [
  ['HUBBALLI_RAILWAY_STATION','CBT_HUBBALLI',80,120,150],['HUBBALLI_RAILWAY_STATION','VIDYANAGAR',100,150,200],['HUBBALLI_RAILWAY_STATION','KLE_TECH',120,180,250],['HUBBALLI_RAILWAY_STATION','UNKAL_LAKE',100,150,200],['HUBBALLI_RAILWAY_STATION','HUBBALLI_AIRPORT',150,200,300],
  ['CBT_HUBBALLI','VIDYANAGAR',80,120,150],['CBT_HUBBALLI','KLE_TECH',80,120,150],['CBT_HUBBALLI','DHARWAD_NEW_BUS_STAND',150,250,350],['CBT_HUBBALLI','UNKAL_LAKE',60,100,150],
  ['VIDYANAGAR','KLE_TECH',30,50,70],['VIDYANAGAR','HUBBALLI_AIRPORT',100,150,200],['VIDYANAGAR','DHARWAD_RAILWAY_STATION',150,250,350],['UNKAL_LAKE','HUBBALLI_AIRPORT',80,120,180],['UNKAL_LAKE','DHARWAD_NEW_BUS_STAND',100,180,250],['UNKAL_LAKE','COURT_CIRCLE',80,120,180],
  ['GOKUL_ROAD','HUBBALLI_RAILWAY_STATION',60,100,150],['GOKUL_ROAD','VIDYANAGAR',50,80,120],['GOKUL_ROAD','KLE_TECH',60,100,150],['NAVANAGAR','UNKAL_LAKE',50,80,120],['NAVANAGAR','HUBBALLI_AIRPORT',60,100,150],
  ['COURT_CIRCLE','JUBILEE_CIRCLE',30,50,80],['COURT_CIRCLE','DHARWAD_NEW_BUS_STAND',40,60,100],['COURT_CIRCLE','SDM_MEDICAL_COLLEGE',50,80,120],['JUBILEE_CIRCLE','DHARWAD_NEW_BUS_STAND',30,50,80],['JUBILEE_CIRCLE','SDM_MEDICAL_COLLEGE',40,60,100],
  ['DHARWAD_RAILWAY_STATION','DHARWAD_NEW_BUS_STAND',40,60,100],['DHARWAD_RAILWAY_STATION','COURT_CIRCLE',50,80,120],['DHARWAD_RAILWAY_STATION','JUBILEE_CIRCLE',50,80,120],['DHARWAD_RAILWAY_STATION','SDM_MEDICAL_COLLEGE',60,100,150],
  ['HUBBALLI_AIRPORT','DHARWAD_NEW_BUS_STAND',200,300,450],['HUBBALLI_AIRPORT','KLE_TECH',120,180,250],['HUBBALLI_AIRPORT','VIDYANAGAR',120,180,250],['HUBBALLI_AIRPORT','CBT_HUBBALLI',100,150,220],['HUBBALLI_AIRPORT','HUBBALLI_RAILWAY_STATION',150,200,300],
  ['U_MALL','VIDYANAGAR',50,80,120],['U_MALL','HUBBALLI_RAILWAY_STATION',60,100,150],['U_MALL','KLE_TECH',60,100,150],['KIMS_HOSPITAL','VIDYANAGAR',30,50,70],['KIMS_HOSPITAL','KLE_TECH',40,60,80],['KIMS_HOSPITAL','HUBBALLI_RAILWAY_STATION',100,150,200],
  ['VIDYANAGAR','HUBBALLI_RAILWAY_STATION',100,150,200],['VIDYANAGAR','UNKAL_LAKE',50,80,120],['VIDYANAGAR','GOKUL_ROAD',50,80,120],['VIDYANAGAR','DHARWAD_NEW_BUS_STAND',150,250,350],
  ['KLE_TECH','DHARWAD_NEW_BUS_STAND',180,280,400],['KLE_TECH','HUBBALLI_RAILWAY_STATION',120,180,250],['KLE_TECH','UNKAL_LAKE',60,100,150],['KLE_TECH','GOKUL_ROAD',60,100,150],['KLE_TECH','CBT_HUBBALLI',80,120,150],['SDM_MEDICAL_COLLEGE','DHARWAD_NEW_BUS_STAND',50,80,120],
];

const fares = autoFareRows.map(([fromStopCode, toStopCode, min, average, max]) => ({
  code: `AUTO_${fromStopCode}_${toStopCode}`, mode: 'AUTO_RICKSHAW', ruleType: 'STOP_PAIR',
  operatorCode: 'LOCAL_AUTO', fromStopCode, toStopCode, amount: { min, average, max, currency: 'INR' },
  notes: ['Community-reported estimate; verify at time of travel'],
}));

fares.push(
  { code: 'NWKRTC_SHORT_1_3KM', operatorCode: 'NWKRTC', mode: 'CITY_BUS', ruleType: 'DISTANCE_BAND', distanceRangeKm: { min: 1, max: 3 }, amount: { min: 12, average: null, max: 15, currency: 'INR' }, validFrom: '2025-01-01' },
  { code: 'NWKRTC_MEDIUM_4_8KM', operatorCode: 'NWKRTC', mode: 'CITY_BUS', ruleType: 'DISTANCE_BAND', distanceRangeKm: { min: 4, max: 8 }, amount: { min: 18, average: null, max: 20, currency: 'INR' }, validFrom: '2025-01-01' },
  { code: 'NWKRTC_LONG_9_15KM', operatorCode: 'NWKRTC', mode: 'CITY_BUS', ruleType: 'DISTANCE_BAND', distanceRangeKm: { min: 9, max: 15 }, amount: { min: 25, average: null, max: 28, currency: 'INR' }, validFrom: '2025-01-01' },
  { code: 'HDBRTS_FULL_CORRIDOR', operatorCode: 'HDBRTS', mode: 'BRTS', ruleType: 'DISTANCE_BAND', distanceRangeKm: { min: 13, max: 22.25 }, amount: { min: 25, average: null, max: 30, currency: 'INR' } },
  { code: 'HDBRTS_SMART_CARD', operatorCode: 'HDBRTS', mode: 'BRTS', ruleType: 'PASS', amount: { min: 25, average: 25, max: 25, currency: 'INR' }, notes: ['One-time RFID smart card fee'] },
  { code: 'HDBRTS_MONTHLY_PASS', operatorCode: 'HDBRTS', mode: 'BRTS', ruleType: 'PASS', amount: { min: 750, average: 750, max: 750, currency: 'INR' }, notes: ['Unlimited rides monthly pass'] }
);
fares.push(...samparkaRows.map(([number, name, stopCodes, originalFare, fare, savings]) => ({
  code: `SAMPARKA_${number}`,
  operatorCode: 'HDBRTS',
  mode: 'FEEDER_BUS',
  ruleType: 'INTEGRATED',
  fromStopCode: stopCodes[0],
  toStopCode: stopCodes[stopCodes.length - 1],
  amount: { min: fare, average: fare, max: fare, currency: 'INR' },
  componentFares: [originalFare],
  savings,
  notes: [name, `Original city bus + BRTS combined fare: INR ${originalFare}`],
})));

const users = [
  { name: 'Admin Architect', email: 'admin@planner.com', password: 'AdminPassword@123', role: 'admin' },
  { name: 'Srujan', email: 'example@gmail.com', password: 'Password@123', role: 'user' },
];

out('operators.seed.json', operators);
out('stops.seed.json', stops);
out('landmarks.seed.json', landmarks);
out('routes.seed.json', routes);
out('routeSegments.seed.json', segments);
out('fares.seed.json', fares);
out('users.seed.json', users);

console.log(`Generated ${operators.length} operators, ${stops.length} stops, ${landmarks.length} landmarks, ${routes.length} routes, ${segments.length} segments, ${fares.length} fare rules, and ${users.length} users.`);
