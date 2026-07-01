import type { Institution } from './types'

// Approximate institution or provider-region coordinates (lat, lng)
// Used for the interactive UK map visualization.
export const INSTITUTION_COORDS: Record<string, [number, number]> = {
  oxford: [51.755, -1.255],
  cambridge: [52.204, 0.121],
  imperial: [51.498, -0.175],
  ucl: [51.525, -0.133],
  lse: [51.514, -0.116],
  kcl: [51.511, -0.116],
  edinburgh: [55.944, -3.188],
  glasgow: [55.872, -4.288],
  manchester: [53.467, -2.234],
  bristol: [51.458, -2.603],
  warwick: [52.384, -1.561],
  leeds: [53.804, -1.555],
  sheffield: [53.381, -1.490],
  birmingham: [52.450, -1.930],
  southampton: [50.934, -1.397],
  newcastle: [54.978, -1.618],
  nottingham: [52.951, -1.187],
  cardiff: [51.484, -3.179],
  qub: [54.585, -5.934],
  durham: [54.776, -1.576],
  exeter: [50.737, -3.535],
  standrews: [56.340, -2.796],
  strathclyde: [55.861, -4.244],
  swansea: [51.622, -3.944],
  aberdeen: [57.149, -2.113],
  york: [53.952, -1.083],
  qmul: [51.523, -0.040],
  liverpool: [53.406, -2.966],
  bath: [51.382, -2.359],
  loughborough: [52.766, -1.225],
  surrey: [51.244, -0.590],
  reading: [51.441, -0.937],
  sussex: [50.867, -0.086],
  uea: [52.621, 1.238],
  essex: [51.878, 0.943],
  kent: [51.297, 1.071],
  lancaster: [54.010, -2.787],
  leicester: [52.621, -1.126],
  aston: [52.487, -1.889],
  hull: [53.771, -0.362],
  keele: [52.999, -2.273],
  city: [51.528, -0.102],
  royalholloway: [51.426, -0.562],
  soas: [51.522, -0.131],
  goldsmiths: [51.474, -0.032],
  birkbeck: [51.522, -0.132],
  lbs: [51.513, -0.149],
  rvc: [51.792, -0.220],
  courtauld: [51.511, -0.116],
  lshtm: [51.521, -0.131],
  open: [52.024, -0.709],
  rcm: [51.501, -0.177],
  ram: [51.524, -0.153],
  rca: [51.495, -0.174],
  guildhall: [51.519, -0.096],
  trinitylaban: [51.479, -0.010],
  ual: [51.510, -0.119],
  falmouth: [50.151, -5.067],
  norwicharts: [52.630, 1.297],
  ravensbourne: [51.501, 0.004],
  mmu: [53.468, -2.244],
  shu: [53.376, -1.468],
  leedsbeckett: [53.801, -1.554],
  ljmu: [53.407, -2.981],
  bcu: [52.483, -1.895],
  coventry: [52.407, -1.510],
  northumbria: [54.975, -1.614],
  plymouth: [50.377, -4.143],
  portsmouth: [50.799, -1.091],
  brighton: [50.863, -0.086],
  herts: [51.764, -0.244],
  kingston: [51.411, -0.301],
  greenwich: [51.483, 0.003],
  westminster: [51.520, -0.141],
  brunel: [51.533, -0.477],
  middlesex: [51.590, -0.221],
  uel: [51.511, 0.050],
  londonmet: [51.528, -0.109],
  lsbu: [51.502, -0.101],
  roehampton: [51.460, -0.242],
  beds: [51.877, -0.454],
  bournemouth: [50.742, -1.896],
  salford: [53.487, -2.273],
  sunderland: [54.906, -1.382],
  teesside: [54.574, -1.234],
  anglia: [52.195, 0.138],
  uclan: [53.762, -2.701],
  chester: [53.190, -2.892],
  cumbria: [54.892, -2.931],
  dmu: [52.629, -1.127],
  derby: [52.918, -1.477],
  edgehill: [53.564, -2.778],
  glos: [51.867, -2.244],
  huddersfield: [53.648, -1.778],
  lhu: [53.392, -2.891],
  northampton: [52.234, -0.902],
  brookes: [51.751, -1.237],
  solent: [50.907, -1.397],
  staffs: [52.800, -2.116],
  suffolk: [52.053, 1.143],
  uwl: [51.527, -0.308],
  uwe: [51.502, -2.548],
  wlv: [52.588, -2.129],
  worc: [52.190, -2.222],
  yorksj: [53.964, -1.080],
  bathspa: [51.383, -2.360],
  buckingham: [52.001, -0.987],
  lincoln: [53.237, -0.545],
  winchester: [51.063, -1.316],
  stmarys: [51.436, -0.337],
  chichester: [50.837, -0.781],
  bishop: [53.233, -0.537],
  canterbury: [51.277, 1.082],
  arden: [52.485, -1.870],
  bpp: [51.517, -0.129],
  regents: [51.529, -0.154],
  rau: [51.714, -1.971],
  abertay: [56.462, -2.976],
  dundee: [56.459, -2.971],
  napier: [55.917, -3.224],
  gcu: [55.867, -4.252],
  heriot: [55.912, -3.199],
  uhi: [57.477, -4.224],
  qmu: [55.921, -3.104],
  rgu: [57.157, -2.094],
  rcs: [55.864, -4.262],
  sruc: [55.912, -3.200],
  stirling: [56.146, -3.918],
  uws: [55.850, -4.303],
  aber: [52.411, -4.081],
  bangor: [53.228, -4.128],
  cardiffmet: [51.490, -3.213],
  southwales: [51.589, -3.329],
  uwtsd: [52.112, -4.080],
  wrexham: [53.047, -2.993],
  ulster: [55.146, -6.672],
  stmarysbel: [54.588, -5.940],
  stranmillis: [54.575, -5.924],
}

export const REGION_COORDS: Record<string, [number, number]> = {
  London: [51.507, -0.128],
  'South East': [51.278, -0.753],
  'South West': [51.006, -3.188],
  'East of England': [52.241, 0.412],
  'East Midlands': [52.954, -1.158],
  'West Midlands': [52.486, -1.890],
  'Yorkshire and The Humber': [53.800, -1.549],
  'North East': [54.978, -1.617],
  'North West': [53.480, -2.242],
  England: [52.355, -1.174],
  Scotland: [56.490, -4.202],
  Wales: [52.130, -3.783],
  'Northern Ireland': [54.787, -6.492],
}

export type CoordinatePrecision = 'institution' | 'region' | 'nation' | 'missing'

export function getCoordinatePrecision(institution: Institution): CoordinatePrecision {
  if (INSTITUTION_COORDS[institution.id]) return 'institution'
  if (REGION_COORDS[institution.city]) return 'region'
  if (REGION_COORDS[institution.nation]) return 'nation'
  return 'missing'
}

export function getInstitutionCoordinates(institution: Institution): [number, number] | null {
  return INSTITUTION_COORDS[institution.id] ?? REGION_COORDS[institution.city] ?? REGION_COORDS[institution.nation] ?? null
}

// UK bounding box for SVG projection
export const UK_BOUNDS = {
  minLat: 49.75,
  maxLat: 61.15,
  minLng: -8.75,
  maxLng: 2.05,
}

function mercatorY(lat: number): number {
  const radians = lat * Math.PI / 180
  return Math.log(Math.tan(Math.PI / 4 + radians / 2))
}

// Convert lat/lng to SVG x/y using Web Mercator. This keeps the UK outline
// visually narrower and closer to the source boundary shape than raw lat/lng.
export function projectToSvg(lat: number, lng: number, svgW: number, svgH: number): [number, number] {
  const { minLat, maxLat, minLng, maxLng } = UK_BOUNDS
  const x = ((lng - minLng) / (maxLng - minLng)) * svgW
  const minY = mercatorY(minLat)
  const maxY = mercatorY(maxLat)
  const y = (1 - (mercatorY(lat) - minY) / (maxY - minY)) * svgH
  return [x, y]
}
