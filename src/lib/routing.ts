export interface Node {
  id: string;
  name: string;
  lat: number;
  lng: number;
}

export interface Edge {
  from: string;
  to: string;
  weight: number; // distance in meters or weighted cost
  streetName?: string;
}

export interface RouteStep {
  instruction: string;
  distanceMeters: number;
  durationSeconds: number;
  streetName: string;
}

export interface RouteResult {
  coordinates: [number, number][]; // [lat, lng] array
  distanceMeters: number;
  distanceKm: number;
  durationSeconds: number;
  etaMinutes: number;
  algorithm: string;
  steps: RouteStep[];
  source: 'osrm_network' | 'dijkstra_local';
}

export class Graph {
  private nodes: Map<string, Node> = new Map();
  private edges: Map<string, Edge[]> = new Map();

  addNode(node: Node) {
    this.nodes.set(node.id, node);
    if (!this.edges.has(node.id)) {
      this.edges.set(node.id, []);
    }
  }

  addEdge(edge: Edge) {
    if (!this.edges.has(edge.from)) this.edges.set(edge.from, []);
    this.edges.get(edge.from)?.push(edge);
  }

  addUndirectedEdge(from: string, to: string, weight: number, streetName?: string) {
    this.addEdge({ from, to, weight, streetName });
    this.addEdge({ from: to, to: from, weight, streetName });
  }

  getNode(id: string): Node | undefined {
    return this.nodes.get(id);
  }

  getAllNodes(): Node[] {
    return Array.from(this.nodes.values());
  }

  getEdges(fromId: string): Edge[] {
    return this.edges.get(fromId) || [];
  }

  /**
   * Classic Dijkstra's Algorithm implementation for shortest weighted path
   */
  findShortestPath(startId: string, targetId: string): { path: string[]; distance: number; edges: Edge[] } | null {
    if (!this.nodes.has(startId) || !this.nodes.has(targetId)) {
      return null;
    }

    if (startId === targetId) {
      return { path: [startId], distance: 0, edges: [] };
    }

    const distances = new Map<string, number>();
    const previous = new Map<string, { nodeId: string; edge: Edge } | null>();
    const unvisited = new Set<string>();

    for (const nodeId of this.nodes.keys()) {
      distances.set(nodeId, Infinity);
      previous.set(nodeId, null);
      unvisited.add(nodeId);
    }
    distances.set(startId, 0);

    while (unvisited.size > 0) {
      let currentId: string | null = null;
      let minDistance = Infinity;

      for (const nodeId of unvisited) {
        const dist = distances.get(nodeId)!;
        if (dist < minDistance) {
          minDistance = dist;
          currentId = nodeId;
        }
      }

      if (currentId === null || minDistance === Infinity) {
        break;
      }

      if (currentId === targetId) {
        break;
      }

      unvisited.delete(currentId);

      const neighbors = this.edges.get(currentId) || [];
      for (const edge of neighbors) {
        if (!unvisited.has(edge.to)) continue;

        const alt = distances.get(currentId)! + edge.weight;
        if (alt < distances.get(edge.to)!) {
          distances.set(edge.to, alt);
          previous.set(edge.to, { nodeId: currentId, edge });
        }
      }
    }

    if (distances.get(targetId) === Infinity) {
      return null;
    }

    const path: string[] = [];
    const usedEdges: Edge[] = [];
    let curr: string | null = targetId;

    while (curr !== null) {
      path.unshift(curr);
      const prevData = previous.get(curr);
      if (prevData) {
        usedEdges.unshift(prevData.edge);
        curr = prevData.nodeId;
      } else {
        curr = null;
      }
    }

    return { path, distance: distances.get(targetId)!, edges: usedEdges };
  }
}

// Utility: Haversine distance in meters
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth's radius in meters
  const p1 = (lat1 * Math.PI) / 180;
  const p2 = (lat2 * Math.PI) / 180;
  const deltaP = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaP / 2) * Math.sin(deltaP / 2) +
    Math.cos(p1) * Math.cos(p2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

// Seeded real topological road network graph for Balanga City / Bataan CAD
export function createBalangaRoadGraph(): Graph {
  const g = new Graph();

  // Primary road intersection nodes
  const nodes: Node[] = [
    { id: 'station', name: 'Balanga Central Emergency Station', lat: 14.6735, lng: 120.5340 },
    { id: 'capitol', name: 'Provincial Capitol Compound', lat: 14.6742, lng: 120.5332 },
    { id: 'plaza', name: 'Plaza Mayor de Balanga', lat: 14.6780, lng: 120.5390 },
    { id: 'rizal_junc', name: 'Rizal St / Poblacion Junction', lat: 14.6788, lng: 120.5412 },
    { id: 'camacho', name: 'Fiscal Camacho St / Commercial Hub', lat: 14.6755, lng: 120.5372 },
    { id: 'four_lanes', name: 'Enrique Garcia Sr. Ave (Four Lanes)', lat: 14.6762, lng: 120.5458 },
    { id: 'hospital', name: 'Bataan General Hospital (BGHMC)', lat: 14.6852, lng: 120.5485 },
    { id: 'tenejero', name: 'Tenejero Bridge Arterial', lat: 14.6815, lng: 120.5355 },
    { id: 'san_jose', name: 'San Jose Intersection', lat: 14.6710, lng: 120.5375 },
    { id: 'superhighway_n', name: 'Roman Superhighway (North Link)', lat: 14.6890, lng: 120.5510 },
    { id: 'superhighway_s', name: 'Roman Superhighway (South Link)', lat: 14.6655, lng: 120.5310 },
    { id: 'puerto_rivas', name: 'Puerto Rivas Coastal Access', lat: 14.6830, lng: 120.5580 },
    { id: 'bagumbayan', name: 'Bagumbayan Crossroad', lat: 14.6728, lng: 120.5435 },
  ];

  nodes.forEach((n) => g.addNode(n));

  // Connected road corridors with real meter weights
  const addWeighted = (fromId: string, toId: string, streetName: string, trafficMultiplier = 1.0) => {
    const fromNode = g.getNode(fromId);
    const toNode = g.getNode(toId);
    if (!fromNode || !toNode) return;
    const baseDist = calculateDistance(fromNode.lat, fromNode.lng, toNode.lat, toNode.lng);
    g.addUndirectedEdge(fromId, toId, Math.round(baseDist * trafficMultiplier), streetName);
  };

  addWeighted('station', 'capitol', 'Capitol Drive');
  addWeighted('station', 'camacho', 'Zulueta St');
  addWeighted('capitol', 'tenejero', 'Gov. J.J. Linao Rd');
  addWeighted('camacho', 'plaza', 'Bataan Blvd');
  addWeighted('camacho', 'san_jose', 'San Jose Road');
  addWeighted('plaza', 'rizal_junc', 'Rizal Street (Poblacion)');
  addWeighted('plaza', 'tenejero', 'Paterno St');
  addWeighted('rizal_junc', 'four_lanes', 'Naval St Corridor');
  addWeighted('rizal_junc', 'hospital', 'Manahan St to BGHMC');
  addWeighted('four_lanes', 'hospital', 'Four Lanes Ext');
  addWeighted('four_lanes', 'bagumbayan', 'Four Lanes South');
  addWeighted('san_jose', 'bagumbayan', 'Don Manuel St');
  addWeighted('bagumbayan', 'superhighway_s', 'Capitol Sub-link');
  addWeighted('hospital', 'superhighway_n', 'BGHMC Expressway Link');
  addWeighted('four_lanes', 'puerto_rivas', 'Puerto Rivas Road');
  addWeighted('superhighway_n', 'puerto_rivas', 'Coastal Highway Connector');

  return g;
}

// Global cached local road graph
const LOCAL_GRAPH = createBalangaRoadGraph();

/**
 * Solves the shortest path using the local Dijkstra Graph
 */
export function solveLocalDijkstra(
  startLat: number,
  startLng: number,
  targetLat: number,
  targetLng: number
): RouteResult {
  const nodes = LOCAL_GRAPH.getAllNodes();

  // Find nearest graph node to start
  let startNode = nodes[0];
  let minStartDist = Infinity;
  for (const n of nodes) {
    const d = calculateDistance(startLat, startLng, n.lat, n.lng);
    if (d < minStartDist) {
      minStartDist = d;
      startNode = n;
    }
  }

  // Find nearest graph node to target
  let targetNode = nodes[0];
  let minTargetDist = Infinity;
  for (const n of nodes) {
    const d = calculateDistance(targetLat, targetLng, n.lat, n.lng);
    if (d < minTargetDist) {
      minTargetDist = d;
      targetNode = n;
    }
  }

  const solution = LOCAL_GRAPH.findShortestPath(startNode.id, targetNode.id);

  const coordinates: [number, number][] = [[startLat, startLng]];
  const steps: RouteStep[] = [];
  let totalDistanceMeters = Math.round(minStartDist);

  if (solution && solution.path.length > 0) {
    for (let i = 0; i < solution.path.length; i++) {
      const node = LOCAL_GRAPH.getNode(solution.path[i])!;
      coordinates.push([node.lat, node.lng]);

      if (i < solution.edges.length) {
        const edge = solution.edges[i];
        steps.push({
          instruction: `Proceed along ${edge.streetName || 'arterial road'}`,
          distanceMeters: edge.weight,
          durationSeconds: Math.round((edge.weight / 11.11)), // ~40 km/h emergency speed
          streetName: edge.streetName || 'Road corridor'
        });
      }
    }
    totalDistanceMeters += solution.distance + Math.round(minTargetDist);
  }

  coordinates.push([targetLat, targetLng]);

  // Average emergency response vehicle speed: 45 km/h = 12.5 m/s
  const durationSeconds = Math.max(30, Math.round(totalDistanceMeters / 12.5));
  const etaMinutes = Math.max(1, Math.round(durationSeconds / 60));

  return {
    coordinates,
    distanceMeters: totalDistanceMeters,
    distanceKm: parseFloat((totalDistanceMeters / 1000).toFixed(2)),
    durationSeconds,
    etaMinutes,
    algorithm: 'Dijkstra (Local Topology Graph)',
    steps,
    source: 'dijkstra_local'
  };
}

/**
 * Queries OpenStreetMap OSRM driving route with automatic Dijkstra local graph fallback
 */
export async function calculateRealRoute(
  start: [number, number],
  end: [number, number]
): Promise<RouteResult> {
  const [startLat, startLng] = start;
  const [endLat, endLng] = end;

  // Attempt live OSRM network routing
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const url = `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson&steps=true`;

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
        const primaryRoute = data.routes[0];
        
        // Convert GeoJSON [lng, lat] to Leaflet [lat, lng]
        const rawCoords: [number, number][] = primaryRoute.geometry.coordinates.map(
          ([lng, lat]: [number, number]) => [lat, lng] as [number, number]
        );

        const distMeters = Math.round(primaryRoute.distance);
        const distKm = parseFloat((distMeters / 1000).toFixed(2));
        
        // Calculate ETA assuming emergency vehicle with siren (faster than default traffic)
        const durationSeconds = Math.max(45, Math.round(primaryRoute.duration * 0.75));
        const etaMinutes = Math.max(1, Math.ceil(durationSeconds / 60));

        // Parse turn-by-turn steps
        const steps: RouteStep[] = [];
        if (primaryRoute.legs && primaryRoute.legs[0]?.steps) {
          for (const s of primaryRoute.legs[0].steps) {
            if (s.distance > 0) {
              steps.push({
                instruction: s.maneuver?.type === 'depart' 
                  ? `Depart on ${s.name || 'unnamed road'}`
                  : s.maneuver?.type === 'arrive'
                  ? `Arrive at emergency site on ${s.name || 'destination'}`
                  : `${s.maneuver?.modifier ? `${s.maneuver.modifier.toUpperCase()} turn` : 'Continue'} onto ${s.name || 'connecting road'}`,
                distanceMeters: Math.round(s.distance),
                durationSeconds: Math.round(s.duration),
                streetName: s.name || 'Unnamed road'
              });
            }
          }
        }

        return {
          coordinates: rawCoords,
          distanceMeters: distMeters,
          distanceKm: distKm,
          durationSeconds,
          etaMinutes,
          algorithm: 'Dijkstra / OSRM Live Road Graph',
          steps,
          source: 'osrm_network'
        };
      }
    }
  } catch {
    // Network error or timeout: seamlessly drop to local Dijkstra
  }

  // Robust fallback to local Dijkstra road network
  return solveLocalDijkstra(startLat, startLng, endLat, endLng);
}

/**
 * Formats distance into human-readable string
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  return `${(meters / 1000).toFixed(2)} km`;
}

/**
 * Formats ETA into human-readable string
 */
export function formatEta(seconds: number): string {
  if (seconds < 60) {
    return '< 1 min';
  }
  const mins = Math.ceil(seconds / 60);
  return `${mins} min${mins === 1 ? '' : 's'}`;
}

/**
 * Calculates intermediate position along route for live vehicle movement simulation
 */
export function getPositionAlongRoute(
  coordinates: [number, number][],
  progressRatio: number
): [number, number] {
  if (coordinates.length === 0) return [0, 0];
  if (coordinates.length === 1 || progressRatio <= 0) return coordinates[0];
  if (progressRatio >= 1) return coordinates[coordinates.length - 1];

  const totalSegments = coordinates.length - 1;
  const exactIndex = progressRatio * totalSegments;
  const lowerIndex = Math.floor(exactIndex);
  const upperIndex = Math.min(lowerIndex + 1, totalSegments);
  const segmentFraction = exactIndex - lowerIndex;

  const [p1Lat, p1Lng] = coordinates[lowerIndex];
  const [p2Lat, p2Lng] = coordinates[upperIndex];

  return [
    p1Lat + (p2Lat - p1Lat) * segmentFraction,
    p1Lng + (p2Lng - p1Lng) * segmentFraction
  ];
}
